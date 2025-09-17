# 🐳 Docker Image Sharing Guide

## 📋 Overview
This guide shows you multiple ways to share your Employee Management System Docker images with your team.

## 🚀 **Method 1: Docker Hub (Recommended)**

### For You (Image Creator):
```bash
# 1. Build and push images
./share-images.sh --push

# 2. Share these commands with your team:
```

### For Your Team:
```bash
# Option A: Use automated script
git clone https://github.com/SanketsMane/Employee-Management-System_React.git
cd Employee-Management-System_React
cp .env.aws.template .env.prod
# Edit .env.prod with your settings
./team-deploy.sh --prod

# Option B: Manual Docker commands
docker pull sanketsmane/ems-backend:latest
docker pull sanketsmane/ems-frontend:latest
docker-compose -f docker-compose.share.yml up -d
```

**✅ Pros:** Easy, automatic updates, version control  
**❌ Cons:** Requires internet, public repository

---

## 💾 **Method 2: Offline File Sharing**

### For You (Image Creator):
```bash
# Export images to files
./share-images.sh --export

# This creates:
# - exports/ems-backend-latest.tar.gz
# - exports/ems-frontend-latest.tar.gz  
# - exports/load-images.sh

# Share the exports/ folder via:
# - USB drive, network share, email, etc.
```

### For Your Team:
```bash
# 1. Receive the exports/ folder
# 2. Load images
cd exports/
./load-images.sh

# 3. Run the application
docker-compose -f docker-compose.share.yml up -d
```

**✅ Pros:** Works offline, private, fast local sharing  
**❌ Cons:** Manual file transfer, larger file sizes

---

## 📦 **Method 3: Complete Deployment Package**

### For You (Image Creator):
```bash
# Create complete shareable package
./share-images.sh --share

# This creates a zip file with:
# - Deployment scripts
# - Docker Compose files
# - Documentation
# - Environment templates
```

### For Your Team:
```bash
# 1. Unzip the package
unzip ems-deployment-package-*.zip
cd ems-deployment-package-*/

# 2. Configure environment
cp .env.template .env.prod
nano .env.prod

# 3. Deploy
./team-deploy.sh --prod
```

**✅ Pros:** Complete solution, no Git required  
**❌ Cons:** Larger package size

---

## 🏢 **Method 4: Private Registry**

### Setup Private Registry:
```bash
# Run private Docker registry
docker run -d -p 5000:5000 --name registry registry:2

# Push images to private registry
docker tag sanketsmane/ems-backend:latest localhost:5000/ems-backend:latest
docker push localhost:5000/ems-backend:latest
```

### Team Access:
```bash
# Pull from private registry
docker pull your-server:5000/ems-backend:latest
```

**✅ Pros:** Private, controlled access  
**❌ Cons:** Requires server setup

---

## ☁️ **Method 5: Cloud Registries**

### AWS ECR Example:
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Push to ECR
docker tag sanketsmane/ems-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/ems-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ems-backend:latest
```

**✅ Pros:** Enterprise security, AWS integration  
**❌ Cons:** AWS costs, complexity

---

## 🔧 **Quick Commands Reference**

| Task | Command |
|------|---------|
| Build images | `./share-images.sh --build` |
| Push to Docker Hub | `./share-images.sh --push` |
| Export for offline | `./share-images.sh --export` |
| Pull latest | `./share-images.sh --pull` |
| Create package | `./share-images.sh --share` |
| Team deployment | `./team-deploy.sh --prod` |

---

## 📱 **Team Member Quick Start**

**If you received Docker Hub images:**
```bash
git clone https://github.com/SanketsMane/Employee-Management-System_React.git
cd Employee-Management-System_React
cp .env.aws.template .env.prod
# Edit .env.prod
./team-deploy.sh --prod
```

**If you received exported files:**
```bash
# Extract and load
cd exports/
./load-images.sh
# Then use Docker Compose or team script
```

**If you received deployment package:**
```bash
unzip ems-deployment-package-*.zip
cd ems-deployment-package-*/
cp .env.template .env.prod
# Edit .env.prod
./team-deploy.sh --prod
```

---

## 🐛 **Troubleshooting**

### Image Not Found
```bash
# Check available images
docker images | grep ems

# Pull if missing
docker pull sanketsmane/ems-backend:latest
```

### Push Permission Denied
```bash
# Login to Docker Hub
docker login

# Check repository permissions
```

### Large File Sizes
```bash
# Check image sizes
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Clean up old images
docker image prune -a
```

---

## 🎯 **Recommended Approach**

**For Development Teams:**
- Use Docker Hub method with automated scripts
- Quick and easy updates
- Version control

**For Enterprise/Private:**
- Use exported files or private registry
- Better security and control
- Offline capability

**For Quick Demo:**
- Use deployment package method
- No Git or technical setup required
- Everything included

---

## 📞 **Support**

- **Contact:** contactsanket1@gmail.com  
- **Repository:** https://github.com/SanketsMane/Employee-Management-System_React
- **Docker Hub:** https://hub.docker.com/u/sanketsmane

Choose the method that best fits your team's needs and infrastructure!