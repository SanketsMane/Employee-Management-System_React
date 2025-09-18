# EMS v4.5 - Docker Hub Deployment Ready 🚀

## ✅ Images Successfully Pushed to Docker Hub

### Available Images:
- **Backend**: `sanketsmane/ems-backend:v4.5` (333MB)
- **Frontend**: `sanketsmane/ems-frontend:v4.5` (89.4MB)
- **Both also tagged as**: `latest`

### Docker Hub URLs:
- **Backend**: https://hub.docker.com/r/sanketsmane/ems-backend
- **Frontend**: https://hub.docker.com/r/sanketsmane/ems-frontend

## 🚀 Quick Deployment for DevOps Team

### Option 1: Using Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  backend:
    image: sanketsmane/ems-backend:v4.5
    container_name: ems-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - PORT=8000
      - MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/ems_production
      - JWT_SECRET=your-super-secret-jwt-key
      - JWT_EXPIRE=7d
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=your-email@company.com
      - SMTP_PASS=your-app-password
      - FROM_EMAIL=noreply@yourcompany.com
      - CLOUDINARY_CLOUD_NAME=your-cloudinary-name
      - CLOUDINARY_API_KEY=your-cloudinary-key
      - CLOUDINARY_API_SECRET=your-cloudinary-secret
    volumes:
      - backend_uploads:/app/uploads
      - backend_logs:/app/logs
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: sanketsmane/ems-frontend:v4.5
    container_name: ems-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      - REACT_APP_API_URL=http://your-server-ip:8000
      - REACT_APP_WEBSOCKET_URL=ws://your-server-ip:8000
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  backend_uploads:
  backend_logs:

networks:
  default:
    name: ems-network
```

### Deploy Command:
```bash
# Download and start the application
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 2: Individual Container Deployment

```bash
# Create network
docker network create ems-network

# Start backend
docker run -d \
  --name ems-backend \
  --network ems-network \
  -p 8000:8000 \
  -e NODE_ENV=production \
  -e MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/ems" \
  -e JWT_SECRET="your-secret-key" \
  --restart unless-stopped \
  sanketsmane/ems-backend:v4.5

# Start frontend
docker run -d \
  --name ems-frontend \
  --network ems-network \
  -p 80:80 \
  -e REACT_APP_API_URL="http://your-server-ip:8000" \
  --restart unless-stopped \
  sanketsmane/ems-frontend:v4.5
```

## 🔧 Production Environment Setup

### Required Environment Variables:

#### Backend (Essential):
```bash
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ems_production
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
```

#### Email Configuration:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourcompany.com
```

#### File Upload (Cloudinary):
```bash
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

#### Frontend:
```bash
REACT_APP_API_URL=https://api.yourcompany.com
REACT_APP_WEBSOCKET_URL=wss://api.yourcompany.com
```

## 📋 Pre-Deployment Checklist

### Infrastructure:
- [ ] Docker and Docker Compose installed
- [ ] Minimum 4GB RAM, 20GB storage
- [ ] Ports 80, 443, 8000 available
- [ ] Domain name configured (optional)

### Services:
- [ ] MongoDB database ready (Atlas or local)
- [ ] Email service configured (Gmail, SendGrid, etc.)
- [ ] Cloudinary account for file uploads
- [ ] SSL certificate (for HTTPS - optional)

### Security:
- [ ] Change all default passwords
- [ ] Generate strong JWT secret
- [ ] Configure firewall rules
- [ ] Set up HTTPS (recommended)

## 🔍 Health Checks & Monitoring

### Health Check Endpoints:
- **Backend**: `http://your-server:8000/health`
- **Frontend**: `http://your-server/`

### Monitor Containers:
```bash
# Check container status
docker ps

# View logs
docker logs ems-backend
docker logs ems-frontend

# Resource usage
docker stats
```

## 🚀 Quick Start Commands

```bash
# Pull images
docker pull sanketsmane/ems-backend:v4.5
docker pull sanketsmane/ems-frontend:v4.5

# Quick test run
docker run -d -p 8000:8000 -e NODE_ENV=production sanketsmane/ems-backend:v4.5
docker run -d -p 80:80 sanketsmane/ems-frontend:v4.5

# Access application
# Frontend: http://your-server-ip
# Backend API: http://your-server-ip:8000
```

## 🔧 Troubleshooting

### Common Issues:
1. **Backend won't start**: Check MongoDB connection string
2. **Frontend can't reach backend**: Verify REACT_APP_API_URL
3. **Email not working**: Check SMTP credentials
4. **File upload fails**: Verify Cloudinary configuration

### Debug Commands:
```bash
# Check container logs
docker logs -f ems-backend
docker logs -f ems-frontend

# Access container shell
docker exec -it ems-backend sh
docker exec -it ems-frontend sh

# Test database connection
docker exec ems-backend node -e "console.log(process.env.MONGODB_URI)"
```

## 📞 Support

- **GitHub Repository**: https://github.com/SanketsMane/Employee-Management-System_React
- **Docker Hub**: https://hub.docker.com/u/sanketsmane
- **Issues**: Create GitHub issues for bugs or feature requests

---

**✅ Deployment Ready!** 
Your EMS v4.5 is now available on Docker Hub and ready for production deployment by your DevOps team.