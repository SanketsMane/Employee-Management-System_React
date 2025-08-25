const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const WorkSheet = require('../models/WorkSheet');

// @desc    Get overview analytics
// @route   GET /api/analytics/overview
// @access  Private (Admin, HR, Manager)
exports.getOverviewAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Total employees count
    const totalEmployees = await User.countDocuments({ isActive: true });
    const lastMonthEmployees = await User.countDocuments({ 
      isActive: true,
      createdAt: { $lt: startOfMonth }
    });
    const employeeGrowth = lastMonthEmployees > 0 
      ? ((totalEmployees - lastMonthEmployees) / lastMonthEmployees * 100).toFixed(1)
      : 0;

    // Attendance analytics
    const totalAttendanceRecords = await Attendance.countDocuments({
      date: { $gte: startOfMonth, $lte: today }
    });
    
    const presentDays = await Attendance.countDocuments({
      date: { $gte: startOfMonth, $lte: today },
      status: 'Present'
    });

    const averageAttendance = totalAttendanceRecords > 0 
      ? ((presentDays / totalAttendanceRecords) * 100).toFixed(1)
      : 0;

    // Leave requests
    const pendingLeaves = await Leave.countDocuments({
      status: 'Pending'
    });

    const thisMonthLeaves = await Leave.countDocuments({
      startDate: { $gte: startOfMonth, $lte: today }
    });

    // Department breakdown
    const departmentStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Role distribution
    const roleStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        employeeGrowth: `+${employeeGrowth}%`,
        averageAttendance: `${averageAttendance}%`,
        pendingLeaves,
        thisMonthLeaves,
        departmentStats,
        roleStats
      }
    });
  } catch (error) {
    console.error('Get overview analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overview analytics',
      error: error.message
    });
  }
};

// @desc    Get attendance analytics
// @route   GET /api/analytics/attendance
// @access  Private (Admin, HR, Manager)
exports.getAttendanceAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const today = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    // Daily attendance trends
    const dailyTrends = await Attendance.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Department-wise attendance
    const departmentAttendance = await Attendance.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $group: {
          _id: '$userInfo.department',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
          attendanceRate: {
            $avg: { $cond: [{ $eq: ["$status", "Present"] }, 100, 0] }
          }
        }
      },
      { $sort: { attendanceRate: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyTrends,
        departmentAttendance,
        period
      }
    });
  } catch (error) {
    console.error('Get attendance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance analytics',
      error: error.message
    });
  }
};

// @desc    Get leaves analytics
// @route   GET /api/analytics/leaves
// @access  Private (Admin, HR, Manager)
exports.getLeavesAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Leave statistics
    const leaveStats = await Leave.aggregate([
      { $match: { startDate: { $gte: startOfYear } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Leave types breakdown
    const leaveTypes = await Leave.aggregate([
      { $match: { startDate: { $gte: startOfYear } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Department-wise leave usage
    const departmentLeaves = await Leave.aggregate([
      { $match: { startDate: { $gte: startOfYear } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $group: {
          _id: '$userInfo.department',
          totalLeaves: { $sum: 1 },
          totalDays: { $sum: '$totalDays' },
          averageDays: { $avg: '$totalDays' }
        }
      },
      { $sort: { totalDays: -1 } }
    ]);

    // Monthly trends
    const monthlyTrends = await Leave.aggregate([
      { $match: { startDate: { $gte: startOfYear } } },
      {
        $group: {
          _id: { $month: '$startDate' },
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        leaveStats,
        leaveTypes,
        departmentLeaves,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Get leaves analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves analytics',
      error: error.message
    });
  }
};

// @desc    Get productivity analytics
// @route   GET /api/analytics/productivity
// @access  Private (Admin, HR, Manager)
exports.getProductivityAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Worksheet statistics
    const worksheetStats = await WorkSheet.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          averageHours: { $avg: '$hoursWorked' },
          totalHours: { $sum: '$hoursWorked' },
          completedTasks: { $sum: { $size: '$tasks' } }
        }
      }
    ]);

    // Department productivity
    const departmentProductivity = await WorkSheet.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $group: {
          _id: '$userInfo.department',
          totalHours: { $sum: '$hoursWorked' },
          averageHours: { $avg: '$hoursWorked' },
          totalSubmissions: { $sum: 1 }
        }
      },
      { $sort: { totalHours: -1 } }
    ]);

    // Top performers
    const topPerformers = await WorkSheet.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      {
        $group: {
          _id: '$user',
          totalHours: { $sum: '$hoursWorked' },
          averageHours: { $avg: '$hoursWorked' },
          submissions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
          department: '$userInfo.department',
          totalHours: 1,
          averageHours: 1,
          submissions: 1
        }
      },
      { $sort: { totalHours: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        worksheetStats: worksheetStats[0] || {},
        departmentProductivity,
        topPerformers
      }
    });
  } catch (error) {
    console.error('Get productivity analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching productivity analytics',
      error: error.message
    });
  }
};

// @desc    Get attendance trends
// @route   GET /api/analytics/attendance-trends
// @access  Private (Admin, HR, Manager)
exports.getAttendanceTrends = async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const days = parseInt(range.replace('d', ''));
    
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Get attendance trends over the specified range
    const attendanceTrends = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
          },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      },
      {
        $project: {
          date: "$_id.date",
          present: 1,
          absent: 1,
          late: 1,
          total: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ["$present", "$total"] },
              100
            ]
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: attendanceTrends
    });
  } catch (error) {
    console.error('Get attendance trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance trends',
      error: error.message
    });
  }
};
