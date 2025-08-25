const express = require('express');
const router = express.Router();
const { 
  createUser, 
  getUsersByRole, 
  updateUser, 
  deleteUser, 
  resetUserPassword,
  removeUserApproval
} = require('../controllers/adminUserController');
const { protect, authorize } = require('../utils/roleMiddleware');

// @desc    Create user by admin (Manager, HR, Admin roles)
// @route   POST /api/admin/users/create
// @access  Private/Admin
router.post('/create', protect, authorize('Admin'), createUser);

// @desc    Get all users by role with filtering
// @route   GET /api/admin/users
// @access  Private/Admin/HR/Manager
router.get('/', protect, authorize('Admin', 'HR', 'Manager'), getUsersByRole);

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('Admin'), updateUser);

// @desc    Delete/Deactivate user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('Admin'), deleteUser);

// @desc    Reset user password
// @route   POST /api/admin/users/:id/reset-password
// @access  Private/Admin
router.post('/:id/reset-password', protect, authorize('Admin'), resetUserPassword);

// @desc    Remove user approval
// @route   PUT /api/admin/users/:id/remove-approval
// @access  Private/Admin
router.put('/:id/remove-approval', protect, authorize('Admin'), removeUserApproval);

module.exports = router;
