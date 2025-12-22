import pg from 'pg';
import { config } from './config.js';

const pool = new pg.Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();

export const ensureConnection = async () => {
  await query('SELECT 1');
};
