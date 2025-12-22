import { Router } from 'express';
import { query } from '../db.js';

const router = Router();
router.get('/', async (req, res) => {
  try {
    const db = await query('SELECT 1');
    const seed = await query("SELECT value FROM app_status WHERE key='seed_status'");
    const ready = seed.rows[0]?.value === 'done';
    if (!ready) return res.status(503).json({ status: 'initializing', database: 'connected' });
    return res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    return res.status(503).json({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

export default router;
