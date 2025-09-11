const express = require('express');
const router = express.Router();
const {
  createBugReport,
  getAllBugReports,
  getUserBugReports,
  getAssignedBugReports,
  updateBugReportStatus,
  updateAssignedBugReport,
  getBugReportById,
  uploadScreenshot,
  deleteBugReport
} = require('../controllers/bugReportController');
const { protect, authorize, logAction } = require('../utils/roleMiddleware');
const upload = require('../utils/multerConfig');

// Apply authentication middleware to all routes
router.use(protect);

// Admin only routes (must be defined before parameterized routes)
router.get('/', authorize('Admin'), getAllBugReports);
router.put('/:id/status', authorize('Admin'), logAction('update_bug_status'), updateBugReportStatus);
router.delete('/:id', authorize('Admin'), logAction('delete_bug_report'), deleteBugReport);

// Create a new bug report
router.post('/', logAction('create_bug_report'), createBugReport);

// Get user's own bug reports
router.get('/my-reports', getUserBugReports);

// Get bugs assigned to current user
router.get('/assigned-to-me', getAssignedBugReports);

// Update assigned bug status (for assigned employees)
router.put('/:id/update', updateAssignedBugReport);

// Upload screenshot for bug report
router.post('/:id/screenshot', upload.single('screenshot'), uploadScreenshot);

// Get bug report by ID (must be last among GET routes)
router.get('/:id', getBugReportById);

module.exports = router;
