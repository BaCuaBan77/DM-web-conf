#!/bin/bash

# Device Manager Configuration - Stop Script

echo "🛑 Stopping Device Manager Configuration..."
echo ""

# Stop backend
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "Stopping Backend..."
    kill $(lsof -ti:8080) 2>/dev/null
    echo "✅ Backend stopped"
else
    echo "⚠️  Backend not running"
fi

# Stop frontend
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "Stopping Frontend (port 3001)..."
    kill $(lsof -ti:3001) 2>/dev/null
    echo "✅ Frontend stopped"
elif lsof -ti:3000 > /dev/null 2>&1; then
    echo "Stopping Frontend (port 3000)..."
    kill $(lsof -ti:3000) 2>/dev/null
    echo "✅ Frontend stopped"
else
    echo "⚠️  Frontend not running"
fi

echo ""
echo "✅ All services stopped"

