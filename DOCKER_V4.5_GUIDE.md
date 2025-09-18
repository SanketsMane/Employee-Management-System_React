# EMS Docker Images v4.5 - Complete Guide

## 🚨 Network Connectivity Issue Detected

During the build process, we encountered network connectivity issues with Docker Registry. This guide provides all the necessary steps to build and deploy v4.5 images once connectivity is restored.

## 📋 What Was Completed

✅ **Cleanup:**
- Deleted all existing local Docker images (freed 12.14GB)
- Removed all EMS-related containers
- Cleaned up Docker system and build cache

✅ **Version Updates:**
- Updated package.json versions to 4.5.0
- Created optimized Dockerfiles for v4.5
- Created comprehensive build and deployment scripts

✅ **Scripts Created:**
- `build-images-v4.5.sh` - Build local Docker images
- `test-images-v4.5.sh` - Test images locally
- `push-images-v4.5.sh` - Push to Docker Hub
- `deploy-v4.5.sh` - Deploy to production

## 🔧 What to Do Next

### Step 1: Fix Network Connectivity
```bash
# Check Docker connectivity
docker info

# Test Docker Hub access
ping registry-1.docker.io

# If behind corporate firewall/proxy, configure Docker proxy settings
```

### Step 2: Build v4.5 Images
```bash
# Make scripts executable (if not already done)
chmod +x *.sh

# Build both frontend and backend images
./build-images-v4.5.sh
```

### Step 3: Test Images Locally
```bash
# Test both images locally
./test-images-v4.5.sh

# Access test URLs:
# Backend: http://localhost:8001
# Frontend: http://localhost:8081

# Cleanup test containers when done
./cleanup-test-v4.5.sh
```

### Step 4: Push to Docker Hub
```bash
# Login to Docker Hub first
docker login

# Push images to Docker Hub
./push-images-v4.5.sh
```

### Step 5: Deploy to Production
```bash
# Deploy v4.5 to production
./deploy-v4.5.sh
```

## 📦 Expected Images

After successful build, you should have:

### Backend Image
- `sanketsmane/ems-backend:v4.5`
- `sanketsmane/ems-backend:latest`

### Frontend Image  
- `sanketsmane/ems-frontend:v4.5`
- `sanketsmane/ems-frontend:latest`

## 🆕 Version 4.5 Features

- **Optimized Dockerfiles**: Multi-stage builds for smaller images
- **Enhanced Security**: Non-root users, health checks
- **Production Ready**: Environment variable support
- **Better Logging**: Improved error handling and monitoring
- **Version Tracking**: Consistent v4.5 versioning across all components

## 🔍 Verification Commands

```bash
# List built images
docker images | grep sanketsmane/ems

# Check image sizes
docker images sanketsmane/ems-backend:v4.5 --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
docker images sanketsmane/ems-frontend:v4.5 --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Run quick tests
docker run --rm sanketsmane/ems-backend:v4.5 node --version
docker run --rm sanketsmane/ems-frontend:v4.5 nginx -v
```

## 📚 Docker Hub Management

### Delete Old Versions (Manual via Docker Hub Web Interface)
1. Go to https://hub.docker.com/r/sanketsmane/ems-backend
2. Go to https://hub.docker.com/r/sanketsmane/ems-frontend
3. Delete old tags (v4.0, v4.1, v4.2, v4.3, v4.4)
4. Keep only v4.5 and latest

### Alternative: Use Docker Hub API
```bash
# Get auth token (replace username/password)
curl -s -H "Content-Type: application/json" -X POST \
  -d '{"username": "sanketsmane", "password": "YOUR_PASSWORD"}' \
  https://hub.docker.com/v2/users/login/ | jq -r .token

# Delete specific tag (replace TOKEN and TAG)
curl -X DELETE \
  -H "Authorization: JWT TOKEN" \
  https://hub.docker.com/v2/repositories/sanketsmane/ems-backend/tags/TAG/
```

## 🚀 Production Deployment

The v4.5 deployment includes:
- Updated nginx configuration
- Enhanced security headers
- Better SSL/TLS handling
- Improved WebSocket support
- Production environment variables

## 🛠️ Troubleshooting

### Network Issues
```bash
# Configure Docker to use different registry mirror
cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": ["https://mirror.gcr.io"]
}
EOF

# Restart Docker
sudo systemctl restart docker
```

### Build Issues
```bash
# Clear Docker build cache
docker builder prune -a

# Build with no cache
docker build --no-cache -t sanketsmane/ems-backend:v4.5 ./backend
```

### Push Issues
```bash
# Re-login to Docker Hub
docker logout
docker login

# Push with retry
for i in {1..3}; do docker push sanketsmane/ems-backend:v4.5 && break || sleep 5; done
```

## ✅ Success Criteria

- [ ] Network connectivity restored
- [ ] Both images built successfully
- [ ] Local testing passes
- [ ] Images pushed to Docker Hub
- [ ] Production deployment successful
- [ ] Health checks passing
- [ ] Old versions cleaned up

## 📞 Support

If you encounter issues:
1. Check Docker daemon status
2. Verify network connectivity
3. Review build logs
4. Test with simple hello-world image first
5. Check Docker Hub authentication

---

**Note**: All scripts are ready and executable. Simply run them in order once Docker network connectivity is restored.