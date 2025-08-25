# AWS ECS Deployment Guide for Employee Management System

This guide will help you deploy the Employee Management System to AWS using ECS (Elastic Container Service) with Fargate.

## Prerequisites

Before starting the deployment, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Docker** installed on your local machine
4. **MongoDB Atlas** account (recommended) or MongoDB instance
5. **Cloudinary** account for file uploads
6. **Email service** (Gmail with app password recommended)

## Quick Deployment

### 1. Install AWS CLI

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
# Download and install from https://aws.amazon.com/cli/
```

### 2. Configure AWS CLI

```bash
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

### 3. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 4. Run Deployment Script

```bash
./deploy-aws.sh
```

The script will:
- Create ECR repositories
- Build and push Docker images
- Deploy CloudFormation stack
- Set up ECS cluster, service, and load balancer
- Provide you with the application URL

## Manual Deployment Steps

If you prefer manual deployment or need to troubleshoot:

### 1. Create ECR Repositories

```bash
aws ecr create-repository --repository-name ems-backend --region us-east-1
aws ecr create-repository --repository-name ems-frontend --region us-east-1
```

### 2. Build and Push Docker Images

```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t ems-backend .
docker tag ems-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ems-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ems-backend:latest

# Build and push frontend
cd ../frontend
docker build -t ems-frontend .
docker tag ems-frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ems-frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ems-frontend:latest
```

### 3. Deploy CloudFormation Stack

```bash
aws cloudformation create-stack \
  --stack-name ems-stack \
  --template-body file://aws-cloudformation.yaml \
  --parameters ParameterKey=VpcId,ParameterValue=YOUR_VPC_ID \
               ParameterKey=SubnetIds,ParameterValue="subnet-1,subnet-2" \
               ParameterKey=MongoDBConnectionString,ParameterValue="YOUR_MONGODB_URI" \
               ParameterKey=JWTSecret,ParameterValue="YOUR_JWT_SECRET" \
               ParameterKey=CloudinaryCloudName,ParameterValue="YOUR_CLOUDINARY_NAME" \
               ParameterKey=CloudinaryApiKey,ParameterValue="YOUR_CLOUDINARY_KEY" \
               ParameterKey=CloudinaryApiSecret,ParameterValue="YOUR_CLOUDINARY_SECRET" \
               ParameterKey=EmailUser,ParameterValue="YOUR_EMAIL" \
               ParameterKey=EmailPass,ParameterValue="YOUR_EMAIL_PASSWORD" \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

## Architecture Overview

The deployment creates:

- **ECS Cluster**: Fargate cluster to run containers
- **Application Load Balancer**: Routes traffic to containers
- **ECR Repositories**: Store Docker images
- **CloudWatch Logs**: Centralized logging
- **Security Groups**: Network access control
- **IAM Roles**: Permissions for ECS tasks

## Environment Variables Required

### Backend Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `EMAIL_USER`: Email for notifications
- `EMAIL_PASS`: Email password/app password
- `NODE_ENV`: Set to "production"
- `PORT`: Set to "5000"

## GitHub Actions CI/CD

The repository includes a GitHub Actions workflow for automated deployments.

### Setup GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to repository Settings > Secrets and variables > Actions
2. Add these secrets:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

The workflow will automatically:
- Run tests on pull requests
- Build and deploy on push to main branch
- Update ECS service with new images

## Monitoring and Logs

### View Application Logs

```bash
# View all logs
aws logs tail /ecs/ems-app --follow

# View specific container logs
aws logs tail /ecs/ems-app --follow --filter-pattern "backend"
aws logs tail /ecs/ems-app --follow --filter-pattern "frontend"
```

### Check Service Status

```bash
aws ecs describe-services --cluster ems-cluster --services ems-service
```

### Check Task Health

```bash
aws ecs list-tasks --cluster ems-cluster --service-name ems-service
aws ecs describe-tasks --cluster ems-cluster --tasks TASK_ARN
```

## Scaling

### Manual Scaling

```bash
aws ecs update-service --cluster ems-cluster --service ems-service --desired-count 3
```

### Auto Scaling (Optional)

You can set up auto scaling based on CPU/memory usage by adding auto scaling configuration to the CloudFormation template.

## Cost Optimization

- **Fargate Spot**: Consider using Fargate Spot for cost savings
- **Right-sizing**: Monitor resource usage and adjust CPU/memory allocation
- **Reserved Capacity**: For production workloads, consider reserved capacity
- **Image Optimization**: Optimize Docker images to reduce size

## Troubleshooting

### Common Issues

1. **Service won't start**
   - Check CloudWatch logs for errors
   - Verify environment variables
   - Ensure MongoDB connection is accessible

2. **502 Bad Gateway**
   - Check if backend is healthy
   - Verify security group rules
   - Check load balancer target health

3. **Images won't push to ECR**
   - Verify AWS credentials
   - Check ECR repository exists
   - Ensure proper authentication

### Useful Commands

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name ems-stack

# Update service with new task definition
aws ecs update-service --cluster ems-cluster --service ems-service --force-new-deployment

# Stop all tasks (for troubleshooting)
aws ecs update-service --cluster ems-cluster --service ems-service --desired-count 0

# Restart service
aws ecs update-service --cluster ems-cluster --service ems-service --desired-count 1
```

## Security Best Practices

1. **Environment Variables**: Use AWS Secrets Manager for sensitive data
2. **VPC**: Deploy in private subnets with NAT Gateway for production
3. **SSL/TLS**: Add SSL certificate to load balancer
4. **WAF**: Consider AWS WAF for web application protection
5. **Network ACLs**: Implement network-level security

## Production Considerations

1. **Database**: Use MongoDB Atlas with proper backup configuration
2. **CDN**: Add CloudFront for static assets
3. **Monitoring**: Set up CloudWatch alarms and dashboards
4. **Backup**: Implement automated backup strategies
5. **SSL Certificate**: Use ACM for HTTPS

## Support

If you encounter issues:

1. Check CloudWatch logs first
2. Verify all environment variables are set correctly
3. Ensure external services (MongoDB, Cloudinary) are accessible
4. Check AWS service limits and quotas

For additional support, create an issue in the GitHub repository.
