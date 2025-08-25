const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Sick Leave', 'Casual Leave', 'Vacation', 'Emergency', 'Personal', 'Maternity', 'Paternity'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientRole: {
    type: String,
    enum: ['Admin', 'HR', 'Manager', 'Team Lead'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  handoverNotes: {
    type: String,
    trim: true
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDaySession: {
    type: String,
    enum: ['Morning', 'Afternoon'],
    required: function() {
      return this.isHalfDay;
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
leaveSchema.index({ employee: 1, startDate: -1 });
leaveSchema.index({ recipient: 1, status: 1 });
leaveSchema.index({ status: 1, startDate: -1 });

// Calculate total days before saving
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const timeDiff = this.endDate.getTime() - this.startDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
    
    if (this.isHalfDay && dayDiff === 1) {
      this.totalDays = 0.5;
    } else {
      this.totalDays = dayDiff;
    }
  }
  next();
});

// Validate date range
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
