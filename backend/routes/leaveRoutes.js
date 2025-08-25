const express = require('express');
const {
  submitLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  updateLeaveStatus,
  cancelLeaveRequest,
  getLeaveStats,
  getLeaveBalance
} = require('../controllers/leaveController');

const { protect, authorize, logAction } = require('../utils/roleMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Employee leave operations
router.post('/', logAction('Submit Leave Request', 'Leave'), submitLeaveRequest);
router.get('/stats', getLeaveStats);
router.get('/balance', getLeaveBalance);
router.get('/:id', getLeaveRequest);
router.put('/:id/cancel', logAction('Cancel Leave Request', 'Leave'), cancelLeaveRequest);

// Management operations (require elevated permissions)
router.put(
  '/:id/status', 
  authorize('HR', 'Manager', 'Team Lead', 'Admin'),
  logAction('Approve/Reject Leave', 'Leave'), 
  updateLeaveStatus
);

router.get('/', getLeaveRequests);

module.exports = router;
