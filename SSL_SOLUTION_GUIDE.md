# 🔒 Mixed Content SSL Solutions Guide

## Problem
Your HTTPS frontend (https://ems.formonex.in) cannot make HTTP API requests to http://65.0.94.0:8000 due to browser mixed content security policy.

## 🎯 **RECOMMENDED SOLUTION** (Easiest & Most Secure)

### Option 1: Same Domain API with Reverse Proxy

This is the **BEST** solution as it:
- ✅ Eliminates mixed content issues
- ✅ Uses existing SSL certificate
- ✅ No additional SSL setup needed
- ✅ Better security and performance

#### Step 1: Update Your Web Server Configuration

Add this to your existing nginx configuration for ems.formonex.in:

```nginx
server {
    listen 443 ssl http2;
    server_name ems.formonex.in;
    
    # Existing SSL configuration...
    
    # API Proxy (ADD THIS)
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
    
    # Frontend (existing)
    location / {
        # Your existing frontend configuration
    }
}
```

#### Step 2: Restart Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 3: Deploy Updated Frontend
```bash
# The frontend is already updated to use https://ems.formonex.in/api
docker pull sanketsmane/ems-frontend:v4.3
# Restart your frontend container
```

## 🚀 **Alternative Solutions**

### Option 2: Dedicated API Subdomain with SSL

1. **Setup DNS**: Point `api.formonex.in` to your server IP
2. **Run SSL Setup Script**: 
   ```bash
   chmod +x setup-ssl-backend.sh
   sudo ./setup-ssl-backend.sh
   ```
3. **Update Frontend**: Already configured for `https://api.formonex.in/api`

### Option 3: Docker with SSL Proxy

Use the provided `docker-compose.ssl.yml`:

```bash
# 1. Get SSL certificates for your domain
# 2. Place them in ./ssl-certs/ directory
# 3. Deploy with SSL proxy
docker-compose -f docker-compose.ssl.yml up -d
```

## ⚡ **Quick Fix (Temporary)**

If you need immediate access while setting up SSL:

### Browser Settings (Development Only)
1. **Chrome**: Launch with `--disable-web-security --user-data-dir="/tmp/chrome_dev"`
2. **Firefox**: Set `security.mixed_content.block_active_content` to `false` in about:config

⚠️ **Warning**: This disables browser security. Only use for testing!

## 🔧 **Testing Your Solution**

After implementing any solution, test with:

```bash
# Test API endpoint
curl -k https://ems.formonex.in/api/auth/me

# Test from browser console
fetch('https://ems.formonex.in/api/auth/me')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 📋 **Implementation Checklist**

- [ ] Choose your preferred solution
- [ ] Update web server configuration (Option 1 - Recommended)
- [ ] Test API endpoints
- [ ] Deploy updated frontend
- [ ] Verify login functionality
- [ ] Test all features

## 🎯 **Expected Results**

After implementation:
- ✅ No more mixed content errors
- ✅ Secure HTTPS communication
- ✅ All API calls working
- ✅ Login and authentication functional
- ✅ Better SEO and security scores

## 📞 **Need Help?**

If you encounter issues:
1. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
2. Verify SSL certificates: `curl -I https://ems.formonex.in`
3. Test API directly: `curl https://ems.formonex.in/api/health`

**Recommended Action**: Implement Option 1 (Same Domain API) as it's the quickest and most reliable solution!