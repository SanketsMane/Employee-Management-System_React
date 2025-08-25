import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit3,
  Trash2,
  Send
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../lib/api';

const LeavesPage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [formData, setFormData] = useState({
    leaveType: 'Sick Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [leaveStats, setLeaveStats] = useState({});
  const [filter, setFilter] = useState('all');

  const leaveTypes = [
    'Sick Leave',
    'Casual Leave',
    'Annual Leave',
    'Maternity Leave',
    'Paternity Leave',
    'Emergency Leave',
    'Study Leave',
    'Bereavement Leave'
  ];

  // Fetch leave requests
  const fetchLeaves = async () => {
    try {
      const response = await api.get('/leaves');
      
      if (response.data.success) {
        const leavesData = response.data.data?.leaves || response.data.data || response.data.leaves || [];
        setLeaves(leavesData);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.error('❌ Error fetching leaves:', error.response?.data || error.message);
      setLeaves([]);
    }
  };

  // Fetch leave statistics
  const fetchLeaveStats = async () => {
    try {
      const response = await api.get('/leaves/stats');
      if (response.data.success) {
        setLeaveStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leave stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeaves();
      fetchLeaveStats();
    }
  }, [user]);

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      const missingFields = [];
      if (!formData.leaveType) missingFields.push('Leave Type');
      if (!formData.startDate) missingFields.push('Start Date');
      if (!formData.endDate) missingFields.push('End Date');
      if (!formData.reason) missingFields.push('Reason');
      
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }
    
    setLoading(true);
    try {
      let response;
      if (editingLeave) {
        response = await api.put(`/leaves/${editingLeave._id}`, formData);
      } else {
        response = await api.post('/leaves', formData);
      }

      if (response.data.success) {
        await fetchLeaves();
        await fetchLeaveStats();
        setShowForm(false);
        setEditingLeave(null);
        setFormData({
          leaveType: 'Sick Leave',
          startDate: '',
          endDate: '',
          reason: ''
        });
        toast.success(editingLeave ? 'Leave request updated!' : 'Leave request submitted!');
      }
    } catch (error) {
      console.error('❌ Error submitting leave:', error.response?.data || error.message);
      toast.error('Error submitting leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (leave) => {
    if (leave.status !== 'Pending') {
      toast.error('Only pending leave requests can be edited');
      return;
    }

    setEditingLeave(leave);
    setFormData({
      leaveType: leave.leaveType,
      startDate: leave.startDate.split('T')[0],
      endDate: leave.endDate.split('T')[0],
      reason: leave.reason
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (leaveId) => {
    const leave = leaves.find(l => l._id === leaveId);
    if (leave.status !== 'Pending') {
      toast.error('Only pending leave requests can be deleted');
      return;
    }

    if (!confirm('Are you sure you want to delete this leave request?')) {
      return;
    }

    try {
      const response = await api.delete(`/leaves/${leaveId}`);

      if (response.data.success) {
        await fetchLeaves();
        await fetchLeaveStats();
        toast.success('Leave request deleted successfully!');
      }
    } catch (error) {
      console.error('❌ Error deleting leave:', error.response?.data || error.message);
      toast.error('Error deleting leave request. Please try again.');
    }
  };

  // Calculate leave duration
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    const statusInfo = {
      'Pending': { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: AlertCircle,
        bgColor: 'bg-yellow-500' 
      },
      'Approved': { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle,
        bgColor: 'bg-green-500' 
      },
      'Rejected': { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle,
        bgColor: 'bg-red-500' 
      }
    };
    return statusInfo[status] || statusInfo['Pending'];
  };

  // Filter leaves
  const filteredLeaves = leaves.filter(leave => {
    if (filter === 'all') return true;
    return leave.status.toLowerCase() === filter;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Requests</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your leave applications</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={fetchLeaves}
            variant="outline"
            className="bg-gray-500 hover:bg-gray-600"
          >
            🔄 Refresh
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Leave Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex space-x-4">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                All ({leaves.length})
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                Pending ({leaves.filter(l => l.status === 'Pending').length})
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                onClick={() => setFilter('approved')}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                Approved ({leaves.filter(l => l.status === 'Approved').length})
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setFilter('rejected')}
                size="sm"
                className="bg-red-500 hover:bg-red-600"
              >
                Rejected ({leaves.filter(l => l.status === 'Rejected').length})
              </Button>
            </div>
          </Card>

          {/* Leave Requests List */}
          <div className="space-y-4">
            {filteredLeaves.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No leave requests found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'all' 
                    ? "You haven't submitted any leave requests yet." 
                    : `No ${filter} leave requests found.`
                  }
                </p>
              </Card>
            ) : (
              filteredLeaves.map((leave) => {
                const statusInfo = getStatusInfo(leave.status);
                const StatusIcon = statusInfo.icon;
                const duration = calculateDuration(leave.startDate, leave.endDate);

                return (
                  <Card key={leave._id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-3 h-3 rounded-full ${statusInfo.bgColor}`}></div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {leave.leaveType}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {leave.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                              {new Date(leave.startDate).toLocaleDateString()} - {' '}
                              {new Date(leave.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{duration} day{duration > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Reason:</h4>
                          <p className="text-gray-600 dark:text-gray-400">{leave.reason}</p>
                        </div>

                        {leave.attachments && leave.attachments.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Attachments:</h4>
                            <div className="flex space-x-2">
                              {leave.attachments.map((attachment, index) => (
                                <a
                                  key={index}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600 text-sm underline"
                                >
                                  {attachment.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {leave.remarks && (
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              Remarks from {leave.approvedBy?.firstName} {leave.approvedBy?.lastName}:
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{leave.remarks}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {leave.status === 'Pending' && (
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(leave)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(leave._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Submitted on {new Date(leave.createdAt).toLocaleDateString()} at{' '}
                        {new Date(leave.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leave Balance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Leave Balance
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Annual Leave</div>
                <div className="text-2xl font-bold text-blue-600">
                  {leaveStats.remainingAnnualLeave || 0}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                    / {leaveStats.totalAnnualLeave || 21}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sick Leave</div>
                <div className="text-2xl font-bold text-green-600">
                  {leaveStats.remainingSickLeave || 0}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                    / {leaveStats.totalSickLeave || 10}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Casual Leave</div>
                <div className="text-2xl font-bold text-purple-600">
                  {leaveStats.remainingCasualLeave || 0}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                    / {leaveStats.totalCasualLeave || 5}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* This Year's Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              This Year's Summary
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Requests</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {leaveStats.totalRequests || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Days Taken</div>
                <div className="text-2xl font-bold text-orange-600">
                  {leaveStats.totalDaysTaken || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Approval Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {leaveStats.approvalRate || 0}%
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Leave Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingLeave ? 'Edit Leave Request' : 'New Leave Request'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingLeave(null);
                    setFormData({
                      leaveType: 'Sick Leave',
                      startDate: '',
                      endDate: '',
                      reason: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Info Note */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Note:</strong> Your leave request will be automatically sent to Admin, HR, and your Manager for review and approval.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Leave Type *
                  </label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    {leaveTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Please provide a detailed reason for your leave request..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attachments (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFormData({ ...formData, attachments: e.target.files })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB each)
                </p>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Duration: {calculateDuration(formData.startDate, formData.endDate)} day
                    {calculateDuration(formData.startDate, formData.endDate) > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingLeave(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Submitting...' : editingLeave ? 'Update Request' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesPage;
