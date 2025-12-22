import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ok, created, forbidden, conflict, notFound, badRequest } from '../utils/responses.js';
import { query } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { logAction } from '../utils/logger.js';

const router = Router();

// Add User to Tenant (tenant_admin only)
router.post('/tenants/:tenantId/users', authMiddleware, async (req, res) => {
  const { tenantId } = req.params;
  const me = req.user;
  if (me.role !== 'tenant_admin' || me.tenantId !== tenantId) return forbidden(res, 'Not authorized');
  const { email, password, fullName, role = 'user' } = req.body || {};
  if (!email || !password || !fullName) return badRequest(res, 'Missing fields');
  if (!['user', 'tenant_admin'].includes(role)) return badRequest(res, 'Invalid role');
  const t = await query('SELECT max_users FROM tenants WHERE id=$1', [tenantId]);
  const c = await query('SELECT COUNT(*)::int AS c FROM users WHERE tenant_id=$1', [tenantId]);
  if (c.rows[0].c >= t.rows[0].max_users) return forbidden(res, 'Subscription limit reached');
  const exist = await query('SELECT 1 FROM users WHERE tenant_id=$1 AND email=$2', [tenantId, email]);
  if (exist.rowCount) return conflict(res, 'Email already exists in this tenant');
  const id = uuidv4();
  const hash = await bcrypt.hash(password, 10);
  await query(
    'INSERT INTO users(id, tenant_id, email, password_hash, full_name, role, is_active) VALUES($1,$2,$3,$4,$5,$6,$7)',
    [id, tenantId, email, hash, fullName, role, true]
  );
  await logAction({ tenantId, userId: me.userId, action: 'CREATE_USER', entityType: 'user', entityId: id });
  return created(res, { id, email, fullName, role, tenantId, isActive: true, createdAt: new Date().toISOString() }, 'User created successfully');
});

// List Tenant Users (must belong to tenant)
router.get('/tenants/:tenantId/users', authMiddleware, async (req, res) => {
  const { tenantId } = req.params;
  const me = req.user;
  if (me.role !== 'super_admin' && me.tenantId !== tenantId) return forbidden(res, 'Unauthorized');
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
  const offset = (page - 1) * limit;
  const role = req.query.role || null;
  const search = (req.query.search || '').toLowerCase();
  const users = await query(
    `SELECT id, email, full_name, role, is_active, created_at FROM users
     WHERE tenant_id=$1
       AND ($2::user_role IS NULL OR role=$2::user_role)
       AND ($3 = '' OR LOWER(full_name) LIKE '%' || $3 || '%' OR LOWER(email) LIKE '%' || $3 || '%')
     ORDER BY created_at DESC LIMIT $4 OFFSET $5`, [tenantId, role, search, limit, offset]
  );
  const count = await query(
    `SELECT COUNT(*)::int AS total FROM users
     WHERE tenant_id=$1
       AND ($2::user_role IS NULL OR role=$2::user_role)
       AND ($3 = '' OR LOWER(full_name) LIKE '%' || $3 || '%' OR LOWER(email) LIKE '%' || $3 || '%')`, [tenantId, role, search]
  );
  return ok(res, {
    users: users.rows.map(u => ({ id: u.id, email: u.email, fullName: u.full_name, role: u.role, isActive: u.is_active, createdAt: u.created_at })),
    total: count.rows[0].total,
    pagination: { currentPage: page, totalPages: Math.ceil(count.rows[0].total / limit), limit }
  });
});

// Update User (tenant_admin OR self)
router.put('/users/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const me = req.user;
  const u = await query('SELECT id, tenant_id FROM users WHERE id=$1', [userId]);
  if (u.rowCount === 0) return notFound(res, 'User not found');
  const targetTenant = u.rows[0].tenant_id;
  if (me.role !== 'super_admin' && me.tenantId !== targetTenant) return forbidden(res, 'Unauthorized');
  const { fullName, role, isActive } = req.body || {};
  if (me.role === 'tenant_admin' || me.role === 'super_admin') {
    await query('UPDATE users SET full_name=COALESCE($1,full_name), role=COALESCE($2,role), is_active=COALESCE($3,is_active), updated_at=NOW() WHERE id=$4',
      [fullName || null, role || null, typeof isActive === 'boolean' ? isActive : null, userId]);
  } else {
    // self can only update fullName
    if (me.userId !== userId) return forbidden(res, 'Unauthorized');
    await query('UPDATE users SET full_name=COALESCE($1,full_name), updated_at=NOW() WHERE id=$2', [fullName || null, userId]);
  }
  await logAction({ tenantId: targetTenant, userId: me.userId, action: 'UPDATE_USER', entityType: 'user', entityId: userId });
  return ok(res, { id: userId, fullName: fullName || undefined, role: role || undefined, updatedAt: new Date().toISOString() }, 'User updated successfully');
});

// Delete User (tenant_admin only, cannot delete self)
router.delete('/users/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const me = req.user;
  const u = await query('SELECT id, tenant_id FROM users WHERE id=$1', [userId]);
  if (u.rowCount === 0) return notFound(res, 'User not found');
  if (me.userId === userId) return forbidden(res, 'Cannot delete yourself');
  const tenantId = u.rows[0].tenant_id;
  if (me.role !== 'tenant_admin' || me.tenantId !== tenantId) return forbidden(res, 'Not authorized');
  await query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to=$1', [userId]);
  await query('DELETE FROM users WHERE id=$1', [userId]);
  await logAction({ tenantId, userId: me.userId, action: 'DELETE_USER', entityType: 'user', entityId: userId });
  return ok(res, null, 'User deleted successfully');
});

export default router;
