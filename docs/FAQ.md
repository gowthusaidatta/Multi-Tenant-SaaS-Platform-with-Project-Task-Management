# Frequently Asked Questions (FAQ)

## General Questions

### What is multi-tenancy?
Multi-tenancy is an architecture where a single instance of software serves multiple customers (tenants). Each tenant's data is isolated and invisible to other tenants.

### Which multi-tenancy approach does this project use?
This project uses **Shared Database, Shared Schema** with tenant_id column. All tenants share the same database and tables, but each record is tagged with a tenant_id for isolation.

### Why not use separate databases per tenant?
Separate databases provide stronger isolation but are more complex to maintain. The shared schema approach is simpler, more cost-effective, and sufficient for most SaaS applications with proper security measures.

## Authentication & Authorization

### How long do JWT tokens last?
JWT tokens expire after 24 hours. Users must login again after expiration.

### Can I change the token expiry time?
Yes, set the `JWT_EXPIRES_IN` environment variable in docker-compose.yml (e.g., "12h", "48h", "7d").

### What's the difference between roles?
- **super_admin**: System administrator, can access all tenants, not associated with any tenant
- **tenant_admin**: Organization administrator, full control over their tenant, can manage users
- **user**: Regular team member, can create/edit projects and tasks

### Can a user belong to multiple tenants?
No, each user belongs to exactly one tenant. The same email can exist in different tenants, but they are separate user accounts.

## Multi-Tenancy

### How is data isolation ensured?
1. Every query includes `WHERE tenant_id = ?`
2. tenant_id comes from JWT token, never from client input
3. Authorization middleware enforces tenant boundaries
4. Super admin accounts have tenant_id = NULL

### Can tenants access each other's data?
No. All queries are filtered by tenant_id. Attempting to access another tenant's data returns 403 Forbidden.

### What happens if I try to access another tenant's project?
The system will return either 404 (not found) or 403 (forbidden), depending on implementation. The project won't be accessible.

## Subscription Plans

### What are the subscription plan limits?
- **Free**: 5 users, 3 projects
- **Pro**: 25 users, 15 projects
- **Enterprise**: 100 users, 50 projects

### What happens when I reach the limit?
API returns 403 Forbidden with message "Subscription limit reached". You cannot create more resources until you upgrade or remove existing ones.

### Can I customize plan limits?
Yes, super_admin can update tenant's max_users and max_projects via the Update Tenant API.

### How do I upgrade a tenant's plan?
Super admin can use the PUT /api/tenants/:id endpoint to change subscription_plan and limits.

## Database

### Which database does the project use?
PostgreSQL 15 (via Docker).

### Can I use a different database?
The code uses PostgreSQL-specific features. You could adapt it for MySQL/MariaDB, but would need to modify queries and data types.

### How are migrations handled?
Migrations run automatically when the backend service starts. They're SQL files in backend/migrations/ executed in order.

### What is the app_status table for?
It tracks migration and seed status to prevent running them multiple times.

## Docker

### Why is Docker mandatory?
Docker ensures consistent environments across development, testing, and evaluation. It eliminates "works on my machine" problems.

### Can I run without Docker?
Yes, for development, but Docker is mandatory for submission. You'd need to install Node.js, PostgreSQL, and set up environment variables manually.

### What ports does the application use?
- Database: 5432
- Backend API: 5000
- Frontend: 3000

### How do I reset the database?
```bash
docker-compose down -v  # -v removes volumes
docker-compose up -d
```

### Why use service names instead of localhost?
In Docker networks, containers communicate using service names (database, backend, frontend). Each container has its own localhost, so using localhost would reference the wrong service.

## Frontend

### Which frontend framework is used?
React 18 with Vite as the build tool.

### Why Vite instead of Create React App?
Vite is faster, more modern, and has better development experience with Hot Module Replacement (HMR).

### How does the frontend connect to backend?
Via the VITE_API_URL environment variable, which should be `http://backend:5000/api` in Docker.

### Can I use a different frontend framework?
Yes, you could rebuild the frontend in Vue, Angular, or Svelte. The backend API is framework-agnostic.

## API

### How many API endpoints are there?
19 required endpoints covering authentication, tenant management, user management, project management, and task management.

### What response format do APIs use?
```json
{
  "success": boolean,
  "message": "optional message",
  "data": { ... }
}
```

### How do I test the APIs?
Use curl, Postman, or any HTTP client. See docs/TESTING.md for examples.

### Is there API rate limiting?
Not in the base implementation, but it's recommended for production (see docs/SECURITY.md).

## Development

### How do I add a new migration?
1. Create a new SQL file in backend/migrations/ with incremental number
2. Write your DDL statements
3. Restart backend or wait for auto-restart

### How do I add new seed data?
Edit backend/src/utils/seedRunner.js and add your data. Use the pattern of checking if data exists first to avoid duplicates.

### How do I add a new API endpoint?
1. Add route in appropriate file in backend/src/routes/
2. Add authentication middleware if needed
3. Add authorization checks
4. Implement business logic
5. Document in docs/API.md

### How do I add a new frontend page?
1. Create component in frontend/src/pages/
2. Add route in frontend/src/App.jsx
3. Wrap with ProtectedRoute if auth required
4. Add to navigation menu if needed

## Troubleshooting

### Services won't start
Check if ports are in use, review Docker logs with `docker-compose logs`.

### Health check fails
Wait 30-60 seconds for initialization. Check backend logs for migration/seed errors.

### Login fails
Verify credentials match submission.json, check tenant subdomain, ensure tenant is active.

### Frontend can't connect to backend
Verify VITE_API_URL is set to `http://backend:5000/api` in docker-compose.yml.

See docs/TROUBLESHOOTING.md for detailed solutions.

## Submission

### What do I need to submit?
1. Public GitHub repository
2. submission.json with test credentials
3. All documentation files
4. YouTube demo video link
5. Working Docker setup

### How many commits are required?
Minimum 30 meaningful commits showing development progress.

### What should be in the demo video?
Architecture explanation, live demo (registration, login, CRUD operations), data isolation demonstration, code walkthrough. Duration: 5-12 minutes.

### Can I use production secrets in the repository?
No! Only use test/development values. Production secrets should never be committed.

## Contact

For more questions:
- Check existing documentation in docs/ folder
- Review TROUBLESHOOTING.md
- Create a GitHub issue
