import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MoreVertical, ArrowLeft, Trash2, MessageSquareOff, Paperclip, X, Image, FileText, Settings, UserPlus, Search, Plus, Loader } from 'lucide-react';
import GroupDetailsDialog from './GroupDetailsDialog';

const ChatWindow = ({ chat, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Get current user from localStorage or context
    const token = localStorage.getItem('token');
    if (token) {
      // Decode JWT to get user info (simplified)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ _id: payload.userId, role: payload.role });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (chat?._id) {
      fetchMessages();
    }
  }, [chat]);

  const fetchMessages = async () => {
    if (!chat?._id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/messages/${chat._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data?.messages || []);
      } else {
        console.error('Failed to fetch messages:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

    const sendMessage = async () => {
    return sendMessageWithFile();
  };

  // Clear all messages in chat
  const clearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all messages in this chat? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/messages/${chat._id}/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMessages([]);
        setShowDropdown(false);
        alert('Chat cleared successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to clear chat');
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      alert('Failed to clear chat');
    } finally {
      setLoading(false);
    }
  };

  // Delete entire chat
  const deleteChat = async () => {
    if (!window.confirm('Are you sure you want to delete this entire chat? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/chat/${chat._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowDropdown(false);
        alert('Chat deleted successfully!');
        onClose(); // Close the chat window
        // Note: Parent component should handle refreshing the chat list
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat');
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload file and get URL
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      return data.data.url;
    } else {
      throw new Error('Failed to upload file');
    }
  };

  // Send message with optional file
  const sendMessageWithFile = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    try {
      setUploading(true);
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      // Upload file if selected
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        fileName = selectedFile.name;
        fileType = selectedFile.type;
      }

      const messageData = {
        content: newMessage.trim(),
        chatId: chat._id,
        ...(fileUrl && {
          attachment: {
            url: fileUrl,
            name: fileName,
            type: fileType
          }
        })
      };

      const response = await fetch('http://localhost:8000/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.data.message]);
        setNewMessage('');
        removeSelectedFile();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'Admin';
  };

  // Fetch available users for adding to group
  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/messages/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out users who are already members
        const existingMemberIds = chat.group?.members?.map(member => member.user._id) || [];
        const nonMembers = data.data.users.filter(user => !existingMemberIds.includes(user._id));
        setAvailableUsers(nonMembers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Add selected members to group
  const addMembersToGroup = async () => {
    if (selectedNewMembers.length === 0) return;

    try {
      setAddingMembers(true);
      const response = await fetch(`http://localhost:8000/api/groups/${chat.group._id}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          members: selectedNewMembers
        })
      });

      if (response.ok) {
        alert('Members added successfully!');
        setShowAddMembers(false);
        setSelectedNewMembers([]);
        setSearchQuery('');
        // Refresh chat data if needed
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to add members');
      }
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Failed to add members');
    } finally {
      setAddingMembers(false);
    }
  };

  // Handle opening add members dialog
  const handleShowAddMembers = () => {
    setShowAddMembers(true);
    setShowDropdown(false);
    fetchAvailableUsers();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-gray-500">Choose a group or chat from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg mr-2"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            {chat.chatType === 'group' ? (
              <Users size={16} className="text-blue-600" />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{chat.name}</h2>
            {chat.chatType === 'group' && chat.group?.members && (
              <p className="text-sm text-gray-500">
                {chat.group.members.length} members
              </p>
            )}
          </div>
        </div>
        {/* More actions dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical size={20} />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                {/* Group management options (Admin only) */}
                {isAdmin() && chat.chatType === 'group' && (
                  <>
                    <button
                      onClick={() => {
                        setShowGroupDetails(true);
                        setShowDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings size={16} className="mr-2" />
                      Group Settings
                    </button>
                    <button
                      onClick={handleShowAddMembers}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <UserPlus size={16} className="mr-2" />
                      Add Members
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                  </>
                )}
                
                {/* Chat management options (All users) */}
                <button
                  onClick={clearChat}
                  disabled={loading}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <MessageSquareOff size={16} className="mr-2" />
                  Clear Chat
                </button>
                <button
                  onClick={deleteChat}
                  disabled={loading}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex justify-center">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet.</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${
                message.sender._id === user?._id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender._id === user?._id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {message.sender._id !== user?._id && chat.chatType === 'group' && (
                  <p className="text-xs font-medium mb-1 text-gray-600">
                    {message.sender.firstName} {message.sender.lastName}
                  </p>
                )}
                
                {/* Message content */}
                {message.content && (
                  <p className="text-sm">
                    {typeof message.content === 'object' ? message.content.text : message.content}
                  </p>
                )}
                
                {/* Attachment display */}
                {message.attachment && (
                  <div className="mt-2">
                    {message.attachment.type?.startsWith('image/') ? (
                      <img
                        src={message.attachment.url}
                        alt={message.attachment.name}
                        className="max-w-full h-auto rounded-lg cursor-pointer"
                        onClick={() => window.open(message.attachment.url, '_blank')}
                      />
                    ) : (
                      <div className="flex items-center p-2 bg-black bg-opacity-10 rounded-lg">
                        <FileText size={16} className="mr-2" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{message.attachment.name}</p>
                        </div>
                        <a
                          href={message.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline ml-2"
                        >
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                <p
                  className={`text-xs mt-1 ${
                    message.sender._id === user?._id ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {selectedFile.type.startsWith('image/') ? (
                  <Image size={20} className="text-blue-600 mr-2" />
                ) : (
                  <FileText size={20} className="text-gray-600 mr-2" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={removeSelectedFile}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          {/* File attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
          />
          
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="1"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || uploading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Group Details Dialog */}
      {showGroupDetails && chat.chatType === 'group' && (
        <GroupDetailsDialog
          group={chat.group}
          onClose={() => setShowGroupDetails(false)}
          onGroupUpdate={(updatedGroup) => {
            // Update the chat object with new group data
            if (updatedGroup) {
              // Handle group update
              console.log('Group updated:', updatedGroup);
            } else {
              // Group was deleted, close chat
              onClose();
            }
            setShowGroupDetails(false);
          }}
        />
      )}

      {/* Add Members Dialog */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <UserPlus size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Add Members</h2>
                  <p className="text-sm text-gray-500">Add users to {chat.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedNewMembers([]);
                  setSearchQuery('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Search */}
              <div className="relative mb-4">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Selected Members */}
              {selectedNewMembers.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected ({selectedNewMembers.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedNewMembers.map(memberId => {
                      const user = availableUsers.find(u => u._id === memberId);
                      return user ? (
                        <div key={memberId} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          <span>{user.firstName} {user.lastName}</span>
                          <button
                            onClick={() => setSelectedNewMembers(prev => prev.filter(id => id !== memberId))}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Available Users */}
              <div className="space-y-2">
                {availableUsers
                  .filter(user => 
                    searchQuery.trim() === '' || 
                    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(user => (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (selectedNewMembers.includes(user._id)) {
                            setSelectedNewMembers(prev => prev.filter(id => id !== user._id));
                          } else {
                            setSelectedNewMembers(prev => [...prev, user._id]);
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedNewMembers.includes(user._id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedNewMembers([]);
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addMembersToGroup}
                disabled={selectedNewMembers.length === 0 || addingMembers}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {addingMembers ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} className="mr-2" />
                    Add Members ({selectedNewMembers.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
