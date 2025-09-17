#!/bin/bash

# Team Sharing Script for Employee Management System
# This script helps team members deploy the EMS application using shared Docker images

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="sanketsmane"
PROJECT_NAME="ems"
VERSION=${VERSION:-"latest"}

echo -e "${BLUE}🚀 Employee Management System - Team Deployment${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo ""

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --dev        Start development environment"
    echo "  --prod       Start production environment"
    echo "  --stop       Stop all services"
    echo "  --logs       View application logs"
    echo "  --update     Pull latest images and restart"
    echo "  --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --dev     # Start development environment"
    echo "  $0 --prod    # Start production environment"
    echo "  $0 --update  # Update to latest version"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"

    # Check Docker
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ docker-compose not found. Please install docker-compose.${NC}"
        echo -e "${YELLOW}💡 Install guide: https://docs.docker.com/compose/install/${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to setup environment file
setup_environment() {
    local env_type=$1
    local env_file=""
    
    if [ "$env_type" == "dev" ]; then
        env_file=".env.dev"
        echo -e "${YELLOW}🔧 Setting up development environment...${NC}"
    else
        env_file=".env.prod"
        echo -e "${YELLOW}🔧 Setting up production environment...${NC}"
    fi

    if [ ! -f "$env_file" ]; then
        echo -e "${YELLOW}📝 Environment file $env_file not found.${NC}"
        echo -e "${YELLOW}💡 Please create $env_file with your configuration.${NC}"
        echo ""
        echo -e "${BLUE}Required environment variables:${NC}"
        echo "MONGODB_URI=your_mongodb_connection_string"
        echo "JWT_SECRET=your_jwt_secret"
        echo "EMAIL_USER=your_email@gmail.com"
        echo "EMAIL_PASS=your_app_password"
        echo "CLOUDINARY_CLOUD_NAME=your_cloud_name"
        echo "CLOUDINARY_API_KEY=your_api_key"
        echo "CLOUDINARY_API_SECRET=your_api_secret"
        echo "FRONTEND_URL=http://localhost"
        echo ""
        read -p "Press Enter after creating the environment file..."
        
        if [ ! -f "$env_file" ]; then
            echo -e "${RED}❌ Environment file still not found. Exiting.${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Environment file configured${NC}"
}

# Function to start development environment
start_dev() {
    echo -e "${BLUE}🚀 Starting development environment...${NC}"
    setup_environment "dev"
    
    # Pull latest images
    echo -e "${YELLOW}📥 Pulling latest development images...${NC}"
    docker-compose -f docker-compose.dev.yml pull
    
    # Start services
    echo -e "${YELLOW}🏃 Starting services...${NC}"
    docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
    
    echo -e "${GREEN}✅ Development environment started!${NC}"
    echo -e "${BLUE}📱 Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}🔧 Backend API: http://localhost:8000/api${NC}"
}

# Function to start production environment
start_prod() {
    echo -e "${BLUE}🚀 Starting production environment...${NC}"
    setup_environment "prod"
    
    # Pull latest images
    echo -e "${YELLOW}📥 Pulling latest production images...${NC}"
    docker-compose -f docker-compose.share.yml pull
    
    # Create data directories
    echo -e "${YELLOW}📁 Creating data directories...${NC}"
    mkdir -p uploads logs
    
    # Start services
    echo -e "${YELLOW}🏃 Starting services...${NC}"
    docker-compose -f docker-compose.share.yml --env-file .env.prod up -d
    
    # Health check
    echo -e "${BLUE}🏥 Performing health checks...${NC}"
    sleep 15
    
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend health check pending...${NC}"
    fi
    
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend health check pending...${NC}"
    fi
    
    echo -e "${GREEN}✅ Production environment started!${NC}"
    echo -e "${BLUE}📱 Frontend: http://localhost${NC}"
    echo -e "${BLUE}🔧 Backend API: http://localhost:8000/api${NC}"
}

# Function to stop all services
stop_services() {
    echo -e "${BLUE}🛑 Stopping all services...${NC}"
    
    # Stop development services
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    # Stop production services
    docker-compose -f docker-compose.share.yml down 2>/dev/null || true
    
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Function to view logs
view_logs() {
    echo -e "${BLUE}📊 Application logs:${NC}"
    echo ""
    
    # Check which environment is running
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        echo -e "${YELLOW}Development environment logs:${NC}"
        docker-compose -f docker-compose.dev.yml logs -f --tail=50
    elif docker-compose -f docker-compose.share.yml ps | grep -q "Up"; then
        echo -e "${YELLOW}Production environment logs:${NC}"
        docker-compose -f docker-compose.share.yml logs -f --tail=50
    else
        echo -e "${YELLOW}⚠️  No services are currently running${NC}"
    fi
}

# Function to update services
update_services() {
    echo -e "${BLUE}🔄 Updating to latest version...${NC}"
    
    # Pull latest images
    echo -e "${YELLOW}📥 Pulling latest images...${NC}"
    docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:latest
    docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:latest
    
    # Restart services if running
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        echo -e "${YELLOW}🔄 Restarting development environment...${NC}"
        docker-compose -f docker-compose.dev.yml up -d
    fi
    
    if docker-compose -f docker-compose.share.yml ps | grep -q "Up"; then
        echo -e "${YELLOW}🔄 Restarting production environment...${NC}"
        docker-compose -f docker-compose.share.yml up -d
    fi
    
    echo -e "${GREEN}✅ Update completed${NC}"
}

# Main script logic
case "$1" in
    --dev)
        check_prerequisites
        start_dev
        ;;
    --prod)
        check_prerequisites
        start_prod
        ;;
    --stop)
        stop_services
        ;;
    --logs)
        view_logs
        ;;
    --update)
        check_prerequisites
        update_services
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
echo -e "${YELLOW}📚 Useful commands:${NC}"
echo -e "${YELLOW}  View status: docker-compose ps${NC}"
echo -e "${YELLOW}  View logs: $0 --logs${NC}"
echo -e "${YELLOW}  Stop services: $0 --stop${NC}"
echo -e "${YELLOW}  Update images: $0 --update${NC}"