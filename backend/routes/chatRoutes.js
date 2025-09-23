const express = require('express');
const router = express.Router();
const { protect } = require('../utils/roleMiddleware');
const chatController = require('../controllers/chatController');

// Chat routes
router.post('/direct', protect, chatController.createDirectChat);
router.get('/user-chats', protect, chatController.getUserChats);
router.get('/:chatId', protect, chatController.getChatDetails);
router.put('/:chatId/read', protect, chatController.markChatAsRead);
router.delete('/:chatId', protect, chatController.deleteChat);

module.exports = router;