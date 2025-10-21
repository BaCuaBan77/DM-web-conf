#!/bin/bash

# Device Manager Configuration - Quick Start Script
# This script starts both backend and frontend servers

echo "🚀 Starting Device Manager Configuration..."
echo ""

# Load nvm and use Node 20.18.3
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20.18.3 > /dev/null 2>&1

# Check if backend is already running
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "⚠️  Backend already running on port 8080"
else
    echo "Starting Backend..."
    cd backend
    mvn spring-boot:run -s settings.xml > /tmp/dm-backend.log 2>&1 &
    cd ..
    sleep 10
    echo "✅ Backend started on http://localhost:8080"
fi

# Check if frontend is already running
if lsof -ti:3001 > /dev/null 2>&1 || lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Frontend already running"
else
    echo "Starting Frontend..."
    cd frontend
    npm run dev > /tmp/dm-frontend.log 2>&1 &
    cd ..
    sleep 5
    echo "✅ Frontend started on http://localhost:3001"
fi

echo ""
echo "=========================================="
echo "🎉 Application is ready!"
echo "=========================================="
echo ""
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend:  http://localhost:8080"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/dm-backend.log"
echo "  Frontend: tail -f /tmp/dm-frontend.log"
echo ""
echo "To stop:"
echo "  kill \$(lsof -ti:8080)  # Stop backend"
echo "  kill \$(lsof -ti:3001)  # Stop frontend"
echo ""

