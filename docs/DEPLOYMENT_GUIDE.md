# Deployment Instructions

This document provides step-by-step instructions to deploy the Multi-Tenant SaaS Platform application.

## Quick Summary

✅ **Frontend**: Deployed to Vercel  
✅ **Backend**: Can be deployed to Heroku, Railway, Render, or AWS  
✅ **Database**: PostgreSQL hosted on cloud provider  

---

## Frontend Deployment (Vercel)

### Automated Deployment

The frontend is configured for automatic deployment to Vercel on every push to `main` branch.

### Manual Deployment Steps

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with GitHub account
3. **Import Project**:
   - Click "New Project"
   - Select your GitHub repository
   - Select `frontend/` as root directory
4. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-api.com/api
   ```
5. **Deploy**: Click "Deploy" button
6. **Access**: Your site will be at `https://your-project-name.vercel.app`

### Local Production Build

To test production build locally:

```bash
cd frontend
npm run build
npm run preview
```

---

## Backend Deployment (Multiple Options)

### Option 1: Deploy to Railway

1. Visit https://railway.app
2. Create new project
3. Connect GitHub repository
4. Configure environment variables:
   ```
   DB_HOST=your-postgres-host
   DB_PORT=5432
   DB_NAME=saas_db
   DB_USER=postgres
   DB_PASSWORD=your-secure-password
   JWT_SECRET=your-jwt-secret
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   NODE_ENV=production
   PORT=5000
   ```
5. Deploy

### Option 2: Deploy to Heroku

1. Visit https://heroku.com
2. Create new app
3. Connect GitHub repository
4. Add Procfile to backend:
   ```
   web: node src/index.js
   ```
5. Configure environment variables in Heroku dashboard
6. Deploy

### Option 3: Deploy to AWS EC2

1. Create EC2 instance (Ubuntu 22.04)
2. Install Node.js and PostgreSQL
3. Clone repository
4. Install dependencies: `npm install`
5. Configure `.env` file
6. Start application: `npm start`
7. Use PM2 or systemd for process management

---

## Database Deployment

### PostgreSQL on Cloud

Choose one of these providers:

#### Option 1: AWS RDS
1. Create RDS PostgreSQL instance
2. Configure security groups for backend access
3. Get connection string
4. Use in `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

#### Option 2: Railway PostgreSQL
1. Add PostgreSQL database in Railway project
2. Get connection string from Railway dashboard
3. Set environment variables in backend

#### Option 3: Render
1. Create PostgreSQL database
2. Get connection string
3. Configure in backend environment variables

### Initial Database Setup

Once database is provisioned, run migrations:

```bash
cd backend
npm run migrate  # If you have migration script
# OR manually run SQL files in migrations/ folder
```

Seed data:

```bash
npm run seed  # If you have seed script
```

---

## Post-Deployment Checklist

- [ ] Frontend accessible at Vercel URL
- [ ] Backend API responding at `/api/health`
- [ ] Database connected and migrations complete
- [ ] Environment variables properly configured
- [ ] CORS enabled for Vercel domain
- [ ] Test login works with seed credentials:
  - Email: `admin@demo.com`
  - Password: `Demo@123`
  - Subdomain: `demo`
- [ ] SSL/HTTPS working for all domains
- [ ] Error monitoring set up (optional: Sentry, LogRocket)
- [ ] Analytics configured (optional)

---

## Monitoring & Maintenance

### Logs

- **Frontend**: Check Vercel deployment logs
- **Backend**: Configure logging service (Loggly, Papertrail, CloudWatch)

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- New Relic

### Performance Monitoring

- Vercel Analytics Dashboard
- Backend performance monitoring tools

---

## Troubleshooting

### Frontend Won't Load

1. Check Vercel deployment logs
2. Verify `VITE_API_URL` environment variable
3. Check browser console for errors
4. Ensure CORS is configured on backend

### API Calls Failing

1. Verify backend is running: `curl https://your-backend/api/health`
2. Check CORS headers: `Access-Control-Allow-Origin` includes frontend domain
3. Verify JWT token is valid
4. Check backend logs

### Database Connection Failed

1. Verify connection string in environment variables
2. Check security groups/firewall rules allow backend access
3. Verify database user has correct permissions
4. Test connection with psql client

### Login Not Working

1. Verify seed data exists in database
2. Check password hashing implementation
3. Verify JWT secret is consistent
4. Check token expiration settings

---

## Rollback Procedure

### Frontend

- Vercel automatically maintains previous deployments
- Click "Deployments" → Select previous version → Click "Promote to Production"

### Backend

- Push previous commit to main branch
- Redeploy on hosting platform

---

## Security Checklist

- [ ] All environment variables are secrets (not committed)
- [ ] HTTPS/SSL enabled on all domains
- [ ] Database password is strong and unique
- [ ] JWT secret is strong and unique
- [ ] CORS only allows frontend domain
- [ ] Sensitive API endpoints require authentication
- [ ] Rate limiting configured
- [ ] SQL injection protection enabled
- [ ] XSS protection configured
- [ ] CSRF tokens implemented

---

## Contact & Support

For deployment issues, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Express.js Deployment Guide](https://expressjs.com/en/advanced/best-practice-security.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Last Updated**: December 25, 2025
