/**
 * Unit Tests for Validation Utilities
 */
import { describe, it, expect } from '@jest/globals';
import {
  validateEmail,
  validatePassword,
  validateSubdomain,
  validateUUID,
  validateEnum,
} from '../../src/utils/validation.js';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('admin123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept passwords meeting requirements', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('Test@1234')).toBe(true);
      expect(validatePassword('Secure#Pass99')).toBe(true);
    });

    it('should reject passwords that are too short', () => {
      expect(validatePassword('Pass1!')).toBe(false);
      expect(validatePassword('Abc@12')).toBe(false);
    });

    it('should reject passwords without uppercase', () => {
      expect(validatePassword('password123!')).toBe(false);
    });

    it('should reject passwords without lowercase', () => {
      expect(validatePassword('PASSWORD123!')).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(validatePassword('Password!')).toBe(false);
    });

    it('should reject passwords without special characters', () => {
      expect(validatePassword('Password123')).toBe(false);
    });

    it('should reject empty passwords', () => {
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateSubdomain', () => {
    it('should accept valid subdomains', () => {
      expect(validateSubdomain('mycompany')).toBe(true);
      expect(validateSubdomain('test-company')).toBe(true);
      expect(validateSubdomain('company123')).toBe(true);
      expect(validateSubdomain('abc')).toBe(true);
    });

    it('should reject subdomains with invalid characters', () => {
      expect(validateSubdomain('my_company')).toBe(false);
      expect(validateSubdomain('company.name')).toBe(false);
      expect(validateSubdomain('my company')).toBe(false);
      expect(validateSubdomain('UPPERCASE')).toBe(false);
    });

    it('should reject subdomains starting or ending with hyphen', () => {
      expect(validateSubdomain('-company')).toBe(false);
      expect(validateSubdomain('company-')).toBe(false);
    });

    it('should reject subdomains that are too short', () => {
      expect(validateSubdomain('ab')).toBe(false);
      expect(validateSubdomain('a')).toBe(false);
    });

    it('should reject subdomains that are too long', () => {
      const longSubdomain = 'a'.repeat(64);
      expect(validateSubdomain(longSubdomain)).toBe(false);
    });

    it('should reject empty subdomain', () => {
      expect(validateSubdomain('')).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('should accept valid UUIDs', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(validateUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(validateUUID('not-a-uuid')).toBe(false);
      expect(validateUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(validateUUID('550e8400e29b41d4a716446655440000')).toBe(false);
      expect(validateUUID('')).toBe(false);
    });
  });

  describe('validateEnum', () => {
    const validStatuses = ['active', 'inactive', 'pending'];

    it('should accept values in enum', () => {
      expect(validateEnum('active', validStatuses)).toBe(true);
      expect(validateEnum('inactive', validStatuses)).toBe(true);
      expect(validateEnum('pending', validStatuses)).toBe(true);
    });

    it('should reject values not in enum', () => {
      expect(validateEnum('invalid', validStatuses)).toBe(false);
      expect(validateEnum('ACTIVE', validStatuses)).toBe(false);
      expect(validateEnum('', validStatuses)).toBe(false);
    });

    it('should handle empty enum array', () => {
      expect(validateEnum('anything', [])).toBe(false);
    });
  });
});
