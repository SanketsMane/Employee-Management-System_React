const User = require('../models/User');
const Team = require('../models/Team');
const Notification = require('../models/Notification');
const Leave = require('../models/Leave');
const DailyTaskSheet = require('../models/DailyTaskSheet');
const WorkSheet = require('../models/WorkSheet');
const BugReport = require('../models/BugReport');
const Attendance = require('../models/Attendance');
const { sendEmail } = require('../utils/emailService');
const { generateToken } = require('../controllers/authController');
const { sendQuickSMS } = require('../utils/smsService');

// Generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// @desc    Get all users by role with filters
// @route   GET /api/admin/users
// @access  Private/Admin/HR/Manager
exports.getUsersByRole = async (req, res) => {
  try {
    const { 
      role, 
      department, 
      isActive, 
      isApproved, 
      search,
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    let query = {};

    // Role filter
    if (role && role !== 'all') {
      query.role = role;
    }

    // Department filter
    if (department && department !== 'all') {
      query.department = department;
    }

    // Active status filter
    if (isActive !== undefined && isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    // Approval status filter
    if (isApproved !== undefined && isApproved !== 'all') {
      query.isApproved = isApproved === 'true';
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
        { position: searchRegex }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const users = await User.find(query)
      .populate('manager', 'firstName lastName email employeeId')
      .populate('teamLead', 'firstName lastName email employeeId')
      .populate('approvedBy', 'firstName lastName email')
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    // Get statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          approvedUsers: { $sum: { $cond: ['$isApproved', 1, 0] } },
          pendingApproval: { $sum: { $cond: [{ $eq: ['$isApproved', false] }, 1, 0] } }
        }
      }
    ]);

    // Get role distribution
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        limit: parseInt(limit)
      },
      statistics: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        approvedUsers: 0,
        pendingApproval: 0
      },
      roleDistribution: roleStats
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Create user by admin
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
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

    // Use provided password or generate random one
    const userPassword = password || generateRandomPassword();

    // Create user data
    const userData = {
      firstName,
      lastName,
      email,
      password: userPassword,
      role: role || 'Employee',
      department,
      position,
      phone,
      salary: salary || 0,
      isApproved: true, // Admin-created users are auto-approved
      approvedBy: req.user.id,
      approvedAt: new Date(),
      isActive: true
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

    // Send welcome email with credentials
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
            <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: bold;">Welcome to FormoEMS!</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Your Employee Management System Account</p>
          </div>

          <!-- Welcome Message -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #059669; margin: 0 0 15px 0; font-size: 20px;">Hello ${firstName} ${lastName}! 👋</h2>
            <p style="color: #374151; line-height: 1.6; margin: 0;">
              Your account has been successfully created by a system administrator. Welcome to our team! 
              You now have access to the Employee Management System with the role of <strong>${role}</strong>.
            </p>
          </div>

          <!-- Account Information -->
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
            <h3 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 18px;">📋 Account Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Employee ID:</td><td style="padding: 8px 0; color: #1f2937;">${user.employeeId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Full Name:</td><td style="padding: 8px 0; color: #1f2937;">${firstName} ${lastName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td><td style="padding: 8px 0; color: #1f2937;">${email}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Role:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${role}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Department:</td><td style="padding: 8px 0; color: #1f2937;">${department}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Position:</td><td style="padding: 8px 0; color: #1f2937;">${position}</td></tr>
            </table>
          </div>

          <!-- Login Credentials -->
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border: 2px solid #fecaca;">
            <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 18px;">🔐 Login Credentials</h3>
            <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
              <p style="margin: 0 0 10px 0; color: #374151;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 0 0 10px 0; color: #374151;"><strong>Password:</strong> <code style="background-color: #fee2e2; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #dc2626;">${userPassword}</code></p>
            </div>
            <div style="background-color: #fef7cd; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-top: 15px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⚠️ <strong>Important Security Notice:</strong> Please change your password immediately after your first login for security purposes.
              </p>
            </div>
          </div>

          <!-- Access Instructions -->
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
            <h3 style="color: #15803d; margin: 0 0 15px 0; font-size: 18px;">🚀 Getting Started</h3>
            <ol style="color: #374151; line-height: 1.6; padding-left: 20px;">
              <li>Click the login button below to access your dashboard</li>
              <li>Use the credentials provided above to sign in</li>
              <li>Change your password in the Settings page</li>
              <li>Complete your profile information</li>
              <li>Explore the available features based on your role</li>
            </ol>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/login" 
               style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              🔑 Login to Dashboard
            </a>
          </div>

          <!-- Support Information -->
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
              📞 Need help? Contact your system administrator or HR department<br>
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
      const { sendEmail } = require('../utils/emailService');
      await sendEmail({
        email: user.email,
        subject: `Welcome to FormoEMS - Your ${role} Account Created!`,
        html: welcomeHtml
      });
      console.log(`✅ Welcome email sent to ${user.firstName} ${user.lastName} (${user.email})`);
    } catch (emailError) {
      console.log('Email sending failed, but user creation succeeded:', emailError.message);
    }

    // Send welcome SMS if phone number is available
    if (user.phone) {
      try {
        const { sendQuickSMS } = require('../utils/smsService');
        await sendQuickSMS.welcomeMessage(user.phone, user.firstName, user.employeeId);
        console.log(`📱 Welcome SMS sent to ${user.firstName} (${user.phone})`);
      } catch (smsError) {
        console.log('SMS sending failed:', smsError.message);
      }
    }

    // Create notification for the new user
    try {
      await Notification.create({
        title: 'Welcome to the Team!',
        message: `Your ${role} account has been created by an administrator. Check your email for login credentials and welcome information.`,
        type: 'success',
        sender: req.user.id,
        recipients: [{
          user: user._id,
          isRead: false
        }],
        priority: 'High',
        category: 'account'
      });
    } catch (notificationError) {
      console.log('Notification creation failed:', notificationError.message);
    }

    // Remove password from response
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully and welcome email sent!',
      data: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// @desc    Update user by admin
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData.employeeId;
    delete updateData.createdAt;

    // Find the user to update
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update manager and team lead if provided
    if (updateData.managerId) {
      const manager = await User.findById(updateData.managerId);
      if (manager && manager.role === 'Manager') {
        updateData.manager = updateData.managerId;
      }
      delete updateData.managerId;
    }

    if (updateData.teamLeadId) {
      const teamLead = await User.findById(updateData.teamLeadId);
      if (teamLead && teamLead.role === 'Team Lead') {
        updateData.teamLead = updateData.teamLeadId;
      }
      delete updateData.teamLeadId;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('manager', 'firstName lastName email')
     .populate('teamLead', 'firstName lastName email');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const userResponse = { ...updatedUser.toObject() };
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// @desc    Delete user by admin
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Toggle user status (active/inactive)
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    // Toggle status
    user.isActive = !user.isActive;
    await user.save();

    // Remove password from response
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: userResponse
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

// @desc    Approve user
// @route   PATCH /api/admin/users/:id/approve
// @access  Private/Admin
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'User is already approved'
      });
    }

    user.isApproved = true;
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();
    await user.save();

    // Remove password from response
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User approved successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving user',
      error: error.message
    });
  }
};

// @desc    Remove user approval
// @route   PUT /api/admin/users/:id/remove-approval
// @access  Private/Admin
exports.removeUserApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from removing their own approval
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own approval'
      });
    }

    user.isApproved = false;
    user.approvedBy = undefined;
    user.approvedAt = undefined;
    await user.save();

    // Remove password from response
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User approval removed successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Remove user approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing user approval',
      error: error.message
    });
  }
};

// @desc    Reset user password
// @route   POST /api/admin/users/:id/reset-password
// @access  Private/Admin
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Use provided password or generate new one
    const newPassword = password || generateRandomPassword();
    
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: password ? 'Password updated successfully' : 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};
