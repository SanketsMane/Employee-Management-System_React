import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase,
  Edit3,
  Save,
  Upload,
  Download,
  Eye,
  Award,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    skills: ''
  });
  const [dashboardData, setDashboardData] = useState({});

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserDashboardData();
    }
  }, [user]);

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData({
          firstName: response.data.data.firstName || '',
          lastName: response.data.data.lastName || '',
          phone: response.data.data.phone || '',
          address: response.data.data.address || '',
          skills: response.data.data.skills || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user dashboard data (attendance, leaves, etc.)
  const fetchUserDashboardData = async () => {
    try {
      const [attendanceRes, leavesRes, worksheetsRes] = await Promise.all([
        api.get('/attendance/my-attendance'),
        api.get('/leaves/my-leaves'),
        api.get('/worksheets/my-worksheets')
      ]);

      setDashboardData({
        attendance: attendanceRes.data.data || {},
        leaves: leavesRes.data.data || [],
        worksheets: worksheetsRes.data.data || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/${user._id}/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchProfile();
      fetchDashboardData();
    }
  }, [user, token]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
      };

      const response = await axios.put(
        `${API_BASE_URL}/users/${user._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setProfile(response.data.data.user);
        updateUser(response.data.data.user);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const documentName = prompt('Enter document name:');
    if (!documentName) return;

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('name', documentName);

      const response = await axios.post(
        `${API_BASE_URL}/users/${user._id}/documents`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        await fetchProfile();
        toast.success('Document uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error uploading document. Please try again.');
    } finally {
      setUploadingDocument(false);
      e.target.value = ''; // Reset file input
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your personal information</p>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phone: profile.phone || '',
                    address: profile.address || '',
                    skills: profile.skills ? profile.skills.join(', ') : ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="xl:col-span-2">
          <Card className="p-8">
            <div className="flex items-center space-x-6 mb-8">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </div>
              
              {/* Basic Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">{profile.position}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {profile.department} • {profile.role}
                </p>
                <p className="text-sm text-blue-600 font-medium">
                  Employee ID: {profile.employeeId}
                </p>
              </div>

              {/* Reward Points */}
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">{profile.rewardPoints}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reward Points</div>
                <Award className="w-6 h-6 mx-auto mt-1 text-yellow-500" />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Contact Information
              </h3>
              
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name
                      </label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name
                      </label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter your full address..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Skills (comma separated)
                    </label>
                    <Input
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="e.g. JavaScript, React, Node.js"
                    />
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                        <p className="font-medium text-gray-900 dark:text-white">{profile.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {profile.phone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {profile.address || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Join Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
                        <p className="font-medium text-gray-900 dark:text-white">{profile.department}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Target className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Skills</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {profile.skills && profile.skills.length > 0 ? (
                            profile.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">No skills added</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reporting Structure */}
            {(profile.manager || profile.teamLead) && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Reporting Structure
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.manager && (
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Manager</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {profile.manager.firstName} {profile.manager.lastName}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.teamLead && (
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Team Lead</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {profile.teamLead.firstName} {profile.teamLead.lastName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Documents */}
          <Card className="p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Documents</h3>
              <div>
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  onChange={handleDocumentUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Button
                  onClick={() => document.getElementById('document-upload').click()}
                  disabled={uploadingDocument}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingDocument ? 'Uploading...' : 'Upload Document'}
                </Button>
              </div>
            </div>
            
            {profile.documents && profile.documents.length > 0 ? (
              <div className="space-y-2">
                {profile.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        📄
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Uploaded on {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Upload className="w-12 h-12 mx-auto mb-4" />
                <p>No documents uploaded yet</p>
                <p className="text-sm">Upload important documents like certificates, contracts, etc.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Performance Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Performance Overview
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData.attendanceStats?.attendanceRate || 0}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Productivity</div>
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData.worksheetStats?.averageProductivity || 0}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</div>
                <div className="text-2xl font-bold text-purple-600">
                  {dashboardData.worksheetStats?.totalTasksCompleted || 0}
                </div>
              </div>
            </div>
          </Card>

          {/* This Month Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              This Month
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(dashboardData.attendanceStats?.totalHoursWorked || 0)}h
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Hours/Day</div>
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardData.attendanceStats?.averageHours?.toFixed(1) || 0}h
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Present Days</div>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData.attendanceStats?.presentDays || 0}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                    / {dashboardData.attendanceStats?.totalDays || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Account Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  profile.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Login</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
