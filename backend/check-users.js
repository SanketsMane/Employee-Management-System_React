const User = require('./models/User');
const mongoose = require('mongoose');
require('dotenv').config();

async function checkExistingUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const users = await User.find({}).select('firstName lastName email role isApproved createdAt');
  
  console.log('All users in database:');
  users.forEach(user => {
    console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`  Role: ${user.role}, Approved: ${user.isApproved}, Created: ${user.createdAt}`);
    console.log('');
  });
  
  const unapprovedUsers = users.filter(u => !u.isApproved && u.role !== 'Admin');
  console.log(`Unapproved non-admin users: ${unapprovedUsers.length}`);
  
  await mongoose.disconnect();
}

checkExistingUsers().catch(console.error);