# 🚀 Deployment Guide

## Quick Deploy Checklist

### ✅ Prerequisites
- [ ] AWS Account with EC2 access
- [ ] Hostinger hosting account  
- [ ] Domain name configured
- [ ] MongoDB Atlas database
- [ ] Gmail app password for emails

### 📱 Frontend Deployment (Hostinger)

1. **Build the project:**
   ```bash
   npm run build:prod
   ```

2. **Upload to Hostinger:**
   - Go to Hostinger File Manager
   - Navigate to `public_html` or your domain folder
   - Upload all files from `frontend/dist/` folder
   - Ensure `index.html` is in the root

3. **Update API URL:**
   - Before building, update `frontend/.env.production`
   - Set `VITE_API_BASE_URL=https://your-aws-backend-domain.com/api`

### 🖥️ Backend Deployment (AWS EC2)

1. **Launch EC2 Instance:**
   - Choose Ubuntu 22.04 LTS
   - Instance type: t3.micro or higher
   - Security groups: HTTP(80), HTTPS(443), SSH(22)

2. **Setup Server:**
   ```bash
   # Connect to EC2
   ssh -i your-key.pem ubuntu@your-ec2-ip
   
   # Run setup script
   curl -sSL https://raw.githubusercontent.com/your-repo/setup.sh | bash
   ```

3. **Deploy Application:**
   ```bash
   git clone your-repo-url
   cd Ems_Formonex/backend
   npm install --production
   cp .env.production .env
   
   # Edit environment variables
   nano .env
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/ems-backend
   sudo ln -s /etc/nginx/sites-available/ems-backend /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

5. **Setup SSL:**
   ```bash
   sudo certbot --nginx -d your-backend-domain.com
   ```

## 🔧 Environment Variables

### Frontend (.env.production)
```
VITE_API_BASE_URL=https://your-aws-backend-domain.com/api
```

### Backend (.env.production)
```
NODE_ENV=production
FRONTEND_URL=https://your-hostinger-domain.com
MONGODB_URI=your-mongodb-atlas-connection
JWT_SECRET=your-super-strong-secret-key
EMAIL_USER=contactformonex1@gmail.com
EMAIL_PASS=ljyv ntat krdx atmy
```

## 🌐 Domain Configuration

### Hostinger Domain
- Point A record to Hostinger server IP
- Enable SSL in Hostinger control panel

### AWS Domain  
- Point A record to EC2 elastic IP
- Configure Route 53 if using AWS domains

## 📊 Post-Deployment

### ✅ Testing Checklist
- [ ] Frontend loads correctly
- [ ] Login functionality works
- [ ] API calls successful (check browser network tab)
- [ ] File uploads working (Cloudinary)
- [ ] Email notifications sending
- [ ] SMS notifications working
- [ ] Real-time features (WebSocket)

### 🔍 Monitoring
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs ems-backend`
- Monitor resources: `htop`
- Check Nginx: `sudo systemctl status nginx`

### 🛠️ Troubleshooting

**CORS Issues:**
- Verify FRONTEND_URL in backend .env
- Check Nginx CORS headers
- Ensure domains match exactly

**Database Connection:**
- Verify MongoDB Atlas IP whitelist
- Check connection string
- Test with MongoDB Compass

**Email/SMS Not Working:**
- Verify Gmail app password
- Check EMAIL_ENABLED=true
- Review email logs in backend

**File Upload Issues:**
- Verify Cloudinary credentials
- Check upload size limits
- Review file type restrictions

## 📈 Scaling & Optimization

### Performance
- Enable Nginx gzip compression
- Use CloudFront for static assets
- Implement Redis for session storage

### Security
- Regular security updates
- Use AWS WAF for protection
- Implement API rate limiting
- Regular backup strategy

## 🆘 Support

For deployment issues:
1. Check logs: `pm2 logs`
2. Review AWS CloudWatch
3. Check Nginx error logs
4. Monitor database connections

Contact: contactsanket1@gmail.com
