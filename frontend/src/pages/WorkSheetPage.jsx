import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Save, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2,
  Calendar,
  TrendingUp,
  Target
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../lib/api';

const WorkSheetPage = () => {
  const { user } = useAuth();
  const [worksheet, setWorksheet] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    timeSlot: '09:00',
    task: '',
    description: '',
    status: 'Pending',
    priority: 'Medium'
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyStats, setMonthlyStats] = useState({});

  // Time slots from 9 AM to 7 PM
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Pending', 'In Progress', 'Completed', 'Blocked'];

  // Fetch worksheet data
  const fetchWorksheet = async (date = selectedDate) => {
    try {
      let response;
      const today = new Date().toISOString().split('T')[0];
      
      if (date === today) {
        // Use the today endpoint for current date
        response = await api.get('/worksheets/today');
      } else {
        // For other dates, we might need to use the general endpoint
        response = await api.get(`/worksheets?date=${date}&employeeId=${user._id}&limit=1`);
      }
      
      if (response.data.success) {
        const worksheetData = response.data.data.worksheet;
        setWorksheet(worksheetData);
        
        // Convert backend timeSlots format to frontend tasks format
        const frontendTasks = worksheetData?.timeSlots?.map((slot, index) => ({
          id: index + 1,
          timeSlot: `${slot.hour.toString().padStart(2, '0')}:00`, // Convert 9 to "09:00"
          task: slot.task,
          description: slot.project || '', // Use project as description
          priority: slot.priority,
          status: slot.status,
          notes: slot.notes || ''
        })) || [];
        
        setTasks(frontendTasks);
      }
    } catch (error) {
      console.error('Error fetching worksheet:', error);
    }
  };

  // Fetch monthly stats
  const fetchMonthlyStats = async () => {
    try {
      const response = await api.get('/worksheets/stats');
      
      if (response.data.success) {
        setMonthlyStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorksheet();
      fetchMonthlyStats();
    }
  }, [user, selectedDate]);

  // Add new task
  const handleAddTask = () => {
    if (!newTask.task.trim()) return;

    const task = {
      ...newTask,
      id: Date.now(),
      timeSpent: 0
    };

    setTasks([...tasks, task]);
    setNewTask({
      timeSlot: '09:00',
      task: '',
      description: '',
      status: 'Pending',
      priority: 'Medium'
    });
  };

  // Edit task
  const handleEditTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setEditingTask({ ...task });
  };

  // Update task
  const handleUpdateTask = () => {
    setTasks(tasks.map(t => 
      t.id === editingTask.id ? editingTask : t
    ));
    setEditingTask(null);
  };

  // Delete task
  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // Save worksheet
  const handleSaveWorksheet = async (isSubmitted = false) => {
    setLoading(true);
    try {
      // Convert frontend tasks format to backend timeSlots format
      const timeSlots = tasks.map(task => ({
        hour: parseInt(task.timeSlot.split(':')[0]), // Convert "09:00" to 9
        task: task.task,
        project: task.description || '', // Use description as project
        priority: task.priority,
        status: task.status,
        notes: task.notes || ''
      }));

      const worksheetData = {
        date: selectedDate,
        timeSlots: timeSlots,
        isSubmitted,
        notes: worksheet?.notes || ''
      };

      console.log('Sending worksheet data:', worksheetData);

      let response;
      if (worksheet?._id) {
        // Update existing worksheet
        response = await api.put(`/worksheets/${worksheet._id}`, worksheetData);
      } else {
        // Create new worksheet
        response = await api.post('/worksheets', worksheetData);
      }

      if (response.data.success) {
        await fetchWorksheet();
        await fetchMonthlyStats();
        toast.success(isSubmitted ? 'Worksheet submitted successfully!' : 'Worksheet saved successfully!');
      }
    } catch (error) {
      console.error('Error saving worksheet:', error);
      console.error('Error response data:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error saving worksheet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate productivity score
  const calculateProductivityScore = () => {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalTasks = tasks.length;
    const completionRate = (completedTasks / totalTasks) * 100;
    
    // Factor in priority weighting
    const priorityWeights = { Low: 1, Medium: 2, High: 3, Critical: 4 };
    const weightedCompleted = tasks
      .filter(t => t.status === 'Completed')
      .reduce((sum, t) => sum + priorityWeights[t.priority], 0);
    const totalWeight = tasks.reduce((sum, t) => sum + priorityWeights[t.priority], 0);
    
    const weightedScore = totalWeight > 0 ? (weightedCompleted / totalWeight) * 100 : 0;
    
    return Math.round((completionRate + weightedScore) / 2);
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Blocked': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['Pending'];
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'border-l-green-500',
      'Medium': 'border-l-yellow-500',
      'High': 'border-l-orange-500',
      'Critical': 'border-l-red-500'
    };
    return colors[priority] || colors['Medium'];
  };

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = tasks.length;
  const productivityScore = calculateProductivityScore();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Worksheet</h1>
          <p className="text-gray-600 dark:text-gray-400">Plan and track your daily tasks</p>
        </div>
        <div className="flex items-center space-x-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Productivity Score</div>
            <div className="text-2xl font-bold text-blue-600">{productivityScore}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Add New Task */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Task
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Slot
                </label>
                <select
                  value={newTask.timeSlot}
                  onChange={(e) => setNewTask({ ...newTask, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {new Date(`2000-01-01T${slot}:00`).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddTask}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Title
                </label>
                <Input
                  value={newTask.task}
                  onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                  placeholder="Enter task title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Input
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description..."
                />
              </div>
            </div>
          </Card>

          {/* Tasks Timeline */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tasks Timeline
              </h2>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleSaveWorksheet(false)}
                  disabled={loading}
                  variant="outline"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSaveWorksheet(true)}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No tasks added yet. Start by adding your first task above.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white dark:bg-gray-800 border-l-4 ${getPriorityColor(task.priority)} rounded-lg shadow-sm p-4`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(`2000-01-01T${task.timeSlot}:00`).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {task.priority}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{task.task}</h3>
                        {task.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTask(task.id)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Today's Summary
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                </div>
              </div>
            </div>
          </Card>

          {/* Monthly Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Monthly Stats
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Worksheets Submitted</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {monthlyStats.submittedWorksheets || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Productivity</div>
                <div className="text-2xl font-bold text-purple-600">
                  {monthlyStats.averageProductivity?.toFixed(1) || 0}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</div>
                <div className="text-2xl font-bold text-green-600">
                  {monthlyStats.totalTasksCompleted || 0}
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('/worksheets/history', '_blank')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                View History
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('/reports/productivity', '_blank')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Productivity Report
              </Button>
            </div>
          </Card>

          {/* Worksheet Status */}
          {worksheet && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Submitted</span>
                  {worksheet.isSubmitted ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {worksheet.updatedAt ? new Date(worksheet.updatedAt).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 max-w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Task
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Title
                </label>
                <Input
                  value={editingTask.task}
                  onChange={(e) => setEditingTask({ ...editingTask, task: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Input
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateTask}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Update Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkSheetPage;
