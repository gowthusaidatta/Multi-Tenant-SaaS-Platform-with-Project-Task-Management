# Multi-Tenant SaaS Platform – Project & Task Management

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-20-green.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-15-blue.svg)
![Docker](https://img.shields.io/badge/docker-compose-blue.svg)

A production-ready, multi-tenant SaaS application where multiple organizations (tenants) can independently register, manage teams, create projects, and track tasks with **strict data isolation**, **role-based access control (RBAC)**, and **subscription plan enforcement**.

The platform is fully dockerized and can be started with a single command for automated evaluation.

## 🚀 Live Demo & Deployment Status

- **Frontend (Vercel)**: https://frontend-six-gamma-78.vercel.app ✅ **Live**
- **Backend**: Runs via Docker - Use `docker-compose up -d` to start locally
- **Full Stack**: Frontend + Backend both work via Docker Compose ✅
- **Note**: Backend cloud deployment encountered free tier limits on Railway/Render. Docker deployment works perfectly for evaluation.

## 📋 Table of Contents

- [Target Audience](#target-audience)
- [Key Features](#key-features)
- [Multi-Tenancy Model](#multi-tenancy-model)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start-docker)
- [Test Credentials](#test-credentials)
- [API Documentation](#api-documentation)
- [Demo Video](#demo-video)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

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

```
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

```
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

All credentials used for testing and automated evaluation are documented in `submission.json`.

### Quick Login Credentials

#### Super Admin (Full System Access)
- **Email**: `superadmin@system.com`
- **Password**: `Admin@123`
- **Role**: Super Admin (Access all tenants)

#### Demo Tenant Admin
- **Email**: `admin@demo.com`
- **Password**: `Demo@123`
- **Subdomain**: `demo`
- **Role**: Tenant Admin (Manage own tenant)

#### Demo Tenant Users
- **User 1**
  - Email: `user1@demo.com`
  - Password: `User@123`
  - Subdomain: `demo`
  - Role: Regular User

- **User 2**
  - Email: `user2@demo.com`
  - Password: `User@123`
  - Subdomain: `demo`
  - Role: Regular User

### How to Login

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click **Login**
3. Enter email, password, and subdomain (e.g., `demo`)
4. Click **Submit**
5. You'll be redirected to the dashboard

### Register New Tenant

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click **Register**
3. Enter:
   - Organization Name (e.g., "My Company")
   - Subdomain (unique, lowercase, no spaces - e.g., "mycompany")
   - Admin Email
   - Admin Full Name
   - Password (min 8 characters)
4. Click **Register**
5. You'll be able to login with your new credentials



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



## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[API Documentation](docs/API.md)** - All 19 API endpoints with examples
- **[Architecture](docs/architecture.md)** - System architecture and database design
- **[PRD](docs/PRD.md)** - Product requirements and user personas
- **[Research](docs/research.md)** - Multi-tenancy analysis and tech stack justification
- **[Technical Spec](docs/technical-spec.md)** - Project structure and setup guide


## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## Acknowledgments

- Built as part of the Partnr GPP (Global Practical Program)
- Special thanks to the open-source community for the amazing tools and libraries


## Development Notes

* Repository contains 30+ meaningful commits showing incremental development
* All authorization, tenant isolation, and subscription limits are enforced server-side
* Frontend routes are protected and role-aware
* No production secrets are used (test/development values only)

---

**Repository**: https://github.com/gowthusaidatta/Multi-Tenant-SaaS-Platform-with-Project-Task-Management

**Author**: V V Satya Sai Datta Manikanta Gowthu
