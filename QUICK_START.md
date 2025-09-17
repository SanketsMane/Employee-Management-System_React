# 🚀 Quick Team Deployment Guide

## For Team Members - Deploy in 5 Minutes!

### 📋 What You Need
- Docker installed on your machine
- Git (to clone the repository)
- 5 minutes of your time

### 🏃‍♂️ Step 1: Get the Code
```bash
git clone https://github.com/SanketsMane/Employee-Management-System_React.git
cd Employee-Management-System_React
```

### ⚙️ Step 2: Setup Environment
```bash
# Copy the environment template
cp .env.aws.template .env.prod

# Edit with your database and email settings
nano .env.prod
```

**Minimum required settings in `.env.prod`:**
```bash
MONGODB_URI=mongodb+srv://your-username:password@cluster.mongodb.net/ems
JWT_SECRET=your-super-long-secure-jwt-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost
```

### 🚀 Step 3: Deploy
```bash
# Make script executable (first time only)
chmod +x team-deploy.sh

# Deploy production environment
./team-deploy.sh --prod
```

### 🎉 Step 4: Access Your Application
- **Frontend:** http://localhost
- **Backend API:** http://localhost:8000/api
- **Admin Login:** Use the credentials from your database

---

## 🔧 Quick Commands

```bash
# View logs
./team-deploy.sh --logs

# Stop everything
./team-deploy.sh --stop

# Update to latest version
./team-deploy.sh --update

# Check status
docker-compose ps
```

## 🆘 Need Help?

1. **Docker not running?** Start Docker Desktop
2. **Port conflicts?** Run `./team-deploy.sh --stop` first
3. **Database issues?** Check your MongoDB connection string
4. **Still stuck?** Contact: contactsanket1@gmail.com

---

That's it! Your Employee Management System is now running locally with production Docker images.

**Pro Tip:** Use `./team-deploy.sh --dev` for development mode with live reloading.