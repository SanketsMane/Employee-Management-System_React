const mongoose = require('mongoose');
require('dotenv').config();

const createTodaysAttendance = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    const Attendance = require('./models/Attendance');
    
    // Get active users
    const users = await User.find({ isActive: true, isApproved: true });
    console.log(`Found ${users.length} active users`);
    
    // Create today's attendance records (force today's date)
    const today = new Date();
    console.log('Today is:', today.toDateString());
    
    const attendanceRecords = [];
    
    for (const user of users) {
      // Delete existing attendance for today if it exists
      await Attendance.deleteMany({
        employee: user._id,
        date: {
          $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        }
      });
      
      const clockInTime = new Date();
      clockInTime.setHours(8 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0); // Random time between 8:00-10:59 AM
      
      const clockOutTime = new Date();
      clockOutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0); // Random time between 5:00-6:59 PM
      
      const totalWorkTime = Math.max(0, (clockOutTime - clockInTime) / (1000 * 60)); // in minutes
      
      const isLate = clockInTime.getHours() >= 9;
      const lateBy = isLate ? Math.max(0, (clockInTime.getHours() - 9) * 60 + clockInTime.getMinutes()) : 0;
      
      const attendance = new Attendance({
        employee: user._id,
        date: today,
        clockIn: clockInTime,
        clockOut: Math.random() > 0.3 ? clockOutTime : null, // 70% chance of having clocked out
        totalWorkTime: Math.random() > 0.3 ? totalWorkTime : Math.floor(totalWorkTime * 0.7),
        status: isLate ? 'Late' : 'Present',
        isLate: isLate,
        lateBy: lateBy,
        location: {
          type: Math.random() > 0.5 ? 'Office' : 'Remote',
          address: Math.random() > 0.5 ? 'Main Office' : 'Home'
        },
        notes: `Sample attendance record for ${user.firstName}`
      });
      
      await attendance.save();
      console.log(`Created attendance for ${user.firstName} ${user.lastName} - Status: ${attendance.status}`);
      
      attendanceRecords.push({
        employee: `${user.firstName} ${user.lastName}`,
        clockIn: clockInTime.toLocaleTimeString(),
        clockOut: attendance.clockOut ? attendance.clockOut.toLocaleTimeString() : 'Not clocked out',
        status: attendance.status
      });
    }
    
    console.log('\nCreated attendance records for today:', attendanceRecords);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

createTodaysAttendance();
