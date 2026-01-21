import api from './api';

export interface Household {
  id: string;
  name: string;
  primaryContactPersonId?: string;
  advisorId?: string;
  riskTolerance?: string;
  investmentObjective?: string;
  totalAum: number;
  status: string;
  onboardingDate?: string;
  lastReviewDate?: string;
  nextReviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper to ensure array response
const ensureArray = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.households)) return obj.households as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
};

export const householdsService = {
  async getHouseholds(): Promise<Household[]> {
    const response = await api.get('/households');
    return ensureArray<Household>(response.data);
  },

  async getHousehold(id: string): Promise<Household> {
    const response = await api.get(`/households/${id}`);
    return response.data;
  },

  async createHousehold(data: Partial<Household>): Promise<Household> {
    const response = await api.post('/households', data);
    return response.data;
  },

  async updateHousehold(id: string, data: Partial<Household>): Promise<Household> {
    const response = await api.patch(`/households/${id}`, data);
    return response.data;
  },

  async deleteHousehold(id: string): Promise<void> {
    await api.delete(`/households/${id}`);
  },
};
