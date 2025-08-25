const mongoose = require('mongoose');
require('dotenv').config();

const Attendance = require('./models/Attendance');

const clearTodayAttendance = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await Attendance.deleteMany({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    console.log(`Deleted ${result.deletedCount} attendance records for today`);
    process.exit(0);
  } catch (error) {
    console.error('Error clearing attendance:', error);
    process.exit(1);
  }
};

clearTodayAttendance();
