import api from './api';

export type MeetingType = 
  | 'initial_consultation'
  | 'quarterly_review'
  | 'annual_review'
  | 'financial_planning'
  | 'tax_planning'
  | 'estate_planning'
  | 'insurance_review'
  | 'portfolio_review'
  | 'retirement_planning'
  | 'education_planning'
  | 'business_planning'
  | 'other';

export type MeetingStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  description?: string;
  householdId?: string;
  prospectId?: string;
  personIds: string[];
  organizerId: string;
  attendeeIds: string[];
  startTime: string;
  endTime: string;
  duration: number;
  timezone: string;
  location?: string;
  isVirtual: boolean;
  virtualMeetingUrl?: string;
  virtualMeetingProvider?: string;
  agenda?: string;
  prepNotes?: string;
  outcome?: string;
  nextSteps?: string;
  followUpDate?: string;
  followUpTaskId?: string;
  calendarEventId?: string;
  calendarProvider?: string;
  reminderSent: boolean;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface MeetingNotes {
  id: string;
  meetingId: string;
  content: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingFilter {
  householdId?: string;
  type?: MeetingType;
  status?: MeetingStatus;
  startDate?: string;
  endDate?: string;
  organizerId?: string;
}

export interface MeetingStats {
  totalThisMonth: number;
  byType: Record<string, number>;
  completedThisMonth: number;
  cancelledThisMonth: number;
  noShowThisMonth: number;
  averageDuration: number;
  totalDuration: number;
}

export interface CreateMeetingDto {
  title: string;
  type: MeetingType;
  description?: string;
  householdId?: string;
  prospectId?: string;
  personIds?: string[];
  attendeeIds?: string[];
  startTime: string;
  endTime: string;
  timezone?: string;
  location?: string;
  isVirtual?: boolean;
  virtualMeetingUrl?: string;
  virtualMeetingProvider?: string;
  agenda?: string;
  prepNotes?: string;
  tags?: string[];
  sendReminder?: boolean;
}

export interface UpdateMeetingDto {
  title?: string;
  type?: MeetingType;
  status?: MeetingStatus;
  description?: string;
  personIds?: string[];
  attendeeIds?: string[];
  startTime?: string;
  endTime?: string;
  timezone?: string;
  location?: string;
  isVirtual?: boolean;
  virtualMeetingUrl?: string;
  virtualMeetingProvider?: string;
  agenda?: string;
  prepNotes?: string;
  outcome?: string;
  nextSteps?: string;
  followUpDate?: string;
  tags?: string[];
}

export interface CompleteMeetingDto {
  outcome: string;
  nextSteps?: string;
  followUpDate?: string;
  createFollowUpTask?: boolean;
  actualDuration?: number;
}

export interface CreateMeetingNotesDto {
  content: string;
  isPrivate?: boolean;
}

export const meetingsService = {
  // Meetings
  async getAll(filter?: MeetingFilter): Promise<Meeting[]> {
    const response = await api.get('/api/meetings', { params: filter });
    return response.data;
  },

  async getToday(): Promise<Meeting[]> {
    const response = await api.get('/api/meetings/today');
    return response.data;
  },

  async getUpcoming(days: number = 7): Promise<Meeting[]> {
    const response = await api.get('/api/meetings/upcoming', { params: { days } });
    return response.data;
  },

  async getByHousehold(householdId: string): Promise<Meeting[]> {
    const response = await api.get(`/api/meetings/household/${householdId}`);
    return response.data;
  },

  async getById(id: string): Promise<Meeting> {
    const response = await api.get(`/api/meetings/${id}`);
    return response.data;
  },

  async getStats(startDate?: string, endDate?: string): Promise<MeetingStats> {
    const response = await api.get('/api/meetings/stats', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async create(meeting: CreateMeetingDto): Promise<Meeting> {
    const response = await api.post('/api/meetings', meeting);
    return response.data;
  },

  async update(id: string, meeting: UpdateMeetingDto): Promise<Meeting> {
    const response = await api.put(`/api/meetings/${id}`, meeting);
    return response.data;
  },

  async complete(id: string, dto: CompleteMeetingDto): Promise<Meeting> {
    const response = await api.put(`/api/meetings/${id}/complete`, dto);
    return response.data;
  },

  async cancel(id: string, reason?: string): Promise<Meeting> {
    const response = await api.put(`/api/meetings/${id}/cancel`, { reason });
    return response.data;
  },

  async markNoShow(id: string, notes?: string): Promise<Meeting> {
    const response = await api.put(`/api/meetings/${id}/no-show`, { notes });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/meetings/${id}`);
  },

  // Meeting Notes
  async getNotes(meetingId: string): Promise<MeetingNotes[]> {
    const response = await api.get(`/api/meetings/${meetingId}/notes`);
    return response.data;
  },

  async addNotes(meetingId: string, notes: CreateMeetingNotesDto): Promise<MeetingNotes> {
    const response = await api.post(`/api/meetings/${meetingId}/notes`, notes);
    return response.data;
  },
};

export default meetingsService;
