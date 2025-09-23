const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function findAdminUsers() {
  try {
    console.log('🔍 Finding admin users...\n');
    
    // Get admin users
    const adminUsers = await User.find({
      role: { $in: ['Admin', 'HR', 'Manager', 'Team Lead'] }
    })
    .select('firstName lastName email role isActive isApproved employeeId')
    .sort({ role: 1, firstName: 1 });
    
    console.log(`👑 Found ${adminUsers.length} admin/management users:\n`);
    
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Employee ID: ${user.employeeId}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Approved: ${user.isApproved}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error finding admin users:', error);
  } finally {
    mongoose.connection.close();
  }
}

findAdminUsers();