# 🎯 Quick Reference Guide

## Login Credentials

### Superadmin Account
```
Email:    super_admin
Password: password
Role:     super_admin
Tenant:   System (null)
```

### Regular User Account
```
Email:    user@example.com
Password: password
Role:     user
Tenant:   default-tenant-1
```

### Tenant Admin Account
```
Email:    admin@example.com
Password: password
Role:     tenant_admin
Tenant:   default-tenant-1
```

---

## Navigation Map

### For Superadmin
```
Dashboard (/)
├── View organization overview
└── Quick links to other sections

Admin (/admin) ⭐ SUPERADMIN ONLY
├── System statistics
├── View all tenants
├── Create new tenant
└── Manage system-wide settings

Projects (/projects)
├── View ALL projects from all tenants
├── Search projects
├── Filter by status
├── Create projects (assign to any tenant)
└── Delete projects

Users (/users)
├── View ALL users from all tenants
├── Search users
├── Filter by role
├── Create users (assign to any tenant)
└── Delete users
```

### For Tenant Admin
```
Dashboard (/)
├── View organization overview
└── Quick links to sections

Projects (/projects)
├── View organization projects only
├── Search projects
├── Filter by status
├── Create projects
└── Delete projects

Users (/users)
├── View organization users only
├── Search users
├── Filter by role
├── Create users
└── Delete users
```

### For Regular User
```
Dashboard (/)
├── View organization overview
└── View own profile

Projects (/projects)
├── View organization projects
├── View project details
├── See project tasks
└── (No create/delete permissions)
```

---

## Feature Matrix

| Feature | Superadmin | Tenant Admin | User |
|---------|-----------|-------------|------|
| View All Users | ✅ | ❌ | ❌ |
| View Tenant Users | ✅ | ✅ | ❌ |
| Create Users | ✅ | ✅ | ❌ |
| Create Users in Any Tenant | ✅ | ❌ | ❌ |
| Delete Users | ✅ | ✅ | ❌ |
| View All Projects | ✅ | ❌ | ❌ |
| View Tenant Projects | ✅ | ✅ | ✅ |
| Create Projects | ✅ | ✅ | ❌ |
| Create Projects in Any Tenant | ✅ | ❌ | ❌ |
| Delete Projects | ✅ | ✅ | ❌ |
| View Admin Dashboard | ✅ | ❌ | ❌ |
| Create Tenants | ✅ | ❌ | ❌ |
| View Tenants | ✅ | ❌ | ❌ |

---

## Page Layouts

### Users Page

```
┌─────────────────────────────────────────────────┐
│ Users / Team Members     [+ Add User Button]    │
│ Manage system-wide / org users                  │
├─────────────────────────────────────────────────┤
│ [🔐 Superadmin Access Alert]                   │
│                                                  │
│ [Error Message] (if any)                        │
│                                                  │
│ [Search Box] [Filter Dropdown]                  │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Full Name │ Email │ Role │ Tenant │ Status │ │
│ ├─────────────────────────────────────────────┤ │
│ │ John Doe  │ ...   │ User │ Acme   │ Active│ │
│ │ Jane Smith│ ...   │Admin │ Acme   │Active │ │
│ │ ...       │ ...   │ ...  │ ...    │ ...   │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

Modal (Add User):
┌────────────────────────────────────┐
│ Add New User              [X]       │
├────────────────────────────────────┤
│ Tenant *        [Dropdown]         │ (superadmin only)
│ Full Name *     [Text Input]       │
│ Email *         [Email Input]      │
│ Password *      [Password Input]   │
│ Role            [Dropdown]         │
│                                    │
│ [Cancel Button] [Add User Button]  │
└────────────────────────────────────┘
```

### Projects Page

```
┌────────────────────────────────────────────────────┐
│ Projects              [+ New Project Button]       │
│ Manage projects and tasks                          │
├────────────────────────────────────────────────────┤
│ [🔐 Superadmin Access Alert]                      │
│                                                    │
│ [Error Message] (if any)                          │
│                                                    │
│ [Search Box] [Status Filter]                      │
│                                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Project  │ │ Project  │ │ Project  │ ...       │
│ │ Name     │ │ Name     │ │ Name     │           │
│ │ Status   │ │ Status   │ │ Status   │           │
│ │ Desc...  │ │ Desc...  │ │ Desc...  │           │
│ │Tasks: 5  │ │Tasks: 3  │ │Tasks: 8  │           │
│ │By: John  │ │By: Jane  │ │By: Bob   │           │
│ │Tenant... │ │Tenant... │ │Tenant... │           │
│ │[View][Del]│ │[View][Del]│ │[View][Del]│          │
│ └──────────┘ └──────────┘ └──────────┘           │
└────────────────────────────────────────────────────┘

Modal (Create Project):
┌──────────────────────────────────────┐
│ Create New Project        [X]         │
├──────────────────────────────────────┤
│ Tenant *          [Dropdown]         │ (superadmin)
│ Project Name *    [Text Input]       │
│ Description       [Textarea]         │
│ Status            [Dropdown]         │
│                                      │
│ [Cancel] [Create Project]            │
└──────────────────────────────────────┘
```

### Admin Dashboard

```
┌────────────────────────────────────────────────────┐
│ System Administration    [+ New Tenant Button]     │
│ Manage all tenants and system settings             │
├────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐                 │
│ │ 🏢 Total     │ │ 📊 System    │                 │
│ │   Tenants    │ │    Status    │                 │
│ │   Count: 3   │ │    Active    │                 │
│ └──────────────┘ └──────────────┘                 │
│                                                    │
│ ┌──────────────┐ ┌──────────────┐                 │
│ │ Tenant Name  │ │ Tenant Name  │ ...            │
│ │ Status       │ │ Status       │                 │
│ │ Email: ...   │ │ Email: ...   │                 │
│ │ Phone: ...   │ │ Phone: ...   │                 │
│ │ ID: ...      │ │ ID: ...      │                 │
│ │ Created: ... │ │ Created: ... │                 │
│ │[Users][Proj] │ │[Users][Proj] │                 │
│ └──────────────┘ └──────────────┘                 │
└────────────────────────────────────────────────────┘

Modal (Create Tenant):
┌──────────────────────────────────────┐
│ Create New Tenant         [X]         │
├──────────────────────────────────────┤
│ Tenant Name *    [Text Input]        │
│ Email            [Email Input]       │
│ Phone            [Phone Input]       │
│                                      │
│ [Cancel] [Create Tenant]             │
└──────────────────────────────────────┘
```

---

## API Endpoints Used

### Users API
```
GET    /api/tenants/{tenantId}/users         - List tenant users
GET    /api/users/all                         - List all users (superadmin)
POST   /api/tenants/{tenantId}/users         - Create user
DELETE /api/users/{userId}                    - Delete user
```

### Projects API
```
GET    /api/projects                          - List projects
GET    /api/projects/all                      - List all projects (superadmin)
POST   /api/projects                          - Create project
DELETE /api/projects/{projectId}              - Delete project
```

### Tenants API
```
GET    /api/tenants                           - List tenants
POST   /api/tenants                           - Create tenant
```

---

## Color Legend

### Status Badges
```
🟢 Green  - Active / Success / User
🟡 Yellow - Tenant Admin / Warning / Archived
🔴 Red    - Super Admin / Danger / Error
⚪ Gray   - Inactive / Secondary / Completed
🔵 Blue   - Info status
```

### Alert Types
```
ℹ️  Blue   - Information / Status message
✅ Green  - Success message
⚠️  Yellow - Warning message
❌ Red    - Error message
```

---

## Keyboard Shortcuts

### Navigation
- `Tab` - Navigate between elements
- `Enter` - Submit forms / Click buttons
- `Escape` - Close modals

### Form Usage
- `Tab` - Move to next field
- `Shift+Tab` - Move to previous field
- `Enter` - Submit form

---

## Troubleshooting Quick Tips

### Data Not Loading?
1. Check if backend is running: `curl http://localhost:5000/health`
2. Check browser console for errors
3. Try refreshing the page
4. Clear browser cache: `Ctrl+Shift+Delete`

### Modal Not Opening?
1. Check browser console for errors
2. Verify JavaScript is enabled
3. Try a different browser

### Button Not Working?
1. Check network requests in DevTools
2. Verify user has permission
3. Check if all required fields are filled

### Tenant Selector Not Showing?
1. Verify you're logged in as superadmin
2. Check browser console for errors
3. Reload the page

---

## Useful URLs

| Resource | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |
| API Health | http://localhost:5000/health |
| Database | localhost:5432 |
| Dev Server Logs | `docker-compose logs -f frontend` |
| Backend Logs | `docker-compose logs -f backend` |
| Database Logs | `docker-compose logs -f database` |

---

## Tips & Tricks

### Working with Superadmin
1. Superadmin has no assigned tenant (null tenantId)
2. Always select a tenant when creating users/projects
3. You can see all system-wide data
4. Use filters to narrow down large datasets

### Working with Tenant Admin
1. Users/Projects are scoped to your tenant
2. You cannot see other tenants' data
3. Tenant selector is NOT shown in modals
4. Your tenant is automatically assigned

### Working with Regular User
1. Limited to viewing data (no create/delete)
2. Cannot access admin features
3. Projects show with task information
4. Users page not available for regular users

### Performance Tips
1. Use search/filter to reduce data load
2. Clear browser cache periodically
3. Close unused browser tabs
4. Use Chrome DevTools to monitor performance

---

## Testing Checklist

Before deploying to production:

- [ ] Test all login paths
- [ ] Test creating users in multiple tenants
- [ ] Test creating projects in multiple tenants
- [ ] Test search functionality
- [ ] Test filter functionality
- [ ] Test delete with confirmation
- [ ] Test error messages
- [ ] Test on mobile device
- [ ] Test in multiple browsers
- [ ] Check console for errors
- [ ] Verify all links work
- [ ] Test logout and re-login

---

**Need Help?** Check [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing scenarios.
