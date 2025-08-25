import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, Building, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
    position: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    'Employee',
    'Team Lead',
    'Software developer trainee',
    'Associate software developer',
    'Full stack developer',
    'Dot net developer',
    'UI UX designer',
    'Flutter developer',
    'React native developer',
    'Java developer'
  ];

  const departments = [
    'Engineering',
    'Marketing', 
    'Sales',
    'Design',
    'HR',
    'Finance',
    'Operations',
    'Support',
    'IT',
    'Research & Development'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.role || !formData.position) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        position: formData.position
      });

      if (response.data.success) {
        // Registration successful - redirect to login with approval message
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Your account is pending admin approval. You will receive an email once approved.',
            type: 'info'
          } 
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Formonex Logo */}
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Formonex Brand */}
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              formonex
            </h1>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mt-2 rounded-full"></div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Join Our Team
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Create your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10 h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="pl-10 h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Role *
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange('role', value)}>
                <SelectTrigger className="h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Position *
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="position"
                  name="position"
                  type="text"
                  placeholder="Enter your position"
                  value={formData.position}
                  onChange={handleChange}
                  className="pl-10 h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <Select value={formData.department} onValueChange={(value) => handleSelectChange('department', value)}>
                  <SelectTrigger className="pl-10 h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-purple-600 transition-colors duration-200">
                Sign in here
              </Link>
            </p>
            
            {/* Formonex Footer */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Formonex</span> Employee Management System
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg border border-blue-100 dark:border-gray-600">
            <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
              <strong className="text-blue-700 dark:text-blue-300">Available Roles Include:</strong><br />
              Traditional roles (Employee, Manager, HR, Admin) and technical positions 
              (Software Developer Trainee, Full Stack Developer, UI/UX Designer, etc.)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
