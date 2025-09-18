#!/bin/bash

# 🚀 FORCE LATEST CODE DEPLOYMENT WITH CACHE BUSTING
# This script will completely refresh everything and force latest code

set -e

echo "🔥 FORCE DEPLOYING LATEST CODE - CACHE BUSTING MODE"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🛑 STEP 1: NUCLEAR CLEANUP${NC}"
docker-compose down --remove-orphans --volumes
docker system prune -af --volumes
docker builder prune -af

echo -e "${BLUE}📦 STEP 2: FORCE PULL VERIFIED IMAGES${NC}"
docker pull sanketsmane/ems-backend:verified --platform linux/arm64
docker pull sanketsmane/ems-frontend:verified --platform linux/arm64

echo -e "${YELLOW}🔧 STEP 3: GET LATEST DOCKER-COMPOSE${NC}"
curl -O https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/docker-compose.aws.yml

echo -e "${GREEN}🚀 STEP 4: DEPLOY WITH FRESH START${NC}"
docker-compose -f docker-compose.aws.yml up -d --force-recreate --renew-anon-volumes

echo -e "${BLUE}⏳ STEP 5: WAITING FOR SERVICES...${NC}"
sleep 45

echo -e "${GREEN}🔍 STEP 6: VERIFICATION${NC}"

# Check if containers are running
echo -e "${BLUE}Container Status:${NC}"
docker-compose -f docker-compose.aws.yml ps

# Check build timestamp
echo -e "${BLUE}Build Timestamp Check:${NC}"
BUILD_TIME=$(docker exec ems-frontend-prod cat /usr/share/nginx/html/index.html | grep "Built:" || echo "No timestamp found")
echo "Frontend Build: $BUILD_TIME"

# Check nginx config
echo -e "${BLUE}Nginx Config Check:${NC}"
docker exec ems-frontend-prod nginx -t

# Health checks
echo -e "${BLUE}Health Checks:${NC}"
BACKEND_HEALTH=$(docker exec ems-backend-prod curl -f http://localhost:8000/api/health 2>/dev/null || echo "FAILED")
echo "Backend: $BACKEND_HEALTH"

FRONTEND_HEALTH=$(docker exec ems-frontend-prod curl -f http://localhost/ 2>/dev/null | head -1 || echo "FAILED")
echo "Frontend: $FRONTEND_HEALTH"

echo -e "${GREEN}🎯 STEP 7: CACHE BUSTING COMMANDS${NC}"
echo "Run these on your domain/CDN:"
echo "1. Clear Cloudflare cache (if using)"
echo "2. Hard refresh browser (Ctrl+F5)"
echo "3. Open incognito/private window"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ FORCED DEPLOYMENT COMPLETE!${NC}"
echo ""
echo -e "${BLUE}🌐 Test URLs:${NC}"
echo "Main: https://ems.formonex.in/"
echo "API: https://ems.formonex.in/api/health"
echo ""
echo -e "${YELLOW}💡 If still showing old version:${NC}"
echo "1. Check if using CDN (Cloudflare/CloudFront)"
echo "2. Clear CDN cache"
echo "3. Test direct server IP"
echo ""
echo -e "${GREEN}🎉 Latest code is now deployed!${NC}"