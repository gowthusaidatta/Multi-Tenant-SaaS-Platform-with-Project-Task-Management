# 🚀 Deploy Backend to Railway (GitHub Auto-Deploy)

## Simple Web-Based Deployment (No CLI Needed)

Since you hit the free tier resource limit, here's the easiest way:

### Step 1: Go to Railway Website
```
https://railway.app/dashboard
```

### Step 2: Create New Project  
1. Click **"New Project"**
2. Click **"Deploy from GitHub repo"**
3. Select your repository:
   ```
   Multi-Tenant-SaaS-Platform-with-Project-Task-Management
   ```
4. Click **"Deploy"**

### Step 3: Railway Auto-Detects Backend
- Railway scans your repo
- Finds `backend/` folder with `Dockerfile`
- Shows you the deployment preview

### Step 4: Add PostgreSQL Database
1. In Railway dashboard, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Wait for database to initialize (1 minute)

### Step 5: Configure Environment Variables
Click on **backend** service → **"Variables"** tab
Add these:

```
NODE_ENV=production
PORT=5000
DB_HOST={{RAILWAY_PRIVATE_DOMAIN_DATABASE}}
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD={{DB_PASSWORD}}
JWT_SECRET=your-super-secret-32-character-key-12345
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://frontend-six-gamma-78.vercel.app
```

### Step 6: Deploy
- Click **"Deploy"** button
- Wait 2-3 minutes for build and deployment
- Once green "Running", deployment is complete

### Step 7: Get Your Backend URL
```
https://your-app-name.railway.app/api/health
```

### Step 8: Update Vercel
1. Go to **Vercel Dashboard**
2. Select your frontend project
3. **Settings** → **Environment Variables**
4. Update `VITE_API_URL`:
   ```
   Production: https://your-app-name.railway.app/api
   Preview: http://localhost:5000/api
   Development: http://localhost:5000/api
   ```
5. Click **"Save"** and **"Redeploy"**

---

## ✅ Verification
After deployment:
```bash
# Test health check
curl https://your-app-name.railway.app/api/health

# Test frontend
Visit: https://frontend-six-gamma-78.vercel.app
Login: admin@demo.com / Demo@123 / demo
```

---

## 🎯 Your Live Demo URL
```
https://frontend-six-gamma-78.vercel.app
```
(This will work once backend is deployed and connected)
