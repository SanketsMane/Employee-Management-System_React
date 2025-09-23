const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  chatType: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null // only for group chats
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Settings for the chat
  settings: {
    muted: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      mutedAt: {
        type: Date,
        default: Date.now
      }
    }],
    pinned: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      pinnedAt: {
        type: Date,
        default: Date.now
      }
    }],
    archived: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      archivedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  unreadCount: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    },
    lastRead: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
chatSchema.index({ participants: 1 });
chatSchema.index({ group: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ chatType: 1 });

// Virtual for getting other participant in direct chat
chatSchema.virtual('otherParticipant').get(function() {
  if (this.chatType === 'direct' && this.participants.length === 2) {
    return this.participants[1]; // Assuming current user is participants[0]
  }
  return null;
});

// Method to check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(participant => participant.toString() === userId.toString());
};

// Method to get unread count for user
chatSchema.methods.getUnreadCount = function(userId) {
  const unread = this.unreadCount.find(uc => uc.user.toString() === userId.toString());
  return unread ? unread.count : 0;
};

// Method to update unread count for user
chatSchema.methods.updateUnreadCount = function(userId, count) {
  const unreadIndex = this.unreadCount.findIndex(uc => uc.user.toString() === userId.toString());
  if (unreadIndex > -1) {
    this.unreadCount[unreadIndex].count = count;
    this.unreadCount[unreadIndex].lastRead = new Date();
  } else {
    this.unreadCount.push({ user: userId, count, lastRead: new Date() });
  }
};

// Method to reset unread count for user
chatSchema.methods.resetUnreadCount = function(userId) {
  this.updateUnreadCount(userId, 0);
};

// Method to increment unread count for user
chatSchema.methods.incrementUnreadCount = function(userId) {
  const current = this.getUnreadCount(userId);
  this.updateUnreadCount(userId, current + 1);
};

// Static method to find or create direct chat between two users
chatSchema.statics.findOrCreateDirectChat = async function(user1Id, user2Id) {
  let chat = await this.findOne({
    chatType: 'direct',
    participants: { $all: [user1Id, user2Id], $size: 2 }
  }).populate('participants', 'firstName lastName email avatar role')
    .populate('lastMessage');

  if (!chat) {
    chat = new this({
      participants: [user1Id, user2Id],
      chatType: 'direct'
    });
    await chat.save();
    await chat.populate('participants', 'firstName lastName email avatar role');
  }

  return chat;
};

module.exports = mongoose.model('Chat', chatSchema);