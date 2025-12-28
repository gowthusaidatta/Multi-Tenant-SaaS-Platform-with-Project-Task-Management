@echo off
REM Docker Startup and Verification Script for Windows
REM This script starts the Docker Compose services and verifies they're working correctly

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Multi-Tenant SaaS Platform
echo Docker Startup ^& Verification Script
echo ========================================
echo.

REM Check Docker installation
echo [1/5] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker not found. Please install Docker Desktop.
    pause
    exit /b 1
)
echo [OK] Docker found
echo.

REM Check Docker Compose
echo [2/5] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose not found. Please install Docker Compose.
    pause
    exit /b 1
)
echo [OK] Docker Compose found
echo.

REM Start services
echo [3/5] Starting Docker services...
echo Running: docker-compose up -d --build
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)
echo [OK] Services started
echo.

REM Wait for services
echo [4/5] Waiting for services to be healthy...
echo This may take up to 60 seconds...
timeout /t 30 /nobreak
echo.

REM Display service status
echo [5/5] Docker Service Status:
docker-compose ps
echo.

REM Test health endpoint
echo Testing endpoints...
echo.
echo Checking backend health...
for /f "delims=" %%i in ('curl -s http://localhost:5000/api/health 2^>nul') do set "HEALTH=%%i"
if defined HEALTH (
    echo Health check response: !HEALTH!
) else (
    echo Unable to reach health endpoint (Docker might still be starting)
)
echo.

echo.
echo ========================================
echo Docker Setup Complete!
echo ========================================
echo.
echo Application URLs:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:5000
echo   Health:    http://localhost:5000/api/health
echo   Database:  localhost:5432
echo.
echo Test Credentials:
echo   Super Admin:
echo     Email: superadmin@system.com
echo     Password: Admin@123
echo.
echo   Tenant Admin:
echo     Email: admin@demo.com
echo     Password: Demo@123
echo     Subdomain: demo
echo.
echo Useful Commands:
echo   View logs:        docker-compose logs -f
echo   View backend log: docker-compose logs -f backend
echo   Stop services:    docker-compose down
echo   Restart services: docker-compose restart
echo   Remove all data:  docker-compose down -v
echo.
pause
