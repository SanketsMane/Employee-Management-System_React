const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { initializeCronJobs } = require('./utils/emailService');
const webSocketService = require('./services/websocket');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const sheetRoutes = require('./routes/sheetRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const teamRoutes = require('./routes/teamRoutes');
const taskSheetRoutes = require('./routes/taskSheetRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const companyRoutes = require('./routes/companyRoutes');
const bugReportRoutes = require('./routes/bugReportRoutes');
const overtimeRoutes = require('./routes/overtimeRoutes');
const systemConfigRoutes = require('./routes/systemConfigRoutes');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize WebSocket service
webSocketService.initialize(server);

// Trust proxy (required for rate limiting when behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "http:", "https:", "data:", "blob:", "'unsafe-inline'"],
      connectSrc: ["'self'", "*", "ws:", "wss:", "http:", "https:"], // Allow WebSocket protocols explicitly
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "*"],
      fontSrc: ["'self'", "data:", "https:", "*"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "data:", "blob:", "*"],
      frameSrc: ["'self'", "*"],
      workerSrc: ["'self'", "blob:"],
      upgradeInsecureRequests: []
    },
  },
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs for auth routes (increased)
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting for /me and /logout endpoints
    return req.path === '/api/auth/me' || req.path === '/api/auth/logout';
  }
});

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration - PERMANENT FIX for WebSocket polling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, socket.io polling, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost',        // Frontend running on port 80
      'http://localhost:80',     // Explicit port 80
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5174',
      'http://localhost:5175',
      // Production domains
      'https://ems.formonex.in',
      'https://formonex.in',
      'http://ems.formonex.in',
      'http://formonex.in'
    ];
    
    // In production, be more flexible for AWS deployment
    if (process.env.NODE_ENV === 'production') {
      // Allow localhost for development
      const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
      
      // Allow any AWS EC2 domain pattern
      const isAwsEc2 = origin && (
        origin.includes('.compute.amazonaws.com') ||
        origin.includes('.aws.') ||
        /^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(origin) // Allow any IP address
      );
      
      // Allow configured production domains
      const isAllowedDomain = allowedOrigins.includes(origin);
      
      if (isLocalhost || isAwsEc2 || isAllowedDomain) {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Development - allow all configured origins and localhost
      if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  // PERMANENT FIX: Allow all methods for socket.io polling
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'X-Socket-Id', // Socket.io specific headers
    'X-Socket-Transport'
  ]
};

app.use(cors(corsOptions));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Employee Management System API',
    version: '1.0.0',
    status: 'running'
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/worksheets', sheetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', approvalRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/task-sheets', taskSheetRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/bug-reports', bugReportRoutes);
app.use('/api/system/config', systemConfigRoutes);
app.use('/api/announcements', require('./routes/announcementRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Employee Management System API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Employee Management System API',
    version: '1.0.0',
    author: 'Sanket Mane',
    contact: 'contactsanket1@gmail.com',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      attendance: '/api/attendance',
      leaves: '/api/leaves',
      worksheets: '/api/worksheets'
    }
  });
});

// 404 handler for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    return res.status(400).json({
      success: false,
      message
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json({
      success: false,
      message
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    return res.status(401).json({
      success: false,
      message
    });
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    return res.status(401).json({
      success: false,
      message
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field'
    });
  }

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
🚀 Employee Management System API Server Started!
📡 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📧 Email service: ${process.env.EMAIL_HOST || 'Not configured'}
🔐 MongoDB: Connected
⏰ Cron jobs: Initializing...
🔗 WebSocket service: Active

Developed by Sanket Mane | contactsanket1@gmail.com
  `);
  
  // Initialize cron jobs for automated emails
  initializeCronJobs();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Promise Rejection:', err.message);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;
