const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadDocument,
  getDashboardData,
  getLeaderboard,
  getEmployees,
  getDepartments,
  getRoles
} = require('../controllers/userController');

const { protect, authorize, logAction } = require('../utils/roleMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Public user operations (all authenticated users)
router.get('/leaderboard', authorize('Admin', 'HR'), getLeaderboard);
router.get('/employees', authorize('Admin', 'HR', 'Manager'), getEmployees);
router.get('/departments', authorize('Admin', 'HR', 'Manager', 'Team Lead'), getDepartments);
router.get('/roles', authorize('Admin', 'HR', 'Manager', 'Team Lead'), getRoles);
router.get('/:id/dashboard', getDashboardData);
router.get('/:id', getUser);
router.put('/:id', logAction('Update User Profile', 'Profile'), updateUser);

// Document upload
router.post('/:id/documents', logAction('Upload Document', 'Profile'), uploadDocument);

// Admin operations
router.get('/', authorize('Admin', 'HR', 'Manager', 'Team Lead'), getUsers);
router.delete('/:id', authorize('Admin'), logAction('Delete User', 'Admin'), deleteUser);

module.exports = router;
