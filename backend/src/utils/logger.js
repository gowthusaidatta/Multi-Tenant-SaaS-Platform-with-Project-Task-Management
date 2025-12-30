import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';

export async function logAction({ tenantId = null, userId = null, action, entityType = null, entityId = null, ip = null }) {
  try {
    await query(
      'INSERT INTO audit_logs(id, tenant_id, user_id, action, entity_type, entity_id, ip_address) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [uuidv4(), tenantId, userId, action, entityType, entityId, ip]
    );
  } catch {
    // best-effort logging; do not throw
  }
}
