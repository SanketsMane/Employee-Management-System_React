import React, { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, AlertCircle, Save, Send, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DailyTaskSheet = () => {
  const [taskSheet, setTaskSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTodayTaskSheet();
  }, []);

  const fetchTodayTaskSheet = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/task-sheets/today', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setTaskSheet(data.data);
        setTasks(data.data.tasks || []);
      } else {
        // No task sheet for today, start with empty tasks
        setTasks([]);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error fetching today task sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = () => {
    const newTask = {
      taskTitle: '',
      description: '',
      priority: 'Medium',
      status: 'Not Started',
      estimatedTime: 60,
      actualTime: 0,
      comments: ''
    };
    setTasks([...tasks, newTask]);
    setIsEditing(true);
  };

  const updateTask = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = {
      ...updatedTasks[index],
      [field]: value
    };
    setTasks(updatedTasks);
  };

  const removeTask = (index) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  const saveTaskSheet = async (submit = false) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Validate tasks
      const validTasks = tasks.filter(task => task.taskTitle.trim() !== '');
      if (validTasks.length === 0) {
        toast.error('Please add at least one task');
        return;
      }

      const response = await fetch('/api/task-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tasks: validTasks
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTaskSheet(data.data);
        setTasks(data.data.tasks);
        setIsEditing(false);
        
        if (submit) {
          await submitTaskSheet(data.data._id);
        } else {
          toast.success('Task sheet saved successfully');
        }
      } else {
        toast.error(data.message || 'Error saving task sheet');
      }
    } catch (error) {
      console.error('Error saving task sheet:', error);
      toast.error('Error saving task sheet');
    } finally {
      setSaving(false);
    }
  };

  const submitTaskSheet = async (taskSheetId) => {
    try {
      const token = localStorage.getItem('token');
      const id = taskSheetId || taskSheet._id;
      
      const response = await fetch(`/api/task-sheets/${id}/submit`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setTaskSheet(data.data);
        toast.success('Task sheet submitted successfully');
      } else {
        toast.error(data.message || 'Error submitting task sheet');
      }
    } catch (error) {
      console.error('Error submitting task sheet:', error);
      toast.error('Error submitting task sheet');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalPlannedTime = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
  const totalActualTime = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Daily Task Sheet</h1>
              <p className="text-gray-600 mt-2">{today}</p>
            </div>
            <div className="flex items-center space-x-3">
              {taskSheet?.isSubmitted && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Submitted
                </span>
              )}
              {!taskSheet?.isSubmitted && tasks.length > 0 && (
                <>
                  {isEditing ? (
                    <button
                      onClick={() => saveTaskSheet()}
                      disabled={saving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => saveTaskSheet(true)}
                    disabled={saving || tasks.length === 0}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{formatTime(totalPlannedTime)}</div>
              <div className="text-sm text-gray-600">Planned Time</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{formatTime(totalActualTime)}</div>
              <div className="text-sm text-gray-600">Actual Time</div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Today's Tasks</h2>
              {(isEditing || tasks.length === 0) && !taskSheet?.isSubmitted && (
                <button
                  onClick={addTask}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Added</h3>
                <p className="text-gray-500 mb-4">Start by adding your first task for today</p>
                <button
                  onClick={addTask}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Task
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Task Title */}
                      <div className="lg:col-span-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={task.taskTitle}
                            onChange={(e) => updateTask(index, 'taskTitle', e.target.value)}
                            placeholder="Task title..."
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          />
                        ) : (
                          <h4 className="font-medium text-gray-900">{task.taskTitle}</h4>
                        )}
                      </div>

                      {/* Description */}
                      <div className="lg:col-span-3">
                        {isEditing ? (
                          <textarea
                            value={task.description}
                            onChange={(e) => updateTask(index, 'description', e.target.value)}
                            placeholder="Description..."
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            rows={2}
                          />
                        ) : (
                          <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                      </div>

                      {/* Priority & Status */}
                      <div className="lg:col-span-2 space-y-2">
                        {isEditing ? (
                          <>
                            <select
                              value={task.priority}
                              onChange={(e) => updateTask(index, 'priority', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              <option value="Urgent">Urgent</option>
                            </select>
                            <select
                              value={task.status}
                              onChange={(e) => updateTask(index, 'status', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="On Hold">On Hold</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </>
                        ) : (
                          <>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Time Tracking */}
                      <div className="lg:col-span-2 space-y-2">
                        {isEditing ? (
                          <>
                            <div>
                              <label className="block text-xs text-gray-500">Estimated (min)</label>
                              <input
                                type="number"
                                value={task.estimatedTime}
                                onChange={(e) => updateTask(index, 'estimatedTime', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border border-gray-300 rounded-md text-sm"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Actual (min)</label>
                              <input
                                type="number"
                                value={task.actualTime}
                                onChange={(e) => updateTask(index, 'actualTime', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border border-gray-300 rounded-md text-sm"
                                min="0"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-gray-600">
                              Est: {formatTime(task.estimatedTime)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Act: {formatTime(task.actualTime)}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Comments & Actions */}
                      <div className="lg:col-span-2">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={task.comments}
                              onChange={(e) => updateTask(index, 'comments', e.target.value)}
                              placeholder="Comments..."
                              className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                            />
                            <button
                              onClick={() => removeTask(index)}
                              className="p-2 text-red-600 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">{task.comments}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review Comments */}
        {taskSheet?.reviewComments && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Review Comments</h3>
            <p className="text-blue-800 text-sm">{taskSheet.reviewComments}</p>
            {taskSheet.reviewedBy && (
              <p className="text-blue-600 text-xs mt-2">
                Reviewed by {taskSheet.reviewedBy.firstName} {taskSheet.reviewedBy.lastName} on {' '}
                {new Date(taskSheet.reviewedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyTaskSheet;
