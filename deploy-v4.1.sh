#!/bin/bash

# 🚀 Production Deployment Script for EMS v4.1
# This script deploys the Employee Management System with comprehensive role system and asset fixes

set -e

echo "🚀 Employee Management System - Production Deployment v4.1"
echo "============================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Check if environment file exists
if [ ! -f .env ]; then
    print_warning "No .env file found. Creating a template..."
    cat > .env << EOL
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your-connection-string

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Frontend URL
FRONTEND_URL=https://your-domain.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Version
VERSION=v4.1
EOL
    print_warning "Please edit the .env file with your actual values before running again."
    exit 1
fi

print_status "Environment file found"

# Source the environment file
source .env

# Check required environment variables
required_vars=("MONGODB_URI" "JWT_SECRET" "EMAIL_USER" "EMAIL_PASS")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Missing required environment variables: ${missing_vars[*]}"
    print_info "Please set these in your .env file"
    exit 1
fi

print_status "All required environment variables are set"

# Pull the latest images
print_info "Pulling Docker images v4.1..."
docker pull sanketsmane/ems-backend:v4.1
docker pull sanketsmane/ems-frontend:v4.1

print_status "Docker images pulled successfully"

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down --remove-orphans 2>/dev/null || true

print_status "Existing containers stopped"

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p uploads logs backups

print_status "Directories created"

# Start the application
print_info "Starting Employee Management System v4.1..."
VERSION=v4.1 docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
print_info "Waiting for services to be healthy..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose -f docker-compose.production.yml ps | grep -q "healthy"; then
        break
    fi
    echo "Waiting... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

# Check if services are running
backend_status=$(docker-compose -f docker-compose.production.yml ps backend | grep -c "Up" || echo "0")
frontend_status=$(docker-compose -f docker-compose.production.yml ps frontend | grep -c "Up" || echo "0")

if [ "$backend_status" -eq 1 ] && [ "$frontend_status" -eq 1 ]; then
    print_status "Employee Management System v4.1 deployed successfully!"
    echo ""
    print_info "🌟 NEW FEATURES IN v4.1:"
    echo "   • 🔧 FIXED: Asset loading issues (404 errors resolved)"
    echo "   • 70+ Professional Roles with Smart Autocomplete"
    echo "   • Streamlined Registration (Removed Employee ID & Position fields)"
    echo "   • Auto-generated FSID Employee IDs (FSID001, FSID002, etc.)"
    echo "   • Custom Role Support with 'Other' option"
    echo "   • Enhanced Role Categories (Traditional, Internship, Data & Analytics, Development, Cloud & Infrastructure, Design)"
    echo "   • Intelligent Position Auto-assignment from Role"
    echo "   • Improved Nginx asset routing for production"
    echo ""
    print_info "📱 Application URLs:"
    echo "   Frontend: http://localhost:80"
    echo "   Backend API: http://localhost:8000"
    echo "   Health Check: http://localhost:8000/api/health"
    echo ""
    print_info "📋 Container Status:"
    docker-compose -f docker-compose.production.yml ps
    echo ""
    print_info "📊 Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    echo ""
    print_status "🎉 Deployment completed successfully!"
    print_info "💡 To view logs: docker-compose -f docker-compose.production.yml logs -f"
    print_info "🛑 To stop: docker-compose -f docker-compose.production.yml down"
    echo ""
    print_info "🧪 VERIFICATION STEPS:"
    echo "   1. Clear browser cache"
    echo "   2. Navigate to your domain/admin"
    echo "   3. Check DevTools console (should be clean of 404 errors)"
    echo "   4. Test registration with role autocomplete"
    echo "   5. Verify FSID employee ID generation"
else
    print_error "Deployment failed. Some services are not running."
    print_info "Checking logs..."
    docker-compose -f docker-compose.production.yml logs --tail=20
    exit 1
fi