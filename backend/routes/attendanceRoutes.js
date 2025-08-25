const express = require('express');
const {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getAttendance,
  getTodayAttendance,
  getAttendanceStats,
  getAllAttendance,
  getEmployeeAttendanceSummary
} = require('../controllers/attendanceController');

const { protect, authorize, canAccessEmployee, logAction } = require('../utils/roleMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Employee attendance actions
router.post('/clockin', logAction('Clock In', 'Attendance'), clockIn);
router.put('/clockout', logAction('Clock Out', 'Attendance'), clockOut);
router.post('/break/start', logAction('Start Break', 'Attendance'), startBreak);
router.put('/break/end', logAction('End Break', 'Attendance'), endBreak);

// Get attendance data
router.get('/today', getTodayAttendance);
router.get('/stats', getAttendanceStats);
router.get('/all', authorize('Admin', 'HR', 'Manager', 'Team Lead'), getAllAttendance);
router.get('/employee-summary', getEmployeeAttendanceSummary);
router.get('/', getAttendance);

module.exports = router;
