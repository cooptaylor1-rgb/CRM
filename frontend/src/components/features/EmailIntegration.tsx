'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../ui/utils';
import {
  EnvelopeIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  UserIcon,
  UsersIcon,
  SparklesIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlayIcon,
  PauseIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TagIcon,
  BoltIcon,
  LinkIcon,
  ClipboardIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'onboarding' | 'follow-up' | 'meeting' | 'milestone' | 'newsletter' | 'custom';
  variables: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  openRate?: number;
  clickRate?: number;
}

export interface EmailSequenceStep {
  id: string;
  templateId: string;
  delayDays: number;
  delayHours: number;
  condition?: {
    type: 'always' | 'if_no_reply' | 'if_no_open' | 'if_clicked' | 'if_not_clicked';
    value?: string;
  };
  enabled: boolean;
}

export interface EmailSequence {
  id: string;
  name: string;
  description?: string;
  trigger: 'manual' | 'event' | 'scheduled';
  triggerConfig?: Record<string, unknown>;
  steps: EmailSequenceStep[];
  enabled: boolean;
  enrolledCount: number;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledEmail {
  id: string;
  templateId: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  scheduledAt: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  sequenceId?: string;
  sequenceStepIndex?: number;
}

export interface MeetingSchedulerConfig {
  id: string;
  name: string;
  duration: number; // minutes
  bufferBefore: number;
  bufferAfter: number;
  availableDays: number[]; // 0-6, Sunday-Saturday
  availableTimeStart: string; // "09:00"
  availableTimeEnd: string; // "17:00"
  timezone: string;
  bookingUrl: string;
  confirmationTemplateId?: string;
  reminderTemplateId?: string;
  reminderHoursBefore: number;
  enabled: boolean;
}

// ============================================================================
// Template Categories Configuration
// ============================================================================

const TEMPLATE_CATEGORIES = {
  onboarding: { label: 'Onboarding', color: 'text-blue-400 bg-blue-500/10', icon: UserIcon },
  'follow-up': { label: 'Follow-up', color: 'text-amber-400 bg-amber-500/10', icon: ArrowPathIcon },
  meeting: { label: 'Meeting', color: 'text-purple-400 bg-purple-500/10', icon: CalendarDaysIcon },
  milestone: { label: 'Milestone', color: 'text-green-400 bg-green-500/10', icon: SparklesIcon },
  newsletter: { label: 'Newsletter', color: 'text-cyan-400 bg-cyan-500/10', icon: EnvelopeIcon },
  custom: { label: 'Custom', color: 'text-gray-400 bg-gray-500/10', icon: PencilSquareIcon },
};

const VARIABLE_SUGGESTIONS = [
  { variable: '{{client.first_name}}', label: 'Client First Name' },
  { variable: '{{client.last_name}}', label: 'Client Last Name' },
  { variable: '{{client.full_name}}', label: 'Client Full Name' },
  { variable: '{{client.email}}', label: 'Client Email' },
  { variable: '{{advisor.name}}', label: 'Advisor Name' },
  { variable: '{{advisor.email}}', label: 'Advisor Email' },
  { variable: '{{advisor.phone}}', label: 'Advisor Phone' },
  { variable: '{{household.name}}', label: 'Household Name' },
  { variable: '{{household.aum}}', label: 'Household AUM' },
  { variable: '{{meeting.date}}', label: 'Meeting Date' },
  { variable: '{{meeting.time}}', label: 'Meeting Time' },
  { variable: '{{meeting.link}}', label: 'Meeting Link' },
  { variable: '{{company.name}}', label: 'Company Name' },
  { variable: '{{today}}', label: 'Today\'s Date' },
  { variable: '{{unsubscribe_link}}', label: 'Unsubscribe Link' },
];

// ============================================================================
// Email Template Editor Component
// ============================================================================

export interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  onCancel: () => void;
  className?: string;
}

export function EmailTemplateEditor({
  template,
  onSave,
  onCancel,
  className,
}: EmailTemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [category, setCategory] = useState<EmailTemplate['category']>(template?.category || 'custom');
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Extract variables from body
  const usedVariables = useMemo(() => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [...(body.matchAll(regex) || []), ...(subject.matchAll(regex) || [])];
    return [...new Set(matches.map(m => `{{${m[1]}}}`))];
  }, [body, subject]);

  const insertVariable = useCallback((variable: string) => {
    // Insert at cursor position in body
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = body.substring(0, start) + variable + body.substring(end);
      setBody(newBody);
      // Reset cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setBody(prev => prev + variable);
    }
    setShowVariables(false);
  }, [body]);

  const validate = useCallback(() => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Template name is required');
    if (!subject.trim()) errs.push('Subject line is required');
    if (!body.trim()) errs.push('Email body is required');
    setErrors(errs);
    return errs.length === 0;
  }, [name, subject, body]);

  const handleSave = useCallback(() => {
    if (!validate()) return;
    onSave({
      name,
      subject,
      body,
      category,
      variables: usedVariables,
      isSystem: false,
    });
  }, [name, subject, body, category, usedVariables, validate, onSave]);

  // Preview with sample data
  const previewSubject = useMemo(() => {
    return subject
      .replace(/\{\{client\.first_name\}\}/g, 'John')
      .replace(/\{\{client\.last_name\}\}/g, 'Smith')
      .replace(/\{\{client\.full_name\}\}/g, 'John Smith')
      .replace(/\{\{advisor\.name\}\}/g, 'Sarah Johnson')
      .replace(/\{\{company\.name\}\}/g, 'Wealth Advisors');
  }, [subject]);

  const previewBody = useMemo(() => {
    return body
      .replace(/\{\{client\.first_name\}\}/g, 'John')
      .replace(/\{\{client\.last_name\}\}/g, 'Smith')
      .replace(/\{\{client\.full_name\}\}/g, 'John Smith')
      .replace(/\{\{client\.email\}\}/g, 'john.smith@example.com')
      .replace(/\{\{advisor\.name\}\}/g, 'Sarah Johnson')
      .replace(/\{\{advisor\.email\}\}/g, 'sarah@wealthadvisors.com')
      .replace(/\{\{advisor\.phone\}\}/g, '(555) 123-4567')
      .replace(/\{\{household\.name\}\}/g, 'Smith Family')
      .replace(/\{\{household\.aum\}\}/g, '$2,500,000')
      .replace(/\{\{meeting\.date\}\}/g, 'January 20, 2026')
      .replace(/\{\{meeting\.time\}\}/g, '2:00 PM EST')
      .replace(/\{\{meeting\.link\}\}/g, 'https://meet.example.com/xyz')
      .replace(/\{\{company\.name\}\}/g, 'Wealth Advisors')
      .replace(/\{\{today\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{unsubscribe_link\}\}/g, '#unsubscribe');
  }, [body]);

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
            {template ? 'Edit Template' : 'New Email Template'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              showPreview
                ? 'bg-accent-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            )}
          >
            <EyeIcon className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent-600 text-white hover:bg-accent-500 text-sm font-medium transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Save Template
          </button>
        </div>
      </div>

      {/* Errors */}
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
                <ul className="text-sm text-status-error-text list-disc list-inside">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Name & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Template Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                placeholder="e.g., Welcome Email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EmailTemplate['category'])}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
              >
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
              placeholder="e.g., Welcome to {{company.name}}, {{client.first_name}}!"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-neutral-300">Email Body</label>
              <div className="relative">
                <button
                  onClick={() => setShowVariables(!showVariables)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-accent-400 hover:text-accent-300 hover:bg-neutral-800 transition-colors"
                >
                  <TagIcon className="w-3.5 h-3.5" />
                  Insert Variable
                  <ChevronDownIcon className={cn('w-3 h-3 transition-transform', showVariables && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {showVariables && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-1 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-dropdown overflow-hidden"
                    >
                      <div className="max-h-64 overflow-y-auto">
                        {VARIABLE_SUGGESTIONS.map((v) => (
                          <button
                            key={v.variable}
                            onClick={() => insertVariable(v.variable)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-neutral-700 transition-colors"
                          >
                            <span className="text-sm text-neutral-300">{v.label}</span>
                            <code className="text-xs text-accent-400 bg-accent-500/10 px-1.5 py-0.5 rounded">
                              {v.variable}
                            </code>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <textarea
              id="template-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500 font-mono text-sm"
              placeholder="Hi {{client.first_name}},

Thank you for choosing {{company.name}}. We're excited to have you as a client!

Best regards,
{{advisor.name}}"
            />
          </div>

          {/* Used Variables */}
          {usedVariables.length > 0 && (
            <div className="p-3 bg-neutral-800/50 rounded-lg">
              <p className="text-xs font-medium text-neutral-400 mb-2">Variables used in this template:</p>
              <div className="flex flex-wrap gap-2">
                {usedVariables.map((v) => (
                  <span
                    key={v}
                    className="px-2 py-1 text-xs font-mono bg-accent-500/10 text-accent-400 rounded"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Panel */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 bottom-0 w-1/2 bg-neutral-900 border-l border-neutral-700 shadow-2xl z-modal"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <h3 className="font-semibold text-white">Email Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {/* Email Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center text-white font-semibold">
                        WA
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Wealth Advisors</p>
                        <p className="text-sm text-gray-500">sarah@wealthadvisors.com</p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900">{previewSubject || 'No subject'}</p>
                  </div>

                  {/* Email Body */}
                  <div className="p-6">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {previewBody || 'No content'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Email Sequence Builder Component
// ============================================================================

export interface EmailSequenceBuilderProps {
  sequence?: EmailSequence;
  templates: EmailTemplate[];
  onSave: (sequence: Omit<EmailSequence, 'id' | 'createdAt' | 'updatedAt' | 'enrolledCount' | 'completedCount'>) => void;
  onCancel: () => void;
  className?: string;
}

export function EmailSequenceBuilder({
  sequence,
  templates,
  onSave,
  onCancel,
  className,
}: EmailSequenceBuilderProps) {
  const [name, setName] = useState(sequence?.name || '');
  const [description, setDescription] = useState(sequence?.description || '');
  const [trigger, setTrigger] = useState<EmailSequence['trigger']>(sequence?.trigger || 'manual');
  const [steps, setSteps] = useState<EmailSequenceStep[]>(sequence?.steps || []);
  const [enabled, setEnabled] = useState(sequence?.enabled ?? true);

  const generateId = () => `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addStep = useCallback(() => {
    setSteps(prev => [...prev, {
      id: generateId(),
      templateId: '',
      delayDays: prev.length === 0 ? 0 : 1,
      delayHours: 0,
      enabled: true,
    }]);
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<EmailSequenceStep>) => {
    setSteps(prev => prev.map(s =>
      s.id === stepId ? { ...s, ...updates } : s
    ));
  }, []);

  const removeStep = useCallback((stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId));
  }, []);

  const moveStep = useCallback((stepId: string, direction: 'up' | 'down') => {
    setSteps(prev => {
      const index = prev.findIndex(s => s.id === stepId);
      if (direction === 'up' && index > 0) {
        const newSteps = [...prev];
        [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
        return newSteps;
      } else if (direction === 'down' && index < prev.length - 1) {
        const newSteps = [...prev];
        [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
        return newSteps;
      }
      return prev;
    });
  }, []);

  const handleSave = useCallback(() => {
    onSave({
      name,
      description,
      trigger,
      steps,
      enabled,
    });
  }, [name, description, trigger, steps, enabled, onSave]);

  // Calculate total sequence duration
  const totalDuration = useMemo(() => {
    const totalDays = steps.reduce((acc, s) => acc + s.delayDays, 0);
    const totalHours = steps.reduce((acc, s) => acc + s.delayHours, 0);
    return { days: totalDays + Math.floor(totalHours / 24), hours: totalHours % 24 };
  }, [steps]);

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
            {sequence ? 'Edit Sequence' : 'New Email Sequence'}
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
            Save Sequence
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Sequence Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                placeholder="e.g., New Client Onboarding"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Trigger</label>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value as EmailSequence['trigger'])}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
              >
                <option value="manual">Manual Enrollment</option>
                <option value="event">Event-Based</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
              placeholder="Describe the purpose of this sequence..."
            />
          </div>

          {/* Sequence Stats */}
          {totalDuration.days > 0 && (
            <div className="p-3 bg-accent-500/10 border border-accent-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-accent-400" />
                <span className="text-sm text-accent-300">
                  Total sequence duration: {totalDuration.days} day{totalDuration.days !== 1 ? 's' : ''}
                  {totalDuration.hours > 0 && `, ${totalDuration.hours} hour${totalDuration.hours !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          )}

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Sequence Steps</h3>
              <button
                onClick={addStep}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-sm font-medium transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Step
              </button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => {
                const template = templates.find(t => t.id === step.templateId);
                const cumulativeDays = steps.slice(0, index + 1).reduce((acc, s) => acc + s.delayDays, 0);

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'relative p-4 rounded-xl border transition-all',
                      step.enabled
                        ? 'border-neutral-700 bg-neutral-800/50'
                        : 'border-neutral-800 bg-neutral-900/50 opacity-60'
                    )}
                  >
                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-8 top-full w-0.5 h-4 bg-neutral-700" />
                    )}

                    <div className="flex items-start gap-4">
                      {/* Step Number */}
                      <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* Delay */}
                        <div className="flex items-center gap-2">
                          {index === 0 ? (
                            <span className="text-xs text-neutral-400">Send immediately when enrolled</span>
                          ) : (
                            <>
                              <span className="text-xs text-neutral-400">Wait</span>
                              <input
                                type="number"
                                min="0"
                                value={step.delayDays}
                                onChange={(e) => updateStep(step.id, { delayDays: parseInt(e.target.value, 10) || 0 })}
                                className="w-16 px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-accent-500"
                              />
                              <span className="text-xs text-neutral-400">days</span>
                              <input
                                type="number"
                                min="0"
                                max="23"
                                value={step.delayHours}
                                onChange={(e) => updateStep(step.id, { delayHours: parseInt(e.target.value, 10) || 0 })}
                                className="w-16 px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-accent-500"
                              />
                              <span className="text-xs text-neutral-400">hours, then send</span>
                            </>
                          )}
                          <span className="ml-auto text-xs text-neutral-500">
                            Day {cumulativeDays}
                          </span>
                        </div>

                        {/* Template Select */}
                        <div>
                          <select
                            value={step.templateId}
                            onChange={(e) => updateStep(step.id, { templateId: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                          >
                            <option value="">Select email template...</option>
                            {templates.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>

                        {template && (
                          <div className="p-2 bg-neutral-900/50 rounded-lg">
                            <p className="text-xs text-neutral-400">Subject: {template.subject}</p>
                          </div>
                        )}

                        {/* Condition */}
                        <div>
                          <select
                            value={step.condition?.type || 'always'}
                            onChange={(e) => updateStep(step.id, {
                              condition: { type: e.target.value as EmailSequenceStep['condition']['type'] }
                            })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-accent-500"
                          >
                            <option value="always">Always send</option>
                            <option value="if_no_reply">Only if no reply to previous email</option>
                            <option value="if_no_open">Only if previous email not opened</option>
                            <option value="if_clicked">Only if previous email link clicked</option>
                            <option value="if_not_clicked">Only if previous email link not clicked</option>
                          </select>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => updateStep(step.id, { enabled: !step.enabled })}
                          className={cn(
                            'p-1.5 rounded transition-colors',
                            step.enabled
                              ? 'text-status-success-text hover:bg-status-success-bg'
                              : 'text-neutral-500 hover:bg-neutral-700'
                          )}
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveStep(step.id, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 transition-colors"
                        >
                          <ChevronRightIcon className="w-4 h-4 -rotate-90" />
                        </button>
                        <button
                          onClick={() => moveStep(step.id, 'down')}
                          disabled={index === steps.length - 1}
                          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 transition-colors"
                        >
                          <ChevronRightIcon className="w-4 h-4 rotate-90" />
                        </button>
                        <button
                          onClick={() => removeStep(step.id)}
                          className="p-1.5 rounded text-neutral-400 hover:text-status-error-text hover:bg-status-error-bg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {steps.length === 0 && (
                <button
                  onClick={addStep}
                  className="w-full p-8 rounded-xl border-2 border-dashed border-neutral-700 hover:border-accent-500 text-neutral-400 hover:text-accent-400 transition-colors"
                >
                  <div className="flex flex-col items-center gap-2">
                    <EnvelopeIcon className="w-8 h-8" />
                    <span className="font-medium">Add First Email</span>
                    <span className="text-sm text-neutral-500">Click to add the first step in your sequence</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Meeting Scheduler Config Component
// ============================================================================

export interface MeetingSchedulerConfigProps {
  config?: MeetingSchedulerConfig;
  templates: EmailTemplate[];
  onSave: (config: Omit<MeetingSchedulerConfig, 'id' | 'bookingUrl'>) => void;
  onCancel: () => void;
  className?: string;
}

export function MeetingSchedulerConfig({
  config,
  templates,
  onSave,
  onCancel,
  className,
}: MeetingSchedulerConfigProps) {
  const [name, setName] = useState(config?.name || '');
  const [duration, setDuration] = useState(config?.duration || 30);
  const [bufferBefore, setBufferBefore] = useState(config?.bufferBefore || 0);
  const [bufferAfter, setBufferAfter] = useState(config?.bufferAfter || 15);
  const [availableDays, setAvailableDays] = useState<number[]>(config?.availableDays || [1, 2, 3, 4, 5]);
  const [availableTimeStart, setAvailableTimeStart] = useState(config?.availableTimeStart || '09:00');
  const [availableTimeEnd, setAvailableTimeEnd] = useState(config?.availableTimeEnd || '17:00');
  const [timezone, setTimezone] = useState(config?.timezone || 'America/New_York');
  const [confirmationTemplateId, setConfirmationTemplateId] = useState(config?.confirmationTemplateId || '');
  const [reminderTemplateId, setReminderTemplateId] = useState(config?.reminderTemplateId || '');
  const [reminderHoursBefore, setReminderHoursBefore] = useState(config?.reminderHoursBefore || 24);
  const [enabled, setEnabled] = useState(config?.enabled ?? true);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (day: number) => {
    setAvailableDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = useCallback(() => {
    onSave({
      name,
      duration,
      bufferBefore,
      bufferAfter,
      availableDays,
      availableTimeStart,
      availableTimeEnd,
      timezone,
      confirmationTemplateId: confirmationTemplateId || undefined,
      reminderTemplateId: reminderTemplateId || undefined,
      reminderHoursBefore,
      enabled,
    });
  }, [
    name, duration, bufferBefore, bufferAfter, availableDays,
    availableTimeStart, availableTimeEnd, timezone,
    confirmationTemplateId, reminderTemplateId, reminderHoursBefore, enabled, onSave
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
            {config ? 'Edit Meeting Type' : 'New Meeting Type'}
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
            {enabled ? 'Active' : 'Inactive'}
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
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Meeting Type Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-500"
                placeholder="e.g., Portfolio Review"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Duration (minutes)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Timezone</label>
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

          {/* Availability */}
          <div className="p-4 bg-neutral-800/50 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Availability</h3>

            <div>
              <label className="block text-xs text-neutral-400 mb-2">Available Days</label>
              <div className="flex gap-2">
                {dayNames.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(index)}
                    className={cn(
                      'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                      availableDays.includes(index)
                        ? 'bg-accent-600 text-white'
                        : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={availableTimeStart}
                  onChange={(e) => setAvailableTimeStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">End Time</label>
                <input
                  type="time"
                  value={availableTimeEnd}
                  onChange={(e) => setAvailableTimeEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Buffer Before (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={bufferBefore}
                  onChange={(e) => setBufferBefore(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Buffer After (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={bufferAfter}
                  onChange={(e) => setBufferAfter(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                />
              </div>
            </div>
          </div>

          {/* Email Templates */}
          <div className="p-4 bg-neutral-800/50 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Email Notifications</h3>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Confirmation Email Template</label>
              <select
                value={confirmationTemplateId}
                onChange={(e) => setConfirmationTemplateId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
              >
                <option value="">No confirmation email</option>
                {templates.filter(t => t.category === 'meeting').map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Reminder Email Template</label>
                <select
                  value={reminderTemplateId}
                  onChange={(e) => setReminderTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                >
                  <option value="">No reminder email</option>
                  {templates.filter(t => t.category === 'meeting').map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Send Reminder (hours before)</label>
                <input
                  type="number"
                  min="1"
                  value={reminderHoursBefore}
                  onChange={(e) => setReminderHoursBefore(parseInt(e.target.value, 10) || 24)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-accent-500"
                />
              </div>
            </div>
          </div>

          {/* Booking Link Preview */}
          {config?.bookingUrl && (
            <div className="p-4 bg-accent-500/10 border border-accent-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-accent-400" />
                  <span className="text-sm text-accent-300">Booking URL</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(config.bookingUrl)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-accent-400 hover:bg-accent-500/20 transition-colors"
                >
                  <ClipboardIcon className="w-3.5 h-3.5" />
                  Copy
                </button>
              </div>
              <p className="mt-2 text-sm text-neutral-400 font-mono break-all">{config.bookingUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Email Dashboard Component
// ============================================================================

export interface EmailDashboardProps {
  templates: EmailTemplate[];
  sequences: EmailSequence[];
  scheduledEmails: ScheduledEmail[];
  schedulerConfigs: MeetingSchedulerConfig[];
  onCreateTemplate: () => void;
  onEditTemplate: (template: EmailTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onCreateSequence: () => void;
  onEditSequence: (sequence: EmailSequence) => void;
  onToggleSequence: (sequenceId: string, enabled: boolean) => void;
  onCreateScheduler: () => void;
  onEditScheduler: (config: MeetingSchedulerConfig) => void;
  className?: string;
}

export function EmailDashboard({
  templates,
  sequences,
  scheduledEmails,
  schedulerConfigs,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateSequence,
  onEditSequence,
  onToggleSequence,
  onCreateScheduler,
  onEditScheduler,
  className,
}: EmailDashboardProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'sequences' | 'scheduled' | 'scheduler'>('templates');

  // Stats
  const stats = useMemo(() => {
    const sentEmails = scheduledEmails.filter(e => e.status === 'sent');
    const openedEmails = scheduledEmails.filter(e => e.openedAt);
    const clickedEmails = scheduledEmails.filter(e => e.clickedAt);

    return {
      totalTemplates: templates.length,
      activeSequences: sequences.filter(s => s.enabled).length,
      sentThisMonth: sentEmails.length,
      openRate: sentEmails.length > 0 ? Math.round((openedEmails.length / sentEmails.length) * 100) : 0,
      clickRate: openedEmails.length > 0 ? Math.round((clickedEmails.length / openedEmails.length) * 100) : 0,
    };
  }, [templates, sequences, scheduledEmails]);

  return (
    <div className={cn('', className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-neutral-800/50 rounded-xl">
          <p className="text-2xl font-bold text-white">{stats.totalTemplates}</p>
          <p className="text-sm text-neutral-400">Templates</p>
        </div>
        <div className="p-4 bg-neutral-800/50 rounded-xl">
          <p className="text-2xl font-bold text-white">{stats.activeSequences}</p>
          <p className="text-sm text-neutral-400">Active Sequences</p>
        </div>
        <div className="p-4 bg-neutral-800/50 rounded-xl">
          <p className="text-2xl font-bold text-white">{stats.sentThisMonth}</p>
          <p className="text-sm text-neutral-400">Sent This Month</p>
        </div>
        <div className="p-4 bg-neutral-800/50 rounded-xl">
          <p className="text-2xl font-bold text-status-success-text">{stats.openRate}%</p>
          <p className="text-sm text-neutral-400">Open Rate</p>
        </div>
        <div className="p-4 bg-neutral-800/50 rounded-xl">
          <p className="text-2xl font-bold text-accent-400">{stats.clickRate}%</p>
          <p className="text-sm text-neutral-400">Click Rate</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(['templates', 'sequences', 'scheduled', 'scheduler'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-accent-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'templates' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Email Templates</h3>
            <button
              onClick={onCreateTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-500 font-medium transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              New Template
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {templates.map((template) => {
              const catConfig = TEMPLATE_CATEGORIES[template.category];
              const CatIcon = catConfig.icon;

              return (
                <div
                  key={template.id}
                  className="p-4 bg-neutral-800/50 rounded-xl border border-neutral-700 hover:border-neutral-600 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', catConfig.color)}>
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white truncate">{template.name}</h4>
                        {template.isSystem && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-neutral-700 text-neutral-400 rounded">System</span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-400 truncate mt-0.5">{template.subject}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span>Used {template.usageCount} times</span>
                        {template.openRate !== undefined && (
                          <span>{template.openRate}% open rate</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditTemplate(template)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      {!template.isSystem && (
                        <button
                          onClick={() => onDeleteTemplate(template.id)}
                          className="p-2 rounded-lg text-neutral-400 hover:text-status-error-text hover:bg-status-error-bg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'sequences' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Email Sequences</h3>
            <button
              onClick={onCreateSequence}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-500 font-medium transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              New Sequence
            </button>
          </div>

          <div className="space-y-3">
            {sequences.map((sequence) => (
              <div
                key={sequence.id}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  sequence.enabled
                    ? 'border-neutral-700 bg-neutral-800/50'
                    : 'border-neutral-800 bg-neutral-900/50 opacity-60'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <ArrowPathIcon className="w-6 h-6 text-purple-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{sequence.name}</h4>
                      <span className={cn(
                        'px-2 py-0.5 text-[10px] font-medium uppercase rounded-full',
                        sequence.enabled
                          ? 'bg-status-success-bg text-status-success-text'
                          : 'bg-neutral-700 text-neutral-400'
                      )}>
                        {sequence.enabled ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    {sequence.description && (
                      <p className="text-sm text-neutral-400 mt-0.5">{sequence.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                      <span>{sequence.steps.length} steps</span>
                      <span>{sequence.enrolledCount} enrolled</span>
                      <span>{sequence.completedCount} completed</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleSequence(sequence.id, !sequence.enabled)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        sequence.enabled
                          ? 'text-status-success-text hover:bg-status-success-bg'
                          : 'text-neutral-400 hover:bg-neutral-700'
                      )}
                    >
                      {sequence.enabled ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => onEditSequence(sequence)}
                      className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'scheduler' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Meeting Scheduler</h3>
            <button
              onClick={onCreateScheduler}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-500 font-medium transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              New Meeting Type
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {schedulerConfigs.map((config) => (
              <div
                key={config.id}
                className={cn(
                  'p-4 rounded-xl border transition-all cursor-pointer hover:border-accent-500',
                  config.enabled
                    ? 'border-neutral-700 bg-neutral-800/50'
                    : 'border-neutral-800 bg-neutral-900/50 opacity-60'
                )}
                onClick={() => onEditScheduler(config)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <CalendarDaysIcon className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{config.name}</h4>
                    <p className="text-sm text-neutral-400 mt-0.5">{config.duration} minutes</p>
                    <div className="flex items-center gap-2 mt-2">
                      {config.availableDays.map((d) => (
                        <span key={d} className="text-xs text-neutral-500">
                          {dayNames[d]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 text-[10px] font-medium uppercase rounded-full',
                    config.enabled
                      ? 'bg-status-success-bg text-status-success-text'
                      : 'bg-neutral-700 text-neutral-400'
                  )}>
                    {config.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
