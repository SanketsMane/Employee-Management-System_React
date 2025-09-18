# Nginx Configuration Installation and Setup Guide

## 📋 Available Configurations

1. **nginx-frontend-config.conf** - Complete frontend config with backend proxy
2. **nginx-backend-config.conf** - Backend-only nginx configuration  
3. **nginx-docker-config.conf** - Docker-based deployment configuration

## 🚀 Installation Instructions

### Option 1: Complete Frontend + Backend Proxy (Recommended)

This setup serves your frontend and proxies API calls to the backend.

```bash
# 1. Copy the frontend configuration
sudo cp nginx-frontend-config.conf /etc/nginx/sites-available/ems.formonex.in

# 2. Enable the site
sudo ln -s /etc/nginx/sites-available/ems.formonex.in /etc/nginx/sites-enabled/

# 3. Create web directory
sudo mkdir -p /var/www/ems-frontend

# 4. Deploy your frontend build
# If using Docker:
docker run -d --name ems-frontend -v /var/www/ems-frontend:/usr/share/nginx/html sanketsmane/ems-frontend:v4.3

# Or copy build files directly:
# sudo cp -r /path/to/your/build/* /var/www/ems-frontend/

# 5. Set permissions
sudo chown -R www-data:www-data /var/www/ems-frontend
sudo chmod -R 755 /var/www/ems-frontend

# 6. Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2: Docker-based Setup

If you're running everything in Docker containers:

```bash
# 1. Copy the Docker configuration
sudo cp nginx-docker-config.conf /etc/nginx/sites-available/ems-docker.conf

# 2. Enable the site
sudo ln -s /etc/nginx/sites-available/ems-docker.conf /etc/nginx/sites-enabled/

# 3. Start your frontend container
docker run -d --name ems-frontend -p 3000:80 sanketsmane/ems-frontend:v4.3

# 4. Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Option 3: Backend-only Configuration

If you want nginx in front of your backend server:

```bash
# 1. Copy to backend server (65.0.94.0)
scp nginx-backend-config.conf user@65.0.94.0:/tmp/

# 2. On backend server:
sudo cp /tmp/nginx-backend-config.conf /etc/nginx/sites-available/backend.conf
sudo ln -s /etc/nginx/sites-available/backend.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Configuration Customization

### SSL Certificates

Update these paths in the config files:
```nginx
ssl_certificate /etc/letsencrypt/live/ems.formonex.in/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/ems.formonex.in/privkey.pem;
```

### Backend Server IP

If your backend IP changes, update this line:
```nginx
proxy_pass http://65.0.94.0:8000/api/;
```

### Upload Size Limits

For larger file uploads, adjust:
```nginx
client_max_body_size 100M;
```

## 🧪 Testing Your Setup

### 1. Test Nginx Configuration
```bash
sudo nginx -t
```

### 2. Test Frontend
```bash
curl -I https://ems.formonex.in
```

### 3. Test API Proxy
```bash
curl https://ems.formonex.in/health
curl https://ems.formonex.in/api/auth/me
```

### 4. Test WebSocket
```bash
curl -I https://ems.formonex.in/socket.io/
```

## 🔍 Troubleshooting

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/ems-frontend-access.log
sudo tail -f /var/log/nginx/ems-frontend-error.log
```

### Common Issues

1. **502 Bad Gateway**: Backend server is down
   ```bash
   curl http://65.0.94.0:8000/health
   ```

2. **SSL Certificate Issues**: Check certificate paths
   ```bash
   sudo certbot certificates
   ```

3. **Permission Errors**: Check file permissions
   ```bash
   sudo chown -R www-data:www-data /var/www/ems-frontend
   ```

4. **CORS Errors**: Check API proxy configuration

## 📊 Expected Results

After proper setup:
- ✅ Frontend loads at `https://ems.formonex.in`
- ✅ API calls work at `https://ems.formonex.in/api/*`
- ✅ WebSocket connects at `wss://ems.formonex.in`
- ✅ No SSL or mixed content errors
- ✅ Health check works at `https://ems.formonex.in/health`

## 🎯 Quick Setup Commands

For the most common setup (frontend + backend proxy):

```bash
# Quick deployment script
sudo cp nginx-frontend-config.conf /etc/nginx/sites-available/ems.formonex.in
sudo ln -sf /etc/nginx/sites-available/ems.formonex.in /etc/nginx/sites-enabled/
sudo mkdir -p /var/www/ems-frontend
docker run -d --name ems-frontend -v /var/www/ems-frontend:/usr/share/nginx/html sanketsmane/ems-frontend:v4.3
sudo chown -R www-data:www-data /var/www/ems-frontend
sudo nginx -t && sudo systemctl reload nginx

# Test the setup
curl -I https://ems.formonex.in
curl https://ems.formonex.in/health
```

🎉 **Your nginx configuration is now ready for production deployment!**