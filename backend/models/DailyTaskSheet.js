const mongoose = require('mongoose');

const dailyTaskSheetSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  },
  tasks: [{
    taskTitle: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
      default: 'Not Started'
    },
    estimatedTime: {
      type: Number, // in minutes
      default: 60
    },
    actualTime: {
      type: Number, // in minutes
      default: 0
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    comments: {
      type: String,
      trim: true
    }
  }],
  totalPlannedHours: {
    type: Number,
    default: 0
  },
  totalActualHours: {
    type: Number,
    default: 0
  },
  productivity: {
    type: Number,
    default: 0
  },
  isSubmitted: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewComments: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one task sheet per employee per day
dailyTaskSheetSchema.index({ employee: 1, date: 1 }, { unique: true });

// Calculate productivity before saving
dailyTaskSheetSchema.pre('save', function(next) {
  if (this.totalPlannedHours > 0 && this.totalActualHours > 0) {
    this.productivity = Math.round((this.totalPlannedHours / this.totalActualHours) * 100);
  }
  next();
});

module.exports = mongoose.model('DailyTaskSheet', dailyTaskSheetSchema);
