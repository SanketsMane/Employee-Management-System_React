const express = require('express');
const {
  createAnnouncement,
  getAllAnnouncements,
  getUserAnnouncements,
  getAnnouncementById,
  markAsRead,
  acknowledgeAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize, logAction } = require('../utils/roleMiddleware');
const upload = require('../utils/multerConfig');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Admin/HR routes (must be defined before parameterized routes)
router.get('/admin', authorize('Admin', 'HR'), getAllAnnouncements);
router.post('/', authorize('Admin', 'HR'), logAction('create_announcement'), createAnnouncement);
router.put('/:id', authorize('Admin', 'HR'), logAction('update_announcement'), updateAnnouncement);
router.delete('/:id', authorize('Admin', 'HR'), logAction('delete_announcement'), deleteAnnouncement);

// Public routes (all authenticated users)
router.get('/', getUserAnnouncements);
router.post('/:id/read', logAction('read_announcement'), markAsRead);
router.post('/:id/acknowledge', logAction('acknowledge_announcement'), acknowledgeAnnouncement);

// Get announcement by ID (must be last among GET routes)
router.get('/:id', getAnnouncementById);

module.exports = router;
