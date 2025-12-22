import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { unauthorized } from '../utils/responses.js';

export function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return unauthorized(res, 'Token missing');
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload; // { userId, tenantId, role }
    next();
  } catch {
    return unauthorized(res, 'Token invalid or expired');
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res, 'Unauthorized');
    if (!roles.includes(req.user.role)) return unauthorized(res, 'Insufficient permissions');
    next();
  };
}
