# FormoEMS Deployment Guide

## Overview
This guide covers deploying FormoEMS with:
- **Frontend**: Hostinger hosting at https://ems.formonex.in/
- **Backend**: AWS EC2 instance
- **Database**: MongoDB Atlas (already configured)

## 🏗️ Architecture
```
[User] → [Hostinger (Frontend)] → [AWS EC2 (Backend)] → [MongoDB Atlas]
```

## 📋 Prerequisites

### 1. AWS EC2 Setup
- Launch an Ubuntu 20.04+ EC2 instance
- Configure security group to allow:
  - SSH (port 22)
  - HTTP (port 80) 
  - HTTPS (port 443)
  - Custom (port 8000)
- Download the .pem key file

### 2. Domain Configuration
- Your domain: `ems.formonex.in` should point to Hostinger
- For backend, you'll get an EC2 public IP/domain

## 🚀 Backend Deployment (AWS EC2)

### Step 1: Configure Deployment Script
1. Edit `backend/deploy-to-aws.sh`
2. Set your EC2 details:
```bash
EC2_HOST="your-ec2-public-ip-or-domain"
KEY_PATH="path/to/your-key.pem"
```

### Step 2: Deploy Backend
```bash
cd backend
chmod +x deploy-to-aws.sh
./deploy-to-aws.sh
```

### Step 3: Note Your Backend URL
After deployment, your backend will be accessible at:
- `http://your-ec2-ip` (Nginx proxy)
- `http://your-ec2-ip:8000` (Direct Node.js)

## 🌐 Frontend Deployment (Hostinger)

### Step 1: Update Environment
1. Edit `frontend/.env.production`
2. Replace the backend URL:
```bash
VITE_API_BASE_URL=http://your-ec2-ip/api
VITE_WEBSOCKET_URL=ws://your-ec2-ip
```

### Step 2: Build and Deploy
```bash
cd frontend
chmod +x deploy-hostinger.sh
./deploy-hostinger.sh
```

### Step 3: Upload to Hostinger
1. Login to Hostinger control panel
2. Go to File Manager
3. Navigate to `public_html`
4. Delete existing files
5. Upload all files from `frontend/dist/` folder
6. Ensure `.htaccess` file is present

## 🔧 Configuration Files

### Backend Environment (.env.production)
```bash
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://...  # Your MongoDB Atlas URI
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://ems.formonex.in
# ... other configs
```

### Frontend Environment (.env.production)  
```bash
VITE_API_BASE_URL=http://your-ec2-ip/api
VITE_WEBSOCKET_URL=ws://your-ec2-ip
VITE_APP_NAME=FormoEMS
```

## 🔍 Testing Deployment

### 1. Backend Health Check
```bash
curl http://your-ec2-ip/health
# Should return: {"status":"OK","message":"Server is running"}
```

### 2. Frontend Access
- Visit: https://ems.formonex.in/
- Should show the landing page
- Test login functionality

### 3. Full Integration Test
1. Open frontend in browser
2. Try to login with demo credentials
3. Check if data loads from backend

## 🔧 Monitoring & Maintenance

### Backend Monitoring (SSH to EC2)
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs formoems-backend

# Restart if needed
pm2 restart formoems-backend

# Check Nginx status
sudo systemctl status nginx
```

### Frontend Monitoring
- Check Hostinger control panel for any issues
- Monitor domain resolution
- Check browser console for API connection errors

## 🚨 Troubleshooting

### CORS Issues
If frontend can't connect to backend:
1. Check backend logs: `pm2 logs formoems-backend`
2. Verify FRONTEND_URL in backend .env
3. Check EC2 security group allows port 80/8000

### Build Issues
If frontend build fails:
1. Check Node.js version (should be 16+)
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check for TypeScript/import errors

### Database Connection
If backend can't connect to MongoDB:
1. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)
2. Verify MONGODB_URI in backend .env
3. Check network connectivity from EC2

## 📚 Useful Commands

### Backend (EC2)
```bash
# SSH to EC2
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# Check running processes
pm2 list

# View real-time logs
pm2 logs --lines 50

# Restart application
pm2 restart formoems-backend
```

### Frontend (Local)
```bash
# Build for production
npm run build

# Preview build locally
npm run preview

# Check build size
ls -la dist/
```

## 🔄 Updates & Maintenance

### Updating Backend
1. Make changes locally
2. Run deployment script: `./deploy-to-aws.sh`
3. Monitor logs for issues

### Updating Frontend
1. Make changes locally
2. Run build script: `./deploy-hostinger.sh`
3. Upload new files to Hostinger

## 📞 Support
- Backend logs: `pm2 logs formoems-backend`
- Database: MongoDB Atlas dashboard
- Frontend: Browser developer tools
- Domain: Hostinger control panel

---

🎉 **Your FormoEMS is now production-ready!**
- Frontend: https://ems.formonex.in/
- Backend: http://your-ec2-ip/
- Database: MongoDB Atlas
