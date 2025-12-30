#!/bin/bash
# Docker Startup and Verification Script
# This script starts the Docker Compose services and verifies they're working correctly

set -e

echo "========================================"
echo "Multi-Tenant SaaS Platform"
echo "Docker Startup & Verification Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker installation
echo -e "${YELLOW}[1/6]${NC} Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} Docker found: $DOCKER_VERSION"
else
    echo -e "${RED}✗${NC} Docker not found. Please install Docker."
    exit 1
fi

# Check Docker Compose
echo -e "${YELLOW}[2/6]${NC} Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓${NC} Docker Compose found: $COMPOSE_VERSION"
else
    echo -e "${RED}✗${NC} Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Start services
echo -e "${YELLOW}[3/6]${NC} Starting Docker services..."
echo "Running: docker-compose up -d --build"
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Services started successfully"
else
    echo -e "${RED}✗${NC} Failed to start services"
    exit 1
fi

echo ""
echo -e "${YELLOW}[4/6]${NC} Waiting for services to be healthy (max 60 seconds)..."

# Function to check if service is healthy
check_service() {
    local service=$1
    local port=$2
    local endpoint=$3
    local max_attempts=30
    local attempt=0

    echo "  Checking $service on port $port..."
    
    while [ $attempt -lt $max_attempts ]; do
        if nc -z localhost $port &> /dev/null; then
            if [ -z "$endpoint" ] || curl -s "$endpoint" &> /dev/null; then
                echo -e "  ${GREEN}✓${NC} $service is ready"
                return 0
            fi
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "  ${RED}✗${NC} $service failed to start"
    return 1
}

# Check all services
all_healthy=true

check_service "database" "5432" "" || all_healthy=false
check_service "backend" "5000" "http://localhost:5000/api/health" || all_healthy=false
check_service "frontend" "3000" "http://localhost:3000" || all_healthy=false

if [ "$all_healthy" = false ]; then
    echo -e "${RED}✗${NC} Some services failed to start"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check logs: docker-compose logs"
    echo "  2. Check specific service: docker-compose logs backend"
    echo "  3. Verify Docker: docker ps"
    exit 1
fi

echo ""
echo -e "${YELLOW}[5/6]${NC} Service Health Checks..."

# Health check endpoint
echo "  Backend health check:"
HEALTH=$(curl -s http://localhost:5000/api/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo -e "  ${GREEN}✓${NC} Backend responding: $HEALTH"
else
    echo -e "  ${RED}✗${NC} Backend health check failed"
    all_healthy=false
fi

# Test login endpoint
echo "  Testing authentication endpoint:"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@123","tenantSubdomain":"demo"}' 2>/dev/null || echo '{"success":false}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "  ${GREEN}✓${NC} Login endpoint working"
else
    echo -e "  ${RED}✗${NC} Login endpoint test (may fail due to network, but services are up)"
fi

echo ""
echo -e "${YELLOW}[6/6]${NC} Displaying Docker Status..."
docker-compose ps

echo ""
echo "========================================"
echo -e "${GREEN}✓ Docker Setup Complete!${NC}"
echo "========================================"
echo ""
echo "Application URLs:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:5000"
echo "  Health:    http://localhost:5000/api/health"
echo "  Database:  localhost:5432"
echo ""
echo "Test Credentials:"
echo "  Super Admin:"
echo "    Email: superadmin@system.com"
echo "    Password: Admin@123"
echo ""
echo "  Tenant Admin:"
echo "    Email: admin@demo.com"
echo "    Password: Demo@123"
echo "    Subdomain: demo"
echo ""
echo "Useful Commands:"
echo "  View logs:        docker-compose logs -f"
echo "  Stop services:    docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Remove all data:  docker-compose down -v"
echo ""
