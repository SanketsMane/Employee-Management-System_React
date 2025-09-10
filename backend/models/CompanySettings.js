const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    unique: true
  },
  attendanceRules: {
    workStartTime: {
      type: String,
      default: "09:00", // 24-hour format HH:MM
      required: true
    },
    workEndTime: {
      type: String,
      default: "17:00", // 24-hour format HH:MM
      required: true
    },
    lateThresholdMinutes: {
      type: Number,
      default: 15, // Minutes after work start time to mark as late
      min: 0,
      max: 120
    },
    graceTimeMinutes: {
      type: Number,
      default: 5, // Grace period before marking late
      min: 0,
      max: 60
    },
    halfDayThresholdHours: {
      type: Number,
      default: 4, // Minimum hours for half day
      min: 1,
      max: 8
    },
    fullDayRequiredHours: {
      type: Number,
      default: 8, // Required hours for full day
      min: 4,
      max: 12
    },
    weeklyOffDays: {
      type: [Number], // 0=Sunday, 1=Monday, ..., 6=Saturday
      default: [0, 6] // Saturday and Sunday
    },
    allowFlexibleTiming: {
      type: Boolean,
      default: false
    },
    flexibleStartRange: {
      earliest: {
        type: String,
        default: "08:00"
      },
      latest: {
        type: String,
        default: "10:00"
      }
    },
    autoClockOutTime: {
      type: String,
      default: "19:00" // Auto clock-out if not done manually
    },
    allowRemoteWork: {
      type: Boolean,
      default: true
    },
    requireLocationForClockIn: {
      type: Boolean,
      default: false
    }
  },
  leaveRules: {
    casualLeavePerYear: {
      type: Number,
      default: 12
    },
    sickLeavePerYear: {
      type: Number,
      default: 12
    },
    earnedLeavePerYear: {
      type: Number,
      default: 21
    },
    maxConsecutiveDays: {
      type: Number,
      default: 7
    },
    advanceApplicationDays: {
      type: Number,
      default: 2
    }
  },
  notifications: {
    lateArrivalAlert: {
      type: Boolean,
      default: true
    },
    missedClockOutAlert: {
      type: Boolean,
      default: true
    },
    dailyReportTime: {
      type: String,
      default: "18:00"
    }
  },
  timezone: {
    type: String,
    default: "Asia/Kolkata"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for fast company lookup
companySettingsSchema.index({ companyName: 1 });
companySettingsSchema.index({ isActive: 1 });

// Method to check if a time is within work hours
companySettingsSchema.methods.isWithinWorkHours = function(time) {
  const [startHour, startMin] = this.attendanceRules.workStartTime.split(':').map(Number);
  const [endHour, endMin] = this.attendanceRules.workEndTime.split(':').map(Number);
  const [timeHour, timeMin] = time.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const timeMinutes = timeHour * 60 + timeMin;
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};

// Method to calculate attendance status
companySettingsSchema.methods.calculateAttendanceStatus = function(clockInTime, clockOutTime = null) {
  const clockIn = new Date(clockInTime);
  const clockInTimeStr = clockIn.toTimeString().substring(0, 5); // HH:MM format
  
  const [workStartHour, workStartMin] = this.attendanceRules.workStartTime.split(':').map(Number);
  const workStartTime = new Date(clockIn);
  workStartTime.setHours(workStartHour, workStartMin, 0, 0);
  
  // Add grace time
  const graceTime = new Date(workStartTime);
  graceTime.setMinutes(graceTime.getMinutes() + this.attendanceRules.graceTimeMinutes);
  
  // Add late threshold
  const lateThreshold = new Date(workStartTime);
  lateThreshold.setMinutes(lateThreshold.getMinutes() + this.attendanceRules.lateThresholdMinutes);
  
  let status = 'Present';
  let remarks = '';
  
  if (clockIn <= graceTime) {
    status = 'Present';
    remarks = 'On time';
  } else if (clockIn <= lateThreshold) {
    status = 'Late';
    const minutesLate = Math.round((clockIn - workStartTime) / (1000 * 60));
    remarks = `Late by ${minutesLate} minutes`;
  } else {
    status = 'Late';
    const minutesLate = Math.round((clockIn - workStartTime) / (1000 * 60));
    remarks = `Very late by ${minutesLate} minutes`;
  }
  
  // Calculate work duration if clock out is available
  if (clockOutTime) {
    const clockOut = new Date(clockOutTime);
    const workDuration = (clockOut - clockIn) / (1000 * 60 * 60); // hours
    
    if (workDuration < this.attendanceRules.halfDayThresholdHours) {
      status = 'Half Day';
      remarks += ` - Insufficient hours (${workDuration.toFixed(1)}h)`;
    }
  }
  
  return { status, remarks };
};

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
