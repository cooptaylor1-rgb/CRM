'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  PageHeader, 
  PageContent 
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  StatusBadge,
  Input,
  Select,
  SkeletonTasks,
  ErrorState,
  DataFreshness,
  EmptyState,
} from '@/components/ui';
import { PlusIcon, CheckIcon, ClockIcon, ExclamationTriangleIcon, FolderIcon, CalendarIcon, TagIcon } from '@heroicons/react/20/solid';
import { tasksService, Task, TaskFilter, TaskStats, CreateTaskDto } from '@/services/tasks.service';
import { CreateTaskModal } from '@/components/modals';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const priorityConfig: Record<string, { label: string; variant: StatusVariant }> = {
  urgent: { label: 'Urgent', variant: 'error' },
  high: { label: 'High', variant: 'warning' },
  medium: { label: 'Medium', variant: 'info' },
  low: { label: 'Low', variant: 'default' },
};

const statusConfig: Record<string, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Pending', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  on_hold: { label: 'On Hold', variant: 'warning' },
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
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>({});
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'overdue'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      
      // Ensure tasksData is always an array
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      const statsData = await tasksService.getStats();
      setStats(statsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    <>
      <PageHeader
        title="Tasks"
        subtitle={stats ? `${stats.total} total • ${stats.pending} pending • ${stats.overdue} overdue` : undefined}
        actions={
          <Button 
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            New Task
          </Button>
        }
      />

      <PageContent>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Total</p>
              <p className="text-2xl font-semibold text-content-primary mt-1">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-semibold text-content-secondary mt-1">{stats.pending}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">In Progress</p>
              <p className="text-2xl font-semibold text-status-info-text mt-1">{stats.inProgress}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-semibold text-status-success-text mt-1">{stats.completed}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Overdue</p>
              <p className="text-2xl font-semibold text-status-error-text mt-1">{stats.overdue}</p>
            </Card>
          </div>
        )}

        {/* Tabs and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1">
            {(['all', 'my', 'overdue'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-surface-primary text-content-primary shadow-sm'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                {tab === 'all' ? 'All Tasks' : tab === 'my' ? 'My Tasks' : 'Overdue'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={filter.status || ''}
              onChange={(value) => setFilter({ ...filter, status: value || undefined })}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'on_hold', label: 'On Hold' },
              ]}
              className="w-36"
            />

            <Select
              value={filter.priority || ''}
              onChange={(value) => setFilter({ ...filter, priority: value || undefined })}
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              className="w-36"
            />

            <DataFreshness 
              lastUpdated={lastUpdated} 
              onRefresh={fetchData}
              isRefreshing={loading}
              className="ml-auto"
            />
          </div>
        </div>

        {/* Tasks List */}
        <Card noPadding>
          {error ? (
            <ErrorState
              title="Couldn't load tasks"
              message={error}
              onRetry={fetchData}
            />
          ) : loading ? (
            <SkeletonTasks rows={6} />
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={<ClockIcon className="w-6 h-6" />}
              title="No tasks found"
              description={activeTab === 'overdue' ? 'Great job! No overdue tasks.' : 'Create a task to track your work.'}
              action={
                <Button
                  onClick={() => setShowCreateModal(true)}
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                >
                  Create your first task
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border-default">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 hover:bg-surface-secondary transition-colors ${
                    isOverdue(task.dueDate, task.status) ? 'bg-status-error-bg' : ''
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
                        className="mt-1 h-5 w-5 rounded border-border-default text-accent-primary focus:ring-accent-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-content-tertiary' : 'text-content-primary'}`}>
                            {task.title}
                          </h3>
                          <StatusBadge 
                            status={priorityConfig[task.priority]?.variant || 'default'} 
                            label={priorityConfig[task.priority]?.label || task.priority} 
                          />
                          <StatusBadge 
                            status={statusConfig[task.status]?.variant || 'default'} 
                            label={statusConfig[task.status]?.label || task.status.replace('_', ' ')} 
                          />
                        </div>
                        {task.description && (
                          <p className="text-sm text-content-secondary mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-content-tertiary">
                          <span className="flex items-center gap-1">
                            <FolderIcon className="w-3.5 h-3.5" />
                            {categoryLabels[task.category] || task.category}
                          </span>
                          {task.dueDate && (
                            <span className={`flex items-center gap-1 ${isOverdue(task.dueDate, task.status) ? 'text-status-error-text font-medium' : ''}`}>
                              <CalendarIcon className="w-3.5 h-3.5" />
                              Due: {formatDate(task.dueDate)}
                              {isOverdue(task.dueDate, task.status) && ' (Overdue)'}
                            </span>
                          )}
                          {task.tags && task.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              <TagIcon className="w-3.5 h-3.5" />
                              {task.tags.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={task.status}
                        onChange={(value) => handleUpdateStatus(task.id, value)}
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'in_progress', label: 'In Progress' },
                          { value: 'completed', label: 'Completed' },
                          { value: 'on_hold', label: 'On Hold' },
                        ]}
                        className="w-32"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageContent>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchData();
        }}
      />
    </>
  );
}
