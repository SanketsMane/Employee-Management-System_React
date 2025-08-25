const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: [
          "http://localhost:3000",
          "http://localhost:5173", 
          "http://localhost:5174"
        ],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error.message);
        if (error.name === 'JsonWebTokenError') {
          return next(new Error('Authentication error: Invalid token signature. Please login again.'));
        } else if (error.name === 'TokenExpiredError') {
          return next(new Error('Authentication error: Token expired. Please login again.'));
        }
        next(new Error('Authentication error: ' + error.message));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔗 User connected: ${socket.user.firstName} ${socket.user.lastName} (${socket.user.email})`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        user: socket.user,
        connectedAt: new Date()
      });

      // Join user-specific room
      socket.join(`user:${socket.userId}`);
      
      // Join role-specific rooms
      socket.join(`role:${socket.user.role}`);
      socket.join(`department:${socket.user.department}`);

      // Handle attendance updates
      socket.on('attendance:update', (data) => {
        this.broadcastAttendanceUpdate(socket.user, data);
      });

      // Handle worksheet updates
      socket.on('worksheet:update', (data) => {
        this.broadcastWorksheetUpdate(socket.user, data);
      });

      // Handle leave requests
      socket.on('leave:request', (data) => {
        this.broadcastLeaveRequest(socket.user, data);
      });

      // Handle notifications
      socket.on('notification:read', (notificationId) => {
        this.markNotificationAsRead(socket.userId, notificationId);
      });

      // Handle typing indicators for team chat
      socket.on('typing:start', (data) => {
        socket.to(`department:${socket.user.department}`).emit('user:typing', {
          user: socket.user,
          isTyping: true
        });
      });

      socket.on('typing:stop', (data) => {
        socket.to(`department:${socket.user.department}`).emit('user:typing', {
          user: socket.user,
          isTyping: false
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.user.firstName} ${socket.user.lastName}`);
        this.connectedUsers.delete(socket.userId);
        
        // Notify others in the department
        socket.to(`department:${socket.user.department}`).emit('user:offline', {
          user: socket.user
        });
      });

      // Send current online users to newly connected user
      this.sendOnlineUsers(socket);
    });

    console.log('🚀 WebSocket service initialized');
    return this.io;
  }

  // Broadcast attendance update to relevant users
  broadcastAttendanceUpdate(user, data) {
    // Notify HR and Admins
    this.io.to('role:HR').to('role:Admin').emit('attendance:update', {
      user,
      data,
      timestamp: new Date()
    });

    // Notify user's manager if they have one
    if (user.managerId) {
      this.io.to(`user:${user.managerId}`).emit('attendance:update', {
        user,
        data,
        timestamp: new Date()
      });
    }
  }

  // Broadcast worksheet updates
  broadcastWorksheetUpdate(user, data) {
    // Notify team members and managers
    this.io.to(`department:${user.department}`).emit('worksheet:update', {
      user,
      data,
      timestamp: new Date()
    });
  }

  // Broadcast leave requests
  broadcastLeaveRequest(user, data) {
    // Notify HR, Admins, and Managers
    this.io.to('role:HR').to('role:Admin').to('role:Manager').emit('leave:request', {
      user,
      data,
      timestamp: new Date()
    });
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  // Send notification to role
  sendNotificationToRole(role, notification) {
    this.io.to(`role:${role}`).emit('notification:new', notification);
  }

  // Send notification to department
  sendNotificationToDepartment(department, notification) {
    this.io.to(`department:${department}`).emit('notification:new', notification);
  }

  // Broadcast system-wide announcement
  broadcastAnnouncement(announcement) {
    this.io.emit('announcement', {
      ...announcement,
      timestamp: new Date()
    });
  }

  // Send live leaderboard updates
  broadcastLeaderboardUpdate(leaderboardData) {
    this.io.emit('leaderboard:update', {
      data: leaderboardData,
      timestamp: new Date()
    });
  }

  // Send online users to a specific socket
  sendOnlineUsers(socket) {
    const onlineUsers = Array.from(this.connectedUsers.values()).map(conn => ({
      user: {
        _id: conn.user._id,
        firstName: conn.user.firstName,
        lastName: conn.user.lastName,
        role: conn.user.role,
        department: conn.user.department,
        profilePicture: conn.user.profilePicture
      },
      connectedAt: conn.connectedAt
    }));

    socket.emit('users:online', onlineUsers);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users by role
  getConnectedUsersByRole(role) {
    return Array.from(this.connectedUsers.values())
      .filter(conn => conn.user.role === role);
  }

  // Mark notification as read
  markNotificationAsRead(userId, notificationId) {
    // This would typically update the notification in the database
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService;
