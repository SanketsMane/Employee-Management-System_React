import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import api from "../lib/api";

const TeamPage = () => {
  const { user, isAdmin, isHR, isManager } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      console.log('Fetching team members...');
      // Use the new team-members endpoint that works for all authenticated users
      const response = await api.get('/users/team-members');
      if (response.data.success) {
        console.log('Team members fetched:', response.data.data.employees.length);
        setEmployees(response.data.data.employees);
      } else {
        console.error('Failed to fetch team members:', response.data.message);
        toast.error('Failed to fetch team members');
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Error fetching team members');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployee = (employee) => {
    console.log('Viewing employee:', employee.firstName, employee.lastName);
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleEditEmployee = (employee) => {
    console.log('Editing employee:', employee.firstName, employee.lastName);
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDeleteEmployee = (employee) => {
    console.log('Delete confirmation for:', employee.firstName, employee.lastName);
    setSelectedEmployee(employee);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      console.log('Deleting employee:', selectedEmployee._id);
      const response = await api.delete(`/admin/users/${selectedEmployee._id}`);
      
      if (response.data.success) {
        toast.success('Employee deleted successfully');
        setEmployees(employees.filter(emp => emp._id !== selectedEmployee._id));
        setShowDeleteConfirm(false);
        setSelectedEmployee(null);
      } else {
        toast.error(response.data.message || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Error deleting employee');
    }
  };

  const handleUpdateEmployee = async (updatedData) => {
    if (!selectedEmployee) return;
    
    try {
      console.log('Updating employee:', selectedEmployee._id, updatedData);
      const response = await api.put(`/admin/users/${selectedEmployee._id}`, updatedData);
      
      if (response.data.success) {
        toast.success('Employee updated successfully');
        setEmployees(employees.map(emp => 
          emp._id === selectedEmployee._id ? { ...emp, ...updatedData } : emp
        ));
        setShowEditModal(false);
        setSelectedEmployee(null);
      } else {
        toast.error(response.data.message || 'Failed to update employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Error updating employee');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || emp.role === filterRole;
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const departments = [...new Set(employees.map(emp => emp.department))];
  const roles = [...new Set(employees.map(emp => emp.role))];

  // Note: All authenticated users can now view team members
  // Employees see limited info and only their department colleagues
  // HR/Admin/Manager see full details and can edit/delete

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Directory</h1>
          <p className="text-muted-foreground">
            {user?.role === 'Employee' 
              ? 'View your department colleagues' 
              : 'Manage and view team members'
            }
          </p>
        </div>
        {(isHR || isAdmin) && (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Members ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{employee.position}</p>
                        <p className="text-sm text-muted-foreground">{employee.department}</p>
                        <p className="text-sm font-medium text-primary mt-1">{employee.employeeId}</p>
                        <div className="flex items-center mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            employee.role === 'Admin' ? 'bg-red-100 text-red-800' :
                            employee.role === 'HR' ? 'bg-purple-100 text-purple-800' :
                            employee.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                            employee.role === 'Team Lead' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {employee.role}
                          </span>
                        </div>
                        <div className="flex items-center mt-3 space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewEmployee(employee)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {(isHR || isAdmin) && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditEmployee(employee)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteEmployee(employee)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {(isHR || isAdmin || isManager) && (
                        <div className={`w-3 h-3 rounded-full ${employee.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Employee Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <p><strong>Name:</strong> {selectedEmployee.fullName}</p>
              {(isHR || isAdmin || isManager) && (
                <p><strong>Email:</strong> {selectedEmployee.email}</p>
              )}
              <p><strong>Employee ID:</strong> {selectedEmployee.employeeId}</p>
              <p><strong>Department:</strong> {selectedEmployee.department}</p>
              <p><strong>Position:</strong> {selectedEmployee.position}</p>
              {(isHR || isAdmin || isManager) && selectedEmployee.phoneNumber && (
                <p><strong>Phone:</strong> {selectedEmployee.phoneNumber}</p>
              )}
              <p><strong>Role:</strong> {selectedEmployee.role}</p>
              {(isHR || isAdmin || isManager) && (
                <p><strong>Status:</strong> {selectedEmployee.isActive ? 'Active' : 'Inactive'}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Employee</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateEmployee(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={selectedEmployee.fullName}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, fullName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={selectedEmployee.department}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, department: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Position</label>
                  <input
                    type="text"
                    value={selectedEmployee.position}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, position: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={selectedEmployee.phoneNumber}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, phoneNumber: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to delete {selectedEmployee.fullName}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteEmployee}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
