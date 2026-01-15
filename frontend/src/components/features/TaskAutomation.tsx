'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../ui/utils';
import {
  ClipboardDocumentCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  BellIcon,
  BellAlertIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  UserIcon,
  UsersIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  BoltIcon,
  ArrowUpIcon,
  Cog6ToothIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

export type TaskTriggerType =
  | 'deal_stage_change'
  | 'client_created'
  | 'client_updated'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'document_uploaded'
  | 'milestone_reached'
  | 'inactivity'
  | 'custom_field_change'
  | 'recurring';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type EscalationAction =
  | 'increase_priority'
  | 'reassign'
  | 'notify_manager'
  | 'send_reminder'
  | 'create_followup';

export interface TaskAutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: TaskTriggerType;
    conditions: TaskCondition[];
  };
  task: {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueInDays: number;
    dueInHours: number;
    category: string;
    assigneeType: 'trigger_user' | 'specific_user' | 'role' | 'round_robin';
    assigneeId?: string;
    assigneeRole?: string;
    tags?: string[];
  };
  escalation?: EscalationRule;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  triggeredCount: number;
}

export interface TaskCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'in' | 'not_in';
  value: string | number | string[];
  logicalOperator?: 'and' | 'or';
}

export interface EscalationRule {
  enabled: boolean;
  steps: EscalationStep[];
}

export interface EscalationStep {
  id: string;
  triggerAfterHours: number;
  action: EscalationAction;
  actionConfig: Record<string, unknown>;
}

export interface RecurringTaskTemplate {
  id: string;
  name: string;
  description?: string;
  task: {
    title: string;
    description?: string;
    priority: TaskPriority;
    category: string;
    estimatedMinutes?: number;
    checklist?: string[];
  };
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    monthOfYear?: number;
    time: string;
    timezone: string;
  };
  assigneeType: 'specific_user' | 'role' | 'round_robin';
  assigneeId?: string;
  assigneeRole?: string;
  enabled: boolean;
  lastGenerated?: string;
  nextGeneration?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Configuration
// ============================================================================

const TRIGGER_CONFIGS: Record<TaskTriggerType, {
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  fields: string[];
}> = {
  deal_stage_change: {
    label: 'Deal Stage Change',
    description: 'When a deal moves to a new stage',
    icon: FunnelIcon,
    color: 'text-green-400 bg-green-500/10',
    fields: ['from_stage', 'to_stage', 'deal_value'],
  },
  client_created: {
    label: 'Client Created',
    description: 'When a new client is created',
    icon: UserIcon,
    color: 'text-blue-400 bg-blue-500/10',
    fields: ['client_type', 'tier'],
  },
  client_updated: {
    label: 'Client Updated',
    description: 'When client information is updated',
    icon: PencilSquareIcon,
    color: 'text-purple-400 bg-purple-500/10',
    fields: ['changed_field', 'old_value', 'new_value'],
  },
  meeting_scheduled: {
    label: 'Meeting Scheduled',
    description: 'When a meeting is scheduled',
    icon: CalendarDaysIcon,
    color: 'text-amber-400 bg-amber-500/10',
    fields: ['meeting_type', 'attendee_type'],
  },
  meeting_completed: {
    label: 'Meeting Completed',
    description: 'When a meeting is marked as completed',
    icon: CheckCircleIcon,
    color: 'text-emerald-400 bg-emerald-500/10',
    fields: ['meeting_type', 'outcome'],
  },
  document_uploaded: {
    label: 'Document Uploaded',
    description: 'When a document is uploaded',
    icon: DocumentTextIcon,
    color: 'text-cyan-400 bg-cyan-500/10',
    fields: ['document_type', 'requires_signature'],
  },
  milestone_reached: {
    label: 'Milestone Reached',
    description: 'When a client milestone is reached',
    icon: SparklesIcon,
    color: 'text-pink-400 bg-pink-500/10',
    fields: ['milestone_type'],
  },
  inactivity: {
    label: 'Client Inactivity',
    description: 'When no activity for a specified period',
    icon: ClockIcon,
    color: 'text-red-400 bg-red-500/10',
    fields: ['days_inactive', 'activity_type'],
  },
  custom_field_change: {
    label: 'Custom Field Change',
    description: 'When a custom field value changes',
    icon: Cog6ToothIcon,
    color: 'text-gray-400 bg-gray-500/10',
    fields: ['field_name', 'old_value', 'new_value'],
  },
  recurring: {
    label: 'Recurring Schedule',
    description: 'Create tasks on a recurring schedule',
    icon: ArrowPathIcon,
    color: 'text-indigo-400 bg-indigo-500/10',
    fields: ['frequency', 'interval'],
  },
};

const ESCALATION_ACTIONS: Record<EscalationAction, {
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = {
  increase_priority: {
    label: 'Increase Priority',
    description: 'Bump task priority up one level',
    icon: ArrowUpIcon,
  },
  reassign: {
    label: 'Reassign Task',
    description: 'Assign to another user or manager',
    icon: UsersIcon,
  },
  notify_manager: {
    label: 'Notify Manager',
    description: 'Send notification to the assignee\'s manager',
    icon: BellAlertIcon,
  },
  send_reminder: {
    label: 'Send Reminder',
    description: 'Send a reminder notification',
    icon: BellIcon,
  },
  create_followup: {
    label: 'Create Follow-up',
    description: 'Create a new follow-up task',
    icon: ClipboardDocumentCheckIcon,
  },
};

const TASK_CATEGORIES = [
  { value: 'outreach', label: 'Outreach', icon: PhoneIcon },
  { value: 'follow-up', label: 'Follow-up', icon: ArrowPathIcon },
  { value: 'review', label: 'Review', icon: DocumentTextIcon },
  { value: 'compliance', label: 'Compliance', icon: ExclamationTriangleIcon },
  { value: 'administrative', label: 'Administrative', icon: ClipboardDocumentCheckIcon },
  { value: 'meeting-prep', label: 'Meeting Prep', icon: CalendarDaysIcon },
  { value: 'documentation', label: 'Documentation', icon: DocumentTextIcon },
];

const DEAL_STAGES = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

// ============================================================================
// Task Automation Rule Editor Component
// ============================================================================

export interface TaskAutomationRuleEditorProps {
  rule?: TaskAutomationRule;
  onSave: (rule: Omit<TaskAutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'>) => void;
  onCancel: () => void;
  className?: string;
}

export function TaskAutomationRuleEditor({
  rule,
  onSave,
  onCancel,
  className,
}: TaskAutomationRuleEditorProps) {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [triggerType, setTriggerType] = useState<TaskTriggerType>(rule?.trigger.type || 'deal_stage_change');
  const [conditions, setConditions] = useState<TaskCondition[]>(rule?.trigger.conditions || []);
  const [taskTitle, setTaskTitle] = useState(rule?.task.title || '');
  const [taskDescription, setTaskDescription] = useState(rule?.task.description || '');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(rule?.task.priority || 'medium');
  const [taskDueInDays, setTaskDueInDays] = useState(rule?.task.dueInDays || 1);
  const [taskDueInHours, setTaskDueInHours] = useState(rule?.task.dueInHours || 0);
  const [taskCategory, setTaskCategory] = useState(rule?.task.category || 'follow-up');
  const [assigneeType, setAssigneeType] = useState(rule?.task.assigneeType || 'trigger_user');
  const [escalation, setEscalation] = useState<EscalationRule>(rule?.escalation || { enabled: false, steps: [] });
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [showEscalation, setShowEscalation] = useState(false);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const triggerConfig = TRIGGER_CONFIGS[triggerType];

  // Add condition
  const addCondition = useCallback(() => {
    setConditions(prev => [...prev, {
      id: generateId(),
      field: '',
      operator: 'equals',
      value: '',
    }]);
  }, []);

  // Update condition
  const updateCondition = useCallback((conditionId: string, updates: Partial<TaskCondition>) => {
    setConditions(prev => prev.map(c =>
      c.id === conditionId ? { ...c, ...updates } : c
    ));
  }, []);

  // Remove condition
  const removeCondition = useCallback((conditionId: string) => {
    setConditions(prev => prev.filter(c => c.id !== conditionId));
  }, []);

  // Add escalation step
  const addEscalationStep = useCallback(() => {
    setEscalation(prev => ({
      ...prev,
      steps: [...prev.steps, {
        id: generateId(),
        triggerAfterHours: prev.steps.length === 0 ? 24 : 48,
        action: 'send_reminder',
        actionConfig: {},
      }],
    }));
  }, []);

  // Update escalation step
  const updateEscalationStep = useCallback((stepId: string, updates: Partial<EscalationStep>) => {
    setEscalation(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, ...updates } : s),
    }));
  }, []);

  // Remove escalation step
  const removeEscalationStep = useCallback((stepId: string) => {
    setEscalation(prev => ({
      ...prev,
      steps: prev.steps.filter(s => s.id !== stepId),
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave({
      name,
      description,
      trigger: {
        type: triggerType,
        conditions,
      },
      task: {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        dueInDays: taskDueInDays,
        dueInHours: taskDueInHours,
        category: taskCategory,
        assigneeType,
      },
      escalation: escalation.enabled && escalation.steps.length > 0 ? escalation : undefined,
      enabled,
    });
  }, [
    name, description, triggerType, conditions, taskTitle, taskDescription,
    taskPriority, taskDueInDays, taskDueInHours, taskCategory, assigneeType,
    escalation, enabled, onSave
  ]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {rule ? 'Edit Rule' : 'New Automation Rule'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEnabled(!enabled)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              enabled
                ? 'bg-status-success-bg text-status-success-text'
                : 'bg-neutral-800 text-neutral-400'
            )}
          >
            {enabled ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
            {enabled ? 'Active' : 'Paused'}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent-600 text-white hover:bg-accent-500 text-sm font-medium transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Save Rule
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Rule Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                placeholder="e.g., Follow-up on Proposal Stage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                placeholder="Describe when and why this rule creates tasks..."
              />
            </div>
          </div>

          {/* Trigger Section */}
          <div className="p-4 bg-neutral-800/50 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <BoltIcon className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Trigger</h3>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">When this happens...</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as TaskTriggerType)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
              >
                {Object.entries(TRIGGER_CONFIGS).map(([type, config]) => (
                  <option key={type} value={type}>{config.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-500">{triggerConfig.description}</p>
            </div>

            {/* Trigger-specific conditions */}
            {triggerType === 'deal_stage_change' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">From Stage</label>
                  <select
                    value={(conditions.find(c => c.field === 'from_stage')?.value as string) || ''}
                    onChange={(e) => {
                      const existing = conditions.find(c => c.field === 'from_stage');
                      if (existing) {
                        updateCondition(existing.id, { value: e.target.value });
                      } else {
                        setConditions(prev => [...prev, {
                          id: generateId(),
                          field: 'from_stage',
                          operator: 'equals',
                          value: e.target.value,
                        }]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                  >
                    <option value="">Any stage</option>
                    {DEAL_STAGES.map((stage) => (
                      <option key={stage.value} value={stage.value}>{stage.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">To Stage</label>
                  <select
                    value={(conditions.find(c => c.field === 'to_stage')?.value as string) || ''}
                    onChange={(e) => {
                      const existing = conditions.find(c => c.field === 'to_stage');
                      if (existing) {
                        updateCondition(existing.id, { value: e.target.value });
                      } else {
                        setConditions(prev => [...prev, {
                          id: generateId(),
                          field: 'to_stage',
                          operator: 'equals',
                          value: e.target.value,
                        }]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                  >
                    <option value="">Any stage</option>
                    {DEAL_STAGES.map((stage) => (
                      <option key={stage.value} value={stage.value}>{stage.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {triggerType === 'inactivity' && (
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Days of Inactivity</label>
                <input
                  type="number"
                  min="1"
                  value={(conditions.find(c => c.field === 'days_inactive')?.value as number) || 30}
                  onChange={(e) => {
                    const existing = conditions.find(c => c.field === 'days_inactive');
                    const value = parseInt(e.target.value, 10) || 30;
                    if (existing) {
                      updateCondition(existing.id, { value });
                    } else {
                      setConditions(prev => [...prev, {
                        id: generateId(),
                        field: 'days_inactive',
                        operator: 'greater_than',
                        value,
                      }]);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                />
              </div>
            )}
          </div>

          {/* Task Section */}
          <div className="p-4 bg-neutral-800/50 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-accent-400" />
              <h3 className="text-sm font-semibold text-white">Create Task</h3>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Task Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                placeholder="e.g., Follow up with {{client.name}} on proposal"
              />
              <p className="mt-1 text-xs text-neutral-500">Use {'{{variable}}'} for dynamic values</p>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Task Description</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                placeholder="Additional details..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Category</label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                >
                  {TASK_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Assign To</label>
                <select
                  value={assigneeType}
                  onChange={(e) => setAssigneeType(e.target.value as typeof assigneeType)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                >
                  <option value="trigger_user">Triggering User</option>
                  <option value="specific_user">Specific User</option>
                  <option value="role">By Role</option>
                  <option value="round_robin">Round Robin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Due In (days)</label>
                <input
                  type="number"
                  min="0"
                  value={taskDueInDays}
                  onChange={(e) => setTaskDueInDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Due In (hours)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={taskDueInHours}
                  onChange={(e) => setTaskDueInHours(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                />
              </div>
            </div>
          </div>

          {/* Escalation Section */}
          <div className="p-4 bg-neutral-800/50 rounded-xl">
            <button
              onClick={() => setShowEscalation(!showEscalation)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <BellAlertIcon className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-semibold text-white">Escalation Rules</h3>
                {escalation.enabled && escalation.steps.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-red-500/10 text-red-400 rounded-full">
                    {escalation.steps.length} step{escalation.steps.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <ChevronDownIcon className={cn('w-5 h-5 text-neutral-400 transition-transform', showEscalation && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {showEscalation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={escalation.enabled}
                        onChange={(e) => setEscalation(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="w-4 h-4 rounded border-neutral-600 bg-neutral-900 text-accent-600 focus:ring-accent-500"
                      />
                      <span className="text-sm text-neutral-300">Enable escalation if task is not completed</span>
                    </div>

                    {escalation.enabled && (
                      <>
                        <div className="space-y-3">
                          {escalation.steps.map((step, index) => {
                            const actionConfig = ESCALATION_ACTIONS[step.action];
                            const ActionIcon = actionConfig.icon;

                            return (
                              <div
                                key={step.id}
                                className="p-3 bg-neutral-900/50 rounded-lg border border-neutral-700"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 text-sm font-bold flex-shrink-0">
                                    {index + 1}
                                  </div>

                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-neutral-400">After</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={step.triggerAfterHours}
                                        onChange={(e) => updateEscalationStep(step.id, {
                                          triggerAfterHours: parseInt(e.target.value, 10) || 24
                                        })}
                                        className="w-20 px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-accent-500"
                                      />
                                      <span className="text-xs text-neutral-400">hours overdue</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <ActionIcon className="w-4 h-4 text-neutral-400" />
                                      <select
                                        value={step.action}
                                        onChange={(e) => updateEscalationStep(step.id, {
                                          action: e.target.value as EscalationAction
                                        })}
                                        className="flex-1 px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-accent-500"
                                      >
                                        {Object.entries(ESCALATION_ACTIONS).map(([action, config]) => (
                                          <option key={action} value={action}>{config.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => removeEscalationStep(step.id)}
                                    className="p-1.5 rounded text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={addEscalationStep}
                          className="w-full p-3 rounded-lg border border-dashed border-neutral-700 hover:border-red-500 text-neutral-400 hover:text-red-400 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <PlusIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Add Escalation Step</span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Recurring Task Template Editor Component
// ============================================================================

export interface RecurringTaskEditorProps {
  template?: RecurringTaskTemplate;
  onSave: (template: Omit<RecurringTaskTemplate, 'id' | 'createdAt' | 'updatedAt' | 'lastGenerated' | 'nextGeneration'>) => void;
  onCancel: () => void;
  className?: string;
}

export function RecurringTaskEditor({
  template,
  onSave,
  onCancel,
  className,
}: RecurringTaskEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [taskTitle, setTaskTitle] = useState(template?.task.title || '');
  const [taskDescription, setTaskDescription] = useState(template?.task.description || '');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(template?.task.priority || 'medium');
  const [taskCategory, setTaskCategory] = useState(template?.task.category || 'administrative');
  const [frequency, setFrequency] = useState<RecurringTaskTemplate['schedule']['frequency']>(
    template?.schedule.frequency || 'weekly'
  );
  const [interval, setInterval] = useState(template?.schedule.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(template?.schedule.daysOfWeek || [1]);
  const [dayOfMonth, setDayOfMonth] = useState(template?.schedule.dayOfMonth || 1);
  const [time, setTime] = useState(template?.schedule.time || '09:00');
  const [timezone, setTimezone] = useState(template?.schedule.timezone || 'America/New_York');
  const [assigneeType, setAssigneeType] = useState(template?.assigneeType || 'specific_user');
  const [enabled, setEnabled] = useState(template?.enabled ?? true);
  const [checklist, setChecklist] = useState<string[]>(template?.task.checklist || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const addChecklistItem = useCallback(() => {
    if (newChecklistItem.trim()) {
      setChecklist(prev => [...prev, newChecklistItem.trim()]);
      setNewChecklistItem('');
    }
  }, [newChecklistItem]);

  const removeChecklistItem = useCallback((index: number) => {
    setChecklist(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    onSave({
      name,
      description,
      task: {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        category: taskCategory,
        checklist: checklist.length > 0 ? checklist : undefined,
      },
      schedule: {
        frequency,
        interval,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        time,
        timezone,
      },
      assigneeType,
      enabled,
    });
  }, [
    name, description, taskTitle, taskDescription, taskPriority, taskCategory,
    checklist, frequency, interval, daysOfWeek, dayOfMonth, time, timezone,
    assigneeType, enabled, onSave
  ]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {template ? 'Edit Recurring Task' : 'New Recurring Task'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEnabled(!enabled)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              enabled
                ? 'bg-status-success-bg text-status-success-text'
                : 'bg-neutral-800 text-neutral-400'
            )}
          >
            {enabled ? 'Active' : 'Paused'}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent-600 text-white hover:bg-accent-500 text-sm font-medium transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Template Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                placeholder="e.g., Weekly Client Review"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                placeholder="What is this recurring task for..."
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="p-4 bg-neutral-800/50 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Schedule</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">
                  Every {interval > 1 ? interval : ''} {frequency.replace('ly', '')}
                  {interval > 1 ? 's' : ''}
                </label>
                <input
                  type="number"
                  min="1"
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                />
              </div>
            </div>

            {frequency === 'weekly' && (
              <div>
                <label className="block text-xs text-neutral-400 mb-2">Days of Week</label>
                <div className="flex gap-2">
                  {dayNames.map((day, index) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(index)}
                      className={cn(
                        'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                        daysOfWeek.includes(index)
                          ? 'bg-accent-600 text-white'
                          : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {frequency === 'monthly' && (
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Day of Month</label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                  <option value={-1}>Last day of month</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Task Details */}
          <div className="p-4 bg-neutral-800/50 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-accent-400" />
              <h3 className="text-sm font-semibold text-white">Task Details</h3>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Task Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                placeholder="e.g., Weekly client portfolio review"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Task Description</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                placeholder="Additional details..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Category</label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                >
                  {TASK_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Assign To</label>
                <select
                  value={assigneeType}
                  onChange={(e) => setAssigneeType(e.target.value as typeof assigneeType)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                >
                  <option value="specific_user">Specific User</option>
                  <option value="role">By Role</option>
                  <option value="round_robin">Round Robin</option>
                </select>
              </div>
            </div>

            {/* Checklist */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Checklist (optional)</label>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <span className="flex-1 text-sm text-neutral-300">{item}</span>
                    <button
                      onClick={() => removeChecklistItem(index)}
                      className="p-1 rounded text-neutral-400 hover:text-red-400 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                    className="flex-1 px-3 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                    placeholder="Add checklist item..."
                  />
                  <button
                    onClick={addChecklistItem}
                    className="p-1.5 rounded bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Task Automation Dashboard Component
// ============================================================================

export interface TaskAutomationDashboardProps {
  rules: TaskAutomationRule[];
  recurringTemplates: RecurringTaskTemplate[];
  onCreateRule: () => void;
  onEditRule: (rule: TaskAutomationRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  onCreateRecurring: () => void;
  onEditRecurring: (template: RecurringTaskTemplate) => void;
  onDeleteRecurring: (templateId: string) => void;
  onToggleRecurring: (templateId: string, enabled: boolean) => void;
  className?: string;
}

export function TaskAutomationDashboard({
  rules,
  recurringTemplates,
  onCreateRule,
  onEditRule,
  onDeleteRule,
  onToggleRule,
  onCreateRecurring,
  onEditRecurring,
  onDeleteRecurring,
  onToggleRecurring,
  className,
}: TaskAutomationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'recurring'>('rules');

  const stats = useMemo(() => ({
    activeRules: rules.filter(r => r.enabled).length,
    totalTriggered: rules.reduce((acc, r) => acc + r.triggeredCount, 0),
    activeRecurring: recurringTemplates.filter(t => t.enabled).length,
  }), [rules, recurringTemplates]);

  return (
    <div className={cn('', className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-neutral-800/50 rounded-xl">
          <p className="text-2xl font-bold text-white">{stats.activeRules}</p>
          <p className="text-sm text-neutral-400">Active Rules</p>
        </div>
        <div className="p-4 bg-neutral-800/50 rounded-xl">
          <p className="text-2xl font-bold text-white">{stats.totalTriggered}</p>
          <p className="text-sm text-neutral-400">Tasks Created</p>
        </div>
        <div className="p-4 bg-neutral-800/50 rounded-xl">
          <p className="text-2xl font-bold text-white">{stats.activeRecurring}</p>
          <p className="text-sm text-neutral-400">Recurring Tasks</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('rules')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'rules'
              ? 'bg-accent-600 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          )}
        >
          Automation Rules
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'recurring'
              ? 'bg-accent-600 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          )}
        >
          Recurring Tasks
        </button>
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Automation Rules</h3>
            <button
              onClick={onCreateRule}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-500 font-medium transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              New Rule
            </button>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => {
              const triggerConfig = TRIGGER_CONFIGS[rule.trigger.type];
              const TriggerIcon = triggerConfig.icon;

              return (
                <div
                  key={rule.id}
                  className={cn(
                    'p-4 rounded-xl border transition-all',
                    rule.enabled
                      ? 'border-neutral-700 bg-neutral-800/50'
                      : 'border-neutral-800 bg-neutral-900/50 opacity-60'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', triggerConfig.color)}>
                      <TriggerIcon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{rule.name}</h4>
                        <span className={cn(
                          'px-2 py-0.5 text-[10px] font-medium uppercase rounded-full',
                          rule.enabled
                            ? 'bg-status-success-bg text-status-success-text'
                            : 'bg-neutral-700 text-neutral-400'
                        )}>
                          {rule.enabled ? 'Active' : 'Paused'}
                        </span>
                        {rule.escalation?.enabled && (
                          <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded-full bg-red-500/10 text-red-400">
                            Escalation
                          </span>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-sm text-neutral-400 mt-0.5">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span>Trigger: {triggerConfig.label}</span>
                        <span>Priority: {rule.task.priority}</span>
                        <span>Created {rule.triggeredCount} tasks</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleRule(rule.id, !rule.enabled)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          rule.enabled
                            ? 'text-status-success-text hover:bg-status-success-bg'
                            : 'text-neutral-400 hover:bg-neutral-700'
                        )}
                      >
                        {rule.enabled ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => onEditRule(rule)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                      >
                        <Cog6ToothIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-status-error-text hover:bg-status-error-bg transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {rules.length === 0 && (
              <div className="text-center py-12">
                <BoltIcon className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No automation rules</h3>
                <p className="text-sm text-neutral-400">
                  Create rules to automatically generate tasks based on events
                </p>
                <button
                  onClick={onCreateRule}
                  className="mt-4 px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-500 font-medium transition-colors"
                >
                  Create Rule
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recurring Tab */}
      {activeTab === 'recurring' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recurring Tasks</h3>
            <button
              onClick={onCreateRecurring}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-500 font-medium transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              New Recurring Task
            </button>
          </div>

          <div className="space-y-3">
            {recurringTemplates.map((template) => (
              <div
                key={template.id}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  template.enabled
                    ? 'border-neutral-700 bg-neutral-800/50'
                    : 'border-neutral-800 bg-neutral-900/50 opacity-60'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <ArrowPathIcon className="w-6 h-6 text-indigo-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{template.name}</h4>
                      <span className={cn(
                        'px-2 py-0.5 text-[10px] font-medium uppercase rounded-full',
                        template.enabled
                          ? 'bg-status-success-bg text-status-success-text'
                          : 'bg-neutral-700 text-neutral-400'
                      )}>
                        {template.enabled ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400 mt-0.5">{template.task.title}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                      <span className="capitalize">{template.schedule.frequency}</span>
                      <span>@ {template.schedule.time}</span>
                      {template.nextGeneration && (
                        <span>Next: {new Date(template.nextGeneration).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleRecurring(template.id, !template.enabled)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        template.enabled
                          ? 'text-status-success-text hover:bg-status-success-bg'
                          : 'text-neutral-400 hover:bg-neutral-700'
                      )}
                    >
                      {template.enabled ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => onEditRecurring(template)}
                      className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDeleteRecurring(template.id)}
                      className="p-2 rounded-lg text-neutral-400 hover:text-status-error-text hover:bg-status-error-bg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {recurringTemplates.length === 0 && (
              <div className="text-center py-12">
                <ArrowPathIcon className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No recurring tasks</h3>
                <p className="text-sm text-neutral-400">
                  Create recurring tasks to automate repetitive work
                </p>
                <button
                  onClick={onCreateRecurring}
                  className="mt-4 px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-500 font-medium transition-colors"
                >
                  Create Recurring Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
