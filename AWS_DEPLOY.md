# AWS Deployment Guide for Backend

This guide covers deploying the Employee Management System backend to AWS.

## Deployment Options

### Option 1: AWS EC2 (Recommended)

#### Prerequisites
- AWS Account
- EC2 instance (t3.micro or higher)
- Security Groups configured
- Domain/subdomain pointed to EC2

#### Step 1: EC2 Setup
```bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

#### Step 2: Deploy Application
```bash
# Clone repository
git clone your-repo-url
cd Ems_Formonex/backend

# Install dependencies
npm install --production

# Copy production environment file
cp .env.production .env

# Edit environment variables
nano .env
# Update:
# - FRONTEND_URL=https://your-hostinger-domain.com
# - JWT_SECRET (generate new strong secret)
# - Any other production-specific values

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Step 3: Nginx Configuration
```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/ems-backend

# Add configuration (see nginx.conf file)

# Enable site
sudo ln -s /etc/nginx/sites-available/ems-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 4: SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-backend-domain.com
```

### Option 2: AWS Elastic Beanstalk

#### Step 1: Prepare Application
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init

# Create environment
eb create production-env
```

#### Step 2: Configure Environment Variables
- Go to AWS EB Console
- Environment > Configuration > Software
- Add all environment variables from .env.production

### Option 3: AWS Lambda + API Gateway (Serverless)

Use AWS SAM or Serverless Framework for serverless deployment.

## Security Configuration

### EC2 Security Groups
- Port 22 (SSH) - Your IP only
- Port 80 (HTTP) - 0.0.0.0/0
- Port 443 (HTTPS) - 0.0.0.0/0
- Port 8000 (App) - Internal only (if using Nginx)

### Environment Variables Security
- Never commit .env files
- Use AWS Systems Manager Parameter Store for secrets
- Rotate JWT secrets regularly

## Monitoring

### CloudWatch Integration
```javascript
// Add to server.js for CloudWatch logs
const winston = require('winston');
const CloudWatchLogs = require('winston-cloudwatch');

const logger = winston.createLogger({
  transports: [
    new CloudWatchLogs({
      logGroupName: 'ems-backend',
      logStreamName: 'application-logs',
      awsRegion: process.env.AWS_REGION
    })
  ]
});
```

## Backup Strategy

### Database Backup
- MongoDB Atlas automated backups
- Custom backup scripts

### Application Backup
- Use AWS AMI snapshots
- Git repository as backup

## Scaling

### Horizontal Scaling
- Use AWS Load Balancer
- Multiple EC2 instances
- Auto Scaling Groups

### Database Scaling
- MongoDB Atlas cluster scaling
- Read replicas for performance

## Troubleshooting

### Common Issues
1. **CORS Errors**: Update FRONTEND_URL in .env
2. **Database Connection**: Check MongoDB Atlas IP whitelist
3. **Email Service**: Verify Gmail app password
4. **File Uploads**: Check Cloudinary configuration

### Logs Location
- PM2 logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`
- Application logs: Check CloudWatch
