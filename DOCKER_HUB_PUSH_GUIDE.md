# Docker Hub Push Guide - EMS v4.5

## Network Connectivity Issue Resolution

### Current Problem
Docker registry connectivity issues preventing image builds and pushes:
```
docker: Error response from daemon: Get "https://registry-1.docker.io/v2/": 
dial tcp: lookup docker-images-prod.6aa30f8b08e16409b46e0173d6de2f56.r2.cloudflarestorage.com: no such host
```

### Troubleshooting Steps

#### 1. Check Network Connectivity
```bash
# Test basic internet connectivity
ping -c 3 google.com

# Test Docker registry
ping -c 3 registry-1.docker.io

# Test DNS resolution
nslookup registry-1.docker.io
dig registry-1.docker.io
```

#### 2. Docker Daemon Configuration
```bash
# Check Docker status
docker --version
docker info

# Restart Docker daemon (macOS)
sudo killall Docker && open /Applications/Docker.app

# Or restart Docker Desktop from GUI
```

#### 3. DNS Configuration (macOS)
```bash
# Check current DNS
scutil --dns

# Flush DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Alternative DNS servers
# Add to /etc/resolv.conf or through System Preferences:
# nameserver 8.8.8.8
# nameserver 8.8.4.4
```

#### 4. Proxy/VPN Issues
```bash
# If using corporate VPN or proxy
unset HTTP_PROXY
unset HTTPS_PROXY
unset http_proxy
unset https_proxy

# Or configure Docker to use proxy
mkdir -p ~/.docker
cat > ~/.docker/config.json << EOF
{
  "proxies": {
    "default": {
      "httpProxy": "http://proxy.company.com:8080",
      "httpsProxy": "http://proxy.company.com:8080"
    }
  }
}
EOF
```

#### 5. Docker Registry Mirror
```bash
# Configure Docker daemon to use mirror
# Create/edit ~/.docker/daemon.json
cat > ~/.docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://mirror.gcr.io",
    "https://dockerhub.azk8s.cn"
  ]
}
EOF

# Restart Docker after config change
```

## Manual Push Process (When Network Restored)

### Step 1: Verify Environment
```bash
# Check Docker status
docker --version
docker info

# Check current images
docker images | grep ems

# Check connectivity
docker pull hello-world
```

### Step 2: Build Images (if needed)
```bash
# Run build script
./build-images-v4.5.sh

# Verify builds
docker images | grep v4.5
```

### Step 3: Docker Hub Login
```bash
# Login to Docker Hub
docker login

# Enter your Docker Hub credentials:
# Username: sanketsmane (or your username)
# Password: [your-token-or-password]
```

### Step 4: Push Images
```bash
# Run push script
chmod +x push-images-v4.5.sh
./push-images-v4.5.sh
```

### Step 5: Verify Push
```bash
# Check on Docker Hub
# Visit: https://hub.docker.com/u/sanketsmane

# Or verify via CLI
docker search sanketsmane/ems-backend
docker search sanketsmane/ems-frontend
```

## Alternative Solutions

### Option 1: Use Alternative Registry
```bash
# Tag for alternative registry (e.g., ghcr.io)
docker tag ems-backend:v4.5 ghcr.io/sanketsmane/ems-backend:v4.5
docker tag ems-frontend:v4.5 ghcr.io/sanketsmane/ems-frontend:v4.5

# Push to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u sanketsmane --password-stdin
docker push ghcr.io/sanketsmane/ems-backend:v4.5
docker push ghcr.io/sanketsmane/ems-frontend:v4.5
```

### Option 2: Export/Import Images
```bash
# Export images to tar files
docker save -o ems-backend-v4.5.tar ems-backend:v4.5
docker save -o ems-frontend-v4.5.tar ems-frontend:v4.5

# Transfer to another machine with connectivity
# Then import and push
docker load -i ems-backend-v4.5.tar
docker load -i ems-frontend-v4.5.tar
docker push sanketsmane/ems-backend:v4.5
docker push sanketsmane/ems-frontend:v4.5
```

### Option 3: Use Docker Desktop Proxy
```bash
# Configure in Docker Desktop Settings:
# Settings → Resources → Proxies
# Enable manual proxy configuration
# HTTP/HTTPS Proxy: your-proxy-server:port
```

## Quick Commands for When Network is Fixed

### Complete Build and Push Pipeline
```bash
# 1. Clean environment (optional)
docker system prune -a -f

# 2. Build new images
./build-images-v4.5.sh

# 3. Test images locally
./test-images-v4.5.sh

# 4. Login to Docker Hub
docker login

# 5. Push to Docker Hub
./push-images-v4.5.sh

# 6. Verify deployment
docker search sanketsmane/ems
```

### Single Commands
```bash
# Quick test connectivity
docker pull alpine:latest

# Quick build and push
docker build -t sanketsmane/ems-backend:v4.5 ./backend && \
docker build -t sanketsmane/ems-frontend:v4.5 ./frontend && \
docker push sanketsmane/ems-backend:v4.5 && \
docker push sanketsmane/ems-frontend:v4.5
```

## Expected Results

### After Successful Push
```
🎉 All images pushed successfully!

📋 Pushed images:
- sanketsmane/ems-backend:v4.5
- sanketsmane/ems-backend:latest
- sanketsmane/ems-frontend:v4.5
- sanketsmane/ems-frontend:latest

🌐 Docker Hub URLs:
Backend: https://hub.docker.com/r/sanketsmane/ems-backend
Frontend: https://hub.docker.com/r/sanketsmane/ems-frontend
```

### Docker Hub Verification
- Visit your Docker Hub repositories
- Verify tags are present (v4.5, latest)
- Check image size and creation dates
- Verify pull commands work

## Next Steps After Push

1. **Deploy to Production**: Run `./deploy-v4.5.sh`
2. **Update Docker Compose**: Use pushed images in production
3. **Monitor Deployment**: Check logs and health endpoints
4. **Documentation**: Update deployment guides with new image tags

## Common Issues and Solutions

### "repository does not exist" Error
```bash
# Create repositories on Docker Hub first
# Visit: https://hub.docker.com/repositories
# Click "Create Repository" for each image
```

### Authentication Failed
```bash
# Generate access token on Docker Hub
# Use token instead of password
docker login -u sanketsmane
```

### Image Not Found
```bash
# Rebuild images with correct tags
docker build -t sanketsmane/ems-backend:v4.5 ./backend
docker build -t sanketsmane/ems-frontend:v4.5 ./frontend
```

### Rate Limiting
```bash
# Docker Hub has pull/push rate limits
# Wait or upgrade to Pro account
# Use docker login to increase limits
```

## Support Commands

```bash
# Check Docker Hub login status
docker info | grep Username

# List all local images
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# Clean up failed builds
docker system prune -f

# Check image history
docker history sanketsmane/ems-backend:v4.5

# Inspect image
docker inspect sanketsmane/ems-backend:v4.5
```

---

**Note**: This guide provides comprehensive solutions for the current network connectivity issues. Once the network issue is resolved, the push process should be straightforward using the provided scripts.