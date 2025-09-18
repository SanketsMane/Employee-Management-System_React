# 🚀 SSL Mixed Content Fix - Complete Deployment Guide

## 🔍 Problem Analysis
The error `ERR_SSL_PROTOCOL_ERROR` occurs because:
- Frontend: HTTPS (`https://ems.formonex.in`) ✅
- Backend: HTTP (`http://65.0.94.0:8000`) ❌
- **Browser Security**: HTTPS sites cannot make HTTP requests (mixed content policy)

## ✅ Solution: Reverse Proxy Setup

Instead of configuring SSL on the backend, we'll use a reverse proxy so all requests go through your existing HTTPS domain.

### 🎯 How It Works
```
Browser → https://ems.formonex.in/api → Nginx Proxy → http://65.0.94.0:8000/api
```

## 📋 Step-by-Step Implementation

### Step 1: Update Your Nginx Configuration

Add this to your existing nginx configuration file for `ems.formonex.in`:

```bash
# Edit your nginx config
sudo nano /etc/nginx/sites-available/ems.formonex.in
```

Add these sections to your existing server block:

```nginx
# API Reverse Proxy - ADD THIS
location /api/ {
    proxy_pass http://65.0.94.0:8000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS Headers
    add_header 'Access-Control-Allow-Origin' 'https://ems.formonex.in' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
}

# WebSocket Proxy - ADD THIS
location /socket.io/ {
    proxy_pass http://65.0.94.0:8000/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Step 2: Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### Step 3: Deploy Updated Frontend

The new frontend (v4.3) is already configured to use:
- API: `https://ems.formonex.in/api`
- WebSocket: `wss://ems.formonex.in`

```bash
# Pull the new image
docker pull sanketsmane/ems-frontend:v4.3

# Update your docker-compose.yml or restart your frontend container
# Example:
docker run -d --name ems-frontend -p 3000:80 sanketsmane/ems-frontend:v4.3
```

### Step 4: Verify the Fix

1. **Test API Connection:**
   ```bash
   curl https://ems.formonex.in/api/health
   ```

2. **Test in Browser Console:**
   ```javascript
   // Open browser dev tools on https://ems.formonex.in
   fetch('https://ems.formonex.in/api/health')
     .then(response => response.json())
     .then(data => console.log('API Working:', data));
   ```

3. **Check Login:**
   - Go to https://ems.formonex.in
   - Try to log in
   - Should work without SSL errors

## 🔧 Docker Images Available

- **Frontend v4.3**: `sanketsmane/ems-frontend:v4.3`
  - ✅ Uses same-domain API URLs
  - ✅ Eliminates mixed content issues
  - ✅ Local avatar images (no external dependencies)
  - ✅ Clean console output

- **Backend**: Your existing backend on `65.0.94.0:8000` (no changes needed)

## 📊 Expected Results

After implementation:
- ✅ No more `ERR_SSL_PROTOCOL_ERROR`
- ✅ No mixed content warnings
- ✅ Login functionality restored
- ✅ WebSocket connections working
- ✅ All API calls successful

## 🚨 Troubleshooting

### If API calls still fail:
```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test backend directly
curl http://65.0.94.0:8000/api/health

# Check proxy is working
curl -I https://ems.formonex.in/api/health
```

### If WebSocket fails:
```bash
# Test WebSocket endpoint
curl -I https://ems.formonex.in/socket.io/

# Check backend WebSocket
curl -I http://65.0.94.0:8000/socket.io/
```

## 🎯 Quick Commands Summary

```bash
# 1. Edit nginx config
sudo nano /etc/nginx/sites-available/ems.formonex.in

# 2. Test and reload
sudo nginx -t && sudo systemctl reload nginx

# 3. Deploy new frontend
docker pull sanketsmane/ems-frontend:v4.3

# 4. Test everything
curl https://ems.formonex.in/api/health
```

## ✅ Deployment Checklist

- [ ] Added API proxy to nginx config
- [ ] Added WebSocket proxy to nginx config  
- [ ] Tested nginx configuration (`nginx -t`)
- [ ] Reloaded nginx service
- [ ] Deployed frontend v4.3
- [ ] Tested API endpoint
- [ ] Verified login functionality
- [ ] Confirmed WebSocket connection

**🎉 Your SSL mixed content issue should now be completely resolved!**