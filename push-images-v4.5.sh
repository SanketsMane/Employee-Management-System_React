#!/bin/bash

# Push EMS Docker Images v4.5 to Docker Hub
# This script pushes the built images to Docker Hub

set -e

echo "🚀 Pushing EMS Docker Images v4.5 to Docker Hub"
echo "==============================================="

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

# Check if images exist
if ! docker images sanketsmane/ems-backend:v4.5 | grep -q v4.5; then
    echo -e "${RED}❌ Backend image v4.5 not found. Please build images first.${NC}"
    exit 1
fi

if ! docker images sanketsmane/ems-frontend:v4.5 | grep -q v4.5; then
    echo -e "${RED}❌ Frontend image v4.5 not found. Please build images first.${NC}"
    exit 1
fi

# Login to Docker Hub (if not already logged in)
echo -e "${BLUE}🔐 Checking Docker Hub authentication...${NC}"
if ! docker info | grep -q "Username:"; then
    echo -e "${YELLOW}⚠️  Not logged in to Docker Hub. Please login:${NC}"
    docker login
fi

# Function to push image
push_image() {
    local image_name=$1
    local tag=$2
    
    echo -e "${BLUE}📤 Pushing ${image_name}:${tag}...${NC}"
    
    docker push ${image_name}:${tag}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${image_name}:${tag} pushed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to push ${image_name}:${tag}${NC}"
        exit 1
    fi
}

# Push backend images
echo -e "${YELLOW}Pushing Backend Images...${NC}"
push_image "sanketsmane/ems-backend" "v4.5"
push_image "sanketsmane/ems-backend" "latest"

# Push frontend images
echo -e "${YELLOW}Pushing Frontend Images...${NC}"
push_image "sanketsmane/ems-frontend" "v4.5"
push_image "sanketsmane/ems-frontend" "latest"

echo -e "${GREEN}🎉 All images pushed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Pushed images:${NC}"
echo "- sanketsmane/ems-backend:v4.5"
echo "- sanketsmane/ems-backend:latest"
echo "- sanketsmane/ems-frontend:v4.5"
echo "- sanketsmane/ems-frontend:latest"

echo ""
echo -e "${YELLOW}🌐 Docker Hub URLs:${NC}"
echo "Backend: https://hub.docker.com/r/sanketsmane/ems-backend"
echo "Frontend: https://hub.docker.com/r/sanketsmane/ems-frontend"

echo ""
echo -e "${YELLOW}🚀 Next step:${NC}"
echo "Deploy to production: ./deploy-v4.5.sh"