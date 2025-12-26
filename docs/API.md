# API Documentation

All responses follow: { success: boolean, message?: string, data?: object }
Auth required endpoints expect `Authorization: Bearer <token>`.

## Auth

POST /api/auth/register-tenant
- Body: { tenantName, subdomain, adminEmail, adminPassword, adminFullName }
- 201: { success, message, data: { tenantId, subdomain, adminUser } }

POST /api/auth/login
- Body: { email, password, tenantSubdomain? | tenantId? }
- 200: { success, data: { user, token, expiresIn } }

GET /api/auth/me
- 200: { success, data: { id, email, fullName, role, isActive, tenant? } }

POST /api/auth/logout
- 200: { success, message }

## Tenants

GET /api/tenants/:tenantId
- Auth: same tenant or super_admin
- 200: { success, data: { id, name, subdomain, status, subscriptionPlan, maxUsers, maxProjects, createdAt, stats } }

PUT /api/tenants/:tenantId
- Auth: tenant_admin (name only) or super_admin
- Body: { name?, status?, subscriptionPlan?, maxUsers?, maxProjects? }
- 200: { success, message, data }

GET /api/tenants
- Auth: super_admin only
- Query: page, limit, status?, subscriptionPlan?
- 200: { success, data: { tenants: [...], pagination } }

## Users

GET /api/users/all
- Auth: super_admin only
- Query: page?, limit?, role?, search?, tenantSubdomain?
- 200: { success, data: { users: [{id, email, fullName, role, isActive, createdAt, tenantId, tenantName, tenantSubdomain}], total, pagination } }
- Description: Super admin can view all users across all tenants in the system

POST /api/tenants/:tenantId/users
- Auth: tenant_admin only
- Body: { email, password, fullName, role?('user'|'tenant_admin') }
- 201: { success, message, data: user }

GET /api/tenants/:tenantId/users
- Auth: same tenant (or super_admin)
- Query: search?, role?, page?, limit?
- 200: { success, data: { users, total, pagination } }

PUT /api/users/:userId
- Auth: tenant_admin (full) OR self (fullName only)
- Body: { fullName?, role?, isActive? }
- 200: { success, message, data }

DELETE /api/users/:userId
- Auth: tenant_admin only, cannot delete self
- 200: { success, message }

## Projects

POST /api/projects
- Auth: required
- Body: { name, description?, status?('active'|'archived'|'completed') }
- 201: { success, data: project }

GET /api/projects
- Auth: required
- Query: status?, search?, page?, limit?
- 200: { success, data: { projects, total, pagination } }

PUT /api/projects/:projectId
- Auth: tenant_admin or creator
- Body: { name?, description?, status? }
- 200: { success, message, data }

DELETE /api/projects/:projectId
- Auth: tenant_admin or creator
- 200: { success, message }

## Tasks

POST /api/projects/:projectId/tasks
- Auth: required
- Body: { title, description?, assignedTo?, priority?('low'|'medium'|'high'), dueDate? }
- 201: { success, data: task }

GET /api/projects/:projectId/tasks
- Auth: required
- Query: status?, assignedTo?, priority?, search?, page?, limit?
- 200: { success, data: { tasks, total, pagination } }

PATCH /api/tasks/:taskId/status
- Auth: required
- Body: { status: 'todo'|'in_progress'|'completed' }
- 200: { success, data }

PUT /api/tasks/:taskId
- Auth: required
- Body: { title?, description?, status?, priority?, assignedTo?(uuid|null), dueDate?(date|null) }
- 200: { success, message, data }

DELETE /api/tasks/:taskId
- Auth: required
- 200: { success, message }

## Health

GET /api/health
- 200: { status: 'ok', database: 'connected' }
- 503: { status: 'initializing'|'error', database: 'connected'|'disconnected' }
