const nodemailer = require('nodemailer');

// SMS Service using Email-to-SMS Gateway
// This service converts phone numbers to carrier-specific email addresses
// and sends SMS via email

// Major Indian carrier SMS gateways
const CARRIER_GATEWAYS = {
  // Airtel
  'airtel': 'sms.airtelap.com',
  
  // Jio
  'jio': 'jiomms.com',
  
  // Vi (Vodafone Idea)
  'vi': 'vtext.com',
  'vodafone': 'vtext.com',
  
  // BSNL
  'bsnl': 'bsnlmms.in',
  
  // Generic fallback (works with many carriers)
  'generic': 'sms.carrier.com'
};

// Create transporter for SMS
const createSMSTransporter = () => {
  // Check if email service is disabled
  if (process.env.EMAIL_ENABLED === 'false') {
    console.log('📱 SMS service disabled (EMAIL_ENABLED=false)');
    return null;
  }

  // Validate email configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ Email credentials not configured. SMS will be skipped.');
    return null;
  }

  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password: ljyv ntat krdx atmy
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Detect carrier from phone number (basic implementation)
const detectCarrier = (phoneNumber) => {
  // Remove country code and formatting
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  // Indian mobile number patterns (basic detection)
  const firstFourDigits = cleanNumber.substring(0, 4);
  
  // Airtel prefixes
  if (['9910', '9911', '9912', '9913', '9914', '9915', '9916', '9917', '9918', '9919'].includes(firstFourDigits)) {
    return 'airtel';
  }
  
  // Jio prefixes  
  if (['8901', '8902', '8903', '8904', '8905', '6299', '7008', '7009'].includes(firstFourDigits)) {
    return 'jio';
  }
  
  // Vi/Vodafone prefixes
  if (['9400', '9401', '9402', '9403', '9404', '9405', '9406', '9407', '9408', '9409'].includes(firstFourDigits)) {
    return 'vi';
  }
  
  // BSNL prefixes
  if (['9454', '9455', '9456', '9457', '9458', '9459', '7407', '7408', '7409'].includes(firstFourDigits)) {
    return 'bsnl';
  }
  
  // Default to generic if carrier can't be detected
  return 'generic';
};

// Convert phone number to SMS email address
const phoneToSMSEmail = (phoneNumber, carrier = null) => {
  // Clean phone number
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  // Auto-detect carrier if not provided
  if (!carrier) {
    carrier = detectCarrier(cleanNumber);
  }
  
  // Get gateway for carrier
  const gateway = CARRIER_GATEWAYS[carrier] || CARRIER_GATEWAYS.generic;
  
  // Format: 10digitnumber@gateway
  // For Indian numbers, remove country code if present
  let formattedNumber = cleanNumber;
  if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
    formattedNumber = cleanNumber.substring(2);
  }
  
  return `${formattedNumber}@${gateway}`;
};

// Send SMS function
const sendSMS = async (options) => {
  try {
    const transporter = createSMSTransporter();
    
    // Skip SMS if transporter couldn't be created
    if (!transporter) {
      console.log('📱 SMS service disabled - skipping SMS notification');
      return { success: false, error: 'SMS service disabled' };
    }
    
    // Convert phone number to SMS email
    const smsEmail = phoneToSMSEmail(options.phone, options.carrier);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: smsEmail,
      subject: '', // SMS doesn't need subject
      text: options.message,
      // Keep message short for SMS (160 chars limit)
      html: undefined
    };

    console.log(`📱 Sending SMS to ${options.phone} via ${smsEmail}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('📱 SMS sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('📱 SMS send error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send both Email and SMS
const sendNotification = async (options) => {
  const results = {
    email: null,
    sms: null
  };
  
  // Send email if email address provided
  if (options.email) {
    const emailService = require('./emailService');
    results.email = await emailService.sendEmail({
      email: options.email,
      subject: options.subject,
      message: options.message,
      html: options.html
    });
  }
  
  // Send SMS if phone number provided
  if (options.phone) {
    // Truncate message for SMS (160 char limit)
    const smsMessage = options.message.length > 160 
      ? options.message.substring(0, 157) + '...'
      : options.message;
      
    results.sms = await sendSMS({
      phone: options.phone,
      message: smsMessage,
      carrier: options.carrier
    });
  }
  
  return results;
};

// SMS templates for common notifications
const SMS_TEMPLATES = {
  LEAVE_APPROVED: (userName, leaveType, dates) => 
    `Hi ${userName}, your ${leaveType} leave request for ${dates} has been APPROVED. - EMS`,
    
  LEAVE_REJECTED: (userName, leaveType, dates) => 
    `Hi ${userName}, your ${leaveType} leave request for ${dates} has been REJECTED. Check email for details. - EMS`,
    
  ATTENDANCE_REMINDER: (userName) => 
    `Hi ${userName}, don't forget to mark your attendance today! Login to EMS. - Employee Management`,
    
  WORKSHEET_REMINDER: (userName) => 
    `Hi ${userName}, please submit your daily worksheet. Login to EMS to update. - Employee Management`,
    
  BIRTHDAY_WISH: (userName) => 
    `🎉 Happy Birthday ${userName}! Wishing you a wonderful year ahead. - EMS Team`,
    
  WELCOME_MESSAGE: (userName, employeeId) => 
    `Welcome to the team ${userName}! Your Employee ID: ${employeeId}. Check email for login details. - EMS`,
    
  PASSWORD_RESET: (userName, tempPassword) => 
    `Hi ${userName}, your password has been reset. Temp password: ${tempPassword}. Login & change immediately. - EMS`,
    
  MEETING_REMINDER: (userName, meeting, time) => 
    `Hi ${userName}, reminder: ${meeting} scheduled at ${time}. Don't miss it! - EMS`
};

// Quick SMS sending functions
const sendQuickSMS = {
  leaveApproved: async (phone, userName, leaveType, dates) => {
    return await sendSMS({
      phone,
      message: SMS_TEMPLATES.LEAVE_APPROVED(userName, leaveType, dates)
    });
  },
  
  leaveRejected: async (phone, userName, leaveType, dates) => {
    return await sendSMS({
      phone,
      message: SMS_TEMPLATES.LEAVE_REJECTED(userName, leaveType, dates)
    });
  },
  
  attendanceReminder: async (phone, userName) => {
    return await sendSMS({
      phone,
      message: SMS_TEMPLATES.ATTENDANCE_REMINDER(userName)
    });
  },
  
  worksheetReminder: async (phone, userName) => {
    return await sendSMS({
      phone,
      message: SMS_TEMPLATES.WORKSHEET_REMINDER(userName)
    });
  },
  
  birthdayWish: async (phone, userName) => {
    return await sendSMS({
      phone,
      message: SMS_TEMPLATES.BIRTHDAY_WISH(userName)
    });
  },
  
  welcomeMessage: async (phone, userName, employeeId) => {
    return await sendSMS({
      phone,
      message: SMS_TEMPLATES.WELCOME_MESSAGE(userName, employeeId)
    });
  },
  
  passwordReset: async (phone, userName, tempPassword) => {
    return await sendSMS({
      phone,
      message: SMS_TEMPLATES.PASSWORD_RESET(userName, tempPassword)
    });
  }
};

module.exports = {
  sendSMS,
  sendNotification,
  phoneToSMSEmail,
  detectCarrier,
  sendQuickSMS,
  SMS_TEMPLATES,
  CARRIER_GATEWAYS
};
