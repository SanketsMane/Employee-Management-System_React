#!/bin/bash

# Backend Debug Script for 500 Error Investigation

echo "🔍 EMS Backend Debug Script"
echo "=========================="
echo "Investigating 500 error during registration..."
echo ""

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "📦 Running in Docker container"
    BACKEND_DIR="/app"
else
    echo "💻 Running on host system"
    BACKEND_DIR="/Users/sanketmane/EMS-Fomonex/Employee-Management-System_React/backend"
fi

echo ""
echo "🌐 Environment Information:"
echo "NODE_ENV: ${NODE_ENV:-'not set'}"
echo "PORT: ${PORT:-'not set'}"
echo "MONGODB_URI: ${MONGODB_URI:0:20}... (truncated for security)"
echo "JWT_SECRET: ${JWT_SECRET:0:10}... (truncated for security)"
echo "EMAIL_ENABLED: ${EMAIL_ENABLED:-'not set'}"
echo "FRONTEND_URL: ${FRONTEND_URL:-'not set'}"

echo ""
echo "🔗 Testing MongoDB Connection:"
node -e "
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb+srv://hackable3030:f9pZaA7rmlUkQ97N@cluster0.o6vez6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connection successful');
  mongoose.connection.close();
}).catch(err => {
  console.log('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});
"

echo ""
echo "📝 Testing User Model:"
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hackable3030:f9pZaA7rmlUkQ97N@cluster0.o6vez6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  // Test user creation with minimal data
  try {
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test-debug-' + Date.now() + '@example.com',
      password: 'password123',
      role: 'Employee',
      department: 'IT',
      position: 'Developer'
    };
    
    console.log('🧪 Testing user creation...');
    const user = new User(testUser);
    await user.save();
    console.log('✅ User model validation successful');
    
    // Clean up test user
    await User.deleteOne({ _id: user._id });
    console.log('🗑️ Test user cleaned up');
    
  } catch (err) {
    console.log('❌ User model error:', err.message);
    if (err.errors) {
      Object.keys(err.errors).forEach(key => {
        console.log('  -', key + ':', err.errors[key].message);
      });
    }
  }
  
  mongoose.connection.close();
}).catch(err => {
  console.log('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});
"

echo ""
echo "📧 Testing Email Configuration:"
node -e "
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify()
.then(() => {
  console.log('✅ Email configuration is valid');
})
.catch(err => {
  console.log('⚠️ Email configuration issue:', err.message);
  console.log('  (This may not prevent registration, but emails won\'t be sent)');
});
"

echo ""
echo "🔧 Suggested Fixes for 500 Error:"
echo "1. Check if all required environment variables are set"
echo "2. Verify MongoDB connection string is correct"
echo "3. Ensure all required fields are provided in registration request"
echo "4. Check for any missing dependencies"
echo "5. Verify CORS configuration allows your frontend domain"

echo ""
echo "🚀 Test Registration Endpoint:"
echo "Run this curl command to test registration:"
echo ""
echo "curl -X POST http://localhost:8000/api/auth/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"firstName\": \"Test\","
echo "    \"lastName\": \"User\","
echo "    \"email\": \"test@example.com\","
echo "    \"password\": \"password123\","
echo "    \"department\": \"IT\","
echo "    \"position\": \"Developer\""
echo "  }'"

echo ""
echo "📋 Debug completed!"