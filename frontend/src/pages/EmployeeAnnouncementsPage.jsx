import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Megaphone, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  Bell,
  MessageSquare,
  Star,
  Pin,
  User,
  Building2,
  Users,
  Target,
  Mail,
  Check,
  X,
  ExternalLink,
  FileText,
  Settings
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const EmployeeAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all', // all, unread, read, acknowledged, pending_ack
    search: ''
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    pendingAck: 0,
    urgent: 0
  });

  const typeConfig = {
    general: { label: 'General', color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    policy: { label: 'Policy', color: 'bg-purple-100 text-purple-800', icon: FileText },
    event: { label: 'Event', color: 'bg-green-100 text-green-800', icon: Calendar },
    system: { label: 'System', color: 'bg-orange-100 text-orange-800', icon: Settings },
    holiday: { label: 'Holiday', color: 'bg-pink-100 text-pink-800', icon: Calendar }
  };

  const priorityConfig = {
    low: { label: 'Low', color: 'bg-green-100 text-green-800' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
  };

  const targetTypeConfig = {
    all: { label: 'All Employees', icon: Users },
    role: { label: 'Role-based', icon: User },
    department: { label: 'Department', icon: Building2 },
    specific: { label: 'Targeted', icon: Target }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [filters, pagination.currentPage]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 20,
        ...(filters.type && filters.type !== 'all' && { type: filters.type }),
        ...(filters.priority && filters.priority !== 'all' && { priority: filters.priority }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/announcements?${params}`);
      setAnnouncements(response.data.data.announcements || []);
      setPagination(response.data.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
      });
      setStats(response.data.data.stats || {
        total: 0,
        unread: 0,
        pendingAck: 0,
        urgent: 0
      });
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast.error('Failed to fetch announcements');
      // Set fallback values on error
      setAnnouncements([]);
      setStats({
        total: 0,
        unread: 0,
        pendingAck: 0,
        urgent: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (announcementId) => {
    try {
      await api.post(`/announcements/${announcementId}/read`);
      
      // Update local state
      setAnnouncements(prev => 
        (Array.isArray(prev) ? prev : []).map(ann => 
          ann._id === announcementId 
            ? { ...ann, isRead: true, readAt: new Date().toISOString() }
            : ann
        )
      );
      
      // Update stats
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleAcknowledge = async (announcementId) => {
    try {
      await api.post(`/announcements/${announcementId}/acknowledge`);
      toast.success('Announcement acknowledged');
      
      // Update local state
      setAnnouncements(prev => 
        (Array.isArray(prev) ? prev : []).map(ann => 
          ann._id === announcementId 
            ? { ...ann, isAcknowledged: true, acknowledgedAt: new Date().toISOString() }
            : ann
        )
      );
      
      // Update stats
      setStats(prev => ({ ...prev, pendingAck: Math.max(0, prev.pendingAck - 1) }));
    } catch (error) {
      toast.error('Failed to acknowledge announcement');
    }
  };

  const handleViewDetails = async (announcement) => {
    // Mark as read if not already read
    if (!announcement.isRead) {
      await handleMarkAsRead(announcement._id);
    }
    
    setSelectedAnnouncement(announcement);
    setShowDetailDialog(true);
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const getAnnouncementStatus = (announcement) => {
    if (announcement.requiresAcknowledgment && !announcement.isAcknowledged) {
      return { label: 'Needs Acknowledgment', color: 'bg-orange-100 text-orange-800', icon: Clock };
    }
    if (!announcement.isRead) {
      return { label: 'Unread', color: 'bg-blue-100 text-blue-800', icon: Bell };
    }
    if (announcement.isAcknowledged) {
      return { label: 'Acknowledged', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
    return { label: 'Read', color: 'bg-gray-100 text-gray-800', icon: Eye };
  };

  const AnnouncementCard = ({ announcement }) => {
    const TypeIcon = typeConfig[announcement.type]?.icon || MessageSquare;
    const status = getAnnouncementStatus(announcement);
    const StatusIcon = status.icon;
    const isUrgent = announcement.priority === 'critical' || announcement.priority === 'high';
    const isPinned = announcement.type === 'urgent' || announcement.priority === 'critical';

    return (
      <Card 
        className={`hover:shadow-md transition-all cursor-pointer ${
          !announcement.isRead ? 'ring-2 ring-blue-200' : ''
        } ${isUrgent ? 'border-orange-200' : ''}`}
        onClick={() => handleViewDetails(announcement)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
                  {isPinned && <Pin className="h-4 w-4 text-red-500" />}
                  {announcement.title}
                </CardTitle>
                {!announcement.isRead && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {announcement.content}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <Badge className={priorityConfig[announcement.priority]?.color} variant="outline">
                {priorityConfig[announcement.priority]?.label}
              </Badge>
              <Badge className={typeConfig[announcement.type]?.color} variant="outline">
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConfig[announcement.type]?.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {announcement.createdBy.firstName} {announcement.createdBy.lastName}
              </div>
              <div className="flex items-center gap-1">
                {targetTypeConfig[announcement.targetType]?.icon && 
                  React.createElement(targetTypeConfig[announcement.targetType].icon, { className: "h-4 w-4" })
                }
                {targetTypeConfig[announcement.targetType]?.label}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={status.color} variant="outline">
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              {announcement.sendEmail && (
                <Badge variant="outline" className="text-blue-600">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Badge>
              )}
              {announcement.expiresAt && new Date(announcement.expiresAt) < new Date() && (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  Expired
                </Badge>
              )}
            </div>

            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {!announcement.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAsRead(announcement._id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Mark Read
                </Button>
              )}
              {announcement.requiresAcknowledgment && !announcement.isAcknowledged && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAcknowledge(announcement._id)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Acknowledge
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const AnnouncementDetailDialog = () => {
    if (!selectedAnnouncement) return null;

    const TypeIcon = typeConfig[selectedAnnouncement.type]?.icon || MessageSquare;
    const status = getAnnouncementStatus(selectedAnnouncement);

    return (
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-500" />
              Announcement Details
            </DialogTitle>
            <DialogDescription>
              View announcement details and take actions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  {(selectedAnnouncement.type === 'urgent' || selectedAnnouncement.priority === 'critical') && 
                    <Pin className="h-5 w-5 text-red-500" />
                  }
                  {selectedAnnouncement.title}
                </h3>
                <div className="flex gap-2 mb-4">
                  <Badge className={priorityConfig[selectedAnnouncement.priority]?.color} variant="outline">
                    {priorityConfig[selectedAnnouncement.priority]?.label} Priority
                  </Badge>
                  <Badge className={typeConfig[selectedAnnouncement.type]?.color} variant="outline">
                    <TypeIcon className="h-3 w-3 mr-1" />
                    {typeConfig[selectedAnnouncement.type]?.label}
                  </Badge>
                  <Badge className={status.color} variant="outline">
                    {React.createElement(status.icon, { className: "h-3 w-3 mr-1" })}
                    {status.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <h4 className="font-semibold mb-2">Message</h4>
              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </div>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Details</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">From:</span> {selectedAnnouncement.createdBy.firstName} {selectedAnnouncement.createdBy.lastName}</p>
                  <p><span className="font-medium">Role:</span> {selectedAnnouncement.createdBy.role}</p>
                  <p><span className="font-medium">Posted:</span> {new Date(selectedAnnouncement.createdAt).toLocaleString()}</p>
                  <p><span className="font-medium">Target:</span> {targetTypeConfig[selectedAnnouncement.targetType]?.label}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Read:</span> {selectedAnnouncement.isRead ? 'Yes' : 'No'}</p>
                  {selectedAnnouncement.isRead && selectedAnnouncement.readAt && (
                    <p><span className="font-medium">Read at:</span> {new Date(selectedAnnouncement.readAt).toLocaleString()}</p>
                  )}
                  {selectedAnnouncement.requiresAcknowledgment && (
                    <>
                      <p><span className="font-medium">Acknowledged:</span> {selectedAnnouncement.isAcknowledged ? 'Yes' : 'No'}</p>
                      {selectedAnnouncement.isAcknowledged && selectedAnnouncement.acknowledgedAt && (
                        <p><span className="font-medium">Acknowledged at:</span> {new Date(selectedAnnouncement.acknowledgedAt).toLocaleString()}</p>
                      )}
                    </>
                  )}
                  {selectedAnnouncement.expiresAt && (
                    <p><span className="font-medium">Expires:</span> {new Date(selectedAnnouncement.expiresAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {selectedAnnouncement.tags?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedAnnouncement.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              {!selectedAnnouncement.isRead && (
                <Button
                  onClick={() => {
                    handleMarkAsRead(selectedAnnouncement._id);
                    setSelectedAnnouncement(prev => ({ ...prev, isRead: true, readAt: new Date().toISOString() }));
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Mark as Read
                </Button>
              )}
              {selectedAnnouncement.requiresAcknowledgment && !selectedAnnouncement.isAcknowledged && (
                <Button
                  onClick={() => {
                    handleAcknowledge(selectedAnnouncement._id);
                    setSelectedAnnouncement(prev => ({ ...prev, isAcknowledged: true, acknowledgedAt: new Date().toISOString() }));
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
              )}
            </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Stay updated with company announcements</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Announcements</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Megaphone className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.unread || 0}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Acknowledgment</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.pendingAck || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats?.urgent || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search announcements..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
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

            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="pending_ack">Needs Acknowledgment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
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
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Announcements</h3>
            <p className="text-gray-600">
              {filters.search || filters.type !== 'all' || filters.priority !== 'all' || filters.status !== 'all'
                ? "No announcements match your current filters."
                : "You don't have any announcements yet."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement._id} announcement={announcement} />
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

      {/* Detail Dialog */}
      <AnnouncementDetailDialog />
    </div>
  );
};

export default EmployeeAnnouncementsPage;
