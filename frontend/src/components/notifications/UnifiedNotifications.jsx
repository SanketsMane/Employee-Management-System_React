import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Eye, 
  AlertTriangle, 
  Calendar, 
  MessageSquare, 
  Pin, 
  FileText, 
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Bug
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const UnifiedNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { socket } = useWebSocket();
  const { user } = useAuth();

  // Configuration objects
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

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchAnnouncements();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotificationCount();
        fetchAnnouncementCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('newNotification', handleNewNotification);
      socket.on('newAnnouncement', handleNewAnnouncement);
      return () => {
        socket.off('newNotification', handleNewNotification);
        socket.off('newAnnouncement', handleNewAnnouncement);
      };
    }
  }, [socket]);

  // Fetch regular notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=10');
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        const unread = response.data.data.notifications.filter(n => !n.isRead).length;
        setUnreadNotificationCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements?limit=10&notificationView=true');
      if (response.data.success) {
        setAnnouncements(response.data.data.announcements);
        const unread = response.data.data.announcements.filter(a => !a.isRead).length;
        setUnreadAnnouncementCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      if (response.data.success) {
        setUnreadNotificationCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  const fetchAnnouncementCount = async () => {
    try {
      const response = await api.get('/announcements?limit=10&notificationView=true');
      if (response.data.success) {
        const unread = response.data.data.announcements.filter(a => !a.isRead).length;
        setUnreadAnnouncementCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch announcement count:', error);
    }
  };

  const handleNewNotification = (notificationData) => {
    setNotifications(prev => [notificationData, ...prev.slice(0, 9)]);
    setUnreadNotificationCount(prev => prev + 1);
    
    toast.custom((t) => (
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-blue-500">
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Bell className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">New Notification</p>
              <p className="mt-1 text-sm text-gray-500">{notificationData.title}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-right' });
  };

  const handleNewAnnouncement = (announcementData) => {
    setAnnouncements(prev => [announcementData, ...prev.slice(0, 9)]);
    setUnreadAnnouncementCount(prev => prev + 1);
    
    const isUrgent = announcementData.priority === 'critical' || announcementData.type === 'urgent';
    toast.custom((t) => (
      <div className={`max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${
        isUrgent ? 'border-l-4 border-red-500' : 'border-l-4 border-orange-500'
      }`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {isUrgent ? (
                <AlertTriangle className="h-6 w-6 text-red-400" />
              ) : (
                <MessageSquare className="h-6 w-6 text-orange-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">New Announcement</p>
              <p className="mt-1 text-sm text-gray-500">{announcementData.title}</p>
              {isUrgent && (
                <Badge className="mt-1 bg-red-100 text-red-800" variant="outline">
                  {announcementData.priority === 'critical' ? 'Critical' : 'Urgent'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    ), { duration: isUrgent ? 8000 : 5000, position: 'top-right' });
  };

  // Notification handlers
  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => (Array.isArray(prev) ? prev : []).map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      const deletedNotif = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadNotificationCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Announcement handlers
  const markAnnouncementAsRead = async (announcementId) => {
    try {
      await api.post(`/announcements/${announcementId}/read`);
      setAnnouncements(prev => (Array.isArray(prev) ? prev : []).map(a => 
        a._id === announcementId ? { ...a, isRead: true, readAt: new Date().toISOString() } : a
      ));
      setUnreadAnnouncementCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
    }
  };

  const handleAcknowledgeAnnouncement = async (announcementId) => {
    try {
      await api.post(`/announcements/${announcementId}/acknowledge`);
      setAnnouncements(prev => (Array.isArray(prev) ? prev : []).map(a => 
        a._id === announcementId ? { ...a, isAcknowledged: true, acknowledgedAt: new Date().toISOString() } : a
      ));
      toast.success('Announcement acknowledged');
    } catch (error) {
      console.error('Failed to acknowledge announcement:', error);
      toast.error('Failed to acknowledge announcement');
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all notifications as read
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => (Array.isArray(prev) ? prev : []).map(n => ({ ...n, isRead: true })));
      setUnreadNotificationCount(0);

      // Mark all announcements as read
      const unreadAnnouncementIds = announcements
        .filter(a => !a.isRead)
        .map(a => a._id);
      
      if (unreadAnnouncementIds.length > 0) {
        await Promise.all(unreadAnnouncementIds.map(id => api.post(`/announcements/${id}/read`)));
        setAnnouncements(prev => (Array.isArray(prev) ? prev : []).map(a => ({ ...a, isRead: true, readAt: new Date().toISOString() })));
        setUnreadAnnouncementCount(0);
      }

      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'bug_report':
        return <Bug className="h-4 w-4 text-red-500" />;
      case 'bug_update':
        return <Bug className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  // Combine all items for "All" tab
  const allItems = [
    ...notifications.map(n => ({ ...n, itemType: 'notification' })),
    ...announcements.map(a => ({ ...a, itemType: 'announcement' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalUnreadCount = unreadNotificationCount + unreadAnnouncementCount;

  const NotificationItem = ({ item }) => {
    if (item.itemType === 'notification') {
      return (
        <Card className={`mb-3 ${!item.isRead ? 'border-blue-200 bg-blue-50' : ''}`}>
          <CardContent className="p-3">
            <div className="flex items-start space-x-3">
              {getNotificationIcon(item.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                    {item.title}
                    {!item.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(item._id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{item.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(item.createdAt)}</span>
                  {!item.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markNotificationAsRead(item._id)}
                      className="text-xs h-6 px-2"
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Announcement item
    const TypeIcon = typeConfig[item.type]?.icon || MessageSquare;
    const isUrgent = item.priority === 'critical' || item.type === 'urgent';
    const isPinned = item.type === 'urgent' || item.priority === 'critical';

    return (
      <Card className={`mb-3 cursor-pointer hover:bg-gray-50 transition-colors ${
        !item.isRead ? 'border-blue-200 bg-blue-50' : ''
      } ${isUrgent ? 'border-l-4 border-l-orange-400' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isPinned && <Pin className="h-3 w-3 text-red-500" />}
                <h4 className="text-sm font-semibold line-clamp-1 flex items-center gap-1">
                  {item.title}
                </h4>
                {!item.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
              </div>
              
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">{item.content}</p>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge className={priorityConfig[item.priority]?.color} variant="outline" size="sm">
                  {priorityConfig[item.priority]?.label}
                </Badge>
                <Badge className={typeConfig[item.type]?.color} variant="outline" size="sm">
                  <TypeIcon className="h-2 w-2 mr-1" />
                  {typeConfig[item.type]?.label}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{formatTimeAgo(item.createdAt)}</span>
                
                <div className="flex gap-1">
                  {!item.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAnnouncementAsRead(item._id);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Read
                    </Button>
                  )}
                  {item.requiresAcknowledgment && !item.isAcknowledged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcknowledgeAnnouncement(item._id);
                      }}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Ack
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {totalUnreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </div>
          {totalUnreadCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {totalUnreadCount} unread item{totalUnreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-3 mt-2">
            <TabsTrigger value="all" className="text-xs">
              All ({allItems.length})
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">
              Updates ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs">
              News ({announcements.length})
            </TabsTrigger>
          </TabsList>

          <div className="max-h-96 overflow-y-auto p-3">
            <TabsContent value="all" className="mt-0">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-3">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : allItems.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {allItems.map((item) => (
                    <NotificationItem key={`${item.itemType}-${item._id}`} item={item} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No updates yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <NotificationItem key={`notification-${notification._id}`} item={{...notification, itemType: 'notification'}} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="announcements" className="mt-0">
              {announcements.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No announcements yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {announcements.map((announcement) => (
                    <NotificationItem key={`announcement-${announcement._id}`} item={{...announcement, itemType: 'announcement'}} />
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {allItems.length > 0 && (
          <div className="border-t border-gray-200 p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm"
              onClick={() => {
                window.location.href = activeTab === 'announcements' ? '/announcements' : '/notifications';
                setIsOpen(false);
              }}
            >
              View all {activeTab === 'announcements' ? 'announcements' : activeTab === 'notifications' ? 'updates' : 'notifications'}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default UnifiedNotifications;
