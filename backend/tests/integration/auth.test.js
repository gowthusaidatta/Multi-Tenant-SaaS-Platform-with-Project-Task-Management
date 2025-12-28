/**
 * Integration Tests for Authentication API Endpoints
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app.js';
import { db } from '../../src/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

describe('Authentication API Integration Tests', () => {
  let testTenantId;
  let testUserId;
  let authToken;

  beforeAll(async () => {
    // Create test tenant
    testTenantId = uuidv4();
    await db.query(`
      INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [testTenantId, 'Test Company', 'testapi', 'active', 'pro', 25, 15]);

    // Create test user
    testUserId = uuidv4();
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    await db.query(`
      INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [testUserId, testTenantId, 'test@testapi.com', hashedPassword, 'Test User', 'tenant_admin', true]);
  });

  afterAll(async () => {
    // Cleanup test data
    await db.query('DELETE FROM users WHERE tenant_id = $1', [testTenantId]);
    await db.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
    await db.end();
  });

  describe('POST /api/auth/register-tenant', () => {
    it('should successfully register a new tenant', async () => {
      const uniqueSubdomain = `test${Date.now()}`;
      const response = await request(app)
        .post('/api/auth/register-tenant')
        .send({
          tenantName: 'New Test Company',
          subdomain: uniqueSubdomain,
          adminEmail: `admin@${uniqueSubdomain}.com`,
          adminPassword: 'SecurePass@123',
          adminFullName: 'Admin User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/registered successfully/i);
      expect(response.body.data).toHaveProperty('tenantId');
      expect(response.body.data).toHaveProperty('subdomain', uniqueSubdomain);
      expect(response.body.data.adminUser).toHaveProperty('role', 'tenant_admin');

      // Cleanup
      await db.query('DELETE FROM users WHERE tenant_id = $1', [response.body.data.tenantId]);
      await db.query('DELETE FROM tenants WHERE id = $1', [response.body.data.tenantId]);
    });

    it('should reject registration with duplicate subdomain', async () => {
      const response = await request(app)
        .post('/api/auth/register-tenant')
        .send({
          tenantName: 'Duplicate Test',
          subdomain: 'testapi',
          adminEmail: 'admin@duplicate.com',
          adminPassword: 'SecurePass@123',
          adminFullName: 'Admin User',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/subdomain.*exists/i);
    });

    it('should reject registration with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/register-tenant')
        .send({
          tenantName: 'Test Company',
          subdomain: 'testvalid',
          adminEmail: 'admin@testvalid.com',
          adminPassword: 'weak',
          adminFullName: 'Admin User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register-tenant')
        .send({
          tenantName: 'Test Company',
          subdomain: 'testmissing',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@testapi.com',
          password: 'Test@123',
          tenantSubdomain: 'testapi',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data.user).toHaveProperty('id', testUserId);
      expect(response.body.data.user).toHaveProperty('role', 'tenant_admin');
      expect(response.body.data.user).toHaveProperty('tenantId', testTenantId);

      authToken = response.body.data.token;
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@testapi.com',
          password: 'WrongPassword',
          tenantSubdomain: 'testapi',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid credentials/i);
    });

    it('should reject login with non-existent tenant', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@testapi.com',
          password: 'Test@123',
          tenantSubdomain: 'nonexistent',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/tenant not found/i);
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@testapi.com',
          password: 'Test@123',
          tenantSubdomain: 'testapi',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user information with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', testUserId);
      expect(response.body.data).toHaveProperty('email', 'test@testapi.com');
      expect(response.body.data).toHaveProperty('role', 'tenant_admin');
      expect(response.body.data).not.toHaveProperty('password_hash');
      expect(response.body.data.tenant).toHaveProperty('name', 'Test Company');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/logged out/i);
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
