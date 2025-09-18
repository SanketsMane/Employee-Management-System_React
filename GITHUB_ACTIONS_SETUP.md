# GitHub Actions Docker Hub Setup Guide

## 🔧 Configure Docker Hub Secrets

To enable automatic Docker image building and pushing, you need to configure Docker Hub credentials as GitHub secrets.

### Step 1: Get Docker Hub Access Token

1. **Login to Docker Hub**: https://hub.docker.com/
2. **Go to Account Settings**: Click your username → Account Settings
3. **Security Tab**: Click on "Security" in the left sidebar
4. **Create Access Token**:
   - Click "New Access Token"
   - Name: `GitHub Actions EMS`
   - Permissions: `Read, Write, Delete`
   - Click "Generate"
   - **Copy the token immediately** (you won't see it again)

### Step 2: Add Secrets to GitHub Repository

1. **Go to Repository**: https://github.com/SanketsMane/Employee-Management-System_React
2. **Settings Tab**: Click "Settings" in the repository menu
3. **Secrets and Variables**: 
   - Click "Secrets and variables" in left sidebar
   - Click "Actions"
4. **Add Repository Secrets**:

   **Secret 1**: 
   - Name: `DOCKERHUB_USERNAME`
   - Value: `sanketsmane` (your Docker Hub username)

   **Secret 2**:
   - Name: `DOCKERHUB_TOKEN`
   - Value: `[paste the access token from Step 1]`

### Step 3: Verify Workflow File

The workflow file has been created at `.github/workflows/docker-build.yml` with these features:

✅ **Automatic Triggers**:
- Pushes to main branch
- Changes to backend/ or frontend/ directories
- Manual workflow dispatch

✅ **Multi-Platform Builds**:
- Linux AMD64 (Intel/AMD)
- Linux ARM64 (Apple Silicon, ARM servers)

✅ **Multiple Tags**:
- `v4.5` (version tag)
- `latest` (latest release)
- `main` (branch tag)
- `main-[commit-sha]` (commit-specific tag)

✅ **Optimizations**:
- Docker layer caching
- Parallel builds
- Metadata extraction

## 🚀 How to Trigger the Build

### Method 1: Automatic (Recommended)
```bash
# Any push to main branch will trigger the build
git push origin main
```

### Method 2: Manual Trigger
1. Go to: https://github.com/SanketsMane/Employee-Management-System_React/actions
2. Click "Build and Push Docker Images v4.5"
3. Click "Run workflow"
4. Select branch: `main`
5. Click "Run workflow"

## 📊 Expected Results

After successful execution, you'll have:

### Docker Hub Images
- **Backend**: `sanketsmane/ems-backend:v4.5`
- **Frontend**: `sanketsmane/ems-frontend:v4.5`
- **Both with**: `latest`, `main`, and commit-specific tags

### GitHub Actions Artifacts
- Deployment summary with links and instructions
- Build logs and diagnostics
- Multi-platform image manifests

## 🔍 Monitoring the Build

1. **GitHub Actions**: https://github.com/SanketsMane/Employee-Management-System_React/actions
2. **Build Logs**: Click on the running workflow to see real-time logs
3. **Docker Hub**: Check https://hub.docker.com/u/sanketsmane for new images

## ⚡ Quick Setup Commands

```bash
# 1. Commit and push the workflow
git add .github/
git commit -m "feat: Add GitHub Actions Docker build workflow"
git push origin main

# 2. Configure secrets (manual step in GitHub web interface)
# - DOCKERHUB_USERNAME: sanketsmane
# - DOCKERHUB_TOKEN: [your-access-token]

# 3. Trigger workflow (automatic on push or manual)
```

## 🐛 Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Verify DOCKERHUB_USERNAME and DOCKERHUB_TOKEN secrets
   - Ensure token has Read, Write, Delete permissions

2. **Build Failed**
   - Check GitHub Actions logs
   - Verify Dockerfile syntax
   - Ensure all dependencies are available

3. **Push Failed**
   - Verify repository exists on Docker Hub
   - Check Docker Hub rate limits
   - Ensure token permissions are correct

### Quick Fixes:

```bash
# Re-trigger workflow
git commit --allow-empty -m "trigger: Re-run Docker build"
git push origin main

# Check workflow status
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/SanketsMane/Employee-Management-System_React/actions/runs
```

## 🎯 Next Steps After Setup

1. **Configure Secrets** (required before first run)
2. **Push to trigger build** (or run manually)
3. **Monitor build progress** in GitHub Actions
4. **Verify images** on Docker Hub
5. **Deploy to production** using new images

---

**Ready to proceed?** Configure the Docker Hub secrets in GitHub, then push this workflow to trigger the automated build!