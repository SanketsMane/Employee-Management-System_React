const mongoose = require('mongoose');

const overtimeSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  totalHours: {
    type: Number,
    required: true,
    min: 0.5, // Minimum 30 minutes
    max: 12 // Maximum 12 hours
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  workDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  projectName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  urgencyLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  overtimeType: {
    type: String,
    enum: ['Regular', 'Holiday', 'Weekend', 'Emergency'],
    default: 'Regular'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  managerComments: {
    type: String,
    trim: true,
    maxlength: 500
  },
  compensation: {
    type: {
      type: String,
      enum: ['Monetary', 'TimeOff', 'None'],
      default: 'Monetary'
    },
    amount: {
      type: Number,
      min: 0
    },
    rate: {
      type: Number, // Multiplier (e.g., 1.5x, 2.0x)
      default: 1.5
    }
  },
  attachments: [{
    name: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    type: String,
    enum: ['Office', 'Remote', 'Client Site', 'Other'],
    default: 'Office'
  },
  isPreApproved: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  // Link to related attendance record
  attendanceRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance'
  },
  // Tracking fields
  isProcessed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
overtimeSchema.index({ employee: 1, date: -1 });
overtimeSchema.index({ date: -1 });
overtimeSchema.index({ status: 1 });
overtimeSchema.index({ approvedBy: 1 });

// Validate that end time is after start time
overtimeSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    if (this.endTime <= this.startTime) {
      return next(new Error('End time must be after start time'));
    }
    
    // Calculate total hours
    const hours = (this.endTime - this.startTime) / (1000 * 60 * 60);
    this.totalHours = Math.round(hours * 100) / 100; // Round to 2 decimal places
  }
  
  next();
});

// Method to calculate compensation amount
overtimeSchema.methods.calculateCompensation = function(hourlyRate = 0) {
  if (this.compensation.type === 'Monetary' && hourlyRate > 0) {
    this.compensation.amount = this.totalHours * hourlyRate * this.compensation.rate;
  }
  return this.compensation.amount;
};

// Static method to get overtime statistics
overtimeSchema.statics.getOvertimeStats = async function(employeeId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(employeeId),
        date: { $gte: startDate, $lte: endDate },
        status: 'Approved'
      }
    },
    {
      $group: {
        _id: null,
        totalHours: { $sum: '$totalHours' },
        totalSessions: { $sum: 1 },
        totalCompensation: { $sum: '$compensation.amount' },
        avgHoursPerSession: { $avg: '$totalHours' }
      }
    }
  ]);
  
  return stats[0] || {
    totalHours: 0,
    totalSessions: 0,
    totalCompensation: 0,
    avgHoursPerSession: 0
  };
};

module.exports = mongoose.model('Overtime', overtimeSchema);