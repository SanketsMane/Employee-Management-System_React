import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Eye, AlertTriangle, Calendar, MessageSquare, Pin, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useWebSocket } from '@/context/WebSocketContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const AnnouncementNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { socket } = useWebSocket();

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
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('newAnnouncement', handleNewAnnouncement);
      return () => {
        socket.off('newAnnouncement', handleNewAnnouncement);
      };
    }
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/announcements?limit=10&notificationView=true');
      if (response.data.success) {
        const announcements = response.data.data.announcements;
        setNotifications(announcements);
        
        // Count unread announcements
        const unread = announcements.filter(ann => !ann.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch notification announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnnouncement = (announcementData) => {
    setNotifications(prev => [announcementData, ...prev.slice(0, 9)]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification
    const isUrgent = announcementData.priority === 'critical' || announcementData.type === 'urgent';
    toast.custom((t) => (
      <div
        className={`max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${
          isUrgent ? 'border-l-4 border-red-500' : 'border-l-4 border-blue-500'
        }`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {isUrgent ? (
                <AlertTriangle className="h-6 w-6 text-red-400" />
              ) : (
                <Bell className="h-6 w-6 text-blue-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                New Announcement
              </p>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {announcementData.title}
              </p>
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
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    ), {
      duration: isUrgent ? 8000 : 5000,
      position: 'top-right',
    });
  };

  const handleMarkAsRead = async (announcementId, event) => {
    event?.stopPropagation();
    
    try {
      await api.post(`/announcements/${announcementId}/read`);
      
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === announcementId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleAcknowledge = async (announcementId, event) => {
    event?.stopPropagation();
    
    try {
      await api.post(`/announcements/${announcementId}/acknowledge`);
      
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === announcementId
            ? { ...notification, isAcknowledged: true, acknowledgedAt: new Date().toISOString() }
            : notification
        )
      );
      
      toast.success('Announcement acknowledged');
    } catch (error) {
      console.error('Failed to acknowledge:', error);
      toast.error('Failed to acknowledge announcement');
    }
  };

  const handleViewAnnouncement = (announcement) => {
    // Mark as read if not already read
    if (!announcement.isRead) {
      handleMarkAsRead(announcement._id);
    }
    
    // Navigate to announcements page or open detail view
    window.location.href = '/announcements';
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(notification => !notification.isRead)
        .map(notification => notification._id);
      
      if (unreadIds.length === 0) return;
      
      await Promise.all(unreadIds.map(id => api.post(`/announcements/${id}/read`)));
      
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true, readAt: new Date().toISOString() }))
      );
      
      setUnreadCount(0);
      toast.success('All announcements marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const NotificationItem = ({ notification }) => {
    const TypeIcon = typeConfig[notification.type]?.icon || MessageSquare;
    const isUrgent = notification.priority === 'critical' || notification.type === 'urgent';
    const isPinned = notification.type === 'urgent' || notification.priority === 'critical';

    return (
      <Card 
        className={`mb-3 cursor-pointer hover:bg-gray-50 transition-colors ${
          !notification.isRead ? 'border-blue-200 bg-blue-50' : ''
        } ${isUrgent ? 'border-l-4 border-l-orange-400' : ''}`}
        onClick={() => handleViewAnnouncement(notification)}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isPinned && <Pin className="h-3 w-3 text-red-500" />}
                <h4 className="text-sm font-semibold line-clamp-1 flex items-center gap-1">
                  {notification.title}
                </h4>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>
              
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {notification.content}
              </p>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge className={priorityConfig[notification.priority]?.color} variant="outline" size="sm">
                  {priorityConfig[notification.priority]?.label}
                </Badge>
                <Badge className={typeConfig[notification.type]?.color} variant="outline" size="sm">
                  <TypeIcon className="h-2 w-2 mr-1" />
                  {typeConfig[notification.type]?.label}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
                
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => handleMarkAsRead(notification._id, e)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Read
                    </Button>
                  )}
                  {notification.requiresAcknowledgment && !notification.isAcknowledged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
                      onClick={(e) => handleAcknowledge(notification._id, e)}
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
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Announcements</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {unreadCount} unread announcement{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto p-3">
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
          ) : notifications.length === 0 ? (
            <div className="text-center py-6">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <NotificationItem key={notification._id} notification={notification} />
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm"
              onClick={() => {
                window.location.href = '/announcements';
                setIsOpen(false);
              }}
            >
              View all announcements
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default AnnouncementNotifications;
