import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Trash2, Settings, UserPlus, Edit2, Save, XCircle } from 'lucide-react';

const GroupDetailsDialog = ({ group, onClose, onGroupUpdated, onGroupDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: group?.name || '',
    description: group?.description || '',
    privacy: group?.privacy || 'private'
  });

  useEffect(() => {
    // Get current user info
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ _id: payload.userId, role: payload.role });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    if (showAddMembers) {
      fetchAvailableUsers();
    }
  }, [showAddMembers]);

  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out users who are already members
        const existingMemberIds = group.members.map(m => m.user._id);
        const available = data.data.users.filter(user => 
          !existingMemberIds.includes(user._id)
        );
        setAvailableUsers(available);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addMembersToGroup = async () => {
    if (selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/groups/${group._id}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          members: selectedUsers
        })
      });

      if (response.ok) {
        const data = await response.json();
        onGroupUpdated(data.data.group);
        setSelectedUsers([]);
        setShowAddMembers(false);
        alert('Members added successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Error adding members');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/groups/${group._id}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        onGroupUpdated(data.data.group);
        alert('Member removed successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error removing member');
    } finally {
      setLoading(false);
    }
  };

  const updateGroupSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/groups/${group._id}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const data = await response.json();
        onGroupUpdated(data.data.group);
        setIsEditing(false);
        alert('Group settings updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Error updating group settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const cancelEdit = () => {
    setEditForm({
      name: group.name,
      description: group.description || '',
      privacy: group.privacy
    });
    setIsEditing(false);
  };

  const deleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/groups/${group._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Group deleted successfully!');
        if (onGroupDeleted) onGroupDeleted(group._id);
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Error deleting group');
    } finally {
      setLoading(false);
    }
  };

  const isGroupAdmin = () => {
    return user?.role === 'Admin' || group.createdBy._id === user?._id;
  };

  const canRemoveMember = (member) => {
    // Can't remove the group creator
    if (member.user._id === group.createdBy._id) return false;
    // Only admins can remove members
    return isGroupAdmin();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center flex-1">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Users size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    className="text-xl font-semibold text-gray-900 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500 w-full"
                    placeholder="Group name"
                  />
                  <p className="text-sm text-gray-500">
                    {group.members.length} members • 
                    <select
                      name="privacy"
                      value={editForm.privacy}
                      onChange={handleEditFormChange}
                      className="ml-1 bg-transparent focus:outline-none"
                    >
                      <option value="private">private</option>
                      <option value="public">public</option>
                    </select>
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
                  <p className="text-sm text-gray-500">
                    {group.members.length} members • {group.privacy}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isGroupAdmin() && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={updateGroupSettings}
                      disabled={loading}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Save changes"
                    >
                      <Save size={20} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Cancel editing"
                    >
                      <XCircle size={20} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit group"
                  >
                    <Edit2 size={20} />
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Description */}
          {(group.description || isEditing) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
              {isEditing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  placeholder="Enter group description..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              ) : (
                <p className="text-gray-600">{group.description || 'No description'}</p>
              )}
            </div>
          )}

          {/* Members Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">
                Members ({group.members.length})
              </h3>
              {isGroupAdmin() && (
                <button
                  onClick={() => setShowAddMembers(!showAddMembers)}
                  className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus size={16} className="mr-1" />
                  Add Members
                </button>
              )}
            </div>

            {/* Add Members Section */}
            {showAddMembers && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Members</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableUsers.map(availableUser => (
                    <label key={availableUser._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(availableUser._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, availableUser._id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== availableUser._id));
                          }
                        }}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {availableUser.firstName} {availableUser.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{availableUser.email}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={addMembersToGroup}
                    disabled={selectedUsers.length === 0 || loading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding...' : `Add ${selectedUsers.length} Member(s)`}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMembers(false);
                      setSelectedUsers([]);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-3">
              {group.members.map((member) => (
                <div key={member.user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user.firstName} {member.user.lastName}
                        {member.user._id === group.createdBy._id && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Creator
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  {canRemoveMember(member) && (
                    <button
                      onClick={() => removeMember(member.user._id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Group Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Group Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Created by:</span>
                <span>{group.createdBy.firstName} {group.createdBy.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span>Privacy:</span>
                <span className="capitalize">{group.privacy}</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(group.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {isGroupAdmin() && (
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              onClick={() => {
                if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                  // Handle group deletion
                  console.log('Delete group functionality to be implemented');
                }
              }}
            >
              Delete Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsDialog;
