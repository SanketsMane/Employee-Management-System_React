import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar, 
  Award, 
  Target, 
  TrendingUp,
  Edit3,
  Save,
  X,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const CompanyPage = () => {
  const { user, isAdmin } = useAuth();
  const [companyData, setCompanyData] = useState({
    info: {},
    stats: {},
    announcements: [],
    departments: [],
    loading: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    headquarters: '',
    founded: new Date().getFullYear()
  });

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setCompanyData(prev => ({ ...prev, loading: true }));
      
      // Fetch company info and stats
      const [companyRes, statsRes] = await Promise.all([
        api.get('/company/info').catch(() => ({ data: { success: false } })),
        api.get('/analytics/overview').catch(() => ({ data: { success: false } }))
      ]);

      let companyInfo = {};
      if (companyRes.data.success) {
        companyInfo = companyRes.data.data;
      } else {
        // Default company info
        companyInfo = {
          name: 'Employee Management System',
          tagline: 'Efficient workforce management solution',
          description: 'A comprehensive employee management system that helps organizations streamline their HR processes, track attendance, manage leaves, and boost productivity.',
          website: 'https://your-company.com',
          email: 'info@your-company.com',
          phone: '+1-234-567-8900',
          headquarters: 'Your City, Your Country',
          founded: 2024
        };
      }

      let stats = {};
      if (statsRes.data.success) {
        stats = statsRes.data.data;
      }

      setCompanyData({
        info: companyInfo,
        stats,
        announcements: [
          {
            id: 1,
            title: 'Welcome to Employee Management System',
            content: 'Complete employee lifecycle management solution',
            date: new Date().toISOString(),
            type: 'info'
          }
        ],
        departments: stats.departmentStats || [],
        loading: false
      });

      // Set form data
      setFormData({
        name: companyInfo.name || '',
        tagline: companyInfo.tagline || '',
        description: companyInfo.description || '',
        website: companyInfo.website || '',
        email: companyInfo.email || '',
        phone: companyInfo.phone || '',
        headquarters: companyInfo.headquarters || '',
        founded: companyInfo.founded || new Date().getFullYear()
      });

    } catch (error) {
      setCompanyData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUpdateCompany = async () => {
    try {
      setSaving(true);
      const response = await api.put('/company/info', formData);

      if (response.data.success) {
        setCompanyData(prev => ({
          ...prev,
          info: { ...prev.info, ...formData }
        }));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating company info:', error);
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data
    setFormData({
      name: companyData.info.name || '',
      tagline: companyData.info.tagline || '',
      description: companyData.info.description || '',
      website: companyData.info.website || '',
      email: companyData.info.email || '',
      phone: companyData.info.phone || '',
      headquarters: companyData.info.headquarters || '',
      founded: companyData.info.founded || new Date().getFullYear()
    });
  };

  if (companyData.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Company Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building className="w-8 h-8 text-primary" />
              </div>
              <div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Company Name"
                      className="text-2xl font-bold border-0 p-0 h-auto"
                    />
                    <Input
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleInputChange}
                      placeholder="Company Tagline"
                      className="text-muted-foreground border-0 p-0 h-auto"
                    />
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-3xl">{companyData.info.name}</CardTitle>
                    <p className="text-muted-foreground text-lg">{companyData.info.tagline}</p>
                  </>
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleUpdateCompany} disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Company Info
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Information */}
            <div>
              <h3 className="font-semibold mb-4">Company Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="Website URL"
                      className="flex-1"
                    />
                  ) : (
                    <a href={companyData.info.website} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline">
                      {companyData.info.website}
                    </a>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Contact Email"
                      className="flex-1"
                    />
                  ) : (
                    <span>{companyData.info.email}</span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone Number"
                      className="flex-1"
                    />
                  ) : (
                    <span>{companyData.info.phone}</span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      name="headquarters"
                      value={formData.headquarters}
                      onChange={handleInputChange}
                      placeholder="Headquarters Location"
                      className="flex-1"
                    />
                  ) : (
                    <span>{companyData.info.headquarters}</span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      name="founded"
                      type="number"
                      value={formData.founded}
                      onChange={handleInputChange}
                      placeholder="Founded Year"
                      className="flex-1"
                    />
                  ) : (
                    <span>Founded in {companyData.info.founded}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Company Description */}
            <div>
              <h3 className="font-semibold mb-4">About Us</h3>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Company Description"
                  className="w-full p-3 border rounded-md resize-none"
                  rows={8}
                />
              ) : (
                <p className="text-muted-foreground leading-relaxed">
                  {companyData.info.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{companyData.stats.totalEmployees || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{companyData.departments.length || 0}</p>
              </div>
              <Building className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold">{companyData.stats.averageAttendance || 0}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{companyData.stats.activeProjects || 0}</p>
              </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments */}
      {companyData.departments && companyData.departments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Overview of company departments and employee distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companyData.departments.map((dept, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{dept._id || dept.name}</h4>
                    <Badge variant="secondary">{dept.count || dept.employees} employees</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${((dept.count || dept.employees) / (companyData.stats.totalEmployees || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Announcements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Company Announcements</CardTitle>
              <CardDescription>Latest updates and news</CardDescription>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Announcement
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companyData.announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{announcement.title}</h4>
                  <span className="text-sm text-muted-foreground">
                    {new Date(announcement.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-muted-foreground">{announcement.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyPage;
