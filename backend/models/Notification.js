const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'attendance', 'leave', 'worksheet', 'approval', 'team', 'task'],
    default: 'info'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    }
  }],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  actionUrl: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ 'recipients.user': 1, createdAt: -1 });
notificationSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
