const express = require('express');
const {
  createOrUpdateWorksheet,
  getWorksheets,
  getWorksheet,
  getTodayWorksheet,
  submitWorksheet,
  approveWorksheet,
  getWorksheetStats,
  getAllWorksheetsAdmin,
  exportWorksheets
} = require('../controllers/sheetController');

const { protect, authorize, logAction } = require('../utils/roleMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Admin/Manager routes (must be before general routes)
router.get('/admin/all', 
  authorize('Admin', 'HR', 'Manager'),
  logAction('View All Worksheets', 'Worksheet'), 
  getAllWorksheetsAdmin
);

router.get('/admin/export', 
  authorize('Admin', 'HR', 'Manager'),
  logAction('Export Worksheets', 'Worksheet'), 
  exportWorksheets
);

// Worksheet operations
router.post('/', logAction('Create/Update Worksheet', 'Worksheet'), createOrUpdateWorksheet);
router.get('/today', getTodayWorksheet);
router.get('/stats', getWorksheetStats);
router.get('/:id', getWorksheet);
router.put('/:id/submit', logAction('Submit Worksheet', 'Worksheet'), submitWorksheet);

// Management operations (require elevated permissions)
router.put(
  '/:id/approve', 
  authorize('Manager', 'Team Lead', 'HR', 'Admin'),
  logAction('Approve/Reject Worksheet', 'Worksheet'), 
  approveWorksheet
);

router.get('/', getWorksheets);

module.exports = router;
