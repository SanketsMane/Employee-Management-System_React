# 🚀 Production Deployment Guide - EMS v4.5

## 📋 Overview

This guide provides comprehensive instructions for deploying the Employee Management System (EMS) v4.5 to production environments. It covers everything from initial setup to monitoring and maintenance.

## 🎯 Prerequisites

### System Requirements
- **Server**: Ubuntu 20.04+ or CentOS 8+ (4GB RAM, 50GB Storage minimum)
- **Node.js**: v18.x or higher
- **Docker**: v20.10+ with Docker Compose
- **MongoDB**: Atlas cluster or self-hosted v5.0+
- **SSL Certificate**: Valid SSL certificate for domain
- **Domain**: Configured domain with DNS pointing to server

### Services Needed
- **Email Service**: Gmail, SendGrid, or similar SMTP service
- **File Storage**: Cloudinary account for image/file uploads
- **Monitoring**: Optional - Sentry for error tracking

## 🔧 Pre-Deployment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Domain & SSL Setup

```bash
# Configure nginx for domain
sudo nginx -t && sudo systemctl reload nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 3. MongoDB Setup

**Option A: MongoDB Atlas (Recommended)**
1. Create MongoDB Atlas account
2. Create cluster and database user
3. Whitelist server IP address
4. Get connection string

**Option B: Self-hosted MongoDB**
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo --eval "use ems-production; db.createUser({user: 'emsuser', pwd: 'secure-password', roles: ['readWrite']})"
```

## 📦 Deployment Methods

### Method 1: Docker Deployment (Recommended)

#### Step 1: Clone Repository
```bash
cd /opt
sudo git clone https://github.com/SanketsMane/Employee-Management-System_React.git
sudo chown -R $USER:$USER Employee-Management-System_React
cd Employee-Management-System_React
```

#### Step 2: Configure Environment
```bash
# Copy and configure environment file
cp .env.production.template .env.prod

# Edit configuration (fill in actual values)
nano .env.prod
```

#### Step 3: Build and Deploy
```bash
# Make scripts executable
chmod +x *.sh

# Build Docker images (when network connectivity is restored)
./build-images-v4.5.sh

# Test images locally
./test-images-v4.5.sh

# Deploy to production
./deploy-v4.5.sh
```

### Method 2: Manual Deployment

#### Step 1: Backend Setup
```bash
cd backend

# Install dependencies
npm ci --production

# Copy environment file
cp .env.production.template .env

# Edit environment variables
nano .env

# Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### Step 2: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Configure nginx
sudo cp nginx.conf /etc/nginx/sites-available/ems
sudo ln -s /etc/nginx/sites-available/ems /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 🔒 Security Configuration

### 1. Firewall Setup
```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 8000/tcp  # Block direct backend access
```

### 2. Environment Security
```bash
# Secure environment files
chmod 600 .env.prod
chown root:root .env.prod

# Create secure directories
mkdir -p /app/logs /app/uploads /app/backups
chown -R www-data:www-data /app/uploads
chmod 755 /app/logs /app/backups
```

### 3. MongoDB Security
```bash
# Enable authentication (if self-hosted)
sudo nano /etc/mongod.conf
# Add: security.authorization: enabled

# Create admin user
mongo admin --eval "db.createUser({user: 'admin', pwd: 'secure-admin-password', roles: ['userAdminAnyDatabase']})"
```

## 📊 Monitoring & Logging

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs
tail -f /app/logs/app.log
```

### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop netstat

# Check resource usage
htop
df -h
free -h
```

### 3. Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/ems
```

Add:
```
/app/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 🔄 Backup & Recovery

### 1. Database Backup
```bash
# Create backup script
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/app/backups/db_$DATE"
tar -czf "/app/backups/db_$DATE.tar.gz" "/app/backups/db_$DATE"
rm -rf "/app/backups/db_$DATE"
find /app/backups -name "db_*.tar.gz" -mtime +30 -delete
EOF

chmod +x /opt/backup-db.sh
```

### 2. Automated Backups
```bash
# Add to crontab
crontab -e
```

Add:
```
# Daily database backup at 2 AM
0 2 * * * /opt/backup-db.sh

# Weekly full system backup
0 3 * * 0 tar -czf /app/backups/system_$(date +\%Y\%m\%d).tar.gz /opt/Employee-Management-System_React --exclude=node_modules
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Server meets minimum requirements
- [ ] Domain configured with SSL certificate
- [ ] MongoDB database setup and accessible
- [ ] Email service configured and tested
- [ ] Cloudinary account setup for file uploads
- [ ] Environment variables configured
- [ ] Firewall rules configured

### Deployment
- [ ] Repository cloned and configured
- [ ] Dependencies installed
- [ ] Environment files secured
- [ ] Application built successfully
- [ ] Database connection tested
- [ ] Services started and running

### Post-Deployment
- [ ] Application accessible via domain
- [ ] SSL certificate working
- [ ] User registration/login working
- [ ] File uploads working
- [ ] Email notifications working
- [ ] WebSocket connections working
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Documentation updated

## 🔧 Troubleshooting

### Common Issues

**1. Application Not Starting**
```bash
# Check logs
pm2 logs
docker-compose logs

# Check environment variables
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI ? 'DB configured' : 'DB missing')"
```

**2. Database Connection Issues**
```bash
# Test MongoDB connection
mongo --eval "db.runCommand('ping')" "$MONGODB_URI"

# Check firewall
sudo ufw status
netstat -tlnp | grep :27017
```

**3. SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Check nginx configuration
sudo nginx -t
```

**4. File Upload Issues**
```bash
# Check permissions
ls -la /app/uploads
sudo chown -R www-data:www-data /app/uploads

# Check Cloudinary configuration
curl -X GET "https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/usage" \
  --user "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET"
```

## 📱 Health Checks

### Automated Health Monitoring
```bash
# Create health check script
cat > /opt/health-check.sh << 'EOF'
#!/bin/bash
# Check application health
curl -f http://localhost:8000/health || echo "Backend unhealthy"
curl -f http://localhost:3000 || echo "Frontend unhealthy"

# Check database
mongo --eval "db.runCommand('ping')" "$MONGODB_URI" || echo "Database unhealthy"

# Check disk space
df -h | awk '$5 > 80 {print "Disk usage high: " $0}'
EOF

chmod +x /opt/health-check.sh
```

## 🔄 Updates & Maintenance

### Application Updates
```bash
# Backup current version
cp -r /opt/Employee-Management-System_React /opt/Employee-Management-System_React.backup

# Pull latest changes
git pull origin main

# Update dependencies
npm ci --production

# Restart services
pm2 restart all
# OR for Docker
docker-compose restart
```

### Security Updates
```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Node.js updates
sudo npm install -g npm@latest

# Certificate renewal (automatic)
sudo certbot renew
```

## 📞 Support & Resources

### Documentation
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

### Monitoring URLs
- Application: `https://yourdomain.com`
- API Health: `https://yourdomain.com/api/health`
- Server Status: `https://yourdomain.com/status`

### Emergency Contacts
- System Administrator: admin@formonex.in
- Database Administrator: dba@formonex.in
- Development Team: dev@formonex.in

---

**Note**: Replace `yourdomain.com` with your actual domain and update all placeholder values with actual configuration data.