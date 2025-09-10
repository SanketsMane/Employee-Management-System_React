import React, { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Send, MessageCircle, Settings, Crown, Mail } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchTeams();
    fetchAvailableEmployees();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error.response?.data || error.message);
    }
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teams');
      
      if (response.data.success) {
        setTeams(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching teams:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableEmployees = async () => {
    try {
      const response = await api.get('/teams/available-employees');
      
      if (response.data.success) {
        setAvailableEmployees(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching available employees:', error.response?.data || error.message);
    }
  };

  const CreateTeamModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      department: '',
      teamLeadId: ''
    });
    const [teamLeads, setTeamLeads] = useState([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
      fetchTeamLeads();
    }, []);

    const fetchTeamLeads = async () => {
      try {
        const response = await api.get('/admin/users?role=Team Lead');
        if (response.data.success) {
          setTeamLeads(response.data.data.users || response.data.data);
        }
      } catch (error) {
        console.error('❌ Error fetching team leads:', error.response?.data || error.message);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.name || !formData.department || !formData.teamLeadId) {
        toast.error('Please fill all required fields');
        return;
      }

      try {
        setCreating(true);
        const response = await api.post('/teams', formData);
        
        if (response.data.success) {
          toast.success('Team created successfully');
          setShowCreateTeam(false);
          fetchTeams();
          setFormData({ name: '', description: '', department: '', teamLeadId: '' });
        } else {
          toast.error(response.data.message || 'Error creating team');
        }
      } catch (error) {
        console.error('❌ Error creating team:', error.response?.data || error.message);
        toast.error(error.response?.data?.message || 'Error creating team');
      } finally {
        setCreating(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Lead *</label>
              <select
                value={formData.teamLeadId}
                onChange={(e) => setFormData({...formData, teamLeadId: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Team Lead</option>
                {teamLeads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.firstName} {lead.lastName} ({lead.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Team'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateTeam(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddMemberModal = ({ team, onClose }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [adding, setAdding] = useState(false);

    const handleAddMember = async () => {
      if (!selectedEmployeeId) {
        toast.error('Please select an employee');
        return;
      }

      try {
        setAdding(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/teams/${team._id}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId: selectedEmployeeId })
        });

        const data = await response.json();
        
        if (data.success) {
          toast.success('Member added successfully');
          onClose();
          fetchTeams();
          fetchAvailableEmployees();
        } else {
          toast.error(data.message || 'Error adding member');
        }
      } catch (error) {
        console.error('Error adding member:', error);
        toast.error('Error adding member');
      } finally {
        setAdding(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Add Member to {team.name}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Choose an employee</option>
                {availableEmployees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.firstName} {employee.lastName} - {employee.role} ({employee.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAddMember}
                disabled={adding || !selectedEmployeeId}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Member'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SendNotificationModal = ({ team, onClose }) => {
    const [notification, setNotification] = useState({
      title: '',
      message: '',
      priority: 'Medium'
    });
    const [sending, setSending] = useState(false);

    const handleSendNotification = async () => {
      if (!notification.title || !notification.message) {
        toast.error('Please fill title and message');
        return;
      }

      try {
        setSending(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/teams/${team._id}/notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(notification)
        });

        const data = await response.json();
        
        if (data.success) {
          toast.success('Notification sent successfully');
          onClose();
          setNotification({ title: '', message: '', priority: 'Medium' });
        } else {
          toast.error(data.message || 'Error sending notification');
        }
      } catch (error) {
        console.error('Error sending notification:', error);
        toast.error('Error sending notification');
      } finally {
        setSending(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Send Notification to {team.name}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={notification.title}
                onChange={(e) => setNotification({...notification, title: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Notification title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={notification.message}
                onChange={(e) => setNotification({...notification, message: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Notification message..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={notification.priority}
                onChange={(e) => setNotification({...notification, priority: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSendNotification}
                disabled={sending}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Notification'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const canManageTeams = user && ['Admin', 'Manager'].includes(user.role);
  const canManageMembers = user && ['Admin', 'HR', 'Manager', 'Team Lead'].includes(user.role);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-600 mt-2">Manage teams and their members</p>
            </div>
            {canManageTeams && (
              <button
                onClick={() => setShowCreateTeam(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </button>
            )}
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Found</h3>
            <p className="text-gray-500">
              {canManageTeams ? 'Create your first team to get started.' : 'No teams have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div key={team._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-600">{team.department}</p>
                    {team.description && (
                      <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                </div>

                {/* Team Lead */}
                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                    <span className="font-medium">Team Lead:</span>
                  </div>
                  <div className="ml-6 text-sm text-gray-900">
                    {team.teamLead.firstName} {team.teamLead.lastName}
                  </div>
                </div>

                {/* Members */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Members ({team.members?.length || 0})
                    </span>
                    {canManageMembers && (
                      <button
                        onClick={() => setSelectedTeam({...team, action: 'addMember'})}
                        className="text-blue-600 hover:text-blue-700 text-xs"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {team.members && team.members.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {team.members.slice(0, 3).map((member) => (
                        <div key={member._id} className="text-sm text-gray-600">
                          {member.firstName} {member.lastName} - {member.role}
                        </div>
                      ))}
                      {team.members.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{team.members.length - 3} more members
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-2">No members added yet</div>
                  )}
                </div>

                {/* Actions */}
                {canManageMembers && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedTeam({...team, action: 'sendNotification'})}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center text-sm"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Notify
                    </button>
                    <button
                      onClick={() => window.open(`mailto:${team.teamLead.email}`, '_blank')}
                      className="flex-1 bg-gray-50 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center text-sm"
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateTeam && <CreateTeamModal />}
      {selectedTeam?.action === 'addMember' && (
        <AddMemberModal 
          team={selectedTeam} 
          onClose={() => setSelectedTeam(null)} 
        />
      )}
      {selectedTeam?.action === 'sendNotification' && (
        <SendNotificationModal 
          team={selectedTeam} 
          onClose={() => setSelectedTeam(null)} 
        />
      )}
    </div>
  );
};

export default TeamManagement;
