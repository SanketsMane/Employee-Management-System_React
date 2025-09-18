#!/bin/bash

# 🚀 CLEAN START - ALL CONTAINERS REMOVED
# Now start fresh with docker-compose

echo "🚀 STARTING FRESH EMS DEPLOYMENT"
echo "================================"

echo "🔍 STEP 1: CHECK CURRENT STATUS"
docker ps | grep ems || echo "✅ No EMS containers running (good!)"

echo ""
echo "🌐 STEP 2: CHECK PORT AVAILABILITY"
netstat -tlnp | grep :80 || echo "✅ Port 80 is free"
netstat -tlnp | grep :8000 || echo "✅ Port 8000 is free"

echo ""
echo "📦 STEP 3: ENSURE LATEST IMAGES"
docker pull sanketsmane/ems-backend:verified
docker pull sanketsmane/ems-frontend:verified

echo ""
echo "📄 STEP 4: GET LATEST DOCKER-COMPOSE"
curl -O https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/docker-compose.aws.yml

echo ""
echo "🚀 STEP 5: START SERVICES"
docker-compose -f docker-compose.aws.yml up -d

echo ""
echo "⏳ STEP 6: WAIT FOR STARTUP"
sleep 30

echo ""
echo "📋 STEP 7: CHECK STATUS"
docker-compose -f docker-compose.aws.yml ps

echo ""
echo "🌐 STEP 8: TEST SERVICES"
echo "Testing backend..."
curl -f http://localhost:8000/api/health && echo "✅ Backend responding" || echo "❌ Backend not responding"

echo "Testing frontend..."
curl -f http://localhost/ | head -1 && echo "✅ Frontend responding" || echo "❌ Frontend not responding"

echo ""
echo "📋 STEP 9: CHECK LOGS IF NEEDED"
echo "Backend logs: docker logs ems-backend-prod --tail 10"
echo "Frontend logs: docker logs ems-frontend-prod --tail 10"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Visit: https://ems.formonex.in/"
echo "================================"