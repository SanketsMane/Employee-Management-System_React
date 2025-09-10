const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'Employee Management System'
    },
    tagline: {
      type: String,
      default: 'Streamlining Workforce Management'
    },
    description: {
      type: String,
      default: 'Employee Management System for streamlined workforce management and productivity tracking.'
    },
    website: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    headquarters: {
      type: String,
      default: 'Not specified'
    },
    founded: {
      type: Number,
      default: new Date().getFullYear()
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Company', CompanySchema);
