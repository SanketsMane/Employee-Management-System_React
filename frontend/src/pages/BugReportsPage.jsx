import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Bug, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  MessageSquare
} from 'lucide-react';
import BugReportDialog from '@/components/BugReportDialog';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const BugReportsPage = () => {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedBugReport, setSelectedBugReport] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
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

  useEffect(() => {
    fetchBugReports();
  }, [filters, pagination.currentPage]);

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/bug-reports/my-reports?${params}`);
      setBugReports(response.data.data.bugReports);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching bug reports:', error);
      toast.error('Failed to fetch bug reports');
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
      console.error('Error fetching bug report details:', error);
      toast.error('Failed to fetch bug report details');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
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
          <div className="flex items-center justify-between text-sm text-gray-600">
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(report._id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </div>

          {report.assignedTo && (
            <div className="mt-3 flex items-center gap-1 text-sm text-gray-600">
              <User className="h-4 w-4" />
              Assigned to: {report.assignedTo.firstName} {report.assignedTo.lastName}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const BugReportDetailDialog = () => {
    if (!selectedBugReport) return null;

    const StatusIcon = statusConfig[selectedBugReport.status]?.icon || AlertTriangle;

    return (
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <p className="text-gray-700 whitespace-pre-wrap">{selectedBugReport.description}</p>
            </div>

            {/* Steps to Reproduce */}
            {selectedBugReport.stepsToReproduce && (
              <div>
                <h4 className="font-semibold mb-2">Steps to Reproduce</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedBugReport.stepsToReproduce}</p>
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

            {/* Assignment and Resolution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Assignment</h4>
                {selectedBugReport.assignedTo ? (
                  <p className="text-gray-700">
                    Assigned to: {selectedBugReport.assignedTo.firstName} {selectedBugReport.assignedTo.lastName}
                  </p>
                ) : (
                  <p className="text-gray-500">Not assigned yet</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Timeline</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Reported: {new Date(selectedBugReport.createdAt).toLocaleDateString()}</p>
                  {selectedBugReport.resolvedAt && (
                    <p>Resolved: {new Date(selectedBugReport.resolvedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            {selectedBugReport.adminNotes && (
              <div>
                <h4 className="font-semibold mb-2">Admin Notes</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedBugReport.adminNotes}</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bug Reports</h1>
          <p className="text-gray-600 mt-1">Track and manage your reported issues</p>
        </div>
        <Button onClick={() => setShowReportDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Bug
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bug Reports Yet</h3>
            <p className="text-gray-600 mb-4">
              You haven't reported any bugs yet. Click the button above to report your first bug.
            </p>
            <Button onClick={() => setShowReportDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Report Your First Bug
            </Button>
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
      <BugReportDialog 
        open={showReportDialog} 
        onOpenChange={setShowReportDialog}
      />
      
      <BugReportDetailDialog />
    </div>
  );
};

export default BugReportsPage;
