#!/bin/bash

# 💥 NUCLEAR OPTION - COMPLETE RESET AND DEPLOY
# This will completely destroy and rebuild everything

echo "💥 NUCLEAR DEPLOYMENT - COMPLETE RESET"
echo "⚠️  This will destroy everything and start fresh!"
echo "=================================="

# Stop and remove EVERYTHING
echo "🛑 DESTROYING ALL CONTAINERS AND IMAGES..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker rmi $(docker images -q) -f 2>/dev/null || true
docker system prune -af --volumes
docker builder prune -af

echo "📦 PULLING FRESH VERIFIED IMAGES..."
docker pull sanketsmane/ems-backend:verified
docker pull sanketsmane/ems-frontend:verified

echo "📄 DOWNLOADING LATEST DOCKER-COMPOSE..."
curl -O https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/docker-compose.aws.yml

echo "🚀 STARTING FRESH DEPLOYMENT..."
docker-compose -f docker-compose.aws.yml up -d

echo "⏳ WAITING FOR SERVICES TO START..."
sleep 60

echo "🔍 CHECKING STATUS..."
docker-compose -f docker-compose.aws.yml ps

echo "🌐 TESTING CONNECTIVITY..."
sleep 30
curl -f http://localhost/ || echo "❌ Frontend not responding"
curl -f http://localhost:8000/api/health || echo "❌ Backend not responding"

echo ""
echo "💥 NUCLEAR DEPLOYMENT COMPLETE!"
echo "🌐 Test: https://ems.formonex.in/"
echo "🔧 If still not working, check domain DNS/CDN settings"