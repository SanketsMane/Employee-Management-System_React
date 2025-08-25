const express = require('express');
const {
  getOverviewAnalytics,
  getAttendanceAnalytics,
  getLeavesAnalytics,
  getProductivityAnalytics,
  getAttendanceTrends
} = require('../controllers/analyticsController');
const { getLeaderboard } = require('../controllers/leaderboardController');

const { protect, authorize } = require('../utils/roleMiddleware');

const router = express.Router();

// Apply authentication and authorization middleware
router.use(protect);
router.use(authorize('Admin', 'HR', 'Manager'));

// Analytics routes
router.get('/overview', getOverviewAnalytics);
router.get('/attendance', getAttendanceAnalytics);
router.get('/attendance-trends', getAttendanceTrends);
router.get('/leaves', getLeavesAnalytics);
router.get('/productivity', getProductivityAnalytics);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
