'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Card, Badge, Button, formatDate } from '../ui';
import {
  BoltIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserPlusIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  SparklesIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BellIcon,
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../ui/utils';

/**
 * WorkflowAutomation - Visual Workflow Builder
 * 
 * "When X happens, automatically do Y"
 * 
 * The heart of a truly intelligent CRM - automations that work
 * while advisors sleep.
 */

// ============================================
// Types
// ============================================

export type TriggerType =
  | 'prospect_converts'
  | 'client_created'
  | 'aum_milestone'
  | 'no_contact_days'
  | 'task_completed'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'document_uploaded'
  | 'document_expiring'
  | 'birthday_approaching'
  | 'review_due'
  | 'manual';

export type ActionType =
  | 'create_task'
  | 'send_email'
  | 'send_notification'
  | 'schedule_meeting'
  | 'update_field'
  | 'add_tag'
  | 'remove_tag'
  | 'create_note'
  | 'assign_to_user'
  | 'webhook'
  | 'delay';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty';

export interface WorkflowTrigger {
  type: TriggerType;
  config: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  config: Record<string, any>;
  order: number;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
  createdBy: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: Omit<WorkflowAction, 'id'>[];
  popularity: number;
}

// ============================================
// Constants
// ============================================

const TRIGGER_CONFIG: Record<TriggerType, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: { name: string; label: string; type: 'text' | 'number' | 'select'; options?: { value: string; label: string }[] }[];
}> = {
  prospect_converts: {
    label: 'Prospect Converts',
    description: 'When a prospect becomes a client',
    icon: <UserPlusIcon className="w-4 h-4" />,
    color: 'bg-green-500',
    fields: [],
  },
  client_created: {
    label: 'New Client Created',
    description: 'When a new client is added',
    icon: <UserGroupIcon className="w-4 h-4" />,
    color: 'bg-blue-500',
    fields: [],
  },
  aum_milestone: {
    label: 'AUM Milestone',
    description: 'When AUM crosses a threshold',
    icon: <CurrencyDollarIcon className="w-4 h-4" />,
    color: 'bg-emerald-500',
    fields: [
      { name: 'threshold', label: 'Threshold Amount', type: 'number' },
      { name: 'direction', label: 'Direction', type: 'select', options: [
        { value: 'above', label: 'Goes Above' },
        { value: 'below', label: 'Falls Below' },
      ]},
    ],
  },
  no_contact_days: {
    label: 'No Contact Period',
    description: 'When no contact for X days',
    icon: <ClockIcon className="w-4 h-4" />,
    color: 'bg-amber-500',
    fields: [
      { name: 'days', label: 'Days Without Contact', type: 'number' },
    ],
  },
  task_completed: {
    label: 'Task Completed',
    description: 'When a specific task type is completed',
    icon: <CheckCircleIcon className="w-4 h-4" />,
    color: 'bg-purple-500',
    fields: [
      { name: 'taskType', label: 'Task Type', type: 'select', options: [
        { value: 'any', label: 'Any Task' },
        { value: 'review', label: 'Review' },
        { value: 'follow_up', label: 'Follow Up' },
        { value: 'onboarding', label: 'Onboarding' },
      ]},
    ],
  },
  meeting_scheduled: {
    label: 'Meeting Scheduled',
    description: 'When a meeting is scheduled',
    icon: <CalendarIcon className="w-4 h-4" />,
    color: 'bg-indigo-500',
    fields: [],
  },
  meeting_completed: {
    label: 'Meeting Completed',
    description: 'When a meeting is marked complete',
    icon: <CalendarIcon className="w-4 h-4" />,
    color: 'bg-cyan-500',
    fields: [],
  },
  document_uploaded: {
    label: 'Document Uploaded',
    description: 'When a document is added',
    icon: <DocumentTextIcon className="w-4 h-4" />,
    color: 'bg-slate-500',
    fields: [
      { name: 'documentType', label: 'Document Type', type: 'select', options: [
        { value: 'any', label: 'Any Document' },
        { value: 'agreement', label: 'Agreement' },
        { value: 'statement', label: 'Statement' },
        { value: 'tax', label: 'Tax Document' },
      ]},
    ],
  },
  document_expiring: {
    label: 'Document Expiring',
    description: 'When a document is about to expire',
    icon: <ExclamationTriangleIcon className="w-4 h-4" />,
    color: 'bg-red-500',
    fields: [
      { name: 'daysBefore', label: 'Days Before Expiry', type: 'number' },
    ],
  },
  birthday_approaching: {
    label: 'Birthday Approaching',
    description: 'Before a client birthday',
    icon: <SparklesIcon className="w-4 h-4" />,
    color: 'bg-pink-500',
    fields: [
      { name: 'daysBefore', label: 'Days Before', type: 'number' },
    ],
  },
  review_due: {
    label: 'Review Due',
    description: 'When annual/quarterly review is due',
    icon: <ArrowPathIcon className="w-4 h-4" />,
    color: 'bg-orange-500',
    fields: [
      { name: 'daysBefore', label: 'Days Before Due', type: 'number' },
    ],
  },
  manual: {
    label: 'Manual Trigger',
    description: 'Run manually on selected clients',
    icon: <PlayIcon className="w-4 h-4" />,
    color: 'bg-gray-500',
    fields: [],
  },
};

const ACTION_CONFIG: Record<ActionType, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: { name: string; label: string; type: 'text' | 'number' | 'select' | 'textarea' | 'template'; options?: { value: string; label: string }[] }[];
}> = {
  create_task: {
    label: 'Create Task',
    description: 'Create a new task',
    icon: <CheckCircleIcon className="w-4 h-4" />,
    color: 'bg-blue-500',
    fields: [
      { name: 'title', label: 'Task Title', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'dueInDays', label: 'Due In (Days)', type: 'number' },
      { name: 'priority', label: 'Priority', type: 'select', options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ]},
      { name: 'assignTo', label: 'Assign To', type: 'select', options: [
        { value: 'trigger_user', label: 'Triggering User' },
        { value: 'client_owner', label: 'Client Owner' },
        { value: 'specific', label: 'Specific User' },
      ]},
    ],
  },
  send_email: {
    label: 'Send Email',
    description: 'Send an automated email',
    icon: <EnvelopeIcon className="w-4 h-4" />,
    color: 'bg-green-500',
    fields: [
      { name: 'template', label: 'Email Template', type: 'template' },
      { name: 'subject', label: 'Subject', type: 'text' },
      { name: 'to', label: 'Send To', type: 'select', options: [
        { value: 'client', label: 'Client' },
        { value: 'advisor', label: 'Advisor' },
        { value: 'both', label: 'Both' },
      ]},
    ],
  },
  send_notification: {
    label: 'Send Notification',
    description: 'Send an in-app notification',
    icon: <BellIcon className="w-4 h-4" />,
    color: 'bg-amber-500',
    fields: [
      { name: 'message', label: 'Notification Message', type: 'text' },
      { name: 'priority', label: 'Priority', type: 'select', options: [
        { value: 'urgent', label: 'Urgent' },
        { value: 'high', label: 'High' },
        { value: 'normal', label: 'Normal' },
      ]},
    ],
  },
  schedule_meeting: {
    label: 'Schedule Meeting',
    description: 'Create a meeting request',
    icon: <CalendarIcon className="w-4 h-4" />,
    color: 'bg-purple-500',
    fields: [
      { name: 'title', label: 'Meeting Title', type: 'text' },
      { name: 'duration', label: 'Duration (minutes)', type: 'number' },
      { name: 'scheduleDays', label: 'Schedule Within (Days)', type: 'number' },
    ],
  },
  update_field: {
    label: 'Update Field',
    description: 'Update a client field',
    icon: <PencilIcon className="w-4 h-4" />,
    color: 'bg-indigo-500',
    fields: [
      { name: 'field', label: 'Field', type: 'select', options: [
        { value: 'status', label: 'Status' },
        { value: 'riskTolerance', label: 'Risk Tolerance' },
        { value: 'reviewDate', label: 'Next Review Date' },
      ]},
      { name: 'value', label: 'New Value', type: 'text' },
    ],
  },
  add_tag: {
    label: 'Add Tag',
    description: 'Add a tag to the client',
    icon: <PlusIcon className="w-4 h-4" />,
    color: 'bg-teal-500',
    fields: [
      { name: 'tag', label: 'Tag Name', type: 'text' },
    ],
  },
  remove_tag: {
    label: 'Remove Tag',
    description: 'Remove a tag from the client',
    icon: <XMarkIcon className="w-4 h-4" />,
    color: 'bg-red-500',
    fields: [
      { name: 'tag', label: 'Tag Name', type: 'text' },
    ],
  },
  create_note: {
    label: 'Create Note',
    description: 'Add a note to the client',
    icon: <DocumentTextIcon className="w-4 h-4" />,
    color: 'bg-slate-500',
    fields: [
      { name: 'content', label: 'Note Content', type: 'textarea' },
    ],
  },
  assign_to_user: {
    label: 'Assign to User',
    description: 'Assign client to a team member',
    icon: <UserGroupIcon className="w-4 h-4" />,
    color: 'bg-cyan-500',
    fields: [
      { name: 'userId', label: 'Assign To', type: 'select', options: [
        { value: 'round_robin', label: 'Round Robin' },
        { value: 'specific', label: 'Specific User' },
      ]},
    ],
  },
  webhook: {
    label: 'Webhook',
    description: 'Call an external URL',
    icon: <BoltIcon className="w-4 h-4" />,
    color: 'bg-gray-500',
    fields: [
      { name: 'url', label: 'Webhook URL', type: 'text' },
      { name: 'method', label: 'Method', type: 'select', options: [
        { value: 'POST', label: 'POST' },
        { value: 'GET', label: 'GET' },
      ]},
    ],
  },
  delay: {
    label: 'Wait/Delay',
    description: 'Wait before next action',
    icon: <ClockIcon className="w-4 h-4" />,
    color: 'bg-orange-500',
    fields: [
      { name: 'delayDays', label: 'Days to Wait', type: 'number' },
      { name: 'delayHours', label: 'Hours to Wait', type: 'number' },
    ],
  },
};

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'new-client-onboarding',
    name: 'New Client Onboarding',
    description: 'Automated onboarding sequence for new clients',
    category: 'Onboarding',
    popularity: 95,
    trigger: { type: 'prospect_converts', config: {} },
    conditions: [],
    actions: [
      { type: 'create_task', config: { title: 'Send welcome packet', dueInDays: 1, priority: 'high' }, order: 1 },
      { type: 'send_email', config: { template: 'welcome', subject: 'Welcome to {{firm.name}}!' }, order: 2 },
      { type: 'create_task', config: { title: 'Schedule kickoff meeting', dueInDays: 3, priority: 'high' }, order: 3 },
      { type: 'create_task', config: { title: 'Complete risk assessment', dueInDays: 7, priority: 'medium' }, order: 4 },
      { type: 'add_tag', config: { tag: 'New Client' }, order: 5 },
    ],
  },
  {
    id: 'hnw-celebration',
    name: 'HNW Milestone Celebration',
    description: 'Celebrate when AUM crosses $1M',
    category: 'Retention',
    popularity: 88,
    trigger: { type: 'aum_milestone', config: { threshold: 1000000, direction: 'above' } },
    conditions: [],
    actions: [
      { type: 'send_notification', config: { message: '🎉 {{client.name}} just crossed $1M AUM!', priority: 'high' }, order: 1 },
      { type: 'create_task', config: { title: 'Send congratulations to {{client.name}}', dueInDays: 1, priority: 'high' }, order: 2 },
      { type: 'add_tag', config: { tag: 'HNW' }, order: 3 },
    ],
  },
  {
    id: 'dormant-client-outreach',
    name: 'Dormant Client Outreach',
    description: 'Re-engage clients with no recent contact',
    category: 'Retention',
    popularity: 92,
    trigger: { type: 'no_contact_days', config: { days: 30 } },
    conditions: [],
    actions: [
      { type: 'create_task', config: { title: 'Check in with {{client.name}}', dueInDays: 2, priority: 'medium' }, order: 1 },
      { type: 'send_notification', config: { message: 'No contact with {{client.name}} in 30 days', priority: 'normal' }, order: 2 },
    ],
  },
  {
    id: 'birthday-wishes',
    name: 'Birthday Wishes',
    description: 'Send birthday greetings automatically',
    category: 'Engagement',
    popularity: 85,
    trigger: { type: 'birthday_approaching', config: { daysBefore: 3 } },
    conditions: [],
    actions: [
      { type: 'create_task', config: { title: 'Send birthday card to {{client.name}}', dueInDays: 3, priority: 'low' }, order: 1 },
    ],
  },
  {
    id: 'document-renewal',
    name: 'Document Renewal Reminder',
    description: 'Alert when documents are expiring',
    category: 'Compliance',
    popularity: 90,
    trigger: { type: 'document_expiring', config: { daysBefore: 30 } },
    conditions: [],
    actions: [
      { type: 'create_task', config: { title: 'Renew {{document.name}} for {{client.name}}', dueInDays: 14, priority: 'high' }, order: 1 },
      { type: 'send_email', config: { template: 'document_renewal', subject: 'Document renewal required' }, order: 2 },
    ],
  },
  {
    id: 'post-meeting-followup',
    name: 'Post-Meeting Follow-up',
    description: 'Automatic follow-up after meetings',
    category: 'Engagement',
    popularity: 87,
    trigger: { type: 'meeting_completed', config: {} },
    conditions: [],
    actions: [
      { type: 'create_task', config: { title: 'Send meeting summary to {{client.name}}', dueInDays: 1, priority: 'medium' }, order: 1 },
      { type: 'delay', config: { delayDays: 7 }, order: 2 },
      { type: 'create_task', config: { title: 'Follow up on action items from {{meeting.title}}', dueInDays: 1, priority: 'medium' }, order: 3 },
    ],
  },
];

// ============================================
// Components
// ============================================

interface TriggerSelectorProps {
  selected?: TriggerType;
  onSelect: (trigger: TriggerType) => void;
}

function TriggerSelector({ selected, onSelect }: TriggerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full p-4 rounded-lg border-2 border-dashed text-left transition-all',
          selected
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-border-default hover:border-accent-primary/50 bg-surface-secondary'
        )}
      >
        {selected ? (
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', TRIGGER_CONFIG[selected].color)}>
              {TRIGGER_CONFIG[selected].icon}
            </div>
            <div>
              <p className="font-medium text-content-primary">{TRIGGER_CONFIG[selected].label}</p>
              <p className="text-sm text-content-tertiary">{TRIGGER_CONFIG[selected].description}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center">
              <BoltIcon className="w-5 h-5 text-content-tertiary" />
            </div>
            <div>
              <p className="font-medium text-content-secondary">Select a trigger</p>
              <p className="text-sm text-content-tertiary">When should this workflow run?</p>
            </div>
          </div>
        )}
        <ChevronDownIcon className={cn(
          'absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-tertiary transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
          >
            {Object.entries(TRIGGER_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  onSelect(key as TriggerType);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full p-3 flex items-center gap-3 text-left hover:bg-surface-secondary transition-colors',
                  selected === key && 'bg-accent-primary/10'
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white', config.color)}>
                  {config.icon}
                </div>
                <div>
                  <p className="font-medium text-content-primary text-sm">{config.label}</p>
                  <p className="text-xs text-content-tertiary">{config.description}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ActionCardProps {
  action: WorkflowAction;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

function ActionCard({ action, index, onEdit, onDelete }: ActionCardProps) {
  const config = ACTION_CONFIG[action.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="relative"
    >
      {/* Connector line */}
      {index > 0 && (
        <div className="absolute left-6 -top-4 w-0.5 h-4 bg-border" />
      )}

      <div className="flex items-start gap-3 p-4 bg-surface rounded-lg border border-border group hover:border-accent-primary/50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-secondary text-xs font-medium flex items-center justify-center text-content-tertiary">
            {index + 1}
          </span>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', config.color)}>
            {config.icon}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-content-primary">{config.label}</p>
          <p className="text-sm text-content-secondary mt-0.5">
            {action.type === 'create_task' && action.config.title}
            {action.type === 'send_email' && `Send: ${action.config.subject || 'Email'}`}
            {action.type === 'send_notification' && action.config.message}
            {action.type === 'delay' && `Wait ${action.config.delayDays || 0} days ${action.config.delayHours || 0} hours`}
            {action.type === 'add_tag' && `Add tag: ${action.config.tag}`}
            {action.type === 'remove_tag' && `Remove tag: ${action.config.tag}`}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-surface-secondary text-content-tertiary hover:text-content-primary"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-500/10 text-content-tertiary hover:text-red-500"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface ActionSelectorProps {
  onSelect: (type: ActionType) => void;
  onClose: () => void;
}

function ActionSelector({ onSelect, onClose }: ActionSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-surface border border-border rounded-lg shadow-xl p-4 w-96"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-content-primary">Add Action</h4>
        <button onClick={onClose} className="p-1 rounded hover:bg-surface-secondary">
          <XMarkIcon className="w-4 h-4 text-content-tertiary" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {Object.entries(ACTION_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => onSelect(key as ActionType)}
            className="p-3 rounded-lg border border-border hover:border-accent-primary/50 hover:bg-surface-secondary text-left transition-all"
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white mb-2', config.color)}>
              {config.icon}
            </div>
            <p className="font-medium text-sm text-content-primary">{config.label}</p>
            <p className="text-xs text-content-tertiary line-clamp-1">{config.description}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

interface WorkflowCardProps {
  workflow: Workflow;
  onEdit: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function WorkflowCard({ workflow, onEdit, onToggle, onDuplicate, onDelete }: WorkflowCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const triggerConfig = TRIGGER_CONFIG[workflow.trigger.type];

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-white',
              workflow.isActive ? triggerConfig.color : 'bg-gray-400'
            )}>
              {triggerConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-content-primary">{workflow.name}</h3>
                <Badge variant={workflow.isActive ? 'success' : 'default'} size="sm">
                  {workflow.isActive ? 'Active' : 'Paused'}
                </Badge>
              </div>
              <p className="text-sm text-content-secondary mt-0.5">{workflow.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-content-tertiary">
                <span>Triggered {workflow.triggerCount} times</span>
                {workflow.lastTriggeredAt && (
                  <span>Last: {formatDate(workflow.lastTriggeredAt)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className={cn(
                'p-2 rounded-lg transition-colors',
                workflow.isActive
                  ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                  : 'bg-surface-secondary text-content-tertiary hover:bg-surface-tertiary'
              )}
              title={workflow.isActive ? 'Pause workflow' : 'Activate workflow'}
            >
              {workflow.isActive ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={onEdit}
              className="p-2 rounded-lg bg-surface-secondary text-content-tertiary hover:bg-surface-tertiary hover:text-content-primary"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onDuplicate}
              className="p-2 rounded-lg bg-surface-secondary text-content-tertiary hover:bg-surface-tertiary hover:text-content-primary"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg bg-surface-secondary text-content-tertiary hover:bg-red-500/10 hover:text-red-500"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expand to show actions */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 mt-3 text-sm text-accent-primary hover:text-accent-primary-hover"
        >
          {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
          {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-border"
            >
              <div className="space-y-2">
                {workflow.actions.map((action, index) => {
                  const actionConfig = ACTION_CONFIG[action.type];
                  return (
                    <div key={action.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-surface-secondary text-xs flex items-center justify-center text-content-tertiary">
                        {index + 1}
                      </span>
                      <div className={cn('w-6 h-6 rounded flex items-center justify-center text-white', actionConfig.color)}>
                        {actionConfig.icon}
                      </div>
                      <span className="text-content-secondary">{actionConfig.label}</span>
                      {action.type === 'delay' && (
                        <span className="text-content-tertiary">
                          ({action.config.delayDays || 0}d {action.config.delayHours || 0}h)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

interface TemplateCardProps {
  template: WorkflowTemplate;
  onUse: () => void;
}

function TemplateCard({ template, onUse }: TemplateCardProps) {
  const triggerConfig = TRIGGER_CONFIG[template.trigger.type];

  return (
    <Card className="p-4 hover:border-accent-primary/50 transition-colors cursor-pointer group" onClick={onUse}>
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', triggerConfig.color)}>
          {triggerConfig.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-content-primary">{template.name}</h4>
            <Badge variant="info" size="sm">{template.category}</Badge>
          </div>
          <p className="text-sm text-content-secondary mt-1">{template.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-content-tertiary">{template.actions.length} actions</span>
            <span className="text-xs text-content-tertiary">•</span>
            <span className="text-xs text-amber-500">★ {template.popularity}% popular</span>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" className="w-full">
          Use This Template
        </Button>
      </div>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export interface WorkflowAutomationProps {
  workflows?: Workflow[];
  onSave?: (workflow: Partial<Workflow>) => void;
  onDelete?: (workflowId: string) => void;
  onToggle?: (workflowId: string, isActive: boolean) => void;
  className?: string;
}

export function WorkflowAutomation({
  workflows: initialWorkflows = [],
  onSave,
  onDelete,
  onToggle,
  className,
}: WorkflowAutomationProps) {
  const [view, setView] = useState<'list' | 'create' | 'templates'>('list');
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [editingWorkflow, setEditingWorkflow] = useState<Partial<Workflow> | null>(null);
  const [showActionSelector, setShowActionSelector] = useState(false);

  // Builder state
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType | undefined>();
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');

  const resetBuilder = useCallback(() => {
    setSelectedTrigger(undefined);
    setTriggerConfig({});
    setActions([]);
    setWorkflowName('');
    setWorkflowDescription('');
    setEditingWorkflow(null);
  }, []);

  const handleCreateNew = () => {
    resetBuilder();
    setView('create');
  };

  const handleUseTemplate = (template: WorkflowTemplate) => {
    setSelectedTrigger(template.trigger.type);
    setTriggerConfig(template.trigger.config);
    setActions(template.actions.map((a, i) => ({ ...a, id: `action-${i}` })));
    setWorkflowName(template.name);
    setWorkflowDescription(template.description);
    setView('create');
  };

  const handleAddAction = (type: ActionType) => {
    const newAction: WorkflowAction = {
      id: `action-${Date.now()}`,
      type,
      config: {},
      order: actions.length + 1,
    };
    setActions([...actions, newAction]);
    setShowActionSelector(false);
  };

  const handleDeleteAction = (actionId: string) => {
    setActions(actions.filter(a => a.id !== actionId));
  };

  const handleSaveWorkflow = () => {
    if (!selectedTrigger || !workflowName || actions.length === 0) return;

    const workflow: Partial<Workflow> = {
      id: editingWorkflow?.id || `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      trigger: { type: selectedTrigger, config: triggerConfig },
      conditions: [],
      actions,
      isActive: true,
      createdAt: editingWorkflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggerCount: editingWorkflow?.triggerCount || 0,
      createdBy: 'current-user',
    };

    if (editingWorkflow?.id) {
      setWorkflows(workflows.map(w => w.id === workflow.id ? workflow as Workflow : w));
    } else {
      setWorkflows([...workflows, workflow as Workflow]);
    }

    onSave?.(workflow);
    resetBuilder();
    setView('list');
  };

  const handleToggleWorkflow = (workflowId: string) => {
    setWorkflows(workflows.map(w => 
      w.id === workflowId ? { ...w, isActive: !w.isActive } : w
    ));
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      onToggle?.(workflowId, !workflow.isActive);
    }
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflows(workflows.filter(w => w.id !== workflowId));
    onDelete?.(workflowId);
  };

  const handleDuplicateWorkflow = (workflow: Workflow) => {
    const duplicate: Workflow = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      name: `${workflow.name} (Copy)`,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggerCount: 0,
      lastTriggeredAt: undefined,
    };
    setWorkflows([...workflows, duplicate]);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setSelectedTrigger(workflow.trigger.type);
    setTriggerConfig(workflow.trigger.config);
    setActions(workflow.actions);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setView('create');
  };

  const activeWorkflows = workflows.filter(w => w.isActive).length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BoltIcon className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-semibold text-content-primary">Workflow Automation</h2>
          </div>
          <p className="text-sm text-content-secondary mt-1">
            {activeWorkflows} active workflow{activeWorkflows !== 1 ? 's' : ''} • Automate repetitive tasks
          </p>
        </div>

        {view === 'list' && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setView('templates')}>
              <SparklesIcon className="w-4 h-4 mr-1" />
              Templates
            </Button>
            <Button onClick={handleCreateNew}>
              <PlusIcon className="w-4 h-4 mr-1" />
              Create Workflow
            </Button>
          </div>
        )}

        {(view === 'create' || view === 'templates') && (
          <Button variant="secondary" onClick={() => { resetBuilder(); setView('list'); }}>
            ← Back to Workflows
          </Button>
        )}
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-4">
          {workflows.length === 0 ? (
            <Card className="p-12 text-center">
              <BoltIcon className="w-12 h-12 mx-auto text-content-tertiary opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-content-primary mb-2">No workflows yet</h3>
              <p className="text-content-secondary mb-6">
                Create your first automation to save time on repetitive tasks
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="secondary" onClick={() => setView('templates')}>
                  Browse Templates
                </Button>
                <Button onClick={handleCreateNew}>
                  Create Custom Workflow
                </Button>
              </div>
            </Card>
          ) : (
            workflows.map(workflow => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onEdit={() => handleEditWorkflow(workflow)}
                onToggle={() => handleToggleWorkflow(workflow.id)}
                onDuplicate={() => handleDuplicateWorkflow(workflow)}
                onDelete={() => handleDeleteWorkflow(workflow.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Templates View */}
      {view === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-content-secondary">
            <SparklesIcon className="w-4 h-4 text-amber-500" />
            Popular templates to get you started
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WORKFLOW_TEMPLATES.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handleUseTemplate(template)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit View */}
      {view === 'create' && (
        <div className="space-y-6">
          {/* Workflow Name */}
          <Card className="p-4">
            <label className="block text-sm font-medium text-content-primary mb-2">
              Workflow Name
            </label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="e.g., New Client Onboarding"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-content-primary placeholder:text-content-tertiary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
            />
            <label className="block text-sm font-medium text-content-primary mt-4 mb-2">
              Description (optional)
            </label>
            <textarea
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-content-primary placeholder:text-content-tertiary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary resize-none"
            />
          </Card>

          {/* Trigger Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                1
              </div>
              <h3 className="font-medium text-content-primary">When this happens...</h3>
            </div>
            <TriggerSelector
              selected={selectedTrigger}
              onSelect={setSelectedTrigger}
            />

            {/* Trigger Config Fields */}
            {selectedTrigger && TRIGGER_CONFIG[selectedTrigger].fields.length > 0 && (
              <Card className="mt-3 p-4">
                <div className="grid grid-cols-2 gap-4">
                  {TRIGGER_CONFIG[selectedTrigger].fields.map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-content-primary mb-1">
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={triggerConfig[field.name] || ''}
                          onChange={(e) => setTriggerConfig({ ...triggerConfig, [field.name]: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-content-primary"
                        >
                          <option value="">Select...</option>
                          {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={triggerConfig[field.name] || ''}
                          onChange={(e) => setTriggerConfig({ ...triggerConfig, [field.name]: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-content-primary"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                2
              </div>
              <h3 className="font-medium text-content-primary">Do these actions...</h3>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {actions.map((action, index) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    index={index}
                    onEdit={() => {/* TODO: Edit modal */}}
                    onDelete={() => handleDeleteAction(action.id)}
                  />
                ))}
              </AnimatePresence>

              {/* Add Action Button */}
              <div className="relative">
                {actions.length > 0 && (
                  <div className="absolute left-6 -top-4 w-0.5 h-4 bg-border" />
                )}
                <button
                  onClick={() => setShowActionSelector(true)}
                  className="w-full p-4 rounded-lg border-2 border-dashed border-border-default hover:border-accent-primary/50 bg-surface-secondary text-content-secondary hover:text-content-primary transition-all flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Action
                </button>

                <AnimatePresence>
                  {showActionSelector && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                      <ActionSelector
                        onSelect={handleAddAction}
                        onClose={() => setShowActionSelector(false)}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => { resetBuilder(); setView('list'); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveWorkflow}
              disabled={!selectedTrigger || !workflowName || actions.length === 0}
            >
              {editingWorkflow?.id ? 'Update Workflow' : 'Create Workflow'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { WORKFLOW_TEMPLATES, TRIGGER_CONFIG, ACTION_CONFIG };
