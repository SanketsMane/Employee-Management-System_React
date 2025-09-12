const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const checkUsers = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const users = await User.find({}).select('firstName lastName email role department employeeId isActive createdAt');
    
    console.log('\n📊 Current Users in Database:');
    console.log('================================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Department: ${user.department}`);
      console.log(`   Employee ID: ${user.employeeId}`);
      console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('   ---');
    });
    
    console.log(`\nTotal Users: ${users.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
};

checkUsers();
