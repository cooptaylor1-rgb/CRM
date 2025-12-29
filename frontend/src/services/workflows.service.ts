import api from './api';

export type WorkflowTrigger = 
  | 'new_client_onboarding'
  | 'annual_review_due'
  | 'quarterly_review_due'
  | 'client_birthday'
  | 'client_anniversary'
  | 'account_opened'
  | 'account_closed'
  | 'large_deposit'
  | 'large_withdrawal'
  | 'kyc_expiring'
  | 'document_expiring'
  | 'compliance_review_due'
  | 'new_prospect'
  | 'prospect_stage_change'
  | 'prospect_won'
  | 'manual'
  | 'scheduled';

export type WorkflowStatus = 'active' | 'inactive' | 'draft' | 'archived';

export interface WorkflowStepConfig {
  taskTitle?: string;
  taskDescription?: string;
  taskCategory?: string;
  taskPriority?: string;
  assignTo?: 'advisor' | 'operations' | 'compliance' | 'specific_user';
  assignToUserId?: string;
  dueDaysFromStart?: number;
  dueDaysFromPrevious?: number;
  emailTemplate?: string;
  emailRecipient?: 'client' | 'advisor' | 'specific';
  emailRecipientAddress?: string;
  notificationMessage?: string;
  notifyUsers?: string[];
  waitDays?: number;
  waitUntilDate?: string;
  waitForCondition?: string;
  condition?: string;
  trueSteps?: string[];
  falseSteps?: string[];
  meetingType?: string;
  meetingDuration?: number;
  meetingTitle?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: 'task' | 'email' | 'notification' | 'wait' | 'condition' | 'meeting';
  order: number;
  config: WorkflowStepConfig;
  dependsOn?: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  status: WorkflowStatus;
  triggerConditions?: Record<string, any>;
  steps: WorkflowStep[];
  estimatedDurationDays?: number;
  tags: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface WorkflowInstance {
  id: string;
  templateId: string;
  householdId?: string;
  personId?: string;
  prospectId?: string;
  accountId?: string;
  status: 'running' | 'completed' | 'cancelled' | 'paused';
  startedAt: string;
  completedAt?: string;
  currentStep: number;
  stepStatuses: Record<string, {
    status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
    startedAt?: string;
    completedAt?: string;
    taskId?: string;
    notes?: string;
  }>;
  triggeredBy?: string;
  triggerData?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowFilter {
  trigger?: WorkflowTrigger;
  status?: WorkflowStatus;
  search?: string;
}

export interface WorkflowStats {
  totalActive: number;
  byTemplate: Record<string, number>;
  completedThisMonth: number;
  averageCompletionDays: number;
}

export interface CreateWorkflowTemplateDto {
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  triggerConditions?: Record<string, any>;
  steps: WorkflowStep[];
  estimatedDurationDays?: number;
  tags?: string[];
  isDefault?: boolean;
}

export interface UpdateWorkflowTemplateDto {
  name?: string;
  description?: string;
  status?: WorkflowStatus;
  triggerConditions?: Record<string, any>;
  steps?: WorkflowStep[];
  estimatedDurationDays?: number;
  tags?: string[];
  isDefault?: boolean;
}

export interface StartWorkflowDto {
  templateId: string;
  householdId?: string;
  personId?: string;
  prospectId?: string;
  accountId?: string;
  triggerData?: Record<string, any>;
}

export interface CompleteStepDto {
  stepId: string;
  notes?: string;
}

export const workflowsService = {
  // Templates
  async getTemplates(filter?: WorkflowFilter): Promise<WorkflowTemplate[]> {
    const response = await api.get('/workflows/templates', { params: filter });
    return response.data;
  },

  async getTemplate(id: string): Promise<WorkflowTemplate> {
    const response = await api.get(`/workflows/templates/${id}`);
    return response.data;
  },

  async createTemplate(template: CreateWorkflowTemplateDto): Promise<WorkflowTemplate> {
    const response = await api.post('/workflows/templates', template);
    return response.data;
  },

  async updateTemplate(id: string, template: UpdateWorkflowTemplateDto): Promise<WorkflowTemplate> {
    const response = await api.patch(`/workflows/templates/${id}`, template);
    return response.data;
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/workflows/templates/${id}`);
  },

  async activateTemplate(id: string): Promise<WorkflowTemplate> {
    const response = await api.post(`/workflows/templates/${id}/activate`);
    return response.data;
  },

  async deactivateTemplate(id: string): Promise<WorkflowTemplate> {
    const response = await api.post(`/workflows/templates/${id}/deactivate`);
    return response.data;
  },

  async seedDefaults(): Promise<WorkflowTemplate[]> {
    const response = await api.post('/workflows/templates/seed-defaults');
    return response.data;
  },

  // Instances
  async getActiveInstances(): Promise<WorkflowInstance[]> {
    const response = await api.get('/workflows/instances/active');
    return response.data;
  },

  async getInstancesByHousehold(householdId: string): Promise<WorkflowInstance[]> {
    const response = await api.get(`/workflows/instances/household/${householdId}`);
    return response.data;
  },

  async getInstance(id: string): Promise<WorkflowInstance> {
    const response = await api.get(`/workflows/instances/${id}`);
    return response.data;
  },

  async startWorkflow(dto: StartWorkflowDto): Promise<WorkflowInstance> {
    const response = await api.post('/workflows/instances', dto);
    return response.data;
  },

  async completeStep(instanceId: string, dto: CompleteStepDto): Promise<WorkflowInstance> {
    const response = await api.post(`/workflows/instances/${instanceId}/complete-step`, dto);
    return response.data;
  },

  async cancelWorkflow(instanceId: string, reason?: string): Promise<WorkflowInstance> {
    const response = await api.post(`/workflows/instances/${instanceId}/cancel`, { reason });
    return response.data;
  },

  // Stats
  async getStats(): Promise<WorkflowStats> {
    const response = await api.get('/workflows/stats');
    return response.data;
  },
};

export default workflowsService;
