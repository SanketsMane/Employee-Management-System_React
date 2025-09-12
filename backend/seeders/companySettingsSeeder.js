const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CompanySettings = require('../models/CompanySettings');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config();

const defaultCompanySettings = {
  companyName: 'Formonex Technologies',
  attendanceRules: {
    workStartTime: '09:00',
    workEndTime: '17:00',
    lateThresholdMinutes: 15,
    graceTimeMinutes: 5,
    halfDayThresholdHours: 4,
    fullDayRequiredHours: 8,
    weeklyOffDays: [0, 6], // Sunday and Saturday
    allowFlexibleTiming: true,
    flexibleStartRange: {
      earliest: '08:00',
      latest: '10:00'
    },
    autoClockOutTime: '19:00',
    allowRemoteWork: true,
    requireLocationForClockIn: false
  },
  leaveRules: {
    casualLeavePerYear: 12,
    sickLeavePerYear: 12,
    earnedLeavePerYear: 21,
    maxConsecutiveDays: 7,
    advanceApplicationDays: 2
  },
  notifications: {
    lateArrivalAlert: true,
    missedClockOutAlert: true,
    dailyReportTime: '18:00'
  },
  timezone: 'Asia/Kolkata',
  isActive: true
};

const seedCompanySettings = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Find an admin user to set as creator
    const adminUser = await User.findOne({ role: 'Admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please run user seeder first.');
      process.exit(1);
    }

    // Check if company settings already exist
    const existingSettings = await CompanySettings.findOne({ companyName: defaultCompanySettings.companyName });
    
    if (existingSettings) {
      console.log(`Company settings for "${defaultCompanySettings.companyName}" already exist, skipping...`);
      process.exit(0);
    }

    // Create company settings with admin as creator
    const settingsData = {
      ...defaultCompanySettings,
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    };

    const companySettings = await CompanySettings.create(settingsData);
    console.log(`✅ Created company settings for: ${companySettings.companyName}`);
    console.log(`📋 Settings ID: ${companySettings._id}`);
    console.log(`👤 Created by: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})`);

    console.log('\n🎉 Company settings seeding completed successfully!');
    console.log('\n📝 Default Settings Summary:');
    console.log(`🏢 Company: ${companySettings.companyName}`);
    console.log(`⏰ Work Hours: ${companySettings.attendanceRules.workStartTime} - ${companySettings.attendanceRules.workEndTime}`);
    console.log(`🏖️ Weekend: ${companySettings.attendanceRules.weeklyOffDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`);
    console.log(`🎯 Full Day Hours: ${companySettings.attendanceRules.fullDayRequiredHours}h`);
    console.log(`📅 Annual Leaves: Casual(${companySettings.leaveRules.casualLeavePerYear}), Sick(${companySettings.leaveRules.sickLeavePerYear}), Earned(${companySettings.leaveRules.earnedLeavePerYear})`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding company settings:', error);
    process.exit(1);
  }
};

const deleteCompanySettings = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    await CompanySettings.deleteMany({});
    console.log('All company settings deleted successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting company settings:', error);
    process.exit(1);
  }
};

// Run the appropriate function based on command line argument
const command = process.argv[2];

if (command === 'delete') {
  deleteCompanySettings();
} else {
  seedCompanySettings();
}