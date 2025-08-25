import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Edit,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Users
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const AdminBugReportsPage = () => {
  const [bugReports, setBugReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedBugReport, setSelectedBugReport] = useState(null);
  const [summary, setSummary] = useState({ status: [], priority: [] });
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [updateForm, setUpdateForm] = useState({
    status: '',
    assignedTo: 'unassigned',
    adminNotes: '',
    resolution: ''
  });

  const statusConfig = {
    open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
    'in-progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  const priorityConfig = {
    low: { label: 'Low', color: 'bg-green-100 text-green-800' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
  };

  const categories = [
    { value: 'ui/ux', label: 'UI/UX Issues' },
    { value: 'functionality', label: 'Functionality' },
    { value: 'performance', label: 'Performance' },
    { value: 'security', label: 'Security' },
    { value: 'data', label: 'Data Issues' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchBugReports();
    fetchUsers();
  }, [filters, pagination.currentPage]);

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.priority && filters.priority !== 'all' && { priority: filters.priority }),
        ...(filters.category && filters.category !== 'all' && { category: filters.category }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/bug-reports?${params}`);
      setBugReports(response.data.data.bugReports);
      setPagination(response.data.data.pagination);
      setSummary(response.data.data.summary);
    } catch (error) {
      toast.error('Failed to fetch bug reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.users || []);
    } catch (error) {
      // Silently handle error
    }
  };

  const handleViewDetails = async (bugReportId) => {
    try {
      const response = await api.get(`/bug-reports/${bugReportId}`);
      setSelectedBugReport(response.data.data);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('Failed to fetch bug report details');
    }
  };

  const handleUpdateBugReport = (bugReport) => {
    setSelectedBugReport(bugReport);
    setUpdateForm({
      status: bugReport.status,
      assignedTo: bugReport.assignedTo?._id || 'unassigned',
      adminNotes: bugReport.adminNotes || '',
      resolution: bugReport.resolution || ''
    });
    setShowUpdateDialog(true);
  };

  const handleSubmitUpdate = async () => {
    try {
      const updateData = {
        ...updateForm,
        assignedTo: updateForm.assignedTo === 'unassigned' ? null : updateForm.assignedTo
      };
      await api.put(`/bug-reports/${selectedBugReport._id}/status`, updateData);
      toast.success('Bug report updated successfully');
      setShowUpdateDialog(false);
      fetchBugReports();
    } catch (error) {
      toast.error('Failed to update bug report');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getStatusCount = (status) => {
    const statusItem = summary.status.find(item => item._id === status);
    return statusItem ? statusItem.count : 0;
  };

  const getPriorityCount = (priority) => {
    const priorityItem = summary.priority.find(item => item._id === priority);
    return priorityItem ? priorityItem.count : 0;
  };

  const BugReportCard = ({ report }) => {
    const StatusIcon = statusConfig[report.status]?.icon || AlertTriangle;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2 line-clamp-2">
                {report.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {report.description}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <Badge className={priorityConfig[report.priority]?.color} variant="outline">
                {priorityConfig[report.priority]?.label}
              </Badge>
              <Badge className={statusConfig[report.status]?.color} variant="outline">
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[report.status]?.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {report.reportedBy.firstName} {report.reportedBy.lastName}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {report.category}
              </div>
            </div>
          </div>

          {report.assignedTo && (
            <div className="mb-3 flex items-center gap-1 text-sm text-gray-600">
              <User className="h-4 w-4" />
              Assigned to: {report.assignedTo.firstName} {report.assignedTo.lastName}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(report._id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateBugReport(report)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Update
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const SummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Issues</p>
              <p className="text-2xl font-bold text-blue-600">{getStatusCount('open')}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{getStatusCount('in-progress')}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{getStatusCount('resolved')}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">{getPriorityCount('critical')}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const BugReportDetailDialog = () => {
    if (!selectedBugReport) return null;

    const StatusIcon = statusConfig[selectedBugReport.status]?.icon || AlertTriangle;

    return (
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-500" />
              Bug Report Details
            </DialogTitle>
            <DialogDescription>
              Report ID: {selectedBugReport._id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Information */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{selectedBugReport.title}</h3>
                <div className="flex gap-2 mb-4">
                  <Badge className={priorityConfig[selectedBugReport.priority]?.color} variant="outline">
                    {priorityConfig[selectedBugReport.priority]?.label} Priority
                  </Badge>
                  <Badge className={statusConfig[selectedBugReport.status]?.color} variant="outline">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[selectedBugReport.status]?.label}
                  </Badge>
                  <Badge variant="outline">
                    {selectedBugReport.category}
                  </Badge>
                </div>
              </div>
              <Button onClick={() => handleUpdateBugReport(selectedBugReport)}>
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            </div>

            {/* Reporter and Assignment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Reported By</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedBugReport.reportedBy.firstName} {selectedBugReport.reportedBy.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{selectedBugReport.reportedBy.email}</p>
                      <p className="text-sm text-gray-600">{selectedBugReport.reportedBy.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Assignment</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {selectedBugReport.assignedTo ? (
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {selectedBugReport.assignedTo.firstName} {selectedBugReport.assignedTo.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{selectedBugReport.assignedTo.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Not assigned yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                {selectedBugReport.description}
              </p>
            </div>

            {/* Steps to Reproduce */}
            {selectedBugReport.stepsToReproduce && (
              <div>
                <h4 className="font-semibold mb-2">Steps to Reproduce</h4>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {selectedBugReport.stepsToReproduce}
                </p>
              </div>
            )}

            {/* Screenshots */}
            {selectedBugReport.screenshots && selectedBugReport.screenshots.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Screenshots</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedBugReport.screenshots.map((screenshot, index) => (
                    <img
                      key={index}
                      src={screenshot.url}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                      onClick={() => window.open(screenshot.url, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {selectedBugReport.adminNotes && (
              <div>
                <h4 className="font-semibold mb-2">Admin Notes</h4>
                <p className="text-gray-700 bg-blue-50 p-3 rounded">{selectedBugReport.adminNotes}</p>
              </div>
            )}

            {/* Resolution */}
            {selectedBugReport.resolution && (
              <div>
                <h4 className="font-semibold mb-2">Resolution</h4>
                <p className="text-gray-700 bg-green-50 p-3 rounded">{selectedBugReport.resolution}</p>
                {selectedBugReport.resolvedBy && (
                  <p className="text-sm text-gray-600 mt-2">
                    Resolved by: {selectedBugReport.resolvedBy.firstName} {selectedBugReport.resolvedBy.lastName}
                  </p>
                )}
              </div>
            )}

            {/* System Information */}
            {selectedBugReport.browserInfo && (
              <div>
                <h4 className="font-semibold mb-2">System Information</h4>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p><span className="font-medium">Platform:</span> {selectedBugReport.browserInfo.platform}</p>
                  <p><span className="font-medium">URL:</span> {selectedBugReport.browserInfo.url}</p>
                  <p><span className="font-medium">User Agent:</span> {selectedBugReport.browserInfo.userAgent}</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h4 className="font-semibold mb-2">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Reported:</span>
                  <span>{new Date(selectedBugReport.createdAt).toLocaleString()}</span>
                </div>
                {selectedBugReport.resolvedAt && (
                  <div className="flex justify-between">
                    <span>Resolved:</span>
                    <span>{new Date(selectedBugReport.resolvedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const UpdateBugReportDialog = () => (
    <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Bug Report</DialogTitle>
          <DialogDescription>
            Update the status and assignment of this bug report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={updateForm.status} 
              onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assign To */}
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select 
              value={updateForm.assignedTo} 
              onValueChange={(value) => setUpdateForm(prev => ({ ...prev, assignedTo: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user to assign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.filter(user => ['Admin', 'HR', 'Manager'].includes(user.role)).map(user => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label>Admin Notes</Label>
            <Textarea
              placeholder="Add notes about this bug report..."
              value={updateForm.adminNotes}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, adminNotes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Resolution (only if status is resolved or closed) */}
          {(updateForm.status === 'resolved' || updateForm.status === 'closed') && (
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Textarea
                placeholder="Describe how this bug was resolved..."
                value={updateForm.resolution}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, resolution: e.target.value }))}
                rows={3}
                required
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitUpdate}
              disabled={
                (updateForm.status === 'resolved' || updateForm.status === 'closed') && 
                !updateForm.resolution
              }
              className="flex-1"
            >
              Update Bug Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bug Reports Management</h1>
        <p className="text-gray-600 mt-1">Monitor and manage all bug reports from users</p>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search bug reports..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bug Reports List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bugReports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bug Reports Found</h3>
            <p className="text-gray-600">No bug reports match your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bugReports.map((report) => (
            <BugReportCard key={report._id} report={report} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={!pagination.hasPrev}
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.hasNext}
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <BugReportDetailDialog />
      <UpdateBugReportDialog />
    </div>
  );
};

export default AdminBugReportsPage;
