# Product Requirements Document (PRD)

## Personas

1) Super Admin
- Role: System administrator across all tenants
- Responsibilities: Onboard tenants, manage plans, monitor system health, audit
- Goals: Ensure platform reliability and governance
- Pain points: Cross-tenant visibility, security, auditability

2) Tenant Admin
- Role: Organization administrator
- Responsibilities: Manage users, projects, subscription usage
- Goals: Keep team productive, meet plan limits, simple administration
- Pain points: Onboarding, access control, reporting

3) End User
- Role: Team member
- Responsibilities: Manage own tasks, collaborate on projects
- Goals: Clear task list, simple UI, fast performance
- Pain points: Overwhelming interfaces, noisy notifications

## Functional Requirements

Auth (FR-001..FR-004)
- FR-001: The system shall allow tenant registration with unique subdomain.
- FR-002: The system shall authenticate users using JWT with 24-hour expiry.
- FR-003: The system shall return current user profile via `/api/auth/me`.
- FR-004: The system shall support super_admin login without tenant subdomain.

Tenant (FR-005..FR-007)
- FR-005: The system shall isolate data by tenant_id for all records.
- FR-006: The system shall allow tenant_admin to update tenant name.
- FR-007: The system shall allow super_admin to list and manage all tenants.

Users (FR-008..FR-011)
- FR-008: The system shall allow tenant_admin to invite/create users.
- FR-009: The system shall enforce per-tenant unique email addresses.
- FR-010: The system shall allow tenant_admin to deactivate users.
- FR-011: The system shall prevent tenant_admin from deleting themselves.

Projects (FR-012..FR-015)
- FR-012: The system shall allow authenticated users to create projects within plan limits.
- FR-013: The system shall allow listing, searching, and filtering projects per tenant.
- FR-014: The system shall allow project updates by creator or tenant_admin.
- FR-015: The system shall allow project deletion by creator or tenant_admin.

Tasks (FR-016..FR-019)
- FR-016: The system shall allow task creation under a project; tenant_id derives from project.
- FR-017: The system shall allow listing tasks with status/priority/assignee filters.
- FR-018: The system shall allow updating task status by any tenant user.
- FR-019: The system shall allow full task updates including assignment.

## Non-Functional Requirements

- NFR-001 (Performance): 90% of API responses shall be < 200ms under nominal load.
- NFR-002 (Security): All passwords shall be hashed with bcrypt and JWT shall expire in 24h.
- NFR-003 (Scalability): The system shall support at least 100 concurrent users per node.
- NFR-004 (Availability): The system shall target 99% uptime in evaluation environment.
- NFR-005 (Usability): The frontend shall support desktop and mobile viewport widths.

## Acceptance Criteria
- One-command startup via Docker Compose
- `/api/health` ready only after migrations and seeds
- Provided credentials work and seed data present
- All required endpoints functional with RBAC and tenant isolation
