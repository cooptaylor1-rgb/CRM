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

export const householdsService = {
  async getHouseholds(): Promise<Household[]> {
    const response = await api.get('/households');
    return response.data;
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
