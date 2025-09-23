const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    }
  }],
  groupType: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },
  avatar: {
    type: String, // Cloudinary URL
    default: null
  },
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    allowMediaSharing: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 50 * 1024 * 1024 // 50MB
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ createdBy: 1 });
groupSchema.index({ name: 1 });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to check if user is member
groupSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to check if user is group admin
groupSchema.methods.isGroupAdmin = function(userId) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  return member && member.role === 'admin';
};

module.exports = mongoose.model('Group', groupSchema);