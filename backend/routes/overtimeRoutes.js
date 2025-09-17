const express = require('express');
const router = express.Router();
const {
  submitOvertime,
  getMyOvertimeRequests,
  getAllOvertimeRequests,
  updateOvertimeStatus,
  getOvertimeStats,
  deleteOvertimeRequest
} = require('../controllers/overtimeController');
const { protect } = require('../utils/roleMiddleware');

// All routes require authentication
router.use(protect);

// Employee routes
router.post('/', submitOvertime);
router.get('/my-requests', getMyOvertimeRequests);
router.get('/stats', getOvertimeStats);
router.delete('/:id', deleteOvertimeRequest);

// Admin/Manager routes
router.get('/all', getAllOvertimeRequests);
router.put('/:id/status', updateOvertimeStatus);

module.exports = router;