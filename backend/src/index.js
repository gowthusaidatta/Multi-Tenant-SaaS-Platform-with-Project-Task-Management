import { config } from './config.js';
import app from './app.js';
import { ensureConnection } from './db.js';
import { runMigrations } from './utils/migrationRunner.js';
import { runSeeds } from './utils/seedRunner.js';

async function bootstrap() {
  await ensureConnection();
  await runMigrations();
  await runSeeds();
  app.listen(config.port, () => console.log(`API listening on :${config.port}`));
}

bootstrap().catch((e) => {
  console.error('Failed to start server', e);
  process.exit(1);
});
