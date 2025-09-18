#!/bin/bash

# 🔍 DIAGNOSTIC SCRIPT - CHECK WHAT'S ACTUALLY DEPLOYED
# Run this on your AWS server to diagnose the issue

echo "🔍 EMS DEPLOYMENT DIAGNOSTIC"
echo "=================================="

# Check if containers are running
echo "📋 CONTAINER STATUS:"
docker ps | grep ems || echo "❌ No EMS containers running!"
echo ""

# Check docker images
echo "📦 DOCKER IMAGES:"
docker images | grep sanketsmane || echo "❌ No sanketsmane images found!"
echo ""

# Check if docker-compose file exists
echo "📄 DOCKER-COMPOSE FILE:"
if [ -f "docker-compose.aws.yml" ]; then
    echo "✅ docker-compose.aws.yml exists"
    echo "📋 Content:"
    cat docker-compose.aws.yml | grep image:
else
    echo "❌ docker-compose.aws.yml not found!"
fi
echo ""

# Check nginx configuration if frontend is running
echo "🌐 NGINX CONFIGURATION:"
if docker ps | grep ems-frontend-prod > /dev/null; then
    echo "✅ Frontend container running"
    docker exec ems-frontend-prod cat /etc/nginx/conf.d/default.conf | head -10
else
    echo "❌ Frontend container not running!"
fi
echo ""

# Check backend health if running
echo "🚀 BACKEND STATUS:"
if docker ps | grep ems-backend-prod > /dev/null; then
    echo "✅ Backend container running"
    docker exec ems-backend-prod curl -f http://localhost:8000/api/health 2>/dev/null || echo "❌ Backend health check failed"
else
    echo "❌ Backend container not running!"
fi
echo ""

# Check ports
echo "🔌 PORT STATUS:"
netstat -tlnp | grep :80 || echo "❌ Port 80 not listening"
netstat -tlnp | grep :8000 || echo "❌ Port 8000 not listening"
echo ""

# Check logs
echo "📋 RECENT LOGS:"
if docker ps | grep ems-frontend-prod > /dev/null; then
    echo "Frontend logs (last 5 lines):"
    docker logs ems-frontend-prod --tail 5 2>/dev/null || echo "❌ Cannot get frontend logs"
fi

if docker ps | grep ems-backend-prod > /dev/null; then
    echo "Backend logs (last 5 lines):"
    docker logs ems-backend-prod --tail 5 2>/dev/null || echo "❌ Cannot get backend logs"
fi
echo ""

echo "🎯 QUICK FIXES:"
echo "1. If no containers: docker-compose -f docker-compose.aws.yml up -d"
echo "2. If old images: docker pull sanketsmane/ems-frontend:verified && docker pull sanketsmane/ems-backend:verified"
echo "3. If containers exist but not working: docker-compose -f docker-compose.aws.yml restart"
echo ""
echo "=================================="