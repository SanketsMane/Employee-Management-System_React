# Docker Container & AWS Deployment Guide

## 🚀 Overview

This guide provides comprehensive instructions for deploying the Employee Management System using Docker containers on AWS. The project includes optimized Docker configurations for both development and production environments.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start for Team Members](#quick-start-for-team-members)
3. [AWS Deployment](#aws-deployment)
4. [Docker Images](#docker-images)
5. [Environment Configuration](#environment-configuration)
6. [Deployment Scripts](#deployment-scripts)
7. [Troubleshooting](#troubleshooting)

## 📦 Prerequisites

### For Team Members
- [Docker](https://docs.docker.com/get-docker/) (v20.0 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0 or higher)
- Git (for cloning the repository)

### For AWS Deployment
- AWS CLI configured with appropriate permissions
- Docker Hub account (for image sharing)
- AWS EC2 instance or ECS cluster

## 🏃‍♂️ Quick Start for Team Members

### Option 1: Using Team Deploy Script (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SanketsMane/Employee-Management-System_React.git
   cd Employee-Management-System_React
   ```

2. **Create environment file:**
   ```bash
   # For production deployment
   cp .env.aws.template .env.prod
   
   # Edit .env.prod with your actual values
   nano .env.prod
   ```

3. **Deploy using the team script:**
   ```bash
   # Start production environment
   ./team-deploy.sh --prod
   
   # Or start development environment
   ./team-deploy.sh --dev
   ```

4. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000/api

### Option 2: Using Docker Compose Directly

1. **Pull and start services:**
   ```bash
   # Using the shared configuration
   docker-compose -f docker-compose.share.yml up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose -f docker-compose.share.yml ps
   ```

## 🌩️ AWS Deployment

### Method 1: EC2 Deployment (Recommended for Teams)

1. **Launch EC2 Instance:**
   - Instance Type: t3.medium or higher
   - Security Groups: Allow ports 22, 80, 443, 8000
   - Storage: At least 20GB

2. **Install Docker on EC2:**
   ```bash
   # Connect to your EC2 instance
   ssh -i your-key.pem ec2-user@your-ec2-ip
   
   # Install Docker
   sudo yum update -y
   sudo yum install -y docker
   sudo service docker start
   sudo usermod -a -G docker ec2-user
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Deploy the application:**
   ```bash
   # Clone repository
   git clone https://github.com/SanketsMane/Employee-Management-System_React.git
   cd Employee-Management-System_React
   
   # Configure environment
   cp .env.aws.template .env.aws
   nano .env.aws  # Edit with your AWS-specific values
   
   # Deploy using the script
   ./deploy-aws.sh --ec2
   ```

### Method 2: ECS Deployment

1. **Configure AWS CLI:**
   ```bash
   aws configure
   ```

2. **Deploy to ECS:**
   ```bash
   ./deploy-aws.sh --ecs
   ```

## 🐳 Docker Images

### Available Images

| Image | Description | Size | Registry |
|-------|-------------|------|----------|
| `sanketsmane/ems-backend:latest` | Production backend | ~200MB | Docker Hub |
| `sanketsmane/ems-frontend:latest` | Production frontend | ~50MB | Docker Hub |
| `sanketsmane/ems-backend:v3.0` | Versioned backend | ~200MB | Docker Hub |
| `sanketsmane/ems-frontend:v3.0` | Versioned frontend | ~50MB | Docker Hub |

### Image Features

**Backend Image:**
- Multi-stage build for optimization
- Non-root user for security
- Health checks included
- Production-ready Node.js environment
- Automatic dependency installation

**Frontend Image:**
- Nginx-based serving
- Gzip compression enabled
- Static asset optimization
- Configurable environment variables
- Security headers included

### Pulling Images

```bash
# Pull latest images
docker pull sanketsmane/ems-backend:latest
docker pull sanketsmane/ems-frontend:latest

# Pull specific version
docker pull sanketsmane/ems-backend:v3.0
docker pull sanketsmane/ems-frontend:v3.0
```

## ⚙️ Environment Configuration

### Required Environment Variables

Create a `.env.prod` file with the following variables:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-at-least-64-characters-long
JWT_EXPIRE=7d

# Email Configuration
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Frontend URLs
FRONTEND_URL=http://your-domain-or-ip
VITE_API_BASE_URL=http://your-domain-or-ip:8000/api
VITE_WEBSOCKET_URL=ws://your-domain-or-ip:8000

# Cloudinary (File Upload)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### AWS-Specific Configuration

For AWS deployment, update the URLs to use your EC2 public IP:

```bash
FRONTEND_URL=http://3.15.123.456
VITE_API_BASE_URL=http://3.15.123.456:8000/api
VITE_WEBSOCKET_URL=ws://3.15.123.456:8000
```

## 🔧 Deployment Scripts

### 1. `deploy-aws.sh` - AWS Deployment Script

**Usage:**
```bash
# EC2 deployment (default)
./deploy-aws.sh --ec2

# ECS deployment
./deploy-aws.sh --ecs

# Build and push images only
./deploy-aws.sh --build

# Show help
./deploy-aws.sh --help
```

**Features:**
- Automated image building and pushing
- Health checks and monitoring
- Environment variable validation
- Multi-deployment method support

### 2. `team-deploy.sh` - Team Sharing Script

**Usage:**
```bash
# Start production environment
./team-deploy.sh --prod

# Start development environment
./team-deploy.sh --dev

# Stop all services
./team-deploy.sh --stop

# View logs
./team-deploy.sh --logs

# Update to latest images
./team-deploy.sh --update
```

**Features:**
- Easy team member deployment
- Environment management
- Automatic image pulling
- Health monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   # Check what's using the port
   sudo lsof -i :8000
   
   # Kill the process
   sudo kill -9 <PID>
   ```

2. **Docker Permission Denied:**
   ```bash
   # Add user to docker group
   sudo usermod -a -G docker $USER
   
   # Restart session or run
   newgrp docker
   ```

3. **Environment Variables Not Loading:**
   ```bash
   # Check file format (no spaces around =)
   cat .env.prod | grep -v '^#'
   
   # Validate environment loading
   docker-compose config
   ```

4. **Database Connection Issues:**
   ```bash
   # Test MongoDB connection
   docker run --rm mongo:latest mongo "your-mongodb-uri" --eval "db.runCommand('ping')"
   ```

5. **Image Pull Issues:**
   ```bash
   # Login to Docker Hub
   docker login
   
   # Force pull latest images
   docker pull --platform linux/amd64 sanketsmane/ems-backend:latest
   ```

### Health Check Commands

```bash
# Check container health
docker ps

# View container logs
docker logs ems-backend-prod
docker logs ems-frontend-prod

# Check service status
curl http://localhost:8000/api/health
curl http://localhost:80

# Monitor resource usage
docker stats
```

### Log Analysis

```bash
# View application logs
./team-deploy.sh --logs

# View specific service logs
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend

# Follow logs in real-time
docker-compose -f docker-compose.production.yml logs -f --tail=100
```

## 📈 Performance Optimization

### Resource Limits

The Docker Compose configuration includes resource limits:
- Backend: 1GB RAM, 0.5 CPU
- Frontend: 256MB RAM, 0.25 CPU

### Scaling

```bash
# Scale backend service
docker-compose -f docker-compose.production.yml up -d --scale backend=3

# Scale with load balancer (requires additional configuration)
```

## 🔒 Security Considerations

1. **Environment Variables:** Never commit `.env` files to version control
2. **JWT Secrets:** Use strong, unique secrets for production
3. **Database Security:** Use MongoDB Atlas with IP whitelisting
4. **Container Security:** Images run as non-root user
5. **Network Security:** Configure AWS Security Groups properly

## 📞 Support

### Team Support Contacts
- **Lead Developer:** Sanket Mane (contactsanket1@gmail.com)
- **Repository:** https://github.com/SanketsMane/Employee-Management-System_React

### Quick Support Commands

```bash
# Get container information
docker inspect ems-backend-prod

# Export container logs
docker logs ems-backend-prod > backend.log 2>&1

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend
```

---

**Last Updated:** September 2024  
**Version:** 3.0  
**Compatibility:** Docker 20.0+, Docker Compose 2.0+