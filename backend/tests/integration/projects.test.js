/**
 * Integration Tests for Project API Endpoints
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app.js';
import { db } from '../../src/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config.js';
import { v4 as uuidv4 } from 'uuid';

describe('Project API Integration Tests', () => {
  let testTenantId;
  let testUserId;
  let authToken;
  let testProjectId;

  beforeAll(async () => {
    // Create test tenant
    testTenantId = uuidv4();
    await db.query(`
      INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [testTenantId, 'Project Test Co', 'projtest', 'active', 'pro', 25, 15]);

    // Create test user
    testUserId = uuidv4();
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    await db.query(`
      INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [testUserId, testTenantId, 'user@projtest.com', hashedPassword, 'Project User', 'tenant_admin', true]);

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUserId, tenantId: testTenantId, role: 'tenant_admin' },
      config.jwt.secret
    );
  });

  afterAll(async () => {
    // Cleanup
    await db.query('DELETE FROM tasks WHERE tenant_id = $1', [testTenantId]);
    await db.query('DELETE FROM projects WHERE tenant_id = $1', [testTenantId]);
    await db.query('DELETE FROM users WHERE tenant_id = $1', [testTenantId]);
    await db.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
    await db.end();
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project Alpha',
          description: 'This is a test project',
          status: 'active',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', 'Test Project Alpha');
      expect(response.body.data).toHaveProperty('tenantId', testTenantId);
      expect(response.body.data).toHaveProperty('createdBy', testUserId);

      testProjectId = response.body.data.id;
    });

    it('should reject project creation without authentication', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'Unauthenticated Project',
          description: 'Should fail',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject project creation with missing required fields', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing name field',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects', () => {
    beforeAll(async () => {
      // Create additional test projects
      await db.query(`
        INSERT INTO projects (id, tenant_id, name, description, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [uuidv4(), testTenantId, 'Project Beta', 'Second project', 'active', testUserId]);
    });

    it('should list all projects for the tenant', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toBeInstanceOf(Array);
      expect(response.body.data.projects.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.projects[0]).toHaveProperty('name');
      expect(response.body.data.projects[0]).toHaveProperty('status');
    });

    it('should filter projects by status', async () => {
      const response = await request(app)
        .get('/api/projects?status=active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.projects).toBeInstanceOf(Array);
      expect(response.body.data.projects.every(p => p.status === 'active')).toBe(true);
    });

    it('should reject listing without authentication', async () => {
      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/projects/:projectId', () => {
    it('should update a project', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Project Name',
          description: 'Updated description',
          status: 'completed',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', 'Updated Project Name');
      expect(response.body.data).toHaveProperty('status', 'completed');
    });

    it('should reject update for non-existent project', async () => {
      const fakeId = uuidv4();
      const response = await request(app)
        .put(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Should Fail',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/projects/:projectId', () => {
    let deleteProjectId;

    beforeAll(async () => {
      // Create project to delete
      deleteProjectId = uuidv4();
      await db.query(`
        INSERT INTO projects (id, tenant_id, name, description, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [deleteProjectId, testTenantId, 'Project To Delete', 'Will be deleted', 'active', testUserId]);
    });

    it('should delete a project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${deleteProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted successfully/i);
    });

    it('should return 404 for already deleted project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${deleteProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProjectId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
