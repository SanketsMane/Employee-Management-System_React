const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import models
const User = require('../models/User');

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function testUserQuery() {
  try {
    console.log('🧪 Testing getAvailableUsers logic directly...\n');
    
    // Find an admin user
    const adminUser = await User.findOne({ 
      email: 'contactsanket1@gmail.com',
      role: 'Admin' 
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log(`✅ Testing with admin user: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser._id}\n`);
    
    // Test the exact query from messageController
    console.log('📋 Step 1: Raw query (excluding self)');
    const allUsersExceptSelf = await User.find({
      _id: { $ne: adminUser._id }
    }).select('firstName lastName email avatar role department isActive');
    
    console.log(`   Found ${allUsersExceptSelf.length} users (excluding self)`);
    
    console.log('\n📋 Step 2: Filter by isActive !== false');
    const activeUsers = allUsersExceptSelf.filter(u => u.isActive !== false);
    console.log(`   Active users: ${activeUsers.length}`);
    
    console.log('\n📋 Step 3: Sample users that should be available:');
    activeUsers.slice(0, 5).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.role}) - Email: ${user.email}`);
      console.log(`      Active: ${user.isActive}, Department: ${user.department}`);
    });
    
    // Generate a test JWT token
    console.log('\n🔑 Generating test JWT token...');
    const token = jwt.sign(
      { 
        userId: adminUser._id, 
        email: adminUser.email,
        role: adminUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log(`   Token generated: ${token.substring(0, 30)}...`);
    
    // Create express-like req object to simulate the API call
    const req = {
      user: {
        _id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName
      }
    };
    
    // Simulate the messageController getAvailableUsers function
    console.log('\n🎯 Simulating messageController.getAvailableUsers...');
    
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    console.log(`   Current user found: ${user.firstName} ${user.lastName}`);
    console.log(`   User role: ${user.role}`);
    console.log(`   Role check: ${['Admin', 'HR', 'Manager', 'Team Lead'].includes(user.role)}`);
    
    let availableUsers = [];
    
    if (['Admin', 'HR', 'Manager', 'Team Lead'].includes(user.role)) {
      console.log('   ✅ User has admin privileges');
      
      availableUsers = await User.find({
        _id: { $ne: userId },
        isActive: true
      }).select('firstName lastName email avatar role department');
      
      console.log(`   Query result: ${availableUsers.length} users`);
    } else {
      console.log('   ❌ User does not have admin privileges');
    }
    
    console.log(`\n🎉 Final result: ${availableUsers.length} users would be returned`);
    
    if (availableUsers.length > 0) {
      console.log('\n📝 Sample users:');
      availableUsers.slice(0, 3).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.role})`);
      });
    } else {
      console.log('\n❌ No users found - this is the problem!');
      
      // Debug why no users found
      console.log('\n🔍 Debugging why no users found...');
      const debugUsers = await User.find({
        _id: { $ne: userId }
      }).select('firstName lastName email isActive');
      
      console.log(`   Total users excluding self: ${debugUsers.length}`);
      
      const trulyActiveUsers = debugUsers.filter(u => u.isActive === true);
      console.log(`   Users with isActive === true: ${trulyActiveUsers.length}`);
      
      const notFalseUsers = debugUsers.filter(u => u.isActive !== false);
      console.log(`   Users with isActive !== false: ${notFalseUsers.length}`);
      
      const isActiveFieldValues = debugUsers.map(u => u.isActive);
      const uniqueValues = [...new Set(isActiveFieldValues)];
      console.log(`   Unique isActive values in database: ${JSON.stringify(uniqueValues)}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testUserQuery();