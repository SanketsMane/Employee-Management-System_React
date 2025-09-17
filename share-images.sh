#!/bin/bash

# Docker Image Sharing Script for EMS Team
# This script helps build, tag, and share Docker images

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOCKER_REGISTRY="sanketsmane"
PROJECT_NAME="ems"
VERSION=${VERSION:-"latest"}

echo -e "${BLUE}🐳 Docker Image Sharing Script${NC}"
echo -e "${BLUE}Project: ${PROJECT_NAME} | Version: ${VERSION}${NC}"
echo ""

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --build      Build Docker images locally"
    echo "  --push       Build and push to Docker Hub"
    echo "  --export     Export images to tar files"
    echo "  --pull       Pull latest images from Docker Hub"
    echo "  --share      Create shareable package"
    echo "  --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --build   # Build images locally"
    echo "  $0 --push    # Build and push to Docker Hub"
    echo "  $0 --export  # Export for offline sharing"
}

# Function to build images
build_images() {
    echo -e "${BLUE}🏗️  Building Docker images...${NC}"
    
    # Load environment variables if available
    if [ -f ".env.aws" ]; then
        export $(cat .env.aws | grep -v '^#' | xargs)
    fi
    
    # Build backend
    echo -e "${YELLOW}Building backend image...${NC}"
    docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION} \
        -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:latest \
        --target production \
        ./backend
    
    # Build frontend
    echo -e "${YELLOW}Building frontend image...${NC}"
    docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION} \
        -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:latest \
        --target production \
        --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:8000/api}" \
        --build-arg VITE_WEBSOCKET_URL="${VITE_WEBSOCKET_URL:-ws://localhost:8000}" \
        --build-arg VITE_CLOUDINARY_CLOUD_NAME="${CLOUDINARY_CLOUD_NAME}" \
        --build-arg VITE_CLOUDINARY_API_KEY="${CLOUDINARY_API_KEY}" \
        --build-arg VITE_APP_NAME="${VITE_APP_NAME:-Employee Management System}" \
        ./frontend
    
    echo -e "${GREEN}✅ Images built successfully!${NC}"
    
    # Show image sizes
    echo -e "${BLUE}📊 Image sizes:${NC}"
    docker images | grep "${DOCKER_REGISTRY}/${PROJECT_NAME}"
}

# Function to push to Docker Hub
push_images() {
    echo -e "${BLUE}📤 Pushing images to Docker Hub...${NC}"
    
    # Check if logged in
    if ! docker info | grep -q "Username"; then
        echo -e "${YELLOW}🔐 Please login to Docker Hub:${NC}"
        docker login
    fi
    
    # Push images
    echo -e "${YELLOW}Pushing backend images...${NC}"
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:latest
    
    echo -e "${YELLOW}Pushing frontend images...${NC}"
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:latest
    
    echo -e "${GREEN}✅ Images pushed successfully!${NC}"
    echo -e "${BLUE}🌐 Images available at:${NC}"
    echo -e "${BLUE}  - https://hub.docker.com/r/${DOCKER_REGISTRY}/${PROJECT_NAME}-backend${NC}"
    echo -e "${BLUE}  - https://hub.docker.com/r/${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend${NC}"
}

# Function to export images
export_images() {
    echo -e "${BLUE}📦 Exporting images for offline sharing...${NC}"
    
    # Create exports directory
    mkdir -p exports
    
    # Export images
    echo -e "${YELLOW}Exporting backend image...${NC}"
    docker save ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION} | gzip > exports/ems-backend-${VERSION}.tar.gz
    
    echo -e "${YELLOW}Exporting frontend image...${NC}"
    docker save ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION} | gzip > exports/ems-frontend-${VERSION}.tar.gz
    
    # Create sharing package
    echo -e "${YELLOW}Creating sharing package...${NC}"
    cat > exports/load-images.sh << 'EOF'
#!/bin/bash
echo "Loading EMS Docker images..."
docker load -i ems-backend-*.tar.gz
docker load -i ems-frontend-*.tar.gz
echo "✅ Images loaded successfully!"
echo "Run: docker images | grep ems"
EOF
    
    chmod +x exports/load-images.sh
    
    # Show export info
    echo -e "${GREEN}✅ Images exported successfully!${NC}"
    echo -e "${BLUE}📁 Files created in exports/ directory:${NC}"
    ls -lh exports/
    
    echo -e "${YELLOW}📋 To share with team:${NC}"
    echo -e "${YELLOW}  1. Send the exports/ folder to team members${NC}"
    echo -e "${YELLOW}  2. Team runs: ./load-images.sh${NC}"
    echo -e "${YELLOW}  3. Team runs: ./team-deploy.sh --prod${NC}"
}

# Function to pull images
pull_images() {
    echo -e "${BLUE}📥 Pulling latest images from Docker Hub...${NC}"
    
    docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:latest
    docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:latest
    
    echo -e "${GREEN}✅ Latest images pulled successfully!${NC}"
}

# Function to create shareable package
create_share_package() {
    echo -e "${BLUE}📦 Creating complete shareable package...${NC}"
    
    # Create package directory
    PACKAGE_NAME="ems-deployment-package-$(date +%Y%m%d)"
    mkdir -p ${PACKAGE_NAME}
    
    # Copy essential files
    cp team-deploy.sh ${PACKAGE_NAME}/
    cp docker-compose.share.yml ${PACKAGE_NAME}/
    cp .env.aws.template ${PACKAGE_NAME}/.env.template
    cp QUICK_START.md ${PACKAGE_NAME}/
    cp DOCKER_DEPLOYMENT_GUIDE.md ${PACKAGE_NAME}/
    
    # Create README for package
    cat > ${PACKAGE_NAME}/README.md << EOF
# EMS Deployment Package

## Quick Start
1. Copy .env.template to .env.prod and configure
2. Run: ./team-deploy.sh --prod
3. Access: http://localhost

## What's Included
- team-deploy.sh: Automated deployment script
- docker-compose.share.yml: Docker Compose configuration
- .env.template: Environment variables template
- Documentation: Setup and deployment guides

## Docker Images
- sanketsmane/ems-backend:latest
- sanketsmane/ems-frontend:latest

## Support
Contact: contactsanket1@gmail.com
EOF
    
    # Create zip package
    zip -r ${PACKAGE_NAME}.zip ${PACKAGE_NAME}/
    
    echo -e "${GREEN}✅ Shareable package created: ${PACKAGE_NAME}.zip${NC}"
    echo -e "${BLUE}📁 Package contents:${NC}"
    ls -la ${PACKAGE_NAME}/
    
    echo -e "${YELLOW}📤 Share ${PACKAGE_NAME}.zip with your team!${NC}"
}

# Main script logic
case "$1" in
    --build)
        build_images
        ;;
    --push)
        build_images
        push_images
        ;;
    --export)
        build_images
        export_images
        ;;
    --pull)
        pull_images
        ;;
    --share)
        create_share_package
        ;;
    --help)
        show_usage
        ;;
    "")
        echo -e "${YELLOW}No option specified. Use --help to see available options.${NC}"
        show_usage
        ;;
    *)
        echo -e "${RED}Invalid option: $1${NC}"
        show_usage
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Sharing script completed!${NC}"