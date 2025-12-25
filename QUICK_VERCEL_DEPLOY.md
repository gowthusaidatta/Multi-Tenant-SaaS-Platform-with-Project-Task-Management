# 🚀 Quick Vercel Deployment (5 Minutes)

## Prerequisites
- GitHub account (with repository access)
- Vercel account (free tier available)

## Step-by-Step Guide

### 1. Go to Vercel
Visit: https://vercel.com

### 2. Sign In
Click "Sign In" → Choose "GitHub" → Authorize Vercel to access your repositories

### 3. Import Project
- Click "New Project"
- Search for: "Multi-Tenant-SaaS-Platform"
- Click "Import"

### 4. Configure Project
- **Framework**: Vite (auto-detected)
- **Root Directory**: `frontend/` ← **IMPORTANT**
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)

### 5. Set Environment Variable
In "Environment Variables" section, add:

**Name**: `VITE_API_URL`  
**Value**: `http://localhost:5000/api`  
(Change this after deploying backend)

Click "Add Environment Variable"

### 6. Deploy
Click the "Deploy" button and wait ~2-3 minutes for build to complete

### 7. Access Your Site
Once deployment completes, you'll get a URL like:
```
https://your-project-name.vercel.app
```

---

## Test Your Deployment

1. Visit your Vercel URL
2. Click "Login"
3. Enter:
   - Email: `admin@demo.com`
   - Password: `Demo@123`
   - Subdomain: `demo`
4. Click "Submit"

You should see the dashboard!

---

## Automatic Deployments

Every time you push to the `main` branch, Vercel will automatically:
1. Rebuild the frontend
2. Run tests (if configured)
3. Deploy new version
4. Update your live site

---

## Troubleshooting

### "Build Failed" Error
- Check that `frontend/` folder exists
- Verify `package.json` is in `frontend/` directory
- Check Vercel build logs for specific error

### "Cannot find module" Error
- Ensure `VITE_API_URL` is set in environment variables
- Check that all dependencies are listed in `package.json`

### API Calls Not Working
- Verify backend API is accessible at the URL you set in `VITE_API_URL`
- Check browser console for CORS errors
- Ensure backend CORS configuration allows your Vercel domain

### Login Fails
- Verify test credentials are correct
- Ensure backend is running
- Check browser DevTools → Network tab for API response

---

## Share Your Live Demo

Your live demo URL is ready to share! Send this to stakeholders:

```
https://your-project-name.vercel.app

Test with:
Email: admin@demo.com
Password: Demo@123
Subdomain: demo
```

---

## Next: Deploy Backend

Once frontend is live, follow `docs/DEPLOYMENT_GUIDE.md` to deploy backend to:
- Railway (recommended, easiest)
- Heroku
- AWS

---

**Need Help?** Check `docs/VERCEL_DEPLOYMENT.md` for detailed guide with troubleshooting section.
