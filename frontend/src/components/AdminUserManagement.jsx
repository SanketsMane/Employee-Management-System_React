import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Key,
  Shield,
  User,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  Eye,
  Save,
  X
} from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    roleStats: {}
  });

  // Role management
  const defaultRoles = ['Admin', 'HR', 'Manager', 'Employee'];
  const [customRoles, setCustomRoles] = useState([]);
  const [roleObjects, setRoleObjects] = useState([]); // Store full role objects for ID access
  const [newRole, setNewRole] = useState('');
  const allRoles = [...defaultRoles, ...customRoles];

  const departments = [
    'Engineering', 'Human Resources', 'Sales', 'Marketing', 
    'Finance', 'Operations', 'Customer Support', 'Design'
  ];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Employee',
    department: '',
    position: '',
    phone: '',
    salary: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchCustomRoles();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      console.log('Users API Response:', response.data);
      const usersData = response.data.data || response.data.users || response.data || [];
      setUsers(usersData);
      calculateStats(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomRoles = async () => {
    try {
      const response = await api.get('/system/config/roles');
      if (response.data && response.data.success) {
        const systemRoles = response.data.data.items || [];
        // Store full objects for ID access
        setRoleObjects(systemRoles);
        // Filter out default roles to get only custom ones
        const additionalRoles = systemRoles
          .filter(roleObj => !defaultRoles.includes(roleObj.name))
          .map(roleObj => roleObj.name); // Extract just the name for backwards compatibility
        setCustomRoles(additionalRoles);
      } else {
        setCustomRoles([]);
        setRoleObjects([]);
      }
    } catch (error) {
      console.error('Error fetching custom roles:', error);
      setCustomRoles([]);
      setRoleObjects([]);
    }
  };

  const calculateStats = (usersData) => {
    const total = usersData.length;
    const active = usersData.filter(user => user.isActive !== false).length;
    const inactive = total - active;
    const pending = usersData.filter(user => user.isApproved === false).length;
    
    const roleStats = {};
    usersData.forEach(user => {
      if (user.role) {
        roleStats[user.role] = roleStats[user.role] || { total: 0, active: 0 };
        roleStats[user.role].total++;
        if (user.isActive !== false) roleStats[user.role].active++;
      }
    });

    setStats({ total, active, inactive, pending, roleStats });
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) ||
               (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
               (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
      });
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.isActive !== false;
        if (statusFilter === 'inactive') return user.isActive === false;
        if (statusFilter === 'pending') return user.isApproved === false;
        return true;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'Employee',
      department: '',
      position: '',
      phone: '',
      salary: '',
      password: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update user
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        }
        
        await api.put(`/admin/users/${editingUser._id}`, updateData);
        toast.success('User updated successfully');
      } else {
        // Create new user
        if (!formData.password) {
          toast.error('Password is required for new users');
          return;
        }
        await api.post('/admin/users', formData);
        toast.success(`User created successfully! Welcome email sent to ${formData.email}`, {
          duration: 5000,
          icon: '📧'
        });
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'Employee',
      department: user.department || '',
      position: user.position || '',
      phone: user.phone || '',
      salary: user.salary || '',
      password: '' // Don't populate password for editing
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        toast.success('User deleted successfully');
        fetchUsers(); // Refresh the users list
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/approve`);
      toast.success('User approved successfully');
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error(error.response?.data?.message || 'Failed to approve user');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/reset-password`);
      toast.success('Password reset email sent successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const addCustomRole = async () => {
    if (!newRole.trim()) {
      toast.error('Please enter a role name');
      return;
    }
    
    if (allRoles.includes(newRole.trim())) {
      toast.error('Role already exists');
      return;
    }

    try {
      // Add role via system config API
      await api.post('/system/config/roles', { 
        name: newRole.trim()
      });
      await fetchCustomRoles(); // Refresh the list
      setNewRole('');
      toast.success('Role added successfully');
    } catch (error) {
      console.error('Error adding custom role:', error);
      toast.error('Failed to add custom role');
    }
  };

    const removeCustomRole = async (role) => {
    if (window.confirm(`Are you sure you want to delete the role "${role}"? Users with this role will need to be reassigned.`)) {
      try {
        // Find the role object to get its ID
        const roleObject = roleObjects.find(r => r.name === role);
        if (!roleObject) {
          toast.error('Role not found');
          return;
        }

        // Delete via system config API using the role ID
        await api.delete(`/system/config/roles/${roleObject._id}`);
        
        await fetchCustomRoles(); // Refresh the list
        toast.success('Role removed successfully');
      } catch (error) {
        console.error('Error removing custom role:', error);
        toast.error(error.response?.data?.message || 'Failed to remove custom role');
      }
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    if (window.confirm(`Are you sure you want to ${action} ${selectedUsers.length} user(s)?`)) {
      try {
        // Perform bulk action for each selected user
        const promises = selectedUsers.map(userId => {
          if (action === 'activate' || action === 'deactivate') {
            return api.patch(`/admin/users/${userId}/toggle-status`);
          } else if (action === 'delete') {
            return api.delete(`/admin/users/${userId}`);
          }
        });
        
        await Promise.all(promises);
        toast.success(`Bulk ${action} completed successfully`);
        setSelectedUsers([]);
        fetchUsers(); // Refresh the users list
      } catch (error) {
        console.error(`Error performing bulk ${action}:`, error);
        toast.error(`Failed to perform bulk ${action}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">Manage users, roles, and permissions ({users.length} total users)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowRoleModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Manage Roles
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">Real-time data</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Activity className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-gray-600">{Math.round((stats.active / stats.total) * 100) || 0}% of total</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Users</p>
              <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <AlertTriangle className="w-4 h-4 text-orange-500 mr-1" />
            <span className="text-gray-600">Requires attention</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Eye className="w-4 h-4 text-purple-500 mr-1" />
            <span className="text-gray-600">Awaiting review</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Roles</option>
              {allRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {selectedUsers.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              {selectedUsers.length} user(s) selected
            </p>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(user => user._id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No users found</p>
                    <p className="text-gray-400">
                      {users.length === 0 
                        ? 'Create your first user to get started' 
                        : 'Try adjusting your search or filter criteria'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user._id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                            {user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unnamed User'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.employeeId && (
                            <div className="text-xs text-gray-400">ID: {user.employeeId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ['Admin', 'HR', 'Manager'].includes(user.role) 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role || 'Employee'}
                        </span>
                        {user.department && (
                          <div className="text-xs text-gray-500">{user.department}</div>
                        )}
                        {user.position && (
                          <div className="text-xs text-gray-400">{user.position}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive !== false
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive !== false ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isApproved !== false
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isApproved !== false ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Pending
                            </>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === user._id ? null : user._id)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {dropdownOpen === user._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleEdit(user);
                                  setDropdownOpen(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit User
                              </button>
                              {user.isApproved === false ? (
                                <button
                                  onClick={() => {
                                    handleApproveUser(user._id);
                                    setDropdownOpen(null);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 w-full text-left"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve User
                                </button>
                              ) : null}
                              <button
                                onClick={() => {
                                  toggleUserStatus(user._id, user.isActive !== false);
                                  setDropdownOpen(null);
                                }}
                                className={`flex items-center px-4 py-2 text-sm w-full text-left ${
                                  user.isActive !== false
                                    ? 'text-red-700 hover:bg-red-50' 
                                    : 'text-green-700 hover:bg-green-50'
                                }`}
                              >
                                {user.isActive !== false ? (
                                  <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  handleResetPassword(user._id);
                                  setDropdownOpen(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 w-full text-left"
                              >
                                <Key className="w-4 h-4 mr-2" />
                                Reset Password
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => {
                                  handleDelete(user._id);
                                  setDropdownOpen(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={editingUser}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                  />
                  {!editingUser && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start">
                        <Mail className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="text-sm text-blue-700">
                          <p className="font-medium">Email Notification</p>
                          <p>A welcome email with login credentials and account details will be automatically sent to the user's email address.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {allRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter position/job title"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter salary"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-purple-600" />
                  Role Management
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Add New Role */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Custom Role</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Enter new role name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomRole();
                      }
                    }}
                  />
                  <button
                    onClick={addCustomRole}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Role
                  </button>
                </div>
              </div>

              {/* Default Roles */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Default System Roles</h4>
                <div className="space-y-2">
                  {defaultRoles.map(role => (
                    <div key={role} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{role}</span>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                          System
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {stats.roleStats[role]?.total || 0} users
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Roles */}
              {customRoles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Custom Roles</h4>
                  <div className="space-y-2">
                    {customRoles.map(role => (
                      <div key={role} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-gray-900">{role}</span>
                          <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                            Custom
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {stats.roleStats[role]?.total || 0} users
                          </span>
                          <button
                            onClick={() => removeCustomRole(role)}
                            className="p-1 text-red-600 hover:text-red-700 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
