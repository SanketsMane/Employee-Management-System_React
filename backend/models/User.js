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
      // Traditional Roles
      'Employee', 
      'Intern',
      'Team Lead', 
      'Manager', 
      'HR', 
      'Admin',
      
      // Internship Roles
      'Data Science Intern',
      'Data Analytics Intern',
      'Machine Learning Intern',
      'AI Research Intern',
      'Software Development Intern',
      'Full Stack Developer Intern',
      'Frontend Developer Intern',
      'Backend Developer Intern',
      'Mobile App Developer Intern',
      'Cloud Computing Intern',
      'DevOps Intern',
      'UI/UX Design Intern',
      'Figma Designer Intern',
      'Product Management Intern',
      'Business Analyst Intern',
      'Quality Assurance (QA) Intern',
      'Cybersecurity Intern',
      'Database Intern',
      
      // Data & Analytics Roles
      'Data Scientist',
      'Data Analyst',
      'Machine Learning Engineer',
      'AI Engineer',
      'Business Intelligence (BI) Analyst',
      'Data Engineer',
      'Data Architect',
      'Statistician',
      'Research Analyst',
      
      // Development Roles
      'Software Engineer / Developer',
      'Full Stack Developer',
      'Frontend Developer',
      'Backend Developer',
      'Mobile App Developer (iOS, Android, React Native)',
      'Web Developer',
      'API Developer',
      'Embedded Systems Developer',
      'Game Developer',
      'Cloud Engineer',
      'Systems Engineer',
      'Software developer trainee',
      'Associate software developer',
      'Dot net developer',
      'Flutter developer',
      'React native developer',
      'Java developer',
      
      // Cloud & Infrastructure Roles
      'DevOps Engineer',
      'Cloud Architect',
      'AWS Engineer',
      'Azure Engineer',
      'Google Cloud Engineer',
      'Site Reliability Engineer (SRE)',
      'Network Engineer',
      'Security Engineer',
      
      // Design Roles
      'UI UX designer',
      'Graphic Designer',
      'Interaction Designer',
      'Motion Graphics Designer',
      'Visual Designer',
      'Figma Designer',
      'Adobe XD Designer',
      
      // Other
      'Other'
    ],
    default: 'Employee'
  },
  customRole: {
    type: String,
    trim: true,
    required: function() {
      return this.role === 'Other';
    }
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
    required: false,  // Made optional since it will be set from role if not provided
    default: function() {
      return this.role || 'Employee';
    }
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
    type: mongoose.Schema.Types.Mixed, // Allow both string and object
    default: ''
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

// Generate employee ID with FSID001 format and collision handling
userSchema.pre('save', async function(next) {
  if (!this.isNew || this.employeeId) {
    return next();
  }
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      // Find the highest existing employeeId with FSID format
      const lastEmployee = await this.constructor.findOne({
        employeeId: new RegExp(`^FSID`)
      }).sort({ employeeId: -1 });
      
      let nextNumber = 1;
      if (lastEmployee && lastEmployee.employeeId) {
        const lastNumber = parseInt(lastEmployee.employeeId.slice(4)); // Remove 'FSID' prefix
        nextNumber = lastNumber + 1;
      }
      
      // Add random component to avoid collisions in concurrent scenarios
      if (attempts > 0) {
        nextNumber += Math.floor(Math.random() * 100);
      }
      
      this.employeeId = `FSID${nextNumber.toString().padStart(3, '0')}`;
      
      // Check if this employeeId already exists
      const existingEmployee = await this.constructor.findOne({ 
        employeeId: this.employeeId 
      });
      
      if (!existingEmployee) {
        break; // Success, unique ID found
      }
      
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error, retry with different number
        attempts++;
        continue;
      } else {
        return next(error);
      }
    }
    
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    const fallbackId = `FSID${Date.now().toString().slice(-3)}`;
    this.employeeId = fallbackId;
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);
