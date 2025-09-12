# 🚀 Employee Management System - Docker Images

## 📦 Pre-built Docker Images

These are ready-to-use Docker images for the Employee Management System:

- **Frontend**: `sanketsmane/ems-frontend:latest` (87.1MB)
- **Backend**: `sanketsmane/ems-backend:latest` (328MB)

## 🏃‍♂️ Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Download the compose file**:
   ```bash
   curl -o docker-compose.yml https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/docker-compose.share.yml
   ```

2. **Run the application**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:8000/api

### Option 2: Run Individual Containers

```bash
# Create network
docker network create ems-network

# Run backend
docker run -d \
  --name ems-backend \
  --network ems-network \
  -p 8000:5000 \
  -e MONGODB_URI="mongodb+srv://hackable3030:f9pZaA7rmlUkQ97N@cluster0.o6vez6l.mongodb.net/employee-management-system?retryWrites=true&w=majority&appName=Cluster0" \
  sanketsmane/ems-backend:latest

# Run frontend
docker run -d \
  --name ems-frontend \
  --network ems-network \
  -p 80:80 \
  sanketsmane/ems-frontend:latest
```

## 🔑 Default Login Credentials

- **Admin**: admin@company.com / admin123
- **HR**: hr@company.com / hr123456
- **Manager**: manager@company.com / manager123
- **Employee**: employee1@company.com / emp123456

## ✨ Features

- ✅ Complete Employee Management System
- ✅ Real-time notifications (WebSocket)
- ✅ Attendance tracking
- ✅ Leave management
- ✅ Company settings
- ✅ User roles and permissions
- ✅ Analytics and reporting
- ✅ Docker containerized
- ✅ MongoDB Atlas integrated

## 🛠️ Tech Stack

- **Frontend**: React + Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Deployment**: Docker + Nginx

## 📱 Support

For any issues or questions, contact: contactsanket1@gmail.com

---
Built with ❤️ by Sanket Mane