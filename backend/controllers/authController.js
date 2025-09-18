const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');
const webSocketService = require('../services/websocket');

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
      customRole,
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

    // Validate custom role if "Other" is selected
    if (role === 'Other' && !customRole) {
      return res.status(400).json({
        success: false,
        message: 'Custom role is required when "Other" is selected'
      });
    }

    // Create user
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: role || 'Employee',
      customRole: role === 'Other' ? customRole : undefined,
      department,
      position: position || customRole || role || 'Employee', // Use customRole if provided
      phone,
      salary: salary || 0,
      isApproved: false,  // Explicitly set to false - user needs admin approval
      isActive: true      // User account is active but not approved
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

    // Create notification for all admins about new user registration
    try {
      const adminUsers = await User.find({ role: 'Admin', isActive: true }).select('_id');
      
      if (adminUsers.length > 0) {
        const adminRecipients = adminUsers.map(admin => ({
          user: admin._id,
          isRead: false
        }));

        const notification = await Notification.create({
          title: '👤 New User Registration',
          message: `${firstName} ${lastName} (${email}) has registered and is waiting for approval.`,
          type: 'approval',
          sender: user._id,
          recipients: adminRecipients,
          priority: 'High',
          actionUrl: '/admin/users',
          metadata: {
            userId: user._id,
            userEmail: email,
            userRole: role || 'Employee',
            userDepartment: department,
            userPosition: position,
            requiresApproval: true
          }
        });

        // Send real-time notification to all admins via WebSocket
        webSocketService.sendNotificationToRole('Admin', {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          metadata: notification.metadata,
          createdAt: notification.createdAt
        });

        console.log(`📬 Created and sent approval notification to ${adminUsers.length} admin(s)`);
      }
    } catch (notificationError) {
      console.error('❌ Failed to create admin notification:', notificationError);
      // Don't fail registration if notification creation fails
    }

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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
            <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: bold;">Welcome to FormoEMS! 🎉</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Your Account Registration Successful</p>
          </div>

          <!-- Welcome Message -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #059669; margin: 0 0 15px 0; font-size: 20px;">Hello ${firstName} ${lastName}! 👋</h2>
            <p style="color: #374151; line-height: 1.6; margin: 0;">
              Congratulations! Your account has been successfully created in our Employee Management System. 
              You're now part of our digital workplace with the role of <strong>${role || 'Employee'}</strong>.
            </p>
          </div>

          <!-- Account Information -->
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
            <h3 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 18px;">📋 Your Account Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Employee ID:</td><td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${user.employeeId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Full Name:</td><td style="padding: 8px 0; color: #1f2937;">${firstName} ${lastName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td><td style="padding: 8px 0; color: #1f2937;">${email}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Role:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${role || 'Employee'}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Department:</td><td style="padding: 8px 0; color: #1f2937;">${department}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Position:</td><td style="padding: 8px 0; color: #1f2937;">${position}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Status:</td><td style="padding: 8px 0; color: #16a34a; font-weight: 600;">✅ Active & Ready</td></tr>
            </table>
          </div>

          <!-- Account Status -->
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
            <h3 style="color: #15803d; margin: 0 0 15px 0; font-size: 18px;">🎯 Account Status</h3>
            <p style="color: #374151; line-height: 1.6; margin: 0;">
              Your account is <strong style="color: #15803d;">Active and Ready</strong> to use! You can now access all the features 
              available to your role. Your login credentials are the same email and password you used during registration.
            </p>
          </div>

          <!-- Getting Started Guide -->
          <div style="background-color: #fef7cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">🚀 Getting Started</h3>
            <ol style="color: #374151; line-height: 1.8; padding-left: 20px; margin: 0;">
              <li><strong>Login:</strong> Use your email and password to access the dashboard</li>
              <li><strong>Complete Profile:</strong> Update your profile information and preferences</li>
              <li><strong>Explore Features:</strong> Discover attendance, leave management, and task sheets</li>
              <li><strong>Security:</strong> Consider updating your password in settings for enhanced security</li>
              <li><strong>Connect:</strong> Start collaborating with your team members</li>
            </ol>
          </div>

          <!-- Features Available -->
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #475569; margin: 0 0 15px 0; font-size: 18px;">🌟 Available Features</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="color: #374151; font-size: 14px;">✅ Dashboard Overview</div>
              <div style="color: #374151; font-size: 14px;">✅ Attendance Tracking</div>
              <div style="color: #374151; font-size: 14px;">✅ Leave Management</div>
              <div style="color: #374151; font-size: 14px;">✅ Task & Worksheets</div>
              <div style="color: #374151; font-size: 14px;">✅ Team Collaboration</div>
              <div style="color: #374151; font-size: 14px;">✅ Profile Management</div>
              <div style="color: #374151; font-size: 14px;">✅ Notifications</div>
              <div style="color: #374151; font-size: 14px;">✅ Real-time Updates</div>
            </div>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/login" 
               style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              🚀 Access Your Dashboard
            </a>
          </div>

          <!-- Security Notice -->
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 25px 0; border: 1px solid #fecaca;">
            <p style="color: #991b1b; font-size: 14px; margin: 0; text-align: center;">
              🔒 <strong>Security Tip:</strong> Keep your login credentials secure and never share them with others.
            </p>
          </div>

          <!-- Support Information -->
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
              📞 Need help getting started? Contact your HR department or system administrator<br>
              📧 Technical support: contactsanket1@gmail.com
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Developed by Sanket Mane | FormoEMS Employee Management System<br>
              © ${new Date().getFullYear()} FormoEMS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: `Welcome to FormoEMS - Account Created Successfully! 🎉`,
        html: welcomeHtml
      });
    } catch (emailError) {
      // Welcome email sending failed, but continue with registration
    }

    // Send success response without token (user needs admin approval)
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please wait for admin approval before you can login.',
      data: {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          employeeId: user.employeeId,
          department: user.department,
          position: user.position,
          isApproved: user.isApproved
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      let message = 'Registration failed due to duplicate data';
      
      if (field === 'email') {
        message = 'A user with this email address already exists';
      } else if (field === 'employeeId') {
        message = 'Employee ID generation failed. Please try again.';
      }
      
      return res.status(400).json({
        success: false,
        message,
        error: error.message
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
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
      // Log unapproved login attempt
      await Log.create({
        user: user._id,
        action: 'Failed Login - Not Approved',
        category: 'Authentication',
        details: `Login attempt by unapproved user: ${email}. Role: ${user.role}, isApproved: ${user.isApproved}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Account pending approval'
      });

      return res.status(401).json({
        success: false,
        message: 'Your account is pending approval. Please wait for admin approval before you can login.',
        accountStatus: 'pending_approval'
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
    console.error('❌ Error in getMe:', error);
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
    console.log('🔧 Profile update request received');
    console.log('User:', req.user?.firstName, req.user?.lastName, '- Role:', req.user?.role);
    console.log('Request body:', req.body);

    const {
      firstName,
      lastName,
      phone,
      address,
      skills,
      bio
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
    }

    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || '',
        address: address?.trim() || '',
        skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
        bio: bio?.trim() || ''
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

    console.log('✅ Profile updated successfully for:', user.firstName, user.lastName);

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
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/auth/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    console.log('📸 Profile picture upload request received');
    console.log('User:', req.user?.firstName, req.user?.lastName);
    console.log('File:', req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If using Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const cloudinary = require('../config/cloudinary');
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'profile_pictures',
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          { quality: 'auto' }
        ]
      });

      // Delete local file after upload
      const fs = require('fs');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // Update user profile picture
      user.profilePicture = result.secure_url;
    } else {
      // Use local file storage
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      user.profilePicture = `${baseUrl}/uploads/${req.file.filename}`;
    }

    await user.save();

    console.log('✅ Profile picture updated successfully');

    // Log profile picture update
    await Log.create({
      user: user._id,
      action: 'Profile Picture Update',
      category: 'Profile',
      details: 'User updated their profile picture',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('❌ Profile picture upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      const fs = require('fs');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
};
