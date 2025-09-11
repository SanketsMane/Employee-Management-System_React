#!/bin/bash

# Production deployment script for React Vite app
set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Clean previous build
echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
rm -rf dist

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --production=false

# Run linting
echo -e "${YELLOW}🔍 Running linter...${NC}"
npm run lint || echo -e "${RED}⚠️ Linting issues found, continuing...${NC}"

# Build for production
echo -e "${YELLOW}🔨 Building for production...${NC}"
NODE_ENV=production npm run build

# Verify build
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Error: index.html not found in dist folder!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build verification passed!${NC}"

# List build files
echo -e "${YELLOW}📁 Build output:${NC}"
ls -la dist/

# Check file sizes
echo -e "${YELLOW}📊 File sizes:${NC}"
du -sh dist/*

echo -e "${GREEN}🎉 Production build completed successfully!${NC}"
echo -e "${YELLOW}📋 Files ready for deployment in ./dist folder${NC}"
echo ""
echo -e "${YELLOW}To deploy:${NC}"
echo "1. Upload the contents of ./dist folder to your web server"
echo "2. Configure your web server to serve SPA (see .htaccess for Apache)"
echo "3. Ensure all files have proper permissions"
echo ""
echo -e "${GREEN}✨ Deployment ready!${NC}"
