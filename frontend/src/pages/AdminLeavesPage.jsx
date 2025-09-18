import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Check,
  X,
  Clock,
  User,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const AdminLeavesPage = () => {
  const { user, isAdmin, isHR } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  });

  useEffect(() => {
    if (isAdmin() || isHR() || user?.role === 'Manager') {
      fetchLeaves();
      fetchDepartments();
    }
  }, [selectedStatus, selectedDepartment, isAdmin, isHR]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaves', {
        params: {
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          department: selectedDepartment !== 'all' ? selectedDepartment : undefined
        }
      });

      if (response.data.success) {
        setLeaves(response.data.data.leaves || []);
        calculateStats(response.data.data.leaves || []);
      }
    } catch (error) {
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
    }
  };

  const calculateStats = (data) => {
    const leaveArray = Array.isArray(data) ? data : [];
    const stats = {
      totalRequests: leaveArray.length,
      pendingRequests: leaveArray.filter(leave => leave.status === 'Pending').length,
      approvedRequests: leaveArray.filter(leave => leave.status === 'Approved').length,
      rejectedRequests: leaveArray.filter(leave => leave.status === 'Rejected').length
    };
    setStats(stats);
  };

  const handleLeaveAction = async (leaveId, action, comment = '') => {
    try {
      const response = await api.put(`/leaves/${leaveId}/status`, {
        status: action,
        comment
      });

      if (response.data.success) {
        fetchLeaves(); // Refresh the list
      }
    } catch (error) {
      console.error(`Error ${action}ing leave:`, error);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getLeaveTypeBadge = (type) => {
    const variants = {
      'Sick Leave': 'bg-red-100 text-red-800',
      'Vacation': 'bg-blue-100 text-blue-800',
      'Personal Leave': 'bg-purple-100 text-purple-800',
      'Emergency Leave': 'bg-orange-100 text-orange-800',
      'Maternity/Paternity': 'bg-pink-100 text-pink-800'
    };

    return (
      <Badge className={variants[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const filteredLeaves = (leaves || []).filter(leave => {
    const matchesSearch = 
      leave.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const exportLeaves = async () => {
    try {
      const response = await api.get('/leaves/admin/export', {
        params: {
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          department: selectedDepartment !== 'all' ? selectedDepartment : undefined
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leaves_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting leaves:', error);
    }
  };

  if (!isAdmin() && !isHR() && user?.role !== 'Manager') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Only Admins, HR, and Managers can manage leaves.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Manage and approve employee leave requests</p>
        </div>
        <Button onClick={exportLeaves} variant="outline">
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
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.totalRequests}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejectedRequests}</p>
              </div>
              <X className="w-8 h-8 text-red-500" />
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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
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
                placeholder="Search leave requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaves Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
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
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Duration</th>
                    <th className="text-left p-4">Dates</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Reason</th>
                    <th className="text-left p-4">Applied</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave) => (
                    <tr key={leave._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                            {leave.user?.firstName?.[0]}{leave.user?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {leave.user?.firstName} {leave.user?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {leave.user?.department}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{getLeaveTypeBadge(leave.leaveType)}</td>
                      <td className="p-4">
                        <span className="font-medium">
                          {calculateDuration(leave.startDate, leave.endDate)} days
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p>{new Date(leave.startDate).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">
                            to {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(leave.status)}</td>
                      <td className="p-4">
                        <p className="text-sm max-w-xs truncate" title={leave.reason}>
                          {leave.reason}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(leave.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {leave.status === 'Pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLeaveAction(leave._id, 'approve')}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLeaveAction(leave._id, 'reject')}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLeaves.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center p-8 text-muted-foreground">
                        No leave requests found for the selected criteria.
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

export default AdminLeavesPage;
