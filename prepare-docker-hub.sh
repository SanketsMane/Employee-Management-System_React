#!/bin/bash

# EMS Docker Hub - Offline Build and Push Preparation
# This script prepares everything for Docker Hub push when network is restored

set -e

echo "🔧 EMS Docker Hub - Offline Preparation v4.5"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create directory for offline assets
mkdir -p docker-hub-assets
cd docker-hub-assets

echo -e "${BLUE}📝 Creating Docker Hub preparation assets...${NC}"

# Create Docker Hub repository creation script
cat > create-repositories.sh << 'EOF'
#!/bin/bash

echo "🏗️  Docker Hub Repository Creation Guide"
echo "========================================"
echo ""
echo "1. Visit: https://hub.docker.com/repositories"
echo "2. Click 'Create Repository'"
echo "3. Create these repositories:"
echo ""
echo "   Repository: sanketsmane/ems-backend"
echo "   Description: Employee Management System - Backend API"
echo "   Visibility: Public (or Private)"
echo ""
echo "   Repository: sanketsmane/ems-frontend" 
echo "   Description: Employee Management System - Frontend React App"
echo "   Visibility: Public (or Private)"
echo ""
echo "4. Once created, return here and run the push script"
EOF

chmod +x create-repositories.sh

# Create network test script
cat > test-connectivity.sh << 'EOF'
#!/bin/bash

echo "🌐 Testing Docker Hub Connectivity"
echo "================================="

# Test basic connectivity
echo "Testing internet connectivity..."
if ping -c 3 google.com > /dev/null 2>&1; then
    echo "✅ Internet connectivity: OK"
else
    echo "❌ Internet connectivity: FAILED"
    exit 1
fi

# Test Docker registry
echo "Testing Docker registry..."
if ping -c 3 registry-1.docker.io > /dev/null 2>&1; then
    echo "✅ Docker registry connectivity: OK"
else
    echo "❌ Docker registry connectivity: FAILED"
    echo "💡 Try:"
    echo "   - Restart Docker Desktop"
    echo "   - Check VPN/Proxy settings"
    echo "   - Flush DNS cache: sudo dscacheutil -flushcache"
    exit 1
fi

# Test Docker daemon
echo "Testing Docker daemon..."
if docker info > /dev/null 2>&1; then
    echo "✅ Docker daemon: OK"
else
    echo "❌ Docker daemon: FAILED"
    echo "💡 Start Docker Desktop and try again"
    exit 1
fi

# Test Docker pull
echo "Testing Docker Hub access..."
if docker pull alpine:latest > /dev/null 2>&1; then
    echo "✅ Docker Hub access: OK"
    docker rmi alpine:latest > /dev/null 2>&1
else
    echo "❌ Docker Hub access: FAILED"
    echo "💡 Check Docker Hub status or network settings"
    exit 1
fi

echo ""
echo "🎉 All connectivity tests passed!"
echo "You can now proceed with building and pushing images."
EOF

chmod +x test-connectivity.sh

# Create complete push workflow
cat > complete-push-workflow.sh << 'EOF'
#!/bin/bash

echo "🚀 Complete Docker Hub Push Workflow"
echo "===================================="

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd ..

# Step 1: Test connectivity
echo -e "${BLUE}Step 1: Testing connectivity...${NC}"
./docker-hub-assets/test-connectivity.sh

# Step 2: Build images
echo -e "${BLUE}Step 2: Building images...${NC}"
if [ ! -f "build-images-v4.5.sh" ]; then
    echo -e "${RED}❌ build-images-v4.5.sh not found${NC}"
    exit 1
fi
./build-images-v4.5.sh

# Step 3: Test images locally
echo -e "${BLUE}Step 3: Testing images locally...${NC}"
if [ -f "test-images-v4.5.sh" ]; then
    ./test-images-v4.5.sh
fi

# Step 4: Login to Docker Hub
echo -e "${BLUE}Step 4: Docker Hub login...${NC}"
echo -e "${YELLOW}Please login to Docker Hub:${NC}"
docker login

# Step 5: Push images
echo -e "${BLUE}Step 5: Pushing images...${NC}"
./push-images-v4.5.sh

# Step 6: Verify
echo -e "${BLUE}Step 6: Verification...${NC}"
echo -e "${GREEN}✅ Images pushed successfully!${NC}"
echo ""
echo -e "${YELLOW}Verify on Docker Hub:${NC}"
echo "Backend: https://hub.docker.com/r/sanketsmane/ems-backend"
echo "Frontend: https://hub.docker.com/r/sanketsmane/ems-frontend"

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy to production: ./deploy-v4.5.sh"
echo "2. Update production docker-compose files"
echo "3. Monitor deployment logs"
EOF

chmod +x complete-push-workflow.sh

# Create alternative registry options
cat > alternative-registries.md << 'EOF'
# Alternative Docker Registries

If Docker Hub connectivity issues persist, consider these alternatives:

## 1. GitHub Container Registry (ghcr.io)
```bash
# Tag images for GitHub Registry
docker tag ems-backend:v4.5 ghcr.io/sanketsmane/ems-backend:v4.5
docker tag ems-frontend:v4.5 ghcr.io/sanketsmane/ems-frontend:v4.5

# Login (requires GitHub token)
echo $GITHUB_TOKEN | docker login ghcr.io -u sanketsmane --password-stdin

# Push
docker push ghcr.io/sanketsmane/ems-backend:v4.5
docker push ghcr.io/sanketsmane/ems-frontend:v4.5
```

## 2. Amazon ECR
```bash
# Get login token (requires AWS CLI)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag ems-backend:v4.5 123456789012.dkr.ecr.us-east-1.amazonaws.com/ems-backend:v4.5
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ems-backend:v4.5
```

## 3. Google Container Registry (gcr.io)
```bash
# Configure gcloud
gcloud auth configure-docker

# Tag and push
docker tag ems-backend:v4.5 gcr.io/your-project-id/ems-backend:v4.5
docker push gcr.io/your-project-id/ems-backend:v4.5
```

## 4. Private Registry
```bash
# Set up local registry
docker run -d -p 5000:5000 --name registry registry:2

# Tag and push
docker tag ems-backend:v4.5 localhost:5000/ems-backend:v4.5
docker push localhost:5000/ems-backend:v4.5
```
EOF

# Create troubleshooting script
cat > troubleshoot-docker.sh << 'EOF'
#!/bin/bash

echo "🔍 Docker Troubleshooting Diagnostics"
echo "===================================="

echo "Docker Version:"
docker --version
echo ""

echo "Docker Info:"
docker info
echo ""

echo "Docker Images:"
docker images
echo ""

echo "Network Connectivity:"
echo "Google: $(curl -s -o /dev/null -w "%{http_code}" https://google.com)"
echo "Docker Hub: $(curl -s -o /dev/null -w "%{http_code}" https://hub.docker.com)"
echo ""

echo "DNS Resolution:"
nslookup registry-1.docker.io
echo ""

echo "Docker Daemon Logs:"
echo "Check: ~/Library/Containers/com.docker.docker/Data/log/"
echo ""

echo "Potential Solutions:"
echo "1. Restart Docker Desktop"
echo "2. Clear DNS cache: sudo dscacheutil -flushcache"
echo "3. Check VPN/Proxy settings"
echo "4. Try different DNS servers (8.8.8.8, 1.1.1.1)"
echo "5. Check Docker Desktop preferences → Proxies"
EOF

chmod +x troubleshoot-docker.sh

cd ..

echo -e "${GREEN}✅ Docker Hub preparation assets created!${NC}"
echo ""
echo -e "${YELLOW}📁 Available in ./docker-hub-assets/:${NC}"
echo "- create-repositories.sh     → Guide for creating Docker Hub repos"
echo "- test-connectivity.sh       → Test network connectivity"
echo "- complete-push-workflow.sh  → Full automated workflow"
echo "- alternative-registries.md  → Alternative registry options"
echo "- troubleshoot-docker.sh     → Diagnostic tools"
echo ""
echo -e "${BLUE}🚀 When network is restored, run:${NC}"
echo "./docker-hub-assets/complete-push-workflow.sh"
echo ""
echo -e "${YELLOW}💡 Or troubleshoot current issues:${NC}"
echo "./docker-hub-assets/troubleshoot-docker.sh"