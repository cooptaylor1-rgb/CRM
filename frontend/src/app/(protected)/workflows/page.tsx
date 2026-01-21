'use client';

import { useState, useEffect } from 'react';
import { 
  PageHeader, 
  PageContent 
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  StatusBadge,
} from '@/components/ui';
import { PlusIcon, Cog6ToothIcon, PlayIcon, XCircleIcon, HandRaisedIcon, ClockIcon, BoltIcon, ArrowPathIcon } from '@heroicons/react/20/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { workflowsService, WorkflowTemplate, WorkflowInstance, WorkflowStats } from '@/services/workflows.service';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const statusConfig: Record<string, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Pending', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'info' },
  running: { label: 'Running', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
  cancelled: { label: 'Cancelled', variant: 'warning' },
};

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'instances'>('templates');
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

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

  useEffect(() => {
    loadData();
  }, []);

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

  const getTriggerIcon = (triggerType: string) => {
    const iconClass = "w-5 h-5 text-content-tertiary";
    switch (triggerType) {
      case 'manual':
        return <HandRaisedIcon className={iconClass} />;
      case 'scheduled':
        return <ClockIcon className={iconClass} />;
      case 'event':
        return <BoltIcon className={iconClass} />;
      case 'condition':
        return <ArrowPathIcon className={iconClass} />;
      default:
        return <Cog6ToothIcon className={iconClass} />;
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Workflows" subtitle="Automate your client management processes" />
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Workflows"
        subtitle="Automate your client management processes"
        actions={
          <Button 
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            New Template
          </Button>
        }
      />

      <PageContent>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Total Templates</p>
              <p className="text-2xl font-semibold text-content-primary mt-1">{templates.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Active Workflows</p>
              <p className="text-2xl font-semibold text-status-success-text mt-1">{stats.totalActive}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Completed This Month</p>
              <p className="text-2xl font-semibold text-status-info-text mt-1">{stats.completedThisMonth}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Avg Days to Complete</p>
              <p className="text-2xl font-semibold text-accent-primary mt-1">{stats.averageCompletionDays.toFixed(1)}</p>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border-default mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-content-secondary hover:text-content-primary'
              }`}
            >
              Templates ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab('instances')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'instances'
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-content-secondary hover:text-content-primary'
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
              <Card className="p-8 text-center">
                <Cog6ToothIcon className="w-12 h-12 text-content-tertiary mx-auto" />
                <h3 className="text-lg font-medium text-content-primary mt-4 mb-2">No workflow templates</h3>
                <p className="text-content-secondary mb-4">Create your first workflow template to automate tasks</p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                >
                  Create Template
                </Button>
              </Card>
            ) : (
              templates.map((template) => (
                <Card
                  key={template.id}
                  className="p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-surface-secondary rounded-lg">
                          {getTriggerIcon(template.trigger)}
                        </div>
                        <div>
                          <h3 className="font-medium text-content-primary">{template.name}</h3>
                          <p className="text-sm text-content-secondary">{template.description}</p>
                        </div>
                      </div>

                      {/* Steps Preview */}
                      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
                        {template.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center">
                            <div className="px-3 py-1 bg-surface-secondary rounded text-sm whitespace-nowrap text-content-primary">
                              {step.name}
                            </div>
                            {index < template.steps.length - 1 && (
                              <span className="mx-2 text-content-tertiary">→</span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-sm text-content-tertiary">
                        <span>Trigger: {template.trigger}</span>
                        <span>{template.steps.length} steps</span>
                        <span>
                          Created {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={template.status === 'active' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => handleToggleTemplate(template.id, template.status === 'active')}
                      >
                        {template.status === 'active' ? 'Active' : 'Inactive'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Instances Tab */}
        {activeTab === 'instances' && (
          <Card noPadding>
            {instances.length === 0 ? (
              <div className="p-8 text-center">
                <PlayIcon className="w-12 h-12 text-content-tertiary mx-auto" />
                <h3 className="text-lg font-medium text-content-primary mt-4 mb-2">No workflow runs</h3>
                <p className="text-content-secondary">Workflow runs will appear here when templates are triggered</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-border-default">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">
                      Instance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-primary divide-y divide-border-default">
                  {instances.map((instance) => {
                    const template = templates.find(t => t.id === instance.templateId);
                    const totalSteps = template?.steps.length || Object.keys(instance.stepStatuses).length || 1;
                    return (
                      <tr key={instance.id} className="hover:bg-surface-secondary">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-content-primary">{template?.name || 'Unknown Workflow'}</div>
                          <div className="text-sm text-content-secondary">
                            {instance.metadata?.householdName || instance.metadata?.clientName || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge 
                            status={statusConfig[instance.status]?.variant || 'default'} 
                            label={statusConfig[instance.status]?.label || instance.status.replace('_', ' ')} 
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-surface-secondary rounded-full h-2 w-24">
                              <div
                                className="bg-accent-primary h-2 rounded-full"
                                style={{
                                  width: `${(instance.currentStep / totalSteps) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-content-tertiary">
                              {instance.currentStep}/{totalSteps}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">
                          {new Date(instance.startedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {instance.status === 'running' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelInstance(instance.id)}
                              className="text-status-error-text"
                            >
                              <XCircleIcon className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </PageContent>

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
    </>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-content-primary">Create Workflow Template</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-tertiary hover:bg-surface-secondary hover:text-content-primary transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              placeholder="e.g., New Client Onboarding"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              rows={2}
              placeholder="Describe what this workflow does..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Trigger Type</label>
            <select
              value={formData.trigger}
              onChange={(e) => setFormData({ ...formData, trigger: e.target.value as any })}
              className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
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
              <label className="text-sm font-medium text-content-secondary">Steps</label>
              <button
                type="button"
                onClick={handleAddStep}
                className="text-sm text-accent-400 hover:text-accent-300"
              >
                + Add Step
              </button>
            </div>
            <div className="space-y-3">
              {formData.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2 p-3 bg-surface-secondary rounded-lg">
                  <span className="text-sm font-medium text-content-tertiary w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => handleStepChange(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent-500"
                    placeholder="Step name"
                    required
                  />
                  <select
                    value={step.type}
                    onChange={(e) => handleStepChange(index, 'type', e.target.value)}
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
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
                      className="p-2 text-status-error-text hover:bg-status-error-bg rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={(e) => {
              const form = (e.target as HTMLElement).closest('.bg-surface')?.querySelector('form');
              if (form) form.requestSubmit();
            }}
            loading={saving}
            loadingText="Creating..."
          >
            Create Template
          </Button>
        </div>
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await workflowsService.deleteTemplate(template.id);
      onUpdated();
    } catch (error) {
      console.error('Failed to delete template:', error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-content-primary">{template.name}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-tertiary hover:bg-surface-secondary hover:text-content-primary transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="text-sm text-content-tertiary">Description</div>
            <div className="text-content-primary">{template.description || 'No description'}</div>
          </div>

          <div>
            <div className="text-sm text-content-tertiary">Trigger</div>
            <div className="text-content-primary capitalize">{template.trigger.replace(/_/g, ' ')}</div>
          </div>

          <div>
            <div className="text-sm text-content-tertiary mb-2">Steps ({template.steps.length})</div>
            <div className="space-y-2">
              {template.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg"
                >
                  <span className="w-6 h-6 bg-accent-500/20 text-accent-400 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-medium text-content-primary">{step.name}</div>
                    <div className="text-sm text-content-tertiary capitalize">{step.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showDeleteConfirm ? (
          <div className="p-4 border-t border-border bg-status-error-bg/20">
            <p className="text-sm text-content-primary mb-3">
              Are you sure you want to delete this template? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} loading={deleting}>
                {deleting ? 'Deleting...' : 'Delete Template'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between gap-3 p-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-status-error-text"
            >
              Delete
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              {template.trigger === 'manual' && (
                <Button variant="primary" onClick={handleTrigger}>
                  Run Now
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
