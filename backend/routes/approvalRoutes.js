const express = require('express');
const {
  getPendingApprovals,
  approveUser,
  rejectUser
} = require('../controllers/approvalController');
const { protect, authorize } = require('../utils/roleMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin only routes
router.get('/pending-approvals', authorize('Admin'), getPendingApprovals);
router.put('/approve-user/:id', authorize('Admin'), approveUser);
router.put('/reject-user/:id', authorize('Admin'), rejectUser);

module.exports = router;
