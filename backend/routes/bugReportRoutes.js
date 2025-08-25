const express = require('express');
const router = express.Router();
const {
  createBugReport,
  getAllBugReports,
  getUserBugReports,
  updateBugReportStatus,
  getBugReportById,
  uploadScreenshot,
  deleteBugReport
} = require('../controllers/bugReportController');
const { protect, authorize, logAction } = require('../utils/roleMiddleware');
const upload = require('../utils/multerConfig');

// Apply authentication middleware to all routes
router.use(protect);

// Create a new bug report
router.post('/', logAction('create_bug_report'), createBugReport);

// Get user's own bug reports
router.get('/my-reports', getUserBugReports);

// Get bug report by ID
router.get('/:id', getBugReportById);

// Upload screenshot for bug report
router.post('/:id/screenshot', upload.single('screenshot'), uploadScreenshot);

// Admin only routes
router.get('/', authorize(['Admin']), getAllBugReports);
router.put('/:id/status', authorize(['Admin']), logAction('update_bug_status'), updateBugReportStatus);
router.delete('/:id', authorize(['Admin']), logAction('delete_bug_report'), deleteBugReport);

module.exports = router;
