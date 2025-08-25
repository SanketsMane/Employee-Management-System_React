import React, { useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  Wifi, 
  WifiOff, 
  Users, 
  Bell, 
  Activity,
  Clock,
  Eye,
  EyeOff 
} from 'lucide-react';

const RealTimeStatus = () => {
  const { connected, onlineUsers, notifications } = useWebSocket();
  const { user } = useAuth();
  const [showUsers, setShowUsers] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Real-Time Status
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          {connected ? (
            <>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Connected</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Real-time updates active</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Disconnected</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reconnecting...</p>
              </div>
            </>
          )}
        </div>

        {/* Online Users */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {onlineUsers.length} Online
            </p>
            <button
              onClick={() => setShowUsers(!showUsers)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {showUsers ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showUsers ? 'Hide' : 'Show'} users
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="relative p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
            <Bell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadNotifications.length}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {unreadNotifications.length} New
            </p>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
            >
              View notifications
            </button>
          </div>
        </div>
      </div>

      {/* Online Users List */}
      {showUsers && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Online Users ({onlineUsers.length})
          </h4>
          {onlineUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No users online</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {onlineUsers.map((userConn) => (
                <div
                  key={userConn.user._id}
                  className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 rounded border"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {userConn.user.firstName[0]}{userConn.user.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {userConn.user.firstName} {userConn.user.lastName}
                      {userConn.user._id === user?._id && (
                        <span className="text-blue-600 dark:text-blue-400 ml-1">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {userConn.user.role} • {userConn.user.department}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(userConn.connectedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications List */}
      {showNotifications && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Recent Notifications ({notifications.length})
          </h4>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.slice(0, 10).map((notification, index) => (
                <div
                  key={index}
                  className={`p-3 bg-white dark:bg-gray-600 rounded border-l-4 ${
                    notification.read 
                      ? 'border-gray-300 dark:border-gray-500' 
                      : 'border-blue-500 dark:border-blue-400'
                  }`}
                >
                  <p className="text-sm text-gray-900 dark:text-white">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {notification.type}
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(notification.timestamp || new Date())}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeStatus;
