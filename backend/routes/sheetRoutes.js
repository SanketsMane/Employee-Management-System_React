const express = require('express');
const {
  createOrUpdateWorksheet,
  getWorksheets,
  getWorksheet,
  getTodayWorksheet,
  submitWorksheet,
  approveWorksheet,
  getWorksheetStats
} = require('../controllers/sheetController');

const { protect, authorize, logAction } = require('../utils/roleMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

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
