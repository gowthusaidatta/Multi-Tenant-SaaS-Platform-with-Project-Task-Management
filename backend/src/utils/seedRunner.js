import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { PLAN_LIMITS } from '../config.js';

export async function runSeeds() {
  // Check if already seeded
  await query("INSERT INTO app_status(key, value) VALUES('seed_status', 'pending') ON CONFLICT (key) DO NOTHING");
  const res = await query("SELECT value FROM app_status WHERE key='seed_status'");
  if (res.rows[0]?.value === 'done') {
    return; // already seeded
  }

  // Super Admin
  const superEmail = 'superadmin@system.com';
  const superExists = await query('SELECT 1 FROM users WHERE tenant_id IS NULL AND email=$1', [superEmail]);
  if (superExists.rowCount === 0) {
    const superId = uuidv4();
    const superHash = await bcrypt.hash('Admin@123', 10);
    await query(
      'INSERT INTO users(id, tenant_id, email, password_hash, full_name, role, is_active) VALUES($1, $2, $3, $4, $5, $6, $7)',
      [superId, null, superEmail, superHash, 'Super Admin', 'super_admin', true]
    );
  }

  // Demo Tenant with Admin, Users, Projects, Tasks
  const tId = uuidv4();
  const tenantRows = await query('SELECT id FROM tenants WHERE subdomain=$1', ['demo']);
  const tenantId = tenantRows.rowCount ? tenantRows.rows[0].id : tId;
  if (!tenantRows.rowCount) {
    const limits = PLAN_LIMITS['pro'];
    await query(
      'INSERT INTO tenants(id, name, subdomain, status, subscription_plan, max_users, max_projects) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [tenantId, 'Demo Company', 'demo', 'active', 'pro', limits.max_users, limits.max_projects]
    );
  }

  const ensureUser = async (email, password, fullName, role) => {
    const exists = await query('SELECT id FROM users WHERE tenant_id=$1 AND email=$2', [tenantId, email]);
    if (exists.rowCount) return exists.rows[0].id;
    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO users(id, tenant_id, email, password_hash, full_name, role, is_active) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [id, tenantId, email, hash, fullName, role, true]
    );
    return id;
  };

  const adminId = await ensureUser('admin@demo.com', 'Demo@123', 'Demo Admin', 'tenant_admin');
  const user1Id = await ensureUser('user1@demo.com', 'User@123', 'User One', 'user');
  const user2Id = await ensureUser('user2@demo.com', 'User@123', 'User Two', 'user');

  // Projects
  const ensureProject = async (name, description, createdBy) => {
    const exists = await query('SELECT id FROM projects WHERE tenant_id=$1 AND name=$2', [tenantId, name]);
    if (exists.rowCount) return exists.rows[0].id;
    const id = uuidv4();
    await query(
      'INSERT INTO projects(id, tenant_id, name, description, status, created_by) VALUES($1,$2,$3,$4,$5,$6)',
      [id, tenantId, name, description, 'active', createdBy]
    );
    return id;
  };

  const projectAlphaId = await ensureProject('Project Alpha', 'First demo project', adminId);
  const projectBetaId = await ensureProject('Project Beta', 'Second demo project', adminId);

  // Tasks
  const ensureTask = async (projectId, title, assignedTo, priority = 'medium', status = 'todo') => {
    const exists = await query('SELECT id FROM tasks WHERE project_id=$1 AND title=$2', [projectId, title]);
    if (exists.rowCount) return;
    const id = uuidv4();
    await query(
      'INSERT INTO tasks(id, project_id, tenant_id, title, description, status, priority, assigned_to) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [id, projectId, tenantId, title, title + ' description', status, priority, assignedTo]
    );
  };

  await ensureTask(projectAlphaId, 'Design homepage mockup', user1Id, 'high', 'in_progress');
  await ensureTask(projectAlphaId, 'Implement authentication', user2Id, 'medium', 'todo');
  await ensureTask(projectAlphaId, 'Set up CI/CD', null, 'low', 'todo');
  await ensureTask(projectBetaId, 'Database schema review', user1Id, 'high', 'completed');
  await ensureTask(projectBetaId, 'Write API docs', user2Id, 'medium', 'in_progress');

  await query("UPDATE app_status SET value='done', updated_at=NOW() WHERE key='seed_status'");
}
