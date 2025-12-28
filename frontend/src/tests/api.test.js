/**
 * Tests for API Module
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import { login, registerTenant, getCurrentUser, getProjects, createProject } from '../api';

vi.mock('axios');

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should call login endpoint with credentials', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'jwt-token',
            user: { id: '123', email: 'test@example.com' },
          },
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
        tenantSubdomain: 'testcompany',
      };

      const result = await login(credentials);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        credentials
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on login failure', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      };
      axios.post.mockRejectedValue(mockError);

      await expect(
        login({
          email: 'test@example.com',
          password: 'wrong',
          tenantSubdomain: 'test',
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('registerTenant', () => {
    it('should call register endpoint with tenant data', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            tenantId: 'tenant-123',
            subdomain: 'newcompany',
          },
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const tenantData = {
        tenantName: 'New Company',
        subdomain: 'newcompany',
        adminEmail: 'admin@newcompany.com',
        adminPassword: 'SecurePass@123',
        adminFullName: 'Admin User',
      };

      const result = await registerTenant(tenantData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register-tenant'),
        tenantData
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getCurrentUser', () => {
    it('should call /me endpoint with auth token', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'user-123',
            email: 'test@example.com',
            fullName: 'Test User',
          },
        },
      };
      axios.get.mockResolvedValue(mockResponse);
      localStorage.setItem('token', 'jwt-token');

      const result = await getCurrentUser();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle missing token', async () => {
      localStorage.removeItem('token');

      await expect(getCurrentUser()).rejects.toThrow();
    });
  });

  describe('getProjects', () => {
    it('should fetch projects with auth token', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            projects: [
              { id: '1', name: 'Project 1' },
              { id: '2', name: 'Project 2' },
            ],
          },
        },
      };
      axios.get.mockResolvedValue(mockResponse);
      localStorage.setItem('token', 'jwt-token');

      const result = await getProjects();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/projects'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-token',
          }),
        })
      );
      expect(result.data.projects).toHaveLength(2);
    });

    it('should include query parameters', async () => {
      const mockResponse = { data: { success: true, data: { projects: [] } } };
      axios.get.mockResolvedValue(mockResponse);
      localStorage.setItem('token', 'jwt-token');

      await getProjects({ status: 'active', search: 'test' });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.any(Object)
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('search=test'),
        expect.any(Object)
      );
    });
  });

  describe('createProject', () => {
    it('should create project with auth token', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'project-123',
            name: 'New Project',
          },
        },
      };
      axios.post.mockResolvedValue(mockResponse);
      localStorage.setItem('token', 'jwt-token');

      const projectData = {
        name: 'New Project',
        description: 'Project description',
      };

      const result = await createProject(projectData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/projects'),
        projectData,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-token',
          }),
        })
      );
      expect(result.data.id).toBe('project-123');
    });
  });
});
