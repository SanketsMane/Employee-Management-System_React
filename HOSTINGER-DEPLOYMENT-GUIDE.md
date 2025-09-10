# 🚀 Hostinger Frontend Deployment Guide

## 📋 **What You Have Ready:**
- ✅ Production build completed in `frontend/dist/`
- ✅ ZIP file created: `ems-frontend-production.zip`
- ✅ Backend running on AWS EC2: `43.205.116.48:8000`
- ✅ Domain configured: `ems.formonex.in`

## 🌐 **Step-by-Step Hostinger Deployment:**

### **1. Access Hostinger Control Panel**
1. Login to your **Hostinger account**
2. Go to **"Hosting"** section
3. Find your domain **`ems.formonex.in`**
4. Click **"Manage"** or **"File Manager"**

### **2. Navigate to Your Domain's Directory**
1. In File Manager, navigate to your domain folder
2. Look for: **`ems.formonex.in`** or **`public_html/ems.formonex.in`**
3. If it doesn't exist, create it: **"New Folder"** → **`ems.formonex.in`**

### **3. Upload Your Frontend Files**
You have **TWO OPTIONS**:

#### **Option A: Upload ZIP File (Recommended)**
1. In your domain folder, click **"Upload Files"**
2. Upload **`ems-frontend-production.zip`** from your local machine
3. Right-click the uploaded ZIP file
4. Select **"Extract"** or **"Unzip"**
5. Move all files from the **`dist/`** folder to the **root** of your domain directory

#### **Option B: Upload Individual Files**
1. Upload all files from `frontend/dist/` folder:
   - `index.html`
   - `assets/` folder (with all JS/CSS files)
   - `images/` folder
   - `formonex-logo.svg`
   - `vite.svg`
   - `test-api.js`

### **4. Verify File Structure**
Your domain root should look like this:
```
ems.formonex.in/
├── index.html              ← Main entry point
├── assets/
│   ├── index-DrhkeL8r.js   ← Main application
│   ├── index-CMVvOn_p.css  ← Styles
│   ├── vendor-DOHx2j1n.js  ← Third-party libraries
│   ├── router-DOrkqUOM.js  ← Routing
│   └── ui-CoZGPwtM.js      ← UI components
├── images/                 ← Screenshots and images
├── formonex-logo.svg       ← Company logo
├── vite.svg               ← Vite logo
└── test-api.js            ← API testing script
```

### **5. Configure Hostinger Settings**

#### **A. Set Default Page**
1. In Hostinger control panel, go to **"Website"** section
2. Set **"Default Page"** to **`index.html`**

#### **B. Enable HTTPS (Recommended)**
1. Go to **"SSL/TLS"** in your hosting panel
2. Enable **"Force HTTPS Redirect"**
3. Install **"Let's Encrypt SSL"** (free)

#### **C. Configure SPA Redirects (Important for React)**
Create a **`.htaccess`** file in your domain root with this content:
```apache
RewriteEngine On
RewriteBase /

# Handle Angular and React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

### **6. Test Your Deployment**

#### **A. Basic Website Test**
1. Visit: **`https://ems.formonex.in`**
2. You should see the **Employee Management System** login page
3. Check that the logo and styling load correctly

#### **B. API Connection Test**
1. Try to **login** with existing credentials
2. Check browser **Developer Tools** → **Network** tab
3. Verify API calls are going to: **`http://43.205.116.48:8000/api`**

#### **C. Full Functionality Test**
1. **Login** → Should work with backend authentication
2. **Dashboard** → Should load user data
3. **Company Page** → Should show "Formonex" company data
4. **Admin Panel** → Should show user management features
5. **All Routes** → Test navigation between pages

### **7. Troubleshooting Common Issues**

#### **Issue: 404 Errors on Page Refresh**
**Solution**: Ensure `.htaccess` file is properly configured with SPA redirects

#### **Issue: API Connection Errors**
**Solution**: Check if AWS EC2 backend is running and accessible
```bash
# Test backend from your browser:
http://43.205.116.48:8000/api/test/health
```

#### **Issue: CORS Errors**
**Solution**: Backend is already configured for `https://ems.formonex.in`

#### **Issue: White Screen**
**Solution**: 
1. Check browser console for JavaScript errors
2. Verify all files uploaded correctly
3. Check that `index.html` is in the root directory

#### **Issue: Images Not Loading**
**Solution**: Verify the `images/` folder uploaded correctly

### **8. Production Checklist**

- [ ] Files uploaded to correct domain directory
- [ ] `index.html` in root directory
- [ ] All assets (JS, CSS, images) uploaded
- [ ] `.htaccess` file configured for SPA routing
- [ ] HTTPS/SSL enabled
- [ ] Website loads at `https://ems.formonex.in`
- [ ] Login functionality works
- [ ] API calls reach AWS EC2 backend
- [ ] All pages accessible via direct URLs
- [ ] Company data displays correctly
- [ ] Admin features work
- [ ] Email notifications work (backend feature)

### **9. Performance Optimization (Optional)**

#### **A. Enable Gzip Compression**
Add to `.htaccess`:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

#### **B. Browser Caching**
Already included in the `.htaccess` above

### **10. Backup Strategy**
- Keep the `ems-frontend-production.zip` file as backup
- Document your Hostinger login credentials
- Save a copy of your `.htaccess` configuration

## 🎉 **Success!**
Your **Employee Management System** frontend is now live at:
**https://ems.formonex.in**

## 📞 **Support Information**
- **Frontend**: `https://ems.formonex.in`
- **Backend API**: `http://43.205.116.48:8000/api`
- **Database**: MongoDB Atlas (Cloud)
- **Email Service**: Gmail SMTP
- **GitHub Repository**: `https://github.com/SanketsMane/Employee-Management-System_React`

---
**Note**: Make sure your AWS EC2 backend is running before testing the frontend functionality!
