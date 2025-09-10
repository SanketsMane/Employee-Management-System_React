import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings, Clock, Users, Save, TestTube, Calendar } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CompanySettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: 'Default Company',
    attendanceRules: {
      workStartTime: '09:00',
      workEndTime: '17:00',
      lateThresholdMinutes: 15,
      graceTimeMinutes: 5,
      halfDayThresholdHours: 4,
      fullDayRequiredHours: 8,
      weeklyOffDays: [0, 6],
      allowFlexibleTiming: false,
      flexibleStartRange: {
        earliest: '08:00',
        latest: '10:00'
      },
      autoClockOutTime: '19:00',
      allowRemoteWork: true,
      requireLocationForClockIn: false
    },
    leaveRules: {
      casualLeavePerYear: 12,
      sickLeavePerYear: 12,
      earnedLeavePerYear: 21,
      maxConsecutiveDays: 7,
      advanceApplicationDays: 2
    },
    notifications: {
      lateArrivalAlert: true,
      missedClockOutAlert: true,
      dailyReportTime: '18:00'
    },
    timezone: 'Asia/Kolkata'
  });

  const [testData, setTestData] = useState({
    companyName: 'Default Company',
    clockInTime: '',
    clockOutTime: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/company/settings');
      if (response.data.success) {
        setSettings(response.data.data);
        setFormData(response.data.data);
        setTestData(prev => ({ ...prev, companyName: response.data.data.companyName }));
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load company settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNestedInputChange = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const response = await api.post('/company/settings', formData);
      
      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Company settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestRules = async () => {
    try {
      setTestLoading(true);
      const response = await api.post('/company/settings/test-rules', testData);
      
      if (response.data.success) {
        setTestResult(response.data.data);
        toast.success('Test completed successfully!');
      }
    } catch (error) {
      console.error('Error testing rules:', error);
      toast.error(error.response?.data?.message || 'Failed to test rules');
    } finally {
      setTestLoading(false);
    }
  };

  const weekDays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Settings className="mr-3" />
            Company Settings
          </h1>
          <p className="text-gray-600">Configure attendance rules and policies</p>
        </div>
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Attendance Rules */}
        <div className="xl:col-span-2">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Clock className="mr-2" />
              Attendance Rules
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange(null, 'companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange(null, 'timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Start Time</label>
                <input
                  type="time"
                  value={formData.attendanceRules.workStartTime}
                  onChange={(e) => handleInputChange('attendanceRules', 'workStartTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work End Time</label>
                <input
                  type="time"
                  value={formData.attendanceRules.workEndTime}
                  onChange={(e) => handleInputChange('attendanceRules', 'workEndTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grace Time (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.attendanceRules.graceTimeMinutes}
                  onChange={(e) => handleInputChange('attendanceRules', 'graceTimeMinutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Buffer time before marking late</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Late Threshold (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.attendanceRules.lateThresholdMinutes}
                  onChange={(e) => handleInputChange('attendanceRules', 'lateThresholdMinutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum minutes late before marking absent</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Day Hours</label>
                <input
                  type="number"
                  min="4"
                  max="12"
                  value={formData.attendanceRules.fullDayRequiredHours}
                  onChange={(e) => handleInputChange('attendanceRules', 'fullDayRequiredHours', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Half Day Hours</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={formData.attendanceRules.halfDayThresholdHours}
                  onChange={(e) => handleInputChange('attendanceRules', 'halfDayThresholdHours', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Weekly Off Days */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Off Days</label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <label key={day.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.attendanceRules.weeklyOffDays.includes(day.value)}
                      onChange={(e) => {
                        const currentDays = formData.attendanceRules.weeklyOffDays;
                        if (e.target.checked) {
                          handleInputChange('attendanceRules', 'weeklyOffDays', [...currentDays, day.value]);
                        } else {
                          handleInputChange('attendanceRules', 'weeklyOffDays', currentDays.filter(d => d !== day.value));
                        }
                      }}
                      className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="mt-6 space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.attendanceRules.allowFlexibleTiming}
                  onChange={(e) => handleInputChange('attendanceRules', 'allowFlexibleTiming', e.target.checked)}
                  className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Allow Flexible Timing</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.attendanceRules.allowRemoteWork}
                  onChange={(e) => handleInputChange('attendanceRules', 'allowRemoteWork', e.target.checked)}
                  className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Allow Remote Work</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.attendanceRules.requireLocationForClockIn}
                  onChange={(e) => handleInputChange('attendanceRules', 'requireLocationForClockIn', e.target.checked)}
                  className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Require Location for Clock-in</span>
              </label>
            </div>
          </Card>
        </div>

        {/* Test Rules */}
        <div>
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <TestTube className="mr-2" />
              Test Rules
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Clock-in Time</label>
                <input
                  type="datetime-local"
                  value={testData.clockInTime}
                  onChange={(e) => setTestData(prev => ({ ...prev, clockInTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Clock-out Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={testData.clockOutTime}
                  onChange={(e) => setTestData(prev => ({ ...prev, clockOutTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                onClick={handleTestRules}
                disabled={testLoading || !testData.clockInTime}
                className="w-full"
                variant="outline"
              >
                {testLoading ? 'Testing...' : 'Test Rules'}
              </Button>

              {testResult && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-800 mb-2">Test Result</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-medium ${
                        testResult.result.status === 'Present' ? 'text-green-600' :
                        testResult.result.status === 'Late' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {testResult.result.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remarks:</span>
                      <span className="text-gray-600">{testResult.result.remarks}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Current Rules Summary */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="mr-2" />
              Current Rules
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Work Hours:</span>
                <span>{formData.attendanceRules.workStartTime} - {formData.attendanceRules.workEndTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Grace Time:</span>
                <span>{formData.attendanceRules.graceTimeMinutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Late Threshold:</span>
                <span>{formData.attendanceRules.lateThresholdMinutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Full Day:</span>
                <span>{formData.attendanceRules.fullDayRequiredHours} hours</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanySettingsPage;
