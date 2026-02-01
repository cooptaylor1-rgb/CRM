import api from './api';

export type ReviewType = 'quarterly' | 'annual' | 'ad_hoc';
export type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'requires_action';

export interface ComplianceReview {
  id: string;
  householdId?: string | null;
  householdName?: string | null;
  reviewType: ReviewType;
  status: ReviewStatus;
  reviewDate: string;
  reviewerId: string;
  findings?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListComplianceReviewsParams {
  householdId?: string;
  status?: ReviewStatus;
  type?: ReviewType;
  startDate?: string;
  endDate?: string;
}

const ensureArray = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
};

export const complianceService = {
  async listReviews(params?: ListComplianceReviewsParams): Promise<ComplianceReview[]> {
    const response = await api.get('/compliance/reviews', { params });
    return ensureArray<ComplianceReview>(response.data);
  },
};
