const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
require('dotenv').config();

async function testNotificationSystem() {
  try {
    console.log('🔔 Testing Notification System...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check current admin users
    const adminUsers = await User.find({ role: 'Admin', isActive: true }).select('firstName lastName email');
    console.log(`👑 Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.firstName} ${admin.lastName} (${admin.email})`);
    });
    console.log('');

    // Test: Create a test user registration notification
    const testEmail = `test-notification-${Date.now()}@example.com`;
    console.log(`📝 Creating test user: ${testEmail}`);

    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'NotificationUser',
      email: testEmail,
      password: 'password123',
      role: 'Employee',
      department: 'IT',
      position: 'Developer',
      isApproved: false
    });

    console.log(`✅ Test user created`);
    console.log(`   - ID: ${testUser._id}`);
    console.log(`   - Employee ID: ${testUser.employeeId}`);
    console.log(`   - isApproved: ${testUser.isApproved}\n`);

    // Create notification for admins
    if (adminUsers.length > 0) {
      const adminRecipients = adminUsers.map(admin => ({
        user: admin._id,
        isRead: false
      }));

      const notification = await Notification.create({
        title: '👤 New User Registration',
        message: `${testUser.firstName} ${testUser.lastName} (${testUser.email}) has registered and is waiting for approval.`,
        type: 'approval',
        sender: testUser._id,
        recipients: adminRecipients,
        priority: 'High',
        actionUrl: '/admin/users',
        metadata: {
          userId: testUser._id,
          userEmail: testUser.email,
          userRole: testUser.role,
          userDepartment: testUser.department,
          userPosition: testUser.position,
          requiresApproval: true
        }
      });

      console.log(`📬 Created notification:`);
      console.log(`   - ID: ${notification._id}`);
      console.log(`   - Title: ${notification.title}`);
      console.log(`   - Type: ${notification.type}`);
      console.log(`   - Priority: ${notification.priority}`);
      console.log(`   - Recipients: ${notification.recipients.length} admins\n`);

      // Check notifications for first admin
      const firstAdmin = adminUsers[0];
      const adminNotifications = await Notification.find({
        'recipients.user': firstAdmin._id,
        isActive: true
      }).sort({ createdAt: -1 }).limit(5);

      console.log(`📋 Recent notifications for ${firstAdmin.firstName} ${firstAdmin.lastName}:`);
      adminNotifications.forEach(notif => {
        const isRead = notif.recipients.find(r => r.user.toString() === firstAdmin._id.toString())?.isRead;
        console.log(`   - ${notif.title} [${notif.type}] ${isRead ? '✅' : '🔴'}`);
      });
    }

    // Cleanup
    console.log(`\n🧹 Cleaning up test user...`);
    await User.findByIdAndDelete(testUser._id);
    await Notification.findOneAndDelete({ 'metadata.userId': testUser._id });
    console.log(`✅ Test user and notification deleted\n`);

    console.log(`🎉 Notification system test completed successfully!`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
    process.exit(0);
  }
}

testNotificationSystem();