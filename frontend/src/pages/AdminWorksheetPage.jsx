import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  Users,
  Building,
  UserCheck,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const AdminWorksheetPage = () => {
  const { user } = useAuth();
  const [worksheets, setWorksheets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0],
    department: '',
    role: '',
    employeeId: '',
    status: '',
    search: ''
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
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Statistics
  const [stats, setStats] = useState({
    totalWorksheets: 0,
    submittedWorksheets: 0,
    approvedWorksheets: 0,
    rejectedWorksheets: 0,
    pendingWorksheets: 0,
    averageProductivity: 0
  });

  // Unique values for filters
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    roles: []
  });

  useEffect(() => {
    console.log('🔄 AdminWorksheetPage useEffect triggered');
    console.log('🔄 User:', user?.firstName, user?.lastName, 'Role:', user?.role);
    if (user && ['Admin', 'HR', 'Manager'].includes(user.role)) {
      console.log('✅ User authorized, calling fetch functions...');
      fetchWorksheets();
      fetchEmployees();
      fetchStats();
    } else {
      console.log('❌ User not authorized or not loaded yet');
    }
  }, [user, filters, pagination.page, sorting]);

  // Fetch worksheets with filters
  const fetchWorksheets = async () => {
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
        if (!filters[key]) {
          params.delete(key);
        }
      });

      console.log('🔍 Fetching worksheets with params:', Object.fromEntries(params));

      const response = await api.get(`/worksheets/admin/all?${params}`);
      
      if (response.data.success) {
        const worksheetData = response.data.data.worksheets;
        setWorksheets(worksheetData);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          pages: response.data.pagination.pages
        }));
        
        console.log('✅ Fetched worksheets:', worksheetData.length);
      }
    } catch (error) {
      console.error('❌ Error fetching worksheets:', error);
      toast.error('Failed to fetch worksheets');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for filter dropdown
  const fetchEmployees = async () => {
    try {
      console.log('🔍 AdminWorksheetPage: Starting fetchEmployees...');
      const response = await api.get('/admin/users/employees');
      if (response.data.success) {
        setEmployees(response.data.data.users);
        console.log('✅ AdminWorksheetPage: Employees fetched successfully');
      }

      // Fetch system configurations for departments and roles
      try {
        console.log('🔧 AdminWorksheetPage: Calling system config API...');
        const configResponse = await api.get('/system/config');
        console.log('🔧 AdminWorksheetPage: System config response:', configResponse.data);
        if (configResponse.data.success) {
          const configs = configResponse.data.data;
          setFilterOptions({
            departments: configs.departments?.map(item => item.name) || [],
            roles: configs.roles?.map(item => item.name) || []
          });
          console.log('✅ AdminWorksheetPage: System config loaded successfully');
          console.log('🏢 Departments:', configs.departments?.map(item => item.name) || []);
          console.log('👔 Roles:', configs.roles?.map(item => item.name) || []);
        }
      } catch (configError) {
        console.error('❌ Error fetching system config, falling back to user data:', configError);
        // Fallback to extracting from existing users if system config fails
        if (response.data.success) {
          const departments = [...new Set(response.data.data.users.map(emp => emp.department))];
          const roles = [...new Set(response.data.data.users.map(emp => emp.role))];
          
          setFilterOptions({
            departments: departments.filter(Boolean),
            roles: roles.filter(Boolean)
          });
          console.log('🔄 Using fallback departments:', departments.filter(Boolean));
          console.log('🔄 Using fallback roles:', roles.filter(Boolean));
        }
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
    }
  };

  // Calculate statistics
  // Fetch comprehensive statistics
  const fetchStats = async () => {
    try {
      // Get date range from filters for stats calculation
      const startDate = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = filters.endDate || new Date().toISOString().split('T')[0];
      
      // Calculate period in days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      console.log('📊 Fetching stats for period:', periodDays, 'days');
      
      // For admin, get overall stats by fetching all worksheets in the period
      const params = new URLSearchParams({
        startDate,
        endDate,
        limit: 1000 // Get all worksheets for accurate stats
      });
      
      // Remove other filters for comprehensive stats
      const response = await api.get(`/worksheets/admin/all?${params}`);
      
      if (response.data.success) {
        const allWorksheets = response.data.data.worksheets;
        calculateStatsFromData(allWorksheets);
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      // Fallback to local calculation if API fails
      calculateStats();
    }
  };

  const calculateStatsFromData = (worksheetData) => {
    const totalWorksheets = worksheetData.length;
    const submittedWorksheets = worksheetData.filter(w => w.isSubmitted).length;
    const approvedWorksheets = worksheetData.filter(w => w.approvalStatus === 'Approved').length;
    const rejectedWorksheets = worksheetData.filter(w => w.approvalStatus === 'Rejected').length;
    const pendingWorksheets = worksheetData.filter(w => w.approvalStatus === 'Pending').length;
    
    // Calculate average productivity based on actual task completion
    let totalProductivity = 0;
    let worksheetsWithTasks = 0;
    
    worksheetData.forEach(worksheet => {
      if (worksheet.tasks && worksheet.tasks.length > 0) {
        const completedTasks = worksheet.tasks.filter(task => task.status === 'Completed').length;
        const productivity = (completedTasks / worksheet.tasks.length) * 100;
        totalProductivity += productivity;
        worksheetsWithTasks++;
      } else if (worksheet.totalTasksPlanned > 0) {
        // Fallback to planned/completed totals if task array not available
        const productivity = (worksheet.totalTasksCompleted / worksheet.totalTasksPlanned) * 100;
        totalProductivity += productivity;
        worksheetsWithTasks++;
      }
    });
    
    const averageProductivity = worksheetsWithTasks > 0 
      ? totalProductivity / worksheetsWithTasks 
      : 0;

    const newStats = {
      totalWorksheets,
      submittedWorksheets,
      approvedWorksheets,
      rejectedWorksheets,
      pendingWorksheets,
      averageProductivity: parseFloat(averageProductivity.toFixed(1))
    };

    setStats(newStats);
    
    console.log('📊 Stats calculated from', worksheetData.length, 'worksheets:', {
      total: totalWorksheets,
      approved: approvedWorksheets,
      rejected: rejectedWorksheets,
      pending: pendingWorksheets,
      avgProductivity: averageProductivity.toFixed(1) + '%'
    });
  };

  const calculateStats = (worksheetData = worksheets) => {
    calculateStatsFromData(worksheetData);
  };

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

  // Refresh all data
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWorksheets(),
        fetchEmployees(),
        fetchStats()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Export worksheets
  const handleExport = async (format = 'json') => {
    try {
      setExporting(true);
      
      const params = new URLSearchParams(filters);
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          params.delete(key);
        }
      });

      params.append('format', format);

      console.log('📥 Exporting worksheets with params:', Object.fromEntries(params));

      if (format === 'csv') {
        // For CSV, we need to handle the response differently
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/worksheets/admin/export?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `worksheets_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('Worksheets exported successfully as CSV');
      } else {
        const response = await api.get(`/worksheets/admin/export?${params}`);
        
        if (response.data.success) {
          const dataStr = JSON.stringify(response.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `worksheets_export_${new Date().toISOString().split('T')[0]}.json`;
          link.click();
          
          toast.success('Worksheets exported successfully as JSON');
        }
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      toast.error('Failed to export worksheets');
    } finally {
      setExporting(false);
    }
  };

  // View worksheet details
  const viewWorksheetDetails = async (worksheet) => {
    try {
      const response = await api.get(`/worksheets/${worksheet._id}`);
      if (response.data.success) {
        setSelectedWorksheet(response.data.data.worksheet);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('❌ Error fetching worksheet details:', error);
      toast.error('Failed to fetch worksheet details');
    }
  };

  // Approve/Reject worksheet
  const handleWorksheetAction = async (worksheetId, status, feedback = '') => {
    try {
      const response = await api.put(`/worksheets/${worksheetId}/approve`, {
        status,
        feedback
      });

      if (response.data.success) {
        toast.success(`Worksheet ${status.toLowerCase()} successfully`);
        fetchWorksheets(); // Refresh list
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error('❌ Error updating worksheet:', error);
      toast.error(`Failed to ${status.toLowerCase()} worksheet`);
    }
  };

  // Get status badge color
  const getStatusBadge = (status, isSubmitted) => {
    if (!isSubmitted) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Draft</span>;
    }
    
    switch (status) {
      case 'Approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">Approved</span>;
      case 'Rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">Rejected</span>;
      case 'Needs Review':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600">Needs Review</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">Pending</span>;
    }
  };

  // Get productivity color
  const getProductivityColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      department: '',
      role: '',
      employeeId: '',
      status: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (!['Admin', 'HR', 'Manager'].includes(user?.role)) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Worksheet Management</h1>
        <p className="text-gray-600 mt-2">Manage and review employee worksheets</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Worksheets</p>
                <p className="text-2xl font-bold">{stats.totalWorksheets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{stats.approvedWorksheets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejectedWorksheets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingWorksheets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg Productivity</p>
                <p className={`text-2xl font-bold ${getProductivityColor(stats.averageProductivity)}`}>
                  {stats.averageProductivity}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <option value="">All Departments</option>
                {filterOptions.departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">All Roles</option>
                {filterOptions.roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Employee Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Employee</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.employeeId}
                onChange={(e) => handleFilterChange('employeeId', e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Needs Review">Needs Review</option>
              </select>
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by employee name or task..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>

            <Button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export JSON'}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Worksheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Worksheets ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading worksheets...</span>
            </div>
          ) : worksheets.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No worksheets found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th 
                        className="text-left p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('employee')}
                      >
                        Employee {sorting.sortBy === 'employee' && (sorting.sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="text-left p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('department')}
                      >
                        Department {sorting.sortBy === 'department' && (sorting.sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="text-left p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('date')}
                      >
                        Date {sorting.sortBy === 'date' && (sorting.sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left p-3">Tasks</th>
                      <th 
                        className="text-left p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('productivity')}
                      >
                        Productivity {sorting.sortBy === 'productivity' && (sorting.sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {worksheets.map((worksheet) => (
                      <tr key={worksheet._id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">
                              {worksheet.employee.firstName} {worksheet.employee.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {worksheet.employee.employeeId}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{worksheet.employee.department}</p>
                            <p className="text-sm text-gray-500">{worksheet.employee.role}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          {new Date(worksheet.date).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p>Planned: {worksheet.totalTasksPlanned}</p>
                            <p>Completed: {worksheet.totalTasksCompleted}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`font-bold ${getProductivityColor(worksheet.productivityScore)}`}>
                            {worksheet.productivityScore}%
                          </span>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(worksheet.approvalStatus, worksheet.isSubmitted)}
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewWorksheetDetails(worksheet)}
                            className="flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} worksheets
                  </p>
                  
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
                    
                    <span className="flex items-center px-3 py-2 text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    
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

      {/* Worksheet Details Modal */}
      {showDetailsModal && selectedWorksheet && (
        <WorksheetDetailsModal
          worksheet={selectedWorksheet}
          onClose={() => setShowDetailsModal(false)}
          onAction={handleWorksheetAction}
          userRole={user.role}
        />
      )}
    </div>
  );
};

// Worksheet Details Modal Component
const WorksheetDetailsModal = ({ worksheet, onClose, onAction, userRole }) => {
  const [feedback, setFeedback] = useState(worksheet.feedback || '');
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (status) => {
    setActionLoading(true);
    await onAction(worksheet._id, status, feedback);
    setActionLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {worksheet.employee.firstName} {worksheet.employee.lastName}'s Worksheet
              </h2>
              <p className="text-gray-600">
                {new Date(worksheet.date).toLocaleDateString()} • {worksheet.employee.department} • {worksheet.employee.role}
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{worksheet.totalTasksPlanned}</p>
                <p className="text-sm text-gray-600">Tasks Planned</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{worksheet.totalTasksCompleted}</p>
                <p className="text-sm text-gray-600">Tasks Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{worksheet.productivityScore}%</p>
                <p className="text-sm text-gray-600">Productivity</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm font-bold">
                  {worksheet.isSubmitted ? 'Submitted' : 'Draft'}
                </p>
                <p className="text-sm text-gray-600">{worksheet.approvalStatus}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tasks Detail */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Daily Tasks</h3>
            <div className="space-y-2">
              {worksheet.timeSlots.map((slot, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-20 text-sm font-medium">
                    {slot.hour}:00
                  </div>
                  <div className="flex-1 mx-4">
                    <p className="font-medium">{slot.task}</p>
                    {slot.project && (
                      <p className="text-sm text-gray-600">Project: {slot.project}</p>
                    )}
                    {slot.notes && (
                      <p className="text-sm text-gray-500">Notes: {slot.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      slot.status === 'Completed' ? 'bg-green-100 text-green-600' :
                      slot.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                      slot.status === 'Blocked' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {slot.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{slot.priority}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Section */}
          {['Admin', 'HR', 'Manager'].includes(userRole) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Feedback</h3>
              <textarea
                className="w-full p-3 border rounded-lg"
                rows={3}
                placeholder="Add feedback for this worksheet..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          {['Admin', 'HR', 'Manager'].includes(userRole) && worksheet.isSubmitted && worksheet.approvalStatus === 'Pending' && (
            <div className="flex gap-3">
              <Button
                onClick={() => handleAction('Approved')}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction('Needs Review')}
                disabled={actionLoading}
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Needs Review
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction('Rejected')}
                disabled={actionLoading}
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWorksheetPage;
