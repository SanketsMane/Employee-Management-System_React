const Leave = require('../models/Leave');
const User = require('../models/User');
const Log = require('../models/Log');
const { sendLeaveNotification } = require('../utils/emailService');
const { sendQuickSMS, sendNotification } = require('../utils/smsService');

// @desc    Submit leave request
// @route   POST /api/leaves
// @access  Private
exports.submitLeaveRequest = async (req, res) => {
  console.log('📝 SUBMIT LEAVE REQUEST - Request Body:', req.body);
  console.log('📝 SUBMIT LEAVE REQUEST - Files:', req.files);
  console.log('📝 SUBMIT LEAVE REQUEST - User:', req.user._id);
  
  try {
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      emergencyContact,
      handoverNotes,
      isHalfDay,
      halfDaySession
    } = req.body;
    
    const userId = req.user._id;

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Find the current user details
    const currentUser = await User.findById(userId)
      .populate('manager', '_id firstName lastName email')
      .populate('teamLead', '_id firstName lastName email');

    // Find all potential recipients (Admin, HR, Manager)
    const recipients = await User.find({ 
      role: { $in: ['Admin', 'HR', 'Manager'] }, 
      isActive: true 
    }).select('_id firstName lastName email role');

    console.log('🎯 Found recipients:', recipients);

    // If user has a direct manager, include them
    if (currentUser.manager) {
      const managerExists = recipients.find(r => r._id.toString() === currentUser.manager._id.toString());
      if (!managerExists) {
        recipients.push(currentUser.manager);
        console.log('➕ Added direct manager:', currentUser.manager);
      }
    }

    console.log('📋 Final recipients list:', recipients);

    if (recipients.length === 0) {
      console.log('❌ No recipients found - returning error');
      return res.status(400).json({
        success: false,
        message: 'No Admin, HR, or Manager found to send the request to'
      });
    }

    // For now, pick the first Admin or HR user as the primary recipient
    // Later, we can create multiple leave records for multiple approvers
    const primaryRecipient = recipients.find(r => r.role === 'Admin') || 
                             recipients.find(r => r.role === 'HR') || 
                             recipients[0];

    console.log('🎯 Selected primary recipient:', primaryRecipient);

    // Check for overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      employee: userId,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for overlapping dates'
      });
    }

    // Calculate total days
    const timeDiff = end.getTime() - start.getTime();
    let totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    
    if (isHalfDay && totalDays === 1) {
      totalDays = 0.5;
    }

    // Create leave request
    const leaveData = {
      employee: userId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason: reason.trim(),
      recipient: primaryRecipient._id,
      recipientRole: primaryRecipient.role,
      emergencyContact,
      handoverNotes: handoverNotes?.trim(),
      isHalfDay: isHalfDay || false,
      halfDaySession
    };

    const leave = await Leave.create(leaveData);
    const populatedLeave = await Leave.findById(leave._id)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('recipient', 'firstName lastName email');

    // Send notification email to recipient
    await sendLeaveNotification(leave, 'new_request');

    // Send notifications to all Admin/HR/Manager users for visibility
    const notificationPromises = recipients.map(async (recipient) => {
      if (recipient._id.toString() !== primaryRecipient._id.toString()) {
        // Create a notification or log entry for other admins/managers
        await Log.create({
          user: recipient._id,
          action: 'Leave Request Notification',
          category: 'Leave',
          details: `New leave request from ${currentUser.firstName} ${currentUser.lastName} for ${leaveType} (${totalDays} days)`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
          metadata: { leaveId: leave._id, notificationType: 'copy' }
        });
      }
    });
    
    await Promise.all(notificationPromises);

    // Log the leave request
    await Log.create({
      user: userId,
      action: 'Leave Request Submitted',
      category: 'Leave',
      details: `Employee submitted ${leaveType} request for ${totalDays} days (${start.toDateString()} to ${end.toDateString()})`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: { leaveId: leave._id, recipientRole: primaryRecipient.role }
    });

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: { leave: populatedLeave }
    });
  } catch (error) {
    console.error('Submit leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting leave request',
      error: error.message
    });
  }
};

// @desc    Get leave requests
// @route   GET /api/leaves
// @desc    Get leave requests
// @route   GET /api/leaves  
// @access  Private
exports.getLeaveRequests = async (req, res) => {
  console.log('📋 GET LEAVE REQUESTS - User:', req.user.firstName, req.user.lastName, 'Role:', req.user.role);
  console.log('📋 GET LEAVE REQUESTS - Query params:', req.query);
  
  try {
    const { 
      employeeId, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10,
      leaveType,
      department
    } = req.query;
    
    const userId = req.user._id;
    const userRole = req.user.role;

    // Build query
    let query = {};
    
    // First, let's see how many total leave records exist
    const totalLeaveCount = await Leave.countDocuments();
    console.log('🗄️ Total leave records in database:', totalLeaveCount);
    
    // Role-based access control
    if (['Admin', 'HR'].includes(userRole)) {
      // Admin and HR can view all leave requests
      if (employeeId) {
        query.employee = employeeId;
      }
    } else if (userRole === 'Manager') {
      // Managers can view requests from their team members or requests sent to them OR their own requests
      if (employeeId) {
        const employee = await User.findById(employeeId);
        if (!employee || (employee.manager?.toString() !== userId.toString() && employee._id.toString() !== userId.toString())) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this employee\'s leave requests'
          });
        }
        query.employee = employeeId;
      } else {
        // Get requests from team members or requests sent to this manager OR their own requests
        const teamMembers = await User.find({ manager: userId }).select('_id');
        query.$or = [
          { employee: { $in: teamMembers.map(member => member._id) } },
          { recipient: userId },
          { employee: userId }  // Add their own requests
        ];
      }
    } else if (userRole === 'Team Lead') {
      // Team leads can view requests from their team members or requests sent to them OR their own requests
      if (employeeId) {
        const employee = await User.findById(employeeId);
        if (!employee || (employee.teamLead?.toString() !== userId.toString() && employee._id.toString() !== userId.toString())) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this employee\'s leave requests'
          });
        }
        query.employee = employeeId;
      } else {
        // Get requests from team members or requests sent to this team lead OR their own requests
        const teamMembers = await User.find({ teamLead: userId }).select('_id');
        query.$or = [
          { employee: { $in: teamMembers.map(member => member._id) } },
          { recipient: userId },
          { employee: userId }  // Add their own requests
        ];
      }
    } else {
      // Regular employees can only view their own requests
      query.employee = userId;
    }

    // Additional filters
    if (status) {
      query.status = status;
    }

    if (leaveType) {
      query.leaveType = leaveType;
    }

    // Date range filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get leave requests with employee data
    console.log('🔍 Final query for database:', JSON.stringify(query, null, 2));
    let leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName employeeId department role')
      .populate('recipient', 'firstName lastName role')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    console.log('📊 Database returned:', leaves.length, 'leaves');
    if (leaves.length > 0) {
      console.log('📝 Sample leave record:', leaves[0]);
    }

    // Apply department filter after population
    if (department) {
      leaves = leaves.filter(leave => leave.employee.department === department);
    }

    // Apply pagination after filtering
    const total = leaves.length;
    leaves = leaves.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      data: { leaves }
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests',
      error: error.message
    });
  }
};

// @desc    Get leave request by ID
// @route   GET /api/leaves/:id
// @access  Private
exports.getLeaveRequest = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    const leave = await Leave.findById(leaveId)
      .populate('employee', 'firstName lastName employeeId department manager teamLead')
      .populate('recipient', 'firstName lastName role')
      .populate('approvedBy', 'firstName lastName');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check access permissions
    const canAccess = 
      ['Admin', 'HR'].includes(userRole) ||
      leave.employee._id.toString() === userId.toString() ||
      leave.recipient._id.toString() === userId.toString() ||
      (userRole === 'Manager' && leave.employee.manager?.toString() === userId.toString()) ||
      (userRole === 'Team Lead' && leave.employee.teamLead?.toString() === userId.toString());

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this leave request'
      });
    }

    res.status(200).json({
      success: true,
      data: { leave }
    });
  } catch (error) {
    console.error('Get leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave request',
      error: error.message
    });
  }
};

// @desc    Approve or reject leave request
// @route   PUT /api/leaves/:id/status
// @access  Private (HR, Manager, Team Lead, Admin)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { status, rejectionReason } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!['HR', 'Manager', 'Team Lead', 'Admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve/reject leave requests'
      });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Approved or Rejected'
      });
    }

    if (status === 'Rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting a leave request'
      });
    }

    const leave = await Leave.findById(leaveId)
      .populate('employee', 'firstName lastName email phone manager teamLead');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request has already been ${leave.status.toLowerCase()}`
      });
    }

    // Check if user has permission to approve this request
    if (!['Admin', 'HR'].includes(userRole)) {
      const hasPermission = 
        leave.recipient.toString() === userId.toString() ||
        (userRole === 'Manager' && leave.employee.manager?.toString() === userId.toString()) ||
        (userRole === 'Team Lead' && leave.employee.teamLead?.toString() === userId.toString());

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to approve/reject this leave request'
        });
      }
    }

    // Update leave request
    leave.status = status;
    leave.approvedBy = userId;
    leave.approvedDate = new Date();
    
    if (status === 'Rejected') {
      leave.rejectionReason = rejectionReason.trim();
    }

    await leave.save();

    // Send email notification to employee
    await sendLeaveNotification(leave, 'status_update');

    // Send SMS notification to employee if phone number is available
    if (leave.employee.phone) {
      const leaveDates = `${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}`;
      
      if (status === 'Approved') {
        await sendQuickSMS.leaveApproved(
          leave.employee.phone,
          leave.employee.firstName,
          leave.leaveType,
          leaveDates
        );
      } else if (status === 'Rejected') {
        await sendQuickSMS.leaveRejected(
          leave.employee.phone,
          leave.employee.firstName,
          leave.leaveType,
          leaveDates
        );
      }
      
      console.log(`📱 SMS notification sent to ${leave.employee.firstName} (${leave.employee.phone})`);
    }

    // Log the action
    await Log.create({
      user: userId,
      action: `Leave Request ${status}`,
      category: 'Leave',
      details: `${userRole} ${status.toLowerCase()} leave request for ${leave.employee.firstName} ${leave.employee.lastName} (${leave.leaveType} - ${leave.totalDays} days)`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: { leaveId, previousStatus: 'Pending', newStatus: status }
    });

    const updatedLeave = await Leave.findById(leaveId)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('recipient', 'firstName lastName role')
      .populate('approvedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: { leave: updatedLeave }
    });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave request status',
      error: error.message
    });
  }
};

// @desc    Cancel leave request
// @route   PUT /api/leaves/:id/cancel
// @access  Private (Employee who submitted the request)
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const userId = req.user._id;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Only the employee who submitted the request can cancel it
    if (leave.employee.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this leave request'
      });
    }

    // Can only cancel pending requests
    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a leave request that has been ${leave.status.toLowerCase()}`
      });
    }

    leave.status = 'Cancelled';
    await leave.save();

    // Log the cancellation
    await Log.create({
      user: userId,
      action: 'Leave Request Cancelled',
      category: 'Leave',
      details: `Employee cancelled ${leave.leaveType} request for ${leave.totalDays} days`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: { leaveId }
    });

    const updatedLeave = await Leave.findById(leaveId)
      .populate('employee', 'firstName lastName employeeId')
      .populate('recipient', 'firstName lastName role');

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: { leave: updatedLeave }
    });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling leave request',
      error: error.message
    });
  }
};

// @desc    Get leave statistics
// @route   GET /api/leaves/stats
// @access  Private
exports.getLeaveStats = async (req, res) => {
  try {
    const { employeeId, period = '365' } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Determine target employee
    let targetUserId = userId;
    if (employeeId && ['Admin', 'HR', 'Manager', 'Team Lead'].includes(userRole)) {
      targetUserId = employeeId;
      
      // Additional permission check for Manager and Team Lead
      if (['Manager', 'Team Lead'].includes(userRole)) {
        const employee = await User.findById(employeeId);
        const hasAccess = userRole === 'Manager' 
          ? employee?.manager?.toString() === userId.toString()
          : employee?.teamLead?.toString() === userId.toString();
          
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this employee\'s leave statistics'
          });
        }
      }
    }

    const daysBack = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const leaves = await Leave.find({
      employee: targetUserId,
      createdAt: { $gte: startDate }
    });

    // Calculate statistics
    const totalRequests = leaves.length;
    const approvedRequests = leaves.filter(l => l.status === 'Approved').length;
    const rejectedRequests = leaves.filter(l => l.status === 'Rejected').length;
    const pendingRequests = leaves.filter(l => l.status === 'Pending').length;
    const cancelledRequests = leaves.filter(l => l.status === 'Cancelled').length;

    const totalDaysRequested = leaves.reduce((sum, l) => sum + l.totalDays, 0);
    const totalDaysApproved = leaves.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.totalDays, 0);

    const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

    // Leave type breakdown
    const leaveTypeBreakdown = {};
    leaves.forEach(leave => {
      if (!leaveTypeBreakdown[leave.leaveType]) {
        leaveTypeBreakdown[leave.leaveType] = {
          count: 0,
          totalDays: 0,
          approved: 0
        };
      }
      leaveTypeBreakdown[leave.leaveType].count++;
      leaveTypeBreakdown[leave.leaveType].totalDays += leave.totalDays;
      if (leave.status === 'Approved') {
        leaveTypeBreakdown[leave.leaveType].approved++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        period: `${daysBack} days`,
        totalRequests,
        approvedRequests,
        rejectedRequests,
        pendingRequests,
        cancelledRequests,
        totalDaysRequested,
        totalDaysApproved,
        approvalRate: parseFloat(approvalRate.toFixed(2)),
        leaveTypeBreakdown
      }
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave statistics',
      error: error.message
    });
  }
};

// @desc    Get leave balance
// @route   GET /api/leaves/balance
// @access  Private
exports.getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Determine target employee
    let targetUserId = userId;
    if (employeeId && ['Admin', 'HR', 'Manager', 'Team Lead'].includes(userRole)) {
      targetUserId = employeeId;
      
      // Additional permission check for Manager and Team Lead
      if (['Manager', 'Team Lead'].includes(userRole)) {
        const employee = await User.findById(employeeId);
        const hasAccess = userRole === 'Manager' 
          ? employee?.manager?.toString() === userId.toString()
          : employee?.teamLead?.toString() === userId.toString();
          
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this employee\'s leave balance'
          });
        }
      }
    }

    // Calculate leave balance for current year
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    const approvedLeaves = await Leave.find({
      employee: targetUserId,
      status: 'Approved',
      startDate: { $gte: yearStart, $lte: yearEnd }
    });

    // Standard leave allocations (can be made configurable)
    const leaveAllocations = {
      'Casual Leave': 10,
      'Sick Leave': 10,
      'Vacation': 15,
      'Personal': 5,
      'Emergency': 3,
      'Maternity': 90,  // Only for eligible employees
      'Paternity': 15   // Only for eligible employees
    };

    // Calculate used leaves by type
    const usedLeaves = {};
    Object.keys(leaveAllocations).forEach(type => {
      usedLeaves[type] = approvedLeaves
        .filter(leave => leave.leaveType === type)
        .reduce((sum, leave) => sum + leave.totalDays, 0);
    });

    // Calculate remaining leaves
    const remainingLeaves = {};
    Object.keys(leaveAllocations).forEach(type => {
      remainingLeaves[type] = Math.max(0, leaveAllocations[type] - usedLeaves[type]);
    });

    const totalAllocated = Object.values(leaveAllocations).reduce((sum, days) => sum + days, 0);
    const totalUsed = Object.values(usedLeaves).reduce((sum, days) => sum + days, 0);
    const totalRemaining = Object.values(remainingLeaves).reduce((sum, days) => sum + days, 0);

    res.status(200).json({
      success: true,
      data: {
        year: currentYear,
        totalAllocated,
        totalUsed,
        totalRemaining,
        leaveAllocations,
        usedLeaves,
        remainingLeaves,
        utilizationRate: totalAllocated > 0 ? parseFloat(((totalUsed / totalAllocated) * 100).toFixed(2)) : 0
      }
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave balance',
      error: error.message
    });
  }
};
