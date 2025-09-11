const axios = require('axios');

// Test company API endpoint
async function testCompanyAPI() {
  console.log('🧪 Testing Company API...');
  
  try {
    // First, let's try to login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:8000/api/auth/login', {
      email: 'contactsanket1@gmail.com',
      password: 'Admin123!'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      const token = loginResponse.data.token;
      
      // Now test company info endpoint
      console.log('🏢 Fetching company info...');
      const companyResponse = await axios.get('http://localhost:8000/api/company/info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Company API Response:');
      console.log('Success:', companyResponse.data.success);
      console.log('Data:', JSON.stringify(companyResponse.data.data, null, 2));
      
      if (companyResponse.data.success) {
        console.log('✅ Company API is working correctly!');
      } else {
        console.log('❌ Company API returned success: false');
        console.log('Error:', companyResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed');
      console.log('Response:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompanyAPI();
