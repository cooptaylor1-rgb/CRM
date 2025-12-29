import api from './api';

export type PipelineStage = 
  | 'lead' 
  | 'qualified' 
  | 'meeting_scheduled' 
  | 'proposal_sent' 
  | 'negotiation' 
  | 'won' 
  | 'lost';

export type LeadSource = 
  | 'referral' 
  | 'website' 
  | 'event' 
  | 'cold_outreach' 
  | 'linkedin' 
  | 'existing_client' 
  | 'center_of_influence' 
  | 'other';

export type LostReason = 
  | 'price' 
  | 'competitor' 
  | 'timing' 
  | 'no_response' 
  | 'not_qualified' 
  | 'service_fit' 
  | 'other';

export interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  stage: PipelineStage;
  leadSource: LeadSource;
  referralSource?: string;
  referrerId?: string;
  estimatedAum?: number;
  probabilityPercent: number;
  expectedRevenue?: number;
  expectedCloseDate?: string;
  assignedAdvisorId?: string;
  notes?: string;
  lostReason?: LostReason;
  lostNotes?: string;
  lostToCompetitor?: string;
  wonDate?: string;
  lostDate?: string;
  convertedHouseholdId?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ProspectActivity {
  id: string;
  prospectId: string;
  activityType: 'call' | 'email' | 'meeting' | 'note' | 'stage_change' | 'document_sent';
  description: string;
  notes?: string;
  oldStage?: string;
  newStage?: string;
  performedBy: string;
  createdAt: string;
}

export interface ProspectFilter {
  stage?: PipelineStage;
  leadSource?: LeadSource;
  assignedAdvisorId?: string;
  followUpBefore?: string;
}

export interface PipelineStats {
  byStage: Record<string, { count: number; value: number }>;
  totalPipeline: number;
  weightedPipeline: number;
  averageDealSize: number;
}

export interface ConversionMetrics {
  totalLeads: number;
  converted: number;
  lost: number;
  conversionRate: number;
  averageTimeToClose: number;
}

export interface CreateProspectDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadSource?: LeadSource;
  referralSource?: string;
  referrerId?: string;
  estimatedAum?: number;
  expectedRevenue?: number;
  expectedCloseDate?: string;
  assignedAdvisorId?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateProspectDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  stage?: PipelineStage;
  probabilityPercent?: number;
  estimatedAum?: number;
  expectedRevenue?: number;
  expectedCloseDate?: string;
  assignedAdvisorId?: string;
  notes?: string;
  nextFollowUpDate?: string;
  tags?: string[];
}

export interface ChangeStageDto {
  newStage: PipelineStage;
  notes?: string;
}

export interface MarkLostDto {
  lostReason: LostReason;
  lostNotes?: string;
  lostToCompetitor?: string;
}

export interface LogActivityDto {
  activityType: 'call' | 'email' | 'meeting' | 'note' | 'document_sent';
  description: string;
  notes?: string;
}

export const pipelineService = {
  // Prospects
  async getAll(filter?: ProspectFilter): Promise<Prospect[]> {
    const response = await api.get('/api/pipeline/prospects', { params: filter });
    return response.data;
  },

  async getFollowUpsDue(): Promise<Prospect[]> {
    const response = await api.get('/api/pipeline/prospects/follow-ups-due');
    return response.data;
  },

  async getById(id: string): Promise<Prospect> {
    const response = await api.get(`/api/pipeline/prospects/${id}`);
    return response.data;
  },

  async create(prospect: CreateProspectDto): Promise<Prospect> {
    const response = await api.post('/api/pipeline/prospects', prospect);
    return response.data;
  },

  async update(id: string, prospect: UpdateProspectDto): Promise<Prospect> {
    const response = await api.put(`/api/pipeline/prospects/${id}`, prospect);
    return response.data;
  },

  async changeStage(id: string, dto: ChangeStageDto): Promise<Prospect> {
    const response = await api.put(`/api/pipeline/prospects/${id}/stage`, dto);
    return response.data;
  },

  async markLost(id: string, dto: MarkLostDto): Promise<Prospect> {
    const response = await api.put(`/api/pipeline/prospects/${id}/lost`, dto);
    return response.data;
  },

  async convertToClient(id: string, householdId: string): Promise<Prospect> {
    const response = await api.post(`/api/pipeline/prospects/${id}/convert`, { householdId });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/pipeline/prospects/${id}`);
  },

  // Activities
  async logActivity(prospectId: string, activity: LogActivityDto): Promise<ProspectActivity> {
    const response = await api.post(`/api/pipeline/prospects/${prospectId}/activities`, activity);
    return response.data;
  },

  async getActivities(prospectId: string): Promise<ProspectActivity[]> {
    const response = await api.get(`/api/pipeline/prospects/${prospectId}/activities`);
    return response.data;
  },

  // Analytics
  async getStats(): Promise<PipelineStats> {
    const response = await api.get('/api/pipeline/stats');
    return response.data;
  },

  async getConversionMetrics(startDate: string, endDate: string): Promise<ConversionMetrics> {
    const response = await api.get('/api/pipeline/conversion-metrics', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

export default pipelineService;
