const User = require('../models/User');
const Attendance = require('../models/Attendance');
const WorkSheet = require('../models/WorkSheet');
const Leave = require('../models/Leave');
const Log = require('../models/Log');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, HR, Manager, Team Lead)
exports.getUsers = async (req, res) => {
  try {
    const { 
      role, 
      department, 
      isActive, 
      page = 1, 
      limit = 10,
      search,
      sortBy = 'firstName',
      sortOrder = 'asc'
    } = req.query;
    
    const userId = req.user._id;
    const userRole = req.user.role;

    // Build query
    let query = {};
    
    // Role-based access control
    if (['Admin', 'HR'].includes(userRole)) {
      // Admin and HR can view all users
    } else if (userRole === 'Manager') {
      // Managers can view their team members
      query.$or = [
        { manager: userId },
        { _id: userId }
      ];
    } else if (userRole === 'Team Lead') {
      // Team leads can view their team members
      query.$or = [
        { teamLead: userId },
        { _id: userId }
      ];
    } else {
      // Regular employees can only view their own profile
      query._id = userId;
    }

    // Additional filters
    if (role) {
      // Handle multiple roles separated by comma
      const roles = role.split(',').map(r => r.trim());
      if (roles.length === 1) {
        query.role = role;
      } else {
        query.role = { $in: roles };
      }
    }

    if (department) {
      query.department = department;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
        { department: searchRegex },
        { position: searchRegex }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .populate('manager', 'firstName lastName employeeId')
      .populate('teamLead', 'firstName lastName employeeId')
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      data: { users }
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

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Check access permissions
    const canAccess = 
      ['Admin', 'HR'].includes(userRole) ||
      targetUserId === userId.toString();

    if (!canAccess && ['Manager', 'Team Lead'].includes(userRole)) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        const hasAccess = 
          (userRole === 'Manager' && targetUser.manager?.toString() === userId.toString()) ||
          (userRole === 'Team Lead' && targetUser.teamLead?.toString() === userId.toString());
        
        if (hasAccess) {
          // Access granted
        } else {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this user'
          });
        }
      }
    } else if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user'
      });
    }

    const user = await User.findById(targetUserId)
      .populate('manager', 'firstName lastName employeeId email')
      .populate('teamLead', 'firstName lastName employeeId email')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    const {
      firstName,
      lastName,
      phone,
      address,
      skills,
      department,
      position,
      salary,
      managerId,
      teamLeadId,
      role,
      isActive
    } = req.body;

    // Check if user can update this profile
    const canUpdate = 
      targetUserId === userId.toString() || // Users can update their own profile
      ['Admin', 'HR'].includes(userRole); // Admin and HR can update any profile

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare update data
    const updateData = {};

    // Personal info (users can update their own)
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address;
    if (skills) updateData.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());

    // Administrative fields (only Admin and HR can update)
    if (['Admin', 'HR'].includes(userRole)) {
      if (department) updateData.department = department.trim();
      if (position) updateData.position = position.trim();
      if (salary !== undefined) updateData.salary = salary;
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Manager and Team Lead assignments
      if (managerId) {
        const manager = await User.findById(managerId);
        if (manager && manager.role === 'Manager') {
          updateData.manager = managerId;
        }
      }

      if (teamLeadId) {
        const teamLead = await User.findById(teamLeadId);
        if (teamLead && teamLead.role === 'Team Lead') {
          updateData.teamLead = teamLeadId;
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('manager', 'firstName lastName employeeId')
    .populate('teamLead', 'firstName lastName employeeId')
    .select('-password');

    // Log the update
    await Log.create({
      user: userId,
      action: 'User Profile Updated',
      category: 'Profile',
      details: `${userRole} updated profile for ${updatedUser.firstName} ${updatedUser.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: { targetUserId, updatedFields: Object.keys(updateData) }
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
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
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Admin can delete users'
      });
    }

    if (targetUserId === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - deactivate user instead of removing
    user.isActive = false;
    await user.save();

    // Log the deletion
    await Log.create({
      user: userId,
      action: 'User Deactivated',
      category: 'Admin',
      details: `Admin deactivated user: ${user.firstName} ${user.lastName} (${user.employeeId})`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      metadata: { deactivatedUserId: targetUserId }
    });

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

// @desc    Upload user document
// @route   POST /api/users/:id/documents
// @access  Private
exports.uploadDocument = [
  upload.single('document'),
  async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const userId = req.user._id;
      const userRole = req.user.role;

      // Check if user can upload documents for this profile
      const canUpload = 
        targetUserId === userId.toString() || // Users can upload to their own profile
        ['Admin', 'HR'].includes(userRole); // Admin and HR can upload to any profile

      if (!canUpload) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to upload documents for this user'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const user = await User.findById(targetUserId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const document = {
        name: req.body.name || req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        uploadDate: new Date()
      };

      user.documents.push(document);
      await user.save();

      // Log the document upload
      await Log.create({
        user: userId,
        action: 'Document Uploaded',
        category: 'Profile',
        details: `Document uploaded: ${document.name} for ${user.firstName} ${user.lastName}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true,
        metadata: { targetUserId, documentName: document.name }
      });

      res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        data: { document }
      });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading document',
        error: error.message
      });
    }
  }
];

// @desc    Get user dashboard data
// @route   GET /api/users/:id/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Check access permissions
    const canAccess = 
      targetUserId === userId.toString() ||
      ['Admin', 'HR'].includes(userRole);

    if (!canAccess && ['Manager', 'Team Lead'].includes(userRole)) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        const hasAccess = 
          (userRole === 'Manager' && targetUser.manager?.toString() === userId.toString()) ||
          (userRole === 'Team Lead' && targetUser.teamLead?.toString() === userId.toString());
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this user\'s dashboard'
          });
        }
      }
    } else if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this dashboard'
      });
    }

    // Get user info
    const user = await User.findById(targetUserId)
      .populate('manager', 'firstName lastName')
      .populate('teamLead', 'firstName lastName')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current month data
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.findOne({
      employee: targetUserId,
      date: { $gte: today, $lt: tomorrow }
    });

    // Monthly attendance stats
    const monthlyAttendance = await Attendance.find({
      employee: targetUserId,
      date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });

    const attendanceStats = {
      totalDays: monthlyAttendance.length,
      presentDays: monthlyAttendance.filter(a => a.status !== 'Absent').length,
      lateDays: monthlyAttendance.filter(a => a.isLate).length,
      totalHoursWorked: monthlyAttendance.reduce((sum, a) => sum + (a.totalWorkedHours || 0), 0),
      averageHours: monthlyAttendance.length > 0 
        ? monthlyAttendance.reduce((sum, a) => sum + (a.totalWorkedHours || 0), 0) / monthlyAttendance.length 
        : 0
    };

    // Today's worksheet
    const todayWorksheet = await WorkSheet.findOne({
      employee: targetUserId,
      date: { $gte: today, $lt: tomorrow }
    });

    // Monthly worksheet stats
    const monthlyWorksheets = await WorkSheet.find({
      employee: targetUserId,
      date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });

    const worksheetStats = {
      totalWorksheets: monthlyWorksheets.length,
      submittedWorksheets: monthlyWorksheets.filter(w => w.isSubmitted).length,
      averageProductivity: monthlyWorksheets.length > 0 
        ? monthlyWorksheets.reduce((sum, w) => sum + w.productivityScore, 0) / monthlyWorksheets.length 
        : 0,
      totalTasksCompleted: monthlyWorksheets.reduce((sum, w) => sum + w.totalTasksCompleted, 0)
    };

    // Pending leave requests
    const pendingLeaves = await Leave.countDocuments({
      employee: targetUserId,
      status: 'Pending'
    });

    // Recent activities (for Admin/HR/Manager views)
    let recentActivities = [];
    if (['Admin', 'HR', 'Manager', 'Team Lead'].includes(userRole)) {
      recentActivities = await Log.find({
        user: targetUserId,
        category: { $in: ['Attendance', 'Worksheet', 'Leave'] }
      })
      .sort({ createdAt: -1 })
      .limit(5);
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        todayAttendance,
        attendanceStats: {
          ...attendanceStats,
          averageHours: parseFloat(attendanceStats.averageHours.toFixed(2))
        },
        todayWorksheet,
        worksheetStats: {
          ...worksheetStats,
          averageProductivity: parseFloat(worksheetStats.averageProductivity.toFixed(2))
        },
        pendingLeaves,
        recentActivities
      }
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private (Admin, HR)
exports.getLeaderboard = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (!['Admin', 'HR'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view leaderboard'
      });
    }

    const { limit = 10, type = 'points' } = req.query;

    let sortField = 'rewardPoints';
    let additionalData = {};

    if (type === 'productivity') {
      // Get users with highest average productivity scores
      const productivityStats = await WorkSheet.aggregate([
        {
          $match: {
            date: { 
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Current month
            }
          }
        },
        {
          $group: {
            _id: '$employee',
            averageProductivity: { $avg: '$productivityScore' },
            totalWorksheets: { $sum: 1 },
            totalTasksCompleted: { $sum: '$totalTasksCompleted' }
          }
        },
        {
          $sort: { averageProductivity: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);

      const userIds = productivityStats.map(stat => stat._id);
      const users = await User.find({ _id: { $in: userIds } })
        .select('firstName lastName employeeId department rewardPoints')
        .lean();

      const leaderboard = users.map(user => {
        const stats = productivityStats.find(s => s._id.toString() === user._id.toString());
        return {
          ...user,
          averageProductivity: parseFloat((stats?.averageProductivity || 0).toFixed(2)),
          totalWorksheets: stats?.totalWorksheets || 0,
          totalTasksCompleted: stats?.totalTasksCompleted || 0
        };
      }).sort((a, b) => b.averageProductivity - a.averageProductivity);

      return res.status(200).json({
        success: true,
        data: { leaderboard, type: 'productivity' }
      });
    } else if (type === 'attendance') {
      // Get users with best attendance rates
      const attendanceStats = await Attendance.aggregate([
        {
          $match: {
            date: { 
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Current month
            }
          }
        },
        {
          $group: {
            _id: '$employee',
            totalDays: { $sum: 1 },
            presentDays: {
              $sum: {
                $cond: [{ $ne: ['$status', 'Absent'] }, 1, 0]
              }
            },
            totalHoursWorked: { $sum: '$totalWorkedHours' },
            lateDays: {
              $sum: {
                $cond: ['$isLate', 1, 0]
              }
            }
          }
        },
        {
          $addFields: {
            attendanceRate: {
              $multiply: [
                { $divide: ['$presentDays', '$totalDays'] },
                100
              ]
            },
            punctualityRate: {
              $multiply: [
                { $divide: [{ $subtract: ['$totalDays', '$lateDays'] }, '$totalDays'] },
                100
              ]
            }
          }
        },
        {
          $sort: { attendanceRate: -1, punctualityRate: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);

      const userIds = attendanceStats.map(stat => stat._id);
      const users = await User.find({ _id: { $in: userIds } })
        .select('firstName lastName employeeId department rewardPoints')
        .lean();

      const leaderboard = users.map(user => {
        const stats = attendanceStats.find(s => s._id.toString() === user._id.toString());
        return {
          ...user,
          attendanceRate: parseFloat((stats?.attendanceRate || 0).toFixed(2)),
          punctualityRate: parseFloat((stats?.punctualityRate || 0).toFixed(2)),
          totalHoursWorked: parseFloat((stats?.totalHoursWorked || 0).toFixed(2)),
          totalDays: stats?.totalDays || 0
        };
      }).sort((a, b) => (b.attendanceRate + b.punctualityRate) - (a.attendanceRate + a.punctualityRate));

      return res.status(200).json({
        success: true,
        data: { leaderboard, type: 'attendance' }
      });
    }

    // Default: Points-based leaderboard
    const leaderboard = await User.find({ isActive: true })
      .select('firstName lastName employeeId department rewardPoints')
      .sort({ rewardPoints: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: { leaderboard, type: 'points' }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
};

// @desc    Get all employees for team management
// @route   GET /api/users/employees
// @access  Private (Admin, HR, Manager)
exports.getEmployees = async (req, res) => {
  try {
    const { 
      department, 
      role, 
      search,
      page = 1,
      limit = 20
    } = req.query;

    let query = { isActive: true };

    // Department filter
    if (department && department !== 'all') {
      query.department = department;
    }

    // Role filter
    if (role && role !== 'all') {
      query.role = role;
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const employees = await User.find(query)
      .select('firstName lastName email employeeId role department joinDate phoneNumber profilePicture isActive')
      .populate('manager', 'firstName lastName employeeId')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    // Get department counts
    const departmentCounts = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get role counts
    const roleCounts = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      data: { 
        employees,
        departmentCounts,
        roleCounts
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// @desc    Get all departments
// @route   GET /api/users/departments
// @access  Private (Admin, HR, Manager, Team Lead)
exports.getDepartments = async (req, res) => {
  try {
    const departments = await User.distinct('department', { 
      isActive: true,
      department: { $ne: null, $ne: '' }
    });

    // Get department counts
    const departmentCounts = await User.aggregate([
      { 
        $match: { 
          isActive: true,
          department: { $ne: null, $ne: '' }
        } 
      },
      { 
        $group: { 
          _id: '$department', 
          count: { $sum: 1 },
          employees: {
            $push: {
              _id: '$_id',
              firstName: '$firstName',
              lastName: '$lastName',
              employeeId: '$employeeId',
              position: '$position',
              role: '$role'
            }
          }
        } 
      },
      { $sort: { count: -1 } },
      {
        $project: {
          department: '$_id',
          count: 1,
          employees: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Departments fetched successfully',
      data: departmentCounts.map(dept => dept.department).sort()
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
};

// @desc    Get all roles
// @route   GET /api/users/roles
// @access  Private (Admin, HR, Manager, Team Lead)
exports.getRoles = async (req, res) => {
  try {
    const roles = await User.distinct('role', { 
      isActive: true,
      role: { $ne: null, $ne: '' }
    });

    // Get role counts
    const roleCounts = await User.aggregate([
      { 
        $match: { 
          isActive: true,
          role: { $ne: null, $ne: '' }
        } 
      },
      { 
        $group: { 
          _id: '$role', 
          count: { $sum: 1 },
          employees: {
            $push: {
              _id: '$_id',
              firstName: '$firstName',
              lastName: '$lastName',
              employeeId: '$employeeId',
              department: '$department',
              position: '$position'
            }
          }
        } 
      },
      { $sort: { count: -1 } },
      {
        $project: {
          role: '$_id',
          count: 1,
          employees: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Roles fetched successfully',
      data: roleCounts.map(role => role.role).sort()
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles',
      error: error.message
    });
  }
};

// @desc    Get team members (for employees to view their colleagues)
// @route   GET /api/users/team-members
// @access  Private (All authenticated users)
exports.getTeamMembers = async (req, res) => {
  try {
    const { 
      department, 
      search,
      page = 1,
      limit = 50
    } = req.query;

    const currentUser = req.user;
    let query = { isActive: true };

    // If user is Employee, only show users from same department
    if (currentUser.role === 'Employee') {
      query.department = currentUser.department;
    }

    // Department filter (for managers/hr/admin)
    if (department && department !== 'all' && currentUser.role !== 'Employee') {
      query.department = department;
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Select limited fields for privacy
    const selectFields = currentUser.role === 'Employee' 
      ? 'firstName lastName employeeId role department position profilePicture isActive'
      : 'firstName lastName email employeeId role department position joinDate phoneNumber profilePicture isActive';

    const teamMembers = await User.find(query)
      .select(selectFields)
      .populate('manager', 'firstName lastName employeeId')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Add fullName for consistency
    const formattedTeamMembers = teamMembers.map(member => ({
      ...member.toObject(),
      fullName: `${member.firstName} ${member.lastName}`
    }));

    res.status(200).json({
      success: true,
      message: 'Team members fetched successfully',
      data: {
        employees: formattedTeamMembers,
        totalEmployees: total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        hasNextPage: skip + formattedTeamMembers.length < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team members',
      error: error.message
    });
  }
};
