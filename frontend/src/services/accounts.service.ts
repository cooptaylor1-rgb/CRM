import api from './api';

export interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  householdId: string;
  ownerPersonId?: string;
  ownerEntityId?: string;
  accountType: string;
  custodian?: string;
  status: string;
  currentValue: number;
  managementStyle?: string;
  openedDate?: string;
  closedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const accountsService = {
  async getAccounts(): Promise<Account[]> {
    const response = await api.get('/accounts');
    return response.data;
  },

  async getAccount(id: string): Promise<Account> {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  async createAccount(data: Partial<Account>): Promise<Account> {
    const response = await api.post('/accounts', data);
    return response.data;
  },

  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    const response = await api.patch(`/accounts/${id}`, data);
    return response.data;
  },

  async deleteAccount(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`);
  },
};
