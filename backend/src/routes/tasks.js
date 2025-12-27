import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ok, created, forbidden, notFound, badRequest } from '../utils/responses.js';
import { query } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { logAction } from '../utils/logger.js';

const router = Router();

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
    `SELECT t.*, p.name as project_name, tn.name as tenant_name, tn.subdomain as tenant_subdomain,
            COALESCE(
              (
                SELECT json_agg(json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email))
                FROM task_assignees ta LEFT JOIN users u ON u.id = ta.user_id
                WHERE ta.task_id = t.id
              ), '[]'::json
            ) AS assignees
     FROM tasks t
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
      assignedTo: (t.assignees && t.assignees.length > 0) ? t.assignees[0] : null,
      assignees: t.assignees || [],
      dueDate: t.due_date,
      createdAt: t.created_at
    })),
    total: count.rows[0].total,
    pagination: { currentPage: page, totalPages: Math.ceil(count.rows[0].total / limit), limit }
  });
});

// List Tasks for current tenant (tenant_admin only; super_admin can filter by tenant)
router.get('/tasks/tenant', authMiddleware, async (req, res) => {
  const me = req.user;
  let tenantId = me.tenantId;
  if (me.role === 'super_admin') {
    // Optional filter by tenant subdomain
    const subdomain = (req.query.tenantSubdomain || '').toLowerCase();
    if (subdomain) {
      const r = await query('SELECT id FROM tenants WHERE LOWER(subdomain)=LOWER($1)', [subdomain]);
      if (r.rowCount === 0) return notFound(res, 'Tenant not found');
      tenantId = r.rows[0].id;
    } else {
      return badRequest(res, 'tenantSubdomain required for super admin');
    }
  }
  if (me.role !== 'tenant_admin' && me.role !== 'super_admin') return forbidden(res, 'Unauthorized');

  const status = req.query.status || null;
  const priority = req.query.priority || null;
  const search = (req.query.search || '').toLowerCase();
  const projectId = req.query.projectId || null;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
  const offset = (page - 1) * limit;

  const tasks = await query(
    `SELECT t.*, p.name as project_name,
            COALESCE(
              (
                SELECT json_agg(json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email))
                FROM task_assignees ta LEFT JOIN users u ON u.id = ta.user_id
                WHERE ta.task_id = t.id
              ), '[]'::json
            ) AS assignees
     FROM tasks t
     JOIN projects p ON p.id=t.project_id
     WHERE t.tenant_id=$1
       AND ($2::task_status IS NULL OR t.status=$2::task_status)
       AND ($3::task_priority IS NULL OR t.priority=$3::task_priority)
       AND ($4::uuid IS NULL OR t.project_id=$4::uuid)
       AND ($5='' OR LOWER(t.title) LIKE '%'||$5||'%')
     ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.due_date ASC NULLS LAST
     LIMIT $6 OFFSET $7`,
    [tenantId, status, priority, projectId, search, limit, offset]
  );
  const count = await query(
    `SELECT COUNT(*)::int AS total FROM tasks t
     WHERE t.tenant_id=$1
       AND ($2::task_status IS NULL OR t.status=$2::task_status)
       AND ($3::task_priority IS NULL OR t.priority=$3::task_priority)
       AND ($4::uuid IS NULL OR t.project_id=$4::uuid)
       AND ($5='' OR LOWER(t.title) LIKE '%'||$5||'%')`,
    [tenantId, status, priority, projectId, search]
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
      assignedTo: (t.assignees && t.assignees.length > 0) ? t.assignees[0] : null,
      assignees: t.assignees || [],
      dueDate: t.due_date,
      createdAt: t.created_at
    })),
    total: count.rows[0].total,
    pagination: { currentPage: page, totalPages: Math.ceil(count.rows[0].total / limit), limit }
  });
});

// List tasks assigned to current user (user can only view own/assigned)
router.get('/tasks/my', authMiddleware, async (req, res) => {
  const me = req.user;
  if (!me.tenantId) return forbidden(res, 'Unauthorized');
  const status = req.query.status || null;
  const priority = req.query.priority || null;
  const search = (req.query.search || '').toLowerCase();
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
  const offset = (page - 1) * limit;
  const tasks = await query(
    `SELECT t.*, p.name as project_name,
            COALESCE(
              (
                SELECT json_agg(json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email))
                FROM task_assignees ta LEFT JOIN users u ON u.id = ta.user_id
                WHERE ta.task_id = t.id
              ), '[]'::json
            ) AS assignees
     FROM tasks t
     JOIN projects p ON p.id=t.project_id
     WHERE t.tenant_id=$1 AND EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id=t.id AND ta.user_id=$2)
       AND ($3::task_status IS NULL OR t.status=$3::task_status)
       AND ($4::task_priority IS NULL OR t.priority=$4::task_priority)
       AND ($5='' OR LOWER(t.title) LIKE '%'||$5||'%')
     ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.due_date ASC NULLS LAST
     LIMIT $6 OFFSET $7`,
    [me.tenantId, me.userId, status, priority, search, limit, offset]
  );
  const count = await query(
    `SELECT COUNT(*)::int AS total FROM tasks t
     WHERE t.tenant_id=$1 AND t.assigned_to=$2
       AND ($3::task_status IS NULL OR t.status=$3::task_status)
       AND ($4::task_priority IS NULL OR t.priority=$4::task_priority)
       AND ($5='' OR LOWER(t.title) LIKE '%'||$5||'%')`,
    [me.tenantId, me.userId, status, priority, search]
  );
  return ok(res, {
    tasks: tasks.rows.map(t => ({
      id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
      projectId: t.project_id, projectName: t.project_name,
      assignedTo: (t.assignees && t.assignees.length > 0) ? t.assignees[0] : null,
      assignees: t.assignees || [],
      dueDate: t.due_date, createdAt: t.created_at
    })),
    total: count.rows[0].total,
    pagination: { currentPage: page, totalPages: Math.ceil(count.rows[0].total / limit), limit }
  });
});

// Create Task (tenant from project)
router.post('/projects/:projectId/tasks', authMiddleware, async (req, res) => {
  const me = req.user;
  const { projectId } = req.params;
  let { title, description, assignedTo = null, priority = 'medium', dueDate = null } = req.body || {};
  if (!title) return badRequest(res, 'Title required');
  const p = await query('SELECT tenant_id FROM projects WHERE id=$1', [projectId]);
  if (p.rowCount === 0) return notFound(res, 'Project not found');
  const tenantId = p.rows[0].tenant_id;
  if (me.role !== 'super_admin' && me.tenantId !== tenantId) return forbidden(res, 'Unauthorized');
  // Normalize assignedTo to an array
  let assignedIds = [];
  if (Array.isArray(assignedTo)) assignedIds = assignedTo.filter(Boolean);
  else if (assignedTo) assignedIds = [assignedTo];

  if (assignedIds.length > 0) {
    const valid = await query('SELECT id FROM users WHERE tenant_id=$1 AND id = ANY($2::uuid[])', [tenantId, assignedIds]);
    if (valid.rowCount !== assignedIds.length) return badRequest(res, 'One or more assignees invalid');
  }
  const id = uuidv4();
  await query(
    'INSERT INTO tasks(id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, projectId, tenantId, title, description || null, 'todo', priority, assignedIds[0] || null, dueDate]
  );
  // Insert assignees
  if (assignedIds.length > 0) {
    for (const uid of assignedIds) {
      await query('INSERT INTO task_assignees(task_id, user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [id, uid]);
    }
  }
  await logAction({ tenantId, userId: me.userId, action: 'CREATE_TASK', entityType: 'task', entityId: id });
  const assignees = assignedIds.length > 0 ? (await query('SELECT id, full_name, email FROM users WHERE id = ANY($1::uuid[])', [assignedIds])).rows : [];
  return created(res, { id, projectId, tenantId, title, description, status: 'todo', priority, assignedTo: assignees[0] || null, assignees, dueDate, createdAt: new Date().toISOString() });
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
    `SELECT t.*,
            COALESCE(
              (
                SELECT json_agg(json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email))
                FROM task_assignees ta LEFT JOIN users u ON u.id = ta.user_id
                WHERE ta.task_id = t.id
              ), '[]'::json
            ) AS assignees
     FROM tasks t
     WHERE t.project_id=$1
       AND ($2::task_status IS NULL OR t.status=$2::task_status)
       AND ($3::uuid IS NULL OR EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id=t.id AND ta.user_id=$3::uuid))
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
      assignedTo: (t.assignees && t.assignees.length > 0) ? t.assignees[0] : null,
      assignees: t.assignees || [],
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
  const t = await query('SELECT tenant_id FROM tasks WHERE id=$1', [taskId]);
  if (t.rowCount === 0) return notFound(res, 'Task not found');
  const tenantId = t.rows[0].tenant_id;
  if (me.role !== 'super_admin' && me.tenantId !== tenantId) return forbidden(res, 'Unauthorized');
  // Users can only change status of their own/assigned tasks
  if (me.role === 'user') {
    const assigned = await query('SELECT 1 FROM task_assignees WHERE task_id=$1 AND user_id=$2', [taskId, me.userId]);
    if (assigned.rowCount === 0) return forbidden(res, 'You can only change status of assigned tasks');
  }
  await query('UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2', [status, taskId]);
  await logAction({ tenantId, userId: me.userId, action: 'UPDATE_TASK_STATUS', entityType: 'task', entityId: taskId });
  return ok(res, { id: taskId, status, updatedAt: new Date().toISOString() });
});

// Update Task (full)
router.put('/tasks/:taskId', authMiddleware, async (req, res) => {
  const me = req.user;
  const { taskId } = req.params;
  let { title, description, status, priority, assignedTo = undefined, dueDate = undefined } = req.body || {};
  const t = await query('SELECT tenant_id FROM tasks WHERE id=$1', [taskId]);
  if (t.rowCount === 0) return notFound(res, 'Task not found');
  const tenantId = t.rows[0].tenant_id;
  if (me.role !== 'super_admin' && me.tenantId !== tenantId) return forbidden(res, 'Unauthorized');

  // Users can only edit their own/assigned tasks and cannot reassign
  if (me.role === 'user') {
    const assigned = await query('SELECT 1 FROM task_assignees WHERE task_id=$1 AND user_id=$2', [taskId, me.userId]);
    if (assigned.rowCount === 0) return forbidden(res, 'You can only edit assigned tasks');
    if (assignedTo !== undefined) return forbidden(res, 'You cannot reassign tasks');
  }

  // Reassignment allowed only for super_admin or tenant_admin
  if (assignedTo !== undefined && me.role !== 'super_admin' && me.role !== 'tenant_admin') {
    return forbidden(res, 'Only admins can reassign tasks');
  }

  // Normalize assignedTo to array for multi-assign
  let assignedIds = undefined;
  if (assignedTo !== undefined) {
    if (Array.isArray(assignedTo)) assignedIds = assignedTo.filter(Boolean);
    else if (assignedTo) assignedIds = [assignedTo];
    else assignedIds = [];
    if (assignedIds.length > 0) {
      const valid = await query('SELECT id FROM users WHERE tenant_id=$1 AND id = ANY($2::uuid[])', [tenantId, assignedIds]);
      if (valid.rowCount !== assignedIds.length) return badRequest(res, 'One or more assignees invalid');
    }
  }

  await query(
    'UPDATE tasks SET title=COALESCE($1,title), description=COALESCE($2,description), status=COALESCE($3,status), priority=COALESCE($4,priority), assigned_to=$5, due_date=$6, updated_at=NOW() WHERE id=$7',
    [title || null, description || null, status || null, priority || null, assignedIds === undefined ? undefined : (assignedIds[0] || null), dueDate === undefined ? undefined : dueDate, taskId]
  );
  // Replace assignees if provided
  if (assignedIds !== undefined) {
    await query('DELETE FROM task_assignees WHERE task_id=$1', [taskId]);
    for (const uid of assignedIds) {
      await query('INSERT INTO task_assignees(task_id, user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [taskId, uid]);
    }
  }
  await logAction({ tenantId, userId: me.userId, action: 'UPDATE_TASK', entityType: 'task', entityId: taskId });
  const r = await query(
    `SELECT t.*,
            COALESCE((SELECT json_agg(json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email))
                      FROM task_assignees ta LEFT JOIN users u ON u.id=ta.user_id WHERE ta.task_id=t.id), '[]'::json) AS assignees
     FROM tasks t WHERE t.id=$1`, [taskId]
  );
  const task = r.rows[0];
  return ok(
    res,
    {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: (task.assignees && task.assignees.length > 0) ? task.assignees[0] : null,
      assignees: task.assignees || [],
      dueDate: task.due_date,
      updatedAt: task.updated_at
    },
    'Task updated successfully'
  );
});

// Delete Task (used by frontend flows)
router.delete('/tasks/:taskId', authMiddleware, async (req, res) => {
  const me = req.user;
  const { taskId } = req.params;
  const t = await query('SELECT tenant_id FROM tasks WHERE id=$1', [taskId]);
  if (t.rowCount === 0) return notFound(res, 'Task not found');
  const tenantId = t.rows[0].tenant_id;
  // Only super_admin or tenant_admin within tenant can delete
  if (me.role === 'super_admin') {
    // allow
  } else if (me.role === 'tenant_admin' && me.tenantId === tenantId) {
    // allow
  } else {
    return forbidden(res, 'Only admins can delete tasks');
  }
  await query('DELETE FROM tasks WHERE id=$1', [taskId]);
  await logAction({ tenantId, userId: me.userId, action: 'DELETE_TASK', entityType: 'task', entityId: taskId });
  return ok(res, null, 'Task deleted');
});

export default router;
