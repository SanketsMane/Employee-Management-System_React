import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  Check,
  X,
  AlertCircle,
  FileText,
  RefreshCw,
  Eye,
  Send,
  User,
  MessageSquare,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const EmployeeLeaveManagement = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Leave application form
  const [leaveForm, setLeaveForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false,
    halfDayPeriod: 'morning' // morning or afternoon
  });

  // Filters for employee's own leaves
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    leaveType: 'all'
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Statistics
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    remainingLeaves: 0
  });

  // Auto-refresh
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  // Leave types
  const leaveTypes = [
    'Sick Leave',
    'Casual Leave',
    'Vacation',
    'Emergency',
    'Personal',
    'Maternity',
    'Paternity'
  ];

  // Fetch employee's leaves
  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key] || filters[key] === 'all') {
          params.delete(key);
        }
      });

      console.log('🔍 Fetching employee leaves with params:', Object.fromEntries(params));

      const response = await api.get(`/leaves/my-leaves?${params}`);
      
      if (response.data.success) {
        setLeaves(response.data.data.leaves);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          pages: response.data.data.pagination.pages
        }));
        
        // Calculate stats
        calculateStats(response.data.data.leaves);
        
        console.log('✅ Fetched employee leaves:', response.data.data.leaves.length);
      }
    } catch (error) {
      console.error('❌ Error fetching leaves:', error);
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page]);

  // Calculate statistics
  const calculateStats = (leaveData) => {
    const stats = {
      totalRequests: leaveData.length,
      pendingRequests: leaveData.filter(l => l.status === 'Pending').length,
      approvedRequests: leaveData.filter(l => l.status === 'Approved').length,
      rejectedRequests: leaveData.filter(l => l.status === 'Rejected').length,
      remainingLeaves: 22 // This should come from user data or policy
    };
    
    // Calculate used leaves (approved only)
    const usedLeaves = leaveData
      .filter(l => l.status === 'Approved')
      .reduce((total, leave) => total + leave.totalDays, 0);
    
    stats.remainingLeaves = Math.max(0, 22 - usedLeaves);
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
    if (user) {
      fetchLeaves();
    }
  }, [user, filters, pagination.page, fetchLeaves]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      startDate: '',
      endDate: '',
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

  // Calculate total days between dates
  const calculateTotalDays = (startDate, endDate, halfDay = false) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    
    return halfDay ? 0.5 : daysDiff;
  };

  // Handle form changes
  const handleFormChange = (field, value) => {
    setLeaveForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate total days
      if (field === 'startDate' || field === 'endDate' || field === 'halfDay') {
        updated.totalDays = calculateTotalDays(updated.startDate, updated.endDate, updated.halfDay);
      }
      
      return updated;
    });
  };

  // Validate leave application
  const validateLeaveForm = () => {
    if (!leaveForm.leaveType) {
      toast.error('Please select leave type');
      return false;
    }
    if (!leaveForm.startDate) {
      toast.error('Please select start date');
      return false;
    }
    if (!leaveForm.endDate) {
      toast.error('Please select end date');
      return false;
    }
    if (new Date(leaveForm.startDate) > new Date(leaveForm.endDate)) {
      toast.error('End date must be after start date');
      return false;
    }
    if (!leaveForm.reason.trim()) {
      toast.error('Please provide a reason');
      return false;
    }
    if (leaveForm.reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters long');
      return false;
    }
    
    return true;
  };

  // Submit leave application
  const handleSubmitApplication = async () => {
    if (!validateLeaveForm()) return;

    try {
      setLoading(true);

      const applicationData = {
        ...leaveForm,
        totalDays: calculateTotalDays(leaveForm.startDate, leaveForm.endDate, leaveForm.halfDay)
      };

      console.log('📝 Submitting leave application:', applicationData);

      const response = await api.post('/leaves/apply', applicationData);

      if (response.data.success) {
        toast.success('Leave application submitted successfully');
        setShowApplicationModal(false);
        setLeaveForm({
          leaveType: '',
          startDate: '',
          endDate: '',
          reason: '',
          halfDay: false,
          halfDayPeriod: 'morning'
        });
        await fetchLeaves(); // Refresh the list
      }
    } catch (error) {
      console.error('❌ Error submitting leave application:', error);
      toast.error(error.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  // Cancel leave application
  const handleCancelLeave = async (leaveId) => {
    if (!confirm('Are you sure you want to cancel this leave application?')) return;

    try {
      setLoading(true);
      const response = await api.put(`/leaves/${leaveId}/cancel`);

      if (response.data.success) {
        toast.success('Leave application cancelled successfully');
        await fetchLeaves();
      }
    } catch (error) {
      console.error('Error cancelling leave:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel leave application');
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

  // Get today's date for min date validation
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Leave Requests</h1>
          <p className="text-gray-600">Apply for leave and track your applications</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            onClick={() => setShowApplicationModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Remaining Leaves</p>
                <p className="text-2xl font-bold">{stats.remainingLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-indigo-500 mr-3" />
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
            Filter Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Date Range */}
            <div>
              <Label htmlFor="startDate">From Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">To Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
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

      {/* Leave Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Applications ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading leave applications...</p>
              </div>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No leave applications found</p>
              <Button
                onClick={() => setShowApplicationModal(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Apply for Leave
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {leaves.map((leave) => (
                  <div key={leave._id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getStatusBadge(leave.status)}>
                            {leave.status}
                          </Badge>
                          <Badge variant="outline">{leave.leaveType}</Badge>
                          <span className="text-sm text-gray-500">
                            Applied on {formatDate(leave.createdAt)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="font-medium">
                              {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                            </p>
                            <p className="text-sm text-gray-500">{leave.totalDays} days</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Reason</p>
                            <p className="font-medium truncate">{leave.reason}</p>
                          </div>
                          
                          {leave.status !== 'Pending' && leave.approver && (
                            <div>
                              <p className="text-sm text-gray-600">
                                {leave.status === 'Approved' ? 'Approved by' : 'Rejected by'}
                              </p>
                              <p className="font-medium">
                                {leave.approver.firstName} {leave.approver.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(leave.approvedDate)}
                              </p>
                            </div>
                          )}
                        </div>

                        {leave.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                            <p className="text-sm text-red-800">
                              <strong>Rejection Reason:</strong> {leave.rejectionReason}
                            </p>
                          </div>
                        )}

                        {leave.adminMessage && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                            <p className="text-sm text-blue-800">
                              <strong>Admin Message:</strong> {leave.adminMessage}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {leave.status === 'Pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelLeave(leave._id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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

      {/* Leave Application Modal */}
      <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Leave Type */}
            <div>
              <Label htmlFor="leaveType">Leave Type *</Label>
              <select
                id="leaveType"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={leaveForm.leaveType}
                onChange={(e) => handleFormChange('leaveType', e.target.value)}
              >
                <option value="">Select leave type</option>
                {leaveTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  min={getTodayDate()}
                  value={leaveForm.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  min={leaveForm.startDate || getTodayDate()}
                  value={leaveForm.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Half Day Option */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="halfDay"
                checked={leaveForm.halfDay}
                onChange={(e) => handleFormChange('halfDay', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="halfDay">Half Day Leave</Label>
            </div>

            {leaveForm.halfDay && (
              <div>
                <Label htmlFor="halfDayPeriod">Half Day Period</Label>
                <select
                  id="halfDayPeriod"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={leaveForm.halfDayPeriod}
                  onChange={(e) => handleFormChange('halfDayPeriod', e.target.value)}
                >
                  <option value="morning">Morning (9 AM - 1 PM)</option>
                  <option value="afternoon">Afternoon (1 PM - 6 PM)</option>
                </select>
              </div>
            )}

            {/* Total Days Display */}
            {leaveForm.startDate && leaveForm.endDate && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <strong>Total Days:</strong> {calculateTotalDays(leaveForm.startDate, leaveForm.endDate, leaveForm.halfDay)}
                </p>
              </div>
            )}

            {/* Reason */}
            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a detailed reason for your leave..."
                value={leaveForm.reason}
                onChange={(e) => handleFormChange('reason', e.target.value)}
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                {leaveForm.reason.length}/500 characters (minimum 10 required)
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSubmitApplication}
                disabled={loading || !leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate || leaveForm.reason.length < 10}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowApplicationModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Details Modal */}
      {selectedLeave && showDetailsModal && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Leave Application Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800">Leave Information</h4>
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

                <div>
                  <h4 className="font-medium text-gray-800">Dates</h4>
                  <div className="mt-2 space-y-1">
                    <p><strong>From:</strong> {formatDate(selectedLeave.startDate)}</p>
                    <p><strong>To:</strong> {formatDate(selectedLeave.endDate)}</p>
                    <p><strong>Applied on:</strong> {formatDate(selectedLeave.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800">Reason</h4>
                <p className="mt-2 text-gray-700">{selectedLeave.reason}</p>
              </div>

              {selectedLeave.status !== 'Pending' && selectedLeave.approver && (
                <div>
                  <h4 className="font-medium text-gray-800">
                    {selectedLeave.status === 'Approved' ? 'Approval' : 'Rejection'} Information
                  </h4>
                  <div className="mt-2">
                    <p><strong>{selectedLeave.status === 'Approved' ? 'Approved' : 'Rejected'} by:</strong> {selectedLeave.approver.firstName} {selectedLeave.approver.lastName}</p>
                    <p><strong>Date:</strong> {formatDate(selectedLeave.approvedDate)}</p>
                    {selectedLeave.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                        <p><strong>Rejection Reason:</strong> {selectedLeave.rejectionReason}</p>
                      </div>
                    )}
                    {selectedLeave.adminMessage && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                        <p><strong>Admin Message:</strong> {selectedLeave.adminMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedLeave.status === 'Pending' && (
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleCancelLeave(selectedLeave._id);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Application
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
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

export default EmployeeLeaveManagement;
