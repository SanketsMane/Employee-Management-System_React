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
  Award,
  TrendingUp,
  Clock,
  Target,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    skills: '',
    bio: ''
  });
  const [dashboardData, setDashboardData] = useState({
    attendance: {},
    leaves: [],
    worksheets: []
  });

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
        const userData = response.data.data;
        setProfile(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          address: userData.address || '',
          skills: Array.isArray(userData.skills) ? userData.skills.join(', ') : userData.skills || '',
          bio: userData.bio || ''
        });
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user dashboard data (attendance, leaves, etc.)
  const fetchUserDashboardData = async () => {
    try {
      const [attendanceRes, leaveBalanceRes, worksheetStatsRes] = await Promise.all([
        api.get('/attendance/stats').catch(err => {
          console.error('❌ Attendance API error:', err.response?.data || err.message);
          return { data: { success: true, data: { attendanceRate: 0 } } };
        }),
        api.get('/leaves/balance').catch(err => {
          console.error('❌ Leaves API error:', err.response?.data || err.message);
          return { data: { success: true, data: { totalRemaining: 0 } } };
        }),
        api.get('/worksheets/stats').catch(err => {
          console.error('❌ Worksheets API error:', err.response?.data || err.message);
          return { data: { success: true, data: { totalWorksheets: 0 } } };
        })
      ]);

      setDashboardData({
        attendance: attendanceRes.data.data || { attendanceRate: 0 },
        leaves: leaveBalanceRes.data.data || { totalRemaining: 0 },
        worksheets: worksheetStatsRes.data.data || { totalWorksheets: 0 }
      });
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error.response?.data || error.message);
      setDashboardData({
        attendance: { attendanceRate: 0 },
        leaves: { totalRemaining: 0 },
        worksheets: { totalWorksheets: 0 }
      });
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        skills: skillsArray,
        bio: formData.bio
      };
      
      const response = await api.put('/auth/profile', updateData);

      if (response.data.success) {
        setProfile(response.data.data);
        updateUser(response.data.data);
        setIsEditing(false);
        // Could add toast success message here if toast is imported
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error.response?.data || error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {profile?.firstName} {profile?.lastName}
                </CardTitle>
                <p className="text-muted-foreground">{profile?.role}</p>
                <p className="text-sm text-muted-foreground">{profile?.department}</p>
              </div>
            </div>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{profile?.email}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone number"
                      className="flex-1"
                    />
                  ) : (
                    <span>{profile?.phone || 'Not provided'}</span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Address"
                      className="flex-1"
                    />
                  ) : (
                    <span>{profile?.address || 'Not provided'}</span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {new Date(profile?.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="font-semibold mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  {isEditing ? (
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First name"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{profile?.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  {isEditing ? (
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{profile?.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Skills</label>
                  {isEditing ? (
                    <Input
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      placeholder="Skills (comma separated)"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">
                      {Array.isArray(profile?.skills) ? profile.skills.join(', ') : profile?.skills || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Bio</label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself"
                      className="mt-1 w-full p-2 border rounded-md resize-none"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1">{profile?.bio || 'No bio provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleUpdateProfile} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">
                  {dashboardData.attendance?.attendanceRate?.toFixed(1) || '0.0'}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leave Balance</p>
                <p className="text-2xl font-bold">
                  {dashboardData.leaves?.totalRemaining || 0} days
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Worksheets</p>
                <p className="text-2xl font-bold">
                  {dashboardData.worksheets?.totalWorksheets || 0}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
