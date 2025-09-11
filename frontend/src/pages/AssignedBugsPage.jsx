import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  MessageSquare,
  Edit,
  Save,
  History,
  Info
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const AssignedBugsPage = () => {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedBugReport, setSelectedBugReport] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    resolution: '',
    workNotes: '',
    estimatedTimeHours: ''
  });
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [summary, setSummary] = useState({ status: [] });

  const statusConfig = {
    open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
    'in-progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
    'needs-more-info': { label: 'Needs More Info', color: 'bg-orange-100 text-orange-800', icon: Info }
  };

  const priorityConfig = {
    low: { label: 'Low', color: 'bg-green-100 text-green-800' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
  };

  useEffect(() => {
    fetchAssignedBugs();
  }, [filters, pagination.currentPage]);

  const fetchAssignedBugs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/bug-reports/assigned-to-me?${params}`);
      setBugReports(response.data.data.bugReports);
      setPagination(response.data.data.pagination);
      setSummary(response.data.data.summary);
    } catch (error) {
      toast.error('Failed to fetch assigned bug reports');
    } finally {
      setLoading(false);
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

  const handleUpdateBug = useCallback((bugReport) => {
    setSelectedBugReport(bugReport);
    setUpdateForm({
      status: bugReport.status,
      resolution: bugReport.resolution || '',
      workNotes: bugReport.workNotes || '',
      estimatedTimeHours: bugReport.estimatedTimeHours || ''
    });
    setShowUpdateDialog(true);
  }, []);

  const handleSubmitUpdate = useCallback(async () => {
    try {
      const response = await api.put(`/bug-reports/${selectedBugReport._id}/update`, updateForm);
      toast.success('Bug report updated successfully');
      setShowUpdateDialog(false);
      fetchAssignedBugs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update bug report');
    }
  }, [selectedBugReport, updateForm]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Stable form field handlers
  const handleStatusChange = useCallback((value) => {
    setUpdateForm(prev => ({ ...prev, status: value }));
  }, []);

  const handleResolutionChange = useCallback((e) => {
    setUpdateForm(prev => ({ ...prev, resolution: e.target.value }));
  }, []);

  const handleWorkNotesChange = useCallback((e) => {
    setUpdateForm(prev => ({ ...prev, workNotes: e.target.value }));
  }, []);

  const handleEstimatedTimeChange = useCallback((e) => {
    setUpdateForm(prev => ({ ...prev, estimatedTimeHours: e.target.value }));
  }, []);

  const BugCard = ({ report }) => {
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
                <Calendar className="h-4 w-4" />
                {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {report.category}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
            <User className="h-4 w-4" />
            Reported by: {report.reportedBy.firstName} {report.reportedBy.lastName}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(report._id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleUpdateBug(report)}
              disabled={report.status === 'closed' || report.status === 'rejected'}
            >
              <Edit className="h-4 w-4 mr-1" />
              Update Status
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const UpdateBugDialog = useMemo(() => {
    if (!selectedBugReport) return null;

    return (
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Update Bug Report
            </DialogTitle>
            <DialogDescription>
              {selectedBugReport.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bug-status">Status</Label>
                <Select value={updateForm.status} onValueChange={handleStatusChange}>
                  <SelectTrigger id="bug-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="needs-more-info">Needs More Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated-time">Estimated Hours</Label>
                <Input
                  id="estimated-time"
                  type="number"
                  placeholder="e.g., 2.5"
                  value={updateForm.estimatedTimeHours || ''}
                  onChange={handleEstimatedTimeChange}
                  min="0"
                  step="0.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-notes">Work Notes</Label>
              <Textarea
                id="work-notes"
                placeholder="Describe what you've done to investigate or fix this bug..."
                value={updateForm.workNotes || ''}
                onChange={handleWorkNotesChange}
                className="min-h-[100px]"
                autoComplete="off"
              />
            </div>

            {updateForm.status === 'resolved' && (
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Textarea
                  id="resolution"
                  placeholder="Describe how this bug was resolved..."
                  value={updateForm.resolution || ''}
                  onChange={handleResolutionChange}
                  className="min-h-[100px]"
                  autoComplete="off"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitUpdate}>
              <Save className="h-4 w-4 mr-2" />
              Update Bug Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }, [selectedBugReport, showUpdateDialog, updateForm, handleStatusChange, handleEstimatedTimeChange, handleWorkNotesChange, handleResolutionChange, handleSubmitUpdate]);

  const BugDetailDialog = () => {
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

            {/* Work Notes and Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Reporter Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedBugReport.reportedBy.firstName} {selectedBugReport.reportedBy.lastName}</p>
                  <p><span className="font-medium">Email:</span> {selectedBugReport.reportedBy.email}</p>
                  <p><span className="font-medium">Role:</span> {selectedBugReport.reportedBy.role}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Timeline</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Reported: {new Date(selectedBugReport.createdAt).toLocaleDateString()}</p>
                  {selectedBugReport.resolvedAt && (
                    <p>Resolved: {new Date(selectedBugReport.resolvedAt).toLocaleDateString()}</p>
                  )}
                  {selectedBugReport.estimatedTimeHours && (
                    <p>Estimated Time: {selectedBugReport.estimatedTimeHours} hours</p>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            {selectedBugReport.adminNotes && (
              <div>
                <h4 className="font-semibold mb-2">Admin Notes</h4>
                <p className="text-gray-700 bg-blue-50 p-3 rounded">{selectedBugReport.adminNotes}</p>
              </div>
            )}

            {/* Work Notes */}
            {selectedBugReport.workNotes && (
              <div>
                <h4 className="font-semibold mb-2">Work Notes</h4>
                <p className="text-gray-700 bg-yellow-50 p-3 rounded">{selectedBugReport.workNotes}</p>
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

            {/* Work Log */}
            {selectedBugReport.workLog && selectedBugReport.workLog.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Work Log
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedBugReport.workLog.map((log, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-gray-500">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      {log.notes && <p className="text-sm mt-1">{log.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Browser Information */}
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
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const StatusSummary = () => {
    const statusCounts = summary.status.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = statusCounts[status] || 0;
          const Icon = config.icon;
          return (
            <Card key={status} className="text-center">
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <Icon className={`h-8 w-8 ${config.color.includes('blue') ? 'text-blue-600' : 
                    config.color.includes('yellow') ? 'text-yellow-600' :
                    config.color.includes('green') ? 'text-green-600' :
                    config.color.includes('red') ? 'text-red-600' :
                    config.color.includes('orange') ? 'text-orange-600' : 'text-gray-600'}`} />
                </div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600">{config.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assigned Bug Reports</h1>
          <p className="text-gray-600 mt-1">Manage bugs assigned to you</p>
        </div>
      </div>

      {/* Status Summary */}
      <StatusSummary />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search assigned bugs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assigned Bugs</h3>
            <p className="text-gray-600">
              You don't have any bugs assigned to you at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bugReports.map((report) => (
            <BugCard key={report._id} report={report} />
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
      <BugDetailDialog />
      {UpdateBugDialog}
    </div>
  );
};

export default AssignedBugsPage;
