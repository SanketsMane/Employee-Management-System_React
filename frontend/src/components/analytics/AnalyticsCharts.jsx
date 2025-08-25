import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  Award,
  Activity,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import api from '../../lib/api';

const AnalyticsCharts = () => {
  const [data, setData] = useState({
    attendance: [],
    departmentStats: [],
    monthlyTrends: [],
    leaderboard: [],
    loading: true
  });
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d
  const [selectedChart, setSelectedChart] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setData(prev => ({ ...prev, loading: true }));
    
    try {
      // Fetch different analytics data
      const [attendanceRes, leaderboardRes, companyRes] = await Promise.all([
        api.get(`/analytics/attendance-trends?range=${timeRange}`),
        api.get('/analytics/leaderboard'),
        api.get('/company/info')
      ]);

      // Generate sample data for demonstration
      const monthlyTrends = generateMonthlyTrends();
      const departmentStats = generateDepartmentStats(companyRes.data?.data || {});
      const attendanceTrends = generateAttendanceTrends();

      setData({
        attendance: attendanceTrends,
        departmentStats,
        monthlyTrends,
        leaderboard: leaderboardRes.data?.data?.overall || [],
        loading: false
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
      
      // Generate demo data if API fails
      setData({
        attendance: generateAttendanceTrends(),
        departmentStats: generateDepartmentStats(),
        monthlyTrends: generateMonthlyTrends(),
        leaderboard: [],
        loading: false
      });
    }
  };

  const generateMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      attendance: Math.floor(Math.random() * 100) + 80,
      productivity: Math.floor(Math.random() * 100) + 70,
      satisfaction: Math.floor(Math.random() * 100) + 75,
    }));
  };

  const generateDepartmentStats = (companyData = {}) => {
    const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Support'];
    return departments.map(dept => ({
      department: dept,
      employees: Math.floor(Math.random() * 20) + 5,
      attendance: Math.floor(Math.random() * 100) + 85,
      performance: Math.floor(Math.random() * 100) + 70,
      color: getRandomColor()
    }));
  };

  const generateAttendanceTrends = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      present: Math.floor(Math.random() * 50) + 30,
      absent: Math.floor(Math.random() * 10) + 2,
      late: Math.floor(Math.random() * 15) + 5,
    }));
  };

  const getRandomColor = () => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            variant={selectedChart === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart('overview')}
          >
            <Activity className="h-4 w-4 mr-1" />
            Overview
          </Button>
          <Button
            variant={selectedChart === 'trends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart('trends')}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Trends
          </Button>
          <Button
            variant={selectedChart === 'departments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart('departments')}
          >
            <PieChartIcon className="h-4 w-4 mr-1" />
            Departments
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Overview Charts */}
      {selectedChart === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Daily Attendance
              </CardTitle>
              <CardDescription>
                Employee attendance patterns this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.attendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#10b981" name="Present" />
                  <Bar dataKey="late" fill="#f59e0b" name="Late" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Top Performers
              </CardTitle>
              <CardDescription>
                Employee leaderboard based on performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.leaderboard.slice(0, 5).map((employee, index) => (
                  <div key={employee.id || index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {employee.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {employee.department}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {employee.score}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        points
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends Charts */}
      {selectedChart === 'trends' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Monthly Performance Trends
              </CardTitle>
              <CardDescription>
                Track attendance, productivity, and satisfaction over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.monthlyTrends}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorAttendance)"
                    name="Attendance %"
                  />
                  <Area
                    type="monotone"
                    dataKey="productivity"
                    stroke="#82ca9d"
                    fillOpacity={1}
                    fill="url(#colorProductivity)"
                    name="Productivity %"
                  />
                  <Line
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="#ffc658"
                    name="Satisfaction %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Department Charts */}
      {selectedChart === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Department Distribution
              </CardTitle>
              <CardDescription>
                Employee distribution across departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.departmentStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ department, employees }) => `${department}: ${employees}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="employees"
                  >
                    {data.departmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Department Performance
              </CardTitle>
              <CardDescription>
                Attendance and performance by department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="department" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendance" fill="#3b82f6" name="Attendance %" />
                  <Bar dataKey="performance" fill="#10b981" name="Performance %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
