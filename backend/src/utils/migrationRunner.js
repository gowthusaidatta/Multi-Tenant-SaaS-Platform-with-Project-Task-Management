import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const migrationsDir = path.resolve(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  await query(fs.readFileSync(path.join(migrationsDir, '000_init_migrations_table.sql')).toString());

  const appliedRes = await query('SELECT filename FROM schema_migrations');
  const applied = new Set(appliedRes.rows.map(r => r.filename));

  for (const file of files) {
    if (file === '000_init_migrations_table.sql') continue;
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file)).toString();
    await query('BEGIN');
    try {
      await query(sql);
      await query('INSERT INTO schema_migrations(filename) VALUES($1)', [file]);
      await query('COMMIT');
      console.log(`[migrate] applied ${file}`);
    } catch (err) {
      await query('ROLLBACK');
      console.error(`[migrate] failed ${file}`, err);
      throw err;
    }
  }
}
