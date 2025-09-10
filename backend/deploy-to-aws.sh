#!/bin/bash

# FormoEMS Backend Deployment Script for AWS EC2
# Deploy to: AWS EC2 instance for https://ems.formonex.in/

echo "🚀 FormoEMS Backend Deployment to AWS EC2"
echo "=========================================="
echo ""

# Configuration - UPDATE THESE VALUES
EC2_HOST=""  # Your EC2 public IP or domain
EC2_USER="ubuntu"  # or ec2-user for Amazon Linux
KEY_PATH=""  # Path to your .pem key file
REMOTE_BACKEND_PATH="/home/ubuntu/formoems-backend"

# Check if configuration is set
if [ -z "$EC2_HOST" ] || [ -z "$KEY_PATH" ]; then
    echo "⚠️  Please configure the following variables in this script:"
    echo "   EC2_HOST=\"your-ec2-public-ip-or-domain\""
    echo "   KEY_PATH=\"path/to/your-key.pem\""
    echo ""
    echo "📝 Example:"
    echo "   EC2_HOST=\"ec2-xx-xxx-xxx-xx.compute-1.amazonaws.com\""
    echo "   KEY_PATH=\"~/Downloads/your-key.pem\""
    echo ""
    exit 1
fi

echo "📋 Deployment Configuration:"
echo "   EC2 Host: $EC2_HOST"
echo "   EC2 User: $EC2_USER"
echo "   Remote Path: $REMOTE_BACKEND_PATH"
echo "   SSH Key: $KEY_PATH"
echo "   Frontend Domain: https://ems.formonex.in"
echo ""

read -p "🤔 Do you want to proceed with the deployment? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

echo "📦 Starting FormoEMS backend deployment..."
echo ""

# Step 1: Setup remote directory
echo "1️⃣ Setting up remote directory..."
ssh -i "$KEY_PATH" $EC2_USER@$EC2_HOST "
    sudo mkdir -p $REMOTE_BACKEND_PATH
    sudo chown $EC2_USER:$EC2_USER $REMOTE_BACKEND_PATH
    echo '✅ Remote directory setup complete'
"

# Step 2: Upload entire backend
echo ""
echo "2️⃣ Uploading backend files..."
rsync -avz --progress --exclude node_modules --exclude .env -e "ssh -i $KEY_PATH" ./ $EC2_USER@$EC2_HOST:$REMOTE_BACKEND_PATH/
echo "✅ Backend files uploaded"

# Step 3: Setup environment and dependencies
echo ""
echo "3️⃣ Setting up environment..."
ssh -i "$KEY_PATH" $EC2_USER@$EC2_HOST "
    cd $REMOTE_BACKEND_PATH
    
    # Update system
    sudo apt update
    
    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install PM2 globally if not present
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    fi
    
    # Copy production environment
    cp .env.production .env
    
    # Install dependencies
    npm install --production
    
    echo '✅ Environment setup complete'
"

# Step 4: Configure PM2 ecosystem
echo ""
echo "4️⃣ Configuring PM2..."
ssh -i "$KEY_PATH" $EC2_USER@$EC2_HOST "
    cd $REMOTE_BACKEND_PATH
    
    # Start/restart with PM2
    pm2 stop formoems-backend 2>/dev/null || true
    pm2 delete formoems-backend 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    echo '✅ PM2 configuration complete'
"

# Step 5: Setup Nginx (optional)
echo ""
echo "5️⃣ Setting up Nginx reverse proxy..."
ssh -i "$KEY_PATH" $EC2_USER@$EC2_HOST "
    # Install Nginx if not present
    if ! command -v nginx &> /dev/null; then
        sudo apt install -y nginx
    fi
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/formoems-backend > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-ec2-domain.amazonaws.com;  # Replace with your EC2 domain

    location / {
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
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/formoems-backend /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl restart nginx
    
    echo '✅ Nginx setup complete'
"

# Step 6: Configure firewall
echo ""
echo "6️⃣ Configuring firewall..."
ssh -i "$KEY_PATH" $EC2_USER@$EC2_HOST "
    # Allow necessary ports
    sudo ufw allow 22
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw allow 8000
    sudo ufw --force enable
    
    echo '✅ Firewall configured'
"

# Step 7: Test deployment
echo ""
echo "7️⃣ Testing deployment..."
sleep 5  # Wait for service to start
curl -s http://$EC2_HOST/health | grep -q "OK" && echo "✅ Health check passed" || echo "❌ Health check failed - check logs"

echo ""
echo "🎉 FormoEMS Backend Deployment Complete!"
echo ""
echo "📋 Deployment Summary:"
echo "   ✅ Backend deployed to AWS EC2"
echo "   ✅ PM2 process manager configured"
echo "   ✅ Nginx reverse proxy setup"
echo "   ✅ Firewall configured"
echo "   ✅ Production environment active"
echo ""
echo "🔗 Your backend should be accessible at:"
echo "   http://$EC2_HOST"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend .env.production with the EC2 URL:"
echo "   VITE_API_BASE_URL=http://$EC2_HOST/api"
echo ""
echo "2. Rebuild and deploy your frontend to Hostinger"
echo ""
echo "🔍 Monitoring commands:"
echo "   SSH: ssh -i \"$KEY_PATH\" $EC2_USER@$EC2_HOST"
echo "   Logs: pm2 logs formoems-backend"
echo "   Status: pm2 status"
echo "   Restart: pm2 restart formoems-backend"
echo ""
