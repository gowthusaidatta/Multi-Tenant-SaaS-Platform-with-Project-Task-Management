/**
 * Unit Tests for Response Utilities
 */
import { describe, it, expect, jest } from '@jest/globals';
import { success, created, error, notFound, unauthorized, forbidden, conflict } from '../../src/utils/responses.js';

describe('Response Utilities', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
    };
  });

  describe('success', () => {
    it('should return 200 with success response', () => {
      const data = { id: '123', name: 'Test' };
      
      success(res, data);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should handle null data', () => {
      success(res, null);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
      });
    });
  });

  describe('created', () => {
    it('should return 201 with created response', () => {
      const data = { id: '456', name: 'New Item' };
      const message = 'Resource created successfully';
      
      created(res, message, data);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message,
        data,
      });
    });
  });

  describe('error', () => {
    it('should return 400 with error message', () => {
      const message = 'Invalid input';
      
      error(res, message);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
      });
    });

    it('should use default message if none provided', () => {
      error(res);
      
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad request',
      });
    });
  });

  describe('notFound', () => {
    it('should return 404 with not found message', () => {
      const message = 'Resource not found';
      
      notFound(res, message);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
      });
    });
  });

  describe('unauthorized', () => {
    it('should return 401 with unauthorized message', () => {
      const message = 'Token expired';
      
      unauthorized(res, message);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
      });
    });
  });

  describe('forbidden', () => {
    it('should return 403 with forbidden message', () => {
      const message = 'Insufficient permissions';
      
      forbidden(res, message);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
      });
    });
  });

  describe('conflict', () => {
    it('should return 409 with conflict message', () => {
      const message = 'Resource already exists';
      
      conflict(res, message);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
      });
    });
  });
});
