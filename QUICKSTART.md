# Quick Start Guide

This guide will help you get the Multi-Tenant SaaS Platform running in minutes.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Docker Compose (Linux)
- 4GB RAM available
- Ports 3000, 5000, and 5432 available

## Steps

### 1. Clone the Repository

```bash
git clone https://github.com/gowthusaidatta/Multi-Tenant-SaaS-Platform-with-Project-Task-Management.git
cd "Multi-Tenant SaaS Platform with Project & Task Management"
```

### 2. Start the Application

```bash
docker-compose up -d --build
```

This single command will:
- Pull PostgreSQL 15 image
- Build backend image
- Build frontend image
- Start all three services
- Run database migrations automatically
- Load seed data automatically

### 3. Wait for Initialization

The health check endpoint will return "ok" only after complete initialization:

```bash
# Check backend health (wait until status: ok)
curl http://localhost:5000/api/health
```

Expected response when ready:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-12-23T..."
}
```

### 4. Access the Application

Open your browser to: **http://localhost:3000**

### 5. Login with Seed Credentials

**Super Admin:**
- Email: `superadmin@system.com`
- Password: `Admin@123`

**Demo Tenant Admin:**
- Email: `admin@demo.com`
- Password: `Demo@123`
- Subdomain: `demo`

**Demo Users:**
- Email: `user1@demo.com` / Password: `User@123` / Subdomain: `demo`
- Email: `user2@demo.com` / Password: `User@123` / Subdomain: `demo`

## What's Running?

After successful startup, you'll have:

- **Frontend**: http://localhost:3000 (React app)
- **Backend API**: http://localhost:5000/api (Express server)
- **Database**: localhost:5432 (PostgreSQL)

## Verify Everything Works

### Test 1: Health Check

```bash
curl http://localhost:5000/api/health
```

Should return: `{"status":"ok","database":"connected",...}`

### Test 2: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo@123",
    "tenantSubdomain": "demo"
  }'
```

Should return: JWT token and user details

### Test 3: Frontend

Navigate to http://localhost:3000 and login with any of the seed credentials.

## Common Issues

### Ports Already in Use

If you see port conflict errors:

**Windows:**
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5432
```

**Mac/Linux:**
```bash
lsof -i :3000
lsof -i :5000
lsof -i :5432
```

Stop the conflicting service or change ports in docker-compose.yml.

### Services Not Starting

Check logs:
```bash
docker-compose logs database
docker-compose logs backend
docker-compose logs frontend
```

### Health Check Returns "initializing"

Wait 30-60 seconds. Migrations and seeds take time on first run.

### Still Having Issues?

See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for detailed solutions.

## Next Steps

1. **Explore the Application**: Create projects, tasks, and users
2. **Test Multi-Tenancy**: Register a new tenant and verify data isolation
3. **Check the API**: Review [API.md](docs/API.md) and test endpoints
4. **Review Code**: Explore backend and frontend code structure

## Stopping the Application

```bash
docker-compose down
```

To also remove data:
```bash
docker-compose down -v
```

## Development Mode

For development with hot reload:

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

You'll need to run PostgreSQL separately and update environment variables.

## Production Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment instructions.

## Support

- **Documentation**: Check `docs/` folder
- **FAQ**: See [FAQ.md](docs/FAQ.md)
- **Issues**: Create a GitHub issue

---

That's it! You're now running a complete multi-tenant SaaS platform. 🎉
