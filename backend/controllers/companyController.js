const User = require('../models/User');
const Company = require('../models/Company');
const CompanySettings = require('../models/CompanySettings');

// @desc    Get company information
// @route   GET /api/company/info
// @access  Private (HR, Admin)
exports.getCompanyInfo = async (req, res) => {
  try {
    console.log('🏢 Getting company info...');
    
    // Get company info from database (or create default if none exists)
    let company = await Company.findOne({ isActive: true });
    
    if (!company) {
      console.log('📝 No company found, creating default...');
      company = new Company({
        name: process.env.COMPANY_NAME || 'Employee Management System',
        tagline: 'Streamlining Workforce Management',
        description: 'Employee Management System for streamlined workforce management and productivity tracking.',
        website: process.env.COMPANY_WEBSITE || '',
        email: process.env.COMPANY_EMAIL || process.env.EMAIL_FROM || '',
        phone: process.env.COMPANY_PHONE || '',
        headquarters: process.env.COMPANY_ADDRESS || 'Not specified',
        founded: new Date().getFullYear()
      });
      await company.save();
      console.log('✅ Default company created');
    }
    
    // Get real statistics from database
    const totalEmployees = await User.countDocuments({ isActive: true });
    const departments = await User.distinct('department', { isActive: true });
    const departmentCount = departments.length;

    // Get department breakdown
    const departmentData = [];
    for (const dept of departments) {
      const count = await User.countDocuments({ 
        department: dept, 
        isActive: true 
      });
      
      departmentData.push({
        name: dept || 'Unspecified',
        count: count,
        head: 'Not assigned', // This would come from a separate manager/head assignment
        color: getRandomColor()
      });
    }

    const companyData = {
      info: {
        name: company.name,
        tagline: company.tagline,
        founded: company.founded,
        headquarters: company.headquarters,
        employees: totalEmployees,
        offices: [company.headquarters],
        website: company.website,
        email: company.email,
        phone: company.phone,
        description: company.description
      },
      stats: {
        totalEmployees,
        departments: departmentCount,
        projects: 0, // Would need a projects model
        clients: 0, // Would need a clients model
        revenue: '$0', // Would need financial data
        growth: '0%' // Would need historical data
      },
      announcements: [], // Would come from announcements model
      milestones: [], // Would come from milestones model
      departments: departmentData
    };

    console.log('✅ Company info retrieved successfully');
    res.status(200).json({
      success: true,
      data: companyData
    });
  } catch (error) {
    console.error('❌ Error fetching company data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company data'
    });
  }
};

// @desc    Update company information
// @route   PUT /api/company/info
// @access  Private (Admin only)
exports.updateCompanyInfo = async (req, res) => {
  try {
    console.log('🔄 Updating company info...');
    console.log('📝 Request body:', req.body);
    console.log('👤 User:', req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})` : 'No user');
    
    const { name, tagline, description, website, email, phone, headquarters, founded } = req.body;
    
    // Find existing company or create new one
    let company = await Company.findOne({ isActive: true });
    
    if (!company) {
      console.log('📝 Creating new company record...');
      company = new Company();
    }
    
    // Update company fields if provided
    if (name) company.name = name;
    if (tagline) company.tagline = tagline;
    if (description) company.description = description;
    if (website) company.website = website;
    if (email) company.email = email;
    if (phone) company.phone = phone;
    if (headquarters) company.headquarters = headquarters;
    if (founded) company.founded = founded;
    
    await company.save();
    
    console.log('✅ Company info updated successfully');
    res.status(200).json({
      success: true,
      message: 'Company information updated successfully',
      data: company
    });
  } catch (error) {
    console.error('❌ Error updating company data:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company data',
      error: error.message
    });
  }
};

// Helper function to generate colors for departments
function getRandomColor() {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-gray-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// @desc    Get company settings
// @route   GET /api/company/settings
// @access  Private (Admin only)
exports.getCompanySettings = async (req, res) => {
  try {
    const { companyName } = req.query;
    
    let query = { isActive: true };
    if (companyName) {
      query.companyName = companyName;
    }
    
    // If user is not admin, get their company settings only
    if (req.user.role !== 'Admin') {
      query.companyName = req.user.company || 'Default Company';
    }
    
    const settings = await CompanySettings.findOne(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Company settings not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get company settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company settings',
      error: error.message
    });
  }
};

// @desc    Create or update company settings
// @route   POST /api/company/settings
// @access  Private (Admin only)
exports.createOrUpdateCompanySettings = async (req, res) => {
  try {
    console.log('🔍 Company settings request received');
    console.log('User:', req.user ? `${req.user.firstName} ${req.user.lastName}` : 'No user');
    console.log('User role:', req.user?.role);
    console.log('Request body:', req.body);
    
    // Only admins can create/update company settings
    if (req.user.role !== 'Admin') {
      console.log('❌ Access denied - User role is:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { companyName, attendanceRules, leaveRules, notifications, timezone } = req.body;
    
    // Validate required fields
    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }
    
    // Validate time formats
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (attendanceRules?.workStartTime && !timeRegex.test(attendanceRules.workStartTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid work start time format. Use HH:MM (24-hour format)'
      });
    }
    
    if (attendanceRules?.workEndTime && !timeRegex.test(attendanceRules.workEndTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid work end time format. Use HH:MM (24-hour format)'
      });
    }
    
    // Check if settings already exist for this company
    let settings = await CompanySettings.findOne({ companyName });
    
    if (settings) {
      // Update existing settings
      if (attendanceRules) {
        settings.attendanceRules = { ...settings.attendanceRules, ...attendanceRules };
      }
      if (leaveRules) {
        settings.leaveRules = { ...settings.leaveRules, ...leaveRules };
      }
      if (notifications) {
        settings.notifications = { ...settings.notifications, ...notifications };
      }
      if (timezone) {
        settings.timezone = timezone;
      }
      
      settings.updatedBy = req.user._id;
      await settings.save();
      
      await settings.populate('createdBy', 'firstName lastName email');
      await settings.populate('updatedBy', 'firstName lastName email');
      
      res.status(200).json({
        success: true,
        message: 'Company settings updated successfully',
        data: settings
      });
    } else {
      // Create new settings
      settings = new CompanySettings({
        companyName,
        attendanceRules,
        leaveRules,
        notifications,
        timezone,
        createdBy: req.user._id
      });
      
      await settings.save();
      
      await settings.populate('createdBy', 'firstName lastName email');
      
      res.status(201).json({
        success: true,
        message: 'Company settings created successfully',
        data: settings
      });
    }
  } catch (error) {
    console.error('Create/update company settings error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Company settings already exist for this company'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating/updating company settings',
      error: error.message
    });
  }
};

// @desc    Test attendance rules
// @route   POST /api/company/settings/test-rules
// @access  Private (Admin only)
exports.testAttendanceRules = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { companyName, clockInTime, clockOutTime } = req.body;
    
    if (!companyName || !clockInTime) {
      return res.status(400).json({
        success: false,
        message: 'Company name and clock-in time are required'
      });
    }
    
    const settings = await CompanySettings.findOne({ companyName, isActive: true });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Company settings not found'
      });
    }
    
    const result = settings.calculateAttendanceStatus(clockInTime, clockOutTime);
    
    res.status(200).json({
      success: true,
      data: {
        input: { clockInTime, clockOutTime },
        result,
        rules: settings.attendanceRules
      }
    });
  } catch (error) {
    console.error('Test attendance rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing attendance rules',
      error: error.message
    });
  }
};
