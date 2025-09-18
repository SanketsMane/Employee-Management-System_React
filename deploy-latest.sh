#!/bin/bash

# 🚀 EMS Latest Deployment Script for AWS
# This script deploys the latest version of Formonex EMS

set -e

echo "🚀 Starting EMS Latest Deployment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Pulling latest Docker images...${NC}"
docker pull sanketsmane/ems-backend:latest
docker pull sanketsmane/ems-frontend:latest

echo -e "${YELLOW}⏹️  Stopping existing containers...${NC}"
docker-compose -f docker-compose.aws.yml down --remove-orphans

echo -e "${YELLOW}🧹 Cleaning up old images and containers...${NC}"
docker system prune -f

echo -e "${GREEN}🚀 Starting EMS with latest code...${NC}"
docker-compose -f docker-compose.aws.yml up -d

echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 30

echo -e "${BLUE}📊 Checking service status...${NC}"
docker-compose -f docker-compose.aws.yml ps

echo -e "${GREEN}✅ Checking health status...${NC}"

# Check backend health
echo -e "${BLUE}🔍 Backend health check...${NC}"
BACKEND_HEALTH=$(docker exec ems-backend-prod curl -f http://localhost:8000/api/health 2>/dev/null || echo "FAILED")
if [[ $BACKEND_HEALTH == *"healthy"* ]] || [[ $BACKEND_HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✅ Backend: HEALTHY${NC}"
else
    echo -e "${RED}❌ Backend: UNHEALTHY${NC}"
    echo -e "${YELLOW}📋 Backend logs:${NC}"
    docker logs ems-backend-prod --tail 20
fi

# Check frontend health
echo -e "${BLUE}🔍 Frontend health check...${NC}"
FRONTEND_HEALTH=$(docker exec ems-frontend-prod curl -f http://localhost/ 2>/dev/null || echo "FAILED")
if [[ $FRONTEND_HEALTH == *"healthy"* ]] || [[ $FRONTEND_HEALTH != "FAILED" ]]; then
    echo -e "${GREEN}✅ Frontend: HEALTHY${NC}"
else
    echo -e "${RED}❌ Frontend: UNHEALTHY${NC}"
    echo -e "${YELLOW}📋 Frontend logs:${NC}"
    docker logs ems-frontend-prod --tail 20
fi

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 EMS Latest Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Access your application:${NC}"
echo -e "   Frontend: ${YELLOW}https://ems.formonex.in${NC}"
echo -e "   Backend API: ${YELLOW}https://ems.formonex.in/api${NC}"
echo -e "   Health Check: ${YELLOW}https://ems.formonex.in/api/health${NC}"
echo ""
echo -e "${BLUE}📊 Monitor logs:${NC}"
echo -e "   All logs: ${YELLOW}docker-compose -f docker-compose.aws.yml logs -f${NC}"
echo -e "   Backend: ${YELLOW}docker logs ems-backend-prod -f${NC}"
echo -e "   Frontend: ${YELLOW}docker logs ems-frontend-prod -f${NC}"
echo ""
echo -e "${GREEN}✨ Happy coding! - Formonex Team${NC}"