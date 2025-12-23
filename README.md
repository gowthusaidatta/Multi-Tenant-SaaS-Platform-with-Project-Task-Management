# Multi-Tenant SaaS Platform – Project & Task Management

A production-ready, multi-tenant SaaS application where multiple organizations (tenants) can independently register, manage teams, create projects, and track tasks with **strict data isolation**, **role-based access control (RBAC)**, and **subscription plan enforcement**.

The platform is fully dockerized and can be started with a single command for automated evaluation.

## Target Audience
- Small to mid-sized organizations managing internal projects and teams
- SaaS startups requiring strict tenant-isolated architectures
- Enterprises needing role-based access, audit logging, and scalable design


## Key Features
- Multi-tenancy with strict `tenant_id`-based data isolation
- Subdomain-based tenant identification during login
- JWT-based authentication (24-hour expiry)
- Role-Based Access Control (super_admin, tenant_admin, user)
- Subscription plans with enforced limits (free, pro, enterprise)
- Project and task management with assignment and status tracking
- Audit logging for critical system actions
- Health check endpoint: `/api/health`
- Fully dockerized architecture (database, backend, frontend)
- One-command startup using Docker Compose



## Multi-Tenancy Model
- **Architecture**: Shared database, shared schema
- **Isolation Strategy**:
  - All tenant-scoped records include a `tenant_id`
  - `tenant_id` is derived exclusively from JWT claims (never from client input)
  - All queries are filtered by `tenant_id` at the API layer
- **Super Admin Handling**:
  - Super admins have `tenant_id = NULL`
  - Super admins can access all tenants without isolation filters


## Technology Stack
### Backend
- Node.js 20
- Express.js 4.x
- PostgreSQL client (`pg`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcrypt`)

### Database
- PostgreSQL 15

### Frontend
- React 18
- Vite 5
- React Router

### DevOps & Tooling
- Docker
- Docker Compose v2



## Architecture Overview
Detailed documentation and diagrams are available in the `docs` directory:

- **System Architecture Diagram**: `docs/images/system-architecture.png`
- **Database ERD**: `docs/images/database-erd.png`
- **API Documentation**: `docs/API.md`


## Project Structure


.
├── backend/                 # Express API, migrations, seed runner
├── frontend/                # React (Vite) frontend application
├── docs/                    # Research, PRD, architecture, technical specs
│   ├── images/
│   ├── API.md
│   ├── PRD.md
│   ├── architecture.md
│   ├── research.md
│   └── technical-spec.md
├── docker-compose.yml       # Docker orchestration (database, backend, frontend)
├── submission.json          # Test credentials for automated evaluation
└── README.md



## Environment Variables

All required environment variables are defined **either directly in `docker-compose.yml` or via committed `.env` files** to support automated evaluation.

### Backend
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`

### Frontend
- `VITE_API_URL` (or `REACT_APP_API_URL`)

> In the Docker network, services communicate using service names:
> `database`, `backend`, and `frontend` (not `localhost`).


## Quick Start (Docker)

### Prerequisites
- Docker Engine + Docker Compose  
  OR  
- Docker Desktop (Windows/macOS)

### Start the Application

docker-compose up -d --build


### Verify Backend Health


curl http://localhost:5000/api/health


Expected response:

{
  "status": "ok",
  "database": "connected"
}


> The health check returns `ok` **only after** database connection, migrations, and seed data loading are complete.

### Access the Application

* Frontend: [http://localhost:3000](http://localhost:3000)



## Test Credentials

All credentials used for automated evaluation are documented in `submission.json`.

Example seed users:

* **Super Admin**

  * Email: `superadmin@system.com`
  * Password: `Admin@123`

* **Demo Tenant Admin**

  * Email: `admin@demo.com`
  * Password: `Demo@123`



## API Documentation

All **19 required API endpoints** are fully documented with request/response examples in:


docs/API.md

The documentation covers:

* Authentication & authorization
* Tenant management
* User management
* Project management
* Task management
* Error responses and status codes



## Database Initialization

* Database migrations run automatically when the backend container starts
* Seed data is loaded automatically after migrations
* No manual commands are required
* Initialization is fully compatible with automated evaluation scripts


## Development Notes

* Repository contains 30+ meaningful commits showing incremental development
* All authorization, tenant isolation, and subscription limits are enforced server-side
* Frontend routes are protected and role-aware
* No production secrets are used (test/development values only)
