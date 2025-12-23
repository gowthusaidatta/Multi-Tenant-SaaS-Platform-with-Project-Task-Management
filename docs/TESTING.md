# Testing Guide

## Overview

This document describes the testing strategy and how to test the Multi-Tenant SaaS Platform.

## Manual Testing

### 1. Docker Environment Testing

**Start the application:**
```bash
docker-compose down -v
docker-compose up -d --build
```

**Verify all services are running:**
```bash
docker-compose ps
```

Expected output: All services should show "Up" status.

**Check health endpoint:**
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-12-23T..."
}
```

### 2. Authentication Testing

**Test Tenant Registration:**
```bash
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Test Company",
    "subdomain": "testco",
    "adminEmail": "admin@testco.com",
    "adminPassword": "Test@1234",
    "adminFullName": "Test Admin"
  }'
```

Expected: 201 Created with tenant and admin user details.

**Test Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo@123",
    "tenantSubdomain": "demo"
  }'
```

Expected: 200 OK with JWT token.

**Test Get Current User:**
```bash
# Save token from login response
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Expected: 200 OK with user and tenant details.

### 3. Tenant Management Testing

**Get Tenant Details:**
```bash
curl -X GET http://localhost:5000/api/tenants/TENANT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Update Tenant (as tenant_admin):**
```bash
curl -X PUT http://localhost:5000/api/tenants/TENANT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Company Name"
  }'
```

### 4. User Management Testing

**Create User:**
```bash
curl -X POST http://localhost:5000/api/tenants/TENANT_ID/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@demo.com",
    "password": "NewUser@123",
    "fullName": "New User",
    "role": "user"
  }'
```

**List Users:**
```bash
curl -X GET http://localhost:5000/api/tenants/TENANT_ID/users \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Project Management Testing

**Create Project:**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Testing project creation"
  }'
```

**List Projects:**
```bash
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

**Update Project:**
```bash
curl -X PUT http://localhost:5000/api/projects/PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Project Name",
    "status": "active"
  }'
```

### 6. Task Management Testing

**Create Task:**
```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Testing task creation",
    "priority": "high",
    "assignedTo": "USER_ID"
  }'
```

**List Tasks:**
```bash
curl -X GET http://localhost:5000/api/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer $TOKEN"
```

**Update Task Status:**
```bash
curl -X PATCH http://localhost:5000/api/tasks/TASK_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

### 7. Data Isolation Testing

**Test Cross-Tenant Access:**
1. Login as user from Tenant A
2. Try to access projects from Tenant B
3. Expected: 403 Forbidden

```bash
# Login as Tenant A user
TOKEN_A="..."

# Try to access Tenant B's resources
curl -X GET http://localhost:5000/api/projects/TENANT_B_PROJECT_ID \
  -H "Authorization: Bearer $TOKEN_A"
```

Expected: 403 or 404 (depending on implementation).

### 8. Authorization Testing

**Test Unauthorized Access:**
```bash
# Without token
curl -X GET http://localhost:5000/api/projects

# Expected: 401 Unauthorized
```

**Test Insufficient Permissions:**
```bash
# Login as regular user (not admin)
# Try to create another user
curl -X POST http://localhost:5000/api/tenants/TENANT_ID/users \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d ...

# Expected: 403 Forbidden
```

### 9. Subscription Limits Testing

**Test User Limit:**
1. Create tenant with free plan (max 5 users)
2. Create 5 users successfully
3. Try to create 6th user
4. Expected: 403 with message "Subscription limit reached"

**Test Project Limit:**
1. Create tenant with free plan (max 3 projects)
2. Create 3 projects successfully
3. Try to create 4th project
4. Expected: 403 with message "Project limit reached"

### 10. Frontend Testing

**Open Application:**
```
http://localhost:3000
```

**Test Registration:**
1. Click "Register" or navigate to /register
2. Fill in tenant registration form
3. Submit
4. Verify success message
5. Login with new credentials

**Test Login:**
1. Navigate to /login
2. Enter credentials
3. Enter subdomain
4. Submit
5. Verify redirect to dashboard

**Test Dashboard:**
1. Verify statistics cards display correct counts
2. Verify recent projects list
3. Verify task list shows assigned tasks

**Test Projects:**
1. Navigate to /projects
2. Create new project
3. View project details
4. Create tasks within project
5. Update task status

**Test Users (as tenant_admin):**
1. Navigate to /users
2. Create new user
3. Verify user appears in list
4. Update user details

**Test Role-Based UI:**
1. Login as different roles
2. Verify menu items visible/hidden based on role
3. Super admin should see "Tenants" menu
4. Regular user should not see "Users" menu

## Automated Testing (Future Enhancement)

### Unit Tests
- Test individual functions
- Test middleware
- Test utility functions

### Integration Tests
- Test API endpoints
- Test database operations
- Test authentication flow

### End-to-End Tests
- Test complete user journeys
- Test cross-browser compatibility
- Test responsive design

### Example Test Setup
```javascript
// Example using Jest
describe('Authentication', () => {
  test('should register new tenant', async () => {
    const response = await request(app)
      .post('/api/auth/register-tenant')
      .send({
        tenantName: 'Test Org',
        subdomain: 'test',
        adminEmail: 'admin@test.com',
        adminPassword: 'Test@1234',
        adminFullName: 'Admin User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

## Test Data

Use credentials from `submission.json` for testing:

**Super Admin:**
- Email: superadmin@system.com
- Password: Admin@123

**Demo Tenant Admin:**
- Email: admin@demo.com
- Password: Demo@123
- Subdomain: demo

**Demo Users:**
- user1@demo.com / User@123
- user2@demo.com / User@123

## Common Issues

### Issue: Health check fails
- Wait 30-60 seconds for initialization
- Check backend logs: `docker-compose logs backend`
- Verify database is running: `docker-compose ps database`

### Issue: Login fails
- Verify subdomain is correct
- Check password (case-sensitive)
- Verify tenant is active

### Issue: 403 Forbidden errors
- Check user role
- Verify token is valid
- Check if user belongs to correct tenant

### Issue: Frontend can't connect to backend
- Verify backend is running
- Check VITE_API_URL in docker-compose.yml
- Check CORS configuration

## Test Checklist

Before submitting:
- [ ] All 19 API endpoints tested
- [ ] Authentication working for all user types
- [ ] Authorization enforced correctly
- [ ] Data isolation verified
- [ ] Subscription limits enforced
- [ ] Frontend pages accessible
- [ ] Role-based UI working
- [ ] Docker setup working from scratch
- [ ] Health check responding
- [ ] Seed data loaded correctly
