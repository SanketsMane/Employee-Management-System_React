#!/bin/bash

# AWS EC2 Backend Deployment Script
# Run this script on your AWS EC2 instance

echo "🚀 Starting AWS EC2 Backend Deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 18 (LTS)
echo "📦 Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 globally for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Git if not present
echo "📦 Installing Git..."
sudo yum install -y git

# Clone or update repository
if [ -d "Employee-Management-System_React" ]; then
    echo "📂 Updating existing repository..."
    cd Employee-Management-System_React
    git pull origin main
else
    echo "📂 Cloning repository..."
    git clone https://github.com/SanketsMane/Employee-Management-System_React.git
    cd Employee-Management-System_React
fi

# Navigate to backend directory
cd backend

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install --production

# Copy production environment file
echo "⚙️ Setting up production environment..."
cp .env.production .env

# Create logs directory
mkdir -p logs

# Stop existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 stop all
pm2 delete all

# Start backend with PM2
echo "🚀 Starting backend with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Install and configure Nginx (optional - for reverse proxy)
echo "🌐 Installing Nginx..."
sudo yum install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/conf.d/ems-backend.conf > /dev/null <<EOF
server {
    listen 80;
    server_name 43.205.116.48 ec2-43-205-116-48.ap-south-1.compute.amazonaws.com;

    # API routes
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

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Test Nginx configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo systemctl stop firewalld
sudo systemctl disable firewalld

# Or if you prefer to keep firewall enabled:
# sudo firewall-cmd --permanent --add-port=8000/tcp
# sudo firewall-cmd --permanent --add-port=80/tcp
# sudo firewall-cmd --permanent --add-port=443/tcp
# sudo firewall-cmd --reload

echo "✅ Backend deployment completed!"
echo "🌐 Your backend is now running on:"
echo "   - Direct: http://43.205.116.48:8000"
echo "   - Via Nginx: http://43.205.116.48/api"
echo ""
echo "📊 To check status:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "🔄 To restart:"
echo "   pm2 restart all"
