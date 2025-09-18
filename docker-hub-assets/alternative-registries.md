# Alternative Docker Registries

If Docker Hub connectivity issues persist, consider these alternatives:

## 1. GitHub Container Registry (ghcr.io)
```bash
# Tag images for GitHub Registry
docker tag ems-backend:v4.5 ghcr.io/sanketsmane/ems-backend:v4.5
docker tag ems-frontend:v4.5 ghcr.io/sanketsmane/ems-frontend:v4.5

# Login (requires GitHub token)
echo $GITHUB_TOKEN | docker login ghcr.io -u sanketsmane --password-stdin

# Push
docker push ghcr.io/sanketsmane/ems-backend:v4.5
docker push ghcr.io/sanketsmane/ems-frontend:v4.5
```

## 2. Amazon ECR
```bash
# Get login token (requires AWS CLI)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag ems-backend:v4.5 123456789012.dkr.ecr.us-east-1.amazonaws.com/ems-backend:v4.5
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ems-backend:v4.5
```

## 3. Google Container Registry (gcr.io)
```bash
# Configure gcloud
gcloud auth configure-docker

# Tag and push
docker tag ems-backend:v4.5 gcr.io/your-project-id/ems-backend:v4.5
docker push gcr.io/your-project-id/ems-backend:v4.5
```

## 4. Private Registry
```bash
# Set up local registry
docker run -d -p 5000:5000 --name registry registry:2

# Tag and push
docker tag ems-backend:v4.5 localhost:5000/ems-backend:v4.5
docker push localhost:5000/ems-backend:v4.5
```
