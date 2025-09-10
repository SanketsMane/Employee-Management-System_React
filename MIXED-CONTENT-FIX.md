# 🔒 Mixed Content Error Fix Guide

## ❌ **The Problem:**
```
Mixed Content: The page at 'https://ems.formonex.in/login' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://43.205.116.48:8000/api/auth/login'. 
This request has been blocked; the content must be served over HTTPS.
```

**Root Cause**: Your frontend (Hostinger) is using HTTPS, but your backend (AWS EC2) is using HTTP. Modern browsers block HTTP requests from HTTPS pages for security.

---

## 🚀 **Solution 1: Enable HTTPS on AWS EC2 (Recommended)**

### **Step 1: Get SSL Certificate**

#### **Option A: Free SSL with Let's Encrypt**
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@43.205.116.48

# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d ec2-43-205-116-48.ap-south-1.compute.amazonaws.com

# Or for IP address (create self-signed certificate)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/server.key \
  -out /etc/ssl/certs/server.crt \
  -subj "/C=IN/ST=YourState/L=YourCity/O=Formonex/OU=IT/CN=43.205.116.48"
```

#### **Option B: AWS Certificate Manager (if using Load Balancer)**
1. Go to AWS Certificate Manager
2. Request a public certificate
3. Add domain: `ec2-43-205-116-48.ap-south-1.compute.amazonaws.com`
4. Validate via DNS or email
5. Attach to Application Load Balancer

### **Step 2: Update Nginx Configuration**
The deployment script is already updated with SSL configuration. Run:
```bash
./deploy-backend-aws.sh
```

### **Step 3: Update Frontend Configuration**
Your frontend will use: `https://43.205.116.48:8000/api`

---

## 🔧 **Solution 2: Quick Temporary Fix**

### **For Immediate Testing (Not Production Ready):**

#### **Step 1: Use HTTP Frontend**
Deploy your frontend to a **non-HTTPS** hosting temporarily:
- Use `http://ems.formonex.in` (if possible)
- Or use a different hosting provider that allows HTTP

#### **Step 2: Browser Override (Development Only)**
In Chrome/Edge:
1. Open `chrome://flags/#allow-running-insecure-content`
2. Enable "Allow running insecure content"
3. Restart browser
4. Visit your site and allow mixed content

⚠️ **Warning**: This is only for testing, not production!

---

## 🔄 **Solution 3: Alternative Backend URLs**

### **Option A: Use Domain Instead of IP**
1. Create a subdomain: `api.formonex.in`
2. Point it to your EC2 instance: `43.205.116.48`
3. Get SSL certificate for the domain
4. Update frontend: `https://api.formonex.in/api`

### **Option B: AWS Application Load Balancer**
1. Create an Application Load Balancer
2. Add SSL certificate
3. Route traffic to your EC2 instance
4. Use the Load Balancer URL with HTTPS

---

## 📝 **Immediate Action Plan:**

### **For Right Now (5 minutes):**
```bash
# 1. Rebuild frontend with HTTP (temporary)
cd /Users/sanketmane/Employee-Management-System_React/frontend
npm run build

# 2. Create new ZIP
zip -r ems-frontend-http-temp.zip dist/

# 3. Upload to Hostinger
# 4. Test functionality
```

### **For Production (30 minutes):**
```bash
# 1. SSH to EC2
ssh -i your-key.pem ec2-user@43.205.116.48

# 2. Install SSL certificate
sudo yum install -y certbot python3-certbot-nginx
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/server.key \
  -out /etc/ssl/certs/server.crt \
  -subj "/C=IN/ST=India/L=YourCity/O=Formonex/OU=IT/CN=43.205.116.48"

# 3. Update Nginx configuration (already in deployment script)
./deploy-backend-aws.sh

# 4. Rebuild frontend with HTTPS
# Update .env.production to use https://43.205.116.48:8000/api
npm run build
zip -r ems-frontend-https.zip dist/

# 5. Upload to Hostinger
```

---

## 🧪 **Testing Your Fix:**

### **1. Test Backend HTTPS:**
```bash
curl -k https://43.205.116.48:8000/api/test/health
```

### **2. Test from Frontend:**
Open browser console and check if API calls are successful.

### **3. Complete Functionality Test:**
- Login/Register
- Dashboard loading
- Company data updates
- All CRUD operations

---

## 📞 **Quick Support Commands:**

### **Check SSL Certificate:**
```bash
openssl x509 -in /etc/ssl/certs/server.crt -text -noout
```

### **Check Nginx Status:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

### **Check Backend Status:**
```bash
pm2 status
pm2 logs
```

### **Test API Endpoint:**
```bash
curl -k https://43.205.116.48:8000/api/test/health
```

---

## 🎯 **Recommended Solution:**

**Option 1** (SSL on EC2) is the best for production. It will:
- ✅ Fix Mixed Content errors
- ✅ Provide proper security
- ✅ Work with all browsers
- ✅ Be production-ready

Choose **Solution 2** only for immediate testing while you implement Solution 1.

---

## 📝 **Files Updated:**
- `frontend/.env.production` - Backend URL configuration
- `deploy-backend-aws.sh` - SSL Nginx configuration
- `ems-frontend-http-temp.zip` - Temporary HTTP build
- `ems-frontend-https.zip` - HTTPS build (for after SSL setup)

**Next Step**: Choose which solution to implement and follow the steps above!
