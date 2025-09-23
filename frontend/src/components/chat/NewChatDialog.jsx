import React, { useState, useEffect } from 'react';
import { X, Search, MessageSquare, Loader } from 'lucide-react';

const NewChatDialog = ({ onClose, onChatCreated }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/messages/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users || []);
        setFilteredUsers(data.data.users || []);
      } else {
        console.error('Failed to fetch users:', response.status);
        alert('Failed to fetch available users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const createDirectChat = async (targetUser) => {
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/chat/direct', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: targetUser._id
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Format chat for the parent component
        const formattedChat = {
          _id: data.data.chat._id,
          chatType: 'direct',
          name: `${targetUser.firstName} ${targetUser.lastName}`,
          participants: data.data.chat.participants,
          otherParticipant: targetUser
        };
        
        onChatCreated(formattedChat);
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error creating chat');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <MessageSquare size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">New Chat</h2>
              <p className="text-sm text-gray-500">Start a conversation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="animate-spin mr-2" size={20} />
              <span className="text-gray-500">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={24} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                {searchQuery ? 'No users found' : 'No users available'}
              </h3>
              <p className="text-xs text-gray-500">
                {searchQuery ? 'Try a different search term' : 'No users available for messaging'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  onClick={() => !creating && createDirectChat(user)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    creating ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400">{user.role}</p>
                  </div>
                  {creating && (
                    <Loader className="animate-spin text-gray-400" size={16} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Select a user to start a direct conversation
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewChatDialog;
