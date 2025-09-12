# Docker Build & Deployment Guide

## Project Structure
```
Employee-Management-System_React/
├── frontend/
│   ├── Dockerfile          # Frontend production build
│   └── ...
├── backend/
│   ├── Dockerfile          # Backend production build
│   └── ...
├── docker-compose.yml      # Multi-service orchestration
├── Dockerfile.dev          # Development/testing (not recommended for production)
└── .env                    # Environment variables for docker-compose
```

## Building Options

### Option 1: Individual Service Builds (Manual)

**Build Frontend:**
```bash
cd frontend
docker build -t ems-frontend .
```

**Build Backend:**
```bash
cd backend
docker build -t ems-backend .
```

**Run Frontend:**
```bash
docker run -p 3000:80 ems-frontend
```

**Run Backend:**
```bash
docker run -p 5000:5000 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-jwt-secret" \
  ems-backend
```

### Option 2: Docker Compose (Recommended)

**Build all services:**
```bash
# From root directory
docker-compose build
```

**Run all services:**
```bash
# Start services in detached mode
docker-compose up -d

# Start services with logs
docker-compose up

# Stop services
docker-compose down
```

**Rebuild and run:**
```bash
docker-compose up --build
```

### Option 3: Development Build (Single Container)
```bash
# Build development container (not recommended for production)
docker build -f Dockerfile.dev -t ems-dev .
```

## Environment Configuration

### Required Environment Variables (.env file):
```env
MONGODB_URI=mongodb://localhost:27017/employee-management-system
JWT_SECRET=your-super-secret-jwt-key-here
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
NODE_ENV=production
```

## Docker Compose Services

### Frontend Service
- **Port:** 80 (HTTP)
- **Technology:** React + Vite + Nginx
- **Build Context:** ./frontend
- **Dependencies:** backend

### Backend Service
- **Port:** 5000
- **Technology:** Node.js + Express
- **Build Context:** ./backend
- **Volumes:** backend_uploads:/app/uploads

## Common Commands

```bash
# Build only
docker-compose build

# Run in background
docker-compose up -d

# View logs
docker-compose logs
docker-compose logs frontend
docker-compose logs backend

# Stop services
docker-compose down

# Remove everything (containers, networks, volumes)
docker-compose down -v

# Rebuild and restart
docker-compose up --build

# Scale services (if needed)
docker-compose up --scale backend=2

# Execute commands in running containers
docker-compose exec frontend sh
docker-compose exec backend sh
```

## Troubleshooting

### 1. Build Fails with "Dockerfile not found"
- **Problem:** Running `docker build` from wrong directory
- **Solution:** Use `docker-compose build` from root, or `cd` to specific service directory

### 2. Environment Variables Not Set
- **Problem:** Missing .env file or variables
- **Solution:** Create .env file in root directory with all required variables

### 3. Port Already in Use
- **Problem:** Ports 80 or 5000 already occupied
- **Solution:** 
  ```bash
  # Check what's using the port
  lsof -i :80
  lsof -i :5000
  
  # Kill the process or change docker-compose.yml ports
  ports:
    - "8080:80"  # Change external port
  ```

### 4. Database Connection Issues
- **Problem:** Cannot connect to MongoDB
- **Solution:** 
  - Use Docker MongoDB: `docker run -d -p 27017:27017 mongo`
  - Or update MONGODB_URI to point to external MongoDB Atlas

## Production Deployment

### AWS ECS (Recommended)
```bash
# Tag images for ECR
docker tag ems-frontend:latest your-account.dkr.ecr.region.amazonaws.com/ems-frontend:latest
docker tag ems-backend:latest your-account.dkr.ecr.region.amazonaws.com/ems-backend:latest

# Push to ECR
docker push your-account.dkr.ecr.region.amazonaws.com/ems-frontend:latest
docker push your-account.dkr.ecr.region.amazonaws.com/ems-backend:latest
```

### VPS/Server Deployment
```bash
# Copy docker-compose.yml and .env to server
scp docker-compose.yml user@server:/path/to/app/
scp .env user@server:/path/to/app/

# SSH to server and run
ssh user@server
cd /path/to/app
docker-compose up -d
```

## Health Checks

### Check if services are running:
```bash
docker-compose ps
```

### Check service health:
```bash
# Frontend
curl http://localhost
curl http://localhost/health

# Backend
curl http://localhost:5000/health
curl http://localhost:5000/api
```

## Docker Images Size Optimization

Current image sizes are optimized with:
- Multi-stage builds
- Alpine Linux base images  
- Production-only dependencies
- Cached layer optimization

## Security Best Practices

1. **Don't expose unnecessary ports**
2. **Use environment variables for secrets**
3. **Regular image updates**
4. **Non-root user in containers**
5. **Network isolation with docker-compose networks**