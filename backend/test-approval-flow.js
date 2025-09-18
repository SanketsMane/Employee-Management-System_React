const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testApprovalFlow() {
  try {
    console.log('🔍 Testing User Approval Flow...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Create a new user and check default approval status
    const testEmail = `test-approval-${Date.now()}@example.com`;
    console.log(`📝 Creating test user: ${testEmail}`);

    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: testEmail,
      password: 'password123',
      role: 'Employee',
      department: 'IT',
      position: 'Developer'
    });

    console.log(`✅ User created successfully`);
    console.log(`   - ID: ${testUser._id}`);
    console.log(`   - Employee ID: ${testUser.employeeId}`);
    console.log(`   - isApproved: ${testUser.isApproved}`);
    console.log(`   - isActive: ${testUser.isActive}`);
    console.log(`   - Role: ${testUser.role}\n`);

    // Test 2: Fetch the user and verify approval status
    const fetchedUser = await User.findById(testUser._id);
    console.log(`🔍 Fetched user from database:`);
    console.log(`   - isApproved: ${fetchedUser.isApproved}`);
    console.log(`   - isActive: ${fetchedUser.isActive}\n`);

    // Test 3: Check if admin user would pass approval check
    const adminUser = await User.findOne({ role: 'Admin' });
    if (adminUser) {
      console.log(`👑 Found Admin user:`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - isApproved: ${adminUser.isApproved}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Would pass approval check: ${adminUser.role === 'Admin' || adminUser.isApproved}\n`);
    }

    // Test 4: Simulate login approval check
    console.log(`🔐 Testing login approval logic for test user:`);
    const wouldPassApprovalCheck = testUser.role === 'Admin' || testUser.isApproved;
    console.log(`   - Role: ${testUser.role}`);
    console.log(`   - isApproved: ${testUser.isApproved}`);
    console.log(`   - Would be allowed to login: ${wouldPassApprovalCheck}\n`);

    // Test 5: Approve the user and test again
    console.log(`✅ Approving test user...`);
    testUser.isApproved = true;
    testUser.approvedAt = new Date();
    await testUser.save();

    const approvedUser = await User.findById(testUser._id);
    const wouldPassAfterApproval = approvedUser.role === 'Admin' || approvedUser.isApproved;
    console.log(`   - After approval, isApproved: ${approvedUser.isApproved}`);
    console.log(`   - Would be allowed to login: ${wouldPassAfterApproval}\n`);

    // Cleanup
    console.log(`🧹 Cleaning up test user...`);
    await User.findByIdAndDelete(testUser._id);
    console.log(`✅ Test user deleted\n`);

    console.log(`🎉 Approval flow test completed successfully!`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
    process.exit(0);
  }
}

testApprovalFlow();