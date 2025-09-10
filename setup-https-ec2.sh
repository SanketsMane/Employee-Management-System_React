#!/bin/bash

# AWS EC2 HTTPS Setup Script
# Run this on your EC2 instance to enable HTTPS

echo "🔒 Setting up HTTPS on AWS EC2..."

# Update system
sudo yum update -y

# Install SSL/TLS tools
sudo yum install -y openssl

# Create SSL directory
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /etc/ssl/certs

# Generate self-signed certificate (for immediate testing)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/server.key \
  -out /etc/ssl/certs/server.crt \
  -subj "/C=IN/ST=India/L=Mumbai/O=Formonex/OU=IT/CN=43.205.116.48"

# Set proper permissions
sudo chmod 600 /etc/ssl/private/server.key
sudo chmod 644 /etc/ssl/certs/server.crt

echo "✅ SSL Certificate generated!"

# Update your Node.js server.js to use HTTPS
echo "📝 Next steps:"
echo "1. Update your server.js to use HTTPS (port 8443)"
echo "2. Update security group to allow port 8443"
echo "3. Restart your application"

echo ""
echo "🔧 Add this to your server.js:"
echo "const https = require('https');"
echo "const fs = require('fs');"
echo ""
echo "const options = {"
echo "  key: fs.readFileSync('/etc/ssl/private/server.key'),"
echo "  cert: fs.readFileSync('/etc/ssl/certs/server.crt')"
echo "};"
echo ""
echo "https.createServer(options, app).listen(8443, () => {"
echo "  console.log('HTTPS Server running on port 8443');"
echo "});"
