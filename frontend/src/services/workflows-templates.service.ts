import { apiClient } from './api';

export type WorkflowTriggerType = 
  | 'manual'
  | 'client_added'
  | 'kyc_expiring'
  | 'document_signed'
  | 'meeting_scheduled'
  | 'task_completed'
  | 'account_opened'
  | 'aum_threshold'
  | 'birthday_approaching'
  | 'review_due'
  | 'compliance_deadline'
  | 'schedule';

export type WorkflowActionType =
  | 'create_task'
  | 'send_email'
  | 'send_notification'
  | 'schedule_meeting'
  | 'update_field'
  | 'add_tag'
  | 'remove_tag'
  | 'assign_to_user'
  | 'create_document'
  | 'log_activity'
  | 'wait'
  | 'conditional_branch';

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
}

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  label: string;
  config: Record<string, unknown>;
  conditions?: WorkflowCondition[];
  delay?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  nextActionId?: string;
  branches?: {
    condition: WorkflowCondition[];
    nextActionId: string;
  }[];
}

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config: Record<string, unknown>;
  conditions?: WorkflowCondition[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  status: WorkflowStatus;
  isSystem: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  triggeredBy: string;
  triggeredAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentActionId?: string;
  context: Record<string, unknown>;
  logs: {
    actionId: string;
    actionType: WorkflowActionType;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: string;
    completedAt?: string;
    error?: string;
    output?: Record<string, unknown>;
  }[];
}

// Predefined workflow templates
const systemTemplates: WorkflowTemplate[] = [
  {
    id: 'wf-onboarding',
    name: 'New Client Onboarding',
    description: 'Automated workflow for onboarding new clients with document collection, KYC verification, and welcome tasks',
    category: 'Onboarding',
    trigger: { type: 'client_added', config: {} },
    actions: [
      {
        id: 'a1',
        type: 'create_task',
        label: 'Create welcome task',
        config: { title: 'Welcome call with {client.name}', assignTo: 'primary_advisor', dueIn: { value: 1, unit: 'days' } },
      },
      {
        id: 'a2',
        type: 'send_email',
        label: 'Send welcome email',
        config: { template: 'welcome_email', to: '{client.email}' },
      },
      {
        id: 'a3',
        type: 'create_document',
        label: 'Generate IPS document',
        config: { template: 'ips_questionnaire', assignTo: '{client.id}' },
        delay: { value: 1, unit: 'days' },
      },
    ],
    status: 'active',
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    runCount: 48,
    successCount: 45,
    failureCount: 3,
  },
  {
    id: 'wf-kyc-renewal',
    name: 'KYC Renewal Reminder',
    description: 'Automated reminders and tasks for KYC documentation renewal before expiration',
    category: 'Compliance',
    trigger: { type: 'kyc_expiring', config: { daysBefore: 30 } },
    actions: [
      {
        id: 'a1',
        type: 'create_task',
        label: 'Create KYC review task',
        config: { title: 'Review KYC for {client.name}', assignTo: 'compliance_officer', priority: 'high', dueIn: { value: 14, unit: 'days' } },
      },
      {
        id: 'a2',
        type: 'send_notification',
        label: 'Notify advisor',
        config: { to: 'primary_advisor', message: 'KYC expiring for {client.name} in 30 days' },
      },
      {
        id: 'a3',
        type: 'send_email',
        label: 'Send renewal request to client',
        config: { template: 'kyc_renewal_request', to: '{client.email}' },
        delay: { value: 7, unit: 'days' },
        conditions: [{ field: 'task.status', operator: 'not_equals', value: 'completed' }],
      },
    ],
    status: 'active',
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    runCount: 156,
    successCount: 152,
    failureCount: 4,
  },
  {
    id: 'wf-quarterly-review',
    name: 'Quarterly Review Scheduling',
    description: 'Automatically schedule and prepare for quarterly client reviews',
    category: 'Client Service',
    trigger: { type: 'schedule', config: { cron: '0 9 1 */3 *' } }, // 1st of every quarter at 9am
    actions: [
      {
        id: 'a1',
        type: 'create_task',
        label: 'Prepare review materials',
        config: { title: 'Prepare Q{quarter} review for {client.name}', assignTo: 'primary_advisor', dueIn: { value: 7, unit: 'days' } },
      },
      {
        id: 'a2',
        type: 'send_email',
        label: 'Send scheduling email',
        config: { template: 'quarterly_review_scheduling', to: '{client.email}' },
      },
    ],
    status: 'active',
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    runCount: 234,
    successCount: 228,
    failureCount: 6,
  },
  {
    id: 'wf-birthday',
    name: 'Birthday Greeting',
    description: 'Send personalized birthday greetings to clients',
    category: 'Client Service',
    trigger: { type: 'birthday_approaching', config: { daysBefore: 0 } },
    actions: [
      {
        id: 'a1',
        type: 'send_email',
        label: 'Send birthday email',
        config: { template: 'birthday_greeting', to: '{client.email}' },
      },
      {
        id: 'a2',
        type: 'create_task',
        label: 'Personal call reminder',
        config: { title: 'Birthday call to {client.name}', assignTo: 'primary_advisor', dueIn: { value: 0, unit: 'days' } },
        conditions: [{ field: 'client.tier', operator: 'equals', value: 'platinum' }],
      },
    ],
    status: 'active',
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    runCount: 89,
    successCount: 89,
    failureCount: 0,
  },
  {
    id: 'wf-large-deposit',
    name: 'Large Deposit Alert',
    description: 'Notify advisors when significant deposits are detected for proactive outreach',
    category: 'Operations',
    trigger: { type: 'aum_threshold', config: { changeAmount: 100000, direction: 'increase' } },
    actions: [
      {
        id: 'a1',
        type: 'send_notification',
        label: 'Alert advisor',
        config: { to: 'primary_advisor', message: 'Large deposit detected: ${amount} for {client.name}', priority: 'high' },
      },
      {
        id: 'a2',
        type: 'create_task',
        label: 'Follow-up task',
        config: { title: 'Discuss investment of new funds with {client.name}', assignTo: 'primary_advisor', dueIn: { value: 2, unit: 'days' } },
      },
      {
        id: 'a3',
        type: 'log_activity',
        label: 'Log deposit activity',
        config: { type: 'deposit', notes: 'Large deposit of ${amount} detected and advisor notified' },
      },
    ],
    status: 'active',
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    runCount: 23,
    successCount: 23,
    failureCount: 0,
  },
];

const mockExecutions: WorkflowExecution[] = [
  {
    id: 'exec-001',
    workflowId: 'wf-onboarding',
    workflowName: 'New Client Onboarding',
    triggeredBy: 'Sarah Chen added as new client',
    triggeredAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:32:00Z',
    status: 'completed',
    context: { clientId: 'c-001', clientName: 'Sarah Chen' },
    logs: [
      { actionId: 'a1', actionType: 'create_task', status: 'completed', startedAt: '2024-01-15T10:30:01Z', completedAt: '2024-01-15T10:30:02Z' },
      { actionId: 'a2', actionType: 'send_email', status: 'completed', startedAt: '2024-01-15T10:30:03Z', completedAt: '2024-01-15T10:30:05Z' },
      { actionId: 'a3', actionType: 'create_document', status: 'completed', startedAt: '2024-01-16T10:30:00Z', completedAt: '2024-01-16T10:30:02Z' },
    ],
  },
  {
    id: 'exec-002',
    workflowId: 'wf-kyc-renewal',
    workflowName: 'KYC Renewal Reminder',
    triggeredBy: 'KYC expiring for Michael Roberts',
    triggeredAt: '2024-01-15T09:00:00Z',
    status: 'running',
    currentActionId: 'a3',
    context: { clientId: 'c-002', clientName: 'Michael Roberts' },
    logs: [
      { actionId: 'a1', actionType: 'create_task', status: 'completed', startedAt: '2024-01-15T09:00:01Z', completedAt: '2024-01-15T09:00:02Z' },
      { actionId: 'a2', actionType: 'send_notification', status: 'completed', startedAt: '2024-01-15T09:00:03Z', completedAt: '2024-01-15T09:00:04Z' },
      { actionId: 'a3', actionType: 'send_email', status: 'pending' },
    ],
  },
];

class WorkflowsService {
  async getTemplates(filter?: { category?: string; status?: WorkflowStatus }): Promise<WorkflowTemplate[]> {
    // Simulate API call
    await new Promise(r => setTimeout(r, 300));
    
    let templates = [...systemTemplates];
    
    if (filter?.category) {
      templates = templates.filter(t => t.category === filter.category);
    }
    if (filter?.status) {
      templates = templates.filter(t => t.status === filter.status);
    }
    
    return templates;
  }

  async getTemplate(id: string): Promise<WorkflowTemplate | null> {
    await new Promise(r => setTimeout(r, 200));
    return systemTemplates.find(t => t.id === id) || null;
  }

  async createTemplate(data: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    await new Promise(r => setTimeout(r, 300));
    const template: WorkflowTemplate = {
      id: `wf-${Date.now()}`,
      name: data.name || 'New Workflow',
      description: data.description || '',
      category: data.category || 'Custom',
      trigger: data.trigger || { type: 'manual', config: {} },
      actions: data.actions || [],
      status: 'draft',
      isSystem: false,
      createdBy: 'current_user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runCount: 0,
      successCount: 0,
      failureCount: 0,
    };
    return template;
  }

  async updateTemplate(id: string, data: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    await new Promise(r => setTimeout(r, 300));
    const existing = systemTemplates.find(t => t.id === id);
    if (!existing) throw new Error('Template not found');
    
    return {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteTemplate(id: string): Promise<void> {
    await new Promise(r => setTimeout(r, 200));
  }

  async activateTemplate(id: string): Promise<WorkflowTemplate> {
    return this.updateTemplate(id, { status: 'active' });
  }

  async pauseTemplate(id: string): Promise<WorkflowTemplate> {
    return this.updateTemplate(id, { status: 'paused' });
  }

  async getExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    await new Promise(r => setTimeout(r, 300));
    if (workflowId) {
      return mockExecutions.filter(e => e.workflowId === workflowId);
    }
    return mockExecutions;
  }

  async runWorkflow(id: string, context?: Record<string, unknown>): Promise<WorkflowExecution> {
    await new Promise(r => setTimeout(r, 300));
    const template = systemTemplates.find(t => t.id === id);
    if (!template) throw new Error('Template not found');
    
    return {
      id: `exec-${Date.now()}`,
      workflowId: id,
      workflowName: template.name,
      triggeredBy: 'Manual trigger',
      triggeredAt: new Date().toISOString(),
      status: 'running',
      context: context || {},
      logs: template.actions.map(a => ({
        actionId: a.id,
        actionType: a.type,
        status: 'pending' as const,
      })),
    };
  }

  async cancelExecution(executionId: string): Promise<void> {
    await new Promise(r => setTimeout(r, 200));
  }

  getCategories(): string[] {
    return ['Onboarding', 'Compliance', 'Client Service', 'Operations', 'Custom'];
  }

  getTriggerTypes(): { value: WorkflowTriggerType; label: string; description: string }[] {
    return [
      { value: 'manual', label: 'Manual', description: 'Triggered manually by user' },
      { value: 'client_added', label: 'New Client', description: 'When a new client is added' },
      { value: 'kyc_expiring', label: 'KYC Expiring', description: 'When client KYC is about to expire' },
      { value: 'document_signed', label: 'Document Signed', description: 'When a document is signed' },
      { value: 'meeting_scheduled', label: 'Meeting Scheduled', description: 'When a meeting is scheduled' },
      { value: 'task_completed', label: 'Task Completed', description: 'When a task is completed' },
      { value: 'account_opened', label: 'Account Opened', description: 'When a new account is opened' },
      { value: 'aum_threshold', label: 'AUM Threshold', description: 'When AUM crosses a threshold' },
      { value: 'birthday_approaching', label: 'Birthday', description: 'On client birthday' },
      { value: 'review_due', label: 'Review Due', description: 'When a client review is due' },
      { value: 'schedule', label: 'Scheduled', description: 'Run on a schedule (cron)' },
    ];
  }

  getActionTypes(): { value: WorkflowActionType; label: string; icon: string }[] {
    return [
      { value: 'create_task', label: 'Create Task', icon: 'ClipboardDocumentCheckIcon' },
      { value: 'send_email', label: 'Send Email', icon: 'EnvelopeIcon' },
      { value: 'send_notification', label: 'Send Notification', icon: 'BellIcon' },
      { value: 'schedule_meeting', label: 'Schedule Meeting', icon: 'CalendarIcon' },
      { value: 'update_field', label: 'Update Field', icon: 'PencilSquareIcon' },
      { value: 'add_tag', label: 'Add Tag', icon: 'TagIcon' },
      { value: 'create_document', label: 'Create Document', icon: 'DocumentIcon' },
      { value: 'log_activity', label: 'Log Activity', icon: 'DocumentTextIcon' },
      { value: 'wait', label: 'Wait/Delay', icon: 'ClockIcon' },
      { value: 'conditional_branch', label: 'Condition', icon: 'ArrowsRightLeftIcon' },
    ];
  }
}

export const workflowsService = new WorkflowsService();
