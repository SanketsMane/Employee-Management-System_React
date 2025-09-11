import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Megaphone, 
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
  Edit,
  Trash2,
  Send,
  Users,
  Building2,
  Target,
  Mail,
  Bell,
  MessageSquare,
  FileText,
  Settings
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

// Memoized Create Announcement Dialog Component
const CreateAnnouncementDialog = React.memo(({ 
  isOpen, 
  onClose, 
  createForm, 
  onFormChange, 
  onSubmit, 
  roles, 
  departments, 
  users,
  typeConfig,
  priorityConfig,
  targetTypeConfig 
}) => {
  const handleInputChange = useCallback((field, value) => {
    onFormChange(field, value);
  }, [onFormChange]);

  const handleCheckboxChange = useCallback((field, userId, checked) => {
    const currentArray = createForm[field] || [];
    const newArray = checked 
      ? [...currentArray, userId]
      : currentArray.filter(id => id !== userId);
    onFormChange(field, newArray);
  }, [createForm, onFormChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-500" />
            Create New Announcement
          </DialogTitle>
          <DialogDescription>
            Send announcements to employees with targeting options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Announcement title..."
                value={createForm.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={createForm.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Announcement content..."
              value={createForm.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          {/* Targeting and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={createForm.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetType">Target Audience</Label>
              <Select value={createForm.targetType} onValueChange={(value) => handleInputChange('targetType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(targetTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target-specific options */}
          {createForm.targetType === 'role' && (
            <div className="space-y-2">
              <Label>Target Roles</Label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(role => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={createForm.targetRoles.includes(role)}
                      onCheckedChange={(checked) => handleCheckboxChange('targetRoles', role, checked)}
                    />
                    <Label htmlFor={`role-${role}`} className="text-sm">{role}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {createForm.targetType === 'department' && (
            <div className="space-y-2">
              <Label>Target Departments</Label>
              <div className="grid grid-cols-2 gap-2">
                {departments.map(dept => (
                  <div key={dept} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${dept}`}
                      checked={createForm.targetDepartments.includes(dept)}
                      onCheckedChange={(checked) => handleCheckboxChange('targetDepartments', dept, checked)}
                    />
                    <Label htmlFor={`dept-${dept}`} className="text-sm">{dept}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {createForm.targetType === 'specific' && (
            <div className="space-y-2">
              <Label>Target Users</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                {users.map(user => (
                  <div key={user._id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`user-${user._id}`}
                      checked={createForm.targetUsers.includes(user._id)}
                      onCheckedChange={(checked) => handleCheckboxChange('targetUsers', user._id, checked)}
                    />
                    <Label htmlFor={`user-${user._id}`} className="text-sm">
                      {user.firstName} {user.lastName} ({user.role})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expires">Expires At (Optional)</Label>
              <Input
                id="expires"
                type="datetime-local"
                value={createForm.expiresAt}
                onChange={(e) => handleInputChange('expiresAt', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="urgent, company-wide, policy..."
                value={createForm.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresAck"
                checked={createForm.requiresAcknowledgment}
                onCheckedChange={(checked) => handleInputChange('requiresAcknowledgment', checked)}
              />
              <Label htmlFor="requiresAck">Requires Acknowledgment</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={createForm.sendEmail}
                onCheckedChange={(checked) => handleInputChange('sendEmail', checked)}
              />
              <Label htmlFor="sendEmail">Send Email Notification</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            <Send className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

CreateAnnouncementDialog.displayName = 'CreateAnnouncementDialog';

const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles] = useState([
    'Admin', 'HR', 'Manager', 'Team Lead', 'Employee', 
    'Software developer trainee', 'Associate software developer', 
    'Full stack developer', 'Dot net developer', 'UI UX designer', 
    'Flutter developer', 'React native developer', 'Java developer'
  ]);
  
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    targetType: 'all',
    search: ''
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    urgent: 0,
    requiresAck: 0
  });
  
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    targetType: 'all',
    targetRoles: [],
    targetDepartments: [],
    targetUsers: [],
    requiresAcknowledgment: false,
    sendEmail: true,
    expiresAt: '',
    tags: ''
  });

  const typeConfig = useMemo(() => ({
    general: { label: 'General', color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    policy: { label: 'Policy', color: 'bg-purple-100 text-purple-800', icon: FileText },
    event: { label: 'Event', color: 'bg-green-100 text-green-800', icon: Calendar },
    system: { label: 'System', color: 'bg-orange-100 text-orange-800', icon: Settings },
    holiday: { label: 'Holiday', color: 'bg-pink-100 text-pink-800', icon: Calendar }
  }), []);

  const priorityConfig = useMemo(() => ({
    low: { label: 'Low', color: 'bg-green-100 text-green-800' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
  }), []);

  const targetTypeConfig = useMemo(() => ({
    all: { label: 'All Employees', icon: Users },
    role: { label: 'Specific Roles', icon: User },
    department: { label: 'Departments', icon: Building2 },
    specific: { label: 'Specific Users', icon: Target }
  }), []);

  useEffect(() => {
    fetchAnnouncements();
    fetchUsers();
    fetchDepartments();
  }, [filters, pagination.currentPage]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 20,
        ...(filters.type && filters.type !== 'all' && { type: filters.type }),
        ...(filters.priority && filters.priority !== 'all' && { priority: filters.priority }),
        ...(filters.targetType && filters.targetType !== 'all' && { targetType: filters.targetType }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/announcements/admin?${params}`);
      setAnnouncements(response.data.data.announcements || []);
      setPagination(response.data.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
      });
      setStats(response.data.data.stats || {
        total: 0,
        active: 0,
        urgent: 0,
        requiresAck: 0
      });
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast.error('Failed to fetch announcements');
      // Set fallback values on error
      setAnnouncements([]);
      setStats({
        total: 0,
        active: 0,
        urgent: 0,
        requiresAck: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/employees');
      if (response.data.success) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/users/departments');
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleCreateAnnouncement = useCallback(async () => {
    try {
      const formData = {
        ...createForm,
        tags: createForm.tags ? createForm.tags.split(',').map(tag => tag.trim()) : [],
        expiresAt: createForm.expiresAt || null
      };

      const response = await api.post('/announcements', formData);
      toast.success('Announcement created successfully');
      setShowCreateDialog(false);
      resetCreateForm();
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    }
  }, [createForm]);

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  const handleViewDetails = async (announcementId) => {
    try {
      const response = await api.get(`/announcements/${announcementId}`);
      setSelectedAnnouncement(response.data.data);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('Failed to fetch announcement details');
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      content: '',
      type: 'general',
      priority: 'medium',
      targetType: 'all',
      targetRoles: [],
      targetDepartments: [],
      targetUsers: [],
      requiresAcknowledgment: false,
      sendEmail: true,
      expiresAt: '',
      tags: ''
    });
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleFormChange = useCallback((key, value) => {
    setCreateForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCloseDialog = useCallback(() => {
    setShowCreateDialog(false);
  }, []);

  const AnnouncementCard = ({ announcement }) => {
    const TypeIcon = typeConfig[announcement.type]?.icon || MessageSquare;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2 line-clamp-2">
                {announcement.title}
              </CardTitle>
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
                <Users className="h-4 w-4" />
                {targetTypeConfig[announcement.targetType]?.label}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {announcement.readCount || 0} reads
              </div>
              {announcement.requiresAcknowledgment && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {announcement.acknowledgmentCount || 0} acks
                </div>
              )}
              {announcement.sendEmail && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email sent
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(announcement._id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteAnnouncement(announcement._id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const AnnouncementDetailDialog = () => {
    if (!selectedAnnouncement) return null;

    const TypeIcon = typeConfig[selectedAnnouncement.type]?.icon || MessageSquare;

    return (
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-500" />
              Announcement Details
            </DialogTitle>
            <DialogDescription>
              View announcement details and engagement metrics
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{selectedAnnouncement.title}</h3>
                <div className="flex gap-2 mb-4">
                  <Badge className={priorityConfig[selectedAnnouncement.priority]?.color} variant="outline">
                    {priorityConfig[selectedAnnouncement.priority]?.label} Priority
                  </Badge>
                  <Badge className={typeConfig[selectedAnnouncement.type]?.color} variant="outline">
                    <TypeIcon className="h-3 w-3 mr-1" />
                    {typeConfig[selectedAnnouncement.type]?.label}
                  </Badge>
                  <Badge variant="outline">
                    {targetTypeConfig[selectedAnnouncement.targetType]?.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <h4 className="font-semibold mb-2">Content</h4>
              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </div>
            </div>

            {/* Targeting Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Targeting</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Type:</span> {targetTypeConfig[selectedAnnouncement.targetType]?.label}</p>
                  {selectedAnnouncement.targetRoles?.length > 0 && (
                    <p><span className="font-medium">Roles:</span> {selectedAnnouncement.targetRoles.join(', ')}</p>
                  )}
                  {selectedAnnouncement.targetDepartments?.length > 0 && (
                    <p><span className="font-medium">Departments:</span> {selectedAnnouncement.targetDepartments.join(', ')}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Engagement</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Views:</span> {selectedAnnouncement.readCount || 0}</p>
                  <p><span className="font-medium">Acknowledgments:</span> {selectedAnnouncement.acknowledgmentCount || 0}</p>
                  <p><span className="font-medium">Email Sent:</span> {selectedAnnouncement.sendEmail ? 'Yes' : 'No'}</p>
                  <p><span className="font-medium">Requires Ack:</span> {selectedAnnouncement.requiresAcknowledgment ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Meta Information */}
            <div>
              <h4 className="font-semibold mb-2">Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Created by:</span> {selectedAnnouncement.createdBy.firstName} {selectedAnnouncement.createdBy.lastName}</p>
                  <p><span className="font-medium">Created:</span> {new Date(selectedAnnouncement.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  {selectedAnnouncement.expiresAt && (
                    <p><span className="font-medium">Expires:</span> {new Date(selectedAnnouncement.expiresAt).toLocaleDateString()}</p>
                  )}
                  {selectedAnnouncement.tags?.length > 0 && (
                    <p><span className="font-medium">Tags:</span> {selectedAnnouncement.tags.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Read List */}
            {selectedAnnouncement.readBy?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Read By ({selectedAnnouncement.readBy.length})</h4>
                <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded">
                  {selectedAnnouncement.readBy.map((read, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{read.user.firstName} {read.user.lastName}</span>
                      <span>{new Date(read.readAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acknowledgment List */}
            {selectedAnnouncement.acknowledgedBy?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Acknowledged By ({selectedAnnouncement.acknowledgedBy.length})</h4>
                <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded">
                  {selectedAnnouncement.acknowledgedBy.map((ack, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{ack.user.firstName} {ack.user.lastName}</span>
                      <span>{new Date(ack.acknowledgedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
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
          <h1 className="text-3xl font-bold text-gray-900">Announcement Management</h1>
          <p className="text-gray-600 mt-1">Create and manage company announcements</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
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
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical/Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats?.urgent || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Requires Acknowledgment</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.requiresAck || 0}</p>
              </div>
              <Bell className="h-8 w-8 text-orange-500" />
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

            <Select value={filters.targetType} onValueChange={(value) => handleFilterChange('targetType', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                {Object.entries(targetTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Announcements Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first announcement to communicate with employees.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Announcement
            </Button>
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

      {/* Dialogs */}
      <CreateAnnouncementDialog 
        isOpen={showCreateDialog}
        onClose={handleCloseDialog}
        createForm={createForm}
        onFormChange={handleFormChange}
        onSubmit={handleCreateAnnouncement}
        roles={roles}
        departments={departments}
        users={users}
        typeConfig={typeConfig}
        priorityConfig={priorityConfig}
        targetTypeConfig={targetTypeConfig}
      />
      <AnnouncementDetailDialog />
    </div>
  );
};

export default AdminAnnouncementsPage;
