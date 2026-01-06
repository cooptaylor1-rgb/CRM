import { api } from './api';

export interface AuditEvent {
  id: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout';
  entityType: string;
  entityId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditQuery {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const auditService = {
  /**
   * Get audit events with optional filters
   */
  async getEvents(query?: AuditQuery): Promise<AuditEvent[]> {
    const params = new URLSearchParams();
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.entityType) params.append('entityType', query.entityType);
    if (query?.entityId) params.append('entityId', query.entityId);
    if (query?.userId) params.append('userId', query.userId);
    
    const queryString = params.toString();
    const response = await api.get<AuditEvent[]>(`/api/audit${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  /**
   * Get audit events for a specific entity
   */
  async getByEntity(entityType: string, entityId: string): Promise<AuditEvent[]> {
    const response = await api.get<AuditEvent[]>(
      `/api/audit/entity?entityType=${entityType}&entityId=${entityId}`
    );
    return response.data;
  },

  /**
   * Get audit events for a specific user
   */
  async getByUser(userId: string): Promise<AuditEvent[]> {
    const response = await api.get<AuditEvent[]>(`/api/audit/user?userId=${userId}`);
    return response.data;
  },
};
