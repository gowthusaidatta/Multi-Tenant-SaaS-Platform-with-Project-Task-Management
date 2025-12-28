/**
 * Authentication Middleware for Multi-Tenant SaaS Platform
 * Handles JWT token validation and role-based authorization
 */

import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { unauthorized, forbidden } from '../utils/responses.js';

/**
 * Authentication middleware to verify JWT tokens
 * Extracts token from Authorization header, validates it, and attaches user info to request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * Token payload structure: { userId, tenantId, role }
 * - userId: User's unique identifier
 * - tenantId: User's tenant ID (null for super_admin)
 * - role: User's role (super_admin, tenant_admin, or user)
 */
export function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  
  // Verify Bearer scheme and token presence
  if (scheme !== 'Bearer' || !token) return unauthorized(res, 'Token missing');
  
  try {
    // Verify and decode JWT token
    const payload = jwt.verify(token, config.jwt.secret);
    
    // Attach user info to request for downstream middleware/routes
    req.user = payload; // { userId, tenantId, role }
    next();
  } catch {
    return unauthorized(res, 'Token invalid or expired');
  }
}

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has one of the required roles
 * 
 * @param {...string} roles - Allowed roles (e.g., 'super_admin', 'tenant_admin')
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/admin-only', authMiddleware, requireRole('tenant_admin', 'super_admin'), handler);
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res, 'Unauthorized');

    // Super admins can access any route
    if (req.user.role === 'super_admin') return next();

    // Check if user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) return forbidden(res, 'Insufficient permissions');

    next();
  };
}
