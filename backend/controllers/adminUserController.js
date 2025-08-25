const User = require('../models/User');
const Notification = require('../models/Notification');
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

// @desc    Create user by admin (Manager, HR, Admin roles)
// @route   POST /api/admin/create-user
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role,
      department,
      position,
      phone,
      managerId,
      teamLeadId,
      salary
    } = req.body;

    // Only Admin can create Manager, HR, Admin roles
    if (!['Manager', 'HR', 'Admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only for creating Manager, HR, or Admin roles'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate random password
    const generatedPassword = generateRandomPassword();

    // Create user data
    const userData = {
      firstName,
      lastName,
      email,
      password: generatedPassword,
      role,
      department,
      position,
      phone,
      salary: salary || 0,
      isApproved: true, // Admin-created users are auto-approved
      approvedBy: req.user.id,
      approvedAt: new Date()
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4f46e5;">Welcome to Employee Management System!</h1>
        <p>Dear ${firstName} ${lastName},</p>
        <p>Your account has been created by the system administrator with the following details:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">Account Information:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0;"><strong>Employee ID:</strong> ${user.employeeId}</li>
            <li style="padding: 8px 0;"><strong>Email:</strong> ${email}</li>
            <li style="padding: 8px 0;"><strong>Role:</strong> ${role}</li>
            <li style="padding: 8px 0;"><strong>Department:</strong> ${department}</li>
            <li style="padding: 8px 0;"><strong>Position:</strong> ${position}</li>
          </ul>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Login Credentials:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> <code style="background-color: #fee2e2; padding: 2px 6px; border-radius: 4px;">${generatedPassword}</code></p>
          <p style="color: #991b1b; font-size: 14px; margin-top: 10px;">
            ⚠️ <strong>Important:</strong> Please change your password after first login for security.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/login" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Login to Dashboard
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          If you have any questions or issues, please contact the system administrator.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Developed by Sanket Mane | Email: contactsanket1@gmail.com
        </p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Account Created - Employee Management System',
      html: welcomeHtml
    });

    // Send welcome SMS if phone number is available
    if (user.phone) {
      await sendQuickSMS.welcomeMessage(user.phone, user.firstName, user.employeeId);
      console.log(`📱 Welcome SMS sent to ${user.firstName} (${user.phone})`);
    }

    // Create notification for the new user
    await Notification.create({
      title: 'Welcome to the Team!',
      message: `Your ${role} account has been created. Check your email for login credentials.`,
      type: 'success',
      sender: req.user.id,
      recipients: [{
        user: user._id,
        isRead: false
      }],
      priority: 'High',
      category: 'approval'
    });

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User created successfully and credentials sent via email',
      data: user
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

// @desc    Get all users by role
// @route   GET /api/admin/users-by-role
// @access  Private/Admin
exports.getUsersByRole = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, department, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (department && department !== 'all') {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('manager', 'firstName lastName employeeId')
      .populate('teamLead', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    const total = await User.countDocuments(query);

    // Get role statistics
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          approved: { $sum: { $cond: ['$isApproved', 1, 0] } },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: users,
      roleStats
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Update user details
// @route   PUT /api/admin/update-user/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating password through this endpoint
    delete updateData.password;
    
    // Don't allow self-demotion from Admin
    if (id === req.user.id && updateData.role && updateData.role !== 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own admin role'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password').populate('manager teamLead approvedBy', 'firstName lastName employeeId');

    // Send notification to user about profile update
    await Notification.create({
      title: 'Profile Updated',
      message: `Your profile has been updated by ${req.user.firstName} ${req.user.lastName}`,
      type: 'info',
      sender: req.user.id,
      recipients: [{
        user: id,
        isRead: false
      }],
      priority: 'Medium',
      category: 'system'
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
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

// @desc    Delete user
// @route   DELETE /api/admin/delete-user/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow self-deletion
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Instead of hard delete, deactivate the user
    await User.findByIdAndUpdate(id, { 
      isActive: false, 
      deactivatedBy: req.user.id,
      deactivatedAt: new Date()
    });

    // Send email notification about account deactivation (optional - don't fail if email fails)
    try {
      const deactivationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Account Deactivated</h1>
          <p>Dear ${user.firstName} ${user.lastName},</p>
          <p>Your Employee Management System account has been deactivated by the system administrator.</p>
          <p>If you believe this is an error or need to reactivate your account, please contact the HR department or system administrator.</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            For assistance, contact: contactsanket1@gmail.com
          </p>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject: 'Account Deactivated - Employee Management System',
        html: deactivationHtml
      });
    } catch (emailError) {
      console.log('Email notification failed, but user deletion succeeded:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
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

// @desc    Reset user password
// @route   POST /api/admin/reset-password/:id
// @access  Private/Admin
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new password
    const newPassword = generateRandomPassword();

    // Update user password
    user.password = newPassword;
    await user.save();

    // Send email with new password (optional - don't fail if email fails)
    try {
      const resetHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4f46e5;">Password Reset - Employee Management System</h1>
          <p>Dear ${user.firstName} ${user.lastName},</p>
          <p>Your password has been reset by the system administrator.</p>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">New Login Credentials:</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>New Password:</strong> <code style="background-color: #fee2e2; padding: 2px 6px; border-radius: 4px;">${newPassword}</code></p>
            <p style="color: #991b1b; font-size: 14px; margin-top: 10px;">
              ⚠️ <strong>Important:</strong> Please change this password after logging in for security.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Login with New Password
            </a>
          </div>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject: 'Password Reset - Employee Management System',
        html: resetHtml
      });
    } catch (emailError) {
      console.log('Email notification failed for password reset:', emailError.message);
    }

    // Create notification
    try {
      await Notification.create({
        title: 'Password Reset',
        message: `Your password has been reset by ${req.user.firstName} ${req.user.lastName}. Check your email for the new password.`,
        type: 'warning',
        sender: req.user.id,
        recipients: [{
          user: id,
          isRead: false
        }],
        priority: 'High',
        category: 'system'
      });
    } catch (notificationError) {
      console.log('Notification creation failed for password reset:', notificationError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully and sent via email'
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

    if (!user.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'User is already not approved'
      });
    }

    // Remove approval status
    user.isApproved = false;
    user.approvedBy = null;
    user.approvedAt = null;
    await user.save();

    // Create notification for the user
    await Notification.create({
      title: 'Account Approval Removed',
      message: `Your account approval has been removed by ${req.user.firstName} ${req.user.lastName}. Please contact the administrator for more information.`,
      type: 'warning',
      sender: req.user.id,
      recipients: [{
        user: user._id,
        isRead: false
      }],
      priority: 'High',
      category: 'approval'
    });

    // Send removal email
    const removalHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f59e0b;">Account Approval Removed</h1>
        <p>Dear ${user.firstName} ${user.lastName},</p>
        <p>We regret to inform you that your Employee Management System account approval has been removed by the administrator.</p>
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #d97706; margin-top: 0;">Account Status:</h3>
          <ul>
            <li><strong>Employee ID:</strong> ${user.employeeId}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Status:</strong> Approval Removed</li>
            <li><strong>Action by:</strong> ${req.user.firstName} ${req.user.lastName}</li>
          </ul>
        </div>
        <p>Please contact the administrator for more information or to request re-approval.</p>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          If you have any questions, please contact the HR department or system administrator.
        </p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Account Approval Removed - Employee Management System',
      html: removalHtml
    });

    res.status(200).json({
      success: true,
      message: 'User approval removed successfully',
      data: user
    });
  } catch (error) {
    console.error('Remove approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing user approval',
      error: error.message
    });
  }
};
