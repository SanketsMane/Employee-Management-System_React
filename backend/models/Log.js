const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Make optional for failed login attempts where user doesn't exist
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Authentication', 'Attendance', 'Leave', 'Profile', 'Worksheet', 'Admin', 'System'],
    required: true
  },
  details: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  statusCode: {
    type: Number
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  endpoint: {
    type: String
  },
  responseTime: {
    type: Number // in milliseconds
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
logSchema.index({ user: 1, createdAt: -1 });
logSchema.index({ category: 1, createdAt: -1 });
logSchema.index({ action: 1, createdAt: -1 });
logSchema.index({ createdAt: -1 });

// TTL index to automatically delete logs older than 90 days
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days in seconds

module.exports = mongoose.model('Log', logSchema);
