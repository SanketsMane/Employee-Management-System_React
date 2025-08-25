import React, { useState, useEffect } from 'react';
import { Eye, Check, X, Clock, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import api from '../../lib/api';

const PendingApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/pending-approvals');
      
      if (response.data.success) {
        setPendingUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId, action, comments = '', reason = '') => {
    try {
      setProcessing(prev => ({ ...prev, [userId]: true }));
      
      const endpoint = action === 'approve' 
        ? `/admin/approve-user/${userId}`
        : `/admin/reject-user/${userId}`;
      
      const body = action === 'approve' 
        ? { comments }
        : { reason };

      console.log('Making request to:', endpoint, 'with body:', body);
      const response = await api.put(endpoint, body);
      console.log('Response received:', response.data);
      
      if (response.data.success) {
        // Remove user from pending list
        setPendingUsers(prev => prev.filter(user => user._id !== userId));
        
        // Show success message
        alert(`User ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      } else {
        alert(response.data.message || `Error ${action}ing user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || `Error ${action}ing user`);
    } finally {
      setProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  const ApprovalCard = ({ user }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [comments, setComments] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showApprovalForm, setShowApprovalForm] = useState(false);
    const [showRejectionForm, setShowRejectionForm] = useState(false);

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-600">{user.role}</p>
              <p className="text-xs text-gray-500">{user.employeeId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Applied: {formatDate(user.createdAt)}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Department:</span> {user.department}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Position:</span> {user.position}
                </p>
                {user.skills && user.skills.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => setShowApprovalForm(!showApprovalForm)}
            disabled={processing[user._id]}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve
          </button>
          <button
            onClick={() => setShowRejectionForm(!showRejectionForm)}
            disabled={processing[user._id]}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <X className="w-4 h-4 mr-2" />
            Reject
          </button>
        </div>

        {showApprovalForm && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Approve User</h4>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add approval comments (optional)..."
              className="w-full p-2 border border-green-300 rounded-md text-sm"
              rows={3}
            />
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => handleApproval(user._id, 'approve', comments)}
                disabled={processing[user._id]}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {processing[user._id] ? 'Processing...' : 'Confirm Approval'}
              </button>
              <button
                onClick={() => setShowApprovalForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showRejectionForm && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-800 mb-2">Reject User</h4>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (required)..."
              className="w-full p-2 border border-red-300 rounded-md text-sm"
              rows={3}
              required
            />
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    alert('Please provide a rejection reason');
                    return;
                  }
                  handleApproval(user._id, 'reject', '', rejectionReason);
                }}
                disabled={processing[user._id] || !rejectionReason.trim()}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {processing[user._id] ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => setShowRejectionForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pending User Approvals</h1>
          <p className="text-gray-600 mt-2">
            Review and approve or reject user registration requests
          </p>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
            <p className="text-gray-500">All user registration requests have been processed.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {pendingUsers.length} pending approval{pendingUsers.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={fetchPendingApprovals}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            {pendingUsers.map((user) => (
              <ApprovalCard key={user._id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;
