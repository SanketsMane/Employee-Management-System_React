import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const AdminAttendancePage = () => {
  const { user, isAdmin, isHR } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0
  });

  useEffect(() => {
    if (isAdmin() || isHR()) {
      fetchAttendanceData();
      fetchDepartments();
    }
  }, [selectedDate, selectedDepartment]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Get today's attendance data
      const response = await api.get('/attendance/all', {
        params: {
          startDate: selectedDate,
          endDate: selectedDate,
          department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
          limit: 1000 // Increase limit to get all records
        }
      });

      if (response.data.success && response.data.data) {
        const attendanceRecords = Array.isArray(response.data.data) ? response.data.data : 
                                  (response.data.data.attendanceRecords || []);
        setAttendanceData(attendanceRecords);
        calculateStats(attendanceRecords);
      } else {
        setAttendanceData([]);
        calculateStats([]);
      }

      // Also get all employees count for accurate stats
      const employeesResponse = await api.get('/users/employees');
      if (employeesResponse.data.success && employeesResponse.data.data && employeesResponse.data.data.employees) {
        const totalEmployeesCount = employeesResponse.data.data.employees.length;
        setStats(prevStats => ({
          ...prevStats,
          totalEmployees: totalEmployeesCount
        }));
      } else {
        console.log('No employees data found or invalid response structure');
      }

    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendanceData([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/users/departments');
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch departments');
    }
  };

  const calculateStats = (attendanceData) => {
    const stats = {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      avgWorkingHours: 0
    };

    if (!attendanceData || attendanceData.length === 0) {
      setStats(stats);
      return;
    }

    let totalWorkingHours = 0;
    let employeesWithHours = 0;
    const processedEmployees = new Set();

    // Process actual attendance records
    attendanceData.forEach(record => {
      const employee = record.employee || record.user;
      if (!employee || !employee._id) return;

      const empId = employee._id;
      if (processedEmployees.has(empId)) return; // Avoid double counting
      
      processedEmployees.add(empId);

      // Check if record is from the selected date
      const recordDate = new Date(record.date).toDateString();
      const selectedDateObj = new Date(selectedDate).toDateString();
      
      if (recordDate === selectedDateObj) {
        if (record.clockIn) {
          // Employee has clocked in
          const clockInTime = new Date(record.clockIn);
          const clockInHour = clockInTime.getHours();
          const clockInMinute = clockInTime.getMinutes();
          
          // Check if late (after 9:00 AM)
          if (clockInHour > 9 || (clockInHour === 9 && clockInMinute > 0)) {
            stats.lateToday++;
          } else {
            stats.presentToday++;
          }

          // Calculate working hours if available
          if (record.totalWorkTime && record.totalWorkTime > 0) {
            totalWorkingHours += record.totalWorkTime / 60; // Convert minutes to hours
            employeesWithHours++;
          }
        } else {
          // No clock in time means absent
          stats.absentToday++;
        }
      }
    });

    if (employeesWithHours > 0) {
      stats.avgWorkingHours = (totalWorkingHours / employeesWithHours).toFixed(1);
    }

    setStats(stats);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Absent':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Late':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      Present: 'bg-green-100 text-green-800',
      Absent: 'bg-red-100 text-red-800',
      Late: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const filteredData = attendanceData.filter(record => {
    const employee = record.employee || record.user; // Handle both structures
    const matchesSearch = 
      employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const exportAttendance = async () => {
    try {
      const response = await api.get('/attendance/admin/export', {
        params: {
          date: selectedDate,
          department: selectedDepartment !== 'all' ? selectedDepartment : undefined
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_${selectedDate}.csv`;
      link.click();
    } catch (error) {
      toast.error('Failed to export attendance data');
    }
  };

  if (!isAdmin() && !isHR()) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Only Admins and HR can view attendance data.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Manage and monitor employee attendance</p>
        </div>
        <Button onClick={exportAttendance} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent Today</p>
                <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Late Today</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lateToday}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Employee</th>
                    <th className="text-left p-4">Department</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Check In</th>
                    <th className="text-left p-4">Check Out</th>
                    <th className="text-left p-4">Working Hours</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? filteredData.map((record, index) => {
                    const employee = record.employee || record.user; // Handle both structures
                    return (
                    <tr key={record._id || index} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            {employee?.firstName?.[0]?.toUpperCase()}{employee?.lastName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {employee?.firstName} {employee?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {employee?.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {employee?.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{employee?.department}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(record.status)}
                          {getStatusBadge(record.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        {record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : '-'}
                      </td>
                      <td className="p-4">
                        {record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '-'}
                      </td>
                      <td className="p-4">
                        {record.totalWorkTime ? `${(record.totalWorkTime / 60).toFixed(2)}h` : '-'}
                      </td>
                      <td className="p-4">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="7" className="text-center p-8 text-muted-foreground">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="text-lg">No attendance records found</div>
                          <div className="text-sm">
                            No employees have checked in for {new Date(selectedDate).toLocaleDateString()}
                            {selectedDepartment !== 'all' && ` in ${selectedDepartment} department`}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAttendancePage;
