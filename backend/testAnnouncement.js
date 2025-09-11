const mongoose = require('mongoose');
const Announcement = require('./models/Announcement');
const User = require('./models/User');
require('dotenv').config();

async function createTestAnnouncement() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an admin user
    const adminUser = await User.findOne({ role: 'Admin' });
    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    console.log('Found admin user:', adminUser.firstName, adminUser.lastName);

    // Create a test announcement
    const announcement = new Announcement({
      title: 'Welcome to the Announcement System!',
      content: 'This is a test announcement to verify that the announcement system is working correctly. All employees should be able to see this message.',
      type: 'general',
      priority: 'medium',
      targetType: 'all',
      createdBy: adminUser._id,
      requiresAcknowledgment: false,
      sendEmail: false,
      isActive: true
    });

    await announcement.save();
    console.log('Test announcement created successfully:', announcement._id);

    // Create another role-specific announcement
    const roleAnnouncement = new Announcement({
      title: 'Admin & HR Update',
      content: 'This is a test announcement specifically for Admin and HR roles to test role-based targeting.',
      type: 'policy',
      priority: 'high',
      targetType: 'role',
      targetRoles: ['Admin', 'HR'],
      createdBy: adminUser._id,
      requiresAcknowledgment: true,
      sendEmail: false,
      isActive: true
    });

    await roleAnnouncement.save();
    console.log('Role-specific announcement created successfully:', roleAnnouncement._id);

    // List all announcements
    const allAnnouncements = await Announcement.find({}).populate('createdBy', 'firstName lastName role');
    console.log('\nAll announcements:');
    allAnnouncements.forEach(ann => {
      console.log(`- ${ann.title} (${ann.targetType}) by ${ann.createdBy.firstName} ${ann.createdBy.lastName}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestAnnouncement();
