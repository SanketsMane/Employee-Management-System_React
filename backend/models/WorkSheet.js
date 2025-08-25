const mongoose = require('mongoose');

const workSheetSchema = new mongoose.Schema({
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
  timeSlots: [{
    hour: {
      type: Number,
      required: true,
      min: 9,
      max: 19 // 9 AM to 7 PM
    },
    task: {
      type: String,
      required: true,
      trim: true
    },
    project: {
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
      enum: ['Planned', 'In Progress', 'Completed', 'Blocked'],
      default: 'Planned'
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  totalTasksPlanned: {
    type: Number,
    default: 0
  },
  totalTasksCompleted: {
    type: Number,
    default: 0
  },
  productivityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  submittedAt: {
    type: Date
  },
  isSubmitted: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Needs Review'],
    default: 'Pending'
  },
  feedback: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
workSheetSchema.index({ employee: 1, date: -1 });
workSheetSchema.index({ date: -1 });

// Calculate productivity score before saving
workSheetSchema.pre('save', function(next) {
  const totalTasks = this.timeSlots.length;
  const completedTasks = this.timeSlots.filter(slot => slot.status === 'Completed').length;
  
  this.totalTasksPlanned = totalTasks;
  this.totalTasksCompleted = completedTasks;
  
  if (totalTasks > 0) {
    this.productivityScore = Math.round((completedTasks / totalTasks) * 100);
  }
  
  next();
});

// Ensure one worksheet per employee per day
workSheetSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WorkSheet', workSheetSchema);
