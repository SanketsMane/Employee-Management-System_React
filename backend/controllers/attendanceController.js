const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Log = require('../models/Log');
const CompanySettings = require('../models/CompanySettings');
const { createNotification } = require('./notificationController');

// @desc    Clock in
// @route   POST /api/attendance/clockin
// @access  Private
exports.clockIn = async (req, res) => {
  try {
    console.log('🕐 Clock in request received');
    console.log('User:', req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})` : 'No user');
    console.log('Request body:', req.body);

    const { location, notes } = req.body;
    const userId = req.user._id;
    
    // Check if user already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('📅 Checking for existing attendance between:', today, 'and', tomorrow);

    const existingAttendance = await Attendance.findOne({
      employee: userId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    console.log('🔍 Existing attendance:', existingAttendance ? 'Found' : 'Not found');

    if (existingAttendance && existingAttendance.clockIn) {
      console.log('❌ Already clocked in today');
      return res.status(400).json({
        success: false,
        message: 'You have already clocked in today'
      });
    }

    const clockInTime = new Date();
    console.log('⏰ Clock in time:', clockInTime);
    
    // Process location data
    let locationData = {
      type: 'Office',
      coordinates: {},
      address: ''
    };

    if (location) {
      if (typeof location === 'object' && location.latitude && location.longitude) {
        // GPS coordinates provided
        locationData.coordinates = {
          latitude: location.latitude,
          longitude: location.longitude
        };
        locationData.type = 'Remote'; // Assume remote if GPS provided
        locationData.address = location.address || 'GPS Location';
      } else if (typeof location === 'string') {
        // String location provided
        locationData.type = location;
      }
    }

    console.log('📍 Location data:', locationData);

    // Get company settings for attendance rules
    const companySettings = await CompanySettings.findOne({ 
      companyName: req.user.company || 'Default Company',
      isActive: true 
    });

    let status = 'Present';
    let remarks = '';
    
    if (companySettings) {
      console.log('⚙️ Using company settings for attendance calculation');
      const result = companySettings.calculateAttendanceStatus(clockInTime);
      status = result.status;
      remarks = result.remarks;
      console.log('📊 Calculated status:', status, '- Remarks:', remarks);
    } else {
      console.log('⚠️ No company settings found, using default logic');
      // Default logic for backward compatibility
      const workStartTime = new Date(today);
      workStartTime.setHours(9, 0, 0, 0); // 9:00 AM
      
      const lateThreshold = new Date(workStartTime);
      lateThreshold.setMinutes(lateThreshold.getMinutes() + 15); // 9:15 AM
      
      if (clockInTime <= workStartTime) {
        status = 'Present';
        remarks = 'On time';
      } else if (clockInTime <= lateThreshold) {
        status = 'Present';
        remarks = 'Within grace period';
      } else {
        status = 'Late';
        const minutesLate = Math.round((clockInTime - workStartTime) / (1000 * 60));
        remarks = `Late by ${minutesLate} minutes`;
      }
    }

    const attendanceData = {
      employee: userId,
      date: today,
      clockIn: clockInTime,
      status: status,
      remarks: remarks,
      location: locationData,
      notes,
      ipAddress: req.ip
    };

    console.log('💾 Creating attendance record with data:', attendanceData);

    // Create or update attendance record
    let attendance;
    if (existingAttendance) {
      console.log('🔄 Updating existing attendance record');
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        attendanceData,
        { new: true }
      ).populate('employee', 'firstName lastName employeeId');
    } else {
      console.log('🆕 Creating new attendance record');
      attendance = await Attendance.create(attendanceData);
      attendance = await Attendance.findById(attendance._id)
        .populate('employee', 'firstName lastName employeeId');
    }

    console.log('✅ Attendance record created/updated:', attendance._id);

    // Award punctuality points (if clocked in before 9:15 AM)
    const punctualTime = new Date(today);
    punctualTime.setHours(9, 15, 0, 0);

    if (clockInTime <= punctualTime) {
      console.log('🌟 Awarding punctuality points');
      await User.findByIdAndUpdate(userId, {
        $inc: { rewardPoints: 5 }
      });
    }

    // Log the clock in
    console.log('📝 Creating log entry');
    await Log.create({
      user: userId,
      action: 'Clock In',
      category: 'Attendance',
      details: `Employee clocked in at ${clockInTime.toLocaleString()}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    // Create notification
    console.log('🔔 Creating notification');
    try {
      await createNotification(
        userId,                    // senderId
        userId,                    // recipients
        'Clock In Successful',     // title
        `You clocked in at ${clockInTime.toLocaleTimeString()}`, // message
        'success',                 // type
        'Medium',                  // priority
        '/attendance'              // actionUrl
      );
      console.log('✅ Notification created successfully');
    } catch (notificationError) {
      console.warn('⚠️ Notification creation failed:', notificationError);
      // Don't fail the entire clock-in process if notification fails
    }

    console.log('✅ Clock in successful, sending response');
    res.status(201).json({
      success: true,
      message: 'Clocked in successfully',
      data: { attendance }
    });
  } catch (error) {
    console.error('❌ Clock in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clocking in',
      error: error.message
    });
  }
};

// @desc    Clock out
// @route   PUT /api/attendance/clockout
// @access  Private
exports.clockOut = async (req, res) => {
  try {
    const { notes } = req.body;
    const userId = req.user._id;
    
    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'You need to clock in first'
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: 'You have already clocked out today'
      });
    }

    const clockOutTime = new Date();
    
    // End any ongoing break
    if (attendance.breaks && attendance.breaks.length > 0) {
      const lastBreak = attendance.breaks[attendance.breaks.length - 1];
      if (!lastBreak.endTime) {
        lastBreak.endTime = clockOutTime;
      }
    }

    attendance.clockOut = clockOutTime;
    attendance.status = 'Clocked Out';
    if (notes) attendance.notes = notes;

    await attendance.save();

    // Award completion points
    await User.findByIdAndUpdate(userId, {
      $inc: { rewardPoints: 10 }
    });

    // Log the clock out
    await Log.create({
      user: userId,
      action: 'Clock Out',
      category: 'Attendance',
      details: `Employee clocked out at ${clockOutTime.toLocaleString()}. Total worked: ${attendance.totalWorkedHours.toFixed(2)} hours`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    const updatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Clocked out successfully',
      data: { attendance: updatedAttendance }
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clocking out',
      error: error.message
    });
  }
};

// @desc    Start break
// @route   POST /api/attendance/break/start
// @access  Private
exports.startBreak = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user._id;
    
    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'You need to clock in first'
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start break after clocking out'
      });
    }

    // Check if there's an ongoing break
    const ongoingBreak = attendance.breaks.find(b => !b.endTime);
    if (ongoingBreak) {
      return res.status(400).json({
        success: false,
        message: 'You are already on a break'
      });
    }

    const breakStart = new Date();
    attendance.breaks.push({
      startTime: breakStart,
      reason: reason || 'Break'
    });
    attendance.status = 'On Break';

    await attendance.save();

    // Log the break start
    await Log.create({
      user: userId,
      action: 'Break Started',
      category: 'Attendance',
      details: `Employee started break at ${breakStart.toLocaleString()}. Reason: ${reason || 'Break'}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.status(200).json({
      success: true,
      message: 'Break started successfully',
      data: { attendance }
    });
  } catch (error) {
    console.error('Start break error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting break',
      error: error.message
    });
  }
};

// @desc    End break
// @route   PUT /api/attendance/break/end
// @access  Private
exports.endBreak = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'You need to clock in first'
      });
    }

    // Find the ongoing break
    const ongoingBreak = attendance.breaks.find(b => !b.endTime);
    if (!ongoingBreak) {
      return res.status(400).json({
        success: false,
        message: 'You are not currently on a break'
      });
    }

    const breakEnd = new Date();
    ongoingBreak.endTime = breakEnd;
    attendance.status = attendance.clockOut ? 'Clocked Out' : 'Present';

    await attendance.save();

    const breakDuration = (breakEnd - ongoingBreak.startTime) / (1000 * 60); // in minutes

    // Log the break end
    await Log.create({
      user: userId,
      action: 'Break Ended',
      category: 'Attendance',
      details: `Employee ended break at ${breakEnd.toLocaleString()}. Duration: ${breakDuration.toFixed(1)} minutes`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.status(200).json({
      success: true,
      message: 'Break ended successfully',
      data: { 
        attendance,
        breakDuration: `${breakDuration.toFixed(1)} minutes`
      }
    });
  } catch (error) {
    console.error('End break error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending break',
      error: error.message
    });
  }
};

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = async (req, res) => {
  try {
    const { 
      employeeId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10,
      status
    } = req.query;
    
    const userId = req.user._id;
    const userRole = req.user.role;

    // Build query
    let query = {};
    
    // Role-based access control
    if (['Admin', 'HR'].includes(userRole)) {
      // Admin and HR can view all records
      if (employeeId) {
        query.employee = employeeId;
      }
    } else if (userRole === 'Manager') {
      // Managers can view their team members
      if (employeeId) {
        const employee = await User.findById(employeeId);
        if (!employee || employee.manager?.toString() !== userId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this employee\'s attendance'
          });
        }
        query.employee = employeeId;
      } else {
        // Get all team members
        const teamMembers = await User.find({ manager: userId }).select('_id');
        query.employee = { $in: teamMembers.map(member => member._id) };
      }
    } else if (userRole === 'Team Lead') {
      // Team leads can view their team members
      if (employeeId) {
        const employee = await User.findById(employeeId);
        if (!employee || employee.teamLead?.toString() !== userId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this employee\'s attendance'
          });
        }
        query.employee = employeeId;
      } else {
        // Get all team members
        const teamMembers = await User.find({ teamLead: userId }).select('_id');
        query.employee = { $in: teamMembers.map(member => member._id) };
      }
    } else {
      // Regular employees can only view their own records
      query.employee = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (page - 1) * limit;

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      count: attendance.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      data: { attendance }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  Private
exports.getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('employee', 'firstName lastName employeeId');

    // Check if on break
    let onBreak = false;
    let currentBreak = null;
    
    if (attendance && attendance.breaks.length > 0) {
      currentBreak = attendance.breaks.find(b => !b.endTime);
      onBreak = !!currentBreak;
    }

    res.status(200).json({
      success: true,
      data: {
        attendance,
        onBreak,
        currentBreak,
        canClockIn: !attendance || !attendance.clockIn,
        canClockOut: attendance && attendance.clockIn && !attendance.clockOut,
        canStartBreak: attendance && attendance.clockIn && !attendance.clockOut && !onBreak,
        canEndBreak: onBreak
      }
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s attendance',
      error: error.message
    });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private
exports.getAttendanceStats = async (req, res) => {
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

    const attendance = await Attendance.find({
      employee: targetUserId,
      date: { $gte: startDate }
    });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status !== 'Absent').length;
    const lateDays = attendance.filter(a => a.isLate).length;
    const totalWorkedHours = attendance.reduce((sum, a) => sum + (a.totalWorkedHours || 0), 0);
    const totalBreakTime = attendance.reduce((sum, a) => sum + (a.totalBreakTime || 0), 0);
    const averageWorkHours = totalDays > 0 ? totalWorkedHours / totalDays : 0;
    const averageBreakTime = totalDays > 0 ? totalBreakTime / totalDays : 0;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    const punctualityRate = totalDays > 0 ? ((totalDays - lateDays) / totalDays) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        period: `${daysBack} days`,
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        lateDays,
        totalWorkedHours: parseFloat(totalWorkedHours.toFixed(2)),
        totalBreakTime: parseFloat(totalBreakTime.toFixed(2)),
        averageWorkHours: parseFloat(averageWorkHours.toFixed(2)),
        averageBreakTime: parseFloat(averageBreakTime.toFixed(2)),
        attendanceRate: parseFloat(attendanceRate.toFixed(2)),
        punctualityRate: parseFloat(punctualityRate.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance statistics',
      error: error.message
    });
  }
};

// @desc    Get all employees attendance (for Admin, HR, Manager)
// @route   GET /api/attendance/all
// @access  Private/Admin/HR/Manager
exports.getAllAttendance = async (req, res) => {
  try {
    console.log('🔍 getAllAttendance API called');
    console.log('User:', req.user?.firstName, req.user?.lastName, '- Role:', req.user?.role);
    console.log('Query params:', req.query);
    
    // Check user permissions
    if (!['Admin', 'HR', 'Manager', 'Team Lead'].includes(req.user.role)) {
      console.log('❌ Access denied for role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      employee, 
      department,
      status 
    } = req.query;

    console.log('📊 Fetching attendance with params:', {
      page, limit, startDate, endDate, employee, department, status
    });

    const skip = (page - 1) * limit;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        dateFilter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date.$lte = end;
      }
    }
    
    console.log('📅 Date filter:', dateFilter);

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
          'employeeData.isActive': true,
          'employeeData.isApproved': true,
          ...dateFilter
        }
      }
    ];

    // If Team Lead, only show their team members
    if (req.user.role === 'Team Lead') {
      pipeline.push({
        $match: {
          $or: [
            { 'employeeData.teamLead': req.user._id },
            { 'employeeData._id': req.user._id }
          ]
        }
      });
    }

    // Add employee filter
    if (employee) {
      pipeline.push({
        $match: { 'employee': new mongoose.Types.ObjectId(employee) }
      });
    }

    // Add department filter
    if (department) {
      pipeline.push({
        $match: { 'employeeData.department': department }
      });
    }

    // Add status filter
    if (status) {
      if (status === 'present') {
        pipeline.push({
          $match: { clockIn: { $exists: true } }
        });
      } else if (status === 'absent') {
        pipeline.push({
          $match: { clockIn: { $exists: false } }
        });
      }
    }

    // Add sorting, pagination and projection
    pipeline.push(
      { $sort: { date: -1, 'employeeData.firstName': 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          date: 1,
          clockIn: 1,
          clockOut: 1,
          breaks: 1,
          location: 1,
          notes: 1,
          totalWorkTime: 1,
          totalBreakTime: 1,
          status: 1,
          createdAt: 1,
          employee: {
            _id: '$employeeData._id',
            firstName: '$employeeData.firstName',
            lastName: '$employeeData.lastName',
            email: '$employeeData.email',
            employeeId: '$employeeData.employeeId',
            department: '$employeeData.department',
            role: '$employeeData.role'
          }
        }
      }
    );

    const attendanceRecords = await Attendance.aggregate(pipeline);

    // Get total count for pagination
    let countPipeline = [...pipeline];
    countPipeline.pop(); // Remove limit
    countPipeline.pop(); // Remove skip
    countPipeline.pop(); // Remove sort
    countPipeline.push({ $count: 'total' });

    const totalResult = await Attendance.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    console.log('📈 Results:', {
      attendanceRecords: attendanceRecords.length,
      total,
      firstRecord: attendanceRecords[0] ? {
        employee: attendanceRecords[0].employee,
        date: attendanceRecords[0].date,
        status: attendanceRecords[0].status
      } : 'No records'
    });

    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: attendanceRecords
    });
  } catch (error) {
    console.error('❌ Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
};

// @desc    Get employee attendance summary
// @route   GET /api/attendance/employee-summary
// @access  Private/Admin/HR/Manager/Employee
exports.getEmployeeAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    
    // Determine which employee's data to fetch
    let targetEmployeeId = req.user._id;
    
    if (employeeId && ['Admin', 'HR', 'Manager', 'Team Lead'].includes(req.user.role)) {
      targetEmployeeId = employeeId;
      
      // If Team Lead, verify they can access this employee's data
      if (req.user.role === 'Team Lead') {
        const employee = await User.findById(employeeId);
        if (!employee || 
            (employee.teamLead?.toString() !== req.user._id.toString() && 
             employee._id.toString() !== req.user._id.toString())) {
          return res.status(403).json({
            success: false,
            message: 'You can only view attendance of your team members'
          });
        }
      }
    }

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      employee: targetEmployeeId,
      date: { $gte: startDate, $lte: endDate }
    })
    .populate('employee', 'firstName lastName employeeId department')
    .sort({ date: 1 });

    // Calculate summary statistics
    const totalDays = new Date(targetYear, targetMonth, 0).getDate();
    const presentDays = attendanceRecords.filter(record => record.clockIn).length;
    const absentDays = totalDays - presentDays;
    
    let totalWorkHours = 0;
    let totalBreakTime = 0;
    let lateDays = 0;
    
    const workingDays = [];
    const expectedStartTime = 9; // 9 AM

    attendanceRecords.forEach(record => {
      if (record.clockIn) {
        // Calculate work hours
        if (record.totalWorkTime) {
          totalWorkHours += record.totalWorkTime;
        }
        
        // Calculate break time
        if (record.totalBreakTime) {
          totalBreakTime += record.totalBreakTime;
        }
        
        // Check if late
        const clockInTime = new Date(record.clockIn);
        if (clockInTime.getHours() > expectedStartTime || 
           (clockInTime.getHours() === expectedStartTime && clockInTime.getMinutes() > 0)) {
          lateDays++;
        }
      }
      
      workingDays.push({
        date: record.date,
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        status: record.clockIn ? 'Present' : 'Absent',
        workHours: record.totalWorkTime || 0,
        breakTime: record.totalBreakTime || 0,
        isLate: record.clockIn ? 
          (new Date(record.clockIn).getHours() > expectedStartTime ||
           (new Date(record.clockIn).getHours() === expectedStartTime && new Date(record.clockIn).getMinutes() > 0)) : false
      });
    });

    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    const punctualityRate = presentDays > 0 ? ((presentDays - lateDays) / presentDays) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        employee: attendanceRecords[0]?.employee || await User.findById(targetEmployeeId).select('firstName lastName employeeId department'),
        month: targetMonth,
        year: targetYear,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          totalWorkHours: parseFloat((totalWorkHours / 3600).toFixed(2)), // Convert to hours
          totalBreakTime: parseFloat((totalBreakTime / 3600).toFixed(2)), // Convert to hours
          attendanceRate: parseFloat(attendanceRate.toFixed(2)),
          punctualityRate: parseFloat(punctualityRate.toFixed(2))
        },
        workingDays
      }
    });
  } catch (error) {
    console.error('Get employee attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee attendance summary',
      error: error.message
    });
  }
};

// @desc    Get attendance history for calendar view
// @route   GET /api/attendance/history
// @access  Private
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user._id;
    
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();
    
    console.log(`📅 Fetching attendance history for user ${userId}, month: ${targetMonth}, year: ${targetYear}`);
    
    // Create date range for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    console.log('📅 Date range:', startDate, 'to', endDate);
    
    const attendanceRecords = await Attendance.find({
      employee: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });
    
    console.log(`📊 Found ${attendanceRecords.length} attendance records`);
    
    // Get company settings for consistent status calculation
    const companySettings = await CompanySettings.findOne({ 
      companyName: req.user.company || 'Default Company',
      isActive: true 
    });
    
    // Transform data for calendar view
    const historyData = attendanceRecords.map(record => {
      let status = record.status || 'Absent'; // Use stored status if available
      
      // If no stored status, calculate based on company settings or default logic
      if (!record.status && record.clockIn) {
        if (companySettings) {
          const result = companySettings.calculateAttendanceStatus(record.clockIn, record.clockOut);
          status = result.status;
        } else {
          // Default logic for backward compatibility
          const clockInTime = new Date(record.clockIn);
          const expectedStartTime = 9; // 9 AM
          
          if (clockInTime.getHours() > expectedStartTime || 
             (clockInTime.getHours() === expectedStartTime && clockInTime.getMinutes() > 15)) {
            status = 'Late';
          } else {
            status = 'Present';
          }
        }
      }
      
      return {
        date: record.date,
        clockInTime: record.clockIn,
        clockOutTime: record.clockOut,
        status: status,
        remarks: record.remarks || '',
        totalWorkTime: record.totalWorkTime || 0,
        totalBreakTime: record.totalBreakTime || 0,
        breaks: record.breaks || []
      };
    });
    
    res.status(200).json({
      success: true,
      data: historyData
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance history',
      error: error.message
    });
  }
};
