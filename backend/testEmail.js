const { sendEmail } = require('./utils/emailService');
require('dotenv').config();

const testEmail = async () => {
  try {
    console.log('🧪 Testing email service...');
    
    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669;">Email Service Test ✅</h1>
        <p>This is a test email to verify the email service is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <p style="color: #666;">Sent from FormoEMS Backend</p>
      </div>
    `;

    await sendEmail({
      email: 'contactsanket1@gmail.com', // Your email
      subject: 'FormoEMS - Email Service Test',
      html: testHtml
    });

    console.log('✅ Test email sent successfully!');
    console.log('📧 Check your email: contactsanket1@gmail.com');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
  
  process.exit(0);
};

testEmail();
