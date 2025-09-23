const Chat = require('../models/Chat');
const User = require('../models/User');
const Group = require('../models/Group');

// @desc    Create a direct chat
// @route   POST /api/chat/direct
// @access  Private
exports.createDirectChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create chat with yourself'
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check messaging permissions
    const currentUser = await User.findById(currentUserId);
    let canMessage = false;

    if (['Admin', 'HR', 'Manager', 'Team Lead'].includes(currentUser.role)) {
      canMessage = true;
    } else {
      // Check if users are in same groups
      const commonGroups = await Group.find({
        'members.user': { $all: [currentUserId, userId] },
        isActive: true
      });
      canMessage = commonGroups.length > 0;
    }

    if (!canMessage) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to message this user'
      });
    }

    // Find or create chat
    const chat = await Chat.findOrCreateDirectChat(currentUserId, userId);

    res.status(201).json({
      success: true,
      data: { chat },
      message: 'Chat created successfully'
    });
  } catch (error) {
    console.error('Create direct chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat',
      error: error.message
    });
  }
};

// @desc    Get user's chats
// @route   GET /api/chat/user-chats
// @access  Private
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const chats = await Chat.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'firstName lastName profilePicture role email')
    .populate('group', 'name description privacy')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'firstName lastName'
      }
    })
    .sort({ lastActivity: -1 });

    // Format chats with additional info
    const formattedChats = chats.map(chat => {
      const chatObj = chat.toObject();
      
      // For direct chats, get the other participant
      if (chat.chatType === 'direct') {
        chatObj.otherParticipant = chat.participants.find(
          p => p._id.toString() !== userId.toString()
        );
        // Set chat name as other participant's name
        if (chatObj.otherParticipant) {
          chatObj.name = `${chatObj.otherParticipant.firstName} ${chatObj.otherParticipant.lastName}`;
        }
      } else {
        // For group chats, use group name
        chatObj.name = chat.group?.name || 'Group Chat';
      }
      
      // Add unread count
      chatObj.unreadCount = chat.getUnreadCount(userId);
      
      return chatObj;
    });

    res.status(200).json({
      success: true,
      data: { chats: formattedChats }
    });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chats',
      error: error.message
    });
  }
};

// @desc    Get chat details
// @route   GET /api/chat/:chatId
// @access  Private
exports.getChatDetails = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId)
      .populate('participants', 'firstName lastName profilePicture role email')
      .populate('group', 'name description privacy members');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    if (!chat.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Format chat data
    const chatData = chat.toObject();
    if (chat.chatType === 'direct') {
      chatData.otherParticipant = chat.participants.find(
        p => p._id.toString() !== userId.toString()
      );
    }

    res.status(200).json({
      success: true,
      data: { chat: chatData }
    });
  } catch (error) {
    console.error('Get chat details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat details',
      error: error.message
    });
  }
};

// @desc    Mark chat as read
// @route   PUT /api/chat/:chatId/read
// @access  Private
exports.markChatAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    if (!chat.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Reset unread count
    chat.resetUnreadCount(userId);
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Chat marked as read'
    });
  } catch (error) {
    console.error('Mark chat as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking chat as read',
      error: error.message
    });
  }
};

// @desc    Delete a chat
// @route   DELETE /api/chat/:chatId
// @access  Private
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is a participant in the chat
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this chat'
      });
    }

    // If it's a group chat, only admin can delete the entire chat
    if (chat.isGroup) {
      const group = await Group.findById(chat.group);
      if (group && req.user.role !== 'Admin' && group.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only admins or group creators can delete group chats'
        });
      }
    }

    // Delete all messages in the chat first
    const Message = require('../models/Message');
    await Message.deleteMany({ chat: chatId });

    // If it's a group chat, also mark the group as inactive
    if (chat.isGroup && chat.group) {
      await Group.findByIdAndUpdate(chat.group, { isActive: false });
    }

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chat',
      error: error.message
    });
  }
};

module.exports = {
  createDirectChat: exports.createDirectChat,
  getUserChats: exports.getUserChats,
  getChatDetails: exports.getChatDetails,
  markChatAsRead: exports.markChatAsRead,
  deleteChat: exports.deleteChat
};