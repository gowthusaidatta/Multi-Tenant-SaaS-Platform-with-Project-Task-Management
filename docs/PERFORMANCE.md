# Performance Optimization Guide

## Overview

This document outlines performance optimization strategies for the Multi-Tenant SaaS Platform.

## Database Optimization

### Indexes

The following indexes are recommended for production:

```sql
-- Tenant lookup by subdomain (frequent operation during login)
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);

-- User lookup by tenant and email (authentication)
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);

-- Project filtering by tenant
CREATE INDEX idx_projects_tenant ON projects(tenant_id);

-- Task filtering by project and tenant
CREATE INDEX idx_tasks_project_tenant ON tasks(project_id, tenant_id);

-- Task filtering by assigned user
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);

-- Audit log queries by tenant
CREATE INDEX idx_audit_tenant_created ON audit_logs(tenant_id, created_at DESC);
```

### Query Optimization

**Avoid N+1 Queries:**
```javascript
// Bad: N+1 query
const projects = await query('SELECT * FROM projects WHERE tenant_id = $1', [tenantId]);
for (const project of projects.rows) {
  const tasks = await query('SELECT * FROM tasks WHERE project_id = $1', [project.id]);
  project.tasks = tasks.rows;
}

// Good: Single join query
const result = await query(`
  SELECT p.*, 
         json_agg(json_build_object('id', t.id, 'title', t.title)) as tasks
  FROM projects p
  LEFT JOIN tasks t ON t.project_id = p.id
  WHERE p.tenant_id = $1
  GROUP BY p.id
`, [tenantId]);
```

### Connection Pooling

Implement database connection pooling:

```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  max: 20,                  // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  connectionTimeoutMillis: 2000,
});
```

## API Optimization

### Caching

Implement Redis caching for frequently accessed data:

```javascript
// Example: Cache tenant details
const getTenant = async (tenantId) => {
  const cacheKey = `tenant:${tenantId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const result = await query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
  await redis.setex(cacheKey, 3600, JSON.stringify(result.rows[0])); // Cache for 1 hour
  
  return result.rows[0];
};
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

router.post('/login', authLimiter, loginHandler);
```

### Response Compression

Enable gzip compression:

```javascript
import compression from 'compression';
app.use(compression());
```

### Pagination

Implement cursor-based pagination for large datasets:

```javascript
// Better than LIMIT/OFFSET for large datasets
const getTasks = async (projectId, cursor, limit = 50) => {
  const query = `
    SELECT * FROM tasks
    WHERE project_id = $1 AND id > $2
    ORDER BY id
    LIMIT $3
  `;
  return await db.query(query, [projectId, cursor, limit]);
};
```

## Frontend Optimization

### Code Splitting

Split React components for faster initial load:

```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    </Suspense>
  );
}
```

### Image Optimization

Use optimized images and lazy loading:

```javascript
<img 
  src="/images/logo.webp" 
  alt="Logo" 
  loading="lazy"
  width="200"
  height="100"
/>
```

### API Request Debouncing

Debounce search inputs to reduce API calls:

```javascript
import { debounce } from 'lodash';

const debouncedSearch = debounce((query) => {
  fetchSearchResults(query);
}, 300);

<input onChange={(e) => debouncedSearch(e.target.value)} />
```

### Memoization

Use React.memo and useMemo for expensive computations:

```javascript
import { useMemo } from 'react';

const TaskList = ({ tasks }) => {
  const completedTasks = useMemo(
    () => tasks.filter(t => t.status === 'completed'),
    [tasks]
  );
  
  return <div>{completedTasks.length} completed</div>;
};
```

## Docker Optimization

### Multi-Stage Builds

Use multi-stage builds to reduce image size:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN npm install --production
CMD ["node", "dist/index.js"]
```

### Layer Caching

Optimize Dockerfile layer caching:

```dockerfile
# Good: Dependencies cached separately
COPY package.json ./
RUN npm install
COPY . .

# Bad: Everything changes when code changes
COPY . .
RUN npm install
```

## Monitoring

### Application Performance Monitoring (APM)

Implement APM for production:

```javascript
// Example with New Relic
require('newrelic');

// Or with DataDog
const tracer = require('dd-trace').init();
```

### Health Checks

Implement detailed health checks:

```javascript
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'unknown',
    memory: process.memoryUsage(),
  };
  
  try {
    await query('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'error';
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Logging

Use structured logging:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

logger.info('User logged in', { userId, tenantId });
```

## Scaling Strategies

### Horizontal Scaling

Run multiple backend instances behind a load balancer:

```yaml
# docker-compose.yml
services:
  backend:
    image: backend:latest
    deploy:
      replicas: 3
    environment:
      ...
```

### Vertical Scaling

Increase resources for containers:

```yaml
services:
  database:
    image: postgres:15
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

### Database Replication

Set up PostgreSQL replication for read scaling:

```
Master (write) → Replica 1 (read)
              → Replica 2 (read)
```

### CDN for Static Assets

Use CDN for frontend assets in production:

```javascript
// vite.config.js
export default {
  base: 'https://cdn.example.com/',
  build: {
    assetsDir: 'static',
  },
};
```

## Performance Benchmarks

Target metrics for production:

- **API Response Time**: < 200ms for 90% of requests
- **Database Query Time**: < 50ms for 95% of queries
- **Frontend Load Time**: < 2 seconds (First Contentful Paint)
- **Time to Interactive**: < 3 seconds
- **API Throughput**: > 1000 requests/second per instance

## Monitoring Tools

Recommended tools:

- **Application**: New Relic, DataDog, Prometheus + Grafana
- **Database**: pg_stat_statements, PgHero
- **Frontend**: Lighthouse, Web Vitals, Sentry
- **Infrastructure**: CloudWatch, Stackdriver

## Regular Maintenance

### Weekly

- Review slow query logs
- Check error rates
- Monitor disk usage

### Monthly

- Review and optimize indexes
- Update dependencies
- Review and archive old audit logs

### Quarterly

- Load testing
- Security audit
- Infrastructure cost review
