import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Send,
  ChevronLeft,
  ChevronRight,
  Building,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const AdminLeaveManagement = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: '',
    rejectionReason: '',
    adminMessage: ''
  });

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    employeeName: '',
    employeeId: '',
    department: 'all',
    leaveType: 'all'
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Sorting
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Statistics
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  });

  // Auto-refresh
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  // Fetch leaves with filters
  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        ...filters
      });

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key] || filters[key] === 'all') {
          params.delete(key);
        }
      });

      console.log('🔍 Fetching leaves with params:', Object.fromEntries(params));

      const response = await api.get(`/leaves/admin/all?${params}`);
      
      if (response.data.success) {
        setLeaves(response.data.data.leaves);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          pages: response.data.data.pagination.pages
        }));
        
        // Calculate stats
        calculateStats(response.data.data.leaves);
        
        console.log('✅ Fetched leaves:', response.data.data.leaves.length);
      }
    } catch (error) {
      console.error('❌ Error fetching leaves:', error);
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, sorting]);

  // Fetch employees for filter dropdown
  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users/all');
      if (response.data.success) {
        setEmployees(response.data.data.users.filter(emp => emp.role !== 'Admin'));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Calculate statistics
  const calculateStats = (leaveData) => {
    const stats = {
      totalRequests: leaveData.length,
      pendingRequests: leaveData.filter(l => l.status === 'Pending').length,
      approvedRequests: leaveData.filter(l => l.status === 'Approved').length,
      rejectedRequests: leaveData.filter(l => l.status === 'Rejected').length
    };
    setStats(stats);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastRefreshTime > 30000) { // 30 seconds
        fetchLeaves();
        setLastRefreshTime(Date.now());
        console.log('🔄 Auto-refreshing leave data...');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLeaves, lastRefreshTime]);

  useEffect(() => {
    if (user && ['Admin', 'HR', 'Manager'].includes(user.role)) {
      fetchLeaves();
      fetchEmployees();
    }
  }, [user, filters, pagination.page, sorting, fetchLeaves]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle sorting
  const handleSort = (field) => {
    setSorting(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: 'all',
      employeeName: '',
      employeeId: '',
      department: 'all',
      leaveType: 'all'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Manual refresh
  const handleRefresh = async () => {
    setLastRefreshTime(Date.now());
    await fetchLeaves();
    toast.success('Data refreshed successfully');
  };

  // Open approval modal
  const openApprovalModal = (leave, action) => {
    setSelectedLeave(leave);
    setApprovalData({
      status: action,
      rejectionReason: '',
      adminMessage: ''
    });
    setShowApprovalModal(true);
  };

  // Handle approval/rejection
  const handleApprovalSubmit = async () => {
    try {
      if (approvalData.status === 'Rejected' && !approvalData.rejectionReason.trim()) {
        toast.error('Rejection reason is required');
        return;
      }

      setLoading(true);

      const response = await api.put(`/leaves/${selectedLeave._id}/status`, approvalData);

      if (response.data.success) {
        toast.success(`Leave request ${approvalData.status.toLowerCase()} successfully`);
        setShowApprovalModal(false);
        await fetchLeaves(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating leave status:', error);
      toast.error(error.response?.data?.message || 'Failed to update leave status');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Get unique departments and leave types for filters
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
  const leaveTypes = ['Sick Leave', 'Casual Leave', 'Vacation', 'Emergency', 'Personal', 'Maternity', 'Paternity'];

  if (!['Admin', 'HR', 'Manager'].includes(user?.role)) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-600">Manage and approve employee leave requests</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{stats.totalRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Check className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{stats.approvedRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <X className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejectedRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Employee Search */}
            <div>
              <Label htmlFor="employeeName">Employee Name</Label>
              <Input
                id="employeeName"
                type="text"
                placeholder="Search by name..."
                value={filters.employeeName}
                onChange={(e) => handleFilterChange('employeeName', e.target.value)}
              />
            </div>

            {/* Department Filter */}
            <div>
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Leave Type Filter */}
            <div>
              <Label htmlFor="leaveType">Leave Type</Label>
              <select
                id="leaveType"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.leaveType}
                onChange={(e) => handleFilterChange('leaveType', e.target.value)}
              >
                <option value="all">All Types</option>
                {leaveTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Employee Select */}
            <div>
              <Label htmlFor="employeeId">Specific Employee</Label>
              <select
                id="employeeId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.employeeId}
                onChange={(e) => handleFilterChange('employeeId', e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} - {emp.department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading leave requests...</p>
              </div>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No leave requests found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th 
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('employeeName')}
                      >
                        Employee
                      </th>
                      <th 
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('leaveType')}
                      >
                        Leave Type
                      </th>
                      <th 
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('startDate')}
                      >
                        Duration
                      </th>
                      <th className="text-left p-3 font-semibold">Days</th>
                      <th 
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('status')}
                      >
                        Status
                      </th>
                      <th 
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('createdAt')}
                      >
                        Applied On
                      </th>
                      <th className="text-left p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((leave) => (
                      <tr key={leave._id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">
                              {leave.employee.firstName} {leave.employee.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {leave.employee.department} • {leave.employee.role}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{leave.leaveType}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p>{formatDate(leave.startDate)}</p>
                            <p className="text-gray-600">to {formatDate(leave.endDate)}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">{leave.totalDays}</span>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusBadge(leave.status)}>
                            {leave.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {formatDate(leave.createdAt)}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {leave.status === 'Pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => openApprovalModal(leave, 'Approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openApprovalModal(leave, 'Rejected')}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedLeave(leave)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalData.status === 'Approved' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
          </DialogHeader>
          
          {selectedLeave && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{selectedLeave.employee.firstName} {selectedLeave.employee.lastName}</h4>
                <p className="text-sm text-gray-600">{selectedLeave.leaveType}</p>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)} ({selectedLeave.totalDays} days)
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Reason:</strong> {selectedLeave.reason}
                </p>
              </div>

              {approvalData.status === 'Rejected' && (
                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Please provide a reason for rejection..."
                    value={approvalData.rejectionReason}
                    onChange={(e) => setApprovalData(prev => ({
                      ...prev,
                      rejectionReason: e.target.value
                    }))}
                    rows={3}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="adminMessage">Additional Message (Optional)</Label>
                <Textarea
                  id="adminMessage"
                  placeholder="Any additional message for the employee..."
                  value={approvalData.adminMessage}
                  onChange={(e) => setApprovalData(prev => ({
                    ...prev,
                    adminMessage: e.target.value
                  }))}
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleApprovalSubmit}
                  disabled={loading || (approvalData.status === 'Rejected' && !approvalData.rejectionReason.trim())}
                  className={approvalData.status === 'Approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Processing...' : `${approvalData.status === 'Approved' ? 'Approve' : 'Reject'} Leave`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalModal(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Leave Details Modal */}
      {selectedLeave && !showApprovalModal && (
        <Dialog open={!!selectedLeave} onOpenChange={() => setSelectedLeave(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Leave Request Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800">Employee Information</h4>
                  <div className="mt-2 space-y-1">
                    <p><strong>Name:</strong> {selectedLeave.employee.firstName} {selectedLeave.employee.lastName}</p>
                    <p><strong>Department:</strong> {selectedLeave.employee.department}</p>
                    <p><strong>Role:</strong> {selectedLeave.employee.role}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Leave Details</h4>
                  <div className="mt-2 space-y-1">
                    <p><strong>Type:</strong> {selectedLeave.leaveType}</p>
                    <p><strong>Duration:</strong> {selectedLeave.totalDays} days</p>
                    <p><strong>Status:</strong> 
                      <Badge className={`ml-2 ${getStatusBadge(selectedLeave.status)}`}>
                        {selectedLeave.status}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800">Leave Period</h4>
                <p className="mt-2">
                  <strong>From:</strong> {formatDate(selectedLeave.startDate)}<br />
                  <strong>To:</strong> {formatDate(selectedLeave.endDate)}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800">Reason</h4>
                <p className="mt-2 text-gray-700">{selectedLeave.reason}</p>
              </div>

              {selectedLeave.status !== 'Pending' && selectedLeave.approver && (
                <div>
                  <h4 className="font-medium text-gray-800">Approval Information</h4>
                  <div className="mt-2">
                    <p><strong>Approved/Rejected by:</strong> {selectedLeave.approver.firstName} {selectedLeave.approver.lastName}</p>
                    <p><strong>Date:</strong> {formatDate(selectedLeave.approvedDate)}</p>
                    {selectedLeave.rejectionReason && (
                      <p><strong>Rejection Reason:</strong> {selectedLeave.rejectionReason}</p>
                    )}
                    {selectedLeave.adminMessage && (
                      <p><strong>Admin Message:</strong> {selectedLeave.adminMessage}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedLeave.status === 'Pending' && (
                  <>
                    <Button
                      onClick={() => {
                        setShowApprovalModal(true);
                        setApprovalData({ status: 'Approved', rejectionReason: '', adminMessage: '' });
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setShowApprovalModal(true);
                        setApprovalData({ status: 'Rejected', rejectionReason: '', adminMessage: '' });
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedLeave(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminLeaveManagement;
