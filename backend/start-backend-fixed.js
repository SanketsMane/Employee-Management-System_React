const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables first
dotenv.config();

console.log('🔧 Starting EMS Backend with Debug Mode...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 8000);

const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Permissive CORS for debugging
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// Connect to database with better error handling
async function connectDB() {
  try {
    const mongoose = require('mongoose');
    const uri = process.env.MONGODB_URI || 'mongodb+srv://hackable3030:f9pZaA7rmlUkQ97N@cluster0.o6vez6l.mongodb.net/ems-db?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Debug registration endpoint
app.post('/api/auth/register', async (req, res) => {
  console.log('📝 Registration attempt:', {
    body: { ...req.body, password: '[HIDDEN]' },
    headers: req.headers,
    ip: req.ip
  });
  
  try {
    const { firstName, lastName, email, password, department, position, role } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !department || !position) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['firstName', 'lastName', 'email', 'password', 'department', 'position']
      });
    }
    
    const User = require('./models/User');
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create user
    const userData = {
      firstName,
      lastName,
      email,
      password,
      department,
      position,
      role: role || 'Employee'
    };
    
    console.log('👤 Creating user with data:', { ...userData, password: '[HIDDEN]' });
    
    const user = await User.create(userData);
    console.log('✅ User created successfully:', user.email);
    
    // Generate token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback-secret', {
      expiresIn: '7d'
    });
    
    // Remove password from response
    user.password = undefined;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: { user }
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// Start server
async function startServer() {
  await connectDB();
  
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📝 Registration: http://localhost:${PORT}/api/auth/register`);
  });
}

startServer().catch(error => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});
