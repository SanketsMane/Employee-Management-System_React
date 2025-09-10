const express = require('express');
const {
  submitLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  updateLeaveStatus,
  cancelLeaveRequest,
  getLeaveStats,
  getLeaveBalance,
  getAllLeavesAdmin,
  getMyLeaves,
  applyForLeave,
  cancelLeaveApplication
} = require('../controllers/leaveController');

const { protect, authorize, logAction } = require('../utils/roleMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Employee leave operations
router.post('/apply', logAction('Apply for Leave', 'Leave'), applyForLeave);
router.get('/my-leaves', getMyLeaves);
router.put('/:id/cancel', logAction('Cancel Leave Application', 'Leave'), cancelLeaveApplication);
router.get('/balance', getLeaveBalance);
router.get('/stats', getLeaveStats);

// Admin/HR/Manager operations
router.get('/admin/all', authorize('Admin', 'HR', 'Manager'), getAllLeavesAdmin);

// Management operations (require elevated permissions)
router.put(
  '/:id/status', 
  authorize('HR', 'Manager', 'Team Lead', 'Admin'),
  logAction('Approve/Reject Leave', 'Leave'), 
  updateLeaveStatus
);

router.get('/', getLeaveRequests);
router.get('/:id', getLeaveRequest);

// Legacy routes (backward compatibility)
router.post('/', logAction('Submit Leave Request', 'Leave'), submitLeaveRequest);

module.exports = router;
