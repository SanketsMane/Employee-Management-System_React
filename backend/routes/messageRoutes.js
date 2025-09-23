const express = require('express');
const router = express.Router();
const { protect } = require('../utils/roleMiddleware');
const upload = require('../utils/multerConfig');

// Import controllers
const messageController = require('../controllers/messageController');
const groupController = require('../controllers/groupController');

// Message routes
router.post('/', protect, messageController.sendMessage);
router.get('/users', protect, messageController.getAvailableUsers);
router.post('/upload', protect, upload.single('file'), messageController.uploadMessageFile);
router.put('/:messageId/read', protect, messageController.markMessageAsRead);
router.delete('/:messageId', protect, messageController.deleteMessage);

// Chat routes - specific routes first
router.delete('/:chatId/clear', protect, messageController.clearChatMessages);
router.get('/:chatId', protect, messageController.getMessages);

// Group routes
router.post('/groups', protect, groupController.createGroup);
router.get('/groups', protect, groupController.getUserGroups);
router.get('/groups/:groupId', protect, groupController.getGroupDetails);
router.post('/groups/:groupId/members', protect, groupController.addGroupMembers);
router.delete('/groups/:groupId/members/:userId', protect, groupController.removeGroupMember);
router.put('/groups/:groupId/settings', protect, groupController.updateGroupSettings);
router.delete('/groups/:groupId', protect, groupController.deleteGroup);

module.exports = router;