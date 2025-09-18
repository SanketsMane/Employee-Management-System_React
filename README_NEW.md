# Employee Management System (EMS) v4.5

A comprehensive, modern Employee Management System built with the MERN stack, designed for scalable enterprise deployment.

## 🚀 Quick Start with Docker

### Using Docker Hub Images (Recommended)

```bash
# Pull and run backend
docker run -d -p 8000:8000 \
  -e MONGODB_URI="your-mongo-uri" \
  -e JWT_SECRET="your-secret" \
  sanketsmane/ems-backend:v4.5

# Pull and run frontend
docker run -d -p 80:80 \
  -e REACT_APP_API_URL="http://your-server:8000" \
  sanketsmane/ems-frontend:v4.5
```

### Using Docker Compose

```bash
# Clone repository
git clone https://github.com/SanketsMane/Employee-Management-System_React.git
cd Employee-Management-System_React

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Deploy
docker-compose -f docker-compose.production.yml up -d
```

## 📦 Docker Hub Images

- **Backend**: `sanketsmane/ems-backend:v4.5`
- **Frontend**: `sanketsmane/ems-frontend:v4.5`
- **Repositories**: https://hub.docker.com/u/sanketsmane

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React.js 18, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express.js, MongoDB, JWT Authentication
- **Infrastructure**: Docker, nginx, SSL/HTTPS ready
- **Cloud**: AWS EC2 deployment ready

### Key Features
- **Role-based Access Control** (Admin, HR, Manager, Employee)
- **Real-time Notifications** with WebSocket
- **File Upload Management** with Cloudinary
- **Automated Email System** with SMTP
- **Comprehensive Dashboard** with analytics
- **Attendance Management** with check-in/out
- **Leave Management** with approval workflow
- **Task Assignment** and tracking
- **Team Management** with hierarchical structure

## 🔧 Production Deployment

### AWS EC2 Deployment
See: [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)

### Docker Production
See: [DOCKER_V4.5_GUIDE.md](DOCKER_V4.5_GUIDE.md)

### Monitoring & Backup
See: [MONITORING_LOGGING_GUIDE.md](MONITORING_LOGGING_GUIDE.md)
See: [BACKUP_RECOVERY_GUIDE.md](BACKUP_RECOVERY_GUIDE.md)

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- MongoDB
- Docker (optional)

### Local Development
```bash
# Install dependencies
npm install

# Backend setup
cd backend
npm install
cp .env.example .env
# Configure .env
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

## 📋 Environment Configuration

### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/ems_dev

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload (Optional)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting
- SQL injection prevention
- XSS protection

## 📊 System Requirements

### Minimum
- 2 CPU cores
- 4GB RAM
- 20GB storage
- Ubuntu 20.04+ or equivalent

### Recommended
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- Load balancer for high availability

## 🚀 Available Scripts

### Production Deployment
- `./deploy-v4.5.sh` - Complete production deployment
- `./deploy-aws.sh` - AWS EC2 deployment
- `./build-images-v4.5.sh` - Build Docker images
- `./push-images-v4.5.sh` - Push to Docker Hub

### Maintenance
- `./backup-system.sh` - Automated backup system
- `./recovery-system.sh` - Disaster recovery
- `./test-images-v4.5.sh` - Test Docker images

## 📞 Support & Documentation

- **Documentation**: Check the included guide files
- **Issues**: Create GitHub issues for bugs
- **Docker Hub**: https://hub.docker.com/u/sanketsmane
- **Repository**: https://github.com/SanketsMane/Employee-Management-System_React

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**EMS v4.5 - Production Ready** | Built with ❤️ for modern enterprises