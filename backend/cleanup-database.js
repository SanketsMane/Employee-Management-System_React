#!/usr/bin/env node

/**
 * Database Cleanup Script for EMS
 * Fixes duplicate employeeId issues
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hackable3030:f9pZaA7rmlUkQ97N@cluster0.o6vez6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function cleanupDuplicateEmployeeIds() {
  console.log('🔧 EMS Database Cleanup - Fixing Duplicate Employee IDs');
  console.log('======================================================');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    
    // Find users with duplicate employeeIds
    const duplicates = await User.aggregate([
      {
        $group: {
          _id: '$employeeId',
          docs: { $push: '$_id' },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    console.log(`🔍 Found ${duplicates.length} duplicate employeeId groups`);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate employeeIds found');
      return;
    }
    
    // Fix duplicates by regenerating employeeIds
    for (const duplicate of duplicates) {
      console.log(`\n🔄 Fixing duplicate employeeId: ${duplicate._id}`);
      
      // Keep the first one, regenerate IDs for others
      const [keepId, ...duplicateIds] = duplicate.docs;
      
      console.log(`  📌 Keeping user: ${keepId}`);
      console.log(`  🔄 Regenerating IDs for ${duplicateIds.length} duplicates`);
      
      for (let i = 0; i < duplicateIds.length; i++) {
        const userId = duplicateIds[i];
        const year = new Date().getFullYear();
        
        // Find highest existing number for this year
        const lastEmployee = await User.findOne({
          employeeId: new RegExp(`^EMP${year}`)
        }).sort({ employeeId: -1 });
        
        let nextNumber = 1;
        if (lastEmployee && lastEmployee.employeeId) {
          const lastNumber = parseInt(lastEmployee.employeeId.slice(-4));
          nextNumber = lastNumber + 1;
        }
        
        // Add offset to avoid conflicts
        nextNumber += i + 100;
        
        const newEmployeeId = `EMP${year}${nextNumber.toString().padStart(4, '0')}`;
        
        // Update the user with new employeeId
        await User.updateOne(
          { _id: userId },
          { $set: { employeeId: newEmployeeId } }
        );
        
        console.log(`    ✅ Updated user ${userId} to employeeId: ${newEmployeeId}`);
      }
    }
    
    // Regenerate employeeIds for users without one
    const usersWithoutEmployeeId = await User.find({
      $or: [
        { employeeId: { $exists: false } },
        { employeeId: null },
        { employeeId: '' }
      ]
    });
    
    console.log(`\n🆔 Found ${usersWithoutEmployeeId.length} users without employeeId`);
    
    for (const user of usersWithoutEmployeeId) {
      const year = new Date().getFullYear();
      
      // Find highest existing number
      const lastEmployee = await User.findOne({
        employeeId: new RegExp(`^EMP${year}`)
      }).sort({ employeeId: -1 });
      
      let nextNumber = 1;
      if (lastEmployee && lastEmployee.employeeId) {
        const lastNumber = parseInt(lastEmployee.employeeId.slice(-4));
        nextNumber = lastNumber + 1;
      }
      
      const newEmployeeId = `EMP${year}${nextNumber.toString().padStart(4, '0')}`;
      
      await User.updateOne(
        { _id: user._id },
        { $set: { employeeId: newEmployeeId } }
      );
      
      console.log(`  ✅ Generated employeeId for ${user.email}: ${newEmployeeId}`);
    }
    
    // Verify cleanup
    const remainingDuplicates = await User.aggregate([
      {
        $group: {
          _id: '$employeeId',
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    if (remainingDuplicates.length === 0) {
      console.log('\n✅ Database cleanup completed successfully!');
      console.log('🎉 All users now have unique employeeIds');
    } else {
      console.log(`\n⚠️ Still found ${remainingDuplicates.length} duplicates`);
    }
    
    // Show summary
    const totalUsers = await User.countDocuments();
    const usersWithEmployeeId = await User.countDocuments({
      employeeId: { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log('\n📊 Summary:');
    console.log(`  Total users: ${totalUsers}`);
    console.log(`  Users with employeeId: ${usersWithEmployeeId}`);
    console.log(`  Unique employeeIds: ${totalUsers - remainingDuplicates.length}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run cleanup if script is executed directly
if (require.main === module) {
  cleanupDuplicateEmployeeIds()
    .then(() => {
      console.log('\n🏁 Cleanup process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Cleanup process failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDuplicateEmployeeIds };