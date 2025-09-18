#!/bin/bash

# SSL Error Fix - Deployment Script
# This script deploys the correct frontend version and provides nginx configuration

echo "🚀 EMS SSL Error Fix Deployment"
echo "================================"

# Step 1: Deploy Frontend v4.3
echo "📦 Step 1: Deploying Frontend v4.3..."

# Pull the latest frontend image
docker pull sanketsmane/ems-frontend:v4.3

# Check if frontend container is running
CONTAINER_ID=$(docker ps -q --filter "ancestor=sanketsmane/ems-frontend" 2>/dev/null)

if [ ! -z "$CONTAINER_ID" ]; then
    echo "🔄 Stopping existing frontend container: $CONTAINER_ID"
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
fi

# Start new frontend container
echo "🚀 Starting new frontend container..."
docker run -d \
  --name ems-frontend-v4.3 \
  --restart unless-stopped \
  -p 3000:80 \
  sanketsmane/ems-frontend:v4.3

echo "✅ Frontend v4.3 deployed successfully!"

# Step 2: Check nginx configuration
echo ""
echo "📋 Step 2: Nginx Configuration Check"
echo "===================================="

echo "Your nginx configuration for ems.formonex.in should include:"
echo ""
echo "1. API Proxy:"
echo "   location /api/ {"
echo "       proxy_pass http://65.0.94.0:8000/api/;"
echo "       # ... proxy headers ..."
echo "   }"
echo ""
echo "2. Health Check Proxy:"
echo "   location /health {"
echo "       proxy_pass http://65.0.94.0:8000/health;"
echo "       # ... proxy headers ..."
echo "   }"
echo ""
echo "3. WebSocket Proxy:"
echo "   location /socket.io/ {"
echo "       proxy_pass http://65.0.94.0:8000/socket.io/;"
echo "       # ... WebSocket headers ..."
echo "   }"

echo ""
echo "📝 Complete nginx config saved to: nginx-config-fix.conf"

# Step 3: Test endpoints
echo ""
echo "🧪 Step 3: Testing Endpoints"
echo "============================"

echo "Testing backend directly..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://65.0.94.0:8000/health)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend is accessible: http://65.0.94.0:8000/health"
else
    echo "❌ Backend not accessible: $BACKEND_STATUS"
fi

echo ""
echo "Testing proxy endpoints..."
PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ems.formonex.in/health)
if [ "$PROXY_STATUS" = "200" ]; then
    echo "✅ Proxy is working: https://ems.formonex.in/health"
else
    echo "❌ Proxy not configured: $PROXY_STATUS"
    echo "   You need to add the nginx configuration and reload nginx"
fi

# Step 4: Instructions
echo ""
echo "🔧 Next Steps"
echo "============="
echo ""
if [ "$PROXY_STATUS" != "200" ]; then
    echo "1. Add the nginx configuration from nginx-config-fix.conf to your server"
    echo "2. Test nginx config: sudo nginx -t"
    echo "3. Reload nginx: sudo systemctl reload nginx"
    echo "4. Test the fix: curl https://ems.formonex.in/health"
    echo ""
fi

echo "5. Open https://ems.formonex.in in your browser"
echo "6. Try logging in - SSL errors should be resolved!"
echo ""

echo "🎉 Deployment Complete!"
echo ""
echo "Frontend v4.3 Features:"
echo "✅ Same-domain API calls (https://ems.formonex.in/api)"
echo "✅ Same-domain WebSocket (wss://ems.formonex.in)"
echo "✅ No direct IP connections"
echo "✅ Local avatar images"
echo "✅ Clean console output"