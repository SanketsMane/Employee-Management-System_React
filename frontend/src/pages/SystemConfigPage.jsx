import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Users,
  Building,
  Award,
  Briefcase,
  Gift,
  GripVertical,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const SystemConfigPage = () => {
  const { user, isAdmin } = useAuth();
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', description: '', color: '#3B82F6' });

  const configTypes = [
    { 
      type: 'departments', 
      title: 'Departments', 
      description: 'Manage company departments',
      icon: Building,
      color: 'text-blue-600'
    },
    { 
      type: 'roles', 
      title: 'Roles', 
      description: 'Manage user roles and positions',
      icon: Users,
      color: 'text-green-600'
    },
    { 
      type: 'positions', 
      title: 'Positions', 
      description: 'Manage job positions',
      icon: Briefcase,
      color: 'text-purple-600'
    },
    { 
      type: 'skills', 
      title: 'Skills', 
      description: 'Manage employee skills',
      icon: Award,
      color: 'text-orange-600'
    },
    { 
      type: 'benefits', 
      title: 'Benefits', 
      description: 'Manage employee benefits',
      icon: Gift,
      color: 'text-pink-600'
    }
  ];

  const predefinedColors = [
    '#DC2626', '#EA580C', '#F59E0B', '#84CC16', '#10B981',
    '#06B6D4', '#0891B2', '#1D4ED8', '#3B82F6', '#7C3AED',
    '#8B5CF6', '#C026D3', '#DB2777', '#E11D48', '#6B7280'
  ];

  useEffect(() => {
    if (isAdmin) {
      fetchConfigs();
    }
  }, [isAdmin]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/system/config');
      if (response.data.success) {
        setConfigs(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching configs:', error);
      toast.error('Failed to load system configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (configType) => {
    if (!newItem.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post(`/system/config/${configType}`, newItem);
      if (response.data.success) {
        setConfigs(prev => ({
          ...prev,
          [configType]: response.data.data.items
        }));
        setNewItem({ name: '', description: '', color: '#3B82F6' });
        setShowAddForm(null);
        toast.success(`${newItem.name} added successfully`);
      }
    } catch (error) {
      console.error('❌ Error adding item:', error);
      toast.error(error.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (configType, itemId, updateData) => {
    try {
      setSaving(true);
      const response = await api.put(`/system/config/${configType}/${itemId}`, updateData);
      if (response.data.success) {
        setConfigs(prev => ({
          ...prev,
          [configType]: response.data.data.items
        }));
        setEditingItem(null);
        toast.success('Item updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating item:', error);
      toast.error(error.response?.data?.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (configType, itemId, itemName) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.delete(`/system/config/${configType}/${itemId}`);
      if (response.data.success) {
        setConfigs(prev => ({
          ...prev,
          [configType]: response.data.data.items
        }));
        toast.success(`${itemName} deleted successfully`);
      }
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      toast.error(error.response?.data?.message || 'Failed to delete item');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setShowAddForm(null);
    setNewItem({ name: '', description: '', color: '#3B82F6' });
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">Only administrators can access system configuration settings.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Configuration</h1>
        <p className="text-muted-foreground">
          Manage system-wide configurations including departments, roles, and other organizational settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configTypes.map(({ type, title, description, icon: Icon, color }) => (
          <Card key={type} className="h-fit">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(type)}
                  disabled={saving}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Add Form */}
              {showAddForm === type && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <Input
                        value={newItem.name}
                        onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={`Enter ${type.slice(0, -1)} name`}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem(type)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Input
                        value={newItem.description}
                        onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Color</label>
                      <div className="flex space-x-2">
                        {predefinedColors.map(color => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${
                              newItem.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewItem(prev => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddItem(type)}
                        disabled={saving || !newItem.name.trim()}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Adding...' : 'Add'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                {(configs[type] || []).map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    {editingItem === `${type}-${item._id}` ? (
                      <EditItemForm
                        item={item}
                        onSave={(updateData) => handleUpdateItem(type, item._id, updateData)}
                        onCancel={() => setEditingItem(null)}
                        saving={saving}
                        predefinedColors={predefinedColors}
                      />
                    ) : (
                      <>
                        <div className="flex items-center space-x-3 flex-1">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(`${type}-${item._id}`)}
                            disabled={saving}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(type, item._id, item.name)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {(!configs[type] || configs[type].length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No {type} configured yet</p>
                    <p className="text-sm">Click "Add" to create your first {type.slice(0, -1)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Edit Item Form Component
const EditItemForm = ({ item, onSave, onCancel, saving, predefinedColors }) => {
  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description || '',
    color: item.color
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="flex-1 space-y-3">
      <div>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Name"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </div>
      <div>
        <Input
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description"
        />
      </div>
      <div className="flex space-x-2">
        {predefinedColors.slice(0, 8).map(color => (
          <button
            key={color}
            className={`w-6 h-6 rounded-full border-2 ${
              formData.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => setFormData(prev => ({ ...prev, color }))}
          />
        ))}
      </div>
      <div className="flex space-x-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !formData.name.trim()}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SystemConfigPage;
