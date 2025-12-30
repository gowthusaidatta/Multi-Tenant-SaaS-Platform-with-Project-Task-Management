/**
 * Database Connection Pool
 * Provides PostgreSQL connection pooling for the application
 * 
 * Uses pg (node-postgres) library for database operations
 * Configuration is loaded from environment variables via config.js
 */

import pg from 'pg';
import { config } from './config.js';

/**
 * PostgreSQL connection pool
 * Pool is preferred over single connections for better performance
 * and automatic connection management
 */
const pool = new pg.Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  // Default pool settings (can be customized via environment variables)
  max: 20,                    // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if cannot connect
});

/**
 * Execute a SQL query using the connection pool
 * 
 * @param {string} text - SQL query string with placeholders ($1, $2, etc.)
 * @param {Array} params - Array of parameter values for placeholders
 * @returns {Promise<QueryResult>} - Query result with rows array
 * 
 * @example
 * const result = await query('SELECT * FROM users WHERE email = $1', ['user@example.com']);
 * console.log(result.rows[0]);
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Get a database client from the pool for transaction operations
 * Remember to release the client after use: client.release()
 * 
 * @returns {Promise<PoolClient>} - Database client
 * 
 * @example
 * const client = await getClient();
 * try {
 *   await client.query('BEGIN');
 *   // ... perform queries
 *   await client.query('COMMIT');
 * } catch (e) {
 *   await client.query('ROLLBACK');
 * } finally {
 *   client.release();
 * }
 */
export const getClient = () => pool.connect();

/**
 * Test database connectivity
 * Used during application startup to ensure database is accessible
 * 
 * @throws {Error} If database connection fails
 */
export const ensureConnection = async () => {
  await query('SELECT 1');
};
