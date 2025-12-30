'use client';

import { useState, useEffect } from 'react';
import { workflowsService, WorkflowTemplate, WorkflowInstance, WorkflowStats } from '@/services/workflows.service';

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'instances'>('templates');
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, instancesData, statsData] = await Promise.all([
        workflowsService.getTemplates(),
        workflowsService.getActiveInstances(),
        workflowsService.getStats(),
      ]);
      setTemplates(templatesData);
      setInstances(instancesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load workflows data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTemplate = async (templateId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await workflowsService.deactivateTemplate(templateId);
      } else {
        await workflowsService.activateTemplate(templateId);
      }
      loadData();
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  };

  const handleCancelInstance = async (instanceId: string) => {
    try {
      await workflowsService.cancelWorkflow(instanceId);
      loadData();
    } catch (error) {
      console.error('Failed to cancel instance:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      cancelled: 'bg-yellow-100 text-yellow-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getTriggerIcon = (triggerType: string) => {
    const icons: Record<string, string> = {
      manual: '👆',
      scheduled: '⏰',
      event: '⚡',
      condition: '🔄',
    };
    return icons[triggerType] || '📋';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading workflows...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-1">Automate your client management processes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Template
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
            <div className="text-sm text-gray-500">Total Templates</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.totalActive}</div>
            <div className="text-sm text-gray-500">Active Workflows</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.completedThisMonth}</div>
            <div className="text-sm text-gray-500">Completed This Month</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">{stats.averageCompletionDays.toFixed(1)}</div>
            <div className="text-sm text-gray-500">Avg Days to Complete</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('instances')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'instances'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Runs ({instances.length})
          </button>
        </nav>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid gap-4">
          {templates.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center shadow-sm border">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflow templates</h3>
              <p className="text-gray-500 mb-4">Create your first workflow template to automate tasks</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Template
              </button>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTriggerIcon(template.trigger)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500">{template.description}</p>
                      </div>
                    </div>

                    {/* Steps Preview */}
                    <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
                      {template.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                          <div className="px-3 py-1 bg-gray-100 rounded text-sm whitespace-nowrap">
                            {step.name}
                          </div>
                          {index < template.steps.length - 1 && (
                            <span className="mx-2 text-gray-400">→</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>Trigger: {template.trigger}</span>
                      <span>{template.steps.length} steps</span>
                      <span>
                        Created {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleTemplate(template.id, template.status === 'active')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        template.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {template.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      ⚙️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Instances Tab */}
      {activeTab === 'instances' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {instances.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflow runs</h3>
              <p className="text-gray-500">Workflow runs will appear here when templates are triggered</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Instance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {instances.map((instance) => {
                  const template = templates.find(t => t.id === instance.templateId);
                  const totalSteps = template?.steps.length || Object.keys(instance.stepStatuses).length || 1;
                  return (
                    <tr key={instance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{template?.name || 'Unknown Workflow'}</div>
                        <div className="text-sm text-gray-500">
                          {instance.metadata?.householdName || instance.metadata?.clientName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            instance.status
                          )}`}
                        >
                          {instance.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(instance.currentStep / totalSteps) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">
                            {instance.currentStep}/{totalSteps}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(instance.startedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {instance.status === 'running' && (
                          <button
                            onClick={() => handleCancelInstance(instance.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUpdated={() => {
            setSelectedTemplate(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function CreateTemplateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'manual' as const,
    steps: [{ id: crypto.randomUUID(), name: '', type: 'task' as const, order: 1, config: {} }],
  });
  const [saving, setSaving] = useState(false);

  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { 
        id: crypto.randomUUID(), 
        name: '', 
        type: 'task' as const, 
        order: formData.steps.length + 1,
        config: {} 
      }],
    });
  };

  const handleRemoveStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })),
    });
  };

  const handleStepChange = (index: number, field: string, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await workflowsService.createTemplate({
        name: formData.name,
        description: formData.description,
        trigger: formData.trigger,
        steps: formData.steps.map((step, index) => ({
          id: step.id,
          name: step.name,
          type: step.type as 'task' | 'email' | 'notification' | 'wait' | 'condition' | 'meeting',
          order: index + 1,
          config: step.config,
        })),
      });
      onCreated();
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Workflow Template</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., New Client Onboarding"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Describe what this workflow does..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
            <select
              value={formData.trigger}
              onChange={(e) => setFormData({ ...formData, trigger: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="manual">Manual</option>
              <option value="scheduled">Scheduled</option>
              <option value="new_client_onboarding">New Client Onboarding</option>
              <option value="annual_review_due">Annual Review Due</option>
              <option value="quarterly_review_due">Quarterly Review Due</option>
              <option value="client_birthday">Client Birthday</option>
              <option value="kyc_expiring">KYC Expiring</option>
              <option value="new_prospect">New Prospect</option>
              <option value="prospect_won">Prospect Won</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Steps</label>
              <button
                type="button"
                onClick={handleAddStep}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Step
              </button>
            </div>
            <div className="space-y-3">
              {formData.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => handleStepChange(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Step name"
                    required
                  />
                  <select
                    value={step.type}
                    onChange={(e) => handleStepChange(index, 'type', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="task">Create Task</option>
                    <option value="email">Send Email</option>
                    <option value="notification">Send Notification</option>
                    <option value="wait">Wait</option>
                    <option value="meeting">Schedule Meeting</option>
                    <option value="condition">Condition</option>
                  </select>
                  {formData.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TemplateDetailModal({
  template,
  onClose,
  onUpdated,
}: {
  template: WorkflowTemplate;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      setDeleting(true);
      await workflowsService.deleteTemplate(template.id);
      onUpdated();
    } catch (error) {
      console.error('Failed to delete template:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleTrigger = async () => {
    try {
      await workflowsService.startWorkflow({ templateId: template.id });
      onUpdated();
    } catch (error) {
      console.error('Failed to trigger workflow:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{template.name}</h2>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Description</div>
            <div className="text-gray-900">{template.description || 'No description'}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Trigger</div>
            <div className="text-gray-900 capitalize">{template.trigger.replace(/_/g, ' ')}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-2">Steps ({template.steps.length})</div>
            <div className="space-y-2">
              {template.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{step.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{step.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-6 border-t mt-6">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Close
            </button>
            {template.trigger === 'manual' && (
              <button
                onClick={handleTrigger}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Run Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
