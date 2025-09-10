# 🚀 Production Deployment Checklist

## Prerequisites
- [ ] AWS EC2 instance running (43.205.116.48)
- [ ] Hostinger hosting account with domain (ems.formonex.in)
- [ ] MongoDB Atlas connection working
- [ ] Gmail SMTP credentials working

## Backend Deployment (AWS EC2)

### 1. Connect to EC2 Instance
```bash
ssh -i your-key.pem ec2-user@43.205.116.48
```

### 2. Run Backend Deployment Script
```bash
# Upload and run the deployment script
chmod +x deploy-backend-aws.sh
./deploy-backend-aws.sh
```

### 3. Verify Backend is Running
- [ ] Check PM2 status: `pm2 status`
- [ ] Check logs: `pm2 logs`
- [ ] Test API: `curl http://43.205.116.48:8000/api/test/health`
- [ ] Test with frontend URL: `curl -H "Origin: https://ems.formonex.in" http://43.205.116.48:8000/api/test/health`

### 4. Configure Security Groups (AWS Console)
- [ ] Allow inbound traffic on port 8000 (HTTP)
- [ ] Allow inbound traffic on port 80 (HTTP)
- [ ] Allow inbound traffic on port 443 (HTTPS)
- [ ] Allow inbound traffic on port 22 (SSH)

## Frontend Deployment (Hostinger)

### 1. Build Frontend Locally
```bash
# Run the build script
chmod +x deploy-frontend-hostinger.sh
./deploy-frontend-hostinger.sh
```

### 2. Upload to Hostinger
- [ ] Compress `frontend/dist/` folder
- [ ] Login to Hostinger File Manager
- [ ] Navigate to `public_html` for ems.formonex.in
- [ ] Upload and extract the ZIP file
- [ ] Ensure all files are in the root directory

### 3. Configure Hostinger
- [ ] Set up HTTPS/SSL certificate
- [ ] Configure SPA redirects (if supported)
- [ ] Set up custom error pages

## Post-Deployment Testing

### 1. Backend Testing
- [ ] API Health: http://43.205.116.48:8000/api/test/health
- [ ] CORS: Test from https://ems.formonex.in
- [ ] Authentication: Test login/register
- [ ] Database: Test CRUD operations
- [ ] Email: Test email notifications
- [ ] WebSocket: Test real-time features

### 2. Frontend Testing
- [ ] Website loads: https://ems.formonex.in
- [ ] Login/Register works
- [ ] All pages accessible
- [ ] API calls work
- [ ] Real-time features work
- [ ] Responsive design on mobile

### 3. Integration Testing
- [ ] Complete user registration flow
- [ ] Admin panel functionality
- [ ] Attendance management
- [ ] Leave management
- [ ] Company settings update
- [ ] Email notifications

## Production Monitoring

### 1. Backend Monitoring
```bash
# Check server status
pm2 status
pm2 monit

# Check logs
pm2 logs --lines 100

# Check system resources
htop
df -h
```

### 2. Error Monitoring
- [ ] Set up log rotation
- [ ] Monitor error logs
- [ ] Set up alerts for downtime

## Security Checklist
- [ ] Change default admin credentials
- [ ] Use strong JWT secret
- [ ] Enable HTTPS on frontend
- [ ] Configure proper CORS
- [ ] Set up rate limiting
- [ ] Regular security updates

## Environment Variables (Production)

### Backend (.env.production)
```
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://ems.formonex.in
JWT_SECRET=strong_production_secret
EMAIL_USER=formonexsolutions@gmail.com
COMPANY_NAME=Formonex
```

### Frontend (.env.production)
```
VITE_API_BASE_URL=http://43.205.116.48:8000/api
VITE_APP_NAME=Formonex EMS
VITE_ENVIRONMENT=production
```

## Backup Strategy
- [ ] MongoDB Atlas automatic backups enabled
- [ ] Code repository up to date
- [ ] Environment variables backed up securely
- [ ] SSL certificates backed up

## Rollback Plan
- [ ] Keep previous version tagged in Git
- [ ] Document rollback procedure
- [ ] Test rollback procedure

## Support Information
- **Backend URL**: http://43.205.116.48:8000
- **Frontend URL**: https://ems.formonex.in
- **Database**: MongoDB Atlas
- **Email**: Gmail SMTP
- **Monitoring**: PM2

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Check allowed origins in server.js
2. **API Connection**: Verify EC2 security groups
3. **Email Not Working**: Check Gmail app passwords
4. **Database Connection**: Verify MongoDB Atlas whitelist
5. **Frontend 404s**: Check Hostinger SPA configuration
