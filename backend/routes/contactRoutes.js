const express = require('express');
const { sendEmail } = require('../utils/emailService');
const router = express.Router();

// Contact form submission
router.post('/submit', async (req, res) => {
  try {
    const { name, email, company, message, phone } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and message are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Send email to Formonex team
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-row { margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #667eea; }
          .label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
          .value { color: #333; }
          .message-box { background: white; padding: 20px; border-radius: 5px; border: 1px solid #ddd; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📧 New Contact Form Submission</h2>
            <p>FormoEMS Landing Page Contact</p>
          </div>
          
          <div class="content">
            <div class="info-row">
              <div class="label">👤 Name:</div>
              <div class="value">${name}</div>
            </div>
            
            <div class="info-row">
              <div class="label">📧 Email:</div>
              <div class="value">${email}</div>
            </div>
            
            ${company ? `
            <div class="info-row">
              <div class="label">🏢 Company:</div>
              <div class="value">${company}</div>
            </div>
            ` : ''}
            
            ${phone ? `
            <div class="info-row">
              <div class="label">📞 Phone:</div>
              <div class="value">${phone}</div>
            </div>
            ` : ''}
            
            <div class="info-row">
              <div class="label">📅 Submitted:</div>
              <div class="value">${new Date().toLocaleString()}</div>
            </div>
            
            <div class="message-box">
              <div class="label">💬 Message:</div>
              <div class="value">${message.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="footer">
              <p>This email was automatically generated from the FormoEMS contact form.</p>
              <p>Please respond to the customer's email address: ${email}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: 'formonexsolutions@gmail.com',
      subject: `🔔 New Contact Form Submission - ${name}`,
      html: emailContent
    });

    // Send confirmation email to the user
    const confirmationEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 5px; border: 1px solid #ddd; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .logo { width: 50px; height: 50px; background: #667eea; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">F</div>
            <h2>Thank you for contacting FormoEMS!</h2>
            <p>We've received your message</p>
          </div>
          
          <div class="content">
            <div class="info-box">
              <h3>Hi ${name},</h3>
              <p>Thank you for reaching out to us! We have successfully received your inquiry and our team will review it shortly.</p>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our team will review your message within 24 hours</li>
                <li>We'll reach out to you via email at ${email}</li>
                <li>If urgent, we may also contact you by phone</li>
              </ul>
              
              <p><strong>Your message:</strong></p>
              <em>"${message}"</em>
            </div>
            
            <div class="info-box">
              <h4>🚀 While you wait, explore FormoEMS:</h4>
              <ul>
                <li><strong>Employee Management:</strong> Comprehensive workforce solutions</li>
                <li><strong>Attendance Tracking:</strong> Real-time monitoring and analytics</li>
                <li><strong>Performance Analytics:</strong> Data-driven insights</li>
                <li><strong>Role-Based Access:</strong> Secure and customizable permissions</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The FormoEMS Team</p>
              <p>📧 formonexsolutions@gmail.com</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: '✅ Thank you for contacting FormoEMS - We\'ll be in touch soon!',
      html: confirmationEmail
    });

    console.log(`✅ Contact form submission processed for ${name} (${email})`);

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! We\'ll get back to you soon.'
    });

  } catch (error) {
    console.error('❌ Error processing contact form:', error);
    res.status(500).json({
      success: false,
      message: 'There was an error sending your message. Please try again later.'
    });
  }
});

module.exports = router;