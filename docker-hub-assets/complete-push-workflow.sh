#!/bin/bash

echo "🚀 Complete Docker Hub Push Workflow"
echo "===================================="

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd ..

# Step 1: Test connectivity
echo -e "${BLUE}Step 1: Testing connectivity...${NC}"
./docker-hub-assets/test-connectivity.sh

# Step 2: Build images
echo -e "${BLUE}Step 2: Building images...${NC}"
if [ ! -f "build-images-v4.5.sh" ]; then
    echo -e "${RED}❌ build-images-v4.5.sh not found${NC}"
    exit 1
fi
./build-images-v4.5.sh

# Step 3: Test images locally
echo -e "${BLUE}Step 3: Testing images locally...${NC}"
if [ -f "test-images-v4.5.sh" ]; then
    ./test-images-v4.5.sh
fi

# Step 4: Login to Docker Hub
echo -e "${BLUE}Step 4: Docker Hub login...${NC}"
echo -e "${YELLOW}Please login to Docker Hub:${NC}"
docker login

# Step 5: Push images
echo -e "${BLUE}Step 5: Pushing images...${NC}"
./push-images-v4.5.sh

# Step 6: Verify
echo -e "${BLUE}Step 6: Verification...${NC}"
echo -e "${GREEN}✅ Images pushed successfully!${NC}"
echo ""
echo -e "${YELLOW}Verify on Docker Hub:${NC}"
echo "Backend: https://hub.docker.com/r/sanketsmane/ems-backend"
echo "Frontend: https://hub.docker.com/r/sanketsmane/ems-frontend"

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy to production: ./deploy-v4.5.sh"
echo "2. Update production docker-compose files"
echo "3. Monitor deployment logs"
