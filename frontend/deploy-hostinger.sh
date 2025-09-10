#!/bin/bash

# Hostinger Deployment Script for FormoEMS Frontend
# Domain: https://ems.formonex.in/

echo "🚀 Starting Hostinger deployment for FormoEMS..."

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found. Please create it with your AWS EC2 backend URL."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "📋 Deployment Instructions for Hostinger:"
echo "=========================================="
echo "1. Login to your Hostinger control panel"
echo "2. Go to File Manager"
echo "3. Navigate to your domain's public_html folder"
echo "4. Delete all existing files in public_html (if any)"
echo "5. Upload all files from the 'dist' folder to public_html"
echo "6. Make sure .htaccess file is present for React Router"
echo ""
echo "📁 Files to upload are in: ./dist/"
echo "🌐 Domain: https://ems.formonex.in/"
echo ""
echo "⚠️  IMPORTANT: Update .env.production with your actual AWS EC2 backend URL before building!"

# Create .htaccess file for React Router
cat > dist/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header always set X-Frame-Options DENY
  Header always set X-Content-Type-Options nosniff
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
EOF

echo "✅ .htaccess file created for React Router support"
echo ""
echo "🎉 Ready for deployment! Upload the contents of 'dist' folder to your Hostinger public_html directory."
