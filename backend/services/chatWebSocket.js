const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Group = require('../models/Group');

class WebSocketService {
  constructor() {
    this.io = null;
    this.users = new Map(); // userId -> socketId mapping
    this.userSockets = new Map(); // socketId -> user mapping
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('WebSocket service initialized');
  }

  handleConnection(socket) {
    const user = socket.user;
    console.log(`User ${user.firstName} ${user.lastName} connected`);

    // Store user connection
    this.users.set(user._id.toString(), socket.id);
    this.userSockets.set(socket.id, user);

    // Join user to their personal room
    socket.join(`user_${user._id}`);

    // Join user to their group rooms
    this.joinUserGroups(socket, user._id);

    // Emit user online status
    this.broadcastUserStatus(user._id, 'online');

    // Handle incoming events
    this.setupEventHandlers(socket);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${user.firstName} ${user.lastName} disconnected`);
      this.users.delete(user._id.toString());
      this.userSockets.delete(socket.id);
      this.broadcastUserStatus(user._id, 'offline');
    });
  }

  async joinUserGroups(socket, userId) {
    try {
      const groups = await Group.find({
        'members.user': userId,
        isActive: true
      });

      groups.forEach(group => {
        socket.join(`group_${group._id}`);
      });
    } catch (error) {
      console.error('Error joining user groups:', error);
    }
  }

  setupEventHandlers(socket) {
    const user = socket.user;

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        await this.handleSendMessage(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message', error: error.message });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing_stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle message read status
    socket.on('mark_message_read', async (data) => {
      try {
        await this.handleMarkMessageRead(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark message as read', error: error.message });
      }
    });

    // Handle join/leave chat rooms
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    // Handle group events
    socket.on('join_group', (groupId) => {
      socket.join(`group_${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      socket.leave(`group_${groupId}`);
    });
  }

  async handleSendMessage(socket, data) {
    const { chatId, messageType = 'text', content } = data;
    const senderId = socket.user._id;

    // Validate chat access
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(senderId)) {
      throw new Error('Invalid chat or access denied');
    }

    // Create message
    const messageData = {
      sender: senderId,
      messageType,
      content,
      chat: chatId
    };

    if (chat.chatType === 'direct') {
      const otherParticipant = chat.participants.find(
        p => p.toString() !== senderId.toString()
      );
      messageData.receiver = otherParticipant;
    } else {
      messageData.group = chat.group;
    }

    const message = new Message(messageData);
    await message.save();

    // Update chat
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    
    // Update unread counts
    for (const participantId of chat.participants) {
      if (participantId.toString() !== senderId.toString()) {
        chat.incrementUnreadCount(participantId);
      }
    }
    
    await chat.save();

    // Populate message for broadcast
    await message.populate('sender', 'firstName lastName avatar role');
    if (message.receiver) {
      await message.populate('receiver', 'firstName lastName avatar role');
    }

    // Broadcast to chat participants
    const roomName = chat.chatType === 'direct' ? `chat_${chatId}` : `group_${chat.group}`;
    this.io.to(roomName).emit('new_message', {
      message,
      chat: {
        _id: chat._id,
        chatType: chat.chatType,
        lastActivity: chat.lastActivity,
        unreadCounts: chat.unreadCounts
      }
    });

    // Send push notifications to offline users
    this.sendPushNotifications(chat, message, senderId);
  }

  handleTypingStart(socket, data) {
    const { chatId } = data;
    const user = socket.user;
    
    socket.to(`chat_${chatId}`).emit('user_typing', {
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      chatId
    });
  }

  handleTypingStop(socket, data) {
    const { chatId } = data;
    const user = socket.user;
    
    socket.to(`chat_${chatId}`).emit('user_stop_typing', {
      userId: user._id,
      chatId
    });
  }

  async handleMarkMessageRead(socket, data) {
    const { messageId } = data;
    const userId = socket.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    message.markAsRead(userId);
    await message.save();

    // Find the chat and update unread count
    let chat;
    if (message.receiver) {
      chat = await Chat.findOne({
        chatType: 'direct',
        participants: { $all: [message.sender, message.receiver] }
      });
    } else if (message.group) {
      chat = await Chat.findOne({ group: message.group });
    }

    if (chat) {
      chat.resetUnreadCount(userId);
      await chat.save();

      // Broadcast read status
      const roomName = chat.chatType === 'direct' ? `chat_${chat._id}` : `group_${chat.group}`;
      this.io.to(roomName).emit('message_read', {
        messageId,
        userId,
        chatId: chat._id
      });
    }
  }

  broadcastUserStatus(userId, status) {
    this.io.emit('user_status_change', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  sendPushNotifications(chat, message, senderId) {
    // Get offline participants
    const offlineParticipants = chat.participants.filter(participantId => {
      return participantId.toString() !== senderId.toString() && 
             !this.users.has(participantId.toString());
    });

    // TODO: Implement push notification service
    // This could integrate with services like Firebase Cloud Messaging
    // or Apple Push Notification Service for mobile apps
    console.log('Send push notifications to:', offlineParticipants);
  }

  // Utility methods for external use
  sendToUser(userId, event, data) {
    const socketId = this.users.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  sendToGroup(groupId, event, data) {
    this.io.to(`group_${groupId}`).emit(event, data);
  }

  sendToChat(chatId, event, data) {
    this.io.to(`chat_${chatId}`).emit(event, data);
  }

  isUserOnline(userId) {
    return this.users.has(userId.toString());
  }

  getOnlineUsers() {
    return Array.from(this.users.keys());
  }

  getUserSocketId(userId) {
    return this.users.get(userId.toString());
  }
}

module.exports = new WebSocketService();