'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { tasksService, Task, TaskFilter, TaskStats, CreateTaskDto } from '@/services/tasks.service';

const priorityColors = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-600',
  on_hold: 'bg-yellow-100 text-yellow-800',
};

const categoryLabels: Record<string, string> = {
  client_onboarding: 'Client Onboarding',
  annual_review: 'Annual Review',
  compliance: 'Compliance',
  document_request: 'Document Request',
  follow_up: 'Follow Up',
  meeting_prep: 'Meeting Prep',
  trading: 'Trading',
  billing: 'Billing',
  kyc_verification: 'KYC Verification',
  other: 'Other',
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isOverdue = (dueDate?: string, status?: string) => {
  if (!dueDate || status === 'completed' || status === 'cancelled') return false;
  return new Date(dueDate) < new Date();
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>({});
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'overdue'>('all');

  useEffect(() => {
    fetchData();
  }, [filter, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let tasksData: Task[];
      
      switch (activeTab) {
        case 'my':
          tasksData = await tasksService.getMyTasks();
          break;
        case 'overdue':
          tasksData = await tasksService.getOverdue();
          break;
        default:
          tasksData = await tasksService.getAll(filter);
      }
      
      setTasks(tasksData);
      const statsData = await tasksService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await tasksService.complete(taskId);
      fetchData();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await tasksService.update(taskId, { status });
      fetchData();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Tasks" />
      
      <div className="p-6 lg:p-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        )}

        {/* Tabs and Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {(['all', 'my', 'overdue'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'all' ? 'All Tasks' : tab === 'my' ? 'My Tasks' : 'Overdue'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
              className="rounded-lg border-gray-300 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>

            <select
              value={filter.priority || ''}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value || undefined })}
              className="rounded-lg border-gray-300 text-sm"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + New Task
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">📋</span>
              <p className="mt-2 text-gray-600">No tasks found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create your first task
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    isOverdue(task.dueDate, task.status) ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => {
                          if (task.status === 'completed') {
                            handleUpdateStatus(task.id, 'pending');
                          } else {
                            handleComplete(task.id);
                          }
                        }}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            📁 {categoryLabels[task.category] || task.category}
                          </span>
                          {task.dueDate && (
                            <span className={`flex items-center ${isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : ''}`}>
                              📅 Due: {formatDate(task.dueDate)}
                              {isOverdue(task.dueDate, task.status) && ' (Overdue)'}
                            </span>
                          )}
                          {task.tags && task.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              🏷️ {task.tags.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                        className="text-xs rounded border-gray-300"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function CreateTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState<CreateTaskDto>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'other',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await tasksService.create(formData);
      onCreated();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Create New Task</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-lg border-gray-300"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border-gray-300"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="datetime-local"
              value={formData.dueDate || ''}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full rounded-lg border-gray-300"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
