# Testing Guide - Updated Frontend

## Quick Start

### Application URL
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Database:** localhost:5432

## Superadmin Testing (Full System Access)

### Test Credentials
- **Email:** super_admin
- **Password:** password

### Test Scenarios

#### 1. Admin Dashboard (`/admin`)
```
1. Login with superadmin credentials
2. Click "Admin" in navbar
3. Expected: See "System Administration" page with:
   - Total Tenants stat card
   - System Status card
   - List of all tenants in grid layout
   - "New Tenant" button
```

#### 2. Users Management (`/users`)
```
1. From Admin dashboard, click "Users" in navbar
2. Expected: See all system users from all tenants
3. Try: 
   - Search for a user
   - Filter by role
   - Tenant column should show which tenant each user belongs to
   - Click "+ Add User"
   - Select a tenant from dropdown
   - Fill in user details
   - Click "Add User"
```

#### 3. Projects Management (`/projects`)
```
1. Click "Projects" in navbar
2. Expected: See all projects from all tenants
3. Try:
   - Search for a project
   - Filter by status (Active, Archived, Completed)
   - Tenant info displayed in project cards
   - Click "+ New Project"
   - Select a tenant from dropdown
   - Fill in project details
   - Click "Create Project"
```

#### 4. Create New Tenant
```
1. Go to Admin dashboard
2. Click "+ New Tenant"
3. Fill in:
   - Tenant Name (required)
   - Email (optional)
   - Phone (optional)
4. Click "Create Tenant"
5. Verify new tenant appears in grid
```

## Regular User Testing (Single Tenant Access)

### Test Credentials
- **Email:** user@example.com
- **Password:** password

### Test Scenarios

#### 1. Dashboard
```
1. Login with regular user credentials
2. Should see Dashboard page
3. Note: "Admin" link should NOT be visible in navbar
```

#### 2. Users Page
```
1. If user has admin role: Click "Users" in navbar
2. Expected: Only see users from their tenant
3. Tenant dropdown NOT visible in "Add User" modal
4. User should be auto-assigned to their tenant
```

#### 3. Projects
```
1. Click "Projects" in navbar
2. Expected: Only see projects from their tenant
3. Projects list shows all projects
4. Click "View Details" to see tasks
5. Tenant column NOT visible (regular users)
```

## Known Data in Database

From seed data:
- **Superadmin User:** super_admin / password
- **Regular Users:** 5 total
- **Tenants:** 1 (default tenant)
- **Projects:** 4 total

## Feature Verification Checklist

### Visual Design
- [ ] Page headers have title and subtitle
- [ ] Navbar shows appropriate links based on role
- [ ] Color scheme is consistent (dark theme)
- [ ] Buttons have proper styling (primary, secondary, danger)
- [ ] Badges show appropriate colors (success, warning, danger, info)
- [ ] Tables and cards are responsive

### Functionality
- [ ] Search works on Users page
- [ ] Search works on Projects page
- [ ] Filter by role works on Users page
- [ ] Filter by status works on Projects page
- [ ] Modal appears when clicking "Add User" / "New Project" / "New Tenant"
- [ ] Modal closes when clicking X button
- [ ] Modal closes when clicking outside
- [ ] Form validation shows error messages
- [ ] User/Project/Tenant creation works
- [ ] Delete operations work with confirmation

### Superadmin Features
- [ ] Admin link visible only for superadmins
- [ ] Tenant selector appears in modals
- [ ] Can create users/projects in any tenant
- [ ] Can see all system data

### Regular User Features
- [ ] Admin link NOT visible
- [ ] Tenant selector NOT visible in modals
- [ ] Only see tenant's data
- [ ] Can create users/projects (if admin role)

### Error Handling
- [ ] Error messages display properly
- [ ] Missing required fields show errors
- [ ] API errors are handled gracefully
- [ ] Loading indicators appear

### Responsive Design
- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] Forms stack properly
- [ ] Tables scroll horizontally on mobile

## Troubleshooting

### Frontend not loading?
```bash
# Check if frontend container is running
docker-compose ps

# Restart frontend
docker-compose restart frontend

# Check logs
docker-compose logs frontend
```

### Backend API not responding?
```bash
# Check backend container
docker-compose logs backend

# Verify health check
curl http://localhost:5000/health
```

### Database connection issues?
```bash
# Check database container
docker-compose logs database

# Verify connection
docker-compose exec database psql -U gpp -d gpp_saas -c "SELECT count(*) FROM users;"
```

## Performance Notes

- Initial load may take a few seconds
- Subsequent operations should be instant
- Modal overlays have smooth animations
- Table/grid renders efficiently with 50+ items
