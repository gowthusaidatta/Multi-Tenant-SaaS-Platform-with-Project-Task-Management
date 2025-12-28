/**
 * Unit Tests for Authentication Middleware
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authMiddleware, requireRole } from '../../src/middleware/auth.js';
import { config } from '../../src/config.js';

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
    };
    next = jest.fn();
  });

  describe('authMiddleware', () => {
    it('should reject request without authorization header', () => {
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token missing',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid scheme', () => {
      req.headers['authorization'] = 'Basic token123';
      
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token missing',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      req.headers['authorization'] = 'Bearer invalid_token';
      
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token invalid or expired',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept valid token and attach user to request', () => {
      const payload = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        role: 'tenant_admin',
      };
      const token = jwt.sign(payload, config.jwt.secret);
      req.headers['authorization'] = `Bearer ${token}`;
      
      authMiddleware(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(payload.userId);
      expect(req.user.tenantId).toBe(payload.tenantId);
      expect(req.user.role).toBe(payload.role);
      expect(next).toHaveBeenCalled();
    });

    it('should handle super_admin with null tenantId', () => {
      const payload = {
        userId: 'admin-123',
        tenantId: null,
        role: 'super_admin',
      };
      const token = jwt.sign(payload, config.jwt.secret);
      req.headers['authorization'] = `Bearer ${token}`;
      
      authMiddleware(req, res, next);
      
      expect(req.user.tenantId).toBeNull();
      expect(req.user.role).toBe('super_admin');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireRole middleware', () => {
    beforeEach(() => {
      // Simulate authenticated user
      req.user = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        role: 'user',
      };
    });

    it('should allow access when user has required role', () => {
      const middleware = requireRole('user', 'tenant_admin');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks required role', () => {
      req.user.role = 'user';
      const middleware = requireRole('tenant_admin', 'super_admin');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow super_admin access to any endpoint', () => {
      req.user.role = 'super_admin';
      const middleware = requireRole('tenant_admin');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should allow tenant_admin access to tenant_admin endpoints', () => {
      req.user.role = 'tenant_admin';
      const middleware = requireRole('tenant_admin');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});
