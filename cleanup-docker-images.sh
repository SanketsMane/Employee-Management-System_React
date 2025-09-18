#!/bin/bash

# Docker Image Cleanup Script for Formonex EMS
# Keeps only the latest production images and removes old versions

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧹 Docker Image Cleanup for Formonex EMS${NC}"
echo ""

# Function to remove images by tag pattern
remove_old_images() {
    local image_name=$1
    local keep_tags=$2
    
    echo -e "${YELLOW}📋 Cleaning up ${image_name} images...${NC}"
    
    # Get all tags for the image
    local all_tags=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep "^${image_name}:" | cut -d: -f2)
    
    for tag in $all_tags; do
        local should_keep=false
        
        # Check if this tag should be kept
        for keep_tag in $keep_tags; do
            if [[ "$tag" == "$keep_tag" ]]; then
                should_keep=true
                break
            fi
        done
        
        if [[ "$should_keep" == false ]]; then
            echo -e "${RED}🗑️  Removing: ${image_name}:${tag}${NC}"
            docker rmi "${image_name}:${tag}" 2>/dev/null || echo -e "${YELLOW}⚠️  Could not remove ${image_name}:${tag} (may be in use)${NC}"
        else
            echo -e "${GREEN}✅ Keeping: ${image_name}:${tag}${NC}"
        fi
    done
}

# Define which images to keep
FRONTEND_KEEP_TAGS="latest v4.2 https-fixed"
BACKEND_KEEP_TAGS="latest v4.1 https-ready"

echo -e "${BLUE}📦 Current Docker images:${NC}"
docker images | grep sanketsmane

echo ""
echo -e "${YELLOW}🎯 Images to keep:${NC}"
echo -e "${GREEN}Frontend: ${FRONTEND_KEEP_TAGS}${NC}"
echo -e "${GREEN}Backend: ${BACKEND_KEEP_TAGS}${NC}"
echo ""

read -p "Do you want to proceed with cleanup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Cleanup cancelled${NC}"
    exit 0
fi

echo -e "${BLUE}🚀 Starting cleanup...${NC}"
echo ""

# Clean up frontend images
remove_old_images "sanketsmane/ems-frontend" "$FRONTEND_KEEP_TAGS"

echo ""

# Clean up backend images
remove_old_images "sanketsmane/ems-backend" "$BACKEND_KEEP_TAGS"

echo ""
echo -e "${BLUE}🧹 Cleaning up dangling images...${NC}"
docker image prune -f

echo ""
echo -e "${GREEN}✅ Cleanup completed!${NC}"
echo ""
echo -e "${BLUE}📦 Remaining images:${NC}"
docker images | grep sanketsmane

echo ""
echo -e "${YELLOW}📊 Docker system usage:${NC}"
docker system df

echo ""
echo -e "${GREEN}🎉 Docker cleanup completed! Only production-ready images remain.${NC}"
echo -e "${BLUE}💡 You can also run: docker system prune -a to remove all unused images${NC}"