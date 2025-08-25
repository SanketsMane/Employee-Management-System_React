const mongoose = require('mongoose');
require('dotenv').config();

const createSampleAttendance = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    const Attendance = require('./models/Attendance');
    
    // Get active users
    const users = await User.find({ isActive: true, isApproved: true });
    console.log(`Found ${users.length} active users`);
    
    // Create today's attendance records
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendanceRecords = [];
    
    for (let i = 0; i < users.length && i < 5; i++) {
      const user = users[i];
      
      // Check if attendance already exists for today
      const existingAttendance = await Attendance.findOne({
        employee: user._id,
        date: { 
          $gte: today, 
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        }
      });
      
      if (!existingAttendance) {
        const clockInTime = new Date();
        clockInTime.setHours(9, Math.floor(Math.random() * 60), 0, 0); // Random time between 9:00-9:59 AM
        
        const clockOutTime = new Date();
        clockOutTime.setHours(17, Math.floor(Math.random() * 60), 0, 0); // Random time between 5:00-5:59 PM
        
        const totalWorkTime = (clockOutTime - clockInTime) / (1000 * 60); // in minutes
        
        const attendance = new Attendance({
          employee: user._id,
          date: today,
          clockIn: clockInTime,
          clockOut: clockOutTime,
          totalWorkTime: totalWorkTime,
          status: clockInTime.getHours() > 9 ? 'Late' : 'Present',
          location: {
            type: 'Office',
            address: 'Main Office'
          }
        });
        
        await attendance.save();
        attendanceRecords.push({
          employee: `${user.firstName} ${user.lastName}`,
          clockIn: clockInTime.toLocaleTimeString(),
          clockOut: clockOutTime.toLocaleTimeString(),
          status: attendance.status
        });
      }
    }
    
    console.log('Created attendance records:', attendanceRecords);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

createSampleAttendance();
