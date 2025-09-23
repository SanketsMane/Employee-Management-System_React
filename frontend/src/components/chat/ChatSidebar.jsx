import React, { useState, useEffect } from 'react';
import { Plus, Users, MessageSquare, Search } from 'lucide-react';
import NewChatDialog from './NewChatDialog';
import NewGroupDialog from './NewGroupDialog';
import GroupDetailsDialog from './GroupDetailsDialog';

const ChatSidebar = ({ selectedChat, onChatSelect, className }) => {
  const [groups, setGroups] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Fetch user's groups and chats
  useEffect(() => {
    fetchUserGroups();
    fetchUserChats();
  }, []);

  const fetchUserGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.data.groups || []);
      } else {
        console.error('Failed to fetch groups:', response.status);
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    }
  };

  const fetchUserChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/chat/user-chats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.data?.chats || []);
      } else {
        console.error('Failed to fetch chats:', response.status);
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (group) => {
    // Extract chat ID safely
    let chatId = null;
    if (group.chat) {
      // Handle both string ID and object cases
      if (typeof group.chat === 'string') {
        chatId = group.chat;
      } else if (group.chat._id) {
        chatId = group.chat._id;
      } else if (typeof group.chat === 'object') {
        chatId = group.chat.toString();
      }
    }

    if (chatId && chatId !== '[object Object]') {
      const chatData = {
        _id: chatId,
        chatType: 'group',
        name: group.name,
        participants: group.members?.map(m => m.user) || [],
        group: group
      };
      
      onChatSelect(chatData);
    } else {
      // Still show group details even without chat
      setSelectedGroup(group);
      setShowGroupDetails(true);
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [newGroup, ...prev]);
    setShowNewGroupDialog(false);
  };

  const handleChatCreated = (newChat) => {
    setChats(prev => [newChat, ...prev]);
    setShowNewChatDialog(false);
  };

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="text-gray-500">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className={`${className} flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowNewChatDialog(true)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="New Chat"
            >
              <MessageSquare size={20} />
            </button>
            <button
              onClick={() => setShowNewGroupDialog(true)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="New Group"
            >
              <Users size={20} />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {/* Groups Section */}
        {filteredGroups.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <Users size={16} className="mr-2" />
              Groups ({filteredGroups.length})
            </h3>
            <div className="space-y-2">
              {filteredGroups.map((group) => (
                <div
                  key={group._id}
                  onClick={() => handleGroupClick(group)}
                  className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {group.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {group.members?.length || 0} members
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {group.privacy === 'private' ? '🔒' : '🌐'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Direct Chats Section */}
        {filteredChats.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <MessageSquare size={16} className="mr-2" />
              Direct Messages ({filteredChats.length})
            </h3>
            <div className="space-y-2">
              {filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => onChatSelect(chat)}
                  className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <MessageSquare size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {chat.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Last message...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredGroups.length === 0 && filteredChats.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">No conversations</h3>
            <p className="text-xs text-gray-500 mb-4">
              Start a new conversation or create a group
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setShowNewChatDialog(true)}
                className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Chat
              </button>
              <button
                onClick={() => setShowNewGroupDialog(true)}
                className="w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Create Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showNewChatDialog && (
        <NewChatDialog
          onClose={() => setShowNewChatDialog(false)}
          onChatCreated={handleChatCreated}
        />
      )}

      {showNewGroupDialog && (
        <NewGroupDialog
          onClose={() => setShowNewGroupDialog(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {showGroupDetails && selectedGroup && (
        <GroupDetailsDialog
          group={selectedGroup}
          onClose={() => {
            setShowGroupDetails(false);
            setSelectedGroup(null);
          }}
          onGroupUpdated={(updatedGroup) => {
            setGroups(prev => prev.map(g => g._id === updatedGroup._id ? updatedGroup : g));
            setSelectedGroup(updatedGroup);
          }}
        />
      )}
    </div>
  );
};

export default ChatSidebar;
