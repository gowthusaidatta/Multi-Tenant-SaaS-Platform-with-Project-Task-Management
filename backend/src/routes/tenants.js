import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ok, notFound, forbidden, badRequest, created, conflict } from '../utils/responses.js';
import { query } from '../db.js';
import { logAction } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { config, PLAN_LIMITS } from '../config.js';
import { isValidSubdomain } from '../utils/validation.js';

const router = Router();

// Get Tenant Details
router.get('/:tenantId', authMiddleware, async (req, res) => {
  const { tenantId } = req.params;
  const me = req.user;
  if (me.role !== 'super_admin' && me.tenantId !== tenantId) return forbidden(res, 'Unauthorized access');
  const t = await query('SELECT * FROM tenants WHERE id=$1', [tenantId]);
  if (t.rowCount === 0) return notFound(res, 'Tenant not found');
  const statsRes = await query(
    `SELECT 
      (SELECT COUNT(*)::int FROM users WHERE tenant_id=$1) AS total_users,
      (SELECT COUNT(*)::int FROM projects WHERE tenant_id=$1) AS total_projects,
      (SELECT COUNT(*)::int FROM tasks WHERE tenant_id=$1) AS total_tasks`,
    [tenantId]
  );
  const tenant = t.rows[0];
  return ok(res, {
    id: tenant.id, name: tenant.name, subdomain: tenant.subdomain, status: tenant.status,
    subscriptionPlan: tenant.subscription_plan, maxUsers: tenant.max_users, maxProjects: tenant.max_projects,
    createdAt: tenant.created_at,
    stats: {
      totalUsers: statsRes.rows[0].total_users,
      totalProjects: statsRes.rows[0].total_projects,
      totalTasks: statsRes.rows[0].total_tasks,
    }
  });
});

// Update Tenant
router.put('/:tenantId', authMiddleware, async (req, res) => {
  const { tenantId } = req.params;
  const me = req.user;
  const updates = req.body || {};
  if (me.role !== 'super_admin' && me.tenantId !== tenantId) return forbidden(res, 'Unauthorized access');
  if (me.role !== 'super_admin') {
    // tenant_admin can only update name
    const allowed = { name: updates.name };
    await query('UPDATE tenants SET name=COALESCE($1,name), updated_at=NOW() WHERE id=$2', [allowed.name || null, tenantId]);
    await logAction({ tenantId, userId: me.userId, action: 'UPDATE_TENANT', entityType: 'tenant', entityId: tenantId });
    return ok(res, { id: tenantId, name: allowed.name, updatedAt: new Date().toISOString() }, 'Tenant updated successfully');
  }
  // super_admin full update
  const { name, status, subscriptionPlan, maxUsers, maxProjects } = updates;
  await query(
    'UPDATE tenants SET name=COALESCE($1,name), status=COALESCE($2,status), subscription_plan=COALESCE($3,subscription_plan), max_users=COALESCE($4,max_users), max_projects=COALESCE($5,max_projects), updated_at=NOW() WHERE id=$6',
    [name || null, status || null, subscriptionPlan || null, maxUsers || null, maxProjects || null, tenantId]
  );
  await logAction({ tenantId, userId: me.userId, action: 'UPDATE_TENANT', entityType: 'tenant', entityId: tenantId });
  return ok(res, { id: tenantId, name: name, updatedAt: new Date().toISOString() }, 'Tenant updated successfully');
});

// List All Tenants (super_admin only)
router.get('/', authMiddleware, async (req, res) => {
  const me = req.user;
  if (me.role !== 'super_admin') return forbidden(res, 'Not super_admin');
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
  const offset = (page - 1) * limit;
  const status = req.query.status || null;
  const plan = req.query.subscriptionPlan || null;
  const tenants = await query(
    `SELECT * FROM tenants
     WHERE ($1::tenant_status IS NULL OR status=$1::tenant_status)
       AND ($2::subscription_plan IS NULL OR subscription_plan=$2::subscription_plan)
     ORDER BY created_at DESC
     LIMIT $3 OFFSET $4`, [status, plan, limit, offset]
  );
  const count = await query(
    `SELECT COUNT(*)::int AS total FROM tenants
     WHERE ($1::tenant_status IS NULL OR status=$1::tenant_status)
       AND ($2::subscription_plan IS NULL OR subscription_plan=$2::subscription_plan)`, [status, plan]
  );
  const enriched = await Promise.all(tenants.rows.map(async (t) => {
    const s = await query(
      `SELECT 
        (SELECT COUNT(*)::int FROM users WHERE tenant_id=$1) AS total_users,
        (SELECT COUNT(*)::int FROM projects WHERE tenant_id=$1) AS total_projects`, [t.id]
    );
    return {
      id: t.id, name: t.name, subdomain: t.subdomain, status: t.status,
      subscriptionPlan: t.subscription_plan, totalUsers: s.rows[0].total_users,
      totalProjects: s.rows[0].total_projects, createdAt: t.created_at,
    };
  }));
  return ok(res, {
    tenants: enriched,
    pagination: { currentPage: page, totalPages: Math.ceil(count.rows[0].total / limit), totalTenants: count.rows[0].total, limit }
  });
});

export default router;

// Create Tenant (super_admin only)
router.post('/', authMiddleware, async (req, res) => {
  const me = req.user;
  if (me.role !== 'super_admin') return forbidden(res, 'Not super_admin');
  const { name, subdomain, subscriptionPlan = 'free', status = 'active', maxUsers = undefined, maxProjects = undefined } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) return badRequest(res, 'Name required');
  if (!subdomain || !isValidSubdomain(String(subdomain).toLowerCase())) return badRequest(res, 'Invalid subdomain');
  const exist = await query('SELECT 1 FROM tenants WHERE subdomain=$1', [String(subdomain).toLowerCase()]);
  if (exist.rowCount) return conflict(res, 'Subdomain already exists');
  const id = uuidv4();
  const limits = PLAN_LIMITS[subscriptionPlan] || PLAN_LIMITS['free'];
  const finalMaxUsers = typeof maxUsers === 'number' ? maxUsers : limits.max_users;
  const finalMaxProjects = typeof maxProjects === 'number' ? maxProjects : limits.max_projects;
  await query(
    'INSERT INTO tenants(id, name, subdomain, status, subscription_plan, max_users, max_projects) VALUES($1,$2,$3,$4,$5,$6,$7)',
    [id, name, String(subdomain).toLowerCase(), status, subscriptionPlan, finalMaxUsers, finalMaxProjects]
  );
  await logAction({ tenantId: id, userId: me.userId, action: 'CREATE_TENANT', entityType: 'tenant', entityId: id });
  return created(res, { id, name, subdomain: String(subdomain).toLowerCase(), status, subscriptionPlan, maxUsers: finalMaxUsers, maxProjects: finalMaxProjects }, 'Tenant created');
});
