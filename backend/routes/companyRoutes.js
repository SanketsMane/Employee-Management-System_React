const express = require('express');
const { 
  getCompanyInfo, 
  updateCompanyInfo,
  getCompanySettings,
  createOrUpdateCompanySettings,
  testAttendanceRules
} = require('../controllers/companyController');
const { protect, authorize } = require('../utils/roleMiddleware');

const router = express.Router();

// Apply authentication middleware
router.use(protect);

// Company routes
router.get('/info', authorize('Admin', 'HR'), getCompanyInfo);
router.put('/info', authorize('Admin'), updateCompanyInfo);

// Company settings routes
router.get('/settings', getCompanySettings);
router.post('/settings', authorize('Admin'), createOrUpdateCompanySettings);
router.post('/settings/test-rules', authorize('Admin'), testAttendanceRules);

module.exports = router;
