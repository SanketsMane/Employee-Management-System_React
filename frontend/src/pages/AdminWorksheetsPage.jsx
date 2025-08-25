import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Star,
  Calendar,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const AdminWorksheetsPage = () => {
  const { user, isAdmin, isHR } = useAuth();
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({
    totalWorksheets: 0,
    avgHours: 0,
    completedTasks: 0,
    pendingReview: 0
  });

  useEffect(() => {
    if (isAdmin || isHR || user?.role === 'Manager') {
      fetchWorksheets();
      fetchDepartments();
      fetchRoles();
    }
  }, [selectedDepartment, selectedRole, isAdmin, isHR]);

  const fetchWorksheets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/worksheets', {
        params: {
          department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
          role: selectedRole !== 'all' ? selectedRole : undefined
        }
      });

      if (response.data.success) {
        setWorksheets(response.data.data.worksheets || []);
        calculateStats(response.data.data.worksheets || []);
      }
    } catch (error) {
      console.error('Error fetching worksheets:', error);
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
      console.error('Error fetching departments:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/users/roles');
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const calculateStats = (data) => {
    const worksheetArray = Array.isArray(data) ? data : [];
    const totalSlots = worksheetArray.reduce((sum, worksheet) => sum + (worksheet.timeSlots?.length || 0), 0);
    const stats = {
      totalWorksheets: worksheetArray.length,
      avgHours: worksheetArray.length > 0 ? (totalSlots / worksheetArray.length).toFixed(2) : 0,
      completedTasks: worksheetArray.reduce((sum, worksheet) => 
        sum + (worksheet.timeSlots?.filter(slot => slot.status === 'Completed').length || 0), 0),
      pendingReview: worksheetArray.filter(worksheet => worksheet.approvalStatus === 'Pending').length
    };
    setStats(stats);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Submitted': 'bg-blue-100 text-blue-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Draft': 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      'High': 'bg-red-100 text-red-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={variants[priority] || 'bg-gray-100 text-gray-800'}>
        {priority}
      </Badge>
    );
  };

  const filteredWorksheets = (worksheets || []).filter(worksheet => {
    const matchesSearch = 
      worksheet.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worksheet.employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worksheet.employee?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worksheet.employee?.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const exportWorksheets = async () => {
    try {
      const response = await api.get('/worksheets/admin/export', {
        params: {
          department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
          role: selectedRole !== 'all' ? selectedRole : undefined
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `worksheets_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting worksheets:', error);
    }
  };

  const viewWorksheet = (worksheetId) => {
    // Navigate to worksheet detail view
    window.open(`/worksheets/${worksheetId}`, '_blank');
  };

  if (!isAdmin && !isHR && user?.role !== 'Manager') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Only Admins, HR, and Managers can view worksheets.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Worksheets Management</h1>
          <p className="text-muted-foreground">Monitor and manage employee worksheets</p>
        </div>
        <Button onClick={exportWorksheets} variant="outline">
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
                <p className="text-sm text-muted-foreground">Total Worksheets</p>
                <p className="text-2xl font-bold">{stats.totalWorksheets}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Hours/Week</p>
                <p className="text-2xl font-bold">{stats.avgHours}h</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.pendingReview}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
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
              <User className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search worksheets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Worksheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Worksheets Overview</CardTitle>
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
                    <th className="text-left p-4">Title</th>
                    <th className="text-left p-4">Department</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Priority</th>
                    <th className="text-left p-4">Hours</th>
                    <th className="text-left p-4">Submitted</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorksheets.map((worksheet) => (
                    <tr key={worksheet._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                            {worksheet.employee?.firstName?.[0]}{worksheet.employee?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {worksheet.employee?.firstName} {worksheet.employee?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {worksheet.employee?.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">Daily Worksheet</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(worksheet.date).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">{worksheet.employee?.department}</td>
                      <td className="p-4">{worksheet.employee?.role}</td>
                      <td className="p-4">{getStatusBadge(worksheet.approvalStatus || 'Draft')}</td>
                      <td className="p-4">{getPriorityBadge('Medium')}</td>
                      <td className="p-4">
                        <span className="font-medium">
                          {worksheet.timeSlots ? worksheet.timeSlots.length : 0}h
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(worksheet.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewWorksheet(worksheet._id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredWorksheets.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center p-8 text-muted-foreground">
                        No worksheets found for the selected criteria.
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

export default AdminWorksheetsPage;
