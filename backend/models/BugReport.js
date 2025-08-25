const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['ui/ux', 'functionality', 'performance', 'security', 'data', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed', 'rejected'],
    default: 'open'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  screenshots: [{
    url: String,
    publicId: String
  }],
  stepsToReproduce: {
    type: String,
    maxlength: 1000
  },
  browserInfo: {
    userAgent: String,
    platform: String,
    url: String
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  resolution: {
    type: String,
    maxlength: 1000
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
bugReportSchema.index({ status: 1, priority: 1 });
bugReportSchema.index({ reportedBy: 1 });
bugReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BugReport', bugReportSchema);
