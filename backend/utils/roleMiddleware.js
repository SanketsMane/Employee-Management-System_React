const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');

// Protect routes - check if user is authenticated
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication middleware'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 Role authorization check');
    console.log('Required roles:', roles);
    console.log('User role:', req.user?.role);
    console.log('User:', req.user ? `${req.user.firstName} ${req.user.lastName}` : 'No user');
    
    if (!roles.includes(req.user.role)) {
      console.log('❌ Authorization failed - role not in allowed list');
      
      // Log unauthorized access attempt
      const log = new Log({
        user: req.user._id,
        action: 'Unauthorized Access Attempt',
        category: 'Authentication',
        details: `User with role ${req.user.role} tried to access ${req.originalUrl}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        endpoint: req.originalUrl,
        success: false,
        errorMessage: 'Insufficient permissions'
      });
      log.save();

      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    console.log('✅ Authorization successful');
    next();
  };
};

// Check if user can access specific employee data
exports.canAccessEmployee = async (req, res, next) => {
  try {
    const targetEmployeeId = req.params.employeeId || req.body.employeeId || req.query.employeeId;
    
    // Admin and HR can access all employees
    if (['Admin', 'HR'].includes(req.user.role)) {
      return next();
    }
    
    // Managers can access their team members
    if (req.user.role === 'Manager') {
      const targetEmployee = await User.findById(targetEmployeeId);
      if (targetEmployee && targetEmployee.manager && targetEmployee.manager.toString() === req.user._id.toString()) {
        return next();
      }
    }
    
    // Team Leads can access their team members
    if (req.user.role === 'Team Lead') {
      const targetEmployee = await User.findById(targetEmployeeId);
      if (targetEmployee && targetEmployee.teamLead && targetEmployee.teamLead.toString() === req.user._id.toString()) {
        return next();
      }
    }
    
    // Employees can only access their own data
    if (req.user._id.toString() === targetEmployeeId) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this employee data'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in access control'
    });
  }
};

// Log user actions
exports.logAction = (action, category) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const startTime = Date.now();

    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Create log entry
      const log = new Log({
        user: req.user ? req.user._id : null,
        action,
        category,
        details: `${req.method} ${req.originalUrl}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        method: req.method,
        endpoint: req.originalUrl,
        responseTime,
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? 'Request failed' : null,
        metadata: {
          body: req.body,
          query: req.query,
          params: req.params
        }
      });
      
      log.save().catch(err => console.error('Log save error:', err));
      
      originalSend.call(this, data);
    };

    next();
  };
};
