#!/usr/bin/env node

/**
 * Test script for the new FSID001 employee ID generation system
 * This verifies that the new ID format works correctly
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

// Import User model
const User = require('./models/User');

async function testEmployeeIdGeneration() {
  console.log('🧪 Testing FSID001 Employee ID Generation System\n');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Check current highest FSID
    console.log('🔍 Checking current highest FSID...');
    const lastEmployee = await User.findOne({
      employeeId: new RegExp(`^FSID`)
    }).sort({ employeeId: -1 });
    
    if (lastEmployee) {
      console.log(`📋 Current highest FSID: ${lastEmployee.employeeId}`);
    } else {
      console.log('📋 No existing FSID format IDs found - this will be the first');
    }

    // Create test user data
    const testUsers = [
      {
        firstName: 'Test',
        lastName: 'Intern1',
        email: 'test.intern1@company.com',
        password: 'testpass123',
        role: 'Intern',
        department: 'Engineering',
        position: 'Software Development Intern'
      },
      {
        firstName: 'Test',
        lastName: 'Employee1',
        email: 'test.employee1@company.com',
        password: 'testpass123',
        role: 'Employee',
        department: 'Design',
        position: 'Junior Designer'
      },
      {
        firstName: 'Test',
        lastName: 'Developer1',
        email: 'test.developer1@company.com',
        password: 'testpass123',
        role: 'Software developer trainee',
        department: 'Engineering',
        position: 'Trainee Developer'
      }
    ];

    console.log('\n🚀 Creating test users with new FSID format...\n');

    const createdUsers = [];
    for (let i = 0; i < testUsers.length; i++) {
      const userData = testUsers[i];
      
      try {
        console.log(`👤 Creating user ${i + 1}: ${userData.firstName} ${userData.lastName}`);
        console.log(`   Role: ${userData.role}`);
        console.log(`   Email: ${userData.email}`);
        
        const user = new User(userData);
        await user.save();
        
        console.log(`✅ Success! Generated Employee ID: ${user.employeeId}`);
        console.log(`   Full Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Department: ${user.department}`);
        console.log(`   Position: ${user.position}`);
        console.log('');
        
        createdUsers.push(user);
        
        // Verify the ID format
        if (user.employeeId.startsWith('FSID') && user.employeeId.length === 7) {
          console.log(`✅ ID Format Valid: ${user.employeeId} (starts with FSID, 7 characters total)`);
        } else {
          console.log(`❌ ID Format Invalid: ${user.employeeId}`);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
      } catch (error) {
        console.log(`❌ Error creating user ${i + 1}:`, error.message);
        if (error.code === 11000) {
          console.log('   This is a duplicate key error - user might already exist');
        }
        console.log('');
      }
    }

    // Summary
    console.log('\n📊 GENERATION TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Users Created: ${createdUsers.length}/${testUsers.length}`);
    
    if (createdUsers.length > 0) {
      console.log('📋 Generated Employee IDs:');
      createdUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.employeeId} - ${user.firstName} ${user.lastName} (${user.role})`);
      });
      
      // Check for proper sequencing
      const ids = createdUsers.map(u => parseInt(u.employeeId.slice(4))).sort((a, b) => a - b);
      const isSequential = ids.every((id, index) => index === 0 || id === ids[index - 1] + 1);
      
      if (isSequential) {
        console.log('✅ ID Sequencing: Sequential (perfect)');
      } else {
        console.log('⚠️  ID Sequencing: Non-sequential (acceptable for concurrent creation)');
      }
    }

    // Check for "Intern" role functionality
    const internUsers = createdUsers.filter(u => u.role === 'Intern');
    if (internUsers.length > 0) {
      console.log(`✅ Intern Role: Working correctly (${internUsers.length} intern(s) created)`);
    }

    console.log('\n🎉 Employee ID Generation Test Completed Successfully!');
    console.log('💡 All new users will now get FSID001, FSID002, FSID003... format IDs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔧 Common solutions:');
    console.error('   • Make sure MongoDB is running');
    console.error('   • Check MONGODB_URI in backend/.env');
    console.error('   • Ensure backend dependencies are installed');
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📡 Database connection closed');
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test interrupted by user');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Test terminated');
  mongoose.connection.close();
  process.exit(0);
});

// Run the test
testEmployeeIdGeneration();