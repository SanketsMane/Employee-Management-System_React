#!/usr/bin/env node

/**
 * Cleanup script to remove test users created during testing
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
const User = require('./models/User');

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Remove test users
    const result = await User.deleteMany({
      $or: [
        { email: { $regex: /^test\..*@company\.com$/i } },
        { email: { $regex: /^api\.test\..*@company\.com$/i } },
        { firstName: 'Test' },
        { firstName: 'API' }
      ]
    });

    console.log(`🗑️  Removed ${result.deletedCount} test users`);
    console.log('✅ Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

cleanupTestUsers();