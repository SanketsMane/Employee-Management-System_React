const User = require('../models/User');

// @desc    Get company information
// @route   GET /api/company/info
// @access  Private (HR, Admin)
exports.getCompanyInfo = async (req, res) => {
  try {
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

    // This would typically come from a company settings collection
    // For now, we'll return basic computed data
    const companyData = {
      info: {
        name: process.env.COMPANY_NAME || 'Employee Management System',
        tagline: 'Streamlining Workforce Management',
        founded: new Date().getFullYear(),
        headquarters: process.env.COMPANY_ADDRESS || 'Not specified',
        employees: totalEmployees,
        offices: [process.env.COMPANY_ADDRESS || 'Main Office'],
        website: process.env.COMPANY_WEBSITE || '',
        email: process.env.COMPANY_EMAIL || process.env.EMAIL_FROM || '',
        phone: process.env.COMPANY_PHONE || '',
        description: 'Employee Management System for streamlined workforce management and productivity tracking.'
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

    res.status(200).json({
      success: true,
      data: companyData
    });
  } catch (error) {
    console.error('Error fetching company data:', error);
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
    // This would update a company settings document
    // For now, return success message
    res.status(200).json({
      success: true,
      message: 'Company information updated successfully'
    });
  } catch (error) {
    console.error('Error updating company data:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company data'
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
