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
  const [error, setError] = useState(null);
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

    // Production WebSocket Configuration - Fixed Mixed Content Issue
    const getWebSocketConfig = () => {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isHttps = window.location.protocol === 'https:';
      
      if (isDev) {
        return {
          url: 'http://localhost:8000',
          transports: ['websocket', 'polling'],
          withCredentials: false
        };
      }
      
      // Production: Use HTTPS URL to match the site's protocol
      return {
        url: 'https://ems.formonex.in', // Same domain WebSocket via proxy
        transports: ['polling'], // Use polling to avoid websocket issues
        withCredentials: true,
        upgrade: false,
        rememberUpgrade: false
      };
    };

    const config = getWebSocketConfig();

    const newSocket = io(config.url, {
      auth: {
        token: token
      },
      transports: config.transports,
      withCredentials: config.withCredentials,
      upgrade: config.upgrade || true,
      rememberUpgrade: config.rememberUpgrade !== false,
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
    });

    // Store user ID on socket instance to track changes
    newSocket.userId = user._id || user.id;

    // Connection events - Silent for production
    newSocket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      setConnected(false);
      setError(error.message);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      setConnected(true);
      setError(null);
    });

    newSocket.on('reconnect_error', (error) => {
      setError(`Reconnection failed: ${error.message}`);
    });

    newSocket.on('reconnect_failed', () => {
      setError('Connection failed. Please refresh the page.');
    });

    // Real-time data events - Silent mode
    newSocket.on('users:online', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...(Array.isArray(prev) ? prev : [])]);
      
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
      // Handle attendance updates silently
    });

    newSocket.on('worksheet:update', (data) => {
      // Handle worksheet updates silently
    });

    newSocket.on('leave:request', (data) => {
      // Handle leave requests silently
    });

    newSocket.on('announcement', (announcement) => {
      // Show announcement to user silently
    });

    newSocket.on('user:typing', (data) => {
      // Handle typing indicators silently
    });

    newSocket.on('user:offline', (data) => {
      // Update online users list silently
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
        (Array.isArray(prev) ? prev : []).map(notif => 
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

  // Chat-specific functions
  const joinChat = (chatId) => {
    if (socket && connected) {
      console.log('WebSocket: Joining chat', chatId);
      socket.emit('join_chat', chatId);
    }
  };

  const leaveChat = (chatId) => {
    if (socket && connected) {
      console.log('WebSocket: Leaving chat', chatId);
      socket.emit('leave_chat', chatId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket && connected) {
      console.log('WebSocket: Sending message', messageData);
      socket.emit('send_message', messageData);
    }
  };

  const startTypingInChat = (chatId) => {
    if (socket && connected) {
      socket.emit('typing_start', chatId);
    }
  };

  const stopTypingInChat = (chatId) => {
    if (socket && connected) {
      socket.emit('typing_stop', chatId);
    }
  };

  const markMessageAsRead = (messageId, chatId) => {
    if (socket && connected) {
      socket.emit('mark_message_read', { messageId, chatId });
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
    error,
    sendAttendanceUpdate,
    sendWorksheetUpdate,
    sendLeaveRequest,
    markNotificationAsRead,
    startTyping,
    stopTyping,
    // Chat functions
    joinChat,
    leaveChat,
    sendMessage,
    startTypingInChat,
    stopTypingInChat,
    markMessageAsRead
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
