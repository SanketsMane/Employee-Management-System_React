#!/bin/bash

# Build EMS Docker Images v4.5
# This script creates new Docker images with version 4.5

set -e

echo "🚀 Building EMS Docker Images v4.5"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Function to build and tag image
build_image() {
    local service=$1
    local context_dir=$2
    local dockerfile=$3
    
    echo -e "${BLUE}📦 Building ${service} image...${NC}"
    
    # Build the image
    docker build \
        -t sanketsmane/ems-${service}:v4.5 \
        -t sanketsmane/ems-${service}:latest \
        -f ${dockerfile} \
        ${context_dir}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${service} image built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build ${service} image${NC}"
        exit 1
    fi
}

# Build backend image
echo -e "${YELLOW}Building Backend Image...${NC}"
build_image "backend" "./backend" "./backend/Dockerfile"

# Build frontend image
echo -e "${YELLOW}Building Frontend Image...${NC}"
build_image "frontend" "./frontend" "./frontend/Dockerfile"

# List created images
echo -e "${BLUE}📋 Created images:${NC}"
docker images | grep "sanketsmane/ems" | grep -E "(v4.5|latest)"

echo -e "${GREEN}🎉 All images built successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Image sizes:${NC}"
docker images sanketsmane/ems-backend:v4.5 --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
docker images sanketsmane/ems-frontend:v4.5 --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo "1. Test the images locally: ./test-images-v4.5.sh"
echo "2. Push to Docker Hub: ./push-images-v4.5.sh"
echo "3. Deploy to production: ./deploy-v4.5.sh"