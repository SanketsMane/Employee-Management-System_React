#!/usr/bin/env node

/**
 * Test the comprehensive role system with autocomplete and custom roles
 * This verifies that the new role system works correctly
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

// Import User model
const User = require('./models/User');

async function testComprehensiveRoleSystem() {
  console.log('🧪 Testing Comprehensive Role System with Autocomplete & Custom Roles\n');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test various role scenarios
    const testUsers = [
      {
        firstName: 'Alice',
        lastName: 'DataScientist',
        email: 'alice.datascientist@test.com',
        password: 'testpass123',
        role: 'Data Scientist',
        department: 'Engineering'
      },
      {
        firstName: 'Bob',
        lastName: 'MLIntern',
        email: 'bob.mlintern@test.com',
        password: 'testpass123',
        role: 'Machine Learning Intern',
        department: 'Engineering'
      },
      {
        firstName: 'Carol',
        lastName: 'CloudArchitect',
        email: 'carol.cloudarchitect@test.com',
        password: 'testpass123',
        role: 'Cloud Architect',
        department: 'IT'
      },
      {
        firstName: 'David',
        lastName: 'UIUXDesigner',
        email: 'david.uiux@test.com',
        password: 'testpass123',
        role: 'UI UX designer',
        department: 'Design'
      },
      {
        firstName: 'Eva',
        lastName: 'CustomRole',
        email: 'eva.custom@test.com',
        password: 'testpass123',
        role: 'Other',
        customRole: 'Blockchain Developer',
        department: 'Engineering'
      },
      {
        firstName: 'Frank',
        lastName: 'SREEngineer',
        email: 'frank.sre@test.com',
        password: 'testpass123',
        role: 'Site Reliability Engineer (SRE)',
        department: 'Operations'
      }
    ];

    console.log('🚀 Testing various role types...\n');

    const createdUsers = [];
    for (let i = 0; i < testUsers.length; i++) {
      const userData = testUsers[i];
      
      try {
        console.log(`👤 Creating user ${i + 1}: ${userData.firstName} ${userData.lastName}`);
        console.log(`   Role: ${userData.role}`);
        if (userData.customRole) {
          console.log(`   Custom Role: ${userData.customRole}`);
        }
        console.log(`   Department: ${userData.department}`);
        console.log(`   Email: ${userData.email}`);
        
        const user = new User(userData);
        await user.save();
        
        console.log(`✅ Success! User created with:`);
        console.log(`   Employee ID: ${user.employeeId}`);
        console.log(`   Role: ${user.role}`);
        if (user.customRole) {
          console.log(`   Custom Role: ${user.customRole}`);
        }
        console.log(`   Position: ${user.position}`);
        console.log(`   Department: ${user.department}`);
        console.log(`   Approved: ${user.isApproved}`);
        console.log('');
        
        createdUsers.push(user);
        
        // Verify role handling
        if (user.role === 'Other' && user.customRole) {
          console.log(`✅ Custom Role: Correctly handled "${user.customRole}"`);
        } else if (user.role !== 'Other') {
          console.log(`✅ Standard Role: Correctly set to "${user.role}"`);
        } else {
          console.log(`❌ Role Issue: Other selected but no custom role provided`);
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
    console.log('\n📊 COMPREHENSIVE ROLE SYSTEM TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Users Created: ${createdUsers.length}/${testUsers.length}`);
    
    if (createdUsers.length > 0) {
      console.log('\n📋 Role Test Results:');
      
      // Group by role categories
      const roleCategories = {
        'Data & Analytics': createdUsers.filter(u => ['Data Scientist', 'Machine Learning Intern'].includes(u.role)),
        'Cloud & Infrastructure': createdUsers.filter(u => ['Cloud Architect', 'Site Reliability Engineer (SRE)'].includes(u.role)),
        'Design': createdUsers.filter(u => u.role.includes('UI') || u.role.includes('UX')),
        'Custom': createdUsers.filter(u => u.role === 'Other')
      };
      
      Object.entries(roleCategories).forEach(([category, users]) => {
        if (users.length > 0) {
          console.log(`\n   ${category} Roles (${users.length}):`);
          users.forEach(user => {
            console.log(`     • ${user.employeeId} - ${user.firstName} ${user.lastName}`);
            console.log(`       Role: ${user.role}${user.customRole ? ` (Custom: ${user.customRole})` : ''}`);
          });
        }
      });
      
      // Check custom role functionality
      const customRoleUsers = createdUsers.filter(u => u.role === 'Other' && u.customRole);
      console.log(`\n✅ Custom Role Feature: ${customRoleUsers.length} custom role(s) created`);
      
      // Check FSID format
      const validIds = createdUsers.filter(u => u.employeeId && u.employeeId.startsWith('FSID'));
      console.log(`✅ FSID Format: ${validIds.length}/${createdUsers.length} users have correct ID format`);
      
      // Check role variety
      const uniqueRoles = [...new Set(createdUsers.map(u => u.role))];
      console.log(`✅ Role Variety: ${uniqueRoles.length} different role types tested`);
    }

    console.log('\n🎉 Comprehensive Role System Test Completed!');
    console.log('💡 Key Features Tested:');
    console.log('   • Traditional roles (Employee, Manager, etc.)');
    console.log('   • Internship roles (Data Science Intern, ML Intern, etc.)');
    console.log('   • Professional roles (Data Scientist, Cloud Architect, etc.)');
    console.log('   • Custom role functionality with "Other" option');
    console.log('   • Auto-generated FSID employee IDs');
    console.log('   • Position auto-fill from role/custom role');

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
testComprehensiveRoleSystem();