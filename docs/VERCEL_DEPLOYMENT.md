# Vercel Deployment Guide

This guide will help you deploy the frontend to Vercel for a live demo.

## Prerequisites

1. GitHub account with the repository pushed
2. Vercel account (sign up at https://vercel.com)
3. Backend API deployed or accessible via URL

## Step 1: Sign Up / Log In to Vercel

Visit [https://vercel.com](https://vercel.com) and sign in with your GitHub account.

## Step 2: Import the Repository

1. Click **New Project**
2. Click **Import Git Repository**
3. Search for and select: `Multi-Tenant-SaaS-Platform-with-Project-Task-Management`
4. Click **Import**

## Step 3: Configure Project Settings

1. **Root Directory**: Select `frontend/`
2. **Framework Preset**: Vite
3. **Build Command**: `npm run build` (should auto-detect)
4. **Output Directory**: `dist` (should auto-detect)

## Step 4: Set Environment Variables

In the **Environment Variables** section, add:

```
VITE_API_URL = http://localhost:5000/api
```

Or if your backend is deployed:

```
VITE_API_URL = https://your-backend-api.com/api
```

## Step 5: Deploy

Click **Deploy** and wait for the build to complete.

Your frontend will be available at: `https://your-project-name.vercel.app`

## Step 6: Update Backend CORS

Update your backend CORS configuration to allow requests from your Vercel domain:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-project-name.vercel.app'],
  credentials: true
}));
```

## Step 7: Test Live Demo

1. Visit your Vercel deployment URL
2. Log in with test credentials:
   - Email: `admin@demo.com`
   - Password: `Demo@123`
   - Subdomain: `demo`

## Continuous Deployment

Every time you push to the `main` branch, Vercel will automatically deploy the latest version.

## Troubleshooting

### Build Failed
- Check that `frontend/` contains `package.json` and `vite.config.js`
- Verify Node.js version is 18+ in Vercel project settings

### API Calls Failing
- Verify `VITE_API_URL` environment variable is set correctly
- Ensure backend CORS allows your Vercel domain
- Check browser console for CORS errors

### Login Fails
- Ensure backend API is running and accessible
- Verify test credentials exist in the database
- Check browser DevTools Network tab for API response

## Live Demo URL

Once deployed, your live demo will be available at:
**https://gpp-saas-frontend.vercel.app** (or your custom Vercel URL)

Share this URL with stakeholders to demonstrate the application.
