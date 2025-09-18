# 🚀 Successful Deployment Guide - FormoEMS

## ✅ **WORKING DEPLOYMENT CONFIGURATION**

This document contains the **PROVEN WORKING** deployment setup that successfully deployed FormoEMS at https://ems.formonex.in

---

## 🏗️ **Architecture Overview**

```
Internet → nginx (Port 80) → Frontend Container (Port 8080) → Backend Container (Port 8000) → MongoDB Atlas
```

---

## 📋 **Prerequisites**

1. **AWS EC2 Ubuntu Server**
2. **Docker & Docker Compose installed**
3. **Domain pointing to server IP**
4. **SSL/TLS certificates (optional but recommended)**

---

## 🐳 **Docker Configuration**

### **docker-compose.aws.yml** (Updated Working Version)
```yaml
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
      - MONGODB_URI=mongodb+srv://hackable3030:f9pZaA7rmlUkQ97N@cluster0.o6vez6l.mongodb.net/formonex-production?retryWrites=true&w=majority
      - JWT_SECRET=your-super-secure-jwt-secret-key-for-production
      - CLOUDINARY_CLOUD_NAME=dxgbxejh8
      - CLOUDINARY_API_KEY=946469276658182
      - CLOUDINARY_API_SECRET=T2_WjRXTGrBdSlPfj71C3VPzWgI
      - EMAIL_SERVICE=gmail
      - EMAIL_USER=hackable3030@gmail.com
      - EMAIL_PASSWORD=rlir jvki vpig ymbw
      - COMPANY_NAME=FormoEMS
      - COMPANY_EMAIL=admin@formonex.in
      - COMPANY_DOMAIN=formonex.in
    networks:
      - ems-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: sanketsmane/ems-frontend:verified
    container_name: ems-frontend-prod
    restart: unless-stopped
    ports:
      - "8080:80"  # IMPORTANT: Changed to 8080 to avoid conflicts
    depends_on:
      - backend
    networks:
      - ems-network

networks:
  ems-network:
    driver: bridge
```

---

## 🌐 **Nginx Proxy Configuration**

### **Step 1: Install and Configure Nginx**

```bash
# Install nginx
sudo apt update
sudo apt install nginx -y

# Stop default nginx
sudo systemctl stop nginx
```

### **Step 2: Create Site Configuration**

Create `/etc/nginx/sites-available/ems`:

```nginx
server {
    listen 80;
    server_name ems.formonex.in;

    # Proxy to frontend container
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    # Proxy API calls to backend
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://localhost:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Step 3: Enable Site**

```bash
# Enable the site
sudo ln -sf /etc/nginx/sites-available/ems /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🚀 **Deployment Steps**

### **Step 1: Prepare Server**

```bash
# SSH to server
ssh -i your-key.pem ubuntu@your-server-ip

# Create project directory
mkdir -p ~/ems && cd ~/ems
```

### **Step 2: Deploy Containers**

```bash
# IMPORTANT: Clean up any existing containers first
docker-compose down --remove-orphans
docker container prune -f

# Create docker-compose.yml with the working configuration above
# Then run:
docker-compose pull
docker-compose up -d
```

### **Step 3: Verify Deployment**

```bash
# Check containers
docker ps

# Check frontend
curl -I http://localhost:8080

# Check backend
curl -s http://localhost:8000/

# Check live site
curl -I http://your-domain.com
```

---

## 🔧 **Troubleshooting**

### **Container Name Conflicts**
```bash
# If you get "container name already in use" error:
# First, check what containers are running:
docker ps -a

# Remove ALL containers (including stopped ones):
docker container rm -f $(docker container ls -aq) 2>/dev/null || true

# Remove networks:
docker network rm $(docker network ls -q) 2>/dev/null || true

# Clean up everything:
docker system prune -af

# Then deploy:
docker-compose up -d
```

### **Port 80 Already in Use**
```bash
# Stop conflicting services
sudo systemctl stop nginx
sudo systemctl stop apache2

# Check what's using port 80
sudo lsof -i :80
```

### **Frontend Container Restarting**
```bash
# Check logs
docker logs ems-frontend-prod

# Common fix: Use simple nginx container
docker run -d --name ems-frontend-simple --network ems_ems-network -p 8080:80 nginx:alpine
```

### **Backend API Not Responding**
```bash
# Check backend logs
docker logs ems-backend-prod

# Verify MongoDB connection
# Check environment variables
```

---

## 📊 **Health Checks**

### **Frontend Health**
```bash
curl -I http://localhost:8080
# Should return: HTTP/1.1 200 OK
```

### **Backend Health**
```bash
curl -s http://localhost:8000/
# Should return: {"message":"Employee Management System API","version":"1.0.0","status":"running"}
```

### **Live Site**
```bash
# Test with cache-busting parameter
curl -I "http://ems.formonex.in?t=$(date +%s)"
# Should return: HTTP/1.1 200 OK with modern HTML content

# If browser shows old content, use hard refresh:
# Chrome/Firefox: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
# Or open in incognito/private window
```

---

## ✅ **Success Indicators**

- ✅ Backend container status: `healthy`
- ✅ Frontend container status: `Up`
- ✅ Nginx proxy working on port 80
- ✅ Site shows modern FormoEMS interface
- ✅ No "Loading..." screen
- ✅ API endpoints responding
- ✅ Database connectivity confirmed

### 🌐 **Browser Cache Issues**
If the site still shows "Loading..." or old content:
- **Hard Refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Incognito Mode**: Open in private/incognito window
- **Clear Cache**: Clear browser cache and cookies for the domain
- **Test URL**: Use `https://ems.formonex.in?t=123456` with random number

---

## 🆘 **Emergency Recovery**

If deployment fails, use this minimal working setup:

```bash
# Stop all containers
docker-compose down

# Use simple nginx for frontend
docker run -d --name ems-frontend-emergency -p 8080:80 nginx:alpine

# Copy frontend files
docker cp ems-frontend-prod:/usr/share/nginx/html/. /tmp/frontend/
docker cp /tmp/frontend/. ems-frontend-emergency:/usr/share/nginx/html/

# Test
curl -I http://localhost:8080
```

---

## 📝 **Notes**

- **Port Configuration**: Frontend runs on 8080, proxied to 80 via nginx
- **Image Tags**: Use `:verified` tags for stable deployment
- **Network**: All containers use `ems-network` bridge
- **Persistence**: Backend volumes for uploads and logs
- **Monitoring**: Health checks configured for both services

---

**Last Updated**: September 18, 2025  
**Status**: ✅ SUCCESSFULLY DEPLOYED  
**Live URL**: https://ems.formonex.in