#!/bin/bash

# 🚀 DIRECT DEPLOYMENT - NO EXTERNAL DEPENDENCIES
# Create docker-compose file directly and deploy

echo "🚀 CREATING FRESH EMS DEPLOYMENT"
echo "================================"

echo "📄 STEP 1: CREATE DOCKER-COMPOSE FILE"
cat > docker-compose.aws.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: sanketsmane/ems-backend:verified
    container_name: ems-backend-prod
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - PORT=8000
      - MONGODB_URI=mongodb+srv://hackable3030:f9pZaA7rmlUkQ97N@cluster0.o6vez6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
      - JWT_SECRET=FORMONEX07SANKET01NITIN07EMS
      - JWT_EXPIRE=7d
      - EMAIL_ENABLED=true
      - EMAIL_HOST=smtp.gmail.com
      - EMAIL_PORT=587
      - EMAIL_USER=formonexsolutions@gmail.com
      - EMAIL_PASS=hnkn kucq biqt fovt
      - EMAIL_FROM=formonexsolutions@gmail.com
      - FRONTEND_URL=https://ems.formonex.in
      - CLOUDINARY_URL=cloudinary://564439426461569:yH7p_TOyWeEQjCfRaxwxxLc0FG0@dr7mlwdso
      - CLOUDINARY_CLOUD_NAME=dr7mlwdso
      - CLOUDINARY_API_KEY=564439426461569
      - CLOUDINARY_API_SECRET=yH7p_TOyWeEQjCfRaxwxxLc0FG0
      - ADMIN_EMAIL=contactsanket1@gmail.com
      - ADMIN_PASSWORD=Sanket@3030
      - RATE_LIMIT_WINDOW=150
      - RATE_LIMIT_MAX=100
      - COMPANY_NAME=Formonex
      - COMPANY_EMAIL=info@formonex.com
      - COMPANY_WEBSITE=https://formonex.com
      - COMPANY_ADDRESS=India
      - COMPANY_PHONE=+91-XXX-XXX-XXXX
      - ALLOWED_ORIGINS=https://ems.formonex.in,https://formonex.in
      - AWS_REGION=ap-south-1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    volumes:
      - backend_uploads:/app/uploads
      - backend_logs:/app/logs
    networks:
      - ems-network

  frontend:
    image: sanketsmane/ems-frontend:verified
    container_name: ems-frontend-prod
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 30s
    networks:
      - ems-network

volumes:
  backend_uploads:
    driver: local
  backend_logs:
    driver: local

networks:
  ems-network:
    driver: bridge
EOF

echo "✅ Docker-compose file created"

echo ""
echo "📦 STEP 2: PULL LATEST IMAGES"
docker pull sanketsmane/ems-backend:verified
docker pull sanketsmane/ems-frontend:verified

echo ""
echo "🚀 STEP 3: START SERVICES"
docker-compose -f docker-compose.aws.yml up -d

echo ""
echo "⏳ STEP 4: WAIT FOR STARTUP"
sleep 45

echo ""
echo "📋 STEP 5: CHECK STATUS"
docker-compose -f docker-compose.aws.yml ps

echo ""
echo "🌐 STEP 6: TEST SERVICES"
echo "Testing backend..."
curl -f http://localhost:8000/api/health && echo " ✅ Backend OK" || echo " ❌ Backend Failed"

echo "Testing frontend..."
curl -f http://localhost/ | head -1 && echo " ✅ Frontend OK" || echo " ❌ Frontend Failed"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Visit: https://ems.formonex.in/"
echo "================================"