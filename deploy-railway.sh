#!/bin/bash
# Railway CLI Deployment Script
# This script deploys the backend to Railway using CLI commands

set -e

echo "🚀 Starting Railway Deployment..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Step 1: Authenticate with Railway"
echo "This will open your browser to authenticate..."
npx @railway/cli login

echo ""
echo "📂 Step 2: Create new Railway project"
npx @railway/cli init

echo ""
echo "🗄️ Step 3: Add PostgreSQL database"
npx @railway/cli add --plugin postgres

echo ""
echo "⚙️ Step 4: Configure environment variables"
echo "Setting up variables..."
npx @railway/cli variables set NODE_ENV production
npx @railway/cli variables set PORT 5000
npx @railway/cli variables set JWT_SECRET "your-super-secret-key-32-chars"
npx @railway/cli variables set JWT_EXPIRES_IN 24h
npx @railway/cli variables set FRONTEND_URL "https://frontend-six-gamma-78.vercel.app"

echo ""
echo "📤 Step 5: Deploy to Railway"
npx @railway/cli up --detach

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your Railway project is being deployed..."
echo "Check status at: https://railway.app"
echo ""
echo "Once deployed, get your backend URL and update Vercel environment variables"
