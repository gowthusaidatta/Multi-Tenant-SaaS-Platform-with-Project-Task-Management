# Architecture

## System Diagram
See docs/images/system-architecture.png for a high-level view of:
- Browser (client)
- Frontend (React via Vite dev server)
- Backend (Express API)
- PostgreSQL (database)
- Auth flow (JWT issuance on login, validation on each request)

## Database ERD
See docs/images/database-erd.png for entities and relationships:
- tenants (1) — (N) users
- tenants (1) — (N) projects — (N) tasks
- tasks (N) — (1) users via assigned_to (nullable)
- audit_logs captures actions across tenants/users/projects/tasks

## API Architecture
Base: /api

Auth
- POST /auth/register-tenant (public)
- POST /auth/login (public)
- GET /auth/me (auth)
- POST /auth/logout (auth)

Tenants
- GET /tenants/:tenantId (auth: same tenant or super_admin)
- PUT /tenants/:tenantId (auth: tenant_admin (name only) or super_admin)
- GET /tenants (auth: super_admin)

Users
- POST /tenants/:tenantId/users (auth: tenant_admin)
- GET /tenants/:tenantId/users (auth: same tenant)
- PUT /users/:userId (auth: tenant_admin or self (partial))
- DELETE /users/:userId (auth: tenant_admin, not self)

Projects
- POST /projects (auth)
- GET /projects (auth)
- PUT /projects/:projectId (auth: tenant_admin or creator)
- DELETE /projects/:projectId (auth: tenant_admin or creator)

Tasks
- POST /projects/:projectId/tasks (auth)
- GET /projects/:projectId/tasks (auth)
- PATCH /tasks/:taskId/status (auth)
- PUT /tasks/:taskId (auth)
- DELETE /tasks/:taskId (auth)

Health
- GET /health (public)
