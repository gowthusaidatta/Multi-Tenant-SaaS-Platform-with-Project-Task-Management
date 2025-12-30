/**
 * Input Validation Utilities for Multi-Tenant SaaS Platform
 * Centralizes validation logic for consistent input validation across APIs
 */

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  if (!email) return false;
  // RFC 5322 compliant basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
}

/**
 * Validates password strength
 * Requirements: minimum 8 characters, at least one uppercase, one lowercase, one number
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, error?: string }
 */
export function validatePassword(password) {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, error: 'Password must contain at least one lowercase letter' };
  if (!/\d/.test(password)) return { valid: false, error: 'Password must contain at least one digit' };
  return { valid: true };
}

/**
 * Validates subdomain format
 * Requirements: 3-63 chars, lowercase alphanumeric and hyphens, not starting/ending with hyphen
 * @param {string} subdomain - Subdomain to validate
 * @returns {boolean} True if valid subdomain format
 */
export function isValidSubdomain(subdomain) {
  if (!subdomain) return false;
  if (subdomain.length < 3 || subdomain.length > 63) return false;
  const re = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return re.test(String(subdomain).toLowerCase());
}

/**
 * Validates full name format
 * Requirements: 2-255 characters, no leading/trailing whitespace
 * @param {string} fullName - Full name to validate
 * @returns {boolean} True if valid full name format
 */
export function isValidFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') return false;
  const trimmed = fullName.trim();
  return trimmed.length >= 2 && trimmed.length <= 255;
}

/**
 * Validates project/task title
 * Requirements: 1-255 characters, not empty after trim
 * @param {string} title - Title to validate
 * @returns {boolean} True if valid title
 */
export function isValidTitle(title) {
  if (!title || typeof title !== 'string') return false;
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= 255;
}

/**
 * Validates priority enum value
 * @param {string} priority - Priority value
 * @returns {boolean} True if valid priority
 */
export function isValidPriority(priority) {
  return ['low', 'medium', 'high'].includes(priority);
}

/**
 * Validates task status enum value
 * @param {string} status - Status value
 * @returns {boolean} True if valid task status
 */
export function isValidTaskStatus(status) {
  return ['todo', 'in_progress', 'completed'].includes(status);
}

/**
 * Validates project status enum value
 * @param {string} status - Status value
 * @returns {boolean} True if valid project status
 */
export function isValidProjectStatus(status) {
  return ['active', 'archived', 'completed'].includes(status);
}

/**
 * Validates role enum value
 * @param {string} role - Role value
 * @returns {boolean} True if valid role
 */
export function isValidRole(role) {
  return ['super_admin', 'tenant_admin', 'user'].includes(role);
}

/**
 * Validates subscription plan enum value
 * @param {string} plan - Plan value
 * @returns {boolean} True if valid plan
 */
export function isValidSubscriptionPlan(plan) {
  return ['free', 'pro', 'enterprise'].includes(plan);
}

/**
 * Validates tenant status enum value
 * @param {string} status - Status value
 * @returns {boolean} True if valid tenant status
 */
export function isValidTenantStatus(status) {
  return ['active', 'suspended', 'trial'].includes(status);
}

/**
 * Validates date format (YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid date format
 */
export function isValidDate(dateStr) {
  if (!dateStr) return true; // Optional field
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validates UUID v4 format
 * @param {string} id - UUID to validate
 * @returns {boolean} True if valid UUID
 */
export function isValidUUID(id) {
  if (!id || typeof id !== 'string') return false;
  // Accept standard UUID v4 format (lower/upper-case hex)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(id);
}
