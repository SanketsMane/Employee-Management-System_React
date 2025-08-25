# 📋 Deployment Checklist

## ✅ Pre-Deployment Requirements

### 🔧 **Infrastructure**
- [ ] AWS Account with EC2 access
- [ ] Hostinger hosting account
- [ ] Domain names purchased and configured
- [ ] MongoDB Atlas database (existing one is fine)
- [ ] Gmail account with app password (already configured)

### 📧 **Accounts & Credentials**
- [ ] AWS Access Key & Secret Key
- [ ] Hostinger FTP/File Manager access
- [ ] Domain DNS management access
- [ ] MongoDB Atlas admin access
- [ ] Cloudinary account (already configured)

## 🚀 Deployment Steps

### **Step 1: Backend Deployment (AWS EC2)**

#### 1.1 Launch EC2 Instance
- [ ] Launch Ubuntu 22.04 LTS instance
- [ ] Choose t3.micro (free tier) or t3.small
- [ ] Configure security groups:
  - [ ] SSH (22) - Your IP only
  - [ ] HTTP (80) - Anywhere
  - [ ] HTTPS (443) - Anywhere
- [ ] Create/use existing key pair
- [ ] Allocate Elastic IP

#### 1.2 Setup Server
```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run setup script
wget https://raw.githubusercontent.com/your-repo/setup-aws.sh
chmod +x setup-aws.sh
./setup-aws.sh
```

#### 1.3 Deploy Application
```bash
# Clone repository
cd /var/www/ems-backend
git clone https://github.com/your-repo/Ems_Formonex.git .

# Install dependencies
cd backend
npm install --production

# Configure environment
cp .env.production .env
nano .env
# Update: FRONTEND_URL, JWT_SECRET, domain-specific values

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 1.4 Configure Nginx & SSL
```bash
# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/ems-backend
sudo ln -s /etc/nginx/sites-available/ems-backend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL certificate
sudo certbot --nginx -d your-backend-domain.com
```

### **Step 2: Frontend Deployment (Hostinger)**

#### 2.1 Build Production Version
```bash
# Update production environment
nano frontend/.env.production
# Set: VITE_API_BASE_URL=https://your-aws-backend-domain.com/api

# Build project
npm run build:prod
```

#### 2.2 Upload to Hostinger
- [ ] Login to Hostinger control panel
- [ ] Go to File Manager
- [ ] Navigate to `public_html` (or your domain folder)
- [ ] Upload all files from `frontend/dist/` folder
- [ ] Ensure `index.html` is in the root directory

#### 2.3 Configure Domain
- [ ] Point domain A record to Hostinger server IP
- [ ] Enable SSL in Hostinger control panel
- [ ] Test domain accessibility

### **Step 3: DNS Configuration**

#### 3.1 Backend Domain (AWS)
- [ ] Point A record to EC2 Elastic IP
- [ ] Wait for DNS propagation (up to 24 hours)

#### 3.2 Frontend Domain (Hostinger)
- [ ] Point A record to Hostinger server IP
- [ ] Configure any subdomains if needed

## 🧪 Testing & Validation

### **Backend Testing**
- [ ] `https://your-backend-domain.com/api/health` returns 200
- [ ] SSL certificate is valid
- [ ] CORS headers allow frontend domain
- [ ] Database connection successful
- [ ] Email service working

### **Frontend Testing**
- [ ] Website loads without errors
- [ ] Login functionality works
- [ ] API calls successful (check browser network tab)
- [ ] All pages accessible
- [ ] Responsive design works on mobile
- [ ] File uploads working

### **Full System Testing**
- [ ] User registration/login
- [ ] Attendance marking
- [ ] Leave request creation/approval
- [ ] Worksheet management
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Real-time features (WebSocket)

## 🔍 Monitoring & Maintenance

### **Backend Monitoring**
```bash
# Check application status
pm2 status

# View logs
pm2 logs ems-backend

# Monitor resources
htop

# Check Nginx
sudo systemctl status nginx
```

### **Frontend Monitoring**
- [ ] Setup Google Analytics (optional)
- [ ] Monitor error rates in browser console
- [ ] Test across different browsers

## 🛠️ Troubleshooting

### **Common Issues**

1. **CORS Errors**
   - Check FRONTEND_URL in backend .env
   - Verify Nginx CORS configuration
   - Ensure domains match exactly

2. **Database Connection Failed**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string
   - Test with MongoDB Compass

3. **Email/SMS Not Working**
   - Verify EMAIL_ENABLED=true
   - Check Gmail app password
   - Review backend logs

4. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Review file type restrictions

5. **SSL Certificate Issues**
   - Renew with: `sudo certbot renew`
   - Check domain propagation
   - Verify Nginx configuration

## 📊 Success Metrics

### **Deployment Complete When:**
- [ ] ✅ Frontend accessible via HTTPS
- [ ] ✅ Backend API responding via HTTPS
- [ ] ✅ Database operations working
- [ ] ✅ Authentication flow complete
- [ ] ✅ All core features functional
- [ ] ✅ Email/SMS notifications sending
- [ ] ✅ File uploads working
- [ ] ✅ No console errors
- [ ] ✅ Mobile responsive

## 🎉 Post-Deployment

### **Documentation**
- [ ] Update README with live URLs
- [ ] Document any custom configurations
- [ ] Create backup strategy
- [ ] Setup monitoring alerts

### **Security**
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup strategy in place
- [ ] Error monitoring setup

---

**Estimated Deployment Time:** 2-4 hours for experienced developers, 4-8 hours for beginners.

**Support:** contactsanket1@gmail.com
