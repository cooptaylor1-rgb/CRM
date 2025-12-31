// Custodian Integration Service - Schwab API Integration
import api from './api';

// Types
export interface CustodianConnection {
  id: string;
  firmId: string;
  custodianType: 'schwab' | 'fidelity' | 'pershing' | 'td_ameritrade';
  connectionName: string;
  status: 'active' | 'inactive' | 'pending' | 'error';
  lastSyncAt?: string;
  lastSyncStatus?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CustodianAccountLink {
  id: string;
  connectionId: string;
  crmAccountId: string;
  custodianAccountId: string;
  custodianAccountNumber: string;
  isAutoSync: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  lastSyncAt?: string;
  lastSyncStatus?: string;
  metadata?: Record<string, any>;
}

export interface SchwabAccount {
  accountNumber: string;
  accountName: string;
  accountType: string;
  registrationType: string;
  balance: number;
  marketValue: number;
  cashBalance: number;
  status: string;
}

export interface SchwabPosition {
  symbol: string;
  description: string;
  quantity: number;
  marketValue: number;
  costBasis: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  assetType: string;
  sector?: string;
}

export interface SchwabTransaction {
  transactionId: string;
  date: string;
  type: string;
  description: string;
  symbol?: string;
  quantity?: number;
  price?: number;
  amount: number;
  fees?: number;
  status: string;
}

export interface DiscoveredAccount {
  custodianAccountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  balance: number;
  suggestedCrmAccount?: {
    id: string;
    name: string;
  };
  isLinked: boolean;
}

// Connection Management
export const custodianService = {
  // Get all connections
  getConnections: async (): Promise<CustodianConnection[]> => {
    const response = await api.get('/custodian/connections');
    return response.data;
  },

  // Get connection by ID
  getConnection: async (id: string): Promise<CustodianConnection> => {
    const response = await api.get(`/custodian/connections/${id}`);
    return response.data;
  },

  // Create new connection
  createConnection: async (data: {
    custodianType: CustodianConnection['custodianType'];
    connectionName: string;
  }): Promise<CustodianConnection> => {
    const response = await api.post('/custodian/connections', data);
    return response.data;
  },

  // Delete connection
  deleteConnection: async (id: string): Promise<void> => {
    await api.delete(`/custodian/connections/${id}`);
  },

  // OAuth Flow
  initiateOAuth: async (connectionId: string): Promise<{ authUrl: string }> => {
    const response = await api.post(`/custodian/connections/${connectionId}/oauth/initiate`);
    return response.data;
  },

  completeOAuth: async (connectionId: string, code: string, state: string): Promise<CustodianConnection> => {
    const response = await api.post(`/custodian/connections/${connectionId}/oauth/callback`, { code, state });
    return response.data;
  },

  // Account Linking
  getLinkedAccounts: async (connectionId: string): Promise<CustodianAccountLink[]> => {
    const response = await api.get(`/custodian/connections/${connectionId}/accounts`);
    return response.data;
  },

  linkAccount: async (connectionId: string, data: {
    crmAccountId: string;
    custodianAccountId: string;
    custodianAccountNumber: string;
    isAutoSync?: boolean;
    syncFrequency?: 'realtime' | 'hourly' | 'daily';
  }): Promise<CustodianAccountLink> => {
    const response = await api.post(`/custodian/connections/${connectionId}/link`, data);
    return response.data;
  },

  unlinkAccount: async (linkId: string): Promise<void> => {
    await api.delete(`/custodian/accounts/${linkId}`);
  },

  // Sync Operations
  syncConnection: async (connectionId: string, options?: {
    syncType?: 'full' | 'incremental';
  }): Promise<{ status: string; jobId?: string }> => {
    const response = await api.post(`/custodian/connections/${connectionId}/sync`, options);
    return response.data;
  },

  syncAccount: async (linkId: string): Promise<{ status: string }> => {
    const response = await api.post(`/custodian/accounts/${linkId}/sync`);
    return response.data;
  },

  getSyncStatus: async (connectionId: string): Promise<{
    status: string;
    lastSyncAt?: string;
    lastSyncStatus?: string;
    accountsSynced?: number;
    positionsSynced?: number;
    transactionsSynced?: number;
    errors?: string[];
  }> => {
    const response = await api.get(`/custodian/connections/${connectionId}/sync/status`);
    return response.data;
  },

  // Account Discovery
  discoverAccounts: async (connectionId: string): Promise<DiscoveredAccount[]> => {
    const response = await api.get(`/custodian/connections/${connectionId}/discover`);
    return response.data;
  },

  autoLinkAccounts: async (connectionId: string): Promise<{
    linked: number;
    skipped: number;
    results: Array<{
      custodianAccountId: string;
      status: string;
      crmAccountId?: string;
    }>;
  }> => {
    const response = await api.post(`/custodian/connections/${connectionId}/auto-link`);
    return response.data;
  },

  // Direct Schwab Data Access (through linked accounts)
  getPositions: async (linkId: string): Promise<SchwabPosition[]> => {
    const response = await api.get(`/custodian/accounts/${linkId}/positions`);
    return response.data;
  },

  getTransactions: async (linkId: string, options?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<SchwabTransaction[]> => {
    const response = await api.get(`/custodian/accounts/${linkId}/transactions`, { params: options });
    return response.data;
  },
};

export default custodianService;
