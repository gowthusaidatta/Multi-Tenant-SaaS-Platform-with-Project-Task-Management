# Deployment Guide

## Production Deployment Checklist

### 1. Environment Variables

Before deploying to production, update these environment variables:

**Backend:**
```bash
NODE_ENV=production
JWT_SECRET=<strong-random-secret-min-32-chars>
DB_PASSWORD=<strong-database-password>
FRONTEND_URL=https://your-frontend-domain.com
```

**Database:**
```bash
POSTGRES_PASSWORD=<strong-database-password>
```

### 2. Security Hardening

- [ ] Change all default passwords
- [ ] Use strong JWT secret (minimum 32 characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Enable database SSL connections
- [ ] Set up proper CORS origins
- [ ] Review and minimize exposed ports
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging

### 3. Database Backup

Set up automated database backups:

```bash
# Example PostgreSQL backup script
pg_dump -U postgres -h database -d saas_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 4. Platform-Specific Deployment

#### AWS ECS/Fargate
1. Create ECR repositories for backend and frontend
2. Push Docker images to ECR
3. Create ECS task definitions
4. Set up Application Load Balancer
5. Configure RDS for PostgreSQL
6. Set up CloudWatch for monitoring

#### Google Cloud Run
1. Enable Cloud Run API
2. Build and push images to GCR
3. Deploy services to Cloud Run
4. Set up Cloud SQL for PostgreSQL
5. Configure Cloud Load Balancer

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Configure app components
3. Set up managed PostgreSQL
4. Configure environment variables
5. Enable automatic deployments

#### Self-Hosted/VPS
1. Install Docker and Docker Compose
2. Clone repository
3. Update environment variables
4. Run `docker-compose up -d`
5. Set up reverse proxy (nginx)
6. Configure SSL with Let's Encrypt

### 5. Monitoring and Logging

Recommended tools:
- **Application Monitoring**: DataDog, New Relic, or Prometheus
- **Log Aggregation**: ELK Stack, Splunk, or CloudWatch
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry

### 6. Performance Optimization

- Enable database connection pooling
- Add Redis for caching (optional)
- Configure CDN for frontend assets
- Enable gzip compression
- Optimize database queries with indexes
- Set up database query caching

### 7. Scaling Considerations

**Horizontal Scaling:**
- Run multiple backend instances behind load balancer
- Use managed database service for high availability
- Implement session store (Redis) if needed

**Vertical Scaling:**
- Increase container resources
- Upgrade database instance

### 8. Health Checks

Configure health check endpoints in your orchestration platform:
- Backend: `http://backend:5000/api/health`
- Frontend: `http://frontend:3000`

### 9. CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push images
        run: |
          docker build -t backend:latest ./backend
          docker build -t frontend:latest ./frontend
      - name: Deploy to production
        run: |
          # Your deployment commands
```

### 10. Post-Deployment Verification

After deployment:
- [ ] Test health check endpoint
- [ ] Test user registration
- [ ] Test user login
- [ ] Create test project and tasks
- [ ] Verify data isolation between tenants
- [ ] Check audit logs
- [ ] Monitor resource usage
- [ ] Review application logs

## Rollback Plan

If issues occur:
1. Identify the problem in logs
2. Roll back to previous version
3. Restore database from backup if needed
4. Investigate and fix issue
5. Redeploy after testing

## Support Contacts

- DevOps: devops@yourcompany.com
- Security: security@yourcompany.com
- Emergency: oncall@yourcompany.com
