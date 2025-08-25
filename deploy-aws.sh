#!/bin/bash

# AWS ECS Deployment Script for Employee Management System
# Make sure AWS CLI is configured with appropriate permissions

set -e

# Configuration
AWS_REGION="us-east-1"
STACK_NAME="ems-stack"
CLUSTER_NAME="ems-cluster"
SERVICE_NAME="ems-service"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting AWS ECS Deployment for Employee Management System${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}📋 Using AWS Account: ${AWS_ACCOUNT_ID}${NC}"

# Function to check if CloudFormation stack exists
stack_exists() {
    aws cloudformation describe-stacks --stack-name $1 &> /dev/null
}

# Function to wait for stack operation to complete
wait_for_stack() {
    local stack_name=$1
    local operation=$2
    
    echo -e "${YELLOW}⏳ Waiting for stack $operation to complete...${NC}"
    aws cloudformation wait stack-${operation}-complete --stack-name $stack_name
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Stack $operation completed successfully${NC}"
    else
        echo -e "${RED}❌ Stack $operation failed${NC}"
        exit 1
    fi
}

# Create ECR repositories and get login
echo -e "${GREEN}🏗️  Setting up ECR repositories...${NC}"

# Get ECR login token
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repositories if they don't exist
aws ecr describe-repositories --repository-names ems-backend --region $AWS_REGION &> /dev/null || \
aws ecr create-repository --repository-name ems-backend --region $AWS_REGION

aws ecr describe-repositories --repository-names ems-frontend --region $AWS_REGION &> /dev/null || \
aws ecr create-repository --repository-name ems-frontend --region $AWS_REGION

# Build and push Docker images
echo -e "${GREEN}🐳 Building and pushing Docker images...${NC}"

# Build and push backend
echo -e "${YELLOW}📦 Building backend image...${NC}"
cd backend
docker build -t ems-backend .
docker tag ems-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ems-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ems-backend:latest
cd ..

# Build and push frontend
echo -e "${YELLOW}📦 Building frontend image...${NC}"
cd frontend
docker build -t ems-frontend .
docker tag ems-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ems-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ems-frontend:latest
cd ..

echo -e "${GREEN}✅ Docker images pushed successfully${NC}"

# Get default VPC and subnets
echo -e "${GREEN}🔍 Getting VPC and subnet information...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text --region $AWS_REGION)

if [ "$VPC_ID" == "None" ] || [ -z "$SUBNET_IDS" ]; then
    echo -e "${RED}❌ Could not find default VPC or subnets. Please create them manually.${NC}"
    exit 1
fi

echo -e "${GREEN}📋 Using VPC: $VPC_ID${NC}"
echo -e "${GREEN}📋 Using Subnets: $SUBNET_IDS${NC}"

# Prompt for environment variables
echo -e "${YELLOW}🔧 Please provide the following environment variables:${NC}"

read -p "MongoDB Connection String: " MONGODB_URI
read -s -p "JWT Secret: " JWT_SECRET
echo
read -p "Cloudinary Cloud Name: " CLOUDINARY_CLOUD_NAME
read -p "Cloudinary API Key: " CLOUDINARY_API_KEY
read -s -p "Cloudinary API Secret: " CLOUDINARY_API_SECRET
echo
read -p "Email User: " EMAIL_USER
read -s -p "Email Password: " EMAIL_PASS
echo

# Deploy CloudFormation stack
echo -e "${GREEN}☁️  Deploying CloudFormation stack...${NC}"

PARAMETERS="ParameterKey=VpcId,ParameterValue=$VPC_ID"
PARAMETERS="$PARAMETERS ParameterKey=SubnetIds,ParameterValue=\"$(echo $SUBNET_IDS | tr ' ' ',')\""
PARAMETERS="$PARAMETERS ParameterKey=MongoDBConnectionString,ParameterValue=$MONGODB_URI"
PARAMETERS="$PARAMETERS ParameterKey=JWTSecret,ParameterValue=$JWT_SECRET"
PARAMETERS="$PARAMETERS ParameterKey=CloudinaryCloudName,ParameterValue=$CLOUDINARY_CLOUD_NAME"
PARAMETERS="$PARAMETERS ParameterKey=CloudinaryApiKey,ParameterValue=$CLOUDINARY_API_KEY"
PARAMETERS="$PARAMETERS ParameterKey=CloudinaryApiSecret,ParameterValue=$CLOUDINARY_API_SECRET"
PARAMETERS="$PARAMETERS ParameterKey=EmailUser,ParameterValue=$EMAIL_USER"
PARAMETERS="$PARAMETERS ParameterKey=EmailPass,ParameterValue=$EMAIL_PASS"

if stack_exists $STACK_NAME; then
    echo -e "${YELLOW}📋 Stack exists, updating...${NC}"
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://aws-cloudformation.yaml \
        --parameters $PARAMETERS \
        --capabilities CAPABILITY_IAM \
        --region $AWS_REGION
    
    wait_for_stack $STACK_NAME "update"
else
    echo -e "${YELLOW}📋 Creating new stack...${NC}"
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://aws-cloudformation.yaml \
        --parameters $PARAMETERS \
        --capabilities CAPABILITY_IAM \
        --region $AWS_REGION
    
    wait_for_stack $STACK_NAME "create"
fi

# Get the load balancer DNS name
ALB_DNS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text --region $AWS_REGION)

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is available at: http://$ALB_DNS${NC}"
echo -e "${YELLOW}📝 Note: It may take a few minutes for the service to become healthy${NC}"

# Show service status
echo -e "${GREEN}📊 Checking service status...${NC}"
aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}' --output table

echo -e "${GREEN}✅ Deployment script completed!${NC}"
