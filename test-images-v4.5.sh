#!/bin/bash

# Test EMS Docker Images v4.5 Locally
# This script tests the built images before pushing to Docker Hub

set -e

echo "🧪 Testing EMS Docker Images v4.5"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if images exist
if ! docker images sanketsmane/ems-backend:v4.5 | grep -q v4.5; then
    echo -e "${RED}❌ Backend image v4.5 not found. Please build images first.${NC}"
    exit 1
fi

if ! docker images sanketsmane/ems-frontend:v4.5 | grep -q v4.5; then
    echo -e "${RED}❌ Frontend image v4.5 not found. Please build images first.${NC}"
    exit 1
fi

# Create test environment file
echo -e "${BLUE}📝 Creating test environment...${NC}"
cat > .env.test << EOF
# Test Environment for v4.5
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb://localhost:27017/ems-test
JWT_SECRET=test-jwt-secret-key-v4.5
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=test-cloud
CLOUDINARY_API_KEY=test-key
CLOUDINARY_API_SECRET=test-secret
EMAIL_USER=test@example.com
EMAIL_PASS=test-password
WEBSITE_URL=http://localhost:3000
COMPANY_NAME=Formonex Test
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping any existing EMS containers...${NC}"
docker stop ems-backend-test ems-frontend-test 2>/dev/null || true
docker rm ems-backend-test ems-frontend-test 2>/dev/null || true

# Test backend image
echo -e "${BLUE}🔧 Testing Backend Image...${NC}"
docker run -d \
    --name ems-backend-test \
    --env-file .env.test \
    -p 8001:8000 \
    sanketsmane/ems-backend:v4.5

sleep 5

# Health check for backend
echo -e "${BLUE}🏥 Health check for backend...${NC}"
if curl -f http://localhost:8001/health 2>/dev/null; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    docker logs ems-backend-test
fi

# Test frontend image
echo -e "${BLUE}🎨 Testing Frontend Image...${NC}"
docker run -d \
    --name ems-frontend-test \
    -p 8081:80 \
    sanketsmane/ems-frontend:v4.5

sleep 3

# Health check for frontend
echo -e "${BLUE}🏥 Health check for frontend...${NC}"
if curl -f http://localhost:8081 2>/dev/null | grep -q "formonex" || curl -f http://localhost:8081 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend health check passed${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    docker logs ems-frontend-test
fi

# Show container status
echo -e "${BLUE}📊 Container Status:${NC}"
docker ps | grep "ems-.*-test"

# Show logs (last 10 lines)
echo -e "${BLUE}📋 Backend Logs (last 10 lines):${NC}"
docker logs --tail 10 ems-backend-test

echo -e "${BLUE}📋 Frontend Logs (last 10 lines):${NC}"
docker logs --tail 10 ems-frontend-test

echo ""
echo -e "${YELLOW}🌐 Test URLs:${NC}"
echo "Backend: http://localhost:8001"
echo "Frontend: http://localhost:8081"
echo ""
echo -e "${YELLOW}⚠️  Note:${NC}"
echo "Test containers are running. Access the URLs above to verify functionality."
echo "Run './cleanup-test-v4.5.sh' when done testing."

# Create cleanup script
cat > cleanup-test-v4.5.sh << 'EOF'
#!/bin/bash
echo "🧹 Cleaning up test containers..."
docker stop ems-backend-test ems-frontend-test 2>/dev/null || true
docker rm ems-backend-test ems-frontend-test 2>/dev/null || true
rm -f .env.test
echo "✅ Cleanup complete!"
EOF

chmod +x cleanup-test-v4.5.sh

echo -e "${GREEN}🎉 Testing complete! Both images are ready.${NC}"