const express = require('express');
const {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  changePassword,
  updateProfile
} = require('../controllers/authController');

const { protect, authorize, logAction } = require('../utils/roleMiddleware');

const router = express.Router();

// Public routes
router.post('/register', logAction('User Registration', 'Authentication'), register);
router.post('/login', logAction('User Login', 'Authentication'), login);
router.post('/forgotpassword', logAction('Forgot Password', 'Authentication'), forgotPassword);

// Protected routes
router.use(protect); // Apply authentication middleware to all routes below

router.get('/me', logAction('Get Profile', 'Authentication'), getMe);
router.put('/profile', logAction('Update Profile', 'Authentication'), updateProfile);
router.post('/logout', logAction('User Logout', 'Authentication'), logout);
router.put('/changepassword', logAction('Change Password', 'Authentication'), changePassword);

module.exports = router;
