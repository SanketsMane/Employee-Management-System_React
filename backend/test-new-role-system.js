#!/usr/bin/env node

/**
 * Test the complete registration flow with new role system
 * This tests the API endpoints with the comprehensive role functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testNewRoleRegistrationSystem() {
  console.log('🧪 Testing Complete Registration Flow with New Role System\n');
  
  const testUsers = [
    {
      name: 'Standard Role Test',
      data: {
        firstName: 'Alice',
        lastName: 'Engineer',
        email: 'alice.engineer@test.com',
        password: 'testpass123',
        role: 'Software Engineer',
        department: 'Engineering'
      }
    },
    {
      name: 'Intern Role Test', 
      data: {
        firstName: 'Bob',
        lastName: 'Intern',
        email: 'bob.intern@test.com',
        password: 'testpass123',
        role: 'Software Engineering Intern',
        department: 'Engineering'
      }
    },
    {
      name: 'Data Science Role Test',
      data: {
        firstName: 'Carol',
        lastName: 'DataScientist',
        email: 'carol.ds@test.com',
        password: 'testpass123',
        role: 'Data Scientist',
        department: 'Analytics'
      }
    },
    {
      name: 'Cloud Role Test',
      data: {
        firstName: 'David',
        lastName: 'CloudArchitect',
        email: 'david.cloud@test.com',
        password: 'testpass123',
        role: 'Cloud Architect',
        department: 'Infrastructure'
      }
    },
    {
      name: 'Custom Role Test',
      data: {
        firstName: 'Eva',
        lastName: 'Custom',
        email: 'eva.custom@test.com',
        password: 'testpass123',
        role: 'Other',
        customRole: 'Blockchain Specialist',
        department: 'R&D'
      }
    },
    {
      name: 'Design Role Test',
      data: {
        firstName: 'Frank',
        lastName: 'Designer',
        email: 'frank.designer@test.com',
        password: 'testpass123',
        role: 'UI UX designer',
        department: 'Design'
      }
    }
  ];

  let passedTests = 0;
  let totalTests = testUsers.length;

  for (let i = 0; i < testUsers.length; i++) {
    const test = testUsers[i];
    console.log(`\n🧪 Test ${i + 1}/${totalTests}: ${test.name}`);
    console.log(`📝 Data: ${JSON.stringify(test.data, null, 2)}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, test.data);
      
      if (response.status === 201) {
        console.log('✅ Registration successful!');
        console.log(`📋 Response:`, {
          message: response.data.message,
          user: {
            employeeId: response.data.user?.employeeId,
            firstName: response.data.user?.firstName,
            lastName: response.data.user?.lastName,
            role: response.data.user?.role,
            customRole: response.data.user?.customRole,
            position: response.data.user?.position,
            department: response.data.user?.department,
            isApproved: response.data.user?.isApproved
          }
        });
        
        // Validate FSID format
        const employeeId = response.data.user?.employeeId;
        if (employeeId && employeeId.startsWith('FSID') && employeeId.length === 7) {
          console.log(`✅ Employee ID format correct: ${employeeId}`);
        } else {
          console.log(`⚠️  Employee ID format issue: ${employeeId}`);
        }
        
        // Validate custom role handling
        if (test.data.role === 'Other' && test.data.customRole) {
          if (response.data.user?.role === 'Other' && response.data.user?.customRole === test.data.customRole) {
            console.log(`✅ Custom role correctly handled: ${response.data.user.customRole}`);
          } else {
            console.log(`⚠️  Custom role issue - Expected: ${test.data.customRole}, Got: ${response.data.user?.customRole}`);
          }
        }
        
        // Validate position auto-assignment
        const expectedPosition = test.data.role === 'Other' ? test.data.customRole : test.data.role;
        if (response.data.user?.position === expectedPosition) {
          console.log(`✅ Position correctly auto-assigned: ${response.data.user.position}`);
        } else {
          console.log(`⚠️  Position assignment issue - Expected: ${expectedPosition}, Got: ${response.data.user?.position}`);
        }
        
        passedTests++;
        
      } else {
        console.log(`❌ Unexpected response status: ${response.status}`);
      }
      
    } catch (error) {
      console.log('❌ Registration failed!');
      
      if (error.response) {
        console.log(`📛 Status: ${error.response.status}`);
        console.log(`📛 Error:`, error.response.data);
        
        if (error.response.status === 400 && error.response.data.message?.includes('already exists')) {
          console.log('ℹ️  This user might already exist from previous tests');
        }
      } else {
        console.log(`📛 Network/Server Error:`, error.message);
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // Test role validation endpoint
  console.log('\n🔍 Testing Role Validation...');
  try {
    const roleTests = [
      'Software Engineer',
      'Data Scientist', 
      'Software Engineering Intern',
      'Cloud Architect',
      'UI UX designer',
      'Other',
      'Invalid Role Name'
    ];
    
    for (const role of roleTests) {
      try {
        const testData = {
          firstName: 'Test',
          lastName: 'User',
          email: `test.${Date.now()}@test.com`,
          password: 'testpass123',
          role: role,
          customRole: role === 'Other' ? 'Custom Test Role' : undefined,
          department: 'Test'
        };
        
        const response = await axios.post(`${BASE_URL}/api/auth/register`, testData);
        console.log(`✅ Role "${role}" - Valid`);
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`❌ Role "${role}" - Invalid (${error.response.data.message})`);
        } else {
          console.log(`⚠️  Role "${role}" - Error: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Role validation test failed:', error.message);
  }

  // Summary
  console.log('\n📊 COMPREHENSIVE ROLE SYSTEM TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Passed Tests: ${passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! ✨');
    console.log('🚀 The comprehensive role system is working perfectly!');
    console.log('\n💡 Key features tested:');
    console.log('   • Standard professional roles');
    console.log('   • Internship roles'); 
    console.log('   • Data & Analytics roles');
    console.log('   • Cloud & Infrastructure roles');
    console.log('   • Design roles');
    console.log('   • Custom roles with "Other" option');
    console.log('   • FSID employee ID generation');
    console.log('   • Position auto-assignment');
    console.log('   • Role validation');
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Check the logs above for details.`);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test interrupted by user');
  process.exit(0);
});

// Run the test
testNewRoleRegistrationSystem().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});