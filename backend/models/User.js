const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: [
      'Employee', 
      'Team Lead', 
      'Manager', 
      'HR', 
      'Admin',
      'Software developer trainee',
      'Associate software developer',
      'Full stack developer',
      'Dot net developer',
      'UI UX designer',
      'Flutter developer',
      'React native developer',
      'Java developer'
    ],
    default: 'Employee'
  },
  employeeId: {
    type: String,
    unique: true,
    required: false  // Will be generated in pre-save middleware
  },
  department: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  dateOfJoining: {
    type: Date,
    default: Date.now
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  skills: [{
    type: String,
    trim: true
  }],
  documents: [{
    name: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  salary: {
    type: Number,
    default: 0
  },
  rewardPoints: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
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
    trim: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  lastLogin: {
    type: Date
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  deactivatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deactivatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate employee ID
userSchema.pre('save', async function(next) {
  if (!this.isNew || this.employeeId) {
    return next();
  }
  
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments() + 1;
  this.employeeId = `EMP${year}${count.toString().padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('User', userSchema);
