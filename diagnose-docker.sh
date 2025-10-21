#!/bin/bash
#
# Docker Container Diagnostic Script
# Checks if DM-web-conf Docker containers are running correctly
#

echo "════════════════════════════════════════════════════════════"
echo "  🔍 DM-Web-Conf Docker Diagnostics"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Docker running
echo "1️⃣  Checking if Docker is running..."
if docker info &> /dev/null; then
    echo -e "${GREEN}✓ Docker is running${NC}"
else
    echo -e "${RED}✗ Docker is not running${NC}"
    echo "   Please start Docker Desktop and try again"
    exit 1
fi
echo ""

# Check 2: Container status
echo "2️⃣  Checking container status..."
if docker ps | grep -q dm-config-frontend; then
    echo -e "${GREEN}✓ Frontend container is running${NC}"
else
    echo -e "${RED}✗ Frontend container is not running${NC}"
fi

if docker ps | grep -q dm-config-backend; then
    echo -e "${GREEN}✓ Backend container is running${NC}"
else
    echo -e "${RED}✗ Backend container is not running${NC}"
fi
echo ""

# Check 3: Port bindings
echo "3️⃣  Checking port bindings..."
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep dm-config
echo ""

# Check 4: /opt/dm directory
echo "4️⃣  Checking /opt/dm directory..."
if [ -d "/opt/dm" ]; then
    echo -e "${GREEN}✓ /opt/dm directory exists${NC}"
    
    if [ -f "/opt/dm/devices.json" ]; then
        echo -e "${GREEN}✓ devices.json exists${NC}"
    else
        echo -e "${RED}✗ devices.json missing${NC}"
    fi
    
    if [ -f "/opt/dm/config.properties" ]; then
        echo -e "${GREEN}✓ config.properties exists${NC}"
    else
        echo -e "${RED}✗ config.properties missing${NC}"
    fi
    
    if [ -d "/opt/dm/devices.d" ]; then
        echo -e "${GREEN}✓ devices.d/ directory exists${NC}"
        echo "   Files: $(ls /opt/dm/devices.d/ 2>/dev/null | wc -l | xargs)"
    else
        echo -e "${RED}✗ devices.d/ directory missing${NC}"
    fi
else
    echo -e "${RED}✗ /opt/dm directory does not exist${NC}"
    echo "   Run: sudo cp -r example-opt-dm/* /opt/dm/"
fi
echo ""

# Check 5: Backend health
echo "5️⃣  Checking backend health..."
if curl -s http://localhost:8080/api/devices &> /dev/null; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
    echo "   Response: $(curl -s http://localhost:8080/api/devices | jq -r '.deviceManagerKey' 2>/dev/null || echo 'OK')"
else
    echo -e "${RED}✗ Backend API is not responding${NC}"
    echo "   Check backend logs: docker logs dm-config-backend"
fi
echo ""

# Check 6: Frontend accessibility
echo "6️⃣  Checking frontend accessibility..."
if curl -s http://localhost/ | grep -q "<!DOCTYPE html>"; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
    echo "   URL: http://localhost"
else
    echo -e "${RED}✗ Frontend is not accessible${NC}"
    echo "   Check frontend logs: docker logs dm-config-frontend"
fi
echo ""

# Check 7: Backend logs (last 5 lines)
echo "7️⃣  Backend logs (last 5 lines)..."
echo "────────────────────────────────────────────────────────────"
docker logs dm-config-backend --tail 5 2>&1 | sed 's/^/   /'
echo "────────────────────────────────────────────────────────────"
echo ""

# Check 8: Frontend logs (last 5 lines)
echo "8️⃣  Frontend logs (last 5 lines)..."
echo "────────────────────────────────────────────────────────────"
docker logs dm-config-frontend --tail 5 2>&1 | sed 's/^/   /'
echo "────────────────────────────────────────────────────────────"
echo ""

# Summary
echo "════════════════════════════════════════════════════════════"
echo "  📊 Summary"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Access URLs:"
echo "  Frontend: http://localhost (or http://127.0.0.1)"
echo "  Backend:  http://localhost:8080/api/devices"
echo ""
echo "Useful commands:"
echo "  View backend logs:  docker logs dm-config-backend"
echo "  View frontend logs: docker logs dm-config-frontend"
echo "  Restart containers: docker-compose restart"
echo "  Rebuild all:        docker-compose up --build -d"
echo ""
echo "════════════════════════════════════════════════════════════"

