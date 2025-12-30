/**
 * Application Configuration
 * Centralizes all environment variables and configuration constants
 * Values are loaded from environment variables with fallback defaults
 */

import dotenv from 'dotenv';
dotenv.config();

/**
 * Main application configuration object
 * All values come from environment variables with sensible defaults
 */
export const config = {
  // Application environment (development, production, test)
  env: process.env.NODE_ENV || 'development',
  
  // Port for API server
  port: parseInt(process.env.PORT || '5000', 10),
  
  // Database configuration
  // In Docker: DB_HOST should be 'database' (service name)
  // For local dev: DB_HOST can be 'localhost'
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'saas_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1235',
  },
  
  // JWT authentication configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'change_me_in_prod_please',  // Must be strong in production
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',  // Token validity period
  },
  
  // CORS configuration
  // In Docker: Should be 'http://frontend:3000' (service name)
  // For local dev: Can be 'http://localhost:3000'
  corsOrigin: process.env.FRONTEND_URL || 'http://localhost:3000',
};

/**
 * Subscription plan limits
 * Defines maximum users and projects for each plan tier
 * These limits are enforced at the API level before resource creation
 */
export const PLAN_LIMITS = {
  free: { max_users: 5, max_projects: 3 },          // Free tier: Small teams
  pro: { max_users: 25, max_projects: 15 },         // Pro tier: Growing teams
  enterprise: { max_users: 100, max_projects: 50 }, // Enterprise tier: Large organizations
};
