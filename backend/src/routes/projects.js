import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ok, created, forbidden, notFound, badRequest } from '../utils/responses.js';
import { query } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { logAction } from '../utils/logger.js';

const router = Router();

// Create Project
router.post('/projects', authMiddleware, async (req, res) => {
  const me = req.user; // tenantId, userId
  const { name, description, status = 'active' } = req.body || {};
  if (!name) return badRequest(res, 'Name required');
  const t = await query('SELECT max_projects FROM tenants WHERE id=$1', [me.tenantId]);
  const c = await query('SELECT COUNT(*)::int AS c FROM projects WHERE tenant_id=$1', [me.tenantId]);
  if (c.rows[0].c >= t.rows[0].max_projects) return forbidden(res, 'Project limit reached');
  const id = uuidv4();
  await query('INSERT INTO projects(id, tenant_id, name, description, status, created_by) VALUES($1,$2,$3,$4,$5,$6)',
    [id, me.tenantId, name, description || null, status, me.userId]);
  await logAction({ tenantId: me.tenantId, userId: me.userId, action: 'CREATE_PROJECT', entityType: 'project', entityId: id });
  return created(res, { id, tenantId: me.tenantId, name, description, status, createdBy: me.userId, createdAt: new Date().toISOString() });
});

// List All Projects (super_admin only)
router.get('/projects/all', authMiddleware, async (req, res) => {
  const me = req.user;
  if (me.role !== 'super_admin') return forbidden(res, 'Only super admin can view all projects');
  
  const status = req.query.status || null;
  const search = (req.query.search || '').toLowerCase();
  const tenantSubdomain = (req.query.tenantSubdomain || '').toLowerCase();
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  let whereClause = `WHERE 1=1`;
  const params = [];

  if (status) {
    params.push(status);
    whereClause += ` AND p.status=$${params.length}::project_status`;
  }

  if (search) {
    params.push(search);
    whereClause += ` AND ($${params.length}='' OR LOWER(p.name) LIKE '%'||$${params.length}||'%')`;
  }

  if (tenantSubdomain) {
    params.push(tenantSubdomain);
    whereClause += ` AND t.subdomain=$${params.length}`;
  }

  params.push(limit);
  params.push(offset);

  const projects = await query(
    `SELECT p.*, u.full_name as creator_name, t.name as tenant_name, t.subdomain as tenant_subdomain
     FROM projects p
     JOIN users u ON u.id=p.created_by
     JOIN tenants t ON t.id=p.tenant_id
     ${whereClause}
     ORDER BY p.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countParams = params.slice(0, -2);
  const count = await query(
    `SELECT COUNT(*)::int AS total FROM projects p
     JOIN tenants t ON t.id=p.tenant_id
     ${whereClause}`,
    countParams
  );

  const result = await Promise.all(projects.rows.map(async p => {
    const t = await query('SELECT COUNT(*)::int AS total, SUM(CASE WHEN status=\'completed\' THEN 1 ELSE 0 END)::int AS completed FROM tasks WHERE project_id=$1', [p.id]);
    return {
      id: p.id, 
      name: p.name, 
      description: p.description, 
      status: p.status,
      tenantId: p.tenant_id,
      tenantName: p.tenant_name,
      tenantSubdomain: p.tenant_subdomain,
      createdBy: { id: p.created_by, fullName: p.creator_name },
      taskCount: t.rows[0].total || 0, 
      completedTaskCount: t.rows[0].completed || 0,
      createdAt: p.created_at
    };
  }));

  await logAction({ tenantId: null, userId: me.userId, action: 'LIST_ALL_PROJECTS', entityType: 'project', entityId: null });

  return ok(res, { 
    projects: result, 
    total: count.rows[0].total, 
    pagination: { currentPage: page, totalPages: Math.ceil(count.rows[0].total / limit), limit } 
  });
});

// List Projects
router.get('/projects', authMiddleware, async (req, res) => {
  const me = req.user;
  const status = req.query.status || null;
  const search = (req.query.search || '').toLowerCase();
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;
  const projects = await query(
    `SELECT p.*, u.full_name as creator_name FROM projects p
     JOIN users u ON u.id=p.created_by
     WHERE p.tenant_id=$1
       AND ($2::project_status IS NULL OR p.status=$2::project_status)
       AND ($3='' OR LOWER(p.name) LIKE '%'||$3||'%')
     ORDER BY p.created_at DESC LIMIT $4 OFFSET $5`, [me.tenantId, status, search, limit, offset]
  );
  const count = await query(
    `SELECT COUNT(*)::int AS total FROM projects p
     WHERE p.tenant_id=$1
       AND ($2::project_status IS NULL OR p.status=$2::project_status)
       AND ($3='' OR LOWER(p.name) LIKE '%'||$3||'%')`, [me.tenantId, status, search]
  );
  const result = await Promise.all(projects.rows.map(async p => {
    const t = await query('SELECT COUNT(*)::int AS total, SUM(CASE WHEN status=\'completed\' THEN 1 ELSE 0 END)::int AS completed FROM tasks WHERE project_id=$1', [p.id]);
    return {
      id: p.id, name: p.name, description: p.description, status: p.status,
      createdBy: { id: p.created_by, fullName: p.creator_name },
      taskCount: t.rows[0].total || 0, completedTaskCount: t.rows[0].completed || 0,
      createdAt: p.created_at
    };
  }));
  return ok(res, { projects: result, total: count.rows[0].total, pagination: { currentPage: page, totalPages: Math.ceil(count.rows[0].total / limit), limit } });
});

// Update Project
router.put('/projects/:projectId', authMiddleware, async (req, res) => {
  const me = req.user;
  const { projectId } = req.params;
  const p = await query('SELECT * FROM projects WHERE id=$1', [projectId]);
  if (p.rowCount === 0) return notFound(res, 'Project not found');
  const project = p.rows[0];
  if (project.tenant_id !== me.tenantId) return forbidden(res, 'Not authorized');
  if (!(me.role === 'tenant_admin' || project.created_by === me.userId)) return forbidden(res, 'Not authorized');
  const { name, description, status } = req.body || {};
  await query('UPDATE projects SET name=COALESCE($1,name), description=COALESCE($2,description), status=COALESCE($3,status), updated_at=NOW() WHERE id=$4',
    [name || null, description || null, status || null, projectId]);
  await logAction({ tenantId: me.tenantId, userId: me.userId, action: 'UPDATE_PROJECT', entityType: 'project', entityId: projectId });
  return ok(res, { id: projectId, name, description, status, updatedAt: new Date().toISOString() }, 'Project updated successfully');
});

// Delete Project
router.delete('/projects/:projectId', authMiddleware, async (req, res) => {
  const me = req.user;
  const { projectId } = req.params;
  const p = await query('SELECT * FROM projects WHERE id=$1', [projectId]);
  if (p.rowCount === 0) return notFound(res, 'Project not found');
  const project = p.rows[0];
  if (project.tenant_id !== me.tenantId) return forbidden(res, 'Not authorized');
  if (!(me.role === 'tenant_admin' || project.created_by === me.userId)) return forbidden(res, 'Not authorized');
  await query('DELETE FROM projects WHERE id=$1', [projectId]);
  await logAction({ tenantId: me.tenantId, userId: me.userId, action: 'DELETE_PROJECT', entityType: 'project', entityId: projectId });
  return ok(res, null, 'Project deleted successfully');
});

export default router;
