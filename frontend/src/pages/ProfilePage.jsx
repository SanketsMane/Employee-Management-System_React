import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Camera,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
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
        const userData = response.data.data.user; // Fix: Extract user from nested data
        setProfile(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          address: typeof userData.address === 'string' ? userData.address : (userData.address ? `${userData.address.street || ''} ${userData.address.city || ''} ${userData.address.state || ''} ${userData.address.zipCode || ''} ${userData.address.country || ''}`.trim() : ''),
          skills: Array.isArray(userData.skills) ? userData.skills.join(', ') : userData.skills || '',
          bio: userData.bio || ''
        });
        
        // Only update auth context if essential data changed
        if (!user || 
            userData.firstName !== user.firstName || 
            userData.lastName !== user.lastName ||
            userData.email !== user.email ||
            userData.profilePicture !== user.profilePicture) {
          updateUser(userData);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error.response?.data || error.message);
      toast.error('Failed to load profile data');
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
      // Validate form data
      const newErrors = {};
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error('Please fix the validation errors');
        return;
      }

      setSaving(true);
      setErrors({});
      
      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        skills: skillsArray,
        bio: formData.bio.trim()
      };
      
      console.log('🔄 Updating profile with data:', updateData);
      
      const response = await api.put('/auth/profile', updateData);

      if (response.data.success) {
        const updatedUser = response.data.data;
        setProfile(updatedUser);
        
        // Only update auth context if essential user data changed
        if (updatedUser.firstName !== user?.firstName || 
            updatedUser.lastName !== user?.lastName ||
            updatedUser.email !== user?.email ||
            updatedUser.profilePicture !== user?.profilePicture) {
          updateUser(updatedUser);
        }
        
        setIsEditing(false);
        toast.success('Profile updated successfully!');
        
        // Refresh profile data
        await fetchProfile();
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  // Upload profile picture
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      const formData = new FormData();
      formData.append('profilePicture', file);

      console.log('📸 Uploading profile picture...');

      const response = await api.post('/auth/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const newProfilePicture = response.data.data.profilePicture;
        
        // Update local state
        const updatedProfile = { ...profile, profilePicture: newProfilePicture };
        setProfile(updatedProfile);
        
        // Update auth context with new profile picture
        updateUser({ ...user, profilePicture: newProfilePicture });
        
        toast.success('Profile picture updated successfully!');
        
        // Refresh profile data
        await fetchProfile();
      }
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to upload profile picture';
      toast.error(errorMessage);
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                  {profile?.profilePicture ? (
                    <img 
                      src={profile.profilePicture} 
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <User className={`w-10 h-10 text-primary ${profile?.profilePicture ? 'hidden' : ''}`} />
                </div>
                
                {/* Upload Profile Picture Button */}
                <button
                  onClick={triggerFileInput}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Upload profile picture"
                >
                  {uploadingPhoto ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>
              
              <div>
                <CardTitle className="text-2xl">
                  {profile?.firstName} {profile?.lastName}
                </CardTitle>
                <p className="text-muted-foreground">{profile?.role}</p>
                <p className="text-sm text-muted-foreground">{profile?.department}</p>
                <p className="text-xs text-muted-foreground">ID: {profile?.employeeId}</p>
              </div>
            </div>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => {
                if (isEditing) {
                  // Reset form data when canceling
                  setFormData({
                    firstName: profile?.firstName || '',
                    lastName: profile?.lastName || '',
                    phone: profile?.phone || '',
                    address: profile?.address || '',
                    skills: Array.isArray(profile?.skills) ? profile.skills.join(', ') : profile?.skills || '',
                    bio: profile?.bio || ''
                  });
                  setErrors({});
                }
                setIsEditing(!isEditing);
              }}
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
                    <div className="flex-1">
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Phone number"
                        className={`flex-1 ${errors.phone ? 'border-red-500' : ''}`}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span>{profile?.phone || 'Not provided'}</span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <div className="flex-1">
                      <Input
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Address"
                        className="flex-1"
                      />
                    </div>
                  ) : (
                    <span>
                      {typeof profile?.address === 'string' 
                        ? (profile.address || 'Not provided')
                        : profile?.address 
                          ? `${profile.address.street || ''} ${profile.address.city || ''} ${profile.address.state || ''} ${profile.address.zipCode || ''} ${profile.address.country || ''}`.trim() || 'Not provided'
                          : 'Not provided'
                      }
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Joined {profile?.createdAt 
                      ? new Date(profile.createdAt).toLocaleDateString() 
                      : profile?.dateOfJoining 
                        ? new Date(profile.dateOfJoining).toLocaleDateString()
                        : 'Unknown'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="font-semibold mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  {isEditing ? (
                    <div>
                      <Input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First name"
                        className={`mt-1 ${errors.firstName ? 'border-red-500' : ''}`}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1">{profile?.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  {isEditing ? (
                    <div>
                      <Input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last name"
                        className={`mt-1 ${errors.lastName ? 'border-red-500' : ''}`}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.lastName}
                        </p>
                      )}
                    </div>
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
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                <span className="text-red-500">*</span> Required fields
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      firstName: profile?.firstName || '',
                      lastName: profile?.lastName || '',
                      phone: profile?.phone || '',
                      address: profile?.address || '',
                      skills: Array.isArray(profile?.skills) ? profile.skills.join(', ') : profile?.skills || '',
                      bio: profile?.bio || ''
                    });
                    setErrors({});
                    setIsEditing(false);
                  }}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
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
