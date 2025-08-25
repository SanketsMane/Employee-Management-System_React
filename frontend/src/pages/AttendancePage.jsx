import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Square, Coffee, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const AttendancePage = () => {
  const { user, token } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [breaks, setBreaks] = useState([]);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({});

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance data
  const fetchTodayAttendance = async () => {
    try {
      const response = await api.get('/attendance/today');
      if (response.data.success) {
        setAttendance(response.data.data.attendance);
        setBreaks(response.data.data.attendance?.breaks || []);
        
        // Check if currently on break
        const lastBreak = response.data.data.attendance?.breaks?.slice(-1)[0];
        setIsOnBreak(lastBreak && !lastBreak.endTime);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Fetch monthly attendance stats
  const fetchMonthlyStats = async () => {
    try {
      const response = await api.get('/attendance/stats');
      if (response.data.success) {
        setMonthlyStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTodayAttendance();
      fetchMonthlyStats();
    }
  }, [token]);

  // Clock In
  const handleClockIn = async () => {
    setLoading(true);
    try {
      const position = await getCurrentPosition();
      const response = await api.post('/attendance/clockin', {
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      });

      if (response.data.success) {
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Error clocking in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clock Out
  const handleClockOut = async () => {
    setLoading(true);
    try {
      const position = await getCurrentPosition();
      const response = await api.put('/attendance/clockout', {
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      });

      if (response.data.success) {
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Error clocking out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Start Break
  const handleStartBreak = async (breakType = 'Break') => {
    setLoading(true);
    try {
      const response = await api.post('/attendance/break/start', {
        type: breakType
      });

      if (response.data.success) {
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Error starting break:', error);
      alert('Error starting break. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // End Break
  const handleEndBreak = async () => {
    setLoading(true);
    try {
      const response = await api.put('/attendance/break/end');

      if (response.data.success) {
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Error ending break:', error);
      alert('Error ending break. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get current position
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }
    });
  };

  // Calculate total work time today
  const calculateWorkTime = () => {
    if (!attendance?.clockInTime) return '0h 0m';
    
    const clockIn = new Date(attendance.clockInTime);
    const clockOut = attendance.clockOutTime ? new Date(attendance.clockOutTime) : new Date();
    
    // Subtract break time
    const breakTime = breaks.reduce((total, breakItem) => {
      if (breakItem.startTime && breakItem.endTime) {
        return total + (new Date(breakItem.endTime) - new Date(breakItem.startTime));
      }
      return total;
    }, 0);
    
    const workTime = clockOut - clockIn - breakTime;
    const hours = Math.floor(workTime / (1000 * 60 * 60));
    const minutes = Math.floor((workTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isWorking = attendance?.clockInTime && !attendance?.clockOutTime;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your work hours and breaks</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Clock In/Out Card */}
        <div className="lg:col-span-2">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <Clock className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Time Tracker
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Current work session: {calculateWorkTime()}
              </p>
            </div>

            {/* Clock In/Out Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              {!isWorking ? (
                <Button
                  onClick={handleClockIn}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Clock In
                </Button>
              ) : (
                <Button
                  onClick={handleClockOut}
                  disabled={loading}
                  variant="destructive"
                  className="px-8 py-4 text-lg"
                  size="lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Clock Out
                </Button>
              )}

              {/* Break Controls */}
              {isWorking && (
                <div className="flex gap-2">
                  {!isOnBreak ? (
                    <>
                      <Button
                        onClick={() => handleStartBreak('Break')}
                        disabled={loading}
                        variant="outline"
                        className="px-6 py-4"
                      >
                        <Coffee className="w-5 h-5 mr-2" />
                        Break
                      </Button>
                      <Button
                        onClick={() => handleStartBreak('Lunch')}
                        disabled={loading}
                        variant="outline"
                        className="px-6 py-4"
                      >
                        <Coffee className="w-5 h-5 mr-2" />
                        Lunch
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleEndBreak}
                      disabled={loading}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-4"
                    >
                      <Pause className="w-5 h-5 mr-2" />
                      End Break
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="text-center">
              {isOnBreak && (
                <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-lg inline-block">
                  Currently on break
                </div>
              )}
              {isWorking && !isOnBreak && (
                <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg inline-block">
                  Currently working
                </div>
              )}
              {!isWorking && (
                <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg inline-block">
                  Not clocked in
                </div>
              )}
            </div>
          </Card>

          {/* Today's Timeline */}
          {attendance && (
            <Card className="mt-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Today's Timeline
              </h3>
              <div className="space-y-3">
                {/* Clock In */}
                {attendance.clockInTime && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Clocked In
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        {formatTime(attendance.clockInTime)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Breaks */}
                {breaks.map((breakItem, index) => (
                  <div key={index} className="ml-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {breakItem.type} Started
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          {formatTime(breakItem.startTime)}
                        </span>
                      </div>
                    </div>
                    {breakItem.endTime && (
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {breakItem.type} Ended
                          </span>
                          <span className="text-gray-600 dark:text-gray-400 ml-2">
                            {formatTime(breakItem.endTime)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Clock Out */}
                {attendance.clockOutTime && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Clocked Out
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        {formatTime(attendance.clockOutTime)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Monthly Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Monthly Stats
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Present Days</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {monthlyStats.presentDays || 0}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                    / {monthlyStats.totalDays || 0}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {monthlyStats.attendanceRate || 0}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(monthlyStats.totalHours || 0)}h
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Hours/Day</div>
                <div className="text-2xl font-bold text-purple-600">
                  {monthlyStats.averageHours?.toFixed(1) || 0}h
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('/attendance/history', '_blank')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                View History
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('/reports/attendance', '_blank')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </div>
          </Card>

          {/* Location Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Location
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your location is tracked for attendance verification. Make sure location services are enabled.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
