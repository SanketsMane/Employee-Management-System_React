const Overtime = require('../models/Overtime');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');
const { protect, authorize } = require('../utils/roleMiddleware');

// @desc    Submit overtime request
// @route   POST /api/overtime
// @access  Private (Employees, Team Leads, Managers)
exports.submitOvertime = async (req, res) => {
  try {
    const {
      date,
      startTime,
      endTime,
      reason,
      workDescription,
      projectName,
      urgencyLevel,
      overtimeType,
      location,
      attachments
    } = req.body;

    const employeeId = req.user.id;

    // Validate required fields
    if (!date || !startTime || !endTime || !reason || !workDescription) {
      return res.status(400).json({
        success: false,
        message: 'Date, start time, end time, reason, and work description are required'
      });
    }

    // Parse dates
    const overtimeDate = new Date(date);
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate date range
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Calculate total hours
    const totalHours = (end - start) / (1000 * 60 * 60);

    if (totalHours < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'Minimum overtime duration is 30 minutes'
      });
    }

    if (totalHours > 12) {
      return res.status(400).json({
        success: false,
        message: 'Maximum overtime duration is 12 hours'
      });
    }

    // Check if overtime already exists for the same period
    const existingOvertime = await Overtime.findOne({
      employee: employeeId,
      date: {
        $gte: new Date(overtimeDate.setHours(0, 0, 0, 0)),
        $lte: new Date(overtimeDate.setHours(23, 59, 59, 999))
      },
      $or: [
        {
          startTime: { $lte: start },
          endTime: { $gte: start }
        },
        {
          startTime: { $lte: end },
          endTime: { $gte: end }
        },
        {
          startTime: { $gte: start },
          endTime: { $lte: end }
        }
      ],
      status: { $ne: 'Rejected' }
    });

    if (existingOvertime) {
      return res.status(400).json({
        success: false,
        message: 'Overtime request already exists for this time period'
      });
    }

    // Find related attendance record
    const attendanceRecord = await Attendance.findOne({
      employee: employeeId,
      date: {
        $gte: new Date(overtimeDate.setHours(0, 0, 0, 0)),
        $lte: new Date(overtimeDate.setHours(23, 59, 59, 999))
      }
    });

    // Create overtime request
    const overtime = new Overtime({
      employee: employeeId,
      date: overtimeDate,
      startTime: start,
      endTime: end,
      totalHours,
      reason: reason.trim(),
      workDescription: workDescription.trim(),
      projectName: projectName?.trim(),
      urgencyLevel: urgencyLevel || 'Medium',
      overtimeType: overtimeType || 'Regular',
      location: location || 'Office',
      attendanceRecord: attendanceRecord?._id,
      attachments: attachments || []
    });

    await overtime.save();

    // Populate employee details for response
    await overtime.populate('employee', 'firstName lastName employeeId department');

    console.log(`⏰ Overtime request submitted: ${overtime._id} by ${req.user.firstName} ${req.user.lastName}`);

    res.status(201).json({
      success: true,
      message: 'Overtime request submitted successfully',
      data: overtime
    });

  } catch (error) {
    console.error('Submit overtime error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting overtime request',
      error: error.message
    });
  }
};

// @desc    Get employee overtime requests
// @route   GET /api/overtime/my-requests
// @access  Private (All roles)
exports.getMyOvertimeRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const employeeId = req.user.id;

    // Build filter
    const filter = { employee: employeeId };

    if (status) {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const requests = await Overtime.find(filter)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Overtime.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get my overtime requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overtime requests'
    });
  }
};

// @desc    Get all overtime requests (Admin/HR/Manager)
// @route   GET /api/overtime/all
// @access  Private (Admin, HR, Manager, Team Lead)
exports.getAllOvertimeRequests = [
  authorize('Admin', 'HR', 'Manager', 'Team Lead'),
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        department, 
        startDate, 
        endDate,
        employee,
        urgencyLevel 
      } = req.query;

      // Build filter
      const filter = {};

      if (status) {
        filter.status = status;
      }

      if (urgencyLevel) {
        filter.urgencyLevel = urgencyLevel;
      }

      if (startDate && endDate) {
        filter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // If user is Team Lead, only show their team's requests
      if (req.user.role === 'Team Lead') {
        const teamMembers = await User.find({ teamLead: req.user.id }).select('_id');
        const memberIds = teamMembers.map(member => member._id);
        memberIds.push(req.user.id); // Include team lead's own requests
        filter.employee = { $in: memberIds };
      }

      let aggregationPipeline = [
        { $match: filter }
      ];

      // Add employee filter with department if specified
      if (department || employee) {
        const employeeFilter = {};
        if (department) employeeFilter.department = department;
        if (employee) employeeFilter._id = new mongoose.Types.ObjectId(employee);

        const employeeIds = await User.find(employeeFilter).select('_id');
        filter.employee = { $in: employeeIds.map(emp => emp._id) };
        aggregationPipeline[0].$match = filter;
      }

      // Add lookup for employee details
      aggregationPipeline = [
        ...aggregationPipeline,
        {
          $lookup: {
            from: 'users',
            localField: 'employee',
            foreignField: '_id',
            as: 'employee'
          }
        },
        {
          $unwind: '$employee'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'approvedBy',
            foreignField: '_id',
            as: 'approvedBy'
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: parseInt(limit)
        }
      ];

      const requests = await Overtime.aggregate(aggregationPipeline);
      const total = await Overtime.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: requests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });

    } catch (error) {
      console.error('Get all overtime requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching overtime requests'
      });
    }
  }
];

// @desc    Approve/Reject overtime request
// @route   PUT /api/overtime/:id/status
// @access  Private (Admin, HR, Manager, Team Lead)
exports.updateOvertimeStatus = [
  authorize('Admin', 'HR', 'Manager', 'Team Lead'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, managerComments, compensation } = req.body;

      if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either Approved or Rejected'
        });
      }

      const overtime = await Overtime.findById(id)
        .populate('employee', 'firstName lastName employeeId department');

      if (!overtime) {
        return res.status(404).json({
          success: false,
          message: 'Overtime request not found'
        });
      }

      if (overtime.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending requests can be updated'
        });
      }

      // Check if user can approve this request
      if (req.user.role === 'Team Lead') {
        const employee = await User.findById(overtime.employee._id);
        if (!employee.teamLead?.equals(req.user.id)) {
          return res.status(403).json({
            success: false,
            message: 'You can only approve requests from your team members'
          });
        }
      }

      // Update overtime request
      overtime.status = status;
      overtime.approvedBy = req.user.id;
      overtime.approvedAt = new Date();
      overtime.managerComments = managerComments?.trim();

      if (status === 'Rejected' && !managerComments) {
        return res.status(400).json({
          success: false,
          message: 'Manager comments are required for rejection'
        });
      }

      if (status === 'Approved' && compensation) {
        overtime.compensation = {
          ...overtime.compensation,
          ...compensation
        };
      }

      await overtime.save();

      // Populate for response
      await overtime.populate('approvedBy', 'firstName lastName');

      console.log(`⏰ Overtime request ${status.toLowerCase()}: ${overtime._id} by ${req.user.firstName} ${req.user.lastName}`);

      res.status(200).json({
        success: true,
        message: `Overtime request ${status.toLowerCase()} successfully`,
        data: overtime
      });

    } catch (error) {
      console.error('Update overtime status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating overtime request'
      });
    }
  }
];

// @desc    Get overtime statistics
// @route   GET /api/overtime/stats
// @access  Private (All roles)
exports.getOvertimeStats = async (req, res) => {
  try {
    const { startDate, endDate, employee } = req.query;
    const targetEmployeeId = employee || req.user.id;

    // Check permission for viewing other employee's stats
    if (targetEmployeeId !== req.user.id && !['Admin', 'HR', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Overtime.getOvertimeStats(targetEmployeeId, start, end);

    // Get pending requests count
    const pendingCount = await Overtime.countDocuments({
      employee: targetEmployeeId,
      status: 'Pending',
      date: { $gte: start, $lte: end }
    });

    // Get monthly breakdown
    const monthlyStats = await Overtime.aggregate([
      {
        $match: {
          employee: new mongoose.Types.ObjectId(targetEmployeeId),
          date: { $gte: start, $lte: end },
          status: 'Approved'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalHours: { $sum: '$totalHours' },
          totalSessions: { $sum: 1 },
          totalCompensation: { $sum: '$compensation.amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        pendingRequests: pendingCount,
        monthlyBreakdown: monthlyStats
      }
    });

  } catch (error) {
    console.error('Get overtime stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overtime statistics'
    });
  }
};

// @desc    Delete overtime request
// @route   DELETE /api/overtime/:id
// @access  Private (Employee can delete own pending requests, Admin/HR can delete any)
exports.deleteOvertimeRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const overtime = await Overtime.findById(id);

    if (!overtime) {
      return res.status(404).json({
        success: false,
        message: 'Overtime request not found'
      });
    }

    // Check permissions
    const canDelete = 
      overtime.employee.toString() === req.user.id && overtime.status === 'Pending' ||
      ['Admin', 'HR'].includes(req.user.role);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own pending requests'
      });
    }

    await Overtime.findByIdAndDelete(id);

    console.log(`⏰ Overtime request deleted: ${id} by ${req.user.firstName} ${req.user.lastName}`);

    res.status(200).json({
      success: true,
      message: 'Overtime request deleted successfully'
    });

  } catch (error) {
    console.error('Delete overtime request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting overtime request'
    });
  }
};

module.exports = {
  submitOvertime: exports.submitOvertime,
  getMyOvertimeRequests: exports.getMyOvertimeRequests,
  getAllOvertimeRequests: exports.getAllOvertimeRequests,
  updateOvertimeStatus: exports.updateOvertimeStatus,
  getOvertimeStats: exports.getOvertimeStats,
  deleteOvertimeRequest: exports.deleteOvertimeRequest
};