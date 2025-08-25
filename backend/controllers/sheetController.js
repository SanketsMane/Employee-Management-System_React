const WorkSheet = require('../models/WorkSheet');
const User = require('../models/User');
const Log = require('../models/Log');
const mongoose = require('mongoose');

// @desc    Create or update worksheet
// @route   POST /api/worksheets
// @access  Private
exports.createOrUpdateWorksheet = async (req, res) => {
  try {
    const { timeSlots, date } = req.body;
    const userId = req.user._id;
    
    // Use today's date if not provided
    const worksheetDate = date ? new Date(date) : new Date();
    worksheetDate.setHours(0, 0, 0, 0);

    // Validate time slots
    if (!timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({
        success: false,
        message: 'Time slots are required and must be an array'
      });
    }

    // Validate each time slot
    for (const slot of timeSlots) {
      if (!slot.hour || slot.hour < 9 || slot.hour > 19) {
        return res.status(400).json({
          success: false,
          message: 'Hour must be between 9 and 19 (9 AM to 7 PM)'
        });
      }
      if (!slot.task || slot.task.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Task description is required for each time slot'
        });
      }
    }

    try {
      // Try to find existing worksheet for the date
      let worksheet = await WorkSheet.findOne({
        employee: userId,
        date: worksheetDate
      });

      const worksheetData = {
        employee: userId,
        date: worksheetDate,
        timeSlots: timeSlots.map(slot => ({
          hour: slot.hour,
          task: slot.task.trim(),
          project: slot.project || '',
          priority: slot.priority || 'Medium',
          status: slot.status || 'Planned',
          notes: slot.notes || ''
        }))
      };

      if (worksheet) {
        // Update existing worksheet
        worksheet = await WorkSheet.findByIdAndUpdate(
          worksheet._id,
          worksheetData,
          { new: true, runValidators: true }
        ).populate('employee', 'firstName lastName employeeId');

        // Log the update
        await Log.create({
          user: userId,
          action: 'Worksheet Updated',
          category: 'Worksheet',
          details: `Employee updated worksheet for ${worksheetDate.toDateString()}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true
        });

        res.status(200).json({
          success: true,
          message: 'Worksheet updated successfully',
          data: { worksheet }
        });
      } else {
        // Create new worksheet
        worksheet = await WorkSheet.create(worksheetData);
        worksheet = await WorkSheet.findById(worksheet._id)
          .populate('employee', 'firstName lastName employeeId');

        // Log the creation
        await Log.create({
          user: userId,
          action: 'Worksheet Created',
          category: 'Worksheet',
          details: `Employee created worksheet for ${worksheetDate.toDateString()}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true
        });

        res.status(201).json({
          success: true,
          message: 'Worksheet created successfully',
          data: { worksheet }
        });
      }
    } catch (duplicateError) {
      if (duplicateError.code === 11000) {
        // Handle duplicate key error - worksheet already exists for this date
        return res.status(400).json({
          success: false,
          message: 'Worksheet already exists for this date. Use update instead.'
        });
      }
      throw duplicateError;
    }
  } catch (error) {
    console.error('Create/Update worksheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating worksheet',
      error: error.message
    });
  }
};

// @desc    Get worksheets
// @route   GET /api/worksheets
// @access  Private
exports.getWorksheets = async (req, res) => {
  try {
    const { 
      employeeId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10,
      status,
      department,
      role
    } = req.query;
    
    const userId = req.user._id;
    const userRole = req.user.role;

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
        $match: {
          'employeeData.isActive': true
        }
      }
    ];

    // Role-based access control
    if (['Admin', 'HR'].includes(userRole)) {
      // Admin and HR can view all worksheets
      if (employeeId) {
        pipeline.push({
          $match: { employee: mongoose.Types.ObjectId(employeeId) }
        });
      }
    } else if (userRole === 'Manager') {
      // Managers can view their team members' worksheets
      if (employeeId) {
        const employee = await User.findById(employeeId);
        if (!employee || employee.manager?.toString() !== userId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this employee\'s worksheets'
          });
        }
        pipeline.push({
          $match: { employee: mongoose.Types.ObjectId(employeeId) }
        });
      } else {
        // Get all team members
        const teamMembers = await User.find({ manager: userId }).select('_id');
        pipeline.push({
          $match: { 
            employee: { $in: teamMembers.map(member => mongoose.Types.ObjectId(member._id)) }
          }
        });
      }
    } else if (userRole === 'Team Lead') {
      // Team leads can view their team members' worksheets
      if (employeeId) {
        const employee = await User.findById(employeeId);
        if (!employee || employee.teamLead?.toString() !== userId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this employee\'s worksheets'
          });
        }
        pipeline.push({
          $match: { employee: mongoose.Types.ObjectId(employeeId) }
        });
      } else {
        // Get all team members
        const teamMembers = await User.find({ teamLead: userId }).select('_id');
        pipeline.push({
          $match: { 
            employee: { $in: teamMembers.map(member => mongoose.Types.ObjectId(member._id)) }
          }
        });
      }
    } else {
      // Regular employees can only view their own worksheets
      pipeline.push({
        $match: { employee: userId }
      });
    }

    // Department filter
    if (department) {
      pipeline.push({
        $match: { 'employeeData.department': department }
      });
    }

    // Role filter
    if (role) {
      pipeline.push({
        $match: { 'employeeData.role': role }
      });
    }

    // Date range filter
    if (startDate || endDate) {
      let dateMatch = {};
      if (startDate) dateMatch.$gte = new Date(startDate);
      if (endDate) dateMatch.$lte = new Date(endDate);
      pipeline.push({
        $match: { date: dateMatch }
      });
    }

    // Status filter
    if (status) {
      pipeline.push({
        $match: { approvalStatus: status }
      });
    }

    // Add sorting and pagination
    pipeline.push(
      { $sort: { date: -1, 'employeeData.firstName': 1 } },
      { $skip: (page - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    );

    // Add projection to format the response
    pipeline.push({
      $project: {
        _id: 1,
        date: 1,
        timeSlots: 1,
        submittedAt: 1,
        approvalStatus: 1,
        approvedBy: 1,
        approvedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        employee: {
          _id: '$employeeData._id',
          firstName: '$employeeData.firstName',
          lastName: '$employeeData.lastName',
          employeeId: '$employeeData.employeeId',
          department: '$employeeData.department',
          role: '$employeeData.role',
          position: '$employeeData.position'
        }
      }
    });

    const worksheets = await WorkSheet.aggregate(pipeline);

    // Get total count for pagination
    let countPipeline = [...pipeline];
    countPipeline.pop(); // Remove limit
    countPipeline.pop(); // Remove skip
    countPipeline.pop(); // Remove sort
    countPipeline.push({ $count: 'total' });

    const totalResult = await WorkSheet.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      count: worksheets.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      data: { worksheets }
    });
  } catch (error) {
    console.error('Get worksheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching worksheets',
      error: error.message
    });
  }
};

// @desc    Get worksheet by ID
// @route   GET /api/worksheets/:id
// @access  Private
exports.getWorksheet = async (req, res) => {
  try {
    const worksheetId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    const worksheet = await WorkSheet.findById(worksheetId)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName');

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    // Check access permissions
    const canAccess = 
      ['Admin', 'HR'].includes(userRole) ||
      worksheet.employee._id.toString() === userId.toString() ||
      (userRole === 'Manager' && worksheet.employee.manager?.toString() === userId.toString()) ||
      (userRole === 'Team Lead' && worksheet.employee.teamLead?.toString() === userId.toString());

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this worksheet'
      });
    }

    res.status(200).json({
      success: true,
      data: { worksheet }
    });
  } catch (error) {
    console.error('Get worksheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching worksheet',
      error: error.message
    });
  }
};

// @desc    Get today's worksheet
// @route   GET /api/worksheets/today
// @access  Private
exports.getTodayWorksheet = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let worksheet = await WorkSheet.findOne({
      employee: userId,
      date: today
    }).populate('employee', 'firstName lastName employeeId');

    // If no worksheet exists, create a template with empty time slots
    if (!worksheet) {
      const timeSlots = [];
      for (let hour = 9; hour <= 18; hour++) {
        timeSlots.push({
          hour,
          task: '',
          project: '',
          priority: 'Medium',
          status: 'Planned',
          notes: ''
        });
      }

      worksheet = {
        employee: req.user,
        date: today,
        timeSlots,
        totalTasksPlanned: 0,
        totalTasksCompleted: 0,
        productivityScore: 0,
        isSubmitted: false,
        approvalStatus: 'Pending'
      };
    }

    res.status(200).json({
      success: true,
      data: { worksheet }
    });
  } catch (error) {
    console.error('Get today worksheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s worksheet',
      error: error.message
    });
  }
};

// @desc    Submit worksheet
// @route   PUT /api/worksheets/:id/submit
// @access  Private
exports.submitWorksheet = async (req, res) => {
  try {
    const worksheetId = req.params.id;
    const userId = req.user._id;

    const worksheet = await WorkSheet.findById(worksheetId);

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    // Check if user owns this worksheet
    if (worksheet.employee.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this worksheet'
      });
    }

    if (worksheet.isSubmitted) {
      return res.status(400).json({
        success: false,
        message: 'Worksheet already submitted'
      });
    }

    // Validate that all time slots have tasks
    const emptySlots = worksheet.timeSlots.filter(slot => !slot.task || slot.task.trim() === '');
    if (emptySlots.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please fill in tasks for all time slots. Empty slots: ${emptySlots.map(s => `${s.hour}:00`).join(', ')}`
      });
    }

    worksheet.isSubmitted = true;
    worksheet.submittedAt = new Date();
    await worksheet.save();

    // Award submission points
    await User.findByIdAndUpdate(userId, {
      $inc: { rewardPoints: 15 }
    });

    // Log the submission
    await Log.create({
      user: userId,
      action: 'Worksheet Submitted',
      category: 'Worksheet',
      details: `Employee submitted worksheet for ${worksheet.date.toDateString()}. Productivity score: ${worksheet.productivityScore}%`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    const updatedWorksheet = await WorkSheet.findById(worksheetId)
      .populate('employee', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Worksheet submitted successfully',
      data: { worksheet: updatedWorksheet }
    });
  } catch (error) {
    console.error('Submit worksheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting worksheet',
      error: error.message
    });
  }
};

// @desc    Approve/reject worksheet
// @route   PUT /api/worksheets/:id/approve
// @access  Private (Manager, Team Lead, HR, Admin)
exports.approveWorksheet = async (req, res) => {
  try {
    const worksheetId = req.params.id;
    const { status, feedback } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!['Manager', 'Team Lead', 'HR', 'Admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve worksheets'
      });
    }

    if (!['Approved', 'Rejected', 'Needs Review'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval status'
      });
    }

    const worksheet = await WorkSheet.findById(worksheetId)
      .populate('employee', 'firstName lastName email manager teamLead');

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    // Check if user has permission to approve this worksheet
    if (!['Admin', 'HR'].includes(userRole)) {
      const hasPermission = 
        (userRole === 'Manager' && worksheet.employee.manager?.toString() === userId.toString()) ||
        (userRole === 'Team Lead' && worksheet.employee.teamLead?.toString() === userId.toString());

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to approve this employee\'s worksheet'
        });
      }
    }

    worksheet.approvalStatus = status;
    worksheet.approvedBy = userId;
    worksheet.feedback = feedback || '';
    
    await worksheet.save();

    // Award bonus points for approved worksheets
    if (status === 'Approved' && worksheet.productivityScore >= 80) {
      await User.findByIdAndUpdate(worksheet.employee._id, {
        $inc: { rewardPoints: 20 }
      });
    }

    // Log the approval
    await Log.create({
      user: userId,
      action: `Worksheet ${status}`,
      category: 'Worksheet',
      details: `${userRole} ${status.toLowerCase()} worksheet for ${worksheet.employee.firstName} ${worksheet.employee.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    const updatedWorksheet = await WorkSheet.findById(worksheetId)
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: `Worksheet ${status.toLowerCase()} successfully`,
      data: { worksheet: updatedWorksheet }
    });
  } catch (error) {
    console.error('Approve worksheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving worksheet',
      error: error.message
    });
  }
};

// @desc    Get worksheet statistics
// @route   GET /api/worksheets/stats
// @access  Private
exports.getWorksheetStats = async (req, res) => {
  try {
    const { employeeId, period = '30' } = req.query;
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
            message: 'Not authorized to view this employee\'s statistics'
          });
        }
      }
    }

    const daysBack = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const worksheets = await WorkSheet.find({
      employee: targetUserId,
      date: { $gte: startDate }
    });

    // Calculate statistics
    const totalWorksheets = worksheets.length;
    const submittedWorksheets = worksheets.filter(w => w.isSubmitted).length;
    const approvedWorksheets = worksheets.filter(w => w.approvalStatus === 'Approved').length;
    const rejectedWorksheets = worksheets.filter(w => w.approvalStatus === 'Rejected').length;
    const pendingWorksheets = worksheets.filter(w => w.approvalStatus === 'Pending').length;
    
    const totalTasks = worksheets.reduce((sum, w) => sum + w.totalTasksPlanned, 0);
    const completedTasks = worksheets.reduce((sum, w) => sum + w.totalTasksCompleted, 0);
    const averageProductivity = totalWorksheets > 0 
      ? worksheets.reduce((sum, w) => sum + w.productivityScore, 0) / totalWorksheets 
      : 0;
    
    const submissionRate = totalWorksheets > 0 ? (submittedWorksheets / totalWorksheets) * 100 : 0;
    const approvalRate = submittedWorksheets > 0 ? (approvedWorksheets / submittedWorksheets) * 100 : 0;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        period: `${daysBack} days`,
        totalWorksheets,
        submittedWorksheets,
        approvedWorksheets,
        rejectedWorksheets,
        pendingWorksheets,
        totalTasks,
        completedTasks,
        averageProductivity: parseFloat(averageProductivity.toFixed(2)),
        submissionRate: parseFloat(submissionRate.toFixed(2)),
        approvalRate: parseFloat(approvalRate.toFixed(2)),
        taskCompletionRate: parseFloat(taskCompletionRate.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get worksheet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching worksheet statistics',
      error: error.message
    });
  }
};
