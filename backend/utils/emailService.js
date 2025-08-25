const nodemailer = require('nodemailer');
const cron = require('node-cron');
const User = require('../models/User');
const WorkSheet = require('../models/WorkSheet');
const { sendQuickSMS } = require('./smsService');

// Email transporter configuration
const createTransporter = () => {
  // Check if email is disabled in development
  if (process.env.EMAIL_ENABLED === 'false') {
    console.log('📧 Email service disabled for development (EMAIL_ENABLED=false)');
    return null;
  }

  // Validate email configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ Email credentials not configured. Email notifications will be skipped.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail', // Use Gmail service instead of manual config
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // This should be an App Password for Gmail
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    // Skip email if transporter couldn't be created
    if (!transporter) {
      console.log('📧 Email service disabled - skipping email notification');
      return { success: false, error: 'Email service disabled' };
    }
    
    const mailOptions = {
      from: `Employee Management System <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 Email send error:', error.message);
    
    // Handle specific Gmail authentication errors
    if (error.code === 'EAUTH') {
      console.log('📧 Gmail Authentication Failed - Possible solutions:');
      console.log('   1. Enable 2-Factor Authentication on Gmail');
      console.log('   2. Generate an App Password: https://support.google.com/accounts/answer/185833');
      console.log('   3. Use the App Password instead of regular password in EMAIL_PASS');
      console.log('   4. Or set EMAIL_ENABLED=false in .env for development');
      console.log('   5. Current EMAIL_USER:', process.env.EMAIL_USER);
    }
    
    return { success: false, error: error.message };
  }
};

// Generate motivational quotes
const getMotivationalQuote = () => {
  const quotes = [
    "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful. - Albert Schweitzer",
    "The way to get started is to quit talking and begin doing. - Walt Disney",
    "Don't be afraid to give up the good to go for the great. - John D. Rockefeller",
    "Innovation distinguishes between a leader and a follower. - Steve Jobs",
    "The future depends on what you do today. - Mahatma Gandhi",
    "Success is walking from failure to failure with no loss of enthusiasm. - Winston Churchill",
    "The only impossible journey is the one you never begin. - Tony Robbins",
    "It is during our darkest moments that we must focus to see the light. - Aristotle",
    "Quality is not an act, it is a habit. - Aristotle",
    "Your limitation—it's only your imagination."
  ];
  
  return quotes[Math.floor(Math.random() * quotes.length)];
};

// Send good morning email with motivational quote
const sendGoodMorningEmail = async (user) => {
  const quote = getMotivationalQuote();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #4f46e5; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Good Morning, ${user.firstName}!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Have a productive day ahead</p>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">💡 Today's Motivation</h3>
          <p style="color: #78350f; margin: 0; font-style: italic; font-size: 16px; line-height: 1.6;">${quote}</p>
        </div>
        
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0;">📋 Daily Reminders</h3>
          <ul style="color: #1e3a8a; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Don't forget to clock in when you start work</li>
            <li style="margin-bottom: 8px;">Fill out your daily worksheet with tasks</li>
            <li style="margin-bottom: 8px;">Take regular breaks to stay productive</li>
            <li>Remember to clock out at the end of your day</li>
          </ul>
        </div>
        
        <div style="text-align: center; padding: 20px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Developed by Sanket Mane | Email: contactsanket1@gmail.com</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject: `Good Morning ${user.firstName}! Start Your Day Right 🌅`,
    html
  });
};

// Send worksheet reminder email
const sendWorksheetReminder = async (user, reminderType) => {
  let subject, message, timeText;
  
  switch (reminderType) {
    case 'morning':
      subject = '📝 Worksheet Reminder - Plan Your Day';
      message = 'Good morning! Don\'t forget to fill out your daily worksheet and plan your tasks for today.';
      timeText = 'Morning Planning';
      break;
    case 'afternoon':
      subject = '📝 Worksheet Reminder - Update Your Progress';
      message = 'Hope you\'re having a productive day! Please update your worksheet with the tasks you\'ve completed.';
      timeText = 'Afternoon Update';
      break;
    case 'evening':
      subject = '📝 Worksheet Reminder - End of Day Summary';
      message = 'As you wrap up your day, please complete your worksheet and mark all completed tasks.';
      timeText = 'End of Day Summary';
      break;
    default:
      return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #059669; color: white; padding: 25px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">${timeText} Reminder</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Hello ${user.firstName}!</p>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">${message}</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 15px 0;">📊 Worksheet Tips:</h3>
          <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Be specific about your tasks and projects</li>
            <li style="margin-bottom: 8px;">Set realistic priorities for each hour</li>
            <li style="margin-bottom: 8px;">Update status as you progress through the day</li>
            <li>Add notes for better tracking and feedback</li>
          </ul>
        </div>
        
        <div style="text-align: center; padding: 20px 0;">
          <a href="${process.env.FRONTEND_URL}/worksheet" style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Update Worksheet</a>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Developed by Sanket Mane | Email: contactsanket1@gmail.com</p>
        </div>
      </div>
    </div>
  `;

  // Send email
  const emailResult = await sendEmail({
    email: user.email,
    subject,
    html
  });

  // Send SMS reminder if phone number is available
  if (user.phone) {
    await sendQuickSMS.worksheetReminder(user.phone, user.firstName);
  }

  return emailResult;
};

// Send leave request notification
const sendLeaveNotification = async (leave, type) => {
  try {
    const employee = await User.findById(leave.employee);
    const recipient = await User.findById(leave.recipient);
    
    if (!employee || !recipient) return;
    
    let subject, html;
    
    if (type === 'new_request') {
      subject = `New Leave Request from ${employee.firstName} ${employee.lastName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">New Leave Request</h2>
          <p><strong>Employee:</strong> ${employee.firstName} ${employee.lastName}</p>
          <p><strong>Type:</strong> ${leave.leaveType}</p>
          <p><strong>Duration:</strong> ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}</p>
          <p><strong>Total Days:</strong> ${leave.totalDays}</p>
          <p><strong>Reason:</strong> ${leave.reason}</p>
          <a href="${process.env.FRONTEND_URL}/leaves" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a>
        </div>
      `;
      
      await sendEmail({
        email: recipient.email,
        subject,
        html
      });
    } else if (type === 'status_update') {
      subject = `Leave Request ${leave.status}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${leave.status === 'Approved' ? '#059669' : '#dc2626'};">Leave Request ${leave.status}</h2>
          <p>Your leave request has been ${leave.status.toLowerCase()}.</p>
          <p><strong>Type:</strong> ${leave.leaveType}</p>
          <p><strong>Duration:</strong> ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}</p>
          ${leave.rejectionReason ? `<p><strong>Reason:</strong> ${leave.rejectionReason}</p>` : ''}
        </div>
      `;
      
      await sendEmail({
        email: employee.email,
        subject,
        html
      });
    }
  } catch (error) {
    console.error('Leave notification error:', error);
  }
};

// Initialize cron jobs
const initializeCronJobs = () => {
  console.log('Initializing cron jobs...');
  
  // Good morning email at 9:00 AM every weekday
  cron.schedule('0 9 * * 1-5', async () => {
    try {
      console.log('Sending good morning emails...');
      const users = await User.find({ isActive: true, role: { $ne: 'Admin' } });
      
      for (const user of users) {
        await sendGoodMorningEmail(user);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`Good morning emails sent to ${users.length} users`);
    } catch (error) {
      console.error('Good morning email cron error:', error);
    }
  }, {
    timezone: "America/New_York"
  });

  // Attendance reminder SMS at 9:30 AM
  cron.schedule('30 9 * * 1-5', async () => {
    try {
      console.log('📱 Sending attendance reminder SMS...');
      const users = await User.find({ 
        isActive: true, 
        role: { $ne: 'Admin' },
        phone: { $exists: true, $ne: '' }
      });
      
      for (const user of users) {
        await sendQuickSMS.attendanceReminder(user.phone, user.firstName);
        // Add delay to avoid SMS rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`📱 Attendance reminder SMS sent to ${users.length} users`);
    } catch (error) {
      console.error('📱 Attendance reminder SMS cron error:', error);
    }
  }, {
    timezone: "America/New_York"
  });

  // Worksheet reminder at 10:00 AM
  cron.schedule('0 10 * * 1-5', async () => {
    try {
      console.log('Sending morning worksheet reminders...');
      const users = await User.find({ isActive: true, role: { $ne: 'Admin' } });
      
      for (const user of users) {
        await sendWorksheetReminder(user, 'morning');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Morning worksheet reminder error:', error);
    }
  });

  // Worksheet reminder at 1:00 PM
  cron.schedule('0 13 * * 1-5', async () => {
    try {
      console.log('Sending afternoon worksheet reminders...');
      const users = await User.find({ isActive: true, role: { $ne: 'Admin' } });
      
      for (const user of users) {
        await sendWorksheetReminder(user, 'afternoon');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Afternoon worksheet reminder error:', error);
    }
  });

  // Worksheet reminder at 5:00 PM
  cron.schedule('0 17 * * 1-5', async () => {
    try {
      console.log('Sending evening worksheet reminders...');
      const users = await User.find({ isActive: true, role: { $ne: 'Admin' } });
      
      for (const user of users) {
        await sendWorksheetReminder(user, 'evening');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Evening worksheet reminder error:', error);
    }
  });

  console.log('Cron jobs initialized successfully');
};

module.exports = {
  sendEmail,
  sendGoodMorningEmail,
  sendWorksheetReminder,
  sendLeaveNotification,
  initializeCronJobs
};
