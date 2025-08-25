const express = require('express');
const {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendNotification
} = require('../controllers/notificationController');

const { protect, authorize, logAction } = require('../utils/roleMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get user notifications
router.get('/', logAction('Get Notifications', 'System'), getNotifications);
router.get('/unread-count', getUnreadCount);

// Send notification (Admin/HR/Manager/TeamLead only)
router.post('/send', authorize('Admin', 'HR', 'Manager', 'Team Lead'), sendNotification);

// Mark notifications as read
router.put('/:id/read', logAction('Mark Notification Read', 'System'), markNotificationAsRead);
router.put('/mark-all-read', logAction('Mark All Notifications Read', 'System'), markAllAsRead);

// Delete notification
router.delete('/:id', logAction('Delete Notification', 'System'), deleteNotification);

module.exports = router;
