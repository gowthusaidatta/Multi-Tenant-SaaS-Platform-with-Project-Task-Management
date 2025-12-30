import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';

/**
 * Logs user actions to audit trail
 * Records all significant user activities for security and compliance
 * @param {Object} params - Log parameters
 * @param {string|null} params.tenantId - Tenant ID (null for super_admin actions)
 * @param {string|null} params.userId - User ID performing the action
 * @param {string} params.action - Action type (e.g., 'LOGIN', 'CREATE_PROJECT')
 * @param {string|null} params.entityType - Type of entity affected (e.g., 'project', 'user')
 * @param {string|null} params.entityId - ID of affected entity
 * @param {string|null} params.ip - IP address of the user
 * @returns {Promise<void>}
 */
export async function logAction({ tenantId = null, userId = null, action, entityType = null, entityId = null, ip = null }) {
  try {
    await query(
      'INSERT INTO audit_logs(id, tenant_id, user_id, action, entity_type, entity_id, ip_address) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [uuidv4(), tenantId, userId, action, entityType, entityId, ip]
    );
  } catch (error) {
    // Best-effort logging; do not throw to avoid disrupting main flow
    console.error('[Audit Log Error]', error.message);
  }
}
