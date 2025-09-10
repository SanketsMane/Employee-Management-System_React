import React, { useState, useEffect } from 'react';
import { Building, Users, MapPin, Phone, Mail, Globe, Calendar, Award, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const CompanyPage = () => {
  const { user, isAdmin, isHR } = useAuth();
  const [companyData, setCompanyData] = useState({
    info: {},
    stats: {},
    announcements: [],
    milestones: [],
    departments: [],
    loading: true
  });

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setCompanyData(prev => ({ ...prev, loading: true }));
      
      // Fetch real company data from API
      const response = await api.get('/company/info');
      
      if (response.data.success) {
        const data = response.data.data;
        setCompanyData({
          ...data,
          loading: false
        });
      } else {
        // Show default empty state
        setCompanyData({
          info: {
            name: 'Employee Management System',
            tagline: 'Configure company information',
            founded: new Date().getFullYear(),
            headquarters: 'Not specified',
            employees: 0,
            offices: [],
            website: '',
            email: '',
            phone: '',
            description: 'Please configure company information in admin settings.'
          },
          stats: {
            totalEmployees: 0,
            departments: 0,
            projects: 0,
            clients: 0,
            revenue: '$0',
            growth: '0%'
          },
          announcements: [],
          milestones: [],
          departments: [],
          loading: false
        });
      }
    } catch (error) {
      setCompanyData(prev => ({ ...prev, loading: false }));
    }
  };

  if (!isHR && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Only HR and Admins can view company information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Building className="h-8 w-8 mr-3 text-primary" />
          Company Overview
        </h1>
        <p className="text-muted-foreground">Comprehensive company information and insights</p>
      </div>

      {companyData.loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Company Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{companyData.info.name}</h2>
                    <p className="text-muted-foreground italic">{companyData.info.tagline}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Founded {companyData.info.founded}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {companyData.info.headquarters}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {companyData.info.employees} Employees
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center text-sm">
                    <Globe className="h-4 w-4 mr-1" />
                    <span>{companyData.info.website}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-1" />
                    <span>{companyData.info.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-1" />
                    <span>{companyData.info.phone}</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground">{companyData.info.description}</p>
            </CardContent>
          </Card>

          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companyData.stats.totalEmployees}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companyData.stats.departments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companyData.stats.projects}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companyData.stats.clients}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companyData.stats.revenue}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{companyData.stats.growth}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Departments */}
            <Card>
              <CardHeader>
                <CardTitle>Departments Overview</CardTitle>
                <CardDescription>Team structure and leadership</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companyData.departments.map((dept, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                        <div>
                          <p className="font-medium">{dept.name}</p>
                          <p className="text-sm text-muted-foreground">Head: {dept.head}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{dept.count} people</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Company Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Company Milestones
                </CardTitle>
                <CardDescription>Key achievements and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companyData.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-muted/20 rounded-lg">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {milestone.year.toString().slice(-2)}
                      </div>
                      <div>
                        <p className="font-medium">{milestone.title}</p>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Announcements */}
          <Card>
            <CardHeader>
              <CardTitle>Company Announcements</CardTitle>
              <CardDescription>Latest updates and communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companyData.announcements.map((announcement) => (
                  <div key={announcement.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{announcement.title}</h3>
                          <Badge 
                            variant={
                              announcement.priority === 'high' ? 'destructive' :
                              announcement.priority === 'medium' ? 'default' : 'secondary'
                            }
                          >
                            {announcement.priority}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{announcement.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{announcement.author}</span>
                          <span>•</span>
                          <span>{new Date(announcement.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Office Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Global Presence
              </CardTitle>
              <CardDescription>Our office locations worldwide</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {companyData.info.offices.map((office, index) => (
                  <div key={index} className="text-center p-4 bg-muted/20 rounded-lg">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium">{office}</p>
                    <p className="text-sm text-muted-foreground">Office Location</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CompanyPage;
