import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config, PLAN_LIMITS } from '../config.js';
import { getClient, query } from '../db.js';
import { ok, created, badRequest, conflict, unauthorized, forbidden, notFound } from '../utils/responses.js';
import { logAction } from '../utils/logger.js';

const router = Router();

function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function isValidSubdomain(s) {
  if (!s) return false;
  if (s.length < 3 || s.length > 63) return false;
  const re = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return re.test(s);
}

// POST /api/auth/register-tenant
router.post('/register-tenant', async (req, res) => {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body || {};
  if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
    return badRequest(res, 'Validation error');
  }
  if (!isValidSubdomain(String(subdomain).toLowerCase())) return badRequest(res, 'Invalid subdomain');

  const client = await getClient();
  try {
    await client.query('BEGIN');
    // ensure unique subdomain
    const sub = await client.query('SELECT 1 FROM tenants WHERE subdomain=$1', [subdomain.toLowerCase()]);
    if (sub.rowCount) {
      await client.query('ROLLBACK');
      return conflict(res, 'Subdomain already exists');
    }
    const tenantId = uuidv4();
    const limits = PLAN_LIMITS['free'];
    await client.query(
      'INSERT INTO tenants(id, name, subdomain, status, subscription_plan, max_users, max_projects) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [tenantId, tenantName, subdomain.toLowerCase(), 'active', 'free', limits.max_users, limits.max_projects]
    );
    // ensure unique email per tenant
    const ue = await client.query('SELECT 1 FROM users WHERE tenant_id=$1 AND email=$2', [tenantId, adminEmail.toLowerCase()]);
    if (ue.rowCount) {
      await client.query('ROLLBACK');
      return conflict(res, 'Email already exists in this tenant');
    }
    const adminId = uuidv4();
    const hash = await bcrypt.hash(adminPassword, 10);
    await client.query(
      'INSERT INTO users(id, tenant_id, email, password_hash, full_name, role, is_active) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [adminId, tenantId, adminEmail.toLowerCase(), hash, adminFullName, 'tenant_admin', true]
    );
    await client.query('COMMIT');
    await logAction({ tenantId, userId: adminId, action: 'REGISTER_TENANT', entityType: 'tenant', entityId: tenantId });
    return created(res, {
      tenantId,
      subdomain: subdomain.toLowerCase(),
      adminUser: { id: adminId, email: adminEmail.toLowerCase(), fullName: adminFullName, role: 'tenant_admin' }
    }, 'Tenant registered successfully');
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    return badRequest(res, 'Registration failed');
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, tenantSubdomain = null, tenantId = null } = req.body || {};
  if (!email || !password) return badRequest(res, 'Validation error');

  // Super admin path: no tenant required
  const superCandidate = await query('SELECT id, tenant_id, password_hash, full_name, role, is_active FROM users WHERE LOWER(email)=LOWER($1) AND tenant_id IS NULL', [email]);
  if (superCandidate.rowCount) {
    const u = superCandidate.rows[0];
    if (u.role !== 'super_admin') return unauthorized(res, 'Invalid credentials');
    const okPw = await bcrypt.compare(password, u.password_hash);
    if (!okPw) return unauthorized(res, 'Invalid credentials');
    if (u.is_active === false) return forbidden(res, 'Account inactive');
    const token = signToken({ userId: u.id, tenantId: null, role: 'super_admin' });
    await logAction({ tenantId: null, userId: u.id, action: 'LOGIN', entityType: 'user', entityId: u.id });
    return ok(res, {
      user: { id: u.id, email: email.toLowerCase(), fullName: u.full_name, role: 'super_admin', tenantId: null },
      token, expiresIn: 24 * 60 * 60
    });
  }

  // Tenant user path
  // Resolve tenant by subdomain or id
  let tenant = null;
  if (tenantId) {
    const t = await query('SELECT * FROM tenants WHERE id=$1', [tenantId]);
    if (!t.rowCount) return notFound(res, 'Tenant not found');
    tenant = t.rows[0];
  } else if (tenantSubdomain) {
    const t = await query('SELECT * FROM tenants WHERE subdomain=$1', [String(tenantSubdomain).toLowerCase()]);
    if (!t.rowCount) return notFound(res, 'Tenant not found');
    tenant = t.rows[0];
  } else {
    return badRequest(res, 'tenantSubdomain or tenantId required');
  }
  if (tenant.status !== 'active') return forbidden(res, 'Account suspended/inactive');

  const ures = await query('SELECT id, tenant_id, password_hash, full_name, role, is_active FROM users WHERE LOWER(email)=LOWER($1) AND tenant_id=$2', [email, tenant.id]);
  if (ures.rowCount === 0) return unauthorized(res, 'Invalid credentials');
  const u = ures.rows[0];
  const okPw = await bcrypt.compare(password, u.password_hash);
  if (!okPw) return unauthorized(res, 'Invalid credentials');
  if (u.is_active === false) return forbidden(res, 'Account inactive');
  const token = signToken({ userId: u.id, tenantId: tenant.id, role: u.role });
  await logAction({ tenantId: tenant.id, userId: u.id, action: 'LOGIN', entityType: 'user', entityId: u.id });
  return ok(res, {
    user: { id: u.id, email: email.toLowerCase(), fullName: u.full_name, role: u.role, tenantId: tenant.id },
    token, expiresIn: 24 * 60 * 60
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  // Use auth middleware in app before routing? app mounts /api/auth without auth for login/register.
  // Here, we implement local token check to keep route under /auth.
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return unauthorized(res, 'Token missing');
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const ures = await query('SELECT id, tenant_id, email, full_name, role, is_active FROM users WHERE id=$1', [payload.userId]);
    if (ures.rowCount === 0) return notFound(res, 'User not found');
    const u = ures.rows[0];
    if (u.role === 'super_admin') {
      return ok(res, { id: u.id, email: u.email, fullName: u.full_name, role: u.role, isActive: u.is_active, tenant: null });
    }
    const t = await query('SELECT id, name, subdomain, subscription_plan, max_users, max_projects FROM tenants WHERE id=$1', [u.tenant_id]);
    if (t.rowCount === 0) return notFound(res, 'Tenant not found');
    const tenant = t.rows[0];
    return ok(res, {
      id: u.id, email: u.email, fullName: u.full_name, role: u.role, isActive: u.is_active,
      tenant: {
        id: tenant.id, name: tenant.name, subdomain: tenant.subdomain,
        subscriptionPlan: tenant.subscription_plan, maxUsers: tenant.max_users, maxProjects: tenant.max_projects
      }
    });
  } catch {
    return unauthorized(res, 'Token invalid or expired');
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const header = req.headers['authorization'] || '';
  const [, token] = header.split(' ');
  try {
    if (token) {
      const payload = jwt.verify(token, config.jwt.secret);
      await logAction({ tenantId: payload.tenantId || null, userId: payload.userId, action: 'LOGOUT', entityType: 'user', entityId: payload.userId });
    }
  } catch {}
  return ok(res, null, 'Logged out successfully');
});

export default router;
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config, PLAN_LIMITS } from '../config.js';
import { getClient, query } from '../db.js';
import { ok, created, badRequest, unauthorized, conflict, notFound, forbidden } from '../utils/responses.js';
import { logAction } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register-tenant',
  body('tenantName').isString().notEmpty(),
  body('subdomain').isString().matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/).isLength({ min: 3, max: 63 }),
  body('adminEmail').isEmail(),
  body('adminPassword').isString().isLength({ min: 8 }),
  body('adminFullName').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badRequest(res, 'Validation errors');
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
    const client = await getClient();
    try {
      const exists = await client.query('SELECT 1 FROM tenants WHERE subdomain=$1', [subdomain]);
      if (exists.rowCount) return conflict(res, 'Subdomain already exists');
      await client.query('BEGIN');
      const tenantId = uuidv4();
      const limits = PLAN_LIMITS['free'];
      await client.query(
        'INSERT INTO tenants(id, name, subdomain, status, subscription_plan, max_users, max_projects) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [tenantId, tenantName, subdomain, 'active', 'free', limits.max_users, limits.max_projects]
      );
      const adminId = uuidv4();
      const hash = await bcrypt.hash(adminPassword, 10);
      await client.query(
        'INSERT INTO users(id, tenant_id, email, password_hash, full_name, role, is_active) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [adminId, tenantId, adminEmail, hash, adminFullName, 'tenant_admin', true]
      );
      await client.query('COMMIT');
      await logAction({ tenantId, userId: adminId, action: 'REGISTER_TENANT', entityType: 'tenant', entityId: tenantId });
      return created(res, {
        tenantId,
        subdomain,
        adminUser: { id: adminId, email: adminEmail, fullName: adminFullName, role: 'tenant_admin' },
      }, 'Tenant registered successfully');
    } catch (e) {
      await client.query('ROLLBACK');
      return badRequest(res, 'Registration failed');
    } finally {
      client.release();
    }
  }
);

router.post('/login',
  body('email').isEmail(),
  body('password').isString(),
  async (req, res) => {
    const { email, password, tenantSubdomain, tenantId } = req.body;
    let tenant = null;
    try {
      // super_admin can login without tenant
      const superRes = await query('SELECT * FROM users WHERE email=$1 AND tenant_id IS NULL', [email]);
      if (superRes.rowCount) {
        const user = superRes.rows[0];
        const okPass = await bcrypt.compare(password, user.password_hash);
        if (!okPass) return unauthorized(res, 'Invalid credentials');
        const token = jwt.sign({ userId: user.id, tenantId: null, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
        return ok(res, {
          user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, tenantId: null },
          token, expiresIn: 24 * 60 * 60,
        });
      }
      // tenant user login
      if (!tenantSubdomain && !tenantId) return badRequest(res, 'tenantSubdomain or tenantId required');
      const tRes = tenantId
        ? await query('SELECT * FROM tenants WHERE id=$1', [tenantId])
        : await query('SELECT * FROM tenants WHERE subdomain=$1', [tenantSubdomain]);
      if (tRes.rowCount === 0) return notFound(res, 'Tenant not found');
      tenant = tRes.rows[0];
      if (tenant.status !== 'active') return forbidden(res, 'Account suspended/inactive');
      const uRes = await query('SELECT * FROM users WHERE tenant_id=$1 AND email=$2', [tenant.id, email]);
      if (uRes.rowCount === 0) return unauthorized(res, 'Invalid credentials');
      const user = uRes.rows[0];
      const okPass = await bcrypt.compare(password, user.password_hash);
      if (!okPass) return unauthorized(res, 'Invalid credentials');
      const token = jwt.sign({ userId: user.id, tenantId: tenant.id, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
      return ok(res, {
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, tenantId: tenant.id },
        token, expiresIn: 24 * 60 * 60,
      });
    } catch (e) {
      return unauthorized(res, 'Login failed');
    }
  }
);

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const u = await query('SELECT id, tenant_id, email, full_name, role, is_active FROM users WHERE id=$1', [req.user.userId]);
    if (u.rowCount === 0) return notFound(res, 'User not found');
    const user = u.rows[0];
    let tenant = null;
    if (user.tenant_id) {
      const t = await query('SELECT id, name, subdomain, subscription_plan, max_users, max_projects FROM tenants WHERE id=$1', [user.tenant_id]);
      tenant = t.rowCount ? {
        id: t.rows[0].id, name: t.rows[0].name, subdomain: t.rows[0].subdomain,
        subscriptionPlan: t.rows[0].subscription_plan, maxUsers: t.rows[0].max_users, maxProjects: t.rows[0].max_projects,
      } : null;
    }
    return ok(res, {
      id: user.id, email: user.email, fullName: user.full_name, role: user.role, isActive: user.is_active, tenant
    });
  } catch (e) {
    return unauthorized(res, 'Invalid session');
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  // JWT-only: client removes token. Just log.
  await logAction({ tenantId: req.user.tenantId, userId: req.user.userId, action: 'LOGOUT', entityType: 'session' });
  return ok(res, null, 'Logged out successfully');
});

export default router;
