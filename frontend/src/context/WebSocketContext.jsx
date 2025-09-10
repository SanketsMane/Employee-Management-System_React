import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId && localStorage.getItem('token')) {
      // Only initialize if we don't have a socket or if the user ID actually changed
      if (!socket || (socket && userId !== socket.userId)) {
        initializeSocket();
      }
    }

    return () => {
      // Only disconnect if component is unmounting or user is logging out
      if (!user && socket) {
        socket.disconnect();
      }
    };
  }, [user?._id, user?.id]); // Depend on both _id and id for compatibility

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // Store user ID on socket instance to track changes
    newSocket.userId = user._id || user.id;

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔗 WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      setConnected(false);
      
      // Handle JWT authentication errors
      if (error.message?.includes('Invalid token signature') || 
          error.message?.includes('Token expired')) {
        console.warn('Token authentication failed, user needs to re-login');
        // You could trigger a re-login here if needed
        // For now, just log the issue
      }
    });

    // Real-time data events
    newSocket.on('users:online', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification('EMS Notification', {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    });

    newSocket.on('leaderboard:update', (data) => {
      setLeaderboard(data);
    });

    newSocket.on('attendance:update', (data) => {
      console.log('📍 Attendance update:', data);
      // Handle attendance updates
    });

    newSocket.on('worksheet:update', (data) => {
      console.log('📝 Worksheet update:', data);
      // Handle worksheet updates
    });

    newSocket.on('leave:request', (data) => {
      console.log('🏖️ Leave request:', data);
      // Handle leave requests
    });

    newSocket.on('announcement', (announcement) => {
      console.log('📢 System announcement:', announcement);
      // Show announcement to user
    });

    newSocket.on('user:typing', (data) => {
      console.log('💬 User typing:', data);
      // Handle typing indicators
    });

    newSocket.on('user:offline', (data) => {
      console.log('👋 User went offline:', data);
      // Update online users list
      setOnlineUsers(prev => prev.filter(u => u.user._id !== data.user._id));
    });

    setSocket(newSocket);
  };

  // Utility functions
  const sendAttendanceUpdate = (data) => {
    if (socket && connected) {
      socket.emit('attendance:update', data);
    }
  };

  const sendWorksheetUpdate = (data) => {
    if (socket && connected) {
      socket.emit('worksheet:update', data);
    }
  };

  const sendLeaveRequest = (data) => {
    if (socket && connected) {
      socket.emit('leave:request', data);
    }
  };

  const markNotificationAsRead = (notificationId) => {
    if (socket && connected) {
      socket.emit('notification:read', notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    }
  };

  const startTyping = () => {
    if (socket && connected) {
      socket.emit('typing:start');
    }
  };

  const stopTyping = () => {
    if (socket && connected) {
      socket.emit('typing:stop');
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    socket,
    connected,
    onlineUsers,
    notifications,
    leaderboard,
    sendAttendanceUpdate,
    sendWorksheetUpdate,
    sendLeaveRequest,
    markNotificationAsRead,
    startTyping,
    stopTyping
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
