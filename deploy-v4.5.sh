#!/bin/bash

# Deploy EMS v4.5 to Production
# This script deploys the new v4.5 images to production environment

set -e

echo "🚀 Deploying EMS v4.5 to Production"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Production configuration
BACKEND_IMAGE="sanketsmane/ems-backend:v4.5"
FRONTEND_IMAGE="sanketsmane/ems-frontend:v4.5"
COMPOSE_FILE="docker-compose.production.yml"

# Check if production compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Production compose file not found: $COMPOSE_FILE${NC}"
    exit 1
fi

# Update docker-compose.production.yml with v4.5 images
echo -e "${BLUE}📝 Updating production compose file...${NC}"
sed -i.bak "s|sanketsmane/ems-backend:.*|$BACKEND_IMAGE|g" $COMPOSE_FILE
sed -i.bak "s|sanketsmane/ems-frontend:.*|$FRONTEND_IMAGE|g" $COMPOSE_FILE

echo -e "${GREEN}✅ Updated image versions in $COMPOSE_FILE${NC}"

# Show what will be deployed
echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "Backend Image: $BACKEND_IMAGE"
echo "Frontend Image: $FRONTEND_IMAGE"
echo "Compose File: $COMPOSE_FILE"

# Backup current deployment
echo -e "${YELLOW}💾 Creating deployment backup...${NC}"
BACKUP_DIR="deployments/backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp $COMPOSE_FILE $BACKUP_DIR/
cp .env.prod $BACKUP_DIR/ 2>/dev/null || echo "No .env.prod found"

# Deploy with docker-compose
echo -e "${BLUE}🚀 Deploying to production...${NC}"

# Pull latest images
docker-compose -f $COMPOSE_FILE pull

# Stop existing services
echo -e "${YELLOW}🛑 Stopping existing services...${NC}"
docker-compose -f $COMPOSE_FILE down

# Start new services
echo -e "${GREEN}▶️  Starting new services...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to start
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

# Health check
echo -e "${BLUE}🏥 Performing health checks...${NC}"

# Check backend
if curl -f http://localhost:8000/health 2>/dev/null; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Backend logs:"
    docker-compose -f $COMPOSE_FILE logs backend | tail -20
fi

# Check frontend
if curl -f http://localhost:3000 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend health check passed${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    echo "Frontend logs:"
    docker-compose -f $COMPOSE_FILE logs frontend | tail -20
fi

# Show running services
echo -e "${BLUE}📊 Running Services:${NC}"
docker-compose -f $COMPOSE_FILE ps

# Create rollback script
cat > rollback-v4.5.sh << EOF
#!/bin/bash
echo "🔄 Rolling back deployment..."
docker-compose -f $COMPOSE_FILE down
cp $BACKUP_DIR/$COMPOSE_FILE .
docker-compose -f $COMPOSE_FILE up -d
echo "✅ Rollback complete!"
EOF

chmod +x rollback-v4.5.sh

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "Version: v4.5"
echo "Backend: $BACKEND_IMAGE"
echo "Frontend: $FRONTEND_IMAGE"
echo "Backup: $BACKUP_DIR"
echo ""
echo -e "${YELLOW}🔗 URLs:${NC}"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "Backend Health: http://localhost:8000/health"
echo ""
echo -e "${YELLOW}⚠️  Commands:${NC}"
echo "View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "Stop services: docker-compose -f $COMPOSE_FILE down"
echo "Rollback: ./rollback-v4.5.sh"