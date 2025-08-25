# AWS ECS Deployment Checklist

## Pre-Deployment Requirements ✅

### 1. AWS Account Setup
- [ ] AWS account with billing enabled
- [ ] IAM user with appropriate permissions:
  - [ ] ECS Full Access
  - [ ] ECR Full Access
  - [ ] CloudFormation Full Access
  - [ ] VPC Access
  - [ ] IAM Role creation permissions
  - [ ] CloudWatch Logs access
- [ ] AWS CLI installed and configured locally
- [ ] Docker installed locally

### 2. External Services Setup
- [ ] **MongoDB Atlas** account created
  - [ ] Cluster created and running
  - [ ] Database user created
  - [ ] Network access configured (0.0.0.0/0 for AWS or specific IPs)
  - [ ] Connection string ready
- [ ] **Cloudinary** account setup
  - [ ] Cloud name noted
  - [ ] API key and secret ready
- [ ] **Email Service** configured
  - [ ] Gmail account with app password OR
  - [ ] SendGrid/other email service credentials

### 3. Environment Variables Prepared
- [ ] MongoDB connection string
- [ ] JWT secret (long, random string)
- [ ] Cloudinary credentials
- [ ] Email credentials
- [ ] All sensitive data secured

## Deployment Steps ✅

### Phase 1: Initial Setup
- [ ] Clone repository locally
- [ ] Review and update environment variables
- [ ] Test application locally with Docker Compose
- [ ] Verify all external services are accessible

### Phase 2: AWS Infrastructure
- [ ] Run deployment script: `./deploy-aws.sh`
- [ ] Verify ECR repositories created
- [ ] Confirm Docker images pushed successfully
- [ ] Check CloudFormation stack status
- [ ] Verify ECS cluster and service created

### Phase 3: Application Verification
- [ ] Access application via load balancer URL
- [ ] Test user registration/login
- [ ] Verify database connectivity
- [ ] Test file upload functionality
- [ ] Check email notifications working
- [ ] Verify real-time features (WebSocket)

### Phase 4: Monitoring Setup
- [ ] CloudWatch logs configured
- [ ] Application health check responding
- [ ] Monitor resource usage
- [ ] Set up alerts for failures

## Post-Deployment Configuration ✅

### 1. Domain and SSL (Optional but Recommended)
- [ ] Purchase domain name
- [ ] Create Route 53 hosted zone
- [ ] Request SSL certificate via ACM
- [ ] Update load balancer to use HTTPS
- [ ] Configure domain to point to load balancer

### 2. Security Hardening
- [ ] Review security groups (minimal access)
- [ ] Enable VPC Flow Logs
- [ ] Set up AWS WAF (if needed)
- [ ] Review IAM permissions (principle of least privilege)
- [ ] Enable GuardDuty for threat detection

### 3. Performance Optimization
- [ ] Monitor application performance
- [ ] Optimize container resource allocation
- [ ] Set up auto-scaling policies
- [ ] Configure CloudFront CDN (if needed)

### 4. Backup and Disaster Recovery
- [ ] MongoDB backup strategy
- [ ] ECS task definition backup
- [ ] Application code backup (GitHub)
- [ ] Recovery procedures documented

## Troubleshooting Checklist ✅

### Common Issues and Solutions

#### Application Won't Start
- [ ] Check CloudWatch logs: `/ecs/ems-app`
- [ ] Verify environment variables in task definition
- [ ] Confirm MongoDB connectivity
- [ ] Check security group rules

#### 502 Bad Gateway Error
- [ ] Verify backend container is healthy
- [ ] Check target group health
- [ ] Review load balancer configuration
- [ ] Confirm port mappings

#### Database Connection Issues
- [ ] Verify MongoDB Atlas IP whitelist
- [ ] Check connection string format
- [ ] Test connection from local environment
- [ ] Verify database user permissions

#### File Upload Not Working
- [ ] Confirm Cloudinary credentials
- [ ] Check CORS configuration
- [ ] Verify file size limits
- [ ] Review upload endpoint logs

#### Email Notifications Failing
- [ ] Verify email service credentials
- [ ] Check Gmail app password (if using Gmail)
- [ ] Review email service logs
- [ ] Test email configuration locally

## Monitoring and Maintenance ✅

### Daily Checks
- [ ] Application accessibility
- [ ] Error rates in CloudWatch
- [ ] Resource utilization
- [ ] Database performance

### Weekly Reviews
- [ ] Cost analysis
- [ ] Security updates needed
- [ ] Performance metrics review
- [ ] Backup verification

### Monthly Tasks
- [ ] Update dependencies
- [ ] Review and optimize costs
- [ ] Security audit
- [ ] Disaster recovery test

## Scaling Considerations ✅

### Vertical Scaling (Resource Adjustment)
- [ ] Monitor CPU/Memory usage
- [ ] Adjust task definition resources as needed
- [ ] Update service with new task definition

### Horizontal Scaling (More Instances)
- [ ] Set up Application Auto Scaling
- [ ] Configure target tracking scaling policies
- [ ] Test scaling behavior under load

## Cost Optimization ✅

### Regular Cost Reviews
- [ ] Monitor AWS billing dashboard
- [ ] Review Fargate pricing vs EC2
- [ ] Optimize resource allocation
- [ ] Consider Reserved Capacity for production

### Cost-Saving Measures
- [ ] Use Fargate Spot for development
- [ ] Right-size containers
- [ ] Implement auto-scaling
- [ ] Clean up unused resources

## Security Best Practices ✅

### Application Security
- [ ] Regular dependency updates
- [ ] Environment variable security
- [ ] Input validation and sanitization
- [ ] Rate limiting configured

### Infrastructure Security
- [ ] VPC security groups minimal access
- [ ] IAM roles principle of least privilege
- [ ] CloudTrail logging enabled
- [ ] Regular security assessments

## Backup Strategy ✅

### Critical Data Backup
- [ ] MongoDB regular backups (Atlas automatic)
- [ ] Application configuration backup
- [ ] Environment variables securely stored
- [ ] Docker images in ECR

### Recovery Procedures
- [ ] Document rollback procedures
- [ ] Test disaster recovery
- [ ] Maintain recovery time objectives
- [ ] Regular backup restoration tests

---

## Emergency Contacts and Resources

### Important Commands
```bash
# Check service status
aws ecs describe-services --cluster ems-cluster --services ems-service

# View logs
aws logs tail /ecs/ems-app --follow

# Force deployment
aws ecs update-service --cluster ems-cluster --service ems-service --force-new-deployment

# Stop service (emergency)
aws ecs update-service --cluster ems-cluster --service ems-service --desired-count 0
```

### Support Resources
- AWS Support (if subscribed)
- MongoDB Atlas Support
- Cloudinary Support
- GitHub Issues for application bugs

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Version**: ___________
**Load Balancer URL**: ___________
