# Research & System Design

## Multi-Tenancy Analysis (Shared DB + Shared Schema vs Separate Schema vs Separate DB)

Approach 1: Shared Database + Shared Schema (tenant_id column)
- Pros: Lowest operational overhead; single connection pool; shared migrations; easy cross-tenant analytics (when permitted); minimal resource footprint; fastest bootstrap.
- Cons: Strong discipline required to enforce tenant filters; higher blast radius if bugs in queries; noisy neighbor risks without rate-limits; harder per-tenant backup/restore; index bloat requires careful tuning.
- Operational Notes: Add `tenant_id` foreign keys everywhere; implement query guards; use RLS optionally; add composite unique constraints (tenant_id, email); create partial indexes by tenant usage patterns; enforce plan limits in application layer.

Approach 2: Shared Database + Separate Schema (per-tenant)
- Pros: Good isolation within shared database; easier per-tenant backup/restore; simpler to offboard tenants; reduced risk of cross-tenant leaks.
- Cons: Migrations become complex and slow for many tenants; number of schemas can explode; connection management overhead; higher metadata churn; harder to perform global analytics without federation; requires automation for provisioning/patching.
- Operational Notes: Schema templating, schema version table per tenant, background migrator; potential connection limits on managed Postgres; careful naming.

Approach 3: Separate Database per Tenant
- Pros: Strongest isolation; clear billing boundaries; easy data residency policies; per-tenant scaling; low leak risk.
- Cons: Highest cost and operational complexity; migration fan-out; orchestration tooling required; cross-tenant analytics difficult; provision and lifecycle management heavy; noisy for small tenants.
- Operational Notes: Use service catalogue for DB lifecycle; employ connection proxies; template DB creation; automated backup policies per DB.

Chosen Approach: Shared Database + Shared Schema
- Rationale: The evaluation constraints prioritize fast setup, small footprint, and automated migrations/seeds. A shared schema with strict `tenant_id` enforcement is the simplest viable architecture that still provides robust isolation when implemented correctly. It keeps Docker setup small, ensures one-click evaluation, and allows easy seeding.
- Controls to ensure isolation: All queries parameterized and filtered by `tenant_id` where applicable; authorization middleware checks role and tenant; for tasks, tenant_id derived from project (not JWT) to prevent cross-tenant injection; audit logs track CRUD; composite uniqueness for emails.

## Technology Stack Justification

Backend: Node.js + Express
- Why: Ubiquitous, fast iteration, thriving ecosystem; simple stateless JWT flows; easy Dockerization; small image with Node 20 Alpine.
- Alternatives: NestJS (opinionated, heavier), Fastify (faster, but Express suffices), Django/Flask (Python alternative), Spring Boot (Java, heavier for this scope).

Database: PostgreSQL 15
- Why: Mature, ACID, rich SQL, enums, JSONB; robust indexing and constraints; easy Docker support; `pg_isready` healthcheck.
- Alternatives: MySQL/MariaDB (less robust types), MongoDB (non-relational; weaker transactions), CockroachDB (distributed, overkill here).

Auth: JWT (HS256)
- Why: Stateless; aligns with Docker scaling; minimal runtime coupling; 24h expiry per requirement.
- Alternatives: Sessions table + cookies (stateful), OAuth/OIDC (external provider complexity), PASETO (alternative token format).

Frontend: React + Vite
- Why: Fast dev server; quick bootstrap; simple routing; easy Dockerization; minimal config.
- Alternatives: Next.js (SSR/SSG—heavier), Vue/Angular (equally valid), CRA (deprecated tooling).

Containerization: Docker + Compose
- Why: Mandated; guarantees consistent evaluation; health checks; volumes for DB persistence; service DNS (backend/database/frontend) simplify URLs.

## Security Considerations

Data Isolation
- Strict use of `tenant_id` filtering; never trust client-supplied tenant; derive from JWT or project; super_admin is the only role allowed to cross tenants; schema constraints enforce referential integrity.

Authentication & Authorization
- JWT payload restricted to { userId, tenantId, role } only; 24h expiry; tokens validated on every request; role guard for privileged routes; tenant checks in all handlers.

Password Hashing
- Bcrypt with cost factor 10; no plaintext storage; comparisons via `bcrypt.compare`; seeds generated programmatically to ensure proper hashing.

API Security
- CORS restricted via `FRONTEND_URL`; parameterized queries prevent SQL injection; minimal error messages to avoid leakage; audit logging for CREATE/UPDATE/DELETE + auth events; health endpoint discloses limited info and returns ready only after seeding.

Operational Security
- Environment variables for credentials (checked into repo with dev/test values only for evaluation compliance); no production secrets; minimal base images; non-root user could be added for production hardening; backups recommended for production.
