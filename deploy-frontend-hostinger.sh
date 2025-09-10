#!/bin/bash

# Frontend Build and Deployment Script for Hostinger
# Run this script locally, then upload the dist folder to your Hostinger hosting

echo "🚀 Building Frontend for Production Deployment..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🏗️ Building for production..."
npm run build

echo "✅ Build completed!"
echo ""
echo "📁 Built files are in: frontend/dist/"
echo ""
echo "🌐 Next steps for Hostinger deployment:"
echo "1. Compress the 'dist' folder as a ZIP file"
echo "2. Upload to your Hostinger hosting at: https://ems.formonex.in/"
echo "3. Extract the ZIP file in your domain's public_html directory"
echo "4. Make sure all files from 'dist' folder are in the root of public_html"
echo ""
echo "📝 Files to upload:"
ls -la dist/
echo ""
echo "🔧 Make sure your Hostinger hosting supports:"
echo "   - Static file serving"
echo "   - SPA (Single Page Application) redirects"
echo "   - HTTPS (recommended)"
