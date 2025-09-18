# 🚀 **EMS Production Deployment Guide for AWS Ubuntu**

## 📦 **Production-Ready Docker Images**

### Available on Docker Hub:
- **Backend**: `sanketsmane/ems-backend:production` (95.9MB)
- **Frontend**: `sanketsmane/ems-frontend:production` (29.6MB)
- **AWS Tags**: `sanketsmane/ems-backend:aws` & `sanketsmane/ems-frontend:aws`

> ✅ **Optimized for Ubuntu AWS EC2 deployment with port 8000**

---

## 🖥️ **AWS EC2 Setup Requirements**

### **Recommended Instance:**
- **Type**: `t3.medium` or higher
- **OS**: Ubuntu 20.04 LTS or Ubuntu 22.04 LTS
- **Storage**: 20GB+ SSD
- **RAM**: 4GB+
- **vCPUs**: 2+

### **Security Group Configuration:**
```bash
# Required Inbound Rules:
Port 22   (SSH)    - Your IP only
Port 80   (HTTP)   - 0.0.0.0/0
Port 443  (HTTPS)  - 0.0.0.0/0
Port 8000 (API)    - 0.0.0.0/0 (or restrict to internal)
```

---

## 🐳 **Docker Installation on Ubuntu EC2**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update && sudo apt install -y docker-ce

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

---

## 🚀 **Quick Deployment Commands**

### **Method 1: Direct Docker Run**
```bash
# Create network
docker network create ems-network

# Run backend
docker run -d \
  --name ems-backend-prod \
  --network ems-network \
  -p 8000:8000 \
  -e NODE_ENV=production \
  -e PORT=8000 \
  -e MONGODB_URI="mongodb+srv://hackable3030:f9pZaA7rmlUkQ97N@cluster0.o6vez6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" \
  -e JWT_SECRET="FORMONEX07SANKET01NITIN07EMS" \
  -e FRONTEND_URL="https://ems.formonex.in" \
  --restart unless-stopped \
  sanketsmane/ems-backend:production

# Run frontend
docker run -d \
  --name ems-frontend-prod \
  --network ems-network \
  -p 80:80 \
  --restart unless-stopped \
  sanketsmane/ems-frontend:production
```

### **Method 2: Docker Compose (Recommended)**
```bash
# Download compose file
curl -O https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/docker-compose.aws.yml

# Start services
docker-compose -f docker-compose.aws.yml up -d

# Check status
docker-compose -f docker-compose.aws.yml ps

# View logs
docker-compose -f docker-compose.aws.yml logs -f
```

---

## 🌐 **Domain & SSL Setup**

### **1. Point Domain to EC2**
```bash
# Get your EC2 public IP
curl -s http://169.254.169.254/latest/meta-data/public-ipv4

# Configure DNS:
# A Record: ems.formonex.in → YOUR_EC2_PUBLIC_IP
```

### **2. Install Nginx Reverse Proxy**
```bash
sudo apt install -y nginx

# Create nginx config
sudo tee /etc/nginx/sites-available/ems.formonex.in << 'EOF'
server {
    listen 80;
    server_name ems.formonex.in;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/ems.formonex.in /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### **3. Setup SSL with Let's Encrypt**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d ems.formonex.in

# Auto-renewal (optional)
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 **Health Checks & Monitoring**

### **Application Health Endpoints:**
- **Backend**: `http://your-domain:8000/api/health`
- **Frontend**: `http://your-domain/health`
- **Full Stack**: `https://ems.formonex.in`

### **Docker Health Status:**
```bash
# Check container status
docker ps

# Check health
docker inspect ems-backend-prod | grep Health
docker inspect ems-frontend-prod | grep Health

# View logs
docker logs ems-backend-prod --tail 50
docker logs ems-frontend-prod --tail 50
```

### **System Monitoring:**
```bash
# Check system resources
htop
df -h
free -h

# Monitor Docker stats
docker stats
```

---

## 🔄 **Deployment & Updates**

### **Deploy New Version:**
```bash
# Pull latest images
docker pull sanketsmane/ems-backend:production
docker pull sanketsmane/ems-frontend:production

# Stop current containers
docker-compose -f docker-compose.aws.yml down

# Start with new images
docker-compose -f docker-compose.aws.yml up -d

# Clean old images
docker image prune -f
```

### **Rollback if Needed:**
```bash
# Use specific version tags
docker-compose -f docker-compose.aws.yml down
docker run -d --name ems-backend-prod -p 8000:8000 sanketsmane/ems-backend:5.0.0
docker run -d --name ems-frontend-prod -p 80:80 sanketsmane/ems-frontend:5.0.0
```

---

## 🛡️ **Security Best Practices**

### **Firewall Configuration:**
```bash
# Enable UFW
sudo ufw enable

# Configure ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8000/tcp # API (optional, can be internal only)

# Check status
sudo ufw status
```

### **Container Security:**
```bash
# Update base images regularly
docker pull sanketsmane/ems-backend:production
docker pull sanketsmane/ems-frontend:production

# Scan for vulnerabilities (optional)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $HOME/Library/Caches:/root/.cache/ aquasec/trivy:latest \
  image sanketsmane/ems-backend:production
```

---

## 📋 **Environment Variables Reference**

### **Required Variables:**
```bash
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-secret-key
FRONTEND_URL=https://ems.formonex.in
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 📞 **Support & Troubleshooting**

### **Common Issues:**

1. **Container won't start:**
   ```bash
   docker logs ems-backend-prod
   docker logs ems-frontend-prod
   ```

2. **Database connection issues:**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string
   - Test network connectivity

3. **SSL certificate issues:**
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

### **Performance Optimization:**
```bash
# Set up log rotation
sudo logrotate -d /etc/logrotate.d/docker-container

# Monitor and restart if needed
sudo systemctl enable docker-restart.timer
```

---

## ✅ **Deployment Checklist**

- [ ] AWS EC2 instance launched (Ubuntu 20.04+)
- [ ] Security groups configured (80, 443, 8000, 22)
- [ ] Docker & Docker Compose installed
- [ ] Images pulled from Docker Hub
- [ ] Environment variables configured
- [ ] Containers started and healthy
- [ ] Domain DNS pointed to EC2 IP
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Health checks passing
- [ ] Monitoring setup

---

**🎉 Your Formonex EMS is now production-ready on AWS!**

**Live URL**: https://ems.formonex.in  
**API Base**: https://ems.formonex.in/api  
**Version**: Production  
**Contact**: contactsanket1@gmail.com