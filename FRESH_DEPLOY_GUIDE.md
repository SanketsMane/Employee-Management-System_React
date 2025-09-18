# 🚀 EMS Fresh Deploy - Latest Code Guaranteed!

## Quick Deploy Commands (Copy & Paste on AWS):

### 🔄 **Update to Fresh Code (One Command):**
```bash
curl -s https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/docker-compose.aws.yml | docker-compose -f - down --remove-orphans && docker pull sanketsmane/ems-backend:fresh && docker pull sanketsmane/ems-frontend:fresh && curl -s https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/docker-compose.aws.yml | docker-compose -f - up -d && echo "✅ EMS deployed with FRESH code!"
```

### 🎯 **Step by Step (if needed):**
```bash
# Stop old containers
docker-compose down --remove-orphans

# Pull fresh images (built without cache with latest code)
docker pull sanketsmane/ems-backend:fresh
docker pull sanketsmane/ems-frontend:fresh

# Start with fresh code
curl -O https://raw.githubusercontent.com/SanketsMane/Employee-Management-System_React/main/docker-compose.aws.yml
docker-compose -f docker-compose.aws.yml up -d

# Check status
docker-compose -f docker-compose.aws.yml ps
```

### 📊 **Verify Fresh Deployment:**
```bash
# Check image hashes to confirm fresh builds
docker images | grep sanketsmane

# Check logs for latest features
docker logs ems-backend-prod --tail 10
docker logs ems-frontend-prod --tail 10

# Test application
curl -f https://ems.formonex.in/api/health
curl -f https://ems.formonex.in/
```

---

## 🎯 **Image Details:**
- **Backend**: `sanketsmane/ems-backend:fresh` (SHA: f8f2c31d)
- **Frontend**: `sanketsmane/ems-frontend:fresh` (SHA: bdd4ecab)
- **Built**: September 18, 2025 (No cache, guaranteed fresh)
- **Platform**: ARM64 + AMD64 support

---

## ✅ **Features in This Fresh Build:**
- Latest frontend code with current UI
- Updated backend with all features
- Fresh React build (September 18, 2025)
- All recent bug fixes included
- Modern dashboard with latest styling

**🚀 Use `:fresh` tags for guaranteed latest code!**