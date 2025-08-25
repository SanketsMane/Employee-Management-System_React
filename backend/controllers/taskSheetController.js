const DailyTaskSheet = require('../models/DailyTaskSheet');
const User = require('../models/User');

// @desc    Create or update daily task sheet
// @route   POST /api/task-sheets
// @access  Private (All except Admin)
exports.createOrUpdateTaskSheet = async (req, res) => {
  try {
    if (req.user.role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins do not need to fill daily task sheets'
      });
    }

    const { date, tasks } = req.body;
    const employeeId = req.user.id;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one task is required'
      });
    }

    // Parse date or use today
    const taskDate = date ? new Date(date) : new Date();
    taskDate.setHours(0, 0, 0, 0);

    // Calculate total planned hours
    const totalPlannedHours = tasks.reduce((sum, task) => {
      return sum + (task.estimatedTime || 0);
    }, 0) / 60; // Convert minutes to hours

    // Calculate total actual hours
    const totalActualHours = tasks.reduce((sum, task) => {
      return sum + (task.actualTime || 0);
    }, 0) / 60; // Convert minutes to hours

    // Find existing task sheet or create new one
    let taskSheet = await DailyTaskSheet.findOne({
      employee: employeeId,
      date: taskDate
    });

    if (taskSheet) {
      // Update existing task sheet
      taskSheet.tasks = tasks;
      taskSheet.totalPlannedHours = totalPlannedHours;
      taskSheet.totalActualHours = totalActualHours;
      taskSheet.isSubmitted = false; // Reset submission status when updating
    } else {
      // Create new task sheet
      taskSheet = new DailyTaskSheet({
        employee: employeeId,
        date: taskDate,
        tasks,
        totalPlannedHours,
        totalActualHours
      });
    }

    await taskSheet.save();
    await taskSheet.populate('employee', 'firstName lastName email employeeId');

    res.status(200).json({
      success: true,
      message: taskSheet.isNew ? 'Task sheet created successfully' : 'Task sheet updated successfully',
      data: taskSheet
    });
  } catch (error) {
    console.error('Create/Update task sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving task sheet',
      error: error.message
    });
  }
};

// @desc    Submit daily task sheet
// @route   PUT /api/task-sheets/:id/submit
// @access  Private
exports.submitTaskSheet = async (req, res) => {
  try {
    const taskSheet = await DailyTaskSheet.findById(req.params.id);
    
    if (!taskSheet) {
      return res.status(404).json({
        success: false,
        message: 'Task sheet not found'
      });
    }

    // Check if user owns this task sheet
    if (taskSheet.employee.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit your own task sheets'
      });
    }

    if (taskSheet.isSubmitted) {
      return res.status(400).json({
        success: false,
        message: 'Task sheet is already submitted'
      });
    }

    taskSheet.isSubmitted = true;
    taskSheet.submittedAt = new Date();
    await taskSheet.save();

    res.status(200).json({
      success: true,
      message: 'Task sheet submitted successfully',
      data: taskSheet
    });
  } catch (error) {
    console.error('Submit task sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting task sheet',
      error: error.message
    });
  }
};

// @desc    Get my task sheets
// @route   GET /api/task-sheets/my
// @access  Private
exports.getMyTaskSheets = async (req, res) => {
  try {
    const { page = 1, limit = 10, date } = req.query;
    const skip = (page - 1) * limit;

    let query = { employee: req.user.id };
    
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      query.date = queryDate;
    }

    const taskSheets = await DailyTaskSheet.find(query)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip(skip);

    const total = await DailyTaskSheet.countDocuments(query);

    res.status(200).json({
      success: true,
      count: taskSheets.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: taskSheets
    });
  } catch (error) {
    console.error('Get my task sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task sheets',
      error: error.message
    });
  }
};

// @desc    Get today's task sheet
// @route   GET /api/task-sheets/today
// @access  Private
exports.getTodayTaskSheet = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskSheet = await DailyTaskSheet.findOne({
      employee: req.user.id,
      date: today
    }).populate('employee', 'firstName lastName email employeeId')
      .populate('reviewedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: taskSheet
    });
  } catch (error) {
    console.error('Get today task sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s task sheet',
      error: error.message
    });
  }
};

// @desc    Get all task sheets (for managers/HR)
// @route   GET /api/task-sheets
// @access  Private/Admin/HR/Manager/TeamLead
exports.getAllTaskSheets = async (req, res) => {
  try {
    const { page = 1, limit = 10, date, employee, department, isSubmitted } = req.query;
    const skip = (page - 1) * limit;

    // Check user permissions
    if (!['Admin', 'HR', 'Manager', 'Team Lead'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    let query = {};

    // If Team Lead, only show their team members' task sheets
    if (req.user.role === 'Team Lead') {
      const teamMembers = await User.find({ 
        teamLead: req.user.id,
        isApproved: true,
        isActive: true
      }).select('_id');
      
      const memberIds = teamMembers.map(member => member._id);
      memberIds.push(req.user.id); // Include team lead's own task sheets
      query.employee = { $in: memberIds };
    }

    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      query.date = queryDate;
    }

    if (employee) {
      query.employee = employee;
    }

    if (isSubmitted !== undefined) {
      query.isSubmitted = isSubmitted === 'true';
    }

    // Build aggregation pipeline for department filter
    let pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: '$employeeData' }
    ];

    if (department) {
      pipeline.push({
        $match: { 'employeeData.department': department }
      });
    }

    pipeline.push(
      { $sort: { date: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'reviewedBy',
          foreignField: '_id',
          as: 'reviewer'
        }
      },
      {
        $project: {
          date: 1,
          tasks: 1,
          totalPlannedHours: 1,
          totalActualHours: 1,
          productivity: 1,
          isSubmitted: 1,
          submittedAt: 1,
          reviewedAt: 1,
          reviewComments: 1,
          createdAt: 1,
          updatedAt: 1,
          employee: {
            _id: '$employeeData._id',
            firstName: '$employeeData.firstName',
            lastName: '$employeeData.lastName',
            email: '$employeeData.email',
            employeeId: '$employeeData.employeeId',
            department: '$employeeData.department',
            role: '$employeeData.role'
          },
          reviewedBy: {
            $arrayElemAt: [
              {
                $map: {
                  input: '$reviewer',
                  as: 'r',
                  in: {
                    _id: '$$r._id',
                    firstName: '$$r.firstName',
                    lastName: '$$r.lastName'
                  }
                }
              },
              0
            ]
          }
        }
      }
    );

    const taskSheets = await DailyTaskSheet.aggregate(pipeline);

    // Get total count for pagination
    let countPipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: '$employeeData' }
    ];

    if (department) {
      countPipeline.push({
        $match: { 'employeeData.department': department }
      });
    }

    countPipeline.push({ $count: 'total' });
    const totalResult = await DailyTaskSheet.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      count: taskSheets.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: taskSheets
    });
  } catch (error) {
    console.error('Get all task sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task sheets',
      error: error.message
    });
  }
};

// @desc    Review task sheet
// @route   PUT /api/task-sheets/:id/review
// @access  Private/Admin/HR/Manager/TeamLead
exports.reviewTaskSheet = async (req, res) => {
  try {
    const { comments } = req.body;
    
    // Check user permissions
    if (!['Admin', 'HR', 'Manager', 'Team Lead'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    const taskSheet = await DailyTaskSheet.findById(req.params.id)
      .populate('employee', 'firstName lastName email teamLead');

    if (!taskSheet) {
      return res.status(404).json({
        success: false,
        message: 'Task sheet not found'
      });
    }

    // If Team Lead, ensure they can only review their team members' task sheets
    if (req.user.role === 'Team Lead') {
      if (taskSheet.employee.teamLead?.toString() !== req.user.id && 
          taskSheet.employee._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only review task sheets of your team members'
        });
      }
    }

    taskSheet.reviewedBy = req.user.id;
    taskSheet.reviewedAt = new Date();
    taskSheet.reviewComments = comments;
    
    await taskSheet.save();

    res.status(200).json({
      success: true,
      message: 'Task sheet reviewed successfully',
      data: taskSheet
    });
  } catch (error) {
    console.error('Review task sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing task sheet',
      error: error.message
    });
  }
};

// @desc    Get task sheet statistics
// @route   GET /api/task-sheets/stats
// @access  Private/Admin/HR/Manager/TeamLead
exports.getTaskSheetStats = async (req, res) => {
  try {
    // Check user permissions
    if (!['Admin', 'HR', 'Manager', 'Team Lead'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    let matchCondition = {};

    // If Team Lead, only show stats for their team
    if (req.user.role === 'Team Lead') {
      const teamMembers = await User.find({ 
        teamLead: req.user.id,
        isApproved: true,
        isActive: true
      }).select('_id');
      
      const memberIds = teamMembers.map(member => member._id);
      memberIds.push(req.user.id);
      matchCondition.employee = { $in: memberIds };
    }

    const stats = await DailyTaskSheet.aggregate([
      { $match: matchCondition },
      {
        $facet: {
          todayStats: [
            { $match: { date: today } },
            {
              $group: {
                _id: null,
                totalSheets: { $sum: 1 },
                submittedSheets: {
                  $sum: { $cond: ['$isSubmitted', 1, 0] }
                },
                avgProductivity: { $avg: '$productivity' },
                totalPlannedHours: { $sum: '$totalPlannedHours' },
                totalActualHours: { $sum: '$totalActualHours' }
              }
            }
          ],
          weeklyStats: [
            { $match: { date: { $gte: thisWeekStart } } },
            {
              $group: {
                _id: null,
                totalSheets: { $sum: 1 },
                submittedSheets: {
                  $sum: { $cond: ['$isSubmitted', 1, 0] }
                },
                avgProductivity: { $avg: '$productivity' },
                totalPlannedHours: { $sum: '$totalPlannedHours' },
                totalActualHours: { $sum: '$totalActualHours' }
              }
            }
          ],
          monthlyStats: [
            { $match: { date: { $gte: thisMonthStart } } },
            {
              $group: {
                _id: null,
                totalSheets: { $sum: 1 },
                submittedSheets: {
                  $sum: { $cond: ['$isSubmitted', 1, 0] }
                },
                avgProductivity: { $avg: '$productivity' },
                totalPlannedHours: { $sum: '$totalPlannedHours' },
                totalActualHours: { $sum: '$totalActualHours' }
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        today: stats[0].todayStats[0] || {},
        thisWeek: stats[0].weeklyStats[0] || {},
        thisMonth: stats[0].monthlyStats[0] || {}
      }
    });
  } catch (error) {
    console.error('Get task sheet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task sheet statistics',
      error: error.message
    });
  }
};
