const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  clockIn: {
    type: Date,
    required: true
  },
  clockOut: {
    type: Date
  },
  breaks: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  totalWorkedHours: {
    type: Number,
    default: 0
  },
  totalBreakTime: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'On Break', 'Clocked Out'],
    default: 'Present'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateBy: {
    type: Number, // minutes
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Office', 'Remote', 'Field'],
      default: 'Office'
    },
    coordinates: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      }
    },
    address: {
      type: String,
      trim: true
    }
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ employee: 1, date: -1 });
attendanceSchema.index({ date: -1 });

// Calculate total worked hours and break time before saving
attendanceSchema.pre('save', function(next) {
  if (this.clockIn && this.clockOut) {
    let totalWorked = (this.clockOut - this.clockIn) / (1000 * 60 * 60); // in hours
    
    // Calculate total break time
    let totalBreakTime = 0;
    this.breaks.forEach(breakItem => {
      if (breakItem.startTime && breakItem.endTime) {
        totalBreakTime += (breakItem.endTime - breakItem.startTime) / (1000 * 60 * 60);
      }
    });
    
    this.totalWorkedHours = totalWorked - totalBreakTime;
    this.totalBreakTime = totalBreakTime;
    
    // Check if late (assuming 9 AM is standard time)
    const standardTime = new Date(this.clockIn);
    standardTime.setHours(9, 0, 0, 0);
    
    if (this.clockIn > standardTime) {
      this.isLate = true;
      this.lateBy = (this.clockIn - standardTime) / (1000 * 60); // in minutes
    }
  }
  
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
