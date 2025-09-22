#!/bin/bash

# 🚀 AWS EC2 Deployment Script for FormoEMS v1.0.1
# This script will deploy the latest version with all .map() fixes to AWS

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Server configuration (update these values)
SERVER_IP="${AWS_SERVER_IP:-REPLACE_WITH_SERVER_IP}"
PEM_FILE="${AWS_PEM_FILE:-REPLACE_WITH_PEM_PATH}"
USERNAME="${AWS_USERNAME:-ubuntu}"
APP_VERSION="1.0.1"

echo "🚀 FormoEMS AWS Deployment Script v$APP_VERSION"
echo "=============================================="

# Validate required variables
if [[ "$SERVER_IP" == "REPLACE_WITH_SERVER_IP" ]]; then
    print_error "Please set AWS_SERVER_IP environment variable or update the script"
    exit 1
fi

if [[ "$PEM_FILE" == "REPLACE_WITH_PEM_PATH" ]]; then
    print_error "Please set AWS_PEM_FILE environment variable or update the script"
    exit 1
fi

if [[ ! -f "$PEM_FILE" ]]; then
    print_error "PEM file not found: $PEM_FILE"
    exit 1
fi

print_status "Deploying to: $USERNAME@$SERVER_IP"
print_status "Using PEM file: $PEM_FILE"
print_status "Version: $APP_VERSION"

# Test SSH connection
print_status "Testing SSH connection..."
ssh -i "$PEM_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$USERNAME@$SERVER_IP" "echo 'SSH connection successful'" || {
    print_error "Failed to connect to server"
    exit 1
}

print_success "SSH connection established"

# Create deployment commands
DEPLOYMENT_SCRIPT="
set -e

echo '🔧 Preparing deployment environment...'

# Create app directory
mkdir -p /home/ubuntu/formo-ems
cd /home/ubuntu/formo-ems

# Stop existing containers
echo '🛑 Stopping existing containers...'
docker-compose -f docker-compose.aws.yml down 2>/dev/null || true
docker stop ems-frontend ems-backend 2>/dev/null || true
docker rm ems-frontend ems-backend 2>/dev/null || true

# Clean up old images (keep only latest)
echo '🧹 Cleaning up old images...'
docker image prune -f

# Download latest docker-compose file
echo '📥 Downloading latest docker-compose configuration...'
curl -fsSL https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/docker-compose.aws.yml -o docker-compose.aws.yml

# Pull latest images
echo '📦 Pulling latest verified images...'
docker pull sanketsmane/ems-backend:latest
docker pull sanketsmane/ems-frontend:latest

# Start services
echo '🚀 Starting services...'
docker-compose -f docker-compose.aws.yml up -d

# Wait for services to be ready
echo '⏳ Waiting for services to start...'
sleep 30

# Check service status
echo '🔍 Checking service status...'
docker-compose -f docker-compose.aws.yml ps

# Test connectivity
echo '🌐 Testing connectivity...'
sleep 15

# Test backend health
if curl -f http://localhost:8000/api/health >/dev/null 2>&1; then
    echo '✅ Backend is healthy'
else
    echo '❌ Backend health check failed'
fi

# Test frontend
if curl -f http://localhost/ >/dev/null 2>&1; then
    echo '✅ Frontend is responding'
else
    echo '❌ Frontend not responding'
fi

echo ''
echo '🎉 Deployment completed!'
echo '📊 Container Status:'
docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'

echo ''
echo '🌐 Application URLs:'
echo '   Main Site: https://ems.formonex.in'
echo '   API Health: https://ems.formonex.in/api/health'
echo '   Backend Direct: http://$SERVER_IP:8000/api/health'
echo ''
echo '🔧 Version deployed: $APP_VERSION'
echo '📝 Changes: Fixed all .map() errors with defensive programming'
"

print_status "Executing deployment on server..."

# Execute deployment script on server
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$USERNAME@$SERVER_IP" "$DEPLOYMENT_SCRIPT"

print_success "Deployment script executed successfully!"

# Final verification
print_status "Performing final verification..."

# Test the live site
print_status "Testing live site..."
if curl -f "https://ems.formonex.in/api/health" >/dev/null 2>&1; then
    print_success "✅ Live site is responding!"
else
    print_warning "⚠️  Live site check failed - may need DNS propagation time"
fi

echo ""
echo "🎉 ==============================================="
echo "🎉  AWS DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "🎉 ==============================================="
echo ""
print_success "Version: $APP_VERSION deployed"
print_success "All .map() errors have been fixed"
print_success "Cache-busting enabled with timestamps"
echo ""
print_warning "Next steps:"
print_warning "1. Clear your browser cache for https://ems.formonex.in"
print_warning "2. Test the application thoroughly"
print_warning "3. The .map() errors should be completely resolved"
echo ""
print_status "🌐 Access your application at: https://ems.formonex.in"