const express = require('express');
const router = express.Router();
const { 
  createUser, 
  getUsersByRole, 
  updateUser, 
  deleteUser, 
  resetUserPassword,
  removeUserApproval,
  approveUser,
  toggleUserStatus
} = require('../controllers/adminUserController');
const { protect, authorize } = require('../utils/roleMiddleware');

// @desc    Get all users by role with filtering
// @route   GET /api/admin/users
// @access  Private/Admin/HR/Manager
router.get('/', protect, authorize('Admin', 'HR', 'Manager'), getUsersByRole);

// @desc    Create user by admin
// @route   POST /api/admin/users
// @access  Private/Admin
router.post('/', protect, authorize('Admin'), createUser);

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('Admin'), updateUser);

// @desc    Delete/Deactivate user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('Admin'), deleteUser);

// @desc    Approve user
// @route   PATCH /api/admin/users/:id/approve
// @access  Private/Admin
router.patch('/:id/approve', protect, authorize('Admin'), approveUser);

// @desc    Toggle user status (activate/deactivate)
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private/Admin
router.patch('/:id/toggle-status', protect, authorize('Admin'), toggleUserStatus);

// @desc    Reset user password
// @route   POST /api/admin/users/:id/reset-password
// @access  Private/Admin
router.post('/:id/reset-password', protect, authorize('Admin'), resetUserPassword);

// @desc    Remove user approval
// @route   PUT /api/admin/users/:id/remove-approval
// @access  Private/Admin
router.put('/:id/remove-approval', protect, authorize('Admin'), removeUserApproval);

module.exports = router;
