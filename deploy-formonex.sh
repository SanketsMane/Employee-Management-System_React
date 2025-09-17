#!/bin/bash

# Formonex EMS Deployment Script
# Production-ready deployment for ems.formonex.in

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
DOCKER_REGISTRY="sanketsmane"
PROJECT_NAME="ems"
VERSION=${VERSION:-"v4.0"}
DOMAIN="ems.formonex.in"

echo -e "${BLUE}🚀 Formonex Employee Management System - Production Deployment${NC}"
echo -e "${PURPLE}🌐 Domain: ${DOMAIN}${NC}"
echo -e "${BLUE}📦 Version: ${VERSION}${NC}"
echo ""

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --deploy     Deploy Formonex EMS production environment"
    echo "  --stop       Stop all services"
    echo "  --logs       View application logs"
    echo "  --status     Check service status"
    echo "  --update     Pull latest images and restart"
    echo "  --backup     Create data backup"
    echo "  --restore    Restore from backup"
    echo "  --health     Perform health checks"
    echo "  --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --deploy    # Deploy production environment"
    echo "  $0 --status    # Check service status"
    echo "  $0 --update    # Update to latest version"
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

    # Check available disk space
    AVAILABLE_SPACE=$(df . | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2000000 ]; then
        echo -e "${YELLOW}⚠️  Warning: Low disk space. Ensure at least 2GB free space.${NC}"
    fi

    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to setup environment
setup_environment() {
    echo -e "${YELLOW}🔧 Setting up Formonex production environment...${NC}"
    
    if [ ! -f ".env.prod" ]; then
        if [ -f ".env.formonex.template" ]; then
            echo -e "${YELLOW}📝 Creating .env.prod from Formonex template...${NC}"
            cp .env.formonex.template .env.prod
            echo -e "${BLUE}📋 Please edit .env.prod and fill in the required values:${NC}"
            echo "  - MONGODB_URI"
            echo "  - JWT_SECRET"
            echo "  - EMAIL_USER and EMAIL_PASS"
            echo "  - CLOUDINARY credentials"
            echo ""
            read -p "Press Enter after configuring .env.prod..."
        else
            echo -e "${RED}❌ Environment template not found.${NC}"
            exit 1
        fi
    fi
    
    # Verify required environment variables
    source .env.prod
    
    REQUIRED_VARS=("MONGODB_URI" "JWT_SECRET" "EMAIL_USER" "EMAIL_PASS" "CLOUDINARY_CLOUD_NAME")
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        printf '%s\n' "${MISSING_VARS[@]}"
        echo -e "${YELLOW}💡 Please configure these in .env.prod${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment configuration validated${NC}"
}

# Function to create necessary directories
create_directories() {
    echo -e "${YELLOW}📁 Creating data directories...${NC}"
    
    mkdir -p data/uploads data/logs data/backups
    
    # Set proper permissions
    chmod 755 data/uploads data/logs data/backups
    
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Function to deploy production environment
deploy_production() {
    echo -e "${BLUE}🚀 Deploying Formonex EMS Production...${NC}"
    
    check_prerequisites
    setup_environment
    create_directories
    
    # Pull latest images
    echo -e "${YELLOW}📥 Pulling latest production images...${NC}"
    docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
    docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
    
    # Start services
    echo -e "${YELLOW}🏃 Starting Formonex EMS services...${NC}"
    docker-compose -f docker-compose.formonex.yml --env-file .env.prod up -d
    
    # Wait for services to start
    echo -e "${BLUE}⏳ Waiting for services to initialize...${NC}"
    sleep 30
    
    # Perform health checks
    perform_health_checks
    
    echo -e "${GREEN}✅ Formonex EMS Production deployment completed!${NC}"
    echo -e "${BLUE}🌐 Frontend: http://${DOMAIN}${NC}"
    echo -e "${BLUE}🔧 Backend API: Check with DevOps for backend endpoint${NC}"
    echo -e "${YELLOW}📊 View logs: $0 --logs${NC}"
}

# Function to perform health checks
perform_health_checks() {
    echo -e "${BLUE}🏥 Performing health checks...${NC}"
    
    # Check frontend
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend health check pending...${NC}"
    fi
    
    # Check backend
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend health check pending...${NC}"
    fi
    
    # Check Docker containers
    echo -e "${BLUE}📊 Container status:${NC}"
    docker-compose -f docker-compose.formonex.yml ps
}

# Function to view logs
view_logs() {
    echo -e "${BLUE}📊 Formonex EMS Application logs:${NC}"
    echo ""
    
    if docker-compose -f docker-compose.formonex.yml ps | grep -q "Up"; then
        docker-compose -f docker-compose.formonex.yml logs -f --tail=50
    else
        echo -e "${YELLOW}⚠️  No services are currently running${NC}"
    fi
}

# Function to check status
check_status() {
    echo -e "${BLUE}📊 Formonex EMS Service Status:${NC}"
    echo ""
    
    # Docker containers
    docker-compose -f docker-compose.formonex.yml ps
    echo ""
    
    # System resources
    echo -e "${BLUE}💻 System Resources:${NC}"
    echo "Memory Usage: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
    echo "Disk Usage: $(df -h . | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
    echo ""
    
    # Network connectivity
    echo -e "${BLUE}🌐 Network Connectivity:${NC}"
    if curl -s http://localhost:80 > /dev/null; then
        echo "✅ Frontend accessible"
    else
        echo "❌ Frontend not accessible"
    fi
    
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ Backend accessible"
    else
        echo "❌ Backend not accessible"
    fi
}

# Function to stop services
stop_services() {
    echo -e "${BLUE}🛑 Stopping Formonex EMS services...${NC}"
    
    docker-compose -f docker-compose.formonex.yml down
    
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Function to update services
update_services() {
    echo -e "${BLUE}🔄 Updating Formonex EMS to latest version...${NC}"
    
    # Pull latest images
    echo -e "${YELLOW}📥 Pulling latest images...${NC}"
    docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
    docker pull ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
    
    # Restart services
    echo -e "${YELLOW}🔄 Restarting services...${NC}"
    docker-compose -f docker-compose.formonex.yml --env-file .env.prod up -d
    
    # Health check after update
    sleep 20
    perform_health_checks
    
    echo -e "${GREEN}✅ Update completed${NC}"
}

# Function to create backup
create_backup() {
    echo -e "${BLUE}💾 Creating Formonex EMS backup...${NC}"
    
    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="formonex_ems_backup_${BACKUP_DATE}.tar.gz"
    
    # Create backup of volumes and configuration
    docker run --rm \
        -v formonex_ems_uploads:/uploads \
        -v formonex_ems_logs:/logs \
        -v $(pwd):/backup \
        alpine tar czf /backup/data/backups/${BACKUP_FILE} /uploads /logs
    
    # Backup configuration files
    tar czf data/backups/config_${BACKUP_DATE}.tar.gz .env.prod docker-compose.formonex.yml
    
    echo -e "${GREEN}✅ Backup created: data/backups/${BACKUP_FILE}${NC}"
    echo -e "${GREEN}✅ Config backup: data/backups/config_${BACKUP_DATE}.tar.gz${NC}"
}

# Main script logic
case "$1" in
    --deploy)
        deploy_production
        ;;
    --stop)
        stop_services
        ;;
    --logs)
        view_logs
        ;;
    --status)
        check_status
        ;;
    --update)
        check_prerequisites
        update_services
        ;;
    --backup)
        create_backup
        ;;
    --health)
        perform_health_checks
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
echo -e "${YELLOW}  Check status: $0 --status${NC}"
echo -e "${YELLOW}  View logs: $0 --logs${NC}"
echo -e "${YELLOW}  Health check: $0 --health${NC}"
echo -e "${YELLOW}  Create backup: $0 --backup${NC}"
echo -e "${YELLOW}  Stop services: $0 --stop${NC}"
echo ""
echo -e "${PURPLE}🏢 Formonex Employee Management System${NC}"
echo -e "${BLUE}📧 Support: contactsanket1@gmail.com${NC}"