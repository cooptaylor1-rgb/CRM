'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { cn } from '../ui/utils';
import {
  PlayIcon,
  PauseIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ClockIcon,
  BellIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UserPlusIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  SparklesIcon,
  Cog6ToothIcon,
  BoltIcon,
  FunnelIcon,
  ArrowsRightLeftIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  Square3Stack3DIcon,
  ArrowUpTrayIcon,
  PencilSquareIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

export type TriggerType =
  | 'time_based'
  | 'event_based'
  | 'condition_based'
  | 'webhook'
  | 'manual';

export type ActionType =
  | 'send_email'
  | 'create_task'
  | 'update_field'
  | 'send_notification'
  | 'add_tag'
  | 'remove_tag'
  | 'assign_user'
  | 'create_meeting'
  | 'delay'
  | 'condition'
  | 'webhook_call'
  | 'sms_notification'
  | 'slack_message'
  | 'update_deal_stage';

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
  logicalOperator?: 'and' | 'or';
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  runCount: number;
  category?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: Omit<WorkflowTrigger, 'id'>;
  actions: Omit<WorkflowAction, 'id'>[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

// ============================================================================
// Configuration
// ============================================================================

const TRIGGER_CONFIGS: Record<TriggerType, {
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'time' | 'checkbox' | 'entity_select';
    options?: { value: string; label: string }[];
    placeholder?: string;
  }>;
}> = {
  time_based: {
    label: 'Time-Based',
    description: 'Trigger at a specific time or interval',
    icon: ClockIcon,
    color: 'text-blue-400 bg-blue-500/10',
    fields: [
      {
        name: 'schedule_type',
        label: 'Schedule Type',
        type: 'select',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'custom', label: 'Custom Cron' },
        ],
      },
      { name: 'time', label: 'Time', type: 'time' },
      {
        name: 'timezone',
        label: 'Timezone',
        type: 'select',
        options: [
          { value: 'America/New_York', label: 'Eastern Time' },
          { value: 'America/Chicago', label: 'Central Time' },
          { value: 'America/Denver', label: 'Mountain Time' },
          { value: 'America/Los_Angeles', label: 'Pacific Time' },
        ],
      },
    ],
  },
  event_based: {
    label: 'Event-Based',
    description: 'Trigger when a specific event occurs',
    icon: BoltIcon,
    color: 'text-amber-400 bg-amber-500/10',
    fields: [
      {
        name: 'event_type',
        label: 'Event Type',
        type: 'select',
        options: [
          { value: 'client_created', label: 'Client Created' },
          { value: 'client_updated', label: 'Client Updated' },
          { value: 'deal_stage_changed', label: 'Deal Stage Changed' },
          { value: 'task_completed', label: 'Task Completed' },
          { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
          { value: 'document_uploaded', label: 'Document Uploaded' },
          { value: 'milestone_reached', label: 'Milestone Reached' },
          { value: 'inactivity_detected', label: 'Inactivity Detected' },
        ],
      },
      { name: 'entity_filter', label: 'Filter by Entity', type: 'entity_select', placeholder: 'All entities' },
    ],
  },
  condition_based: {
    label: 'Condition-Based',
    description: 'Trigger when specific conditions are met',
    icon: FunnelIcon,
    color: 'text-purple-400 bg-purple-500/10',
    fields: [
      {
        name: 'check_frequency',
        label: 'Check Frequency',
        type: 'select',
        options: [
          { value: 'hourly', label: 'Every Hour' },
          { value: 'daily', label: 'Daily' },
          { value: 'realtime', label: 'Real-time' },
        ],
      },
    ],
  },
  webhook: {
    label: 'Webhook',
    description: 'Trigger via external webhook',
    icon: GlobeAltIcon,
    color: 'text-green-400 bg-green-500/10',
    fields: [
      { name: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'Auto-generated on save' },
      { name: 'secret_key', label: 'Secret Key', type: 'text', placeholder: 'Optional authentication' },
    ],
  },
  manual: {
    label: 'Manual',
    description: 'Trigger manually by user action',
    icon: PlayIcon,
    color: 'text-gray-400 bg-gray-500/10',
    fields: [
      { name: 'button_label', label: 'Button Label', type: 'text', placeholder: 'Run Workflow' },
      { name: 'require_confirmation', label: 'Require Confirmation', type: 'checkbox' },
    ],
  },
};

const ACTION_CONFIGS: Record<ActionType, {
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'entity_select' | 'template_select' | 'user_select' | 'tag_select';
    options?: { value: string; label: string }[];
    placeholder?: string;
  }>;
}> = {
  send_email: {
    label: 'Send Email',
    description: 'Send an automated email',
    icon: EnvelopeIcon,
    color: 'text-blue-400 bg-blue-500/10',
    fields: [
      { name: 'template', label: 'Email Template', type: 'template_select' },
      { name: 'to', label: 'Recipient', type: 'select', options: [
        { value: 'client', label: 'Client' },
        { value: 'primary_contact', label: 'Primary Contact' },
        { value: 'assigned_advisor', label: 'Assigned Advisor' },
        { value: 'custom', label: 'Custom Email' },
      ]},
      { name: 'subject_override', label: 'Subject Override', type: 'text', placeholder: 'Use template subject' },
    ],
  },
  create_task: {
    label: 'Create Task',
    description: 'Create a new task',
    icon: ClipboardDocumentCheckIcon,
    color: 'text-amber-400 bg-amber-500/10',
    fields: [
      { name: 'title', label: 'Task Title', type: 'text', placeholder: 'Follow up with {{client.name}}' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Task description...' },
      { name: 'due_days', label: 'Due In (days)', type: 'number' },
      { name: 'assignee', label: 'Assign To', type: 'user_select' },
      { name: 'priority', label: 'Priority', type: 'select', options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ]},
    ],
  },
  update_field: {
    label: 'Update Field',
    description: 'Update a field on the entity',
    icon: PencilSquareIcon,
    color: 'text-green-400 bg-green-500/10',
    fields: [
      { name: 'entity_type', label: 'Entity Type', type: 'select', options: [
        { value: 'client', label: 'Client' },
        { value: 'household', label: 'Household' },
        { value: 'deal', label: 'Deal' },
        { value: 'account', label: 'Account' },
      ]},
      { name: 'field', label: 'Field', type: 'text', placeholder: 'status' },
      { name: 'value', label: 'New Value', type: 'text' },
    ],
  },
  send_notification: {
    label: 'Send Notification',
    description: 'Send an in-app notification',
    icon: BellIcon,
    color: 'text-purple-400 bg-purple-500/10',
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'message', label: 'Message', type: 'textarea' },
      { name: 'recipient', label: 'Recipient', type: 'user_select' },
      { name: 'type', label: 'Type', type: 'select', options: [
        { value: 'info', label: 'Info' },
        { value: 'warning', label: 'Warning' },
        { value: 'success', label: 'Success' },
        { value: 'error', label: 'Error' },
      ]},
    ],
  },
  add_tag: {
    label: 'Add Tag',
    description: 'Add a tag to the entity',
    icon: TagIcon,
    color: 'text-cyan-400 bg-cyan-500/10',
    fields: [
      { name: 'tag', label: 'Tag', type: 'tag_select' },
    ],
  },
  remove_tag: {
    label: 'Remove Tag',
    description: 'Remove a tag from the entity',
    icon: TagIcon,
    color: 'text-red-400 bg-red-500/10',
    fields: [
      { name: 'tag', label: 'Tag', type: 'tag_select' },
    ],
  },
  assign_user: {
    label: 'Assign User',
    description: 'Assign a user to the entity',
    icon: UserPlusIcon,
    color: 'text-indigo-400 bg-indigo-500/10',
    fields: [
      { name: 'user', label: 'User', type: 'user_select' },
      { name: 'role', label: 'Role', type: 'select', options: [
        { value: 'primary_advisor', label: 'Primary Advisor' },
        { value: 'secondary_advisor', label: 'Secondary Advisor' },
        { value: 'service_team', label: 'Service Team' },
      ]},
    ],
  },
  create_meeting: {
    label: 'Create Meeting',
    description: 'Schedule a new meeting',
    icon: CalendarDaysIcon,
    color: 'text-rose-400 bg-rose-500/10',
    fields: [
      { name: 'title', label: 'Meeting Title', type: 'text' },
      { name: 'duration', label: 'Duration (minutes)', type: 'number' },
      { name: 'schedule_in_days', label: 'Schedule In (days)', type: 'number' },
      { name: 'attendees', label: 'Attendees', type: 'select', options: [
        { value: 'client_and_advisor', label: 'Client & Advisor' },
        { value: 'primary_contact', label: 'Primary Contact Only' },
        { value: 'all_contacts', label: 'All Contacts' },
      ]},
    ],
  },
  delay: {
    label: 'Delay',
    description: 'Wait before continuing',
    icon: ClockIcon,
    color: 'text-gray-400 bg-gray-500/10',
    fields: [
      { name: 'delay_type', label: 'Delay Type', type: 'select', options: [
        { value: 'minutes', label: 'Minutes' },
        { value: 'hours', label: 'Hours' },
        { value: 'days', label: 'Days' },
        { value: 'until_time', label: 'Until Specific Time' },
      ]},
      { name: 'delay_value', label: 'Duration', type: 'number' },
    ],
  },
  condition: {
    label: 'Condition',
    description: 'Branch based on conditions',
    icon: ArrowsRightLeftIcon,
    color: 'text-orange-400 bg-orange-500/10',
    fields: [
      { name: 'condition_type', label: 'Condition Type', type: 'select', options: [
        { value: 'if_then', label: 'If/Then' },
        { value: 'split', label: 'A/B Split' },
      ]},
    ],
  },
  webhook_call: {
    label: 'Webhook Call',
    description: 'Call an external webhook',
    icon: GlobeAltIcon,
    color: 'text-teal-400 bg-teal-500/10',
    fields: [
      { name: 'url', label: 'Webhook URL', type: 'text' },
      { name: 'method', label: 'Method', type: 'select', options: [
        { value: 'POST', label: 'POST' },
        { value: 'GET', label: 'GET' },
        { value: 'PUT', label: 'PUT' },
      ]},
      { name: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer ..."}' },
    ],
  },
  sms_notification: {
    label: 'SMS Notification',
    description: 'Send an SMS message',
    icon: ChatBubbleLeftRightIcon,
    color: 'text-emerald-400 bg-emerald-500/10',
    fields: [
      { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Hi {{client.first_name}}...' },
      { name: 'recipient', label: 'Recipient', type: 'select', options: [
        { value: 'client', label: 'Client Phone' },
        { value: 'primary_contact', label: 'Primary Contact' },
        { value: 'custom', label: 'Custom Number' },
      ]},
    ],
  },
  slack_message: {
    label: 'Slack Message',
    description: 'Send a Slack message',
    icon: ChatBubbleLeftRightIcon,
    color: 'text-violet-400 bg-violet-500/10',
    fields: [
      { name: 'channel', label: 'Channel', type: 'text', placeholder: '#general' },
      { name: 'message', label: 'Message', type: 'textarea' },
    ],
  },
  update_deal_stage: {
    label: 'Update Deal Stage',
    description: 'Move deal to a new stage',
    icon: ArrowPathIcon,
    color: 'text-pink-400 bg-pink-500/10',
    fields: [
      { name: 'stage', label: 'New Stage', type: 'select', options: [
        { value: 'lead', label: 'Lead' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'proposal', label: 'Proposal' },
        { value: 'negotiation', label: 'Negotiation' },
        { value: 'won', label: 'Won' },
        { value: 'lost', label: 'Lost' },
      ]},
    ],
  },
};

// Workflow Templates
const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'new_client_onboarding',
    name: 'New Client Onboarding',
    description: 'Automated onboarding sequence for new clients',
    category: 'Client Management',
    icon: UserPlusIcon,
    trigger: {
      type: 'event_based',
      name: 'New Client Created',
      config: { event_type: 'client_created' },
      enabled: true,
    },
    actions: [
      { type: 'send_email', name: 'Send Welcome Email', config: { template: 'welcome' }, enabled: true },
      { type: 'delay', name: 'Wait 1 Day', config: { delay_type: 'days', delay_value: 1 }, enabled: true },
      { type: 'create_task', name: 'Create Onboarding Task', config: { title: 'Complete onboarding checklist' }, enabled: true },
      { type: 'send_notification', name: 'Notify Advisor', config: { title: 'New client assigned' }, enabled: true },
    ],
  },
  {
    id: 'deal_follow_up',
    name: 'Deal Follow-up Sequence',
    description: 'Automated follow-ups for deals in proposal stage',
    category: 'Sales',
    icon: CurrencyDollarIcon,
    trigger: {
      type: 'event_based',
      name: 'Deal Stage Changed',
      config: { event_type: 'deal_stage_changed' },
      enabled: true,
    },
    actions: [
      { type: 'send_email', name: 'Send Proposal Follow-up', config: { template: 'proposal_followup' }, enabled: true },
      { type: 'delay', name: 'Wait 3 Days', config: { delay_type: 'days', delay_value: 3 }, enabled: true },
      { type: 'create_task', name: 'Create Follow-up Call Task', config: { title: 'Follow up on proposal' }, enabled: true },
    ],
  },
  {
    id: 'client_birthday',
    name: 'Client Birthday Greeting',
    description: 'Send birthday wishes to clients',
    category: 'Relationship',
    icon: SparklesIcon,
    trigger: {
      type: 'condition_based',
      name: 'Birthday Today',
      config: { check_frequency: 'daily' },
      enabled: true,
    },
    actions: [
      { type: 'send_email', name: 'Send Birthday Email', config: { template: 'birthday' }, enabled: true },
      { type: 'create_task', name: 'Personal Call Reminder', config: { title: 'Call client for birthday' }, enabled: true },
    ],
  },
  {
    id: 'inactivity_alert',
    name: 'Client Inactivity Alert',
    description: 'Alert when client has been inactive for 30 days',
    category: 'Engagement',
    icon: ExclamationTriangleIcon,
    trigger: {
      type: 'event_based',
      name: 'Inactivity Detected',
      config: { event_type: 'inactivity_detected' },
      enabled: true,
    },
    actions: [
      { type: 'send_notification', name: 'Notify Advisor', config: { type: 'warning' }, enabled: true },
      { type: 'create_task', name: 'Create Outreach Task', config: { title: 'Reach out to inactive client', priority: 'high' }, enabled: true },
    ],
  },
];

// ============================================================================
// Main Workflow Builder Component
// ============================================================================

export interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave: (workflow: Workflow) => void;
  onCancel: () => void;
  className?: string;
}

export function WorkflowBuilder({
  workflow,
  onSave,
  onCancel,
  className,
}: WorkflowBuilderProps) {
  const [name, setName] = useState(workflow?.name || 'New Workflow');
  const [description, setDescription] = useState(workflow?.description || '');
  const [trigger, setTrigger] = useState<WorkflowTrigger | null>(workflow?.trigger || null);
  const [actions, setActions] = useState<WorkflowAction[]>(workflow?.actions || []);
  const [enabled, setEnabled] = useState(workflow?.enabled ?? true);
  const [showTriggerPicker, setShowTriggerPicker] = useState(!trigger);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!workflow && !trigger);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Apply template
  const applyTemplate = useCallback((template: WorkflowTemplate) => {
    setName(template.name);
    setDescription(template.description);
    setTrigger({
      ...template.trigger,
      id: generateId(),
    });
    setActions(template.actions.map(a => ({
      ...a,
      id: generateId(),
    })));
    setShowTemplates(false);
  }, []);

  // Add trigger
  const addTrigger = useCallback((type: TriggerType) => {
    const config = TRIGGER_CONFIGS[type];
    setTrigger({
      id: generateId(),
      type,
      name: config.label,
      config: {},
      enabled: true,
    });
    setShowTriggerPicker(false);
  }, []);

  // Add action
  const addAction = useCallback((type: ActionType) => {
    const config = ACTION_CONFIGS[type];
    const newAction: WorkflowAction = {
      id: generateId(),
      type,
      name: config.label,
      config: {},
      enabled: true,
    };
    setActions(prev => [...prev, newAction]);
    setShowActionPicker(false);
    setEditingActionId(newAction.id);
  }, []);

  // Remove action
  const removeAction = useCallback((id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
    if (editingActionId === id) {
      setEditingActionId(null);
    }
  }, [editingActionId]);

  // Update action config
  const updateActionConfig = useCallback((id: string, config: Record<string, unknown>) => {
    setActions(prev => prev.map(a =>
      a.id === id ? { ...a, config: { ...a.config, ...config } } : a
    ));
  }, []);

  // Toggle action enabled
  const toggleActionEnabled = useCallback((id: string) => {
    setActions(prev => prev.map(a =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  }, []);

  // Validate workflow
  const validate = useCallback(() => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Workflow name is required');
    if (!trigger) errs.push('A trigger is required');
    if (actions.length === 0) errs.push('At least one action is required');
    setErrors(errs);
    return errs.length === 0;
  }, [name, trigger, actions]);

  // Save workflow
  const handleSave = useCallback(() => {
    if (!validate() || !trigger) return;

    const newWorkflow: Workflow = {
      id: workflow?.id || generateId(),
      name,
      description,
      trigger,
      actions,
      enabled,
      createdAt: workflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runCount: workflow?.runCount || 0,
    };

    onSave(newWorkflow);
  }, [workflow, name, description, trigger, actions, enabled, validate, onSave]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent text-lg font-semibold text-white border-none focus:outline-none focus:ring-0 w-full"
              placeholder="Workflow Name"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-transparent text-sm text-neutral-400 border-none focus:outline-none focus:ring-0 w-full"
              placeholder="Add a description..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Enabled Toggle */}
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-500 text-sm font-medium transition-colors"
          >
            <CheckIcon className="w-4 h-4" />
            Save Workflow
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-status-error-bg/30 border-b border-status-error-border">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-status-error-text flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-status-error-text">Please fix the following errors:</p>
                  <ul className="mt-1 text-sm text-status-error-text/80 list-disc list-inside">
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Templates Section */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Start from a Template</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-xs text-accent-400 hover:text-accent-300"
                >
                  Start from scratch
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {WORKFLOW_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="p-4 rounded-xl border border-neutral-700 hover:border-accent-500 bg-neutral-800/50 hover:bg-neutral-800 text-left transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-accent-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white group-hover:text-accent-400 transition-colors">{template.name}</h4>
                          <p className="text-sm text-neutral-400 mt-1">{template.description}</p>
                          <span className="inline-block mt-2 text-xs text-neutral-500 bg-neutral-700/50 px-2 py-0.5 rounded">
                            {template.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workflow Builder */}
        <div className="space-y-4">
          {/* Trigger Section */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                1
              </div>
              <h3 className="text-sm font-semibold text-white">When this happens...</h3>
            </div>

            {trigger ? (
              <TriggerCard
                trigger={trigger}
                onEdit={() => setShowTriggerPicker(true)}
                onRemove={() => setTrigger(null)}
                onUpdateConfig={(config) => setTrigger({ ...trigger, config: { ...trigger.config, ...config } })}
              />
            ) : (
              <button
                onClick={() => setShowTriggerPicker(true)}
                className="w-full p-6 rounded-xl border-2 border-dashed border-neutral-700 hover:border-accent-500 text-neutral-400 hover:text-accent-400 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <BoltIcon className="w-8 h-8" />
                  <span className="font-medium">Add Trigger</span>
                  <span className="text-sm text-neutral-500">Choose what starts this workflow</span>
                </div>
              </button>
            )}

            {/* Connector Line */}
            {trigger && actions.length > 0 && (
              <div className="absolute left-3 top-full w-0.5 h-8 bg-neutral-700" />
            )}
          </div>

          {/* Actions Section */}
          {trigger && (
            <div className="relative pt-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center text-white text-xs font-bold">
                  2
                </div>
                <h3 className="text-sm font-semibold text-white">Do these actions...</h3>
              </div>

              <div className="space-y-3">
                <Reorder.Group axis="y" values={actions} onReorder={setActions}>
                  {actions.map((action, index) => (
                    <Reorder.Item key={action.id} value={action}>
                      <ActionCard
                        action={action}
                        index={index}
                        isEditing={editingActionId === action.id}
                        onEdit={() => setEditingActionId(editingActionId === action.id ? null : action.id)}
                        onRemove={() => removeAction(action.id)}
                        onToggleEnabled={() => toggleActionEnabled(action.id)}
                        onUpdateConfig={(config) => updateActionConfig(action.id, config)}
                      />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                <button
                  onClick={() => setShowActionPicker(true)}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-neutral-700 hover:border-accent-500 text-neutral-400 hover:text-accent-400 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    <span className="font-medium">Add Action</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trigger Picker Modal */}
      <AnimatePresence>
        {showTriggerPicker && (
          <PickerModal
            title="Choose a Trigger"
            items={Object.entries(TRIGGER_CONFIGS).map(([type, config]) => ({
              id: type,
              ...config,
            }))}
            onSelect={(id) => addTrigger(id as TriggerType)}
            onClose={() => setShowTriggerPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* Action Picker Modal */}
      <AnimatePresence>
        {showActionPicker && (
          <PickerModal
            title="Choose an Action"
            items={Object.entries(ACTION_CONFIGS).map(([type, config]) => ({
              id: type,
              ...config,
            }))}
            onSelect={(id) => addAction(id as ActionType)}
            onClose={() => setShowActionPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Trigger Card Component
// ============================================================================

interface TriggerCardProps {
  trigger: WorkflowTrigger;
  onEdit: () => void;
  onRemove: () => void;
  onUpdateConfig: (config: Record<string, unknown>) => void;
}

function TriggerCard({ trigger, onEdit, onRemove, onUpdateConfig }: TriggerCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = TRIGGER_CONFIGS[trigger.type];
  const Icon = config.icon;

  return (
    <div className={cn(
      'rounded-xl border transition-all',
      trigger.enabled
        ? 'border-amber-500/50 bg-amber-500/5'
        : 'border-neutral-700 bg-neutral-800/50 opacity-60'
    )}>
      <div className="flex items-center gap-3 p-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-white">{trigger.name}</h4>
          <p className="text-sm text-neutral-400">{config.description}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <ChevronDownIcon className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
          </button>
          <button
            onClick={onRemove}
            className="p-2 rounded-lg text-neutral-400 hover:text-status-error-text hover:bg-status-error-bg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && config.fields.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-2 gap-4">
              {config.fields.map((field) => (
                <ConfigField
                  key={field.name}
                  field={field}
                  value={trigger.config[field.name] as string | number | boolean}
                  onChange={(value) => onUpdateConfig({ [field.name]: value })}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Action Card Component
// ============================================================================

interface ActionCardProps {
  action: WorkflowAction;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onToggleEnabled: () => void;
  onUpdateConfig: (config: Record<string, unknown>) => void;
}

function ActionCard({
  action,
  index,
  isEditing,
  onEdit,
  onRemove,
  onToggleEnabled,
  onUpdateConfig,
}: ActionCardProps) {
  const dragControls = useDragControls();
  const config = ACTION_CONFIGS[action.type];
  const Icon = config.icon;

  return (
    <div className={cn(
      'rounded-xl border transition-all',
      action.enabled
        ? 'border-neutral-700 bg-neutral-800/50'
        : 'border-neutral-800 bg-neutral-900/50 opacity-60'
    )}>
      <div className="flex items-center gap-3 p-4">
        {/* Drag Handle */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-neutral-700 transition-colors"
        >
          <EllipsisHorizontalIcon className="w-4 h-4 text-neutral-500" />
        </div>

        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.color)}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 bg-neutral-700 px-1.5 py-0.5 rounded">
              {index + 1}
            </span>
            <h4 className="font-medium text-white">{action.name}</h4>
          </div>
          <p className="text-sm text-neutral-400">{config.description}</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleEnabled}
            className={cn(
              'p-2 rounded-lg transition-colors',
              action.enabled
                ? 'text-status-success-text hover:bg-status-success-bg'
                : 'text-neutral-500 hover:bg-neutral-700'
            )}
          >
            <CheckCircleIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <Cog6ToothIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-2 rounded-lg text-neutral-400 hover:text-status-error-text hover:bg-status-error-bg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && config.fields.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-neutral-700 pt-4 grid grid-cols-2 gap-4">
              {config.fields.map((field) => (
                <ConfigField
                  key={field.name}
                  field={field}
                  value={action.config[field.name] as string | number | boolean}
                  onChange={(value) => onUpdateConfig({ [field.name]: value })}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Config Field Component
// ============================================================================

interface ConfigFieldProps {
  field: {
    name: string;
    label: string;
    type: string;
    options?: { value: string; label: string }[];
    placeholder?: string;
  };
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}

function ConfigField({ field, value, onChange }: ConfigFieldProps) {
  const baseInputClass = 'w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500 text-sm';

  switch (field.type) {
    case 'select':
    case 'template_select':
    case 'user_select':
    case 'tag_select':
    case 'entity_select':
      return (
        <div className={(field.type as any) === 'textarea' ? 'col-span-2' : ''}>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">{field.label}</label>
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );

    case 'textarea':
      return (
        <div className="col-span-2">
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">{field.label}</label>
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={baseInputClass}
          />
        </div>
      );

    case 'checkbox':
      return (
        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-600 bg-neutral-900 text-accent-600 focus:ring-accent-500"
            />
            <span className="text-sm text-neutral-300">{field.label}</span>
          </label>
        </div>
      );

    case 'number':
      return (
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">{field.label}</label>
          <input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        </div>
      );

    case 'time':
      return (
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">{field.label}</label>
          <input
            type="time"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          />
        </div>
      );

    default:
      return (
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">{field.label}</label>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        </div>
      );
  }
}

// ============================================================================
// Picker Modal Component
// ============================================================================

interface PickerModalProps {
  title: string;
  items: Array<{
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
  }>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function PickerModal({ title, items, onSelect, onClose }: PickerModalProps) {
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
            autoFocus
          />
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className="p-4 rounded-lg border border-neutral-700 hover:border-accent-500 bg-neutral-800/50 hover:bg-neutral-800 text-left transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', item.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white group-hover:text-accent-400 transition-colors">
                        {item.label}
                      </h4>
                      <p className="text-sm text-neutral-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-neutral-400">No results found</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Workflow List Component
// ============================================================================

export interface WorkflowListProps {
  workflows: Workflow[];
  onEdit: (workflow: Workflow) => void;
  onDelete: (workflowId: string) => void;
  onToggle: (workflowId: string, enabled: boolean) => void;
  onRun: (workflowId: string) => void;
  onCreate: () => void;
  className?: string;
}

export function WorkflowList({
  workflows,
  onEdit,
  onDelete,
  onToggle,
  onRun,
  onCreate,
  className,
}: WorkflowListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  const filteredWorkflows = useMemo(() => {
    if (filter === 'all') return workflows;
    return workflows.filter(w => filter === 'active' ? w.enabled : !w.enabled);
  }, [workflows, filter]);

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Workflows</h2>
          <p className="text-sm text-neutral-400">{workflows.length} workflows configured</p>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-500 font-medium transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          New Workflow
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'active', 'paused'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f
                ? 'bg-accent-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Workflow List */}
      <div className="space-y-3">
        {filteredWorkflows.map((workflow) => {
          const triggerConfig = TRIGGER_CONFIGS[workflow.trigger.type];
          const TriggerIcon = triggerConfig.icon;

          return (
            <div
              key={workflow.id}
              className={cn(
                'p-4 rounded-xl border transition-all',
                workflow.enabled
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
                    <h3 className="font-medium text-white">{workflow.name}</h3>
                    <span className={cn(
                      'px-2 py-0.5 text-[10px] font-medium uppercase rounded-full',
                      workflow.enabled
                        ? 'bg-status-success-bg text-status-success-text'
                        : 'bg-neutral-700 text-neutral-400'
                    )}>
                      {workflow.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  {workflow.description && (
                    <p className="text-sm text-neutral-400 mt-0.5">{workflow.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                    <span>{workflow.actions.length} actions</span>
                    <span>Run {workflow.runCount} times</span>
                    {workflow.lastRun && (
                      <span>Last run: {new Date(workflow.lastRun).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRun(workflow.id)}
                    className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                    title="Run Now"
                  >
                    <PlayIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onToggle(workflow.id, !workflow.enabled)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      workflow.enabled
                        ? 'text-status-success-text hover:bg-status-success-bg'
                        : 'text-neutral-400 hover:bg-neutral-700'
                    )}
                    title={workflow.enabled ? 'Pause' : 'Activate'}
                  >
                    {workflow.enabled ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => onEdit(workflow)}
                    className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                    title="Edit"
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(workflow.id)}
                    className="p-2 rounded-lg text-neutral-400 hover:text-status-error-text hover:bg-status-error-bg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredWorkflows.length === 0 && (
          <div className="text-center py-12">
            <Square3Stack3DIcon className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No workflows found</h3>
            <p className="text-sm text-neutral-400">
              {filter === 'all'
                ? 'Create your first workflow to automate repetitive tasks'
                : `No ${filter} workflows found`}
            </p>
            {filter === 'all' && (
              <button
                onClick={onCreate}
                className="mt-4 px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-500 font-medium transition-colors"
              >
                Create Workflow
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
