# Production Nginx Configuration Guide for EMS

## 🎯 Production-Ready Configuration Package

I've created a comprehensive nginx configuration optimized for production deployment with enterprise-grade security, performance, and monitoring.

### 📁 Configuration Files

1. **`nginx-production-config.conf`** - Main site configuration
2. **`nginx-global-config.conf`** - Global nginx settings
3. **`nginx-proxy-params.conf`** - Proxy parameters
4. **`deploy-production-nginx.sh`** - Automated deployment script

### 🔒 Security Features

- **SSL/TLS Security**: Modern cipher suites, HSTS, OCSP stapling
- **Security Headers**: CSP, XSS protection, content-type validation
- **Rate Limiting**: Tiered rate limits for different endpoints
- **IP Restrictions**: Admin panel IP filtering
- **Attack Prevention**: Block common exploit attempts
- **Request Validation**: Size limits, timeout controls

### ⚡ Performance Optimizations

- **Compression**: Gzip + Brotli support
- **Caching**: Static asset caching, proxy caching
- **Connection Optimization**: Keep-alive, connection pooling
- **Load Balancing**: Upstream configuration for multiple backends
- **Buffer Optimization**: Tuned buffer sizes for different content types

### 📊 Monitoring & Logging

- **Detailed Logging**: Separate logs for access, errors, admin actions
- **Health Checks**: Automated backend health monitoring
- **Performance Metrics**: Request timing, upstream response times
- **Security Audit**: Failed login attempts, blocked requests

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Run the automated deployment script
sudo ./deploy-production-nginx.sh
```

This script will:
- ✅ Install/update nginx
- ✅ Backup existing configurations
- ✅ Deploy all configuration files
- ✅ Create required directories
- ✅ Set proper permissions
- ✅ Test configuration
- ✅ Deploy frontend
- ✅ Run connectivity tests

### Option 2: Manual Deployment

```bash
# 1. Backup existing config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 2. Deploy configurations
sudo cp nginx-global-config.conf /etc/nginx/nginx.conf
sudo cp nginx-proxy-params.conf /etc/nginx/proxy_params
sudo cp nginx-production-config.conf /etc/nginx/sites-available/ems.formonex.in

# 3. Enable site
sudo ln -sf /etc/nginx/sites-available/ems.formonex.in /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Create directories
sudo mkdir -p /var/www/ems-frontend /var/cache/nginx/proxy
sudo chown -R www-data:www-data /var/www/ems-frontend /var/cache/nginx

# 5. Deploy frontend
docker run --rm -v /var/www/ems-frontend:/output \
  sanketsmane/ems-frontend:v4.3 sh -c "cp -r /usr/share/nginx/html/* /output/"

# 6. Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Configuration Highlights

### Rate Limiting Strategy
```nginx
# Login endpoints: 5 requests/minute
location /api/auth/ {
    limit_req zone=login_limit burst=10 nodelay;
}

# API endpoints: 30 requests/minute  
location /api/ {
    limit_req zone=api_limit burst=100 nodelay;
}

# General requests: 100 requests/minute
location / {
    limit_req zone=general_limit burst=50 nodelay;
}
```

### Security Headers
```nginx
# HSTS with preload
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'..." always;

# Additional security
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```

### Performance Caching
```nginx
# Static assets: 1 year cache
location ~* \.(js|css|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Images: 6 months cache
location ~* \.(png|jpg|jpeg|gif|ico|svg|webp)$ {
    expires 6M;
    add_header Cache-Control "public, immutable";
}

# HTML: 1 hour cache
location ~* \.(html|htm)$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
```

## 🧪 Testing Your Deployment

After deployment, run these tests:

```bash
# 1. Test nginx configuration
sudo nginx -t

# 2. Test frontend
curl -I https://ems.formonex.in

# 3. Test API proxy
curl https://ems.formonex.in/health

# 4. Test SSL configuration
curl -I https://ems.formonex.in

# 5. Test rate limiting
for i in {1..10}; do curl https://ems.formonex.in/api/auth/me; done

# 6. Test WebSocket
curl -I https://ems.formonex.in/socket.io/

# 7. Test security headers
curl -I https://ems.formonex.in | grep -i security
```

## 📈 Monitoring Commands

```bash
# View real-time access logs
sudo tail -f /var/log/nginx/ems-access.log

# View error logs
sudo tail -f /var/log/nginx/ems-error.log

# View admin actions
sudo tail -f /var/log/nginx/ems-admin-access.log

# Check nginx status
sudo systemctl status nginx

# Monitor connections
sudo netstat -tuln | grep :443

# Check SSL certificate expiry
echo | openssl s_client -servername ems.formonex.in -connect ems.formonex.in:443 2>/dev/null | openssl x509 -noout -dates
```

## 🔧 Customization Options

### Backend Server Changes
Update the upstream block in `nginx-production-config.conf`:
```nginx
upstream ems_backend {
    server 65.0.94.0:8000 max_fails=3 fail_timeout=30s weight=1;
    server 65.0.94.1:8000 max_fails=3 fail_timeout=30s weight=1 backup;
}
```

### SSL Certificate Paths
Update SSL paths if using different certificate location:
```nginx
ssl_certificate /path/to/your/certificate.pem;
ssl_certificate_key /path/to/your/private.key;
```

### Rate Limit Adjustments
Modify rate limits in `nginx-global-config.conf`:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=50r/m;  # Increase API rate
```

## 🚨 Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   ```bash
   # Check backend connectivity
   curl http://65.0.94.0:8000/health
   
   # Check nginx error logs
   sudo tail -f /var/log/nginx/ems-error.log
   ```

2. **SSL Certificate Issues**
   ```bash
   # Verify certificate
   sudo certbot certificates
   
   # Renew if needed
   sudo certbot renew
   ```

3. **Permission Errors**
   ```bash
   # Fix web root permissions
   sudo chown -R www-data:www-data /var/www/ems-frontend
   sudo chmod -R 755 /var/www/ems-frontend
   ```

4. **Rate Limiting Too Strict**
   ```bash
   # Temporarily disable rate limiting
   # Comment out limit_req lines and reload
   sudo nginx -s reload
   ```

## 🎉 Expected Results

After successful deployment:

- ✅ **A+ SSL Rating**: Modern TLS configuration
- ✅ **High Performance**: Optimized caching and compression
- ✅ **Security Hardened**: Protection against common attacks
- ✅ **Monitoring Ready**: Detailed logging and metrics
- ✅ **Scalable**: Load balancing and connection optimization
- ✅ **No SSL Errors**: All mixed content issues resolved

## 📞 Support

If you encounter issues:

1. Check the deployment log output
2. Review nginx error logs
3. Verify backend connectivity
4. Test SSL certificate validity
5. Monitor system resources

**Your production nginx configuration is now enterprise-ready! 🚀**