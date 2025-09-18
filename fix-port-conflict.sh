#!/bin/bash

# 🔧 FIX PORT 80 CONFLICT AND RESTART FRONTEND
# Clean up properly and restart frontend

echo "🔧 FIXING PORT 80 CONFLICT"
echo "=========================="

echo "🛑 STEP 1: STOP ALL EMS CONTAINERS"
docker stop ems-frontend-prod ems-backend-prod 2>/dev/null || true

echo "🗑️ STEP 2: REMOVE OLD CONTAINERS"
docker rm ems-frontend-prod ems-backend-prod 2>/dev/null || true

echo "🌐 STEP 3: CHECK WHAT'S USING PORT 80"
netstat -tlnp | grep :80 || echo "Port 80 is now free"

echo "📦 STEP 4: PULL FRESH IMAGES"
docker pull sanketsmane/ems-backend:verified
docker pull sanketsmane/ems-frontend:verified

echo "🚀 STEP 5: START WITH DOCKER-COMPOSE"
curl -O https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/docker-compose.aws.yml
docker-compose -f docker-compose.aws.yml up -d

echo "⏳ STEP 6: WAIT FOR SERVICES"
sleep 30

echo "📋 STEP 7: CHECK STATUS"
docker-compose -f docker-compose.aws.yml ps

echo "🌐 STEP 8: TEST SERVICES"
curl -f http://localhost:8000/api/health && echo "✅ Backend OK" || echo "❌ Backend Failed"
curl -f http://localhost/ && echo "✅ Frontend OK" || echo "❌ Frontend Failed"

echo ""
echo "🎯 IF FRONTEND STILL FAILS:"
echo "docker logs ems-frontend-prod --tail 20"
echo ""
echo "=========================="