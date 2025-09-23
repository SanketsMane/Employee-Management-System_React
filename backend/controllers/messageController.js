const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Group = require('../models/Group');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Helper function to check messaging permissions
const canSendMessage = async (senderId, receiverId) => {
  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);
  
  if (!sender || !receiver) return false;
  
  // Admin, HR, Manager, TeamLead can message anyone
  if (['Admin', 'HR', 'Manager', 'Team Lead'].includes(sender.role)) {
    return true;
  }
  
  // Employees can only message users in their groups
  if (sender.role === 'Employee') {
    const commonGroups = await Group.find({
      'members.user': { $all: [senderId, receiverId] },
      isActive: true
    });
    return commonGroups.length > 0;
  }
  
  return false;
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, groupId, messageType = 'text', content } = req.body;
    const senderId = req.user._id;

    // Validate that either receiverId or groupId is provided, not both
    if ((!receiverId && !groupId) || (receiverId && groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Either receiverId or groupId must be provided, not both'
      });
    }

    let chat;
    
    if (receiverId) {
      // Direct message validation
      const canSend = await canSendMessage(senderId, receiverId);
      if (!canSend) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to send messages to this user'
        });
      }
      
      // Find or create direct chat
      chat = await Chat.findOrCreateDirectChat(senderId, receiverId);
    } else {
      // Group message validation
      const group = await Group.findById(groupId);
      if (!group || !group.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }
      
      if (!group.isMember(senderId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group'
        });
      }
      
      // Find group chat
      chat = await Chat.findOne({ group: groupId, isActive: true });
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Group chat not found'
        });
      }
    }

    // Create message
    const messageData = {
      sender: senderId,
      messageType,
      content: content || {}
    };

    if (receiverId) {
      messageData.receiver = receiverId;
    } else {
      messageData.group = groupId;
    }

    const message = new Message(messageData);
    await message.save();
    
    // Update chat's last message and activity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    
    // Update unread counts for other participants
    for (const participantId of chat.participants) {
      if (participantId.toString() !== senderId.toString()) {
        chat.incrementUnreadCount(participantId);
      }
    }
    
    await chat.save();
    
    // Populate message for response
    await message.populate('sender', 'firstName lastName profilePicture role');
    if (receiverId) {
      await message.populate('receiver', 'firstName lastName profilePicture role');
    }

    res.status(201).json({
      success: true,
      data: { message, chat }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// @desc    Get messages for a chat
// @route   GET /api/messages/:chatId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Validate chatId format
    if (!chatId || chatId === '[object Object]' || typeof chatId !== 'string' || chatId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID format'
      });
    }

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

    const skip = (page - 1) * limit;
    
    // Build query based on chat type
    let messageQuery = { isDeleted: false };
    if (chat.chatType === 'direct') {
      messageQuery = {
        ...messageQuery,
        $or: [
          { sender: userId, receiver: { $in: chat.participants } },
          { sender: { $in: chat.participants }, receiver: userId }
        ]
      };
    } else {
      messageQuery.group = chat.group;
    }

    const messages = await Message.find(messageQuery)
      .populate('sender', 'firstName lastName profilePicture role')
      .populate('receiver', 'firstName lastName profilePicture role')
      .populate('metadata.replyTo')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    // Mark messages as read for current user
    const unreadMessages = messages.filter(msg => !msg.isReadBy(userId));
    for (const message of unreadMessages) {
      message.markAsRead(userId);
      await message.save();
    }

    // Reset unread count for user in this chat
    chat.resetUnreadCount(userId);
    await chat.save();

    res.status(200).json({
      success: true,
      data: { 
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          currentPage: page,
          totalMessages: await Message.countDocuments(messageQuery),
          hasMore: messages.length === limit
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// @desc    Get user's chats
// @route   GET /api/chats
// @access  Private
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const chats = await Chat.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'firstName lastName profilePicture role')
    .populate('group', 'name description profilePicture')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'firstName lastName profilePicture'
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

// @desc    Upload file for message
// @route   POST /api/messages/upload
// @access  Private
exports.uploadMessageFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'chat-files',
      resource_type: 'auto'
    });

    const fileData = {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    };

    res.status(200).json({
      success: true,
      data: { file: fileData }
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:messageId/read
// @access  Private
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user can read this message
    if (message.receiver && message.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (message.group) {
      const group = await Group.findById(message.group);
      if (!group || !group.isMember(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    message.markAsRead(userId);
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking message as read',
      error: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete their own messages
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

// @desc    Get available users for messaging
// @route   GET /api/messages/users
// @access  Private
exports.getAvailableUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    let availableUsers = [];
    
    if (['Admin', 'HR', 'Manager', 'Team Lead'].includes(user.role)) {
      // Can message anyone
      const allUsers = await User.find({
        _id: { $ne: userId }
      }).select('firstName lastName email profilePicture role department isActive');
      
      // Filter only active users
      availableUsers = allUsers.filter(u => u.isActive !== false);
      
    } else {
      // Can only message users in same groups
      const userGroups = await Group.find({
        'members.user': userId,
        isActive: true
      });
      
      const groupMemberIds = new Set();
      userGroups.forEach(group => {
        group.members.forEach(member => {
          if (member.user.toString() !== userId.toString()) {
            groupMemberIds.add(member.user.toString());
          }
        });
      });
      
      availableUsers = await User.find({
        _id: { $in: Array.from(groupMemberIds) },
        isActive: { $ne: false }
      }).select('firstName lastName email profilePicture role department');
    }

    res.status(200).json({
      success: true,
      data: { users: availableUsers }
    });
  } catch (error) {
    console.error('Get available users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available users',
      error: error.message
    });
  }
};

// @desc    Clear all messages in a chat
// @route   DELETE /api/messages/:chatId/clear
// @access  Private
exports.clearChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Check if chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is part of the chat
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to clear this chat'
      });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chat: chatId });

    res.status(200).json({
      success: true,
      message: 'Chat cleared successfully'
    });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing chat',
      error: error.message
    });
  }
};