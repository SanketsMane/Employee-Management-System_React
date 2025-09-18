#!/bin/bash

# Production Nginx Deployment Script for EMS
# This script sets up nginx with production-ready configuration

echo "🚀 EMS Production Nginx Setup"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="ems.formonex.in"
BACKEND_IP="65.0.94.0:8000"
WEB_ROOT="/var/www/ems-frontend"
LOG_DIR="/var/log/nginx"

echo -e "${BLUE}Domain:${NC} $DOMAIN"
echo -e "${BLUE}Backend:${NC} $BACKEND_IP"
echo -e "${BLUE}Web Root:${NC} $WEB_ROOT"
echo ""

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}Error: This script must be run as root${NC}"
        echo "Please run: sudo $0"
        exit 1
    fi
}

# Function to backup existing configuration
backup_config() {
    echo -e "${YELLOW}Backing up existing configuration...${NC}"
    
    if [ -f "/etc/nginx/sites-available/$DOMAIN" ]; then
        cp "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-available/$DOMAIN.backup.$(date +%Y%m%d_%H%M%S)"
        echo "✅ Backed up existing site configuration"
    fi
    
    if [ -f "/etc/nginx/nginx.conf" ]; then
        cp "/etc/nginx/nginx.conf" "/etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)"
        echo "✅ Backed up nginx.conf"
    fi
}

# Function to install nginx if not present
install_nginx() {
    if ! command -v nginx &> /dev/null; then
        echo -e "${YELLOW}Installing nginx...${NC}"
        apt update
        apt install -y nginx
        
        # Enable nginx service
        systemctl enable nginx
        echo "✅ Nginx installed and enabled"
    else
        echo "✅ Nginx is already installed"
    fi
}

# Function to create directories
create_directories() {
    echo -e "${YELLOW}Creating required directories...${NC}"
    
    # Web root
    mkdir -p "$WEB_ROOT"
    chown -R www-data:www-data "$WEB_ROOT"
    chmod -R 755 "$WEB_ROOT"
    
    # Log directory
    mkdir -p "$LOG_DIR"
    chown -R www-data:adm "$LOG_DIR"
    
    # Cache directories
    mkdir -p /var/cache/nginx/proxy
    mkdir -p /var/cache/nginx/fastcgi
    chown -R www-data:www-data /var/cache/nginx
    
    echo "✅ Directories created"
}

# Function to setup SSL certificates
setup_ssl() {
    echo -e "${YELLOW}Checking SSL certificates...${NC}"
    
    if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo -e "${RED}Warning: SSL certificates not found for $DOMAIN${NC}"
        echo "Please run: certbot certonly --nginx -d $DOMAIN"
        echo "Or update the certificate paths in the configuration"
    else
        echo "✅ SSL certificates found"
    fi
}

# Function to deploy configurations
deploy_configs() {
    echo -e "${YELLOW}Deploying nginx configurations...${NC}"
    
    # Copy proxy parameters
    cp nginx-proxy-params.conf /etc/nginx/proxy_params
    echo "✅ Proxy parameters configured"
    
    # Copy main nginx configuration
    cp nginx-global-config.conf /etc/nginx/nginx.conf
    echo "✅ Global nginx configuration updated"
    
    # Copy site configuration
    cp nginx-production-config.conf "/etc/nginx/sites-available/$DOMAIN"
    echo "✅ Site configuration deployed"
    
    # Enable site
    ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/"
    echo "✅ Site enabled"
    
    # Remove default site
    if [ -L "/etc/nginx/sites-enabled/default" ]; then
        rm "/etc/nginx/sites-enabled/default"
        echo "✅ Default site disabled"
    fi
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${YELLOW}Deploying frontend...${NC}"
    
    # Check if Docker is available
    if command -v docker &> /dev/null; then
        echo "Pulling latest frontend image..."
        docker pull sanketsmane/ems-frontend:v4.3
        
        # Stop existing container
        docker stop ems-frontend 2>/dev/null || true
        docker rm ems-frontend 2>/dev/null || true
        
        # Extract files from container
        docker run --rm -v "$WEB_ROOT:/output" sanketsmane/ems-frontend:v4.3 \
            sh -c "cp -r /usr/share/nginx/html/* /output/"
        
        echo "✅ Frontend deployed via Docker"
    else
        echo -e "${YELLOW}Docker not found. Please manually deploy frontend files to $WEB_ROOT${NC}"
    fi
    
    # Set proper permissions
    chown -R www-data:www-data "$WEB_ROOT"
    chmod -R 755 "$WEB_ROOT"
}

# Function to test configuration
test_config() {
    echo -e "${YELLOW}Testing nginx configuration...${NC}"
    
    if nginx -t; then
        echo "✅ Nginx configuration is valid"
        return 0
    else
        echo -e "${RED}❌ Nginx configuration has errors${NC}"
        return 1
    fi
}

# Function to start services
start_services() {
    echo -e "${YELLOW}Starting services...${NC}"
    
    # Reload nginx
    systemctl reload nginx
    
    # Ensure nginx is running
    systemctl start nginx
    
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx is running"
    else
        echo -e "${RED}❌ Failed to start nginx${NC}"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}Running connectivity tests...${NC}"
    
    # Test backend connectivity
    echo "Testing backend connectivity..."
    if curl -s -o /dev/null -w "%{http_code}" "http://$BACKEND_IP/health" | grep -q "200"; then
        echo "✅ Backend is accessible"
    else
        echo -e "${RED}❌ Backend is not accessible at $BACKEND_IP${NC}"
    fi
    
    # Test frontend
    echo "Testing frontend..."
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
        echo "✅ Frontend is accessible"
    else
        echo -e "${YELLOW}⚠️  Frontend test failed (might be SSL or DNS issue)${NC}"
    fi
    
    # Test API proxy
    echo "Testing API proxy..."
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/health" | grep -q "200"; then
        echo "✅ API proxy is working"
    else
        echo -e "${YELLOW}⚠️  API proxy test failed${NC}"
    fi
}

# Function to show status
show_status() {
    echo ""
    echo -e "${GREEN}🎉 Deployment Summary${NC}"
    echo "===================="
    echo ""
    echo -e "Frontend URL: ${BLUE}https://$DOMAIN${NC}"
    echo -e "API Endpoint: ${BLUE}https://$DOMAIN/api${NC}"
    echo -e "Health Check: ${BLUE}https://$DOMAIN/health${NC}"
    echo -e "WebSocket: ${BLUE}wss://$DOMAIN/socket.io${NC}"
    echo ""
    echo -e "${GREEN}Configuration Files:${NC}"
    echo "• Main config: /etc/nginx/nginx.conf"
    echo "• Site config: /etc/nginx/sites-available/$DOMAIN"
    echo "• Proxy params: /etc/nginx/proxy_params"
    echo ""
    echo -e "${GREEN}Log Files:${NC}"
    echo "• Access log: /var/log/nginx/ems-access.log"
    echo "• Error log: /var/log/nginx/ems-error.log"
    echo "• Admin log: /var/log/nginx/ems-admin-access.log"
    echo ""
    echo -e "${GREEN}Useful Commands:${NC}"
    echo "• Test config: nginx -t"
    echo "• Reload nginx: systemctl reload nginx"
    echo "• View logs: tail -f /var/log/nginx/ems-error.log"
    echo "• Check status: systemctl status nginx"
    echo ""
}

# Main execution
main() {
    echo "Starting deployment process..."
    echo ""
    
    check_root
    backup_config
    install_nginx
    create_directories
    setup_ssl
    deploy_configs
    deploy_frontend
    
    if test_config; then
        start_services
        run_tests
        show_status
        
        echo -e "${GREEN}✅ Production deployment completed successfully!${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Verify SSL certificates are properly configured"
        echo "2. Test login functionality at https://$DOMAIN"
        echo "3. Monitor logs for any issues"
        echo "4. Set up monitoring and alerting"
        
    else
        echo -e "${RED}❌ Deployment failed due to configuration errors${NC}"
        echo "Please check the nginx configuration and try again"
        exit 1
    fi
}

# Run main function
main "$@"