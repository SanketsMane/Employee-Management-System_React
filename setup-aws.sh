#!/bin/bash

# AWS EC2 Setup Script for Employee Management System Backend
# Run this script on a fresh Ubuntu 22.04 EC2 instance

echo "🚀 Setting up Employee Management System Backend on AWS EC2..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install PM2 globally
echo "📦 Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install nginx -y

# Install Git
echo "📦 Installing Git..."
sudo apt install git -y

# Install Certbot for SSL
echo "📦 Installing Certbot for SSL..."
sudo apt install certbot python3-certbot-nginx -y

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/ems-backend
sudo chown -R $USER:$USER /var/www/ems-backend

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p /var/www/ems-backend/logs

# Configure firewall
echo "🔥 Configuring UFW firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Start and enable services
echo "🔧 Starting services..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Create a basic Nginx configuration
echo "🔧 Creating basic Nginx configuration..."
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;

    server_name _;

    location / {
        try_files \$uri \$uri/ =404;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Display completion message
echo ""
echo "🎉 AWS EC2 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Clone your repository to /var/www/ems-backend"
echo "2. Install dependencies: npm install --production"
echo "3. Copy .env.production to .env and configure"
echo "4. Start application: pm2 start ecosystem.config.js"
echo "5. Setup SSL: sudo certbot --nginx -d your-domain.com"
echo ""
echo "📊 Service Status:"
echo "✅ Node.js: $(node --version)"
echo "✅ PM2: $(pm2 --version)"
echo "✅ Nginx: $(nginx -v 2>&1)"
echo "✅ Git: $(git --version)"
echo ""
echo "🔍 Useful Commands:"
echo "- Check PM2 processes: pm2 status"
echo "- View application logs: pm2 logs"
echo "- Check Nginx status: sudo systemctl status nginx"
echo "- View Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🌐 Your server is ready for deployment!"
echo "Public IP: $(curl -s http://checkip.amazonaws.com/)"
