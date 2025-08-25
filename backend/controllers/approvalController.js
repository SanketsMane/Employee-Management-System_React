const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');

// @desc    Get pending approval users
// @route   GET /api/admin/pending-approvals
// @access  Private/Admin
exports.getPendingApprovals = async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      isApproved: false,
      role: { $ne: 'Admin' }
    })
    .select('-password')
    .populate('manager', 'firstName lastName')
    .populate('teamLead', 'firstName lastName')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message
    });
  }
};

// @desc    Approve user
// @route   PUT /api/admin/approve-user/:id
// @access  Private/Admin
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

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

    // Update user approval status
    user.isApproved = true;
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();
    await user.save();

    // Create notification for the approved user
    await Notification.create({
      title: 'Account Approved',
      message: `Your account has been approved by ${req.user.firstName} ${req.user.lastName}. You can now login to the system.`,
      type: 'success',
      sender: req.user.id,
      recipients: [{
        user: user._id,
        isRead: false
      }],
      priority: 'High',
      category: 'approval'
    });

    // Send approval email
    const approvalHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #10b981;">Account Approved!</h1>
        <p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Great news! Your Employee Management System account has been approved by the admin.</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">Account Details:</h3>
          <ul>
            <li><strong>Employee ID:</strong> ${user.employeeId}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Role:</strong> ${user.role}</li>
            <li><strong>Department:</strong> ${user.department}</li>
            <li><strong>Approved by:</strong> ${req.user.firstName} ${req.user.lastName}</li>
          </ul>
        </div>
        ${comments ? `<p><strong>Admin Comments:</strong> ${comments}</p>` : ''}
        <p>You can now login to your dashboard and start using the system.</p>
        <a href="${process.env.FRONTEND_URL}/login" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Login Now</a>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Account Approved - Employee Management System',
      html: approvalHtml
    });

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: user
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

// @desc    Reject user
// @route   PUT /api/admin/reject-user/:id
// @access  Private/Admin
exports.rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

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
        message: 'Cannot reject an already approved user'
      });
    }

    // Update user with rejection details
    user.rejectionReason = reason;
    user.isActive = false;
    await user.save();

    // Create notification for the rejected user
    await Notification.create({
      title: 'Account Registration Rejected',
      message: `Your account registration has been rejected. Reason: ${reason}`,
      type: 'error',
      sender: req.user.id,
      recipients: [{
        user: user._id,
        isRead: false
      }],
      priority: 'High',
      category: 'approval'
    });

    // Send rejection email
    const rejectionHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #ef4444;">Account Registration Rejected</h1>
        <p>Dear ${user.firstName} ${user.lastName},</p>
        <p>We regret to inform you that your Employee Management System account registration has been rejected.</p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="color: #dc2626; margin-top: 0;">Rejection Reason:</h3>
          <p style="margin-bottom: 0;">${reason}</p>
        </div>
        <p>If you believe this is an error or would like to reapply, please contact the HR department or system administrator.</p>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          For assistance, contact: contactsanket1@gmail.com
        </p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Account Registration Rejected - Employee Management System',
      html: rejectionHtml
    });

    res.status(200).json({
      success: true,
      message: 'User rejected successfully'
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting user',
      error: error.message
    });
  }
};
