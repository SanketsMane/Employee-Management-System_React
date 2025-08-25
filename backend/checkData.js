const mongoose = require('mongoose');
require('dotenv').config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    const Attendance = require('./models/Attendance');
    
    const userCount = await User.countDocuments();
    const attendanceCount = await Attendance.countDocuments();
    
    console.log('Users in DB:', userCount);
    console.log('Attendance records in DB:', attendanceCount);
    
    // Get some sample users
    const users = await User.find({ isActive: true, isApproved: true })
      .limit(5)
      .select('firstName lastName email department role');
    
    console.log('Sample users:', users.map(u => ({
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      department: u.department,
      role: u.role
    })));
    
    // Get some sample attendance records
    const attendance = await Attendance.find()
      .populate('employee', 'firstName lastName email')
      .limit(5)
      .sort({ date: -1 });
      
    console.log('Sample attendance records:', attendance.map(a => ({
      employee: `${a.employee?.firstName} ${a.employee?.lastName}`,
      date: a.date?.toISOString()?.split('T')[0],
      clockIn: a.clockIn,
      status: a.status
    })));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

checkData();
