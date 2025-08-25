const express = require('express');
const { getCompanyInfo, updateCompanyInfo } = require('../controllers/companyController');
const { protect, authorize } = require('../utils/roleMiddleware');

const router = express.Router();

// Apply authentication middleware
router.use(protect);

// Company routes
router.get('/info', authorize('Admin', 'HR'), getCompanyInfo);
router.put('/info', authorize('Admin'), updateCompanyInfo);

module.exports = router;
