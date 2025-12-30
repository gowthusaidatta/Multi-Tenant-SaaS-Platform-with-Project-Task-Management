/**
 * Multi-Tenant SaaS Platform - Backend Entry Point
 * 
 * This file initializes the Express application and starts the server.
 * Initialization sequence:
 * 1. Ensure database connection
 * 2. Run migrations automatically
 * 3. Run seed data automatically
 * 4. Start HTTP server
 * 
 * Environment variables are loaded from process.env via config.js
 */

import { config } from './config.js';
import app from './app.js';
import { ensureConnection } from './db.js';
import { runMigrations } from './utils/migrationRunner.js';
import { runSeeds } from './utils/seedRunner.js';

/**
 * Bootstrap function to initialize and start the application
 * Runs migrations and seeds before starting the server
 */
async function bootstrap() {
  console.log('Starting Multi-Tenant SaaS Platform backend...');
  console.log(`Environment: ${config.env}`);
  console.log(`Port: ${config.port}`);
  
  // Ensure database connection
  await ensureConnection();
  console.log('Database connection established');
  
  // Run database migrations
  await runMigrations();
  console.log('Database migrations completed');
  
  // Run seed data
  await runSeeds();
  console.log('Seed data loaded');
  
  // Start the HTTP server
  app.listen(config.port, () => {
    console.log(`✓ API server listening on port ${config.port}`);
    console.log(`✓ Health check available at http://localhost:${config.port}/api/health`);
  });
}

// Start the application
bootstrap().catch((e) => {
  console.error('❌ Failed to start server:', e);
  process.exit(1);
});
