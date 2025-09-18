#!/bin/bash

# 🔧 FRONTEND CONTAINER FIX
# Fix the restarting frontend container

echo "🔧 FIXING FRONTEND CONTAINER RESTART ISSUE"
echo "=========================================="

echo "🔍 STEP 1: CHECK CURRENT LOGS"
docker logs ems-frontend-prod --tail 20

echo ""
echo "🔧 STEP 2: STOP FRONTEND CONTAINER"
docker stop ems-frontend-prod
docker rm ems-frontend-prod

echo ""
echo "📦 STEP 3: PULL FRESH FRONTEND IMAGE"
docker pull sanketsmane/ems-frontend:verified

echo ""
echo "🚀 STEP 4: START FRONTEND WITH DEBUG"
docker run -d \
  --name ems-frontend-prod \
  --network ems_ems-network \
  -p 80:80 \
  --restart unless-stopped \
  sanketsmane/ems-frontend:verified

echo ""
echo "⏳ STEP 5: WAIT AND CHECK STATUS"
sleep 15
docker ps | grep ems-frontend

echo ""
echo "📋 STEP 6: CHECK LOGS AGAIN"
docker logs ems-frontend-prod --tail 10

echo ""
echo "🌐 STEP 7: TEST CONNECTION"
curl -f http://localhost/ || echo "❌ Frontend still not responding"

echo ""
echo "🎯 IF STILL FAILING:"
echo "Run: docker logs ems-frontend-prod --tail 50"
echo "Check: docker exec ems-frontend-prod nginx -t"
echo ""
echo "=========================================="