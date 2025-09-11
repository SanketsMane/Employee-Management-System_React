const express = require('express');
const { 
  getSystemConfig,
  getAllSystemConfigs,
  addConfigItem,
  updateConfigItem,
  deleteConfigItem,
  reorderConfigItems
} = require('../controllers/systemConfigController');
const { protect, authorize } = require('../utils/roleMiddleware');

const router = express.Router();

// Apply authentication middleware
router.use(protect);

// Get all system configurations
router.get('/', authorize('Admin', 'HR', 'Manager', 'Team Lead'), getAllSystemConfigs);

// Get specific configuration type
router.get('/:type', authorize('Admin', 'HR', 'Manager', 'Team Lead'), getSystemConfig);

// Admin-only routes for managing configurations
router.post('/:type', authorize('Admin'), addConfigItem);
router.put('/:type/:itemId', authorize('Admin'), updateConfigItem);
router.delete('/:type/:itemId', authorize('Admin'), deleteConfigItem);
router.put('/:type/reorder', authorize('Admin'), reorderConfigItems);

module.exports = router;
