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
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 compliant basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
}

// Test-friendly boolean validation alias
export function validateEmail(email) {
  return isValidEmail(email);
}

/**
 * Validates password strength
 * Requirements: minimum 8 characters, at least one uppercase, one lowercase, one number
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, error?: string }
 */
// Base password strength checker used by both API logic and tests
function hasStrongPassword(password) {
  if (!password || typeof password !== 'string') return false;
  const lengthOk = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return lengthOk && hasUpper && hasLower && hasNumber && hasSpecial;
}

// Boolean interface expected by unit tests
export function validatePassword(password) {
  return hasStrongPassword(password);
}

// Detailed interface used by API routes for richer error messaging
export function validatePasswordDetailed(password) {
  if (!password) return { valid: false, error: 'Password is required' };
  if (!hasStrongPassword(password)) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
    };
  }
  return { valid: true };
}

/**
 * Validates subdomain format
 * Requirements: 3-63 chars, lowercase alphanumeric and hyphens, not starting/ending with hyphen
 * Reserved subdomains are not allowed (www, api, admin, etc.)
 * @param {string} subdomain - Subdomain to validate
 * @returns {boolean} True if valid subdomain format
 */
export function isValidSubdomain(subdomain) {
  if (!subdomain || typeof subdomain !== 'string') return false;
  const lower = subdomain.toLowerCase();
  if (lower.length < 3 || lower.length > 63) return false;
  
  // Reserved subdomain check
  const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost'];
  if (reserved.includes(lower)) return false;
  
  const re = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  // Also reject if original subdomain has uppercase (strict lowercase validation)
  if (subdomain !== lower) return false;
  return re.test(lower);
}

export function validateSubdomain(subdomain) {
  return isValidSubdomain(subdomain);
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
  if (!priority || typeof priority !== 'string') return false;
  return ['low', 'medium', 'high'].includes(priority);
}

/**
 * Validates task status enum value
 * @param {string} status - Status value
 * @returns {boolean} True if valid task status
 */
export function isValidTaskStatus(status) {
  if (!status || typeof status !== 'string') return false;
  return ['todo', 'in_progress', 'completed'].includes(status);
}

/**
 * Validates project status enum value
 * @param {string} status - Status value
 * @returns {boolean} True if valid project status
 */
export function isValidProjectStatus(status) {
  if (!status || typeof status !== 'string') return false;
  return ['active', 'archived', 'completed'].includes(status);
}

/**
 * Validates role enum value
 * @param {string} role - Role value
 * @returns {boolean} True if valid role
 */
export function isValidRole(role) {
  if (!role || typeof role !== 'string') return false;
  return ['super_admin', 'tenant_admin', 'user'].includes(role);
}

/**
 * Validates subscription plan enum value
 * @param {string} plan - Plan value
 * @returns {boolean} True if valid plan
 */
export function isValidSubscriptionPlan(plan) {
  if (!plan || typeof plan !== 'string') return false;
  return ['free', 'pro', 'enterprise'].includes(plan);
}

/**
 * Validates tenant status enum value
 * @param {string} status - Status value
 * @returns {boolean} True if valid tenant status
 */
export function isValidTenantStatus(status) {
  if (!status || typeof status !== 'string') return false;
  return ['active', 'suspended', 'trial'].includes(status);
}

export function validateUUID(value) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof value === 'string' && uuidRegex.test(value);
}

export function validateEnum(value, allowed = []) {
  if (!Array.isArray(allowed) || allowed.length === 0) return false;
  return allowed.includes(value);
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
