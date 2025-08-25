#!/bin/bash

# Employee Management System Setup Script
echo "🚀 Setting up Employee Management System..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm is installed: $(npm --version)"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env file with your email credentials:"
echo "   - EMAIL_USER: Your Gmail address"
echo "   - EMAIL_PASS: Your Gmail App Password"
echo ""
echo "2. Start the development servers:"
echo "   npm run dev"
echo ""
echo "3. Open your browser and navigate to:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:5000"
echo ""
echo "4. Default admin login:"
echo "   Email: admin@company.com"
echo "   Password: admin123"
echo ""
echo "🚀 Happy coding!"
