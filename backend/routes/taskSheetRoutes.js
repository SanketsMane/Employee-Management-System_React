const express = require('express');
const {
  createOrUpdateTaskSheet,
  submitTaskSheet,
  getMyTaskSheets,
  getTodayTaskSheet,
  getAllTaskSheets,
  reviewTaskSheet,
  getTaskSheetStats
} = require('../controllers/taskSheetController');
const { protect, authorize } = require('../utils/roleMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Personal task sheet routes
router.route('/')
  .post(createOrUpdateTaskSheet)
  .get(authorize('Admin', 'HR', 'Manager', 'Team Lead'), getAllTaskSheets);

router.get('/my', getMyTaskSheets);
router.get('/today', getTodayTaskSheet);
router.get('/stats', authorize('Admin', 'HR', 'Manager', 'Team Lead'), getTaskSheetStats);

router.put('/:id/submit', submitTaskSheet);
router.put('/:id/review', authorize('Admin', 'HR', 'Manager', 'Team Lead'), reviewTaskSheet);

module.exports = router;
