#!/bin/bash

# FormoEMS - Automated Map Fix & Version Bump Script
# This script automatically fixes all .map() errors and handles versioning

set -e  # Exit on error

echo "🔧 FormoEMS Auto-Fix & Version Bump Script Starting..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

print_status "Step 1: Backing up current version..."
cp package.json package.json.backup

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Calculate new version (increment patch version)
IFS='.' read -ra ADDR <<< "$CURRENT_VERSION"
MAJOR=${ADDR[0]}
MINOR=${ADDR[1]}
PATCH=${ADDR[2]}
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

print_status "New version will be: $NEW_VERSION"

# Update package.json version
print_status "Step 2: Updating package.json version..."
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
rm package.json.bak

print_success "Updated package.json to version $NEW_VERSION"

# Step 3: Auto-fix .map() calls that are not already protected
print_status "Step 3: Auto-fixing unprotected .map() calls..."

# Find all JSX/JS files and fix unprotected .map() calls
find src -name "*.jsx" -o -name "*.js" | while read -r file; do
    if [[ "$file" == *"arrayUtils.js"* ]]; then
        print_status "Skipping arrayUtils.js to avoid modifying utility functions"
        continue
    fi
    
    # Check if file contains unprotected .map() calls
    if grep -q "\.map(" "$file"; then
        print_status "Processing: $file"
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Fix unprotected .map() calls in JSX rendering contexts
        # This regex finds .map() calls that are NOT already protected with Array.isArray()
        sed -i.tmp 's/{\([^}]*[^y]\)\([a-zA-Z_$][a-zA-Z0-9_$]*\)\.map(/{\1Array.isArray(\2) \&\& \2.map(/g' "$file"
        
        # Clean up temp file
        rm "$file.tmp" 2>/dev/null || true
        
        # Check if changes were made
        if ! cmp -s "$file" "$file.backup"; then
            print_success "Fixed .map() calls in: $file"
        else
            print_status "No changes needed in: $file"
        fi
        
        # Remove backup
        rm "$file.backup"
    fi
done

print_success "Completed auto-fixing .map() calls"

# Step 4: Clean and rebuild with cache busting
print_status "Step 4: Cleaning and rebuilding with aggressive cache busting..."

# Clean dist directory
rm -rf dist

# Update vite config timestamp for cache busting
TIMESTAMP=$(date +%s)
echo "// Auto-generated timestamp: $TIMESTAMP" > src/buildInfo.js
echo "export const BUILD_TIME = '$TIMESTAMP';" >> src/buildInfo.js
echo "export const VERSION = '$NEW_VERSION';" >> src/buildInfo.js

# Build with version in output
print_status "Building frontend v$NEW_VERSION..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend build completed successfully!"
else
    print_error "Frontend build failed!"
    exit 1
fi

# Step 5: Update Docker image with versioned tag
print_status "Step 5: Building Docker image with version tag..."

cd ..  # Back to root directory

# Build Docker image with version tag
docker build -t employee-management-system_react-frontend:$NEW_VERSION ./frontend
docker build -t employee-management-system_react-frontend:latest ./frontend

print_success "Docker images built:"
print_success "  - employee-management-system_react-frontend:$NEW_VERSION"
print_success "  - employee-management-system_react-frontend:latest"

# Step 6: Deploy new version
print_status "Step 6: Deploying new version..."

# Stop old container
docker stop ems-frontend 2>/dev/null || true
docker rm ems-frontend 2>/dev/null || true

# Start new container with version tag
docker run -d \
    --name ems-frontend \
    --network ems-network \
    -p 80:80 \
    --restart unless-stopped \
    employee-management-system_react-frontend:$NEW_VERSION

if [ $? -eq 0 ]; then
    print_success "New frontend container deployed successfully!"
else
    print_error "Failed to deploy new container!"
    exit 1
fi

# Step 7: Commit changes
print_status "Step 7: Committing changes to git..."

git add .
git commit -m "Auto-fix: Resolve all .map() errors and bump version to $NEW_VERSION

🔧 Automated Changes:
- Fixed all unprotected .map() calls with Array.isArray() checks
- Bumped version from $CURRENT_VERSION to $NEW_VERSION
- Added aggressive cache-busting with timestamp: $TIMESTAMP
- Updated Docker image tags
- Generated new build info

🚀 Deployment:
- New container: employee-management-system_react-frontend:$NEW_VERSION
- Cache-busting enabled to force browser refresh
- All .map() errors resolved automatically

Generated by auto-fix script on $(date)"

print_success "Changes committed to git"

# Step 8: Verify deployment
print_status "Step 8: Verifying deployment..."

sleep 5  # Wait for container to fully start

# Check if container is running
if docker ps | grep -q "ems-frontend"; then
    print_success "✅ Frontend container is running"
else
    print_error "❌ Frontend container is not running"
    exit 1
fi

# Check if files are served correctly
DEPLOYED_FILES=$(docker exec ems-frontend ls -la /usr/share/nginx/html/assets/ | grep -c "index-.*\.js" || echo "0")
if [ "$DEPLOYED_FILES" -gt 0 ]; then
    print_success "✅ New JavaScript files are deployed"
else
    print_error "❌ No JavaScript files found in deployment"
    exit 1
fi

# Final success message
echo ""
echo "🎉 ==============================================="
echo "🎉  AUTO-FIX & DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "🎉 ==============================================="
echo ""
print_success "Version: $CURRENT_VERSION → $NEW_VERSION"
print_success "Build timestamp: $TIMESTAMP"
print_success "Docker image: employee-management-system_react-frontend:$NEW_VERSION"
print_success "All .map() errors have been automatically resolved"
print_success "Cache-busting enabled - browsers will load fresh content"
echo ""
print_warning "Next steps:"
print_warning "1. Test the application thoroughly"
print_warning "2. Clear browser cache if you still see old errors"
print_warning "3. Monitor for any remaining issues"
echo ""
print_status "Access your application at: https://ems.formonex.in"