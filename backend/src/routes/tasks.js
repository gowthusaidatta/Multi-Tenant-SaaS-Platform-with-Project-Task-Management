import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ok, created, forbidden, notFound, badRequest } from '../utils/responses.js';
import { query } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { logAction } from '../utils/logger.js';
import { isValidPriority, isValidTaskStatus, isValidDate } from '../utils/validation.js';

const router = Router();

// List tasks for current tenant
router.get('/tasks', authMiddleware, async (req, res) => {
  const me = req.user;
  const status = req.query.status || null;
  const priority = req.query.priority || null;
  const assignedTo = req.query.assignedTo || null;
  const search = (req.query.search || '').toLowerCase();
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
  const offset = (page - 1) * limit;

  const tenantId = me.role === 'super_admin' ? req.query.tenantId || null : me.tenantId;
  if (!tenantId && me.role !== 'super_admin') return forbidden(res, 'Unauthorized');

  const tasks = await query(
    `SELECT t.*, u.full_name, u.email, p.name as project_name
     FROM tasks t
     LEFT JOIN users u ON u.id=t.assigned_to
     JOIN projects p ON p.id=t.project_id
     WHERE t.tenant_id=COALESCE($1::uuid, t.tenant_id)
       AND ($2::task_status IS NULL OR t.status=$2::task_status)
       AND ($3::task_priority IS NULL OR t.priority=$3::task_priority)
       AND ($4::uuid IS NULL OR t.assigned_to=$4::uuid)
       AND ($5='' OR LOWER(t.title) LIKE '%'||$5||'%')
     ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.due_date ASC NULLS LAST
     LIMIT $6 OFFSET $7`,
    [tenantId, status, priority, assignedTo, search, limit, offset]
  );

  const count = await query(
    `SELECT COUNT(*)::int AS total FROM tasks t
     WHERE t.tenant_id=COALESCE($1::uuid, t.tenant_id)
       AND ($2::task_status IS NULL OR t.status=$2::task_status)
       AND ($3::task_priority IS NULL OR t.priority=$3::task_priority)
       AND ($4::uuid IS NULL OR t.assigned_to=$4::uuid)
       AND ($5='' OR LOWER(t.title) LIKE '%'||$5||'%')`,
    [tenantId, status, priority, assignedTo, search]
  );

  return ok(res, {
    tasks: tasks.rows.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      projectId: t.project_id,
      projectName: t.project_name,
      assignedTo: t.assigned_to ? { id: t.assigned_to, fullName: t.full_name, email: t.email } : null,
      dueDate: t.due_date,
      createdAt: t.created_at,
    })),
    total: count.rows[0].total,
    pagination: { currentPage: page, totalPages: Math.ceil(count.rows[0].total / limit), limit }
  });
});

// List All Tasks (super_admin only)
router.get('/tasks/all', authMiddleware, async (req, res) => {
  const me = req.user;
  if (me.role !== 'super_admin') return forbidden(res, 'Only super admin can view all tasks');
  
  const status = req.query.status || null;
  const priority = req.query.priority || null;
  const search = (req.query.search || '').toLowerCase();
  const tenantSubdomain = (req.query.tenantSubdomain || '').toLowerCase();
  const projectId = req.query.projectId || null;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
  const offset = (page - 1) * limit;

  let whereClause = `WHERE 1=1`;
  const params = [];

  if (status) {
    params.push(status);
    whereClause += ` AND t.status=$${params.length}::task_status`;
  }

  if (priority) {
    params.push(priority);
    whereClause += ` AND t.priority=$${params.length}::task_priority`;
  }

  if (search) {
    params.push(search);
    whereClause += ` AND ($${params.length}='' OR LOWER(t.title) LIKE '%'||$${params.length}||'%')`;
  }

  if (tenantSubdomain) {
    params.push(tenantSubdomain);
    whereClause += ` AND tn.subdomain=$${params.length}`;
  }

  if (projectId) {
    params.push(projectId);
    whereClause += ` AND t.project_id=$${params.length}`;
  }

  params.push(limit);
  params.push(offset);

  const tasks = await query(
    `SELECT t.*, u.full_name, u.email, p.name as project_name, tn.name as tenant_name, tn.subdomain as tenant_subdomain
     FROM tasks t
     LEFT JOIN users u ON u.id=t.assigned_to
     JOIN projects p ON p.id=t.project_id
     JOIN tenants tn ON tn.id=t.tenant_id
     ${whereClause}
     ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.due_date ASC NULLS LAST
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countParams = params.slice(0, -2);
  const count = await query(
    `SELECT COUNT(*)::int AS total FROM tasks t
     JOIN projects p ON p.id=t.project_id
     JOIN tenants tn ON tn.id=t.tenant_id
     ${whereClause}`,
    countParams
  );

  await logAction({ tenantId: null, userId: me.userId, action: 'LIST_ALL_TASKS', entityType: 'task', entityId: null });

  return ok(res, {
    tasks: tasks.rows.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      projectId: t.project_id,
      projectName: t.project_name,
      tenantId: t.tenant_id,
      tenantName: t.tenant_name,
      tenantSubdomain: t.tenant_subdomain,
      assignedTo: t.assigned_to ? { id: t.assigned_to, fullName: t.full_name, email: t.email } : null,
      dueDate: t.due_date,
      createdAt: t.created_at
    })),
    total: count.rows[0].total,
    pagination: { currentPage: page, totalPages: Math.ceil(count.rows[0].total / limit), limit }
  });
});

// Create Task (tenant from project)
router.post('/projects/:projectId/tasks', authMiddleware, async (req, res) => {
  const me = req.user;
  const { projectId } = req.params;
  const { title, description, assignedTo = null, priority = 'medium', dueDate = null } = req.body || {};
  if (!title) return badRequest(res, 'Title required');
  if (!isValidPriority(priority)) return badRequest(res, 'Invalid priority');
  if (!isValidDate(dueDate)) return badRequest(res, 'Invalid date');
  const p = await query('SELECT tenant_id FROM projects WHERE id=$1', [projectId]);
  if (p.rowCount === 0) return notFound(res, 'Project not found');
  const tenantId = p.rows[0].tenant_id;
  if (me.role !== 'super_admin' && me.tenantId !== tenantId) return forbidden(res, 'Unauthorized');
  if (assignedTo) {
    const u = await query('SELECT 1 FROM users WHERE id=$1 AND tenant_id=$2', [assignedTo, tenantId]);
    if (u.rowCount === 0) return badRequest(res, 'Assigned user invalid');
  }
  const id = uuidv4();
  await query(
    'INSERT INTO tasks(id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, projectId, tenantId, title, description || null, 'todo', priority, assignedTo, dueDate]
  );
  await logAction({ tenantId, userId: me.userId, action: 'CREATE_TASK', entityType: 'task', entityId: id });
  return created(res, { id, projectId, tenantId, title, description, status: 'todo', priority, assignedTo, dueDate, createdAt: new Date().toISOString() });
});

// List Project Tasks
router.get('/projects/:projectId/tasks', authMiddleware, async (req, res) => {
  const me = req.user;
  const { projectId } = req.params;
  const p = await query('SELECT tenant_id FROM projects WHERE id=$1', [projectId]);
  if (p.rowCount === 0) return notFound(res, 'Project not found');
  const tenantId = p.rows[0].tenant_id;
  if (me.role !== 'super_admin' && me.tenantId !== tenantId) return forbidden(res, 'Unauthorized');
  const status = req.query.status || null;
  const assignedTo = req.query.assignedTo || null;
  const priority = req.query.priority || null;
  const search = (req.query.search || '').toLowerCase();
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
  const offset = (page - 1) * limit;
  const tasks = await query(
    `SELECT t.*, u.full_name, u.email FROM tasks t
     LEFT JOIN users u ON u.id=t.assigned_to
     WHERE t.project_id=$1
       AND ($2::task_status IS NULL OR t.status=$2::task_status)
       AND ($3::uuid IS NULL OR t.assigned_to=$3::uuid)
       AND ($4::task_priority IS NULL OR t.priority=$4::task_priority)
       AND ($5='' OR LOWER(t.title) LIKE '%'||$5||'%')
     ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, due_date ASC NULLS LAST
     LIMIT $6 OFFSET $7`, [projectId, status, assignedTo, priority, search, limit, offset]
  );
  const count = await query(
    `SELECT COUNT(*)::int AS total FROM tasks t
     WHERE t.project_id=$1
       AND ($2::task_status IS NULL OR t.status=$2::task_status)
       AND ($3::uuid IS NULL OR t.assigned_to=$3::uuid)
       AND ($4::task_priority IS NULL OR t.priority=$4::task_priority)
       AND ($5='' OR LOWER(t.title) LIKE '%'||$5||'%')`, [projectId, status, assignedTo, priority, search]
  );
  return ok(res, {
    tasks: tasks.rows.map(t => ({
      id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
      assignedTo: t.assigned_to ? { id: t.assigned_to, fullName: t.full_name, email: t.email } : null,
      dueDate: t.due_date, createdAt: t.created_at
    })),
    total: count.rows[0].total,
    pagination: { currentPage: page, totalPages: Math.ceil(count.rows[0].total / limit), limit }
  });
});

// Update Task Status
router.patch('/tasks/:taskId/status', authMiddleware, async (req, res) => {
  const me = req.user;
  const { taskId } = req.params;
  const { status } = req.body || {};
  if (!isValidTaskStatus(status)) return badRequest(res, 'Invalid status');
  const t = await query('SELECT tenant_id FROM tasks WHERE id=$1', [taskId]);
  if (t.rowCount === 0) return notFound(res, 'Task not found');
  const tenantId = t.rows[0].tenant_id;
  if (me.role !== 'super_admin' && me.tenantId !== tenantId) return forbidden(res, 'Unauthorized');
  await query('UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2', [status, taskId]);
  await logAction({ tenantId, userId: me.userId, action: 'UPDATE_TASK_STATUS', entityType: 'task', entityId: taskId });
  return ok(res, { id: taskId, status, updatedAt: new Date().toISOString() });
});

// Update Task (full)
router.put('/tasks/:taskId', authMiddleware, async (req, res) => {
  const me = req.user;
  const { taskId } = req.params;
  const { title, description, status, priority, assignedTo = undefined, dueDate = undefined } = req.body || {};
  if (status && !isValidTaskStatus(status)) return badRequest(res, 'Invalid status');
  if (priority && !isValidPriority(priority)) return badRequest(res, 'Invalid priority');
  if (dueDate !== undefined && !isValidDate(dueDate)) return badRequest(res, 'Invalid date');
  const t = await query('SELECT tenant_id FROM tasks WHERE id=$1', [taskId]);
  if (t.rowCount === 0) return notFound(res, 'Task not found');
  const tenantId = t.rows[0].tenant_id;
  if (me.role !== 'super_admin' && me.tenantId !== tenantId) return forbidden(res, 'Unauthorized');
  if (assignedTo !== undefined && assignedTo !== null) {
    const u = await query('SELECT 1 FROM users WHERE id=$1 AND tenant_id=$2', [assignedTo, tenantId]);
    if (u.rowCount === 0) return badRequest(res, 'Assigned user invalid');
  }
  const assignedProvided = assignedTo !== undefined;
  const dueProvided = dueDate !== undefined;

  await query(
    `UPDATE tasks
     SET title=COALESCE($1,title),
         description=COALESCE($2,description),
         status=COALESCE($3,status),
         priority=COALESCE($4,priority),
         assigned_to = CASE WHEN $5 THEN $6 ELSE assigned_to END,
         due_date = CASE WHEN $7 THEN $8 ELSE due_date END,
         updated_at=NOW()
     WHERE id=$9`,
    [title || null, description || null, status || null, priority || null, assignedProvided, assignedTo === undefined ? null : assignedTo, dueProvided, dueDate === undefined ? null : dueDate, taskId]
  );
  await logAction({ tenantId, userId: me.userId, action: 'UPDATE_TASK', entityType: 'task', entityId: taskId });
  // return refreshed task
  const r = await query('SELECT t.*, u.full_name, u.email FROM tasks t LEFT JOIN users u ON u.id=t.assigned_to WHERE t.id=$1', [taskId]);
  const task = r.rows[0];
  return ok(res, {
    id: task.id, title: task.title, description: task.description, status: task.status, priority: task.priority,
    assignedTo: task.assigned_to ? { id: task.assigned_to, fullName: task.full_name, email: task.email } : null,
    dueDate: task.due_date, updatedAt: task.updated_at
  }, 'Task updated successfully');
});

// Delete Task (used by frontend flows)
router.delete('/tasks/:taskId', authMiddleware, async (req, res) => {
  const me = req.user;
  const { taskId } = req.params;
  const t = await query('SELECT tenant_id FROM tasks WHERE id=$1', [taskId]);
  if (t.rowCount === 0) return notFound(res, 'Task not found');
  const tenantId = t.rows[0].tenant_id;
  if (me.role !== 'super_admin' && me.tenantId !== tenantId) return forbidden(res, 'Unauthorized');
  await query('DELETE FROM tasks WHERE id=$1', [taskId]);
  await logAction({ tenantId, userId: me.userId, action: 'DELETE_TASK', entityType: 'task', entityId: taskId });
  return ok(res, null, 'Task deleted');
});

export default router;
