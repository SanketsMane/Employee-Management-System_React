const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['general', 'urgent', 'policy', 'event', 'system', 'holiday'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  targetType: {
    type: String,
    enum: ['all', 'role', 'department', 'specific'],
    default: 'all'
  },
  targetRoles: [{
    type: String,
    enum: ['Admin', 'HR', 'Manager', 'Team Lead', 'Employee', 'Software developer trainee', 
           'Associate software developer', 'Full stack developer', 'Dot net developer', 
           'UI UX designer', 'Flutter developer', 'React native developer', 'Java developer']
  }],
  targetDepartments: [{
    type: String
  }],
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  attachments: [{
    filename: String,
    url: String,
    publicId: String,
    size: Number
  }],
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
  acknowledgedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  }],
  requiresAcknowledgment: {
    type: Boolean,
    default: false
  },
  sendEmail: {
    type: Boolean,
    default: true
  },
  emailSentAt: {
    type: Date
  },
  viewCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better performance
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ targetType: 1 });
announcementSchema.index({ targetRoles: 1 });
announcementSchema.index({ targetDepartments: 1 });
announcementSchema.index({ isActive: 1 });
announcementSchema.index({ priority: 1 });
announcementSchema.index({ expiresAt: 1 });

// Virtual for read count
announcementSchema.virtual('readCount').get(function() {
  return this.readBy ? this.readBy.length : 0;
});

// Virtual for acknowledgment count
announcementSchema.virtual('acknowledgmentCount').get(function() {
  return this.acknowledgedBy ? this.acknowledgedBy.length : 0;
});

// Method to check if user is targeted by this announcement
announcementSchema.methods.isTargetedToUser = function(user) {
  if (this.targetType === 'all') {
    return true;
  }
  
  if (this.targetType === 'role') {
    return this.targetRoles.includes(user.role);
  }
  
  if (this.targetType === 'department') {
    return this.targetDepartments.includes(user.department);
  }
  
  if (this.targetType === 'specific') {
    return this.targetUsers.some(userId => userId.toString() === user._id.toString());
  }
  
  return false;
};

// Method to mark as read by user
announcementSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    this.viewCount += 1;
  }
  return this.save();
};

// Method to mark as acknowledged by user
announcementSchema.methods.markAsAcknowledged = function(userId) {
  const existingAck = this.acknowledgedBy.find(ack => ack.user.toString() === userId.toString());
  if (!existingAck) {
    this.acknowledgedBy.push({ user: userId, acknowledgedAt: new Date() });
  }
  return this.save();
};

module.exports = mongoose.model('Announcement', announcementSchema);
