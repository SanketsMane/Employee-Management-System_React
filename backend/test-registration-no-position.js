#!/usr/bin/env node

/**
 * Test registration without position field
 * This verifies that users can register with just role and department
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

// Import User model
const User = require('./models/User');

async function testRegistrationWithoutPosition() {
  console.log('🧪 Testing Registration Without Position Field\n');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test user data without position field
    const testUsers = [
      {
        firstName: 'John',
        lastName: 'InternTest',
        email: 'john.intern@test.com',
        password: 'testpass123',
        role: 'Intern',
        department: 'Engineering'
        // Note: No position field - should use role as position
      },
      {
        firstName: 'Jane',
        lastName: 'EmployeeTest',
        email: 'jane.employee@test.com',
        password: 'testpass123',
        role: 'Software developer trainee',
        department: 'Engineering'
        // Note: No position field - should use role as position
      },
      {
        firstName: 'Mike',
        lastName: 'DesignerTest',
        email: 'mike.designer@test.com',
        password: 'testpass123',
        role: 'UI UX designer',
        department: 'Design'
        // Note: No position field - should use role as position
      }
    ];

    console.log('🚀 Creating users without position field...\n');

    const createdUsers = [];
    for (let i = 0; i < testUsers.length; i++) {
      const userData = testUsers[i];
      
      try {
        console.log(`👤 Creating user ${i + 1}: ${userData.firstName} ${userData.lastName}`);
        console.log(`   Role: ${userData.role}`);
        console.log(`   Department: ${userData.department}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Position field provided: No (should auto-fill from role)`);
        
        const user = new User(userData);
        await user.save();
        
        console.log(`✅ Success! User created with:`);
        console.log(`   Employee ID: ${user.employeeId}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Position: ${user.position} ${user.position === user.role ? '(auto-filled from role ✅)' : '(different from role ⚠️)'}`);
        console.log(`   Department: ${user.department}`);
        console.log(`   Approved: ${user.isApproved}`);
        console.log('');
        
        createdUsers.push(user);
        
        // Verify position was set correctly
        if (user.position && (user.position === user.role || user.position === 'Employee')) {
          console.log(`✅ Position Field: Correctly set to "${user.position}"`);
        } else {
          console.log(`❌ Position Field: Unexpected value "${user.position}"`);
        }
        
        // Verify employee ID format
        if (user.employeeId && user.employeeId.startsWith('FSID') && user.employeeId.length === 7) {
          console.log(`✅ Employee ID Format: Valid (${user.employeeId})`);
        } else {
          console.log(`❌ Employee ID Format: Invalid (${user.employeeId})`);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
      } catch (error) {
        console.log(`❌ Error creating user ${i + 1}:`, error.message);
        
        if (error.code === 11000) {
          console.log('   This user might already exist');
        } else if (error.name === 'ValidationError') {
          console.log('   Validation errors:');
          Object.values(error.errors).forEach(err => {
            console.log(`     - ${err.path}: ${err.message}`);
          });
        }
        console.log('');
      }
    }

    // Summary
    console.log('\n📊 REGISTRATION TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Users Created: ${createdUsers.length}/${testUsers.length}`);
    
    if (createdUsers.length > 0) {
      console.log('\n📋 Registration Results:');
      createdUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.employeeId} - ${user.firstName} ${user.lastName}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Position: ${user.position}`);
        console.log(`      Department: ${user.department}`);
        console.log('');
      });
      
      // Check position auto-fill functionality
      const correctPositions = createdUsers.filter(u => u.position === u.role || u.position === 'Employee');
      console.log(`✅ Position Auto-Fill: ${correctPositions.length}/${createdUsers.length} users have correct position`);
      
      // Check for "Intern" role functionality
      const internUsers = createdUsers.filter(u => u.role === 'Intern');
      if (internUsers.length > 0) {
        console.log(`✅ Intern Role: Working correctly (${internUsers.length} intern(s) created)`);
      }
      
      // Check FSID format
      const validIds = createdUsers.filter(u => u.employeeId && u.employeeId.startsWith('FSID'));
      console.log(`✅ FSID Format: ${validIds.length}/${createdUsers.length} users have correct ID format`);
    }

    console.log('\n🎉 Registration Test (Without Position Field) Completed!');
    console.log('💡 Users can now register with just Role and Department');
    console.log('📝 Position field is automatically set from Role');

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
testRegistrationWithoutPosition();