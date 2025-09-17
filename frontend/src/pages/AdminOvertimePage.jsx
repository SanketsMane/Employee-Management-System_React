import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  User, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  Download,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../lib/api';

const AdminOvertimePage = () => {
  const { user } = useAuth();
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({});
  
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    employee: '',
    urgencyLevel: '',
    startDate: '',
    endDate: ''
  });

  const [approvalData, setApprovalData] = useState({
    status: '',
    managerComments: '',
    compensation: {
      type: 'Monetary',
      rate: 1.5
    }
  });

  const departments = ['Engineering', 'Marketing', 'Sales', 'Design', 'HR', 'Finance', 'Operations', 'Support', 'IT', 'Research & Development'];
  const urgencyLevels = ['Low', 'Medium', 'High', 'Critical'];
  const statusOptions = ['Pending', 'Approved', 'Rejected'];

  // Fetch all overtime requests
  const fetchOvertimeRequests = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await api.get(`/overtime/all?${queryParams}`);
      if (response.data.success) {
        setOvertimeRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching overtime requests:', error);
      toast.error('Failed to fetch overtime requests');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for filter
  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        setAllEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch overtime analytics
  const fetchOvertimeAnalytics = async () => {
    try {
      const response = await api.get('/overtime/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching overtime analytics:', error);
    }
  };

  useEffect(() => {
    fetchOvertimeRequests();
    fetchEmployees();
    fetchOvertimeAnalytics();
  }, [filters]);

  const handleApproveReject = async (requestId, status) => {
    try {
      setLoading(true);
      
      const payload = {
        status,
        managerComments: approvalData.managerComments,
        compensation: status === 'Approved' ? approvalData.compensation : undefined
      };

      const response = await api.put(`/overtime/${requestId}/status`, payload);
      
      if (response.data.success) {
        toast.success(`Overtime request ${status.toLowerCase()} successfully`);
        setShowDetailModal(false);
        setSelectedRequest(null);
        setApprovalData({
          status: '',
          managerComments: '',
          compensation: { type: 'Monetary', rate: 1.5 }
        });
        fetchOvertimeRequests();
        fetchOvertimeAnalytics();
      }
    } catch (error) {
      console.error('Error updating overtime status:', error);
      toast.error(error.response?.data?.message || 'Failed to update overtime request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const calculateEstimatedCompensation = (hours, rate = 1.5) => {
    const baseHourlyRate = 500; // Assuming base rate of ₹500/hour
    return (hours * baseHourlyRate * rate).toFixed(0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Overtime Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Review and approve employee overtime requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {overtimeRequests.filter(req => req.status === 'Pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalHours?.toFixed(1) || '0.0'}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Employees</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(overtimeRequests.map(req => req.employee?._id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{stats.totalCompensation?.toFixed(0) || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employee</label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters({...filters, employee: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Employees</option>
                {allEmployees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} - {emp.employeeId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Urgency</label>
              <select
                value={filters.urgencyLevel}
                onChange={(e) => setFilters({...filters, urgencyLevel: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Urgency</option>
                {urgencyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Overtime Requests
          </CardTitle>
          <CardDescription>
            Review and manage employee overtime submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : overtimeRequests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No overtime requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Employee</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Time</th>
                    <th className="text-left p-4">Hours</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Urgency</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overtimeRequests.map((request) => (
                    <tr key={request._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {request.employee?.firstName} {request.employee?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.employee?.employeeId} - {request.employee?.department}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {new Date(request.date).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(request.startTime).toLocaleTimeString()} -<br />
                          {new Date(request.endTime).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-4 font-medium">
                        {request.totalHours?.toFixed(1)}h
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {request.overtimeType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(request.urgencyLevel)}`}>
                          {request.urgencyLevel}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Overtime Request Details
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Employee Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Employee Information</h3>
                    <p><strong>Name:</strong> {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}</p>
                    <p><strong>ID:</strong> {selectedRequest.employee?.employeeId}</p>
                    <p><strong>Department:</strong> {selectedRequest.employee?.department}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Overtime Details</h3>
                    <p><strong>Date:</strong> {new Date(selectedRequest.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {new Date(selectedRequest.startTime).toLocaleTimeString()} - {new Date(selectedRequest.endTime).toLocaleTimeString()}</p>
                    <p><strong>Duration:</strong> {selectedRequest.totalHours?.toFixed(1)} hours</p>
                    <p><strong>Type:</strong> {selectedRequest.overtimeType}</p>
                    <p><strong>Location:</strong> {selectedRequest.location}</p>
                    <p><strong>Urgency:</strong> {selectedRequest.urgencyLevel}</p>
                  </div>
                </div>

                {/* Project and Reason */}
                <div>
                  {selectedRequest.projectName && (
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Project</h3>
                      <p className="text-gray-700 dark:text-gray-300">{selectedRequest.projectName}</p>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Reason for Overtime</h3>
                    <p className="text-gray-700 dark:text-gray-300">{selectedRequest.reason}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Work Description</h3>
                    <p className="text-gray-700 dark:text-gray-300">{selectedRequest.workDescription}</p>
                  </div>
                </div>

                {/* Compensation Estimate */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Estimated Compensation</h3>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    ₹{calculateEstimatedCompensation(selectedRequest.totalHours, approvalData.compensation.rate)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Based on {selectedRequest.totalHours?.toFixed(1)}h × {approvalData.compensation.rate}x rate
                  </p>
                </div>

                {/* Approval Section */}
                {selectedRequest.status === 'Pending' && (
                  <div className="border-t pt-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4">Approval Decision</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Compensation Rate (multiplier)
                        </label>
                        <select
                          value={approvalData.compensation.rate}
                          onChange={(e) => setApprovalData({
                            ...approvalData,
                            compensation: {
                              ...approvalData.compensation,
                              rate: parseFloat(e.target.value)
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value={1.0}>1.0x (Regular)</option>
                          <option value={1.5}>1.5x (Standard Overtime)</option>
                          <option value={2.0}>2.0x (Holiday/Weekend)</option>
                          <option value={2.5}>2.5x (Emergency)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Manager Comments
                        </label>
                        <textarea
                          value={approvalData.managerComments}
                          onChange={(e) => setApprovalData({...approvalData, managerComments: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows="3"
                          placeholder="Add comments about the approval/rejection..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApproveReject(selectedRequest._id, 'Approved')}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleApproveReject(selectedRequest._id, 'Rejected')}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Comments */}
                {selectedRequest.managerComments && (
                  <div className="border-t pt-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Manager Comments</h3>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      {selectedRequest.managerComments}
                    </p>
                    {selectedRequest.approvedBy && (
                      <p className="text-sm text-gray-500 mt-2">
                        By: {selectedRequest.approvedBy[0]?.firstName} {selectedRequest.approvedBy[0]?.lastName} on {new Date(selectedRequest.approvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOvertimePage;