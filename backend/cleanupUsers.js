const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const cleanupFakeUsers = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // List of fake/seeded user emails to delete
    const fakeUserEmails = [
      'test@test.com',
      'admin@company.com',
      'hr@company.com',
      'manager@company.com',
      'employee1@company.com',
      'employee2@company.com',
      'employee3@company.com'
    ];

    console.log('\n🗑️ Deleting fake/seeded users...');
    
    for (const email of fakeUserEmails) {
      const user = await User.findOne({ email });
      if (user) {
        await User.deleteOne({ email });
        console.log(`✅ Deleted: ${user.firstName} ${user.lastName} (${email})`);
      } else {
        console.log(`⚠️ User not found: ${email}`);
      }
    }

    // Show remaining users
    const remainingUsers = await User.find({}).select('firstName lastName email role department employeeId isActive');
    
    console.log('\n📊 Remaining Users:');
    console.log('==================');
    
    remainingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    });
    
    console.log(`\n🎉 Cleanup completed! Remaining users: ${remainingUsers.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up users:', error);
    process.exit(1);
  }
};

cleanupFakeUsers();
