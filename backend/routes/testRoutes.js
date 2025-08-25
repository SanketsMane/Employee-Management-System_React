const express = require('express');
const { testEmail, healthCheck } = require('../controllers/testController');
const { protect, authorize } = require('../utils/roleMiddleware');
const Attendance = require('../models/Attendance');

const router = express.Router();

// Health check endpoint (public)
router.get('/health', healthCheck);

// Test attendance data endpoint
router.get('/attendance-debug', protect, async (req, res) => {
  try {
    console.log('🧪 Debug attendance endpoint called');
    
    // Get all attendance records
    const allAttendance = await Attendance.find()
      .populate('employee', 'firstName lastName email department employeeId')
      .sort({ date: -1 })
      .limit(10);
    
    console.log('📋 All attendance records:', allAttendance.map(a => ({
      employee: `${a.employee?.firstName} ${a.employee?.lastName}`,
      date: a.date,
      clockIn: a.clockIn,
      status: a.status,
      id: a._id
    })));
    
    // Get today's records specifically
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayRecords = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    })
    .populate('employee', 'firstName lastName email department employeeId')
    .sort({ date: -1 });
    
    console.log("📅 Today's records:", todayRecords.map(a => ({
      employee: `${a.employee?.firstName} ${a.employee?.lastName}`,
      date: a.date,
      status: a.status
    })));
    
    res.json({
      success: true,
      totalRecords: allAttendance.length,
      todayRecords: todayRecords.length,
      data: {
        all: allAttendance,
        today: todayRecords
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test email endpoint (admin only)
router.post('/email', protect, authorize(['Admin']), testEmail);

module.exports = router;
