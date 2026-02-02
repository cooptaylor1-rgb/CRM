'use client';

import * as React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  GripVerticalIcon,
  CheckCircleIcon,
  MailIcon,
  BellIcon,
  ClockIcon,
  GitBranchIcon,
  CalendarIcon,
  ClipboardListIcon,
  PlayIcon,
  SaveIcon,
  XIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  SettingsIcon,
  Loader2Icon,
  ZapIcon,
} from 'lucide-react';
import { Card, Badge, Button, Input, Select, Modal, ModalFooter, FormGroup, FormRow } from '@/components/ui';
import { workflowsService, WorkflowTemplate, WorkflowStep } from '@/services/workflows.service';

// =============================================================================
// Types
// =============================================================================

interface WorkflowBuilderProps {
  templateId?: string;
  onSave?: (template: WorkflowTemplate) => void;
  onClose?: () => void;
}

type StepType = 'task' | 'email' | 'notification' | 'wait' | 'condition' | 'meeting';

// =============================================================================
// Constants
// =============================================================================

const stepTypeConfig: Record<StepType, { label: string; icon: React.ElementType; color: string }> = {
  task: { label: 'Task', icon: ClipboardListIcon, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  email: { label: 'Send Email', icon: MailIcon, color: 'bg-green-100 text-green-700 border-green-200' },
  notification: { label: 'Notification', icon: BellIcon, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  wait: { label: 'Wait/Delay', icon: ClockIcon, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  condition: { label: 'Condition', icon: GitBranchIcon, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  meeting: { label: 'Schedule Meeting', icon: CalendarIcon, color: 'bg-pink-100 text-pink-700 border-pink-200' },
};

const triggerOptions = [
  { value: 'new_client_onboarding', label: 'New Client Onboarding' },
  { value: 'annual_review_due', label: 'Annual Review Due' },
  { value: 'quarterly_review_due', label: 'Quarterly Review Due' },
  { value: 'client_birthday', label: 'Client Birthday' },
  { value: 'client_anniversary', label: 'Client Anniversary' },
  { value: 'account_opened', label: 'Account Opened' },
  { value: 'account_closed', label: 'Account Closed' },
  { value: 'large_deposit', label: 'Large Deposit' },
  { value: 'large_withdrawal', label: 'Large Withdrawal' },
  { value: 'kyc_expiring', label: 'KYC Expiring' },
  { value: 'document_expiring', label: 'Document Expiring' },
  { value: 'compliance_review_due', label: 'Compliance Review Due' },
  { value: 'new_prospect', label: 'New Prospect' },
  { value: 'prospect_stage_change', label: 'Prospect Stage Change' },
  { value: 'prospect_won', label: 'Prospect Won' },
  { value: 'manual', label: 'Manual Trigger' },
  { value: 'scheduled', label: 'Scheduled' },
];

const assigneeOptions = [
  { value: 'advisor', label: 'Primary Advisor' },
  { value: 'operations', label: 'Operations Team' },
  { value: 'compliance', label: 'Compliance Team' },
  { value: 'specific_user', label: 'Specific User' },
];

// =============================================================================
// Component
// =============================================================================

export function WorkflowBuilder({ templateId, onSave, onClose }: WorkflowBuilderProps) {
  const [loading, setLoading] = React.useState(!!templateId);
  const [saving, setSaving] = React.useState(false);
  const [activeStepId, setActiveStepId] = React.useState<string | null>(null);
  const [showAddStep, setShowAddStep] = React.useState(false);

  const [formData, setFormData] = React.useState<{
    name: string;
    description: string;
    trigger: string;
    estimatedDurationDays: number;
    tags: string[];
    steps: WorkflowStep[];
  }>({
    name: '',
    description: '',
    trigger: 'manual',
    estimatedDurationDays: 7,
    tags: [],
    steps: [],
  });

  React.useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;
    try {
      const template = await workflowsService.getTemplate(templateId);
      setFormData({
        name: template.name,
        description: template.description || '',
        trigger: template.trigger,
        estimatedDurationDays: template.estimatedDurationDays || 7,
        tags: template.tags || [],
        steps: template.steps || [],
      });
    } catch {
      toast.error('Failed to load workflow template');
    } finally {
      setLoading(false);
    }
  };

  const generateStepId = () => `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleAddStep = (type: StepType) => {
    const newStep: WorkflowStep = {
      id: generateStepId(),
      name: `New ${stepTypeConfig[type].label}`,
      type,
      order: formData.steps.length + 1,
      config: getDefaultConfig(type),
    };

    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
    setActiveStepId(newStep.id);
    setShowAddStep(false);
  };

  const getDefaultConfig = (type: StepType): WorkflowStep['config'] => {
    switch (type) {
      case 'task':
        return {
          taskTitle: '',
          taskDescription: '',
          taskCategory: 'general',
          taskPriority: 'medium',
          assignTo: 'advisor',
          dueDaysFromStart: 1,
        };
      case 'email':
        return {
          emailTemplate: '',
          emailRecipient: 'client',
        };
      case 'notification':
        return {
          notificationMessage: '',
          notifyUsers: [],
        };
      case 'wait':
        return {
          waitDays: 1,
        };
      case 'condition':
        return {
          condition: '',
          trueSteps: [],
          falseSteps: [],
        };
      case 'meeting':
        return {
          meetingType: 'general',
          meetingTitle: '',
          meetingDuration: 30,
        };
    }
  };

  const handleUpdateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    }));
  };

  const handleUpdateStepConfig = (stepId: string, configUpdates: Partial<WorkflowStep['config']>) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, config: { ...step.config, ...configUpdates } } : step
      ),
    }));
  };

  const handleDeleteStep = (stepId: string) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((step) => step.id !== stepId),
    }));
    if (activeStepId === stepId) {
      setActiveStepId(null);
    }
  };

  const handleDuplicateStep = (stepId: string) => {
    const step = formData.steps.find((s) => s.id === stepId);
    if (!step) return;

    const newStep: WorkflowStep = {
      ...step,
      id: generateStepId(),
      name: `${step.name} (Copy)`,
      order: formData.steps.length + 1,
    };

    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  };

  const handleReorder = (newOrder: WorkflowStep[]) => {
    setFormData((prev) => ({
      ...prev,
      steps: newOrder.map((step, index) => ({ ...step, order: index + 1 })),
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }
    if (formData.steps.length === 0) {
      toast.error('Please add at least one step');
      return;
    }

    setSaving(true);
    try {
      let template: WorkflowTemplate;
      if (templateId) {
        template = await workflowsService.updateTemplate(templateId, formData as any);
      } else {
        template = await workflowsService.createTemplate(formData as any);
      }
      toast.success('Workflow saved successfully');
      onSave?.(template);
    } catch {
      toast.error('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2Icon className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
            <ZapIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {templateId ? 'Edit Workflow' : 'Create Workflow'}
            </h1>
            <p className="text-sm text-muted-foreground">Design automated workflows</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <SaveIcon className="w-4 h-4" />
            )}
            Save Workflow
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Steps Panel */}
        <div className="w-2/3 p-6 overflow-y-auto">
          {/* Workflow Info */}
          <Card className="p-4 mb-6">
            <FormGroup>
              <FormRow>
                <Input
                  label="Workflow Name"
                  placeholder="e.g., New Client Onboarding"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Select
                  label="Trigger"
                  options={triggerOptions}
                  value={formData.trigger}
                  onChange={(value) => setFormData({ ...formData, trigger: value })}
                />
              </FormRow>
              <Input
                label="Description"
                placeholder="Describe what this workflow does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </FormGroup>
          </Card>

          {/* Trigger Node */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <PlayIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Start</p>
              <p className="text-sm text-muted-foreground">
                {triggerOptions.find((t) => t.value === formData.trigger)?.label || 'Manual Trigger'}
              </p>
            </div>
          </div>

          {/* Connection Line */}
          {formData.steps.length > 0 && (
            <div className="ml-5 h-4 w-px bg-border" />
          )}

          {/* Steps */}
          <Reorder.Group
            values={formData.steps}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {formData.steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <Reorder.Item value={step} className="list-none">
                  <StepNode
                    step={step}
                    isActive={activeStepId === step.id}
                    onSelect={() => setActiveStepId(step.id)}
                    onDelete={() => handleDeleteStep(step.id)}
                    onDuplicate={() => handleDuplicateStep(step.id)}
                  />
                </Reorder.Item>
                {index < formData.steps.length - 1 && (
                  <div className="ml-5 h-4 w-px bg-border" />
                )}
              </React.Fragment>
            ))}
          </Reorder.Group>

          {/* Add Step Button */}
          <div className="mt-4">
            {formData.steps.length > 0 && (
              <div className="ml-5 h-4 w-px bg-border" />
            )}
            <Button
              variant="outline"
              onClick={() => setShowAddStep(true)}
              className="gap-2 w-full justify-center"
            >
              <PlusIcon className="w-4 h-4" />
              Add Step
            </Button>
          </div>

          {/* End Node */}
          <div className="mt-4 ml-5 h-4 w-px bg-border" />
          <div className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">End</p>
              <p className="text-sm text-muted-foreground">Workflow complete</p>
            </div>
          </div>
        </div>

        {/* Step Config Panel */}
        <div className="w-1/3 border-l border-border bg-background-secondary p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeStepId ? (
              <motion.div
                key={activeStepId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepConfigPanel
                  step={formData.steps.find((s) => s.id === activeStepId)!}
                  allSteps={formData.steps}
                  onUpdate={(updates) => handleUpdateStep(activeStepId, updates)}
                  onUpdateConfig={(updates) => handleUpdateStepConfig(activeStepId, updates)}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-muted-foreground"
              >
                <SettingsIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Select a step to configure</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Step Modal */}
      <Modal
        isOpen={showAddStep}
        onClose={() => setShowAddStep(false)}
        title="Add Step"
        description="Choose the type of step to add to your workflow"
        size="md"
      >
        <div className="grid grid-cols-2 gap-3 p-4">
          {(Object.entries(stepTypeConfig) as [StepType, typeof stepTypeConfig[StepType]][]).map(
            ([type, config]) => (
              <button
                key={type}
                onClick={() => handleAddStep(type)}
                className={`p-4 rounded-lg border-2 text-left hover:border-primary transition-colors ${config.color}`}
              >
                <config.icon className="w-6 h-6 mb-2" />
                <p className="font-medium">{config.label}</p>
              </button>
            )
          )}
        </div>
      </Modal>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function StepNode({
  step,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
}: {
  step: WorkflowStep;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const config = stepTypeConfig[step.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isActive ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div className="cursor-grab">
          <GripVerticalIcon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{step.name}</p>
          <p className="text-xs text-muted-foreground">{config.label}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 hover:bg-background rounded transition-colors"
          >
            <CopyIcon className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-100 rounded transition-colors"
          >
            <TrashIcon className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StepConfigPanel({
  step,
  allSteps,
  onUpdate,
  onUpdateConfig,
}: {
  step: WorkflowStep;
  allSteps: WorkflowStep[];
  onUpdate: (updates: Partial<WorkflowStep>) => void;
  onUpdateConfig: (updates: Partial<WorkflowStep['config']>) => void;
}) {
  const config = stepTypeConfig[step.type];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
          <config.icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{config.label} Settings</p>
          <p className="text-sm text-muted-foreground">Configure this step</p>
        </div>
      </div>

      <FormGroup>
        <Input
          label="Step Name"
          value={step.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />

        {/* Dependencies */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Depends On
          </label>
          <select
            multiple
            value={step.dependsOn || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
              onUpdate({ dependsOn: selected });
            }}
            className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm"
          >
            {allSteps
              .filter((s) => s.id !== step.id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Hold Ctrl/Cmd to select multiple
          </p>
        </div>

        {/* Type-specific config */}
        {step.type === 'task' && (
          <TaskConfig config={step.config} onUpdate={onUpdateConfig} />
        )}
        {step.type === 'email' && (
          <EmailConfig config={step.config} onUpdate={onUpdateConfig} />
        )}
        {step.type === 'notification' && (
          <NotificationConfig config={step.config} onUpdate={onUpdateConfig} />
        )}
        {step.type === 'wait' && (
          <WaitConfig config={step.config} onUpdate={onUpdateConfig} />
        )}
        {step.type === 'meeting' && (
          <MeetingConfig config={step.config} onUpdate={onUpdateConfig} />
        )}
      </FormGroup>
    </div>
  );
}

function TaskConfig({
  config,
  onUpdate,
}: {
  config: WorkflowStep['config'];
  onUpdate: (updates: Partial<WorkflowStep['config']>) => void;
}) {
  return (
    <>
      <Input
        label="Task Title"
        value={config.taskTitle || ''}
        onChange={(e) => onUpdate({ taskTitle: e.target.value })}
        placeholder="Enter task title..."
      />
      <Input
        label="Task Description"
        value={config.taskDescription || ''}
        onChange={(e) => onUpdate({ taskDescription: e.target.value })}
        placeholder="Enter description..."
      />
      <FormRow>
        <Select
          label="Assign To"
          options={assigneeOptions}
          value={config.assignTo || 'advisor'}
          onChange={(value) => onUpdate({ assignTo: value as any })}
        />
        <Select
          label="Priority"
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
          value={config.taskPriority || 'medium'}
          onChange={(value) => onUpdate({ taskPriority: value })}
        />
      </FormRow>
      <Input
        label="Due Days from Start"
        type="number"
        min={0}
        value={config.dueDaysFromStart || 1}
        onChange={(e) => onUpdate({ dueDaysFromStart: parseInt(e.target.value) || 1 })}
      />
    </>
  );
}

function EmailConfig({
  config,
  onUpdate,
}: {
  config: WorkflowStep['config'];
  onUpdate: (updates: Partial<WorkflowStep['config']>) => void;
}) {
  return (
    <>
      <Select
        label="Email Template"
        options={[
          { value: 'welcome', label: 'Welcome Email' },
          { value: 'document_request', label: 'Document Request' },
          { value: 'review_reminder', label: 'Review Reminder' },
          { value: 'kyc_renewal_request', label: 'KYC Renewal Request' },
          { value: 'custom', label: 'Custom Template' },
        ]}
        value={config.emailTemplate || ''}
        onChange={(value) => onUpdate({ emailTemplate: value })}
        placeholder="Select template..."
      />
      <Select
        label="Recipient"
        options={[
          { value: 'client', label: 'Client' },
          { value: 'advisor', label: 'Advisor' },
          { value: 'specific', label: 'Specific Email' },
        ]}
        value={config.emailRecipient || 'client'}
        onChange={(value) => onUpdate({ emailRecipient: value as any })}
      />
    </>
  );
}

function NotificationConfig({
  config,
  onUpdate,
}: {
  config: WorkflowStep['config'];
  onUpdate: (updates: Partial<WorkflowStep['config']>) => void;
}) {
  return (
    <Input
      label="Notification Message"
      value={config.notificationMessage || ''}
      onChange={(e) => onUpdate({ notificationMessage: e.target.value })}
      placeholder="Enter notification message..."
    />
  );
}

function WaitConfig({
  config,
  onUpdate,
}: {
  config: WorkflowStep['config'];
  onUpdate: (updates: Partial<WorkflowStep['config']>) => void;
}) {
  return (
    <Input
      label="Wait Days"
      type="number"
      min={0}
      value={config.waitDays || 1}
      onChange={(e) => onUpdate({ waitDays: parseInt(e.target.value) || 1 })}
    />
  );
}

function MeetingConfig({
  config,
  onUpdate,
}: {
  config: WorkflowStep['config'];
  onUpdate: (updates: Partial<WorkflowStep['config']>) => void;
}) {
  return (
    <>
      <Input
        label="Meeting Title"
        value={config.meetingTitle || ''}
        onChange={(e) => onUpdate({ meetingTitle: e.target.value })}
        placeholder="Enter meeting title..."
      />
      <FormRow>
        <Select
          label="Meeting Type"
          options={[
            { value: 'initial_consultation', label: 'Initial Consultation' },
            { value: 'annual_review', label: 'Annual Review' },
            { value: 'quarterly_review', label: 'Quarterly Review' },
            { value: 'financial_planning', label: 'Financial Planning' },
            { value: 'general', label: 'General' },
          ]}
          value={config.meetingType || 'general'}
          onChange={(value) => onUpdate({ meetingType: value })}
        />
        <Select
          label="Duration"
          options={[
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
            { value: '45', label: '45 minutes' },
            { value: '60', label: '1 hour' },
            { value: '90', label: '90 minutes' },
          ]}
          value={String(config.meetingDuration || 30)}
          onChange={(value) => onUpdate({ meetingDuration: parseInt(value) })}
        />
      </FormRow>
    </>
  );
}

export default WorkflowBuilder;
