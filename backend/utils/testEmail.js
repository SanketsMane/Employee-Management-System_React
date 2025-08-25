const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sendEmail } = require('./emailService');

const testEmail = async () => {
  console.log('🧪 Testing email configuration...');
  console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
  console.log('📧 EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'NOT SET');
  
  const result = await sendEmail({
    email: process.env.EMAIL_USER, // Send to self for testing
    subject: 'Email Service Test',
    html: `
      <h2>Email Service Test</h2>
      <p>If you receive this email, your email service is working correctly!</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
    `
  });
  
  if (result.success) {
    console.log('✅ Email test successful!');
  } else {
    console.log('❌ Email test failed:', result.error);
  }
  
  process.exit(0);
};

testEmail();
