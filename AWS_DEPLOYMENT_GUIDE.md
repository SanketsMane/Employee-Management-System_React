# 🚀 AWS EC2 Deployment Guide

## 📋 Prerequisites

1. **AWS EC2 Instance**:
   - Ubuntu 20.04 LTS or later
   - t3.medium or larger (recommended)
   - Security Group allowing ports: 22, 80, 443, 8000
   - Public IP address

2. **Domain (Optional)**:
   - Point your domain to EC2 public IP
   - SSL certificate for HTTPS

## 🔧 Server Setup

### 1. Connect to EC2 Instance
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 2. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 4. Setup Application Directory
```bash
mkdir -p ~/ems-app
cd ~/ems-app
```

## 🐳 Deploy Application

### 1. Download Production Files
```bash
# Download docker-compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/docker-compose.production.yml

# Download environment template
curl -o .env https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/.env.production.template
```

### 2. Configure Environment Variables
```bash
nano .env
```

**Update these values**:
```bash
# Replace YOUR_EC2_PUBLIC_IP with actual IP
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP

# Generate strong JWT secret
JWT_SECRET=your_very_long_secure_jwt_secret_for_production_aws_deployment_$(date +%s)

# Update other credentials as needed
```

### 3. Start Application
```bash
# Pull latest images
docker-compose pull

# Start in detached mode
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

## 🔍 Verify Deployment

### 1. Check Application Health
```bash
# Backend health check
curl http://localhost:8000/api/health

# Frontend check
curl http://localhost:80
```

### 2. Access Application
- **Frontend**: `http://YOUR_EC2_PUBLIC_IP`
- **Backend API**: `http://YOUR_EC2_PUBLIC_IP:8000/api`

### 3. Login Credentials
- **Admin**: admin@company.com / admin123
- **HR**: hr@company.com / hr123456

## 🔒 Security Configurations

### 1. Firewall Setup
```bash
sudo ufw enable
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 8000/tcp    # Backend API
```

### 2. SSL Setup (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring & Maintenance

### 1. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 2. Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### 3. Update Application
```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

### 4. Backup Data
```bash
# Backup uploads volume
docker run --rm -v ems-app_backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /data

# Backup logs
docker run --rm -v ems-app_backend_logs:/data -v $(pwd):/backup alpine tar czf /backup/logs-backup.tar.gz /data
```

## 🚨 Troubleshooting

### 1. Application Not Starting
```bash
# Check container status
docker-compose ps

# Check logs for errors
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose down && docker-compose up -d
```

### 2. CORS Errors
- Verify `FRONTEND_URL` in `.env` matches your EC2 public IP
- Check Security Group allows port 8000
- Ensure frontend can reach backend

### 3. Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes EC2 IP
- Check `MONGODB_URI` in `.env`
- Test connection: `docker-compose exec backend node -e "require('./config/db')()"`

### 4. Port Issues
```bash
# Check what's using ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :8000

# Kill conflicting processes
sudo systemctl stop apache2  # if Apache is running
sudo systemctl stop nginx    # if Nginx is running
```

## 📞 Support

For deployment issues:
- Check application logs: `docker-compose logs`
- Verify environment variables: `cat .env`
- Contact: contactsanket1@gmail.com

---
🚀 **Your Employee Management System is now ready for production on AWS EC2!**