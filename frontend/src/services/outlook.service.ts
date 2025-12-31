import { api } from './api';

// ==================== Types ====================

export interface OutlookConnection {
  id: string;
  email: string;
  displayName: string;
  status: 'connected' | 'disconnected' | 'expired' | 'error';
  syncEmails: boolean;
  syncCalendar: boolean;
  syncContacts: boolean;
  autoTagEntities: boolean;
  createActivities: boolean;
  lastEmailSync?: string;
  lastCalendarSync?: string;
  lastContactSync?: string;
}

export interface OutlookEmail {
  id: string;
  outlookMessageId: string;
  conversationId: string;
  subject: string;
  bodyPreview: string;
  fromAddress: string;
  fromName?: string;
  toRecipients: Array<{ address: string; name?: string }>;
  ccRecipients: Array<{ address: string; name?: string }>;
  receivedAt: string;
  sentAt?: string;
  isRead: boolean;
  isDraft: boolean;
  hasAttachments: boolean;
  importance: 'low' | 'normal' | 'high';
  folderId?: string;
  folderName?: string;
  categories: string[];
  // CRM entity associations
  householdId?: string;
  accountId?: string;
  personId?: string;
  manuallyTagged: boolean;
  matchMetadata?: any;
}

export interface OutlookEvent {
  id: string;
  outlookEventId: string;
  iCalUId: string;
  subject: string;
  body?: string;
  bodyContentType?: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  isAllDay: boolean;
  isCancelled: boolean;
  isOnlineMeeting: boolean;
  onlineMeetingUrl?: string;
  onlineMeetingProvider?: string;
  location?: string;
  locationDetails?: any;
  organizerEmail: string;
  organizerName?: string;
  attendees: Array<{
    email: string;
    name?: string;
    type: 'required' | 'optional' | 'resource';
    responseStatus: 'none' | 'organizer' | 'tentative' | 'accepted' | 'declined';
  }>;
  isRecurring: boolean;
  recurrence?: any;
  categories: string[];
  sensitivity: 'normal' | 'personal' | 'private' | 'confidential';
  showAs: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere';
  // CRM entity associations
  householdId?: string;
  accountId?: string;
  personId?: string;
  crmMeetingId?: string;
  syncToCrmMeetings: boolean;
  manuallyTagged: boolean;
  matchMetadata?: any;
}

export interface OutlookMatchingRule {
  id: string;
  name: string;
  description?: string;
  ruleType: 'email_domain' | 'email_address' | 'name_pattern' | 'subject_pattern' | 'ai';
  pattern: string;
  entityType: 'household' | 'account' | 'person';
  entityId: string;
  entityName?: string;
  isActive: boolean;
  priority: number;
  matchCount?: number;
  lastMatchAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStatus {
  isConnected: boolean;
  connectionStatus: string;
  lastEmailSync?: string;
  lastCalendarSync?: string;
  lastContactSync?: string;
  emailCount: number;
  eventCount: number;
  contactCount: number;
  untaggedEmailCount: number;
  untaggedEventCount: number;
  syncInProgress: boolean;
  errors: string[];
}

export interface EmailFilters {
  householdId?: string;
  accountId?: string;
  personId?: string;
  untaggedOnly?: boolean;
  unreadOnly?: boolean;
  search?: string;
  folder?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface EventFilters {
  householdId?: string;
  accountId?: string;
  personId?: string;
  untaggedOnly?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface TagData {
  householdId?: string | null;
  accountId?: string | null;
  personId?: string | null;
}

export interface CreateEventData {
  subject: string;
  body?: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  isAllDay?: boolean;
  location?: string;
  attendees?: Array<{ email: string; name?: string; type?: 'required' | 'optional' }>;
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: 'teamsForBusiness' | 'skypeForBusiness' | 'skypeForConsumer';
  householdId?: string;
  accountId?: string;
  personId?: string;
}

export interface CreateRuleData {
  name: string;
  description?: string;
  ruleType: 'email_domain' | 'email_address' | 'name_pattern' | 'subject_pattern' | 'ai';
  pattern: string;
  entityType: 'household' | 'account' | 'person';
  entityId: string;
  priority?: number;
}

// ==================== Connection Management ====================

export async function initiateOutlookConnection(redirectUri?: string): Promise<{ authorizationUrl: string }> {
  const response = await api.post('/integrations/outlook/connect', { redirectUri });
  return response.data;
}

export async function completeOutlookConnection(code: string, redirectUri?: string): Promise<{ success: boolean; connection: OutlookConnection }> {
  const response = await api.post('/integrations/outlook/callback', { code, redirectUri });
  return response.data;
}

export async function getOutlookConnection(): Promise<{ connected: boolean; connection?: OutlookConnection }> {
  const response = await api.get('/integrations/outlook/connection');
  return response.data;
}

export async function updateOutlookConnection(settings: Partial<{
  syncEmails: boolean;
  syncCalendar: boolean;
  syncContacts: boolean;
  autoTagEntities: boolean;
  createActivities: boolean;
  emailFilters: any;
  calendarFilters: any;
}>): Promise<{ success: boolean; connection: OutlookConnection }> {
  const response = await api.patch('/integrations/outlook/connection', settings);
  return response.data;
}

export async function disconnectOutlook(): Promise<void> {
  await api.delete('/integrations/outlook/connection');
}

// ==================== Sync Control ====================

export async function getSyncStatus(): Promise<SyncStatus> {
  const response = await api.get('/integrations/outlook/sync/status');
  return response.data;
}

export async function triggerSync(options: {
  emails?: boolean;
  calendar?: boolean;
  contacts?: boolean;
  fullSync?: boolean;
}): Promise<{ message: string }> {
  const response = await api.post('/integrations/outlook/sync', options);
  return response.data;
}

// ==================== Email Operations ====================

export async function getEmails(filters: EmailFilters = {}): Promise<{ emails: OutlookEmail[]; total: number }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await api.get(`/integrations/outlook/emails?${params.toString()}`);
  return response.data;
}

export async function getEmail(emailId: string): Promise<OutlookEmail> {
  const response = await api.get(`/integrations/outlook/emails/${emailId}`);
  return response.data;
}

export async function tagEmail(emailId: string, tags: TagData): Promise<{ success: boolean; email: OutlookEmail }> {
  const response = await api.patch(`/integrations/outlook/emails/${emailId}/tag`, tags);
  return response.data;
}

export async function bulkTagEmails(emailIds: string[], tags: TagData): Promise<{ success: boolean; count: number }> {
  const response = await api.post('/integrations/outlook/emails/bulk-tag', { emailIds, ...tags });
  return response.data;
}

// ==================== Calendar Operations ====================

export async function getEvents(filters: EventFilters = {}): Promise<{ events: OutlookEvent[]; total: number }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await api.get(`/integrations/outlook/events?${params.toString()}`);
  return response.data;
}

export async function getEvent(eventId: string): Promise<OutlookEvent> {
  const response = await api.get(`/integrations/outlook/events/${eventId}`);
  return response.data;
}

export async function createEvent(data: CreateEventData): Promise<{ success: boolean; event: OutlookEvent }> {
  const response = await api.post('/integrations/outlook/events', data);
  return response.data;
}

export async function updateEvent(eventId: string, data: Partial<CreateEventData>): Promise<{ success: boolean; event: OutlookEvent }> {
  const response = await api.patch(`/integrations/outlook/events/${eventId}`, data);
  return response.data;
}

export async function deleteEvent(eventId: string): Promise<void> {
  await api.delete(`/integrations/outlook/events/${eventId}`);
}

export async function tagEvent(eventId: string, tags: TagData & { syncToCrmMeetings?: boolean }): Promise<{ success: boolean; event: OutlookEvent }> {
  const response = await api.patch(`/integrations/outlook/events/${eventId}/tag`, tags);
  return response.data;
}

// ==================== Entity-Specific Queries ====================

export async function getHouseholdEmails(householdId: string, filters: Omit<EmailFilters, 'householdId'> = {}): Promise<{ emails: OutlookEmail[]; total: number }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await api.get(`/integrations/outlook/households/${householdId}/emails?${params.toString()}`);
  return response.data;
}

export async function getHouseholdEvents(householdId: string, filters: Omit<EventFilters, 'householdId'> = {}): Promise<{ events: OutlookEvent[]; total: number }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await api.get(`/integrations/outlook/households/${householdId}/events?${params.toString()}`);
  return response.data;
}

export async function getAccountEmails(accountId: string, filters: Omit<EmailFilters, 'accountId'> = {}): Promise<{ emails: OutlookEmail[]; total: number }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await api.get(`/integrations/outlook/accounts/${accountId}/emails?${params.toString()}`);
  return response.data;
}

export async function getPersonEmails(personId: string, filters: Omit<EmailFilters, 'personId'> = {}): Promise<{ emails: OutlookEmail[]; total: number }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await api.get(`/integrations/outlook/persons/${personId}/emails?${params.toString()}`);
  return response.data;
}

export async function getPersonEvents(personId: string, filters: Omit<EventFilters, 'personId'> = {}): Promise<{ events: OutlookEvent[]; total: number }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await api.get(`/integrations/outlook/persons/${personId}/events?${params.toString()}`);
  return response.data;
}

// ==================== Matching Rules ====================

export async function getMatchingRules(): Promise<{ rules: OutlookMatchingRule[] }> {
  const response = await api.get('/integrations/outlook/rules');
  return response.data;
}

export async function createMatchingRule(data: CreateRuleData): Promise<{ success: boolean; rule: OutlookMatchingRule }> {
  const response = await api.post('/integrations/outlook/rules', data);
  return response.data;
}

export async function updateMatchingRule(ruleId: string, data: Partial<CreateRuleData & { isActive: boolean }>): Promise<{ success: boolean; rule: OutlookMatchingRule }> {
  const response = await api.put(`/integrations/outlook/rules/${ruleId}`, data);
  return response.data;
}

export async function deleteMatchingRule(ruleId: string): Promise<void> {
  await api.delete(`/integrations/outlook/rules/${ruleId}`);
}

// ==================== Analytics ====================

export async function getEmailAnalytics(options?: {
  startDate?: string;
  endDate?: string;
  householdId?: string;
}): Promise<{
  totalEmails: number;
  untaggedEmails: number;
  taggedPercentage: number;
  householdId?: string;
  period: { startDate?: string; endDate?: string };
}> {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.householdId) params.append('householdId', options.householdId);
  const response = await api.get(`/integrations/outlook/analytics/emails?${params.toString()}`);
  return response.data;
}

export async function getCalendarAnalytics(options?: {
  startDate?: string;
  endDate?: string;
  householdId?: string;
}): Promise<{
  totalEvents: number;
  untaggedEvents: number;
  taggedPercentage: number;
  householdId?: string;
  period: { startDate?: string; endDate?: string };
}> {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.householdId) params.append('householdId', options.householdId);
  const response = await api.get(`/integrations/outlook/analytics/calendar?${params.toString()}`);
  return response.data;
}

// ==================== Exported Service Object ====================

export const outlookService = {
  // Connection
  initiateConnection: initiateOutlookConnection,
  completeConnection: completeOutlookConnection,
  getConnection: getOutlookConnection,
  updateConnection: updateOutlookConnection,
  disconnect: disconnectOutlook,
  // Sync
  getSyncStatus,
  triggerSync,
  // Emails
  getEmails,
  getEmail,
  tagEmail,
  bulkTagEmails,
  // Events
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  tagEvent,
  // Entity-specific
  getHouseholdEmails,
  getHouseholdEvents,
  getAccountEmails,
  getPersonEmails,
  getPersonEvents,
  // Rules
  getMatchingRules,
  createMatchingRule,
  updateMatchingRule,
  deleteMatchingRule,
  // Analytics
  getEmailAnalytics,
  getCalendarAnalytics,
};

export default outlookService;
