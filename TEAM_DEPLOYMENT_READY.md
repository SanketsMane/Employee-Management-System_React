# 🚀 EMS Docker Images - Ready for Team Deployment!

## ✅ **Images Successfully Published to Docker Hub**

### **Latest Production Images:**
- **Backend**: `sanketsmane/ems-backend:latest` (319MB)
- **Frontend**: `sanketsmane/ems-frontend:latest` (89.4MB)

### **Versioned Images:**
- **Backend**: `sanketsmane/ems-backend:v3.0` (319MB)
- **Frontend**: `sanketsmane/ems-frontend:v3.0` (89.4MB)

### **Docker Hub Links:**
- 🔗 Backend: https://hub.docker.com/r/sanketsmane/ems-backend
- 🔗 Frontend: https://hub.docker.com/r/sanketsmane/ems-frontend

---

## 👥 **Team Deployment Instructions**

### **Option 1: Quick Deploy (Recommended)**
```bash
# Clone repository
git clone https://github.com/SanketsMane/Employee-Management-System_React.git
cd Employee-Management-System_React

# Setup environment
cp .env.aws.template .env.prod
# Edit .env.prod with your database and email settings

# Deploy with one command
./team-deploy.sh --prod
```

### **Option 2: Manual Docker Commands**
```bash
# Pull latest images
docker pull sanketsmane/ems-backend:latest
docker pull sanketsmane/ems-frontend:latest

# Use existing docker-compose file
docker-compose -f docker-compose.share.yml up -d
```

### **Option 3: Direct Image Usage**
```bash
# Run backend
docker run -d -p 8000:5000 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-jwt-secret" \
  sanketsmane/ems-backend:latest

# Run frontend  
docker run -d -p 80:80 sanketsmane/ems-frontend:latest
```

---

## 🔧 **Environment Variables Required**

Create `.env.prod` file with:
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Authentication  
JWT_SECRET=your-super-secure-jwt-secret-key

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# URLs (adjust for your deployment)
FRONTEND_URL=http://localhost
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WEBSOCKET_URL=ws://localhost:8000
```

---

## 🌐 **Access URLs After Deployment**
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000/api
- **Health Check**: http://localhost:8000/api/health

---

## 📞 **Support & Resources**

### **Quick Commands:**
```bash
# View logs
./team-deploy.sh --logs

# Stop services
./team-deploy.sh --stop

# Update to latest
./team-deploy.sh --update

# Check status
docker ps
```

### **Documentation:**
- 📖 [Quick Start Guide](QUICK_START.md)
- 📖 [Complete Deployment Guide](DOCKER_DEPLOYMENT_GUIDE.md)
- 📖 [Docker Sharing Guide](DOCKER_SHARING_GUIDE.md)

### **Support:**
- **Developer**: Sanket Mane
- **Email**: contactsanket1@gmail.com
- **Repository**: https://github.com/SanketsMane/Employee-Management-System_React

---

## 🎯 **What's Included in Latest Images**

### **Backend Features:**
- ✅ Employee Management System API
- ✅ JWT Authentication
- ✅ Role-based Access Control
- ✅ MongoDB Integration
- ✅ Email Services
- ✅ File Upload (Cloudinary)
- ✅ **NEW: Overtime Tracking System**
- ✅ WebSocket Support
- ✅ Comprehensive Logging

### **Frontend Features:**
- ✅ React with Vite
- ✅ TailwindCSS Styling
- ✅ Role-based UI
- ✅ Employee Dashboard
- ✅ Admin Panel
- ✅ **NEW: Overtime Management UI**
- ✅ Real-time Notifications
- ✅ Responsive Design

---

**Published**: September 17, 2025  
**Version**: v3.0  
**Status**: ✅ Production Ready

Happy Deploying! 🚀