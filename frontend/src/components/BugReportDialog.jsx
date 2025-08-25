import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bug, Camera, FileText, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const BugReportDialog = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'other',
    stepsToReproduce: '',
    browserInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      url: window.location.href
    }
  });
  const [loading, setLoading] = useState(false);
  const [screenshots, setScreenshots] = useState([]);

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const categories = [
    { value: 'ui/ux', label: 'UI/UX Issues' },
    { value: 'functionality', label: 'Functionality' },
    { value: 'performance', label: 'Performance' },
    { value: 'security', label: 'Security' },
    { value: 'data', label: 'Data Issues' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + screenshots.length > 3) {
      toast.error('Maximum 3 screenshots allowed');
      return;
    }
    setScreenshots(prev => [...prev, ...files]);
  };

  const removeScreenshot = (index) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create bug report
      const response = await api.post('/bug-reports', formData);
      const bugReportId = response.data.data._id;

      // Upload screenshots if any
      if (screenshots.length > 0) {
        for (const screenshot of screenshots) {
          const screenshotData = new FormData();
          screenshotData.append('screenshot', screenshot);
          
          await api.post(`/bug-reports/${bugReportId}/screenshot`, screenshotData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      toast.success('Bug report submitted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'other',
        stepsToReproduce: '',
        browserInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          url: window.location.href
        }
      });
      setScreenshots([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit bug report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-500" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Help us improve the system by reporting any issues you encounter
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Bug Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Brief description of the issue"
              value={formData.title}
              onChange={handleInputChange}
              required
              maxLength={200}
            />
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={priority.color} variant="outline">
                          {priority.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detailed description of the bug..."
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Steps to Reproduce */}
          <div className="space-y-2">
            <Label htmlFor="stepsToReproduce">Steps to Reproduce</Label>
            <Textarea
              id="stepsToReproduce"
              name="stepsToReproduce"
              placeholder="1. Go to...&#10;2. Click on...&#10;3. Expected vs Actual result..."
              value={formData.stepsToReproduce}
              onChange={handleInputChange}
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Screenshots */}
          <div className="space-y-2">
            <Label>Screenshots (Optional - Max 3)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="screenshot-upload"
                disabled={screenshots.length >= 3}
              />
              <label
                htmlFor="screenshot-upload"
                className={`flex flex-col items-center justify-center cursor-pointer ${
                  screenshots.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload screenshots ({screenshots.length}/3)
                </p>
              </label>
            </div>

            {/* Screenshot Preview */}
            {screenshots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {screenshots.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Browser Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">System Information</CardTitle>
              <CardDescription className="text-xs">
                This information helps us debug the issue
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium">Platform:</span> {formData.browserInfo.platform}
                </div>
                <div>
                  <span className="font-medium">Browser:</span> {formData.browserInfo.userAgent.split(' ')[0]}
                </div>
                <div>
                  <span className="font-medium">Page URL:</span> {formData.browserInfo.url}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.description}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Submit Bug Report
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BugReportDialog;
