#!/bin/bash

# SSL Setup Script for EMS Backend
# This script sets up SSL certificates for the backend server

echo "🔒 Setting up SSL for EMS Backend Server"
echo "========================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script as root (use sudo)"
  exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt update -y
apt upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
apt install -y nginx certbot python3-certbot-nginx ufw

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt install -y nodejs
fi

# Create nginx configuration for backend
echo "⚙️ Setting up Nginx configuration..."
cat > /etc/nginx/sites-available/ems-backend << 'EOL'
server {
    listen 80;
    server_name api.formonex.in;  # Use a subdomain for API
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.formonex.in;
    
    # SSL configuration will be added by certbot
    
    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOL

# Enable the site
ln -sf /etc/nginx/sites-available/ems-backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    systemctl reload nginx
else
    echo "❌ Nginx configuration error"
    exit 1
fi

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

# Obtain SSL certificate
echo "🔒 Obtaining SSL certificate..."
certbot --nginx -d api.formonex.in --non-interactive --agree-tos --email admin@formonex.in --redirect

# Setup auto-renewal
echo "🔄 Setting up SSL auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Create systemd service for Node.js backend
echo "🚀 Creating systemd service for backend..."
cat > /etc/systemd/system/ems-backend.service << 'EOL'
[Unit]
Description=EMS Backend Node.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ems-backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=8000

[Install]
WantedBy=multi-user.target
EOL

echo "✅ SSL setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Copy your backend code to /opt/ems-backend/"
echo "2. Install dependencies: cd /opt/ems-backend && npm install --production"
echo "3. Update your .env file with production settings"
echo "4. Start the service: systemctl enable ems-backend && systemctl start ems-backend"
echo "5. Update DNS: Point api.formonex.in to this server's IP"
echo "6. Update frontend API URL to: https://api.formonex.in/api"
echo ""
echo "🌐 Your backend will be available at: https://api.formonex.in"