# Multi-Tenant SaaS Platform - Project & Task Management

A production-ready, multi-tenant SaaS application where multiple organizations (tenants) can register, manage teams, create projects, and track tasks with complete data isolation, RBAC, and subscription limits.

- One-command startup via Docker Compose
- PostgreSQL database with automatic migrations and seed data on startup
- Express.js backend with JWT auth, RBAC, audit logs, 19 API endpoints
- React (Vite) frontend with protected routes and role-based UI

## Features
- Multi-tenancy with strict tenant_id isolation
- Subdomain-based tenant identification for login
- JWT authentication (24h) and RBAC (super_admin, tenant_admin, user)
- Subscription plans: free, pro, enterprise (limits enforced)
- Projects and tasks with assignment and status management
- Audit logging of critical actions
- Health check endpoint `/api/health`
- Fully dockerized: database, backend, frontend

## Tech Stack
- Backend: Node.js 20, Express.js, `pg`, `bcrypt`, `jsonwebtoken`
- Database: PostgreSQL 15
- Frontend: React + Vite, React Router
- Containerization: Docker, Docker Compose

## Architecture Overview
See docs and diagrams:
- System Architecture: docs/images/system-architecture.png
- Database ERD: docs/images/database-erd.png
- API Reference: docs/API.md

## Quick Start (Docker)
Prerequisites: Docker Desktop (Windows/macOS) or Docker Engine + Compose

1) Start all services
```bash
docker-compose up -d --build
```

2) Verify health
```bash
curl http://localhost:5000/api/health
```
Expected: `{ "status": "ok", "database": "connected" }`

3) Open frontend
- http://localhost:3000

4) Log in using credentials in submission.json
- Super Admin: superadmin@system.com / Admin@123
- Demo Tenant Admin: admin@demo.com / Demo@123

## Project Structure
- backend: Express API, migrations, seed runner
- frontend: React app with protected routes and pages
- docs: Research, PRD, architecture, technical spec, API spec
- submission.json: Test credentials for evaluation

```
.
├── backend/
├── frontend/
├── docs/
│   ├── images/
│   ├── API.md
│   ├── PRD.md
│   ├── architecture.md
│   ├── research.md
│   └── technical-spec.md
├── docker-compose.yml
├── submission.json
└── README.md
```

## Environment Variables
All required variables are defined in docker-compose.yml for evaluation:
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRET, JWT_EXPIRES_IN
- PORT, NODE_ENV
- FRONTEND_URL (CORS)
- VITE_API_URL/REACT_APP_API_URL (frontend API base)

In Docker network, services communicate via names: `database`, `backend`, `frontend`.

## API Documentation
See full documentation in docs/API.md. Swagger/Postman can be added; for this submission, markdown documentation covers all endpoints with payloads and responses.

## Notes
- Automatic migrations and seeds run when the backend starts.
- Health reports "ok" only after DB is connected and seeding completes.
- All data isolation, authorization, and plan limits enforced server-side.

## Demo Video
Add your YouTube demo link here.
