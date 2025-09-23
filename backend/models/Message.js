const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for group messages
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null // null for direct messages
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'document', 'audio', 'file'],
    required: true,
    default: 'text'
  },
  content: {
    text: {
      type: String,
      trim: true
    },
    file: {
      url: String,
      publicId: String, // Cloudinary public ID
      originalName: String,
      size: Number,
      mimeType: String
    }
  },
  metadata: {
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    forwarded: {
      type: Boolean,
      default: false
    },
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ 'readBy.user': 1 });

// Validation: Either receiver or group must be specified, not both
messageSchema.pre('validate', function(next) {
  if (!this.receiver && !this.group) {
    next(new Error('Either receiver or group must be specified'));
  } else if (this.receiver && this.group) {
    next(new Error('Cannot specify both receiver and group'));
  } else {
    next();
  }
});

// Virtual for checking if message is read by specific user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Virtual for checking if message is delivered to specific user
messageSchema.methods.isDeliveredTo = function(userId) {
  return this.deliveredTo.some(delivery => delivery.user.toString() === userId.toString());
};

// Method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
};

// Method to mark as delivered to user
messageSchema.methods.markAsDelivered = function(userId) {
  if (!this.isDeliveredTo(userId)) {
    this.deliveredTo.push({ user: userId, deliveredAt: new Date() });
  }
};

module.exports = mongoose.model('Message', messageSchema);