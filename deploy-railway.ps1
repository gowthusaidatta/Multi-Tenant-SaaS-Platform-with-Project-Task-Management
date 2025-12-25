# Railway CLI Deployment Script for PowerShell
# This script deploys the backend to Railway

Write-Host "🚀 Starting Railway Deployment..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Authenticate
Write-Host "🔐 Step 1: Logging in to Railway..." -ForegroundColor Yellow
Write-Host "A browser window will open for authentication..."
npx @railway/cli login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Login failed. Please try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Logged in successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Initialize Railway project
Write-Host "📂 Step 2: Initializing Railway project..." -ForegroundColor Yellow
npx @railway/cli init

Write-Host ""
Write-Host "📝 Follow the prompts:"
Write-Host "  - Project name: saas-platform (or your choice)"
Write-Host "  - Environment: production"
Write-Host ""

# Step 3: Add PostgreSQL
Write-Host "🗄️ Step 3: Adding PostgreSQL database..." -ForegroundColor Yellow
npx @railway/cli add --plugin postgres

Write-Host ""
Write-Host "✅ PostgreSQL added!" -ForegroundColor Green
Write-Host ""

# Step 4: Get the deployment URL
Write-Host "📋 Step 4: Getting your Railway URL..." -ForegroundColor Yellow
$railwayUrl = npx @railway/cli status | Select-String "Domain" | Out-String
Write-Host "Your Railway URL: $railwayUrl" -ForegroundColor Green

Write-Host ""
Write-Host "IMPORTANT - Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to Railway Dashboard: https://railway.app" -ForegroundColor Cyan
Write-Host "2. Select your project and backend service" -ForegroundColor Cyan
Write-Host "3. Go to Variables tab and add:" -ForegroundColor Cyan
Write-Host "   NODE_ENV = production" -ForegroundColor Cyan
Write-Host "   PORT = 5000" -ForegroundColor Cyan
Write-Host "   JWT_SECRET = 32-char-string" -ForegroundColor Cyan
Write-Host "   JWT_EXPIRES_IN = 24h" -ForegroundColor Cyan
Write-Host "   FRONTEND_URL = https://frontend-six-gamma-78.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Check database variables from PostgreSQL plugin" -ForegroundColor Cyan
Write-Host "5. Wait for deployment complete" -ForegroundColor Cyan
Write-Host "6. Get backend URL and update Vercel" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployment script complete!" -ForegroundColor Green
