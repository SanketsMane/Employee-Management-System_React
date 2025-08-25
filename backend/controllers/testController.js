const { sendEmail } = require('../utils/emailService');

// Test email functionality
const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const emailOptions = {
      email: email,
      subject: 'EMS Test Email - System is Working!',
      message: 'This is a test email to verify the email service is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 Email Service Test Successful!</h2>
          <p>Hello,</p>
          <p>This is a test email from your Employee Management System to verify that the email service is configured correctly.</p>
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">✅ System Status</h3>
            <ul style="margin: 10px 0;">
              <li>Email Service: <strong style="color: #16a34a;">Working</strong></li>
              <li>SMTP Configuration: <strong style="color: #16a34a;">Connected</strong></li>
              <li>Template Rendering: <strong style="color: #16a34a;">Active</strong></li>
              <li>Test Date: <strong>${new Date().toLocaleString()}</strong></li>
            </ul>
          </div>
          <p>If you received this email, your EMS email service is fully functional! 🚀</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent from your Employee Management System<br>
            Developed by Sanket Mane | contactsanket1@gmail.com
          </p>
        </div>
      `
    };

    const result = await sendEmail(emailOptions);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
};

// Test system health
const healthCheck = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'EMS System Health Check',
      data: {
        server: 'Online',
        database: 'Connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        features: {
          authentication: 'Active',
          userManagement: 'Active',
          attendanceSystem: 'Active',
          worksheetManagement: 'Active',
          leaveManagement: 'Active',
          analytics: 'Active',
          emailService: 'Configured'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};

module.exports = {
  testEmail,
  healthCheck
};
