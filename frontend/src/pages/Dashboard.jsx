import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import RealTimeStatus from '../components/RealTimeStatus';
import api from '../lib/api';
import { 
  Clock, 
  Coffee, 
  CheckCircle, 
  Calendar, 
  Users, 
  TrendingUp,
  Award,
  FileText,
  Bell
} from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin, isHR, isManager } = useAuth();
  const { sendAttendanceUpdate, sendWorksheetUpdate } = useWebSocket();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    attendance: null,
    worksheetStats: null,
    leaveStats: null,
    loading: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [attendanceRes, worksheetRes, leaveRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/worksheets/stats?period=30'),
        api.get('/leaves/stats?period=30')
      ]);

      setDashboardData({
        attendance: attendanceRes.data.data,
        worksheetStats: worksheetRes.data.data,
        leaveStats: leaveRes.data.data,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleClockIn = async () => {
    try {
      const response = await api.post('/attendance/clockin');
      if (response.data.success) {
        alert('Clocked in successfully!');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Clock in error:', error);
      alert(`Clock in failed: ${error.response?.data?.message || 'Please try again'}`);
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await api.put('/attendance/clockout');
      if (response.data.success) {
        alert('Clocked out successfully!');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Clock out error:', error);
      alert(`Clock out failed: ${error.response?.data?.message || 'Please try again'}`);
    }
  };

  const handleStartBreak = async () => {
    try {
      const response = await api.post('/attendance/break/start', { reason: 'Break' });
      if (response.data.success) {
        alert('Break started!');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Start break error:', error);
      alert(`Start break failed: ${error.response?.data?.message || 'Please try again'}`);
    }
  };

  const handleEndBreak = async () => {
    try {
      const response = await api.put('/attendance/break/end');
      if (response.data.success) {
        alert('Break ended!');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('End break error:', error);
      alert(`End break failed: ${error.response?.data?.message || 'Please try again'}`);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (dashboardData.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {user?.firstName}! 👋
            </h1>
            <p className="text-blue-100 mt-1">
              {user?.role} • {user?.department}
            </p>
            <p className="text-blue-200 text-sm mt-2">
              Employee ID: {user?.employeeId}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Reward Points</p>
            <p className="text-3xl font-bold">{user?.rewardPoints || 0}</p>
            <Award className="h-6 w-6 text-yellow-300 inline" />
          </div>
        </div>
      </div>

      {/* Real-time Status Section */}
      <RealTimeStatus />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clock In/Out</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleClockIn}
                    disabled={!dashboardData.attendance?.canClockIn}
                    variant={dashboardData.attendance?.canClockIn ? "default" : "secondary"}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClockOut}
                    disabled={!dashboardData.attendance?.canClockOut}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Out
                  </Button>
                </div>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Break</p>
                <div className="mt-3">
                  {dashboardData.attendance?.onBreak ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleEndBreak}
                    >
                      <Coffee className="h-4 w-4 mr-1" />
                      End Break
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStartBreak}
                      disabled={!dashboardData.attendance?.canStartBreak}
                    >
                      <Coffee className="h-4 w-4 mr-1" />
                      Start Break
                    </Button>
                  )}
                </div>
              </div>
              <Coffee className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Tasks</p>
                <p className="text-2xl font-bold mt-2">
                  {dashboardData.worksheetStats?.totalTasksCompleted || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {dashboardData.worksheetStats?.totalTasksPlanned || 0} planned
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leave Requests</p>
                <p className="text-2xl font-bold mt-2">
                  {dashboardData.leaveStats?.pendingRequests || 0}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.attendance?.attendance ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Clock In:</span>
                  <span className="font-medium">
                    {dashboardData.attendance.attendance.clockIn 
                      ? formatTime(dashboardData.attendance.attendance.clockIn)
                      : 'Not clocked in'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Clock Out:</span>
                  <span className="font-medium">
                    {dashboardData.attendance.attendance.clockOut 
                      ? formatTime(dashboardData.attendance.attendance.clockOut)
                      : 'Not clocked out'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`font-medium ${
                    dashboardData.attendance.onBreak ? 'text-orange-600' :
                    dashboardData.attendance.attendance.status === 'Present' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {dashboardData.attendance.onBreak ? 'On Break' : dashboardData.attendance.attendance.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Hours:</span>
                  <span className="font-medium">
                    {dashboardData.attendance.attendance.totalWorkedHours?.toFixed(2) || 0} hrs
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No attendance record for today. Clock in to start tracking.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              30-Day Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Worksheets Submitted:</span>
                <span className="font-medium">
                  {dashboardData.worksheetStats?.submittedWorksheets || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Productivity Score:</span>
                <span className="font-medium">
                  {dashboardData.worksheetStats?.averageProductivity?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Leave Requests:</span>
                <span className="font-medium">
                  {dashboardData.leaveStats?.totalRequests || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tasks Completed:</span>
                <span className="font-medium">
                  {dashboardData.worksheetStats?.completedTasks || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used features and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto flex-col p-4"
              onClick={() => navigate('/worksheets')}
            >
              <FileText className="h-8 w-8 mb-2" />
              <span>Worksheet</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col p-4"
              onClick={() => navigate('/leaves')}
            >
              <Calendar className="h-8 w-8 mb-2" />
              <span>Leave Request</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col p-4"
              onClick={() => navigate('/profile')}
            >
              <Users className="h-8 w-8 mb-2" />
              <span>Profile</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col p-4"
              onClick={() => {
                // This could open a notifications modal or navigate to notifications page
                document.querySelector('[data-notification-dropdown]')?.click();
              }}
            >
              <Bell className="h-8 w-8 mb-2" />
              <span>Notifications</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-4">
        Developed by Sanket Mane | contactsanket1@gmail.com
      </div>
    </div>
  );
};

export default Dashboard;
