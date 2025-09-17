#!/bin/bash

# AWS Deployment Script for Employee Management System
# Supports both EC2 and Docker Hub deployment methods

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="sanketsmane"
PROJECT_NAME="ems"
VERSION=${VERSION:-"v3.0"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

echo -e "${BLUE}🚀 AWS Deployment Script for Employee Management System${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo ""

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --ec2        Deploy using Docker Compose on EC2"
    echo "  --ecs        Deploy using AWS ECS (Container Service)"
    echo "  --build      Build and push Docker images only"
    echo "  --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --ec2     # Deploy to EC2 using Docker Compose"
    echo "  $0 --ecs     # Deploy to AWS ECS"
    echo "  $0 --build   # Build and push images to Docker Hub"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"

    # Check Docker
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi

    # Check Docker Compose for EC2 deployment
    if [[ "$1" == "ec2" ]] && ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ docker-compose not found. Please install docker-compose.${NC}"
        exit 1
    fi

    # Check AWS CLI for ECS deployment
    if [[ "$1" == "ecs" ]] && ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to build and push Docker images
build_and_push() {
    echo -e "${BLUE}🏗️  Building Docker images...${NC}"

    # Load environment variables if available
    if [ -f ".env.aws" ]; then
        export $(cat .env.aws | grep -v '^#' | xargs)
    fi

    # Build backend image
    echo -e "${YELLOW}Building backend image...${NC}"
    docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION} \
        -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:latest \
        --target production \
        ./backend

    # Build frontend image
    echo -e "${YELLOW}Building frontend image...${NC}"
    docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION} \
        -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:latest \
        --target production \
        --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
        --build-arg VITE_WEBSOCKET_URL="${VITE_WEBSOCKET_URL}" \
        --build-arg VITE_CLOUDINARY_CLOUD_NAME="${CLOUDINARY_CLOUD_NAME}" \
        --build-arg VITE_CLOUDINARY_API_KEY="${CLOUDINARY_API_KEY}" \
        --build-arg VITE_APP_NAME="${VITE_APP_NAME}" \
        ./frontend

    echo -e "${GREEN}✅ Images built successfully${NC}"

    # Push to Docker Hub
    echo -e "${BLUE}📤 Pushing images to Docker Hub...${NC}"
    
    echo -e "${YELLOW}Please ensure you're logged in to Docker Hub (run: docker login)${NC}"
    read -p "Press Enter to continue..."

    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:latest
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:latest

    echo -e "${GREEN}✅ Images pushed successfully${NC}"
}

# Function to deploy on EC2
deploy_ec2() {
    echo -e "${BLUE}🚢 Deploying to EC2 using Docker Compose...${NC}"

    # Check environment file
    if [ ! -f ".env.aws" ]; then
        echo -e "${RED}❌ .env.aws file not found${NC}"
        echo -e "${YELLOW}💡 Please copy .env.aws.template to .env.aws and configure it${NC}"
        exit 1
    fi

    # Stop existing containers
    echo -e "${YELLOW}Stopping existing containers...${NC}"
    docker-compose -f docker-compose.production.yml --env-file .env.aws down 2>/dev/null || true

    # Create data directories
    echo -e "${YELLOW}Creating data directories...${NC}"
    sudo mkdir -p /data/uploads /data/logs
    sudo chown -R $USER:$USER /data

    # Pull and start services
    echo -e "${YELLOW}Starting services...${NC}"
    docker-compose -f docker-compose.production.yml --env-file .env.aws pull
    docker-compose -f docker-compose.production.yml --env-file .env.aws up -d

    # Health check
    echo -e "${BLUE}🏥 Performing health checks...${NC}"
    sleep 30

    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
    fi

    if curl -f http://localhost:80 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
    else
        echo -e "${RED}❌ Frontend health check failed${NC}"
    fi

    echo -e "${GREEN}🎉 EC2 Deployment Complete!${NC}"
    echo -e "${BLUE}📱 Frontend: http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-ec2-ip')${NC}"
    echo -e "${BLUE}🔧 Backend API: http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-ec2-ip'):8000/api${NC}"
}

# Function to deploy on ECS
deploy_ecs() {
    echo -e "${BLUE}🚢 Deploying to AWS ECS...${NC}"
    
    # Check AWS configuration
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
        exit 1
    fi

    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo -e "${GREEN}📋 Using AWS Account: ${AWS_ACCOUNT_ID}${NC}"

    # ECR login and repository setup
    echo -e "${YELLOW}Setting up ECR repositories...${NC}"
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

    # Create repositories if they don't exist
    aws ecr describe-repositories --repository-names ems-backend --region $AWS_REGION &> /dev/null || \
    aws ecr create-repository --repository-name ems-backend --region $AWS_REGION

    aws ecr describe-repositories --repository-names ems-frontend --region $AWS_REGION &> /dev/null || \
    aws ecr create-repository --repository-name ems-frontend --region $AWS_REGION

    # Tag and push to ECR
    docker tag ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ems-backend:latest
    docker tag ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ems-frontend:latest

    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ems-backend:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ems-frontend:latest

    echo -e "${GREEN}✅ Images pushed to ECR${NC}"
    echo -e "${YELLOW}� Please deploy using aws-cloudformation.yaml or ECS console${NC}"
}

# Main script logic
case "$1" in
    --ec2)
        check_prerequisites "ec2"
        build_and_push
        deploy_ec2
        ;;
    --ecs)
        check_prerequisites "ecs"
        build_and_push
        deploy_ecs
        ;;
    --build)
        check_prerequisites "build"
        build_and_push
        ;;
    --help)
        show_usage
        ;;
    "")
        echo -e "${YELLOW}No option specified. Defaulting to EC2 deployment.${NC}"
        check_prerequisites "ec2"
        build_and_push
        deploy_ec2
        ;;
    *)
        echo -e "${RED}Invalid option: $1${NC}"
        show_usage
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment script completed!${NC}"
echo ""
echo -e "${YELLOW}📊 Useful commands:${NC}"
echo -e "${YELLOW}  View logs: docker-compose -f docker-compose.production.yml logs -f${NC}"
echo -e "${YELLOW}  Restart: docker-compose -f docker-compose.production.yml restart${NC}"
echo -e "${YELLOW}  Status: docker-compose -f docker-compose.production.yml ps${NC}"
