import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, Coffee, Calendar, MapPin, TrendingUp, ChevronLeft, ChevronRight, Pause } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const AttendancePageNew = () => {
  const { user, token } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [breaks, setBreaks] = useState([]);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({});
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loadingProgress, setLoadingProgress] = useState('Initializing...');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'calendar'
  // Add new state for attendance capabilities
  const [canClockIn, setCanClockIn] = useState(true);
  const [canClockOut, setCanClockOut] = useState(false);
  const [canStartBreak, setCanStartBreak] = useState(false);
  const [canEndBreak, setCanEndBreak] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  // Admin view state
  const [isAdminView, setIsAdminView] = useState(false);
  const [allEmployeesAttendance, setAllEmployeesAttendance] = useState([]);
  const [employeeFilters, setEmployeeFilters] = useState({
    department: '',
    status: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Check if user is admin/HR/Manager
  const canViewAllEmployees = ['Admin', 'HR', 'Manager', 'Team Lead'].includes(user?.role);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch all employees attendance (Admin/HR/Manager only)
  const fetchAllEmployeesAttendance = async () => {
    try {
      const { date, department, status } = employeeFilters;
      const params = new URLSearchParams({
        startDate: date,
        endDate: date,
        limit: '100'
      });
      
      if (department) params.append('department', department);
      if (status) params.append('status', status);

      const response = await api.get(`/attendance/all?${params}`);
      
      if (response.data.success) {
        setAllEmployeesAttendance(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching all employees attendance:', error);
      toast.error('Failed to load employees attendance');
    }
  };

  // Fetch today's attendance data
  const fetchTodayAttendance = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await api.get('/attendance/today', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data.success) {
        const data = response.data.data;
        
        setAttendance(data.attendance);
        setBreaks(data.attendance?.breaks || []);
        setIsOnBreak(data.onBreak || false);
        
        // Set capability flags
        setCanClockIn(data.canClockIn || false);
        setCanClockOut(data.canClockOut || false);
        setCanStartBreak(data.canStartBreak || false);
        setCanEndBreak(data.canEndBreak || false);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏱️ Request timed out');
        toast.error('Request timed out. Please refresh the page.');
      } else {
        console.error('❌ Error fetching attendance:', error);
        toast.error('Failed to load attendance data');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  // Fetch monthly attendance stats
  const fetchMonthlyStats = async () => {
    try {
      console.log('🔍 Fetching monthly attendance stats...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await api.get('/attendance/stats', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📊 Monthly stats response:', response.data);
      
      if (response.data.success) {
        setMonthlyStats(response.data.data);
        console.log('✅ Monthly stats updated:', response.data.data);
      } else {
        console.error('❌ Monthly stats API error:', response.data.message);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏱️ Monthly stats request timed out');
      } else {
        console.error('❌ Error fetching monthly stats:', error);
        console.error('Error details:', error.response?.data);
      }
    }
  };

  // Fetch attendance history for calendar view
  const fetchAttendanceHistory = async (month, year) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await api.get(`/attendance/history?month=${month}&year=${year}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data.success) {
        console.log('Attendance history data:', response.data.data);
        setAttendanceHistory(response.data.data);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏱️ History request timed out');
      } else {
        console.error('Error fetching attendance history:', error);
      }
    }
  };

  useEffect(() => {
    if (user && token) {
      // Prevent multiple rapid calls - cache for 30 seconds
      const now = Date.now();
      if (now - lastFetchTime < 30000 && hasLoadedOnce) {
        console.log('⚡ Using cached data (last fetch was', Math.round((now - lastFetchTime) / 1000), 'seconds ago)');
        return;
      }
      
      setInitialLoading(true);
      
      // Fetch data sequentially to reduce server load
      const loadData = async () => {
        try {
          setLoadingProgress('Loading attendance data...');
          await fetchTodayAttendance();
          
          setLoadingProgress('Loading monthly statistics...');
          await fetchMonthlyStats();
          
          if (viewMode === 'calendar') {
            setLoadingProgress('Loading calendar data...');
            await fetchAttendanceHistory(selectedMonth.getMonth() + 1, selectedMonth.getFullYear());
          }
          
          if (isAdminView && canViewAllEmployees) {
            setLoadingProgress('Loading all employees attendance...');
            await fetchAllEmployeesAttendance();
          }
          
          setLoadingProgress('Complete!');
          setLastFetchTime(Date.now());
        } catch (error) {
          console.error('Error loading attendance data:', error);
          toast.error('Failed to load attendance data');
          setLoadingProgress('Error loading data');
        } finally {
          setInitialLoading(false);
          setHasLoadedOnce(true);
        }
      };
      
      loadData();
    }
  }, [user, token, viewMode, selectedMonth, isAdminView, employeeFilters]);

  // Update effect for admin view filter changes
  useEffect(() => {
    if (isAdminView && canViewAllEmployees) {
      fetchAllEmployeesAttendance();
    }
  }, [employeeFilters]);

  // Auto-refresh attendance data every 30 seconds
  useEffect(() => {
    if (viewMode === 'current') {
      const interval = setInterval(fetchTodayAttendance, 30000);
      return () => clearInterval(interval);
    }
  }, [viewMode]);

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
        toast.success('Clocked in successfully!');
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already clocked in')) {
        toast.error('You have already clocked in today');
        // Refresh attendance data to show current status
        await fetchTodayAttendance();
      } else {
        toast.error('Error clocking in. Please try again.');
      }
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
        toast.success('Clocked out successfully!');
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      toast.error('Error clocking out. Please try again.');
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
        toast.success('Break started!');
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Error starting break:', error);
      toast.error('Error starting break. Please try again.');
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
        toast.success('Break ended!');
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Error ending break:', error);
      toast.error('Error ending break. Please try again.');
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
    if (!attendance?.clockIn) {
      return '0h 0m';
    }
    
    const clockIn = new Date(attendance.clockIn);
    const clockOut = attendance.clockOut ? new Date(attendance.clockOut) : new Date();
    
    // Subtract break time
    const breakTime = breaks.reduce((total, breakItem) => {
      if (breakItem.startTime && breakItem.endTime) {
        const breakDuration = new Date(breakItem.endTime) - new Date(breakItem.startTime);
        return total + breakDuration;
      }
      return total;
    }, 0);

    const totalWorkTime = (clockOut - clockIn) - breakTime;
    
    const hours = Math.floor(totalWorkTime / (1000 * 60 * 60));
    const minutes = Math.floor((totalWorkTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  const getAttendanceForDate = (day) => {
    const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = attendanceHistory.find(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === dateStr;
    });
    
    // Debug log for all days to see what's happening
    console.log(`Day ${day} (${dateStr}):`, record ? record.status : 'No data');
    
    return record;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedMonth);
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Day headers
    days.push(
      <div key="headers" className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
      </div>
    );

    // Calendar days
    const calendarDays = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const attendanceRecord = getAttendanceForDate(day);
      const isToday = new Date().toDateString() === new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day).toDateString();
      
      let statusClass = 'bg-gray-100 hover:bg-gray-200';
      let statusIndicator = '';
      
      if (attendanceRecord) {
        if (attendanceRecord.status === 'Present') {
          statusClass = 'bg-green-100 hover:bg-green-200 border-green-300';
          statusIndicator = '🟢';
        } else if (attendanceRecord.status === 'Absent') {
          statusClass = 'bg-red-100 hover:bg-red-200 border-red-300';
          statusIndicator = '🔴';
        } else if (attendanceRecord.status === 'Late') {
          statusClass = 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
          statusIndicator = '🟡';
        }
      }

      if (isToday) {
        statusClass += ' ring-2 ring-blue-500';
      }

      calendarDays.push(
        <div
          key={day}
          className={`p-2 text-center cursor-pointer border rounded-lg transition-colors ${statusClass}`}
          title={attendanceRecord ? `${attendanceRecord.status} - ${attendanceRecord.clockInTime ? new Date(attendanceRecord.clockInTime).toLocaleTimeString() : 'No clock in'}` : 'No data'}
        >
          <div className="text-sm font-medium">{day}</div>
          {statusIndicator && <div className="text-xs mt-1">{statusIndicator}</div>}
          {attendanceRecord?.clockInTime && (
            <div className="text-xs text-gray-600 mt-1">
              {new Date(attendanceRecord.clockInTime).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </div>
          )}
        </div>
      );
    }

    days.push(
      <div key="calendar" className="grid grid-cols-7 gap-1">
        {calendarDays}
      </div>
    );

    return days;
  };

  if (!user || (initialLoading && !hasLoadedOnce)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!user ? 'Loading user...' : loadingProgress}
          </p>
          <p className="mt-2 text-sm text-gray-500">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            Attendance
            {initialLoading && hasLoadedOnce && (
              <div className="ml-3 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.firstName} {user?.lastName}
            {initialLoading && hasLoadedOnce && (
              <span className="ml-2 text-sm text-blue-600">• {loadingProgress}</span>
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          {canViewAllEmployees && (
            <>
              <Button
                onClick={() => setIsAdminView(false)}
                variant={!isAdminView ? 'default' : 'outline'}
                className="flex items-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>My Attendance</span>
              </Button>
              <Button
                onClick={() => setIsAdminView(true)}
                variant={isAdminView ? 'default' : 'outline'}
                className="flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>All Employees</span>
              </Button>
            </>
          )}
          {!isAdminView && (
            <>
              <Button
                onClick={() => setViewMode('current')}
                variant={viewMode === 'current' ? 'default' : 'outline'}
                className="flex items-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>Current</span>
              </Button>
              <Button
                onClick={() => setViewMode('calendar')}
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                className="flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </Button>
            </>
          )}
          <Button
            onClick={async () => {
              setInitialLoading(true);
              try {
                await fetchTodayAttendance();
                await fetchMonthlyStats();
                if (viewMode === 'calendar') {
                  await fetchAttendanceHistory(selectedMonth.getMonth() + 1, selectedMonth.getFullYear());
                }
                if (isAdminView && canViewAllEmployees) {
                  await fetchAllEmployeesAttendance();
                }
                toast.success('Data refreshed successfully');
              } catch (error) {
                toast.error('Failed to refresh data');
              }
            }}
            variant="outline"
            className="flex items-center space-x-2"
            disabled={initialLoading}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{initialLoading ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {isAdminView && canViewAllEmployees ? (
        /* Admin View - All Employees Attendance */
        <div className="space-y-6">
          {/* Filters */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Records - {new Date(employeeFilters.date).toLocaleDateString()}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={employeeFilters.date}
                  onChange={(e) => setEmployeeFilters(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={employeeFilters.department}
                  onChange={(e) => setEmployeeFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={employeeFilters.status}
                  onChange={(e) => setEmployeeFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={fetchAllEmployeesAttendance}
                  className="w-full"
                  disabled={initialLoading}
                >
                  {initialLoading ? 'Loading...' : 'Apply Filters'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Employee Attendance Table */}
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allEmployeesAttendance.length > 0 ? (
                    allEmployeesAttendance.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {record.employeeData?.firstName?.charAt(0)}{record.employeeData?.lastName?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {record.employeeData?.firstName} {record.employeeData?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.employeeData?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.employeeData?.department || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : 'Not clocked in'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.workHours ? `${record.workHours}h` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'Present' ? 'bg-green-100 text-green-800' :
                            record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                            {record.location?.type || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        {initialLoading ? 'Loading attendance records...' : 'No attendance records found for the selected date and filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : viewMode === 'current' ? (
        <>
          {/* Current Time and Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Time */}
            <Card className="p-6 text-center">
              <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Time</h3>
              <p className="text-3xl font-bold text-blue-600">
                {currentTime.toLocaleTimeString()}
              </p>
              <p className="text-gray-600 mt-2">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </Card>

            {/* Work Time Today */}
            <Card className="p-6 text-center">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Work Time Today</h3>
              <p className="text-3xl font-bold text-green-600">
                {calculateWorkTime()}
              </p>
              {attendance?.clockIn && (
                <p className="text-gray-600 mt-2">
                  Started at {new Date(attendance.clockIn).toLocaleTimeString()}
                </p>
              )}
            </Card>

            {/* Status */}
            <Card className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                {attendance?.clockIn && !attendance?.clockOut ? (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isOnBreak ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    {isOnBreak ? (
                      <Coffee className="w-6 h-6 text-orange-600" />
                    ) : (
                      <Play className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                ) : attendance?.clockOut ? (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Square className="w-6 h-6 text-blue-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Square className="w-6 h-6 text-gray-600" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Status</h3>
              <p className={`text-xl font-bold ${
                attendance?.clockIn && !attendance?.clockOut 
                  ? (isOnBreak ? 'text-orange-600' : 'text-green-600')
                  : attendance?.clockOut 
                  ? 'text-blue-600' 
                  : 'text-gray-600'
              }`}>
                {attendance?.clockIn && !attendance?.clockOut 
                  ? (isOnBreak ? 'On Break' : 'Working') 
                  : attendance?.clockOut
                  ? 'Day Completed'
                  : 'Not Started'
                }
              </p>
            </Card>
          </div>

          {/* Action Buttons */}
          <Card className="p-6">
            <div className="flex flex-wrap gap-4 justify-center">
              {canClockIn ? (
                <Button
                  onClick={handleClockIn}
                  disabled={loading || !canClockIn}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {loading ? 'Clocking In...' : 'Clock In'}
                </Button>
              ) : canClockOut ? (
                <>
                  <Button
                    onClick={handleClockOut}
                    disabled={loading || !canClockOut}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg disabled:opacity-50"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    {loading ? 'Clocking Out...' : 'Clock Out'}
                  </Button>
                  
                  {canStartBreak ? (
                    <Button
                      onClick={() => handleStartBreak('Break')}
                      disabled={loading || !canStartBreak}
                      variant="outline"
                      className="px-6 py-3 disabled:opacity-50"
                    >
                      <Coffee className="w-5 h-5 mr-2" />
                      Start Break
                    </Button>
                  ) : canEndBreak ? (
                    <Button
                      onClick={handleEndBreak}
                      disabled={loading || !canEndBreak}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 disabled:opacity-50"
                    >
                      <Pause className="w-5 h-5 mr-2" />
                      End Break
                    </Button>
                  ) : null}
                </>
              ) : (
                <div className="text-center text-gray-600">
                  <p>You've completed your work for today!</p>
                  <p className="mt-2">Clocked out at {attendance?.clockOut ? new Date(attendance.clockOut).toLocaleTimeString() : ''}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Today's Breaks */}
          {breaks.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Coffee className="w-5 h-5 mr-2" />
                Today's Breaks
              </h3>
              <div className="space-y-2">
                {breaks.map((breakItem, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">{breakItem.type || 'Break'}</span>
                    <span className="text-gray-600">
                      {new Date(breakItem.startTime).toLocaleTimeString()} - {
                        breakItem.endTime 
                          ? new Date(breakItem.endTime).toLocaleTimeString()
                          : 'Ongoing'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Monthly Stats */}
          {Object.keys(monthlyStats).length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">This Month's Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{monthlyStats.presentDays || 0}</p>
                  <p className="text-gray-600">Present Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{monthlyStats.absentDays || 0}</p>
                  <p className="text-gray-600">Absent Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{monthlyStats.lateDays || 0}</p>
                  <p className="text-gray-600">Late Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{monthlyStats.totalHours || 0}h</p>
                  <p className="text-gray-600">Total Hours</p>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        /* Calendar View */
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Attendance Calendar - {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex space-x-2">
              <Button
                onClick={() => navigateMonth(-1)}
                variant="outline"
                className="p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigateMonth(1)}
                variant="outline"
                className="p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center space-x-6 mb-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Present 🟢</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Late 🟡</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Absent 🔴</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span>No Data</span>
            </div>
          </div>

          {/* Calendar */}
          <div className="max-w-4xl mx-auto">
            {renderCalendar()}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AttendancePageNew;
