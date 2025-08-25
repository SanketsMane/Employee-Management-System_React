const express = require('express');
const router = express.Router();
const { sendSMS, sendQuickSMS, phoneToSMSEmail, detectCarrier } = require('../utils/smsService');
const { protect, authorize } = require('../utils/roleMiddleware');

// @desc    Test SMS functionality
// @route   POST /api/test/sms
// @access  Private/Admin
router.post('/sms', protect, authorize('Admin'), async (req, res) => {
  try {
    const { phone, message, type = 'custom' } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    let result;
    
    // Test different message types
    switch (type) {
      case 'welcome':
        result = await sendQuickSMS.welcomeMessage(phone, 'Test User', 'EMP001');
        break;
      case 'attendance':
        result = await sendQuickSMS.attendanceReminder(phone, 'Test User');
        break;
      case 'worksheet':
        result = await sendQuickSMS.worksheetReminder(phone, 'Test User');
        break;
      case 'leave_approved':
        result = await sendQuickSMS.leaveApproved(phone, 'Test User', 'Sick Leave', '25-26 Aug');
        break;
      case 'leave_rejected':
        result = await sendQuickSMS.leaveRejected(phone, 'Test User', 'Casual Leave', '25-26 Aug');
        break;
      case 'birthday':
        result = await sendQuickSMS.birthdayWish(phone, 'Test User');
        break;
      case 'password_reset':
        result = await sendQuickSMS.passwordReset(phone, 'Test User', 'TempPass123');
        break;
      default:
        if (!message) {
          return res.status(400).json({
            success: false,
            message: 'Message is required for custom SMS'
          });
        }
        result = await sendSMS({ phone, message });
    }
    
    // Get carrier detection info
    const carrier = detectCarrier(phone);
    const smsEmail = phoneToSMSEmail(phone);
    
    res.status(200).json({
      success: true,
      message: 'SMS test completed',
      data: {
        result,
        phone,
        carrier,
        smsEmail,
        type,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('SMS test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing SMS',
      error: error.message
    });
  }
});

// @desc    Test carrier detection
// @route   GET /api/test/sms/carrier/:phone
// @access  Private/Admin  
router.get('/carrier/:phone', protect, authorize('Admin'), async (req, res) => {
  try {
    const { phone } = req.params;
    
    const carrier = detectCarrier(phone);
    const smsEmail = phoneToSMSEmail(phone);
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    
    res.status(200).json({
      success: true,
      data: {
        originalPhone: phone,
        cleanNumber,
        detectedCarrier: carrier,
        smsEmail,
        supportedCarriers: ['airtel', 'jio', 'vi', 'vodafone', 'bsnl', 'generic']
      }
    });
    
  } catch (error) {
    console.error('Carrier detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error detecting carrier',
      error: error.message
    });
  }
});

// @desc    Get SMS service status
// @route   GET /api/test/sms/status
// @access  Private/Admin
router.get('/status', protect, authorize('Admin'), async (req, res) => {
  try {
    const isEnabled = process.env.EMAIL_ENABLED !== 'false';
    const hasCredentials = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    
    res.status(200).json({
      success: true,
      data: {
        smsEnabled: isEnabled,
        hasCredentials,
        emailUser: process.env.EMAIL_USER || 'Not configured',
        carrierGateways: {
          airtel: 'sms.airtelap.com',
          jio: 'jiomms.com', 
          vi: 'vtext.com',
          bsnl: 'bsnlmms.in'
        },
        lastChecked: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('SMS status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting SMS status',
      error: error.message
    });
  }
});

module.exports = router;
