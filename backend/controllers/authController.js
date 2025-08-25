const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');
const { sendEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (Admin only in production)
exports.register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      position,
      phone,
      managerId,
      teamLeadId,
      salary
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
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
      role: role || 'Employee',
      department,
      position,
      phone,
      salary: salary || 0
    };

    // Set manager and team lead if provided
    if (managerId) {
      const manager = await User.findById(managerId);
      if (manager && manager.role === 'Manager') {
        userData.manager = managerId;
      }
    }

    if (teamLeadId) {
      const teamLead = await User.findById(teamLeadId);
      if (teamLead && teamLead.role === 'Team Lead') {
        userData.teamLead = teamLeadId;
      }
    }

    const user = await User.create(userData);

    // Log the registration
    await Log.create({
      user: user._id,
      action: 'User Registration',
      category: 'Authentication',
      details: `New user registered with email: ${email}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    // Send welcome email
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4f46e5;">Welcome to Employee Management System!</h1>
        <p>Dear ${firstName} ${lastName},</p>
        <p>Your account has been successfully created with the following details:</p>
        <ul>
          <li><strong>Employee ID:</strong> ${user.employeeId}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Role:</strong> ${role || 'Employee'}</li>
          <li><strong>Department:</strong> ${department}</li>
          <li><strong>Position:</strong> ${position}</li>
        </ul>
        <p>You can now log in to your dashboard and start using the system.</p>
        <a href="${process.env.FRONTEND_URL}/login" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
        <br><br>
        <p style="margin-top: 20px; color: #666;">Developed by Sanket Mane | Email: contactsanket1@gmail.com</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Welcome to Employee Management System',
      html: welcomeHtml
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user and include password in query
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Log failed login attempt
      await Log.create({
        action: 'Failed Login - User Not Found',
        category: 'Authentication',
        details: `Login attempt with non-existent email: ${email}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'User not found'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Log failed login attempt
      await Log.create({
        user: user._id,
        action: 'Failed Login - Wrong Password',
        category: 'Authentication',
        details: `Failed login attempt for user: ${email}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Wrong password'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact admin.'
      });
    }

    // Check if user is approved (except for Admin role)
    if (user.role !== 'Admin' && !user.isApproved) {
      return res.status(401).json({
        success: false,
        message: 'Your account is pending approval. Please wait for admin approval.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await Log.create({
      user: user._id,
      action: 'Successful Login',
      category: 'Authentication',
      details: `User logged in successfully: ${email}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('manager', 'firstName lastName email')
      .populate('teamLead', 'firstName lastName email')
      .select('-password');

    res.status(200).json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Log logout action
    await Log.create({
      user: req.user._id,
      action: 'User Logout',
      category: 'Authentication',
      details: `User logged out: ${req.user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token (in production, use crypto)
    const resetToken = Math.random().toString(36).substring(2, 15);
    
    // In production, save this token to database with expiry
    // For now, we'll send a simple reset link
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Password Reset Request</h1>
        <p>You have requested a password reset for your account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      html
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Email could not be sent',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/changepassword
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    // Log password change
    await Log.create({
      user: user._id,
      action: 'Password Change',
      category: 'Authentication',
      details: 'User changed password successfully',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      skills,
      bio
    } = req.body;

    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName,
        lastName,
        phone,
        address,
        skills,
        bio
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log profile update
    await Log.create({
      user: user._id,
      action: 'Profile Update',
      category: 'Profile',
      details: 'User updated their profile information',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
