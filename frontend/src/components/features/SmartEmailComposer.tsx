'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '../ui';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  DocumentTextIcon,
  UserIcon,
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  BookmarkIcon,
  FolderIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  TagIcon,
  PhoneIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../ui/utils';

/**
 * SmartEmailComposer - AI-Assisted Email Drafting
 * 
 * The email experience advisors deserve:
 * - AI-powered drafting from context
 * - Template library with smart merge fields
 * - Bulk personalization at scale
 * - Tone adjustment and suggestions
 * - Response rate predictions
 */

// ============================================
// Types
// ============================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  tags: string[];
  mergeFields: string[];
  usageCount: number;
  responseRate?: number;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface MergeField {
  key: string;
  label: string;
  category: string;
  example: string;
}

export interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  householdId?: string;
  householdName?: string;
}

export interface DraftEmail {
  id: string;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  body: string;
  templateId?: string;
  scheduledAt?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
}

export type ToneType = 'professional' | 'friendly' | 'formal' | 'casual' | 'empathetic';

export interface AIEmailContext {
  clientName?: string;
  clientAUM?: number;
  lastMeeting?: string;
  nextMeeting?: string;
  recentActivity?: string;
  purpose?: string;
}

// ============================================
// Constants
// ============================================

const MERGE_FIELDS: MergeField[] = [
  // Client fields
  { key: '{{client.firstName}}', label: 'First Name', category: 'Client', example: 'John' },
  { key: '{{client.lastName}}', label: 'Last Name', category: 'Client', example: 'Smith' },
  { key: '{{client.fullName}}', label: 'Full Name', category: 'Client', example: 'John Smith' },
  { key: '{{client.email}}', label: 'Email', category: 'Client', example: 'john@example.com' },
  { key: '{{client.phone}}', label: 'Phone', category: 'Client', example: '(555) 123-4567' },
  
  // Household fields
  { key: '{{household.name}}', label: 'Household Name', category: 'Household', example: 'Smith Family' },
  { key: '{{household.aum}}', label: 'AUM', category: 'Household', example: '$2,500,000' },
  { key: '{{household.advisor}}', label: 'Primary Advisor', category: 'Household', example: 'Jane Wilson' },
  
  // Meeting fields
  { key: '{{meeting.date}}', label: 'Meeting Date', category: 'Meeting', example: 'January 15, 2025' },
  { key: '{{meeting.time}}', label: 'Meeting Time', category: 'Meeting', example: '2:00 PM' },
  { key: '{{meeting.location}}', label: 'Meeting Location', category: 'Meeting', example: 'Conference Room A' },
  { key: '{{meeting.agenda}}', label: 'Meeting Agenda', category: 'Meeting', example: 'Quarterly Review' },
  
  // Advisor fields
  { key: '{{advisor.name}}', label: 'Advisor Name', category: 'Advisor', example: 'Jane Wilson, CFP' },
  { key: '{{advisor.email}}', label: 'Advisor Email', category: 'Advisor', example: 'jane@firm.com' },
  { key: '{{advisor.phone}}', label: 'Advisor Phone', category: 'Advisor', example: '(555) 987-6543' },
  { key: '{{advisor.title}}', label: 'Advisor Title', category: 'Advisor', example: 'Senior Financial Advisor' },
  
  // Firm fields
  { key: '{{firm.name}}', label: 'Firm Name', category: 'Firm', example: 'Wealth Management Co.' },
  { key: '{{firm.address}}', label: 'Firm Address', category: 'Firm', example: '123 Main St, NYC' },
  { key: '{{firm.website}}', label: 'Website', category: 'Firm', example: 'www.wealthmgmt.com' },
  
  // Date fields
  { key: '{{date.today}}', label: 'Today\'s Date', category: 'Date', example: 'January 10, 2025' },
  { key: '{{date.year}}', label: 'Current Year', category: 'Date', example: '2025' },
  { key: '{{date.quarter}}', label: 'Current Quarter', category: 'Date', example: 'Q1' },
];

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'New Client Welcome',
    subject: 'Welcome to {{firm.name}}, {{client.firstName}}!',
    body: `Dear {{client.firstName}},

Welcome to {{firm.name}}! We're thrilled to have you and the {{household.name}} as part of our family.

Over the coming weeks, we'll be working together to understand your financial goals and create a personalized plan to help you achieve them.

Here's what you can expect next:
• Our team will reach out to schedule your kickoff meeting
• You'll receive access to our client portal
• We'll begin gathering the information needed to build your financial plan

If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
{{advisor.name}}
{{advisor.title}}
{{firm.name}}`,
    category: 'Onboarding',
    tags: ['new client', 'welcome', 'onboarding'],
    mergeFields: ['client.firstName', 'firm.name', 'household.name', 'advisor.name', 'advisor.title'],
    usageCount: 156,
    responseRate: 82,
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01',
    isDefault: true,
  },
  {
    id: 'meeting-confirmation',
    name: 'Meeting Confirmation',
    subject: 'Meeting Confirmed: {{meeting.agenda}} on {{meeting.date}}',
    body: `Dear {{client.firstName}},

This email confirms our upcoming meeting:

Date: {{meeting.date}}
Time: {{meeting.time}}
Location: {{meeting.location}}
Agenda: {{meeting.agenda}}

Please let me know if you need to reschedule or if there's anything specific you'd like to discuss.

Looking forward to meeting with you!

Best,
{{advisor.name}}`,
    category: 'Meetings',
    tags: ['meeting', 'confirmation', 'calendar'],
    mergeFields: ['client.firstName', 'meeting.date', 'meeting.time', 'meeting.location', 'meeting.agenda', 'advisor.name'],
    usageCount: 342,
    responseRate: 91,
    createdAt: '2024-02-10',
    updatedAt: '2024-11-15',
    isDefault: true,
  },
  {
    id: 'quarterly-review',
    name: 'Quarterly Review Invitation',
    subject: '{{client.firstName}}, Let\'s Review Your {{date.quarter}} Portfolio',
    body: `Dear {{client.firstName}},

As we wrap up {{date.quarter}} {{date.year}}, I wanted to reach out to schedule our quarterly review meeting.

During this meeting, we'll discuss:
• Your portfolio performance and any adjustments needed
• Progress toward your financial goals
• Market outlook and opportunities
• Any changes in your life or financial situation

Please use my calendar link to schedule a time that works for you, or reply to this email with your availability.

Best regards,
{{advisor.name}}
{{advisor.title}}`,
    category: 'Reviews',
    tags: ['quarterly', 'review', 'portfolio'],
    mergeFields: ['client.firstName', 'date.quarter', 'date.year', 'advisor.name', 'advisor.title'],
    usageCount: 89,
    responseRate: 76,
    createdAt: '2024-03-20',
    updatedAt: '2024-12-20',
    isDefault: true,
  },
  {
    id: 'birthday',
    name: 'Birthday Wishes',
    subject: 'Happy Birthday, {{client.firstName}}!',
    body: `Dear {{client.firstName}},

On behalf of everyone at {{firm.name}}, I wanted to wish you a very happy birthday!

I hope your special day is filled with joy, laughter, and wonderful moments with those you love.

Warmest wishes,
{{advisor.name}}`,
    category: 'Personal',
    tags: ['birthday', 'personal', 'celebration'],
    mergeFields: ['client.firstName', 'firm.name', 'advisor.name'],
    usageCount: 234,
    responseRate: 68,
    createdAt: '2024-01-05',
    updatedAt: '2024-06-15',
    isDefault: true,
  },
  {
    id: 'check-in',
    name: 'Client Check-in',
    subject: 'Checking In - How Are Things Going, {{client.firstName}}?',
    body: `Dear {{client.firstName}},

I hope this message finds you well! It's been a little while since we last connected, and I wanted to check in.

Is there anything on your mind regarding your finances or investments? Any life changes or upcoming events we should discuss?

I'm here to help whenever you need. Feel free to reply to this email or give me a call.

Best,
{{advisor.name}}
{{advisor.phone}}`,
    category: 'Engagement',
    tags: ['check-in', 'engagement', 'follow-up'],
    mergeFields: ['client.firstName', 'advisor.name', 'advisor.phone'],
    usageCount: 178,
    responseRate: 54,
    createdAt: '2024-04-12',
    updatedAt: '2024-10-08',
    isDefault: true,
  },
  {
    id: 'document-request',
    name: 'Document Request',
    subject: 'Document Request - {{client.lastName}} Account',
    body: `Dear {{client.firstName}},

As part of our ongoing service and compliance requirements, we need to update some documents on file.

Could you please provide the following at your earliest convenience:
• [List specific documents needed]

You can:
• Reply to this email with attachments
• Upload through our client portal
• Drop them off at our office

Please let me know if you have any questions.

Thank you,
{{advisor.name}}`,
    category: 'Operations',
    tags: ['documents', 'compliance', 'request'],
    mergeFields: ['client.firstName', 'client.lastName', 'advisor.name'],
    usageCount: 67,
    responseRate: 71,
    createdAt: '2024-05-22',
    updatedAt: '2024-09-30',
    isDefault: true,
  },
];

const TONE_CONFIG: Record<ToneType, { label: string; description: string; color: string }> = {
  professional: { label: 'Professional', description: 'Clear and business-like', color: 'bg-blue-500' },
  friendly: { label: 'Friendly', description: 'Warm and approachable', color: 'bg-green-500' },
  formal: { label: 'Formal', description: 'Traditional and respectful', color: 'bg-slate-500' },
  casual: { label: 'Casual', description: 'Relaxed and conversational', color: 'bg-amber-500' },
  empathetic: { label: 'Empathetic', description: 'Understanding and supportive', color: 'bg-purple-500' },
};

const AI_PROMPTS = [
  { icon: <PhoneIcon className="w-4 h-4" />, label: 'Follow-up call', prompt: 'Write a follow-up email after a phone call with' },
  { icon: <CalendarDaysIcon className="w-4 h-4" />, label: 'Schedule meeting', prompt: 'Write an email to schedule a meeting with' },
  { icon: <ChartBarIcon className="w-4 h-4" />, label: 'Portfolio update', prompt: 'Write an email about recent portfolio performance for' },
  { icon: <TrophyIcon className="w-4 h-4" />, label: 'Milestone', prompt: 'Write a congratulations email for achieving a milestone to' },
  { icon: <DocumentTextIcon className="w-4 h-4" />, label: 'Document reminder', prompt: 'Write a reminder about pending documents for' },
  { icon: <LightBulbIcon className="w-4 h-4" />, label: 'Market insights', prompt: 'Write an email sharing market insights for' },
];

// ============================================
// Helper Functions
// ============================================

function extractMergeFields(text: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const fields: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    fields.push(match[1]);
  }
  return [...new Set(fields)];
}

function replaceMergeFields(text: string, data: Record<string, string>): string {
  let result = text;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  return result;
}

// ============================================
// Components
// ============================================

interface MergeFieldPickerProps {
  onSelect: (field: string) => void;
  onClose: () => void;
}

function MergeFieldPicker({ onSelect, onClose }: MergeFieldPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(MERGE_FIELDS.map(f => f.category))];
  
  const filteredFields = MERGE_FIELDS.filter(f => {
    const matchesSearch = !search || 
      f.label.toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 mt-2 w-80 bg-surface border border-border rounded-lg shadow-xl z-50"
    >
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-content-primary text-sm">Insert Merge Field</h4>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-secondary">
            <XMarkIcon className="w-4 h-4 text-content-tertiary" />
          </button>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields..."
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded border border-border bg-surface text-content-primary"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="p-2 border-b border-border flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-2 py-1 rounded text-xs transition-colors',
            !selectedCategory ? 'bg-accent-primary text-white' : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary'
          )}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-2 py-1 rounded text-xs transition-colors',
              selectedCategory === cat ? 'bg-accent-primary text-white' : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Fields list */}
      <div className="max-h-64 overflow-y-auto p-2">
        {filteredFields.map(field => (
          <button
            key={field.key}
            onClick={() => {
              onSelect(field.key);
              onClose();
            }}
            className="w-full p-2 rounded text-left hover:bg-surface-secondary transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-content-primary">{field.label}</span>
              <Badge variant="default" size="sm">{field.category}</Badge>
            </div>
            <div className="flex items-center justify-between mt-1">
              <code className="text-xs text-accent-primary">{field.key}</code>
              <span className="text-xs text-content-tertiary">e.g., {field.example}</span>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

interface ToneSelectorProps {
  selected: ToneType;
  onSelect: (tone: ToneType) => void;
}

function ToneSelector({ selected, onSelect }: ToneSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {Object.entries(TONE_CONFIG).map(([key, config]) => (
        <button
          key={key}
          onClick={() => onSelect(key as ToneType)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            selected === key
              ? `${config.color} text-white`
              : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary'
          )}
          title={config.description}
        >
          {config.label}
        </button>
      ))}
    </div>
  );
}

interface TemplateCardProps {
  template: EmailTemplate;
  onUse: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function TemplateCard({ template, onUse, onEdit, onDelete }: TemplateCardProps) {
  return (
    <Card className="p-4 hover:border-accent-primary/50 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-content-primary">{template.name}</h4>
            {template.isDefault && (
              <Badge variant="info" size="sm">Default</Badge>
            )}
          </div>
          <p className="text-sm text-content-secondary mt-1 line-clamp-1">{template.subject}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-content-tertiary">Used {template.usageCount}x</span>
            {template.responseRate && (
              <span className="text-xs text-green-500">{template.responseRate}% response rate</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onUse(); }}
            className="p-1.5 rounded hover:bg-accent-primary/10 text-accent-primary"
            title="Use template"
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
          </button>
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded hover:bg-surface-secondary text-content-tertiary"
              title="Edit template"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
          {onDelete && !template.isDefault && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded hover:bg-red-500/10 text-content-tertiary hover:text-red-500"
              title="Delete template"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-3">
        {template.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 rounded-full bg-surface-secondary text-xs text-content-tertiary">
            {tag}
          </span>
        ))}
      </div>
    </Card>
  );
}

interface AIAssistantPanelProps {
  onGenerateDraft: (prompt: string, tone: ToneType) => void;
  isGenerating: boolean;
}

function AIAssistantPanel({ onGenerateDraft, isGenerating }: AIAssistantPanelProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState<ToneType>('professional');

  return (
    <Card className="p-4 border-amber-500/30 bg-amber-500/5">
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="w-5 h-5 text-amber-500" />
        <h4 className="font-medium text-content-primary">AI Assistant</h4>
      </div>

      <p className="text-sm text-content-secondary mb-4">
        Describe what you want to write, or use a quick prompt:
      </p>

      <div className="space-y-4">
        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2">
          {AI_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setCustomPrompt(prompt.prompt)}
              className="px-3 py-1.5 rounded-full bg-surface border border-border text-sm text-content-secondary hover:bg-surface-secondary hover:text-content-primary transition-colors"
            >
              <span className="mr-1">{prompt.icon}</span>
              {prompt.label}
            </button>
          ))}
        </div>

        {/* Custom prompt input */}
        <div>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="E.g., Write a follow-up email to John Smith about the quarterly review we discussed..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-content-primary placeholder:text-content-tertiary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary resize-none"
          />
        </div>

        {/* Tone selector */}
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-2">Tone</label>
          <ToneSelector selected={selectedTone} onSelect={setSelectedTone} />
        </div>

        {/* Generate button */}
        <Button
          onClick={() => onGenerateDraft(customPrompt, selectedTone)}
          disabled={!customPrompt.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate Draft
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export interface SmartEmailComposerProps {
  recipients?: EmailRecipient[];
  context?: AIEmailContext;
  templates?: EmailTemplate[];
  onSend?: (email: DraftEmail) => void;
  onSaveDraft?: (email: DraftEmail) => void;
  onSaveTemplate?: (template: EmailTemplate) => void;
  className?: string;
}

export function SmartEmailComposer({
  recipients: initialRecipients = [],
  context,
  templates: customTemplates = [],
  onSend,
  onSaveDraft,
  onSaveTemplate,
  className,
}: SmartEmailComposerProps) {
  const [view, setView] = useState<'compose' | 'templates' | 'preview'>('compose');
  const [templates, setTemplates] = useState<EmailTemplate[]>([...DEFAULT_TEMPLATES, ...customTemplates]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  
  // Compose state
  const [recipients, setRecipients] = useState<EmailRecipient[]>(initialRecipients);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTone, setSelectedTone] = useState<ToneType>('professional');
  const [showMergeFields, setShowMergeFields] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<'subject' | 'body'>('body');
  
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Sample merge data for preview
  const sampleMergeData: Record<string, string> = {
    'client.firstName': context?.clientName?.split(' ')[0] || 'John',
    'client.lastName': context?.clientName?.split(' ')[1] || 'Smith',
    'client.fullName': context?.clientName || 'John Smith',
    'client.email': 'john.smith@email.com',
    'household.name': 'Smith Family',
    'household.aum': context?.clientAUM ? `$${(context.clientAUM / 1000000).toFixed(1)}M` : '$2.5M',
    'advisor.name': 'Jane Wilson, CFP',
    'advisor.title': 'Senior Financial Advisor',
    'advisor.email': 'jane@firm.com',
    'advisor.phone': '(555) 987-6543',
    'firm.name': 'Wealth Management Co.',
    'meeting.date': context?.nextMeeting || 'January 15, 2025',
    'meeting.time': '2:00 PM',
    'meeting.location': 'Conference Room A',
    'meeting.agenda': 'Quarterly Review',
    'date.today': new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    'date.year': new Date().getFullYear().toString(),
    'date.quarter': `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
  };

  const handleUseTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setBody(template.body);
    setSelectedTemplate(template);
    setView('compose');
  };

  const handleInsertMergeField = (field: string) => {
    if (cursorPosition === 'subject' && subjectRef.current) {
      const start = subjectRef.current.selectionStart || subject.length;
      const newSubject = subject.slice(0, start) + field + subject.slice(start);
      setSubject(newSubject);
    } else if (bodyRef.current) {
      const start = bodyRef.current.selectionStart || body.length;
      const newBody = body.slice(0, start) + field + body.slice(start);
      setBody(newBody);
    }
  };

  const handleGenerateAIDraft = async (prompt: string, tone: ToneType) => {
    setIsGenerating(true);
    
    // Simulate AI generation (in production, this would call an AI service)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI-generated content based on tone
    const toneIntros: Record<ToneType, string> = {
      professional: 'Dear {{client.firstName}},',
      friendly: 'Hi {{client.firstName}}!',
      formal: 'Dear Mr./Ms. {{client.lastName}},',
      casual: 'Hey {{client.firstName}},',
      empathetic: 'Dear {{client.firstName}},',
    };

    const toneClosings: Record<ToneType, string> = {
      professional: 'Best regards,',
      friendly: 'Cheers,',
      formal: 'Respectfully yours,',
      casual: 'Talk soon,',
      empathetic: 'With warm regards,',
    };

    // Generate based on prompt keywords
    if (prompt.toLowerCase().includes('follow-up') || prompt.toLowerCase().includes('follow up')) {
      setSubject('Following Up on Our Recent Conversation');
      setBody(`${toneIntros[tone]}

I hope this email finds you well. I wanted to follow up on our recent conversation and see if you had any questions or thoughts to share.

It was great speaking with you, and I'm here to help with anything you need.

${toneClosings[tone]}
{{advisor.name}}`);
    } else if (prompt.toLowerCase().includes('meeting') || prompt.toLowerCase().includes('schedule')) {
      setSubject("Let's Schedule Some Time to Connect");
      setBody(`${toneIntros[tone]}

I'd love to schedule some time to connect with you. There are a few items I'd like to discuss, and I think a brief meeting would be valuable.

Do you have any availability in the next week or two? Please let me know what works best for your schedule.

${toneClosings[tone]}
{{advisor.name}}`);
    } else if (prompt.toLowerCase().includes('portfolio') || prompt.toLowerCase().includes('performance')) {
      setSubject('Your Portfolio Update for {{date.quarter}} {{date.year}}');
      setBody(`${toneIntros[tone]}

I wanted to provide you with a quick update on your portfolio performance.

Overall, the {{household.name}} portfolio has shown strong performance this quarter. I'd be happy to schedule a call to walk through the details and discuss any adjustments we should consider.

Please let me know if you have any questions or would like to schedule a review.

${toneClosings[tone]}
{{advisor.name}}`);
    } else {
      // Generic response
      setSubject('A Note from Your Advisor');
      setBody(`${toneIntros[tone]}

Thank you for being a valued client of {{firm.name}}.

${prompt}

Please don't hesitate to reach out if you have any questions or need assistance with anything.

${toneClosings[tone]}
{{advisor.name}}`);
    }

    setSelectedTone(tone);
    setIsGenerating(false);
  };

  const handleSend = () => {
    const email: DraftEmail = {
      id: `email-${Date.now()}`,
      to: recipients,
      subject: replaceMergeFields(subject, sampleMergeData),
      body: replaceMergeFields(body, sampleMergeData),
      templateId: selectedTemplate?.id,
      status: 'sent',
    };
    onSend?.(email);
  };

  const handleSaveDraft = () => {
    const email: DraftEmail = {
      id: `email-${Date.now()}`,
      to: recipients,
      subject,
      body,
      templateId: selectedTemplate?.id,
      status: 'draft',
    };
    onSaveDraft?.(email);
  };

  const handleSaveAsTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: `template-${Date.now()}`,
      name: subject.slice(0, 50) || 'New Template',
      subject,
      body,
      category: 'Custom',
      tags: ['custom'],
      mergeFields: extractMergeFields(subject + body),
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemplates([...templates, newTemplate]);
    onSaveTemplate?.(newTemplate);
  };

  const mergeFieldsInContent = extractMergeFields(subject + body);
  const previewSubject = replaceMergeFields(subject, sampleMergeData);
  const previewBody = replaceMergeFields(body, sampleMergeData);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <EnvelopeIcon className="w-6 h-6 text-accent-primary" />
            <h2 className="text-xl font-semibold text-content-primary">Smart Email Composer</h2>
          </div>
          <p className="text-sm text-content-secondary mt-1">
            AI-powered email drafting with smart merge fields
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['compose', 'templates', 'preview'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                view === v
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Compose View */}
      {view === 'compose' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Main editor */}
          <div className="col-span-2 space-y-4">
            {/* Recipients */}
            <Card className="p-4">
              <label className="block text-sm font-medium text-content-secondary mb-2">To</label>
              <div className="flex flex-wrap gap-2">
                {recipients.map(r => (
                  <span
                    key={r.id}
                    className="px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm flex items-center gap-1"
                  >
                    {r.name}
                    <button onClick={() => setRecipients(recipients.filter(x => x.id !== r.id))}>
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button className="px-3 py-1 rounded-full border border-dashed border-border text-sm text-content-tertiary hover:border-accent-primary hover:text-accent-primary transition-colors">
                  <PlusIcon className="w-4 h-4 inline mr-1" />
                  Add recipient
                </button>
              </div>
            </Card>

            {/* Subject */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-content-secondary">Subject</label>
                <div className="relative">
                  <button
                    onClick={() => { setCursorPosition('subject'); setShowMergeFields(!showMergeFields); }}
                    className="text-xs text-accent-primary hover:text-accent-primary-hover flex items-center gap-1"
                  >
                    <TagIcon className="w-3 h-3" />
                    Insert field
                  </button>
                </div>
              </div>
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setCursorPosition('subject')}
                placeholder="Enter email subject..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-content-primary placeholder:text-content-tertiary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
              />
            </Card>

            {/* Body */}
            <Card className="p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-content-secondary">Message</label>
                <div className="flex items-center gap-2">
                  <ToneSelector selected={selectedTone} onSelect={setSelectedTone} />
                  <button
                    onClick={() => { setCursorPosition('body'); setShowMergeFields(!showMergeFields); }}
                    className="text-xs text-accent-primary hover:text-accent-primary-hover flex items-center gap-1 ml-2"
                  >
                    <TagIcon className="w-3 h-3" />
                    Insert field
                  </button>
                </div>
              </div>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onFocus={() => setCursorPosition('body')}
                placeholder="Start typing your message..."
                rows={16}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-content-primary placeholder:text-content-tertiary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary resize-none font-mono text-sm"
              />

              <AnimatePresence>
                {showMergeFields && (
                  <MergeFieldPicker
                    onSelect={handleInsertMergeField}
                    onClose={() => setShowMergeFields(false)}
                  />
                )}
              </AnimatePresence>

              {/* Merge fields in use */}
              {mergeFieldsInContent.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-content-tertiary">Merge fields in use: </span>
                  {mergeFieldsInContent.map((f, i) => (
                    <span key={f}>
                      <code className="text-xs text-accent-primary">{`{{${f}}}`}</code>
                      {i < mergeFieldsInContent.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={handleSaveDraft}>
                  <BookmarkIcon className="w-4 h-4 mr-1" />
                  Save Draft
                </Button>
                <Button variant="secondary" onClick={handleSaveAsTemplate}>
                  <DocumentTextIcon className="w-4 h-4 mr-1" />
                  Save as Template
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setView('preview')}>
                  <EyeIcon className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button onClick={handleSend} disabled={!subject || !body || recipients.length === 0}>
                  <PaperAirplaneIcon className="w-4 h-4 mr-1" />
                  Send Email
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar - AI Assistant */}
          <div className="space-y-4">
            <AIAssistantPanel
              onGenerateDraft={handleGenerateAIDraft}
              isGenerating={isGenerating}
            />

            {/* Quick templates */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <DocumentTextIcon className="w-4 h-4 text-content-tertiary" />
                <h4 className="font-medium text-content-primary text-sm">Quick Templates</h4>
              </div>
              <div className="space-y-2">
                {templates.slice(0, 4).map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleUseTemplate(template)}
                    className="w-full p-2 rounded text-left hover:bg-surface-secondary transition-colors"
                  >
                    <p className="font-medium text-sm text-content-primary truncate">{template.name}</p>
                    <p className="text-xs text-content-tertiary mt-0.5">{template.category}</p>
                  </button>
                ))}
                <button
                  onClick={() => setView('templates')}
                  className="w-full p-2 text-sm text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                >
                  View all templates →
                </button>
              </div>
            </Card>

            {/* Tips */}
            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-start gap-2">
                <LightBulbIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-content-primary text-sm">Pro Tip</h4>
                  <p className="text-xs text-content-secondary mt-1">
                    Use merge fields like <code className="text-blue-500">{`{{client.firstName}}`}</code> to personalize emails at scale. Fields are automatically replaced with actual values when sent.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Templates View */}
      {view === 'templates' && (
        <div className="space-y-6">
          {/* Category filter */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-content-secondary">Filter:</span>
            {['All', 'Onboarding', 'Meetings', 'Reviews', 'Personal', 'Engagement', 'Operations'].map(cat => (
              <button
                key={cat}
                className="px-3 py-1.5 rounded-full text-sm bg-surface-secondary text-content-secondary hover:bg-surface-tertiary transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Templates grid */}
          <div className="grid grid-cols-2 gap-4">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handleUseTemplate(template)}
                onEdit={() => {}}
                onDelete={template.isDefault ? undefined : () => setTemplates(templates.filter(t => t.id !== template.id))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preview View */}
      {view === 'preview' && (
        <Card className="max-w-2xl mx-auto overflow-hidden">
          <div className="bg-surface-secondary p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-tertiary">Preview</span>
              <Badge variant="info" size="sm">Merge fields replaced</Badge>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-content-secondary mb-2">
                <span className="font-medium">To:</span>
                {recipients.map(r => r.name).join(', ') || 'No recipients'}
              </div>
              <h3 className="text-xl font-semibold text-content-primary">{previewSubject || 'No subject'}</h3>
            </div>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-content-primary bg-transparent p-0 m-0">
                {previewBody || 'No message content'}
              </pre>
            </div>
          </div>
          <div className="bg-surface-secondary p-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setView('compose')}>
              ← Back to Edit
            </Button>
            <Button onClick={handleSend} disabled={!subject || !body || recipients.length === 0}>
              <PaperAirplaneIcon className="w-4 h-4 mr-1" />
              Send Email
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export { DEFAULT_TEMPLATES as EMAIL_TEMPLATES, MERGE_FIELDS };
