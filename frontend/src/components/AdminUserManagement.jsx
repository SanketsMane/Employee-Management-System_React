import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../lib/api';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'Employee'
  });
  const [stats, setStats] = useState({
    Employee: { total: 0, active: 0, approved: 0 },
    'Team Lead': { total: 0, active: 0, approved: 0 },
    Manager: { total: 0, active: 0, approved: 0 },
    HR: { total: 0, active: 0, approved: 0 },
    Admin: { total: 0, active: 0, approved: 0 }
  });

  const roles = ['Employee', 'Team Lead', 'Manager', 'HR', 'Admin'];

  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto refresh when component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUsers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, selectedRole, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users from /users endpoint');
      // Add cache busting parameter
      const response = await api.get(`/users?timestamp=${Date.now()}`);
      console.log('Users response:', response.data);
      
      if (response.data.success) {
        // Handle the response format from userController
        const usersArray = response.data.data?.users || response.data.users || response.data.data || [];
        console.log('Users array:', usersArray);
        setUsers(usersArray);
        calculateStats(usersArray);
      } else {
        console.error('Failed to fetch users:', response.data.message);
        setUsers([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error response:', error.response);
      setUsers([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData) => {
    const newStats = {
      Employee: { total: 0, active: 0, approved: 0 },
      'Team Lead': { total: 0, active: 0, approved: 0 },
      Manager: { total: 0, active: 0, approved: 0 },
      HR: { total: 0, active: 0, approved: 0 },
      Admin: { total: 0, active: 0, approved: 0 }
    };

    // Ensure usersData is an array before calling forEach
    if (Array.isArray(usersData) && usersData.length > 0) {
      usersData.forEach(user => {
        if (user && user.role && newStats[user.role]) {
          newStats[user.role].total++;
          if (user.isActive) newStats[user.role].active++;
          if (user.isApproved) newStats[user.role].approved++;
        }
      });
    }

    setStats(newStats);
  };

  const filterUsers = () => {
    let filtered = Array.isArray(users) ? users : [];

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      const [firstName, ...lastNameParts] = formData.fullName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || '';
      
      const submitData = {
        firstName: firstName || '',
        lastName: lastName,
        email: formData.email,
        role: formData.role
      };
      
      // For user creation, we need position field
      if (!editingUser) {
        submitData.position = formData.role; // Default position to role if not specified
      }
      
      console.log('Submit data:', submitData);
      console.log('Editing user:', editingUser);
      
      if (editingUser) {
        // Update existing user
        console.log('Updating user with ID:', editingUser._id);
        response = await api.put(`/admin/users/${editingUser._id}`, submitData);
      } else {
        // Create new user
        console.log('Creating new user');
        response = await api.post(`/admin/users/create`, submitData);
      }

      console.log('Response:', response);

      if (response.data.success) {
        toast.success(response.data.message || `User ${editingUser ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        setEditingUser(null);
        setFormData({ fullName: '', email: '', role: 'Employee' });
        fetchUsers();
      } else {
        toast.error(response.data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Network error occurred');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        console.log('Attempting to delete user:', userId);
        const response = await api.delete(`/admin/users/${userId}`);
        console.log('Delete response:', response);

        if (response.data.success) {
          toast.success('User deleted successfully');
          fetchUsers();
        } else {
          toast.error(response.data.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        console.error('Error response:', error.response);
        toast.error(error.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const handleResetPassword = async (userId) => {
    if (window.confirm('Are you sure you want to reset this user\'s password? A new password will be emailed to them.')) {
      try {
        const response = await api.post(`/admin/users/${userId}/reset-password`);

        if (response.data.success) {
          toast.success(response.data.message || 'Password reset successfully');
        } else {
          toast.error(response.data.message || 'Failed to reset password');
        }
      } catch (error) {
        console.error('Error resetting password:', error);
        toast.error(error.response?.data?.message || 'Error resetting password');
      }
    }
  };

  const handleApproveUser = async (userId) => {
    const comments = window.prompt('Enter approval comments (optional):');
    if (comments === null) return; // User cancelled

    try {
      const response = await api.put(`/admin/approve-user/${userId}`, { comments });
      
      if (response.data.success) {
        toast.success('User approved successfully');
        fetchUsers(); // Refresh the user list
      } else {
        toast.error(response.data.message || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error(error.response?.data?.message || 'Error approving user');
    }
  };

  const handleRemoveApproval = async (userId) => {
    if (window.confirm('Are you sure you want to remove approval for this user? They will need to be approved again to access the system.')) {
      try {
        const response = await api.put(`/admin/users/${userId}/remove-approval`);
        
        if (response.data.success) {
          toast.success('User approval removed successfully');
          fetchUsers(); // Refresh the user list
        } else {
          toast.error(response.data.message || 'Failed to remove approval');
        }
      } catch (error) {
        console.error('Error removing approval:', error);
        toast.error(error.response?.data?.message || 'Error removing approval');
      }
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, {
        isActive: !currentStatus
      });

      if (response.data.success) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        toast.error(response.data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error.response?.data?.message || 'Error updating user status');
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'Employee' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage users and their permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {roles.map((role) => {
          const stat = stats[role];
          return (
            <div key={role} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <h3 className="font-medium text-gray-900">{role}</h3>
              <p className="text-2xl font-bold text-blue-600">{stat.total}</p>
              <div className="text-sm text-gray-500 mt-1">
                {stat.approved} approved • {stat.active} active
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => fetchUsers()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create User
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers && filteredUsers.map((user) => user && (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {(user.firstName && user.firstName.length > 0) ? user.firstName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{`${user.firstName || ''} ${user.lastName || ''}`.trim()}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isApproved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        {!user.isApproved ? (
                          <button
                            onClick={() => handleApproveUser(user._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRemoveApproval(user._id)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Remove Approval
                          </button>
                        )}
                        <button
                          onClick={() => toggleUserStatus(user._id, user.isActive)}
                          className={`${
                            user.isActive 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleResetPassword(user._id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={editingUser}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                      setFormData({ fullName: '', email: '', role: 'Employee' });
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
