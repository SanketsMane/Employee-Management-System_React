// Debug script to test frontend API calls directly
// Run this in browser console to test

console.log('🔍 Testing API calls...');

// Check if token exists
const token = localStorage.getItem('token');
console.log('🔑 Token exists:', !!token);
console.log('🔑 Token preview:', token ? token.substring(0, 50) + '...' : 'No token');

// Test API call
if (token) {
  fetch('http://localhost:8000/api/attendance/today', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('📊 Today attendance response:', data);
    if (data.success && data.data.attendance) {
      console.log('📋 Attendance record found:', data.data.attendance);
      console.log('⏰ Clock in time:', data.data.attendance.clockIn);
      console.log('⏰ Clock out time:', data.data.attendance.clockOut);
      console.log('🔧 Capabilities:', {
        canClockIn: data.data.canClockIn,
        canClockOut: data.data.canClockOut,
        canStartBreak: data.data.canStartBreak,
        canEndBreak: data.data.canEndBreak
      });
    } else {
      console.log('❌ No attendance data found');
    }
  })
  .catch(error => {
    console.error('❌ API call failed:', error);
  });
} else {
  console.log('❌ No token found - user not logged in');
}
