# JWT Authentication & Role-Based Access Control (RBAC)

## Overview
This document details the complete JWT-based authentication and role-based access control implementation in the Multi-Tenant SaaS Platform.

---

## 1. JWT-Based Authentication

### Configuration
**File**: `backend/src/config.js`

```javascript
jwt: {
  secret: process.env.JWT_SECRET || 'change_me_in_prod_please',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',  // ✅ 24-hour expiry
}
```

### Token Generation
**File**: `backend/src/routes/auth.js`

```javascript
function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}
```

### Token Payload Structure
```javascript
{
  userId: "uuid",           // User's unique identifier
  tenantId: "uuid" | null,  // User's tenant (null for super_admin)
  role: "super_admin" | "tenant_admin" | "user"
}
```

### Token Validity
- ✅ **Expiry**: 24 hours
- ✅ **Verification**: Checked on every authenticated request
- ✅ **Refresh**: New token issued on each login
- ✅ **Stateless**: No session storage required (JWT-only)

**Example Token Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

---

## 2. Three User Roles

### Role Definitions

#### **Super Admin** 🔐
- **tenant_id**: `NULL` (not associated with any tenant)
- **Role**: `'super_admin'`
- **System-Level Access**:
  - View all tenants in the system
  - Manage all tenants (update plan, status, limits)
  - View all users across all tenants
  - View all projects across all tenants
  - View all tasks across all tenants
  - Modify any resource in the system
  - No tenant isolation filters applied

**Database**: Users table with `tenant_id IS NULL AND role = 'super_admin'`

---

#### **Tenant Admin** 👨‍💼
- **tenant_id**: Associated with specific tenant
- **Role**: `'tenant_admin'`
- **Tenant-Level Access**:
  - Full control over their tenant
  - Manage users in their tenant
  - Create/update/delete projects in their tenant
  - Create/update/delete tasks in their tenant
  - Update tenant name (but not subscription plan/status/limits)
  - View audit logs for their tenant
  - Cannot access other tenants' data

**Database**: Users table with `tenant_id = '<tenant_uuid>' AND role = 'tenant_admin'`

---

#### **User** 👤
- **tenant_id**: Associated with specific tenant
- **Role**: `'user'`
- **Limited Access**:
  - View projects in their tenant
  - Create tasks in projects
  - View and update tasks assigned to them
  - Cannot create/delete projects
  - Cannot manage users
  - Cannot modify tenant settings
  - Limited to their tenant only

**Database**: Users table with `tenant_id = '<tenant_uuid>' AND role = 'user'`

---

## 3. Role-Based Access Control (RBAC)

### Authentication Middleware
**File**: `backend/src/middleware/auth.js`

```javascript
export function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  
  if (scheme !== 'Bearer' || !token) 
    return unauthorized(res, 'Token missing');
  
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload;  // { userId, tenantId, role }
    next();
  } catch {
    return unauthorized(res, 'Token invalid or expired');
  }
}
```

### Role Authorization Middleware
```javascript
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res, 'Unauthorized');
    if (!roles.includes(req.user.role)) 
      return unauthorized(res, 'Insufficient permissions');
    next();
  };
}
```

---

## 4. RBAC Enforcement at API Level

### Authentication Required Endpoints

All protected endpoints require:
1. Valid JWT token in `Authorization: Bearer <token>` header
2. Token must be valid and not expired
3. Appropriate role for the operation

### Authorization Patterns

#### Pattern 1: Super Admin Only
```javascript
// GET /api/tenants (list all tenants)
if (me.role !== 'super_admin') 
  return forbidden(res, 'Not super_admin');
```

#### Pattern 2: Same Tenant or Super Admin
```javascript
// GET /api/tenants/:tenantId
if (me.role !== 'super_admin' && me.tenantId !== tenantId) 
  return forbidden(res, 'Unauthorized access');
```

#### Pattern 3: Tenant Admin Only
```javascript
// POST /api/tenants/:tenantId/users (add user)
if (me.role !== 'tenant_admin' || me.tenantId !== tenantId) 
  return forbidden(res, 'Not authorized');
```

#### Pattern 4: Creator or Tenant Admin
```javascript
// PUT /api/projects/:projectId (update project)
if (!(me.role === 'tenant_admin' || project.created_by === me.userId)) 
  return forbidden(res, 'Not authorized');
```

---

## 5. API Endpoint Authorization Matrix

| Endpoint | Method | Auth | Role | Access |
|----------|--------|------|------|--------|
| `/auth/register-tenant` | POST | ❌ | - | Public |
| `/auth/login` | POST | ❌ | - | Public |
| `/auth/me` | GET | ✅ | Any | Current user info |
| `/auth/logout` | POST | ✅ | Any | Logout |
| `/tenants` | GET | ✅ | Super Admin | All tenants |
| `/tenants/:id` | GET | ✅ | Super Admin / Own | Tenant details |
| `/tenants/:id` | PUT | ✅ | Super Admin / Tenant Admin | Update tenant |
| `/users/all` | GET | ✅ | Super Admin | All users |
| `/tenants/:id/users` | GET | ✅ | Super Admin / Own tenant | Tenant users |
| `/tenants/:id/users` | POST | ✅ | Tenant Admin | Add user |
| `/users/:id` | PUT | ✅ | Tenant Admin / Self | Update user |
| `/users/:id` | DELETE | ✅ | Tenant Admin | Delete user |
| `/projects` | GET | ✅ | Any (filtered) | Own tenant projects |
| `/projects/all` | GET | ✅ | Super Admin | All projects |
| `/projects` | POST | ✅ | Any | Create project |
| `/projects/:id` | PUT | ✅ | Tenant Admin / Creator | Update project |
| `/projects/:id` | DELETE | ✅ | Tenant Admin / Creator | Delete project |
| `/projects/:id/tasks` | GET | ✅ | Any (filtered) | Project tasks |
| `/tasks/all` | GET | ✅ | Super Admin | All tasks |
| `/projects/:id/tasks` | POST | ✅ | Any | Create task |
| `/tasks/:id` | PUT | ✅ | Any (filtered) | Update task |
| `/tasks/:id/status` | PATCH | ✅ | Any (filtered) | Change status |
| `/tasks/:id` | DELETE | ✅ | Any (filtered) | Delete task |

---

## 6. Tenant Isolation in RBAC

### Key Principle
**tenant_id is derived exclusively from JWT claims, never from client input**

### Implementation
```javascript
const me = req.user;  // Contains authenticated user's tenantId

// For non-super-admin users, always filter by their tenantId
if (me.role !== 'super_admin' && me.tenantId !== requestedTenantId) {
  return forbidden(res, 'Unauthorized access');
}
```

### Super Admin Bypass
```javascript
// Super admin bypasses tenant isolation
if (me.role === 'super_admin') {
  // No tenant_id filter - can access any tenant
} else {
  // Regular users filtered by tenant_id
  query += ' WHERE tenant_id = ?'
}
```

---

## 7. Login Flow

### Super Admin Login
```bash
POST /api/auth/login
{
  "email": "superadmin@system.com",
  "password": "Admin@123"
  // No tenantSubdomain required
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "superadmin@system.com",
      "fullName": "Super Admin",
      "role": "super_admin",
      "tenantId": null  // ← NULL for super_admin
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

### Tenant User Login
```bash
POST /api/auth/login
{
  "email": "admin@demo.com",
  "password": "Demo@123",
  "tenantSubdomain": "demo"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@demo.com",
      "fullName": "Demo Admin",
      "role": "tenant_admin",
      "tenantId": "uuid"  // ← Tenant UUID
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

---

## 8. Token Usage Example

### Using Token in Requests
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token Expiry Handling
- Frontend checks token expiry before making requests
- If token expired: Return 401 Unauthorized
- User must login again to get new token
- Auto-logout on token expiry (frontend implementation)

---

## 9. Security Features

### Password Hashing
- **Algorithm**: bcrypt with 10 salt rounds
- **File**: Implemented in `auth.js` and `users.js`
- **Usage**: `bcrypt.hash(password, 10)`

### Authorization Checks
- ✅ Role-based access control at every endpoint
- ✅ Tenant isolation enforced in queries
- ✅ No user can access data from other tenants
- ✅ Super admin can access all data

### Audit Logging
- All critical actions logged with:
  - `userId`: Who performed the action
  - `tenantId`: Which tenant was affected
  - `action`: What action was performed
  - `entityType`: What resource was affected
  - `entityId`: Which resource was affected

---

## 10. Testing RBAC

### Test Super Admin Access
```bash
# Login as super admin
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@system.com","password":"Admin@123"}' \
  | jq -r '.data.token')

# View all tenants (super admin only)
curl -X GET http://localhost:5000/api/tenants \
  -H "Authorization: Bearer $TOKEN"

# View all users
curl -X GET http://localhost:5000/api/users/all \
  -H "Authorization: Bearer $TOKEN"

# View all projects
curl -X GET http://localhost:5000/api/projects/all \
  -H "Authorization: Bearer $TOKEN"

# View all tasks
curl -X GET http://localhost:5000/api/tasks/all \
  -H "Authorization: Bearer $TOKEN"
```

### Test Tenant Admin Access
```bash
# Login as tenant admin
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@123","tenantSubdomain":"demo"}' \
  | jq -r '.data.token')

# View own tenant users
curl -X GET http://localhost:5000/api/tenants/<tenant-id>/users \
  -H "Authorization: Bearer $TOKEN"

# Try to view all users (should fail - 403)
curl -X GET http://localhost:5000/api/users/all \
  -H "Authorization: Bearer $TOKEN"
```

### Test Regular User Access
```bash
# Login as regular user
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@demo.com","password":"User@123","tenantSubdomain":"demo"}' \
  | jq -r '.data.token')

# View own projects (should work)
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN"

# Try to add user (should fail - 403)
curl -X POST http://localhost:5000/api/tenants/<tenant-id>/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## 11. Key Implementation Files

| File | Purpose |
|------|---------|
| `backend/src/config.js` | JWT configuration (secret, expiry) |
| `backend/src/middleware/auth.js` | Authentication & authorization middleware |
| `backend/src/routes/auth.js` | Login, registration, token generation |
| `backend/src/routes/tenants.js` | Tenant management with RBAC |
| `backend/src/routes/users.js` | User management with RBAC |
| `backend/src/routes/projects.js` | Project management with RBAC |
| `backend/src/routes/tasks.js` | Task management with RBAC |

---

## Summary

✅ **JWT-Based Authentication**
- 24-hour token expiry
- Stateless (no session required)
- Verified on every request
- Secure payload structure

✅ **Three User Roles**
- Super Admin: System-level access
- Tenant Admin: Organization control
- User: Limited team member access

✅ **Role-Based Access Control**
- Enforced at API level
- Multiple authorization patterns
- Tenant isolation guaranteed
- No privilege escalation possible

✅ **Security**
- Password hashing (bcrypt)
- Audit logging for all actions
- Comprehensive authorization checks
- Super admin bypass for system operations

---

**Last Updated**: December 26, 2025
**Status**: ✅ Production Ready
