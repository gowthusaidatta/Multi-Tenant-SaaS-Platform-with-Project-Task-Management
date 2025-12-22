# Technical Specification

## Project Structure

backend/
  src/
    controllers/ (logic grouped in route files for this version)
    middleware/
    routes/
    utils/
    config.js
    app.js
    index.js
  migrations/
  seeds/ (seed logic implemented in code)
  package.json
  Dockerfile

frontend/
  src/
    pages/
    routes/
    api.js
    auth.jsx
    App.jsx
    main.jsx
  index.html
  vite.config.js
  package.json
  Dockerfile

docs/
  API.md
  PRD.md
  architecture.md
  research.md
  images/

## Development Setup

- Node.js: v20+
- Docker: latest Desktop
- PostgreSQL: 15 (via Docker)

### Environment Variables (Backend)
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRET (>=32 chars), JWT_EXPIRES_IN (e.g., 24h)
- PORT (5000), NODE_ENV (development)
- FRONTEND_URL (http://localhost:3000 or http://frontend:3000 in Docker)

### Local Run (without Docker)
1. Start PostgreSQL locally and create database `saas_db`.
2. `cd backend && npm install`
3. Set env vars or create `.env` (see README)
4. `npm start` (runs migrations + seeds automatically)
5. `cd ../frontend && npm install && npm run dev`

### Docker Run
- `docker-compose up -d --build`
- Health: `curl http://localhost:5000/api/health`
- Frontend: http://localhost:3000

## Coding Conventions
- ES modules, async/await, minimal dependencies
- Consistent API response shape: { success, message?, data? }
- Input validation via express-validator where critical
- Authorization via middleware + explicit checks in handlers
- DB access via parameterized queries only

## Multi-Tenancy Enforcement
- All queries filtered by `tenant_id` from JWT for tenant users
- Super admin bypasses tenant filters when listing tenants
- Tasks derive `tenant_id` from project, not JWT

## Subscription Limits
- Plan limits centralized in config (free/pro/enterprise)
- Enforced in user and project creation endpoints

## Database
- Migrations: SQL files applied in order with `schema_migrations`
- Seeds: idempotent seed runner checks `app_status.seed_status`
- UUID primary keys, proper FKs, necessary indexes

## Security
- Passwords hashed with bcrypt (cost=10)
- JWT with HS256, 24h expiry, payload: { userId, tenantId, role }
- CORS restricted to `FRONTEND_URL`
- Parameterized queries prevent SQL injection
- Audit logging on CREATE/UPDATE/DELETE and auth events

## Testing Strategy (suggested)
- Unit test services and route handlers (Jest)
- Integration test APIs with Supertest against a test DB
- E2E smoke via Docker Compose + health + sample logins

## Deployment Notes
- Use multi-stage Docker for smaller images
- Set secure JWT secret per environment
- Add HTTPS termination via reverse proxy (e.g., Nginx, Traefik)
- Configure database backups and monitoring
