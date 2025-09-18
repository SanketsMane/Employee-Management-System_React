#!/usr/bin/env node

/**
 * Test script to verify registration API works without employee ID field
 * and supports the new "Intern" role
 */

const axios = require('axios');

async function testRegistrationAPI() {
  console.log('🧪 Testing Registration API (No Employee ID + Intern Role)\n');
  
  const baseURL = 'http://localhost:8000'; // Change if your backend runs on different port
  
  // Test user data - notice NO employeeId field
  const testRegistrationData = {
    firstName: 'API',
    lastName: 'TestIntern',
    email: 'api.test.intern@company.com',
    password: 'testpass123',
    role: 'Intern', // Testing the new Intern role
    department: 'Engineering',
    position: 'Software Engineering Intern'
  };

  try {
    console.log('📡 Testing registration endpoint...');
    console.log('📋 Registration Data:');
    console.log(`   Name: ${testRegistrationData.firstName} ${testRegistrationData.lastName}`);
    console.log(`   Email: ${testRegistrationData.email}`);
    console.log(`   Role: ${testRegistrationData.role} 👈 New Intern role!`);
    console.log(`   Department: ${testRegistrationData.department}`);
    console.log(`   Position: ${testRegistrationData.position}`);
    console.log(`   Employee ID: [NOT PROVIDED - Should be auto-generated] ✅`);
    console.log('');
    
    const response = await axios.post(`${baseURL}/api/auth/register`, testRegistrationData);
    
    if (response.data.success) {
      console.log('✅ REGISTRATION SUCCESS!');
      console.log(`📧 Message: ${response.data.message}`);
      
      if (response.data.user) {
        console.log('\n📋 Created User Details:');
        console.log(`   Employee ID: ${response.data.user.employeeId || 'Not returned'}`);
        console.log(`   Name: ${response.data.user.firstName} ${response.data.user.lastName}`);
        console.log(`   Email: ${response.data.user.email}`);
        console.log(`   Role: ${response.data.user.role}`);
        console.log(`   Department: ${response.data.user.department}`);
        console.log(`   Approved: ${response.data.user.isApproved ? 'Yes' : 'No (Pending Admin Approval)'}`);
        
        // Verify auto-generated employee ID
        if (response.data.user.employeeId && response.data.user.employeeId.startsWith('FSID')) {
          console.log('✅ Employee ID Auto-Generation: Working correctly!');
          console.log(`   Format: ${response.data.user.employeeId} (FSID + 3 digits)`);
        } else {
          console.log('⚠️  Employee ID Auto-Generation: Unexpected format');
        }
        
        // Verify Intern role
        if (response.data.user.role === 'Intern') {
          console.log('✅ Intern Role: Accepted and saved correctly!');
        } else {
          console.log(`❌ Intern Role: Expected 'Intern', got '${response.data.user.role}'`);
        }
      }
    } else {
      console.log('❌ Registration failed:', response.data.message);
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Registration API Error:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message || 'No message'}`);
      
      if (error.response.data.errors) {
        console.log('   Validation Errors:');
        error.response.data.errors.forEach(err => {
          console.log(`     • ${err}`);
        });
      }
      
      // Check for specific error patterns
      if (error.response.data.message?.includes('employeeId')) {
        console.log('\n💡 This might be an employeeId related error.');
        console.log('   ✓ Check that employeeId is not required in the form');
        console.log('   ✓ Verify auto-generation is working in the User model');
      }
      
      if (error.response.data.message?.includes('role') || error.response.data.message?.includes('Intern')) {
        console.log('\n💡 This might be a role validation error.');
        console.log('   ✓ Check that "Intern" is added to the User model enum');
        console.log('   ✓ Verify frontend role dropdown includes "Intern"');
      }
      
    } else if (error.request) {
      console.log('❌ Network Error: Cannot reach the backend server');
      console.log('💡 Make sure the backend is running on port 8000');
      console.log('   Run: cd backend && npm start');
    } else {
      console.log('❌ Unexpected Error:', error.message);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 TEST OBJECTIVES:');
  console.log('   ✅ Registration without employeeId field');
  console.log('   ✅ Auto-generated FSID001 format employee ID');
  console.log('   ✅ New "Intern" role acceptance');
  console.log('   ✅ Standard registration flow');
  console.log('\n📝 NOTE: If registration succeeds but you get duplicate email error,');
  console.log('         that means the system is working - just change the email and retry.');
}

// Run the test
console.log('🚀 Starting Registration API Test...\n');
testRegistrationAPI();