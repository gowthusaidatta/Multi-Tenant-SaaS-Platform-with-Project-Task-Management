# Troubleshooting Guide

Common issues and solutions for the Multi-Tenant SaaS Platform.

## Docker Issues

### Services won't start

**Symptom:** `docker-compose up -d` fails or services show "Exited" status

**Solutions:**
1. Check if ports are already in use:
   ```bash
   netstat -ano | findstr :5432
   netstat -ano | findstr :5000
   netstat -ano | findstr :3000
   ```
   
2. Stop conflicting services or change ports in docker-compose.yml

3. Check Docker logs:
   ```bash
   docker-compose logs database
   docker-compose logs backend
   docker-compose logs frontend
   ```

### Database connection fails

**Symptom:** Backend health check fails, logs show "ECONNREFUSED"

**Solutions:**
1. Verify database service is healthy:
   ```bash
   docker-compose ps database
   ```
   
2. Check database logs:
   ```bash
   docker-compose logs database
   ```

3. Verify DB_HOST is set to 'database' (not 'localhost') in docker-compose.yml

4. Wait longer - database initialization can take 30-60 seconds

### Migrations don't run

**Symptom:** Tables don't exist, seed data missing

**Solutions:**
1. Check backend logs for migration errors:
   ```bash
   docker-compose logs backend | Select-String "migration"
   ```

2. Manually run migrations (if needed):
   ```bash
   docker-compose exec backend node src/index.js
   ```

3. Reset database and try again:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

## API Issues

### 401 Unauthorized

**Symptom:** API returns 401 even with valid token

**Solutions:**
1. Check if token is expired (24-hour validity)
2. Verify Authorization header format: `Bearer <token>`
3. Check JWT_SECRET matches between login and verification
4. Re-login to get fresh token

### 403 Forbidden

**Symptom:** API returns 403 for certain operations

**Solutions:**
1. Verify user has required role:
   - super_admin: All operations
   - tenant_admin: Tenant management, user management
   - user: Limited to projects/tasks

2. Check if resource belongs to user's tenant

3. Verify subscription limits not reached

### 409 Conflict

**Symptom:** Cannot create resource (user, tenant, project)

**Solutions:**
1. For tenants: Subdomain already exists - choose different subdomain
2. For users: Email already exists in that tenant
3. Check if resource already exists

### CORS Errors

**Symptom:** Frontend requests blocked by CORS policy

**Solutions:**
1. Verify FRONTEND_URL in docker-compose.yml backend section
2. Should be `http://frontend:3000` in Docker, not `localhost`
3. Check CORS configuration in backend (src/app.js)
4. Clear browser cache and retry

## Frontend Issues

### Blank page / White screen

**Symptom:** Frontend loads but shows nothing

**Solutions:**
1. Check browser console for errors (F12)
2. Verify VITE_API_URL is set correctly in docker-compose.yml
3. Check if backend is accessible:
   ```bash
   curl http://localhost:5000/api/health
   ```

### API calls fail

**Symptom:** Network errors in browser console

**Solutions:**
1. Verify backend is running: `docker-compose ps backend`
2. Check VITE_API_URL environment variable
3. For Docker: Should be `http://backend:5000/api`
4. For local dev: Should be `http://localhost:5000/api`

### Login fails

**Symptom:** Login form submits but returns error

**Solutions:**
1. Verify credentials match seed data in submission.json
2. Check subdomain is correct
3. Verify tenant status is 'active'
4. Check backend logs for authentication errors

### Pages not loading

**Symptom:** 404 errors or pages don't render

**Solutions:**
1. Verify React Router is configured correctly
2. Check protected routes have authentication
3. Clear browser cache
4. Check frontend logs: `docker-compose logs frontend`

## Database Issues

### Cannot connect to database

**Symptom:** `psql` or pgAdmin cannot connect

**Solutions:**
1. Verify database service is running: `docker-compose ps database`
2. Use connection details:
   - Host: localhost (from host machine) or database (from other containers)
   - Port: 5432
   - Database: saas_db
   - User: postgres
   - Password: postgres

### Seed data missing

**Symptom:** Login with seed credentials fails

**Solutions:**
1. Check if seeds ran successfully:
   ```bash
   docker-compose logs backend | Select-String "seed"
   ```

2. Verify app_status table:
   ```bash
   docker-compose exec database psql -U postgres -d saas_db -c "SELECT * FROM app_status;"
   ```

3. Manually run seeds if needed:
   ```bash
   docker-compose exec backend node -e "require('./src/utils/seedRunner.js').runSeeds()"
   ```

### Tables don't exist

**Symptom:** SQL errors about missing tables

**Solutions:**
1. Check if migrations ran:
   ```bash
   docker-compose logs backend | Select-String "migration"
   ```

2. List tables:
   ```bash
   docker-compose exec database psql -U postgres -d saas_db -c "\dt"
   ```

3. Reset and rebuild:
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

## Authentication Issues

### Token expired

**Symptom:** API suddenly returns 401 after working

**Solutions:**
1. Tokens expire after 24 hours
2. Simply login again to get fresh token
3. Implement auto-refresh in frontend (future enhancement)

### Cross-tenant access

**Symptom:** Can see data from other tenants

**Solutions:**
1. This should NOT happen - it's a critical bug
2. Check tenant_id filtering in all queries
3. Verify JWT token contains correct tenantId
4. Review authorization middleware

## Performance Issues

### Slow API responses

**Solutions:**
1. Check database indexes are created
2. Review database query plans
3. Monitor resource usage: `docker stats`
4. Consider adding Redis for caching
5. Optimize N+1 queries with proper joins

### High memory usage

**Solutions:**
1. Check for memory leaks in backend
2. Review database connection pooling
3. Monitor with: `docker stats`
4. Increase container resources if needed

## Development Issues

### Hot reload not working

**Symptom:** Code changes don't reflect immediately

**Solutions:**
1. For backend: Restart container: `docker-compose restart backend`
2. For frontend: Vite should auto-reload, check console for errors
3. Verify volume mounts in docker-compose.yml

### Dependencies not installing

**Symptom:** npm install fails or modules missing

**Solutions:**
1. Delete node_modules and package-lock.json
2. Clear Docker cache: `docker-compose build --no-cache`
3. Check package.json for syntax errors

## Getting Help

If issues persist:
1. Check all logs: `docker-compose logs`
2. Review configuration in docker-compose.yml
3. Verify environment variables
4. Test with fresh database: `docker-compose down -v && docker-compose up -d`
5. Check GitHub issues or create new one with:
   - Error messages
   - Steps to reproduce
   - Docker logs
   - System information
