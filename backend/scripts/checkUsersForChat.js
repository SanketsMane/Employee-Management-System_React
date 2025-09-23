const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for user check'))
  .catch(err => console.error('MongoDB connection error:', err));

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    // Get all users
    const allUsers = await User.find({})
      .select('firstName lastName email role isActive isApproved employeeId department')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Total users in database: ${allUsers.length}\n`);
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }
    
    // Group by status
    const activeUsers = allUsers.filter(u => u.isActive !== false);
    const approvedUsers = allUsers.filter(u => u.isApproved === true);
    const activeAndApprovedUsers = allUsers.filter(u => u.isActive !== false && u.isApproved === true);
    
    console.log(`✅ Active users (isActive !== false): ${activeUsers.length}`);
    console.log(`✅ Approved users (isApproved === true): ${approvedUsers.length}`);
    console.log(`✅ Active AND Approved users: ${activeAndApprovedUsers.length}\n`);
    
    // Show first 10 users with details
    console.log('👥 User details (first 10):');
    console.log('================================================');
    allUsers.slice(0, 10).forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Employee ID: ${user.employeeId}`);
      console.log(`   Department: ${user.department}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Approved: ${user.isApproved}`);
      console.log('   ---');
    });
    
    // Check admin users specifically
    const adminUsers = allUsers.filter(u => ['Admin', 'HR', 'Manager', 'Team Lead'].includes(u.role));
    console.log(`\n👑 Admin/Management users: ${adminUsers.length}`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.role}) - Active: ${user.isActive}, Approved: ${user.isApproved}`);
    });
    
    // Test the exact query from getAvailableUsers for admin
    if (adminUsers.length > 0) {
      const adminUser = adminUsers[0];
      console.log(`\n🧪 Testing getAvailableUsers query for ${adminUser.firstName} ${adminUser.lastName}:`);
      
      // Simulate the exact query from messageController
      const testUsers = await User.find({
        _id: { $ne: adminUser._id }
      }).select('firstName lastName email avatar role department isActive');
      
      console.log(`   Raw query result: ${testUsers.length} users`);
      
      const filteredUsers = testUsers.filter(u => u.isActive !== false);
      console.log(`   After isActive filter: ${filteredUsers.length} users`);
      
      if (filteredUsers.length > 0) {
        console.log('   Sample users that should be available:');
        filteredUsers.slice(0, 3).forEach(u => {
          console.log(`     - ${u.firstName} ${u.lastName} (${u.role}) - Active: ${u.isActive}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

checkUsers();