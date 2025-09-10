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
    const { status, rejectionReason, adminMessage } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log('🔄 UPDATING LEAVE STATUS:', {
      leaveId,
      status,
      rejectionReason,
      adminMessage,
      userId,
      userRole
    });

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
      .populate('employee', 'firstName lastName email phone manager teamLead department')
      .populate('approvedBy', 'firstName lastName email');

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

    // Get approver details
    const approver = await User.findById(userId).select('firstName lastName email role');

    // Update leave request
    leave.status = status;
    leave.approvedBy = userId;
    leave.approvedDate = new Date();
    
    if (status === 'Rejected') {
      leave.rejectionReason = rejectionReason.trim();
    }

    // Add admin message if provided
    if (adminMessage) {
      leave.adminMessage = adminMessage.trim();
    }

    await leave.save();

    // Enhanced email notification with more details
    try {
      const emailData = {
        leave,
        employee: leave.employee,
        approver,
        status,
        rejectionReason,
        adminMessage,
        leaveDetails: {
          leaveType: leave.leaveType,
          startDate: leave.startDate.toDateString(),
          endDate: leave.endDate.toDateString(),
          totalDays: leave.totalDays,
          reason: leave.reason
        }
      };

      await sendLeaveNotification(emailData, 'status_update');
      console.log('✅ Email notification sent successfully');
    } catch (emailError) {
      console.error('❌ Email notification failed:', emailError);
    }

    // Enhanced SMS notification
    if (leave.employee.phone) {
      const leaveDates = `${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}`;
      
      try {
        if (status === 'Approved') {
          await sendQuickSMS.leaveApproved(
            leave.employee.phone,
            leave.employee.firstName,
            leave.leaveType,
            leaveDates,
            approver.firstName + ' ' + approver.lastName
          );
        } else if (status === 'Rejected') {
          await sendQuickSMS.leaveRejected(
            leave.employee.phone,
            leave.employee.firstName,
            leave.leaveType,
            leaveDates,
            rejectionReason
          );
        }
        
        console.log(`📱 SMS notification sent to ${leave.employee.firstName} (${leave.employee.phone})`);
      } catch (smsError) {
        console.error('❌ SMS notification failed:', smsError);
      }
    }

    // Log the action
    await Log.create({
      user: userId,
      action: `Leave ${status.toLowerCase()}`,
      category: 'Leave',
      details: `Leave ${status.toLowerCase()}: ${leave.leaveType} from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}${rejectionReason ? ` - Reason: ${rejectionReason}` : ''}`,
      ipAddress: req.ip,
      method: 'PUT',
      endpoint: '/api/leave/update-status',
      success: true,
      metadata: {
        leaveId: leave._id,
        targetUser: leave.employee._id,
        status,
        rejectionReason,
        adminMessage
      }
    });

    // Populate the updated leave with all necessary fields
    const updatedLeave = await Leave.findById(leaveId)
      .populate('employee', 'firstName lastName email department role')
      .populate('approvedBy', 'firstName lastName email role');

    res.status(200).json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: updatedLeave
    });

  } catch (error) {
    console.error('❌ Update leave status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave status',
      error: error.message
    });
  }
};

// @desc    Get all leave requests with advanced filtering
// @route   GET /api/leaves/admin/all
// @access  Private (Admin, HR, Manager)
exports.getAllLeavesAdmin = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      employeeName,
      employeeId,
      department, 
      leaveType,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const userRole = req.user.role;
    const userId = req.user._id;

    // Check permissions
    if (!['Admin', 'HR', 'Manager'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin, HR, or Manager role required.'
      });
    }

    console.log('📊 GET ALL LEAVES ADMIN - User:', req.user.firstName, req.user.lastName, 'Role:', userRole);
    console.log('📊 Query params:', req.query);

    // Build aggregation pipeline
    let pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: '$employeeData' },
      {
        $lookup: {
          from: 'users',
          localField: 'approvedBy',
          foreignField: '_id',
          as: 'approverData'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'recipient',
          foreignField: '_id',
          as: 'recipientData'
        }
      }
    ];

    // Build match conditions
    let matchConditions = {
      'employeeData.isActive': true
    };

    // Role-based filtering
    if (userRole === 'Manager') {
      // Managers can only see their team members' leaves
      const teamMembers = await User.find({ manager: userId }).select('_id');
      const teamMemberIds = teamMembers.map(member => member._id);
      teamMemberIds.push(userId); // Include manager's own leaves
      
      matchConditions['employeeData._id'] = { $in: teamMemberIds };
    }

    // Apply filters
    if (startDate && endDate) {
      matchConditions.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      matchConditions.startDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchConditions.startDate = { $lte: new Date(endDate) };
    }

    if (status && status !== 'all') {
      matchConditions.status = status;
    }

    if (employeeId) {
      matchConditions['employeeData._id'] = new mongoose.Types.ObjectId(employeeId);
    }

    if (department && department !== 'all') {
      matchConditions['employeeData.department'] = department;
    }

    if (leaveType && leaveType !== 'all') {
      matchConditions.leaveType = leaveType;
    }

    if (employeeName) {
      matchConditions.$or = [
        { 'employeeData.firstName': { $regex: employeeName, $options: 'i' } },
        { 'employeeData.lastName': { $regex: employeeName, $options: 'i' } },
        { 
          $expr: {
            $regexMatch: {
              input: { $concat: ['$employeeData.firstName', ' ', '$employeeData.lastName'] },
              regex: employeeName,
              options: 'i'
            }
          }
        }
      ];
    }

    pipeline.push({ $match: matchConditions });

    // Add sorting
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortField = sortBy === 'employeeName' ? 'employeeData.firstName' : sortBy;
    pipeline.push({ $sort: { [sortField]: sortDirection } });

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Leave.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Add projection to format output
    pipeline.push({
      $project: {
        _id: 1,
        leaveType: 1,
        startDate: 1,
        endDate: 1,
        totalDays: 1,
        reason: 1,
        status: 1,
        approvedDate: 1,
        rejectionReason: 1,
        adminMessage: 1,
        createdAt: 1,
        updatedAt: 1,
        employee: {
          _id: '$employeeData._id',
          firstName: '$employeeData.firstName',
          lastName: '$employeeData.lastName',
          email: '$employeeData.email',
          department: '$employeeData.department',
          role: '$employeeData.role',
          employeeId: '$employeeData.employeeId'
        },
        approver: {
          $cond: {
            if: { $gt: [{ $size: '$approverData' }, 0] },
            then: {
              _id: { $arrayElemAt: ['$approverData._id', 0] },
              firstName: { $arrayElemAt: ['$approverData.firstName', 0] },
              lastName: { $arrayElemAt: ['$approverData.lastName', 0] },
              role: { $arrayElemAt: ['$approverData.role', 0] }
            },
            else: null
          }
        },
        recipient: {
          $cond: {
            if: { $gt: [{ $size: '$recipientData' }, 0] },
            then: {
              _id: { $arrayElemAt: ['$recipientData._id', 0] },
              firstName: { $arrayElemAt: ['$recipientData.firstName', 0] },
              lastName: { $arrayElemAt: ['$recipientData.lastName', 0] },
              role: { $arrayElemAt: ['$recipientData.role', 0] }
            },
            else: null
          }
        }
      }
    });

    const leaves = await Leave.aggregate(pipeline);

    // Calculate pagination info
    const pages = Math.ceil(total / parseInt(limit));

    console.log(`✅ Found ${leaves.length} leaves (${total} total)`);

    res.status(200).json({
      success: true,
      data: {
        leaves,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        }
      },
      total
    });

  } catch (error) {
    console.error('❌ Error fetching admin leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests',
      error: error.message
    });
  }
};
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

// Get all leaves for admin with advanced filtering
exports.getAllLeavesAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      employeeName,
      employeeId,
      department,
      leaveType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = {};

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    // Leave type filter
    if (leaveType && leaveType !== 'all') {
      filter.leaveType = leaveType;
    }

    // Employee filter
    if (employeeId) {
      filter.employee = employeeId;
    }

    console.log('🔍 Admin filter:', filter);

    // Build aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $lookup: {
          from: 'users',
          localField: 'approvedBy',
          foreignField: '_id',
          as: 'approver'
        }
      },
      {
        $unwind: {
          path: '$approver',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Apply filters after lookup
    const matchFilters = { ...filter };

    // Employee name filter (after lookup)
    if (employeeName) {
      matchFilters.$or = [
        { 'employee.firstName': { $regex: employeeName, $options: 'i' } },
        { 'employee.lastName': { $regex: employeeName, $options: 'i' } }
      ];
    }

    // Department filter (after lookup)
    if (department && department !== 'all') {
      matchFilters['employee.department'] = department;
    }

    if (Object.keys(matchFilters).length > 0) {
      pipeline.push({ $match: matchFilters });
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortOptions });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Execute aggregation
    const leaves = await Leave.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [...pipeline];
    countPipeline.pop(); // Remove limit
    countPipeline.pop(); // Remove skip
    countPipeline.push({ $count: 'total' });
    
    const countResult = await Leave.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    console.log('✅ Found leaves:', leaves.length, 'Total:', total);

    res.json({
      success: true,
      data: {
        leaves,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      total
    });

  } catch (error) {
    console.error('❌ Error fetching admin leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message
    });
  }
};

// Get employee's own leaves with filtering
exports.getMyLeaves = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      leaveType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = { employee: req.user._id };

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    // Leave type filter
    if (leaveType && leaveType !== 'all') {
      filter.leaveType = leaveType;
    }

    console.log('🔍 Employee filter:', filter);

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $lookup: {
          from: 'users',
          localField: 'approvedBy',
          foreignField: '_id',
          as: 'approver'
        }
      },
      {
        $unwind: {
          path: '$approver',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortOptions });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Execute aggregation
    const leaves = await Leave.aggregate(pipeline);

    // Get total count for pagination
    const total = await Leave.countDocuments(filter);

    console.log('✅ Found employee leaves:', leaves.length, 'Total:', total);

    res.json({
      success: true,
      data: {
        leaves,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      total
    });

  } catch (error) {
    console.error('❌ Error fetching employee leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your leave requests',
      error: error.message
    });
  }
};

// Apply for leave (enhanced)
exports.applyForLeave = async (req, res) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      halfDay = false,
      halfDayPeriod = 'morning',
      totalDays
    } = req.body;

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

    // Calculate total days if not provided
    let calculatedDays = totalDays;
    if (!calculatedDays) {
      const timeDiff = end.getTime() - start.getTime();
      calculatedDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      if (halfDay) {
        calculatedDays = 0.5;
      }
    }

    // Find appropriate recipient (HR or Admin)
    let recipient = await User.findOne({ role: 'HR', isActive: true });
    if (!recipient) {
      recipient = await User.findOne({ role: 'Admin', isActive: true });
    }

    if (!recipient) {
      return res.status(500).json({
        success: false,
        message: 'No available HR or Admin to process leave request'
      });
    }

    // Create leave request
    const leave = new Leave({
      employee: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
      totalDays: calculatedDays,
      isHalfDay: halfDay,
      halfDaySession: halfDay ? (halfDayPeriod === 'morning' ? 'Morning' : 'Afternoon') : undefined,
      recipient: recipient._id,
      recipientRole: recipient.role,
      status: 'Pending'
    });

    await leave.save();

    // Populate employee data
    await leave.populate('employee', 'firstName lastName email department role');

    console.log('✅ Leave application submitted:', leave._id);

    // Send notification email to managers/HR
    try {
      const admins = await User.find({ 
        role: { $in: ['Admin', 'HR', 'Manager'] } 
      }).select('firstName lastName email');

      const emailService = require('../utils/emailService');
      for (const admin of admins) {
        await emailService.sendLeaveApplicationEmail(admin, leave);
      }
    } catch (emailError) {
      console.error('❌ Failed to send application email:', emailError);
    }

    // Log the action
    await Log.create({
      user: req.user._id,
      action: 'Leave application submitted',
      category: 'Leave',
      details: `Leave application: ${leave.leaveType} from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} (${leave.totalDays} days)`,
      ipAddress: req.ip,
      method: 'POST',
      endpoint: '/api/leave/apply',
      success: true
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave
    });

  } catch (error) {
    console.error('❌ Error applying for leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave application',
      error: error.message
    });
  }
};

// Cancel leave application (employee only)
exports.cancelLeaveApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the leave request
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if the leave belongs to the current user
    if (leave.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave requests'
      });
    }

    // Check if leave can be cancelled (only pending leaves)
    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be cancelled'
      });
    }

    // Update leave status to cancelled
    leave.status = 'Cancelled';
    leave.cancelledAt = new Date();
    await leave.save();

    console.log('✅ Leave cancelled:', leave._id);

    // Send notification email to employee
    const emailService = require('../utils/emailService');
    try {
      await emailService.sendLeaveCancellationEmail(req.user, leave);
    } catch (emailError) {
      console.error('❌ Failed to send cancellation email:', emailError);
    }

    // Log the action
    await Log.create({
      user: req.user._id,
      action: 'Leave application cancelled',
      category: 'Leave',
      details: `Leave cancelled: ${leave.leaveType} from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}`,
      ipAddress: req.ip,
      method: 'POST',
      endpoint: '/api/leave/cancel',
      success: true,
      metadata: { leaveId: leave._id }
    });

    res.json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: leave
    });

  } catch (error) {
    console.error('❌ Error cancelling leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel leave request',
      error: error.message
    });
  }
};
