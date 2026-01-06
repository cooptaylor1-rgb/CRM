/**
 * Clients (Persons) Service
 * Manages individual client/person data with PII protection
 */
import api from './api';

// Types
export type KycStatus = 'pending' | 'verified' | 'failed' | 'expired';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'domestic_partner';
export type EmploymentStatus = 'employed' | 'self_employed' | 'retired' | 'unemployed' | 'student';
export type RiskTolerance = 'conservative' | 'moderate_conservative' | 'moderate' | 'moderate_aggressive' | 'aggressive';

export interface Client {
  id: string;
  householdId: string;
  householdName?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  email?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  ssn?: string; // Masked in responses (***-**-1234)
  isPrimaryContact: boolean;
  
  // KYC & Compliance
  kycStatus: KycStatus;
  kycVerifiedDate?: string;
  kycExpirationDate?: string;
  accreditedInvestor: boolean;
  qualifiedClient: boolean;
  qualifiedPurchaser: boolean;
  
  // Investment Profile
  riskTolerance?: RiskTolerance;
  investmentExperience?: string;
  investmentObjective?: string;
  timeHorizon?: string;
  liquidityNeeds?: string;
  
  // Personal Details
  maritalStatus?: MaritalStatus;
  employmentStatus?: EmploymentStatus;
  employer?: string;
  occupation?: string;
  annualIncome?: number;
  netWorth?: number;
  liquidNetWorth?: number;
  
  // Relationships
  relationships?: ClientRelationship[];
  
  // Metadata
  notes?: string;
  tags?: string[];
  tier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRelationship {
  id: string;
  relatedPersonId: string;
  relatedPersonName: string;
  relationshipType: string;
  isPowerOfAttorney: boolean;
  isBeneficiary: boolean;
}

export interface CreateClientDto {
  householdId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  email?: string;
  phonePrimary?: string;
  address?: string;
  ssn?: string;
  isPrimaryContact?: boolean;
  maritalStatus?: MaritalStatus;
  employmentStatus?: EmploymentStatus;
  employer?: string;
  occupation?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {
  kycStatus?: KycStatus;
  accreditedInvestor?: boolean;
  qualifiedClient?: boolean;
  riskTolerance?: RiskTolerance;
  investmentExperience?: string;
  investmentObjective?: string;
  timeHorizon?: string;
  notes?: string;
  tags?: string[];
}

export interface ClientFilter {
  search?: string;
  householdId?: string;
  kycStatus?: KycStatus;
  tier?: string;
  isPrimaryContact?: boolean;
  accreditedInvestor?: boolean;
  tags?: string[];
}

export interface ClientStats {
  total: number;
  byKycStatus: Record<KycStatus, number>;
  byTier: Record<string, number>;
  kycExpiringSoon: number;
  accreditedCount: number;
  qualifiedClientCount: number;
}

export interface BulkUpdateDto {
  clientIds: string[];
  updates: Partial<UpdateClientDto>;
}

export interface BulkActionResult {
  success: number;
  failed: number;
  errors: { clientId: string; error: string }[];
}

// Mock data for development
const mockClients: Client[] = [
  {
    id: '1',
    householdId: 'h1',
    householdName: 'Anderson Family',
    firstName: 'James',
    lastName: 'Anderson',
    email: 'james.anderson@email.com',
    phonePrimary: '(555) 123-4567',
    address: '123 Park Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    ssn: '***-**-4567',
    isPrimaryContact: true,
    kycStatus: 'verified',
    kycVerifiedDate: '2024-06-15',
    kycExpirationDate: '2026-06-15',
    accreditedInvestor: true,
    qualifiedClient: true,
    qualifiedPurchaser: false,
    riskTolerance: 'moderate_aggressive',
    investmentExperience: 'Extensive (15+ years)',
    investmentObjective: 'Growth',
    timeHorizon: 'Long-term (10+ years)',
    maritalStatus: 'married',
    employmentStatus: 'employed',
    employer: 'Anderson Enterprises',
    occupation: 'CEO',
    annualIncome: 850000,
    netWorth: 12500000,
    liquidNetWorth: 8500000,
    tier: 'platinum',
    tags: ['high-net-worth', 'business-owner', 'estate-planning'],
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-11-20T14:30:00Z',
  },
  {
    id: '2',
    householdId: 'h1',
    householdName: 'Anderson Family',
    firstName: 'Sarah',
    lastName: 'Anderson',
    email: 'sarah.anderson@email.com',
    phonePrimary: '(555) 123-4568',
    address: '123 Park Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    ssn: '***-**-7890',
    isPrimaryContact: false,
    kycStatus: 'verified',
    kycVerifiedDate: '2024-06-15',
    kycExpirationDate: '2026-06-15',
    accreditedInvestor: true,
    qualifiedClient: true,
    qualifiedPurchaser: false,
    riskTolerance: 'moderate',
    maritalStatus: 'married',
    employmentStatus: 'employed',
    employer: 'City Hospital',
    occupation: 'Physician',
    annualIncome: 450000,
    tier: 'platinum',
    tags: ['physician', 'retirement-planning'],
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-11-20T14:30:00Z',
  },
  {
    id: '3',
    householdId: 'h2',
    householdName: 'Chen Family Trust',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@email.com',
    phonePrimary: '(555) 234-5678',
    address: '456 Oak Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'USA',
    ssn: '***-**-2345',
    isPrimaryContact: true,
    kycStatus: 'verified',
    kycVerifiedDate: '2024-03-10',
    kycExpirationDate: '2026-03-10',
    accreditedInvestor: true,
    qualifiedClient: true,
    qualifiedPurchaser: true,
    riskTolerance: 'aggressive',
    investmentExperience: 'Expert (20+ years)',
    maritalStatus: 'married',
    employmentStatus: 'retired',
    annualIncome: 0,
    netWorth: 45000000,
    liquidNetWorth: 32000000,
    tier: 'platinum',
    tags: ['ultra-high-net-worth', 'tech-executive', 'philanthropic'],
    createdAt: '2022-08-20T10:00:00Z',
    updatedAt: '2024-10-15T09:00:00Z',
  },
  {
    id: '4',
    householdId: 'h3',
    householdName: 'Williams Household',
    firstName: 'David',
    lastName: 'Williams',
    email: 'david.williams@email.com',
    phonePrimary: '(555) 345-6789',
    address: '789 Maple Drive',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'USA',
    ssn: '***-**-3456',
    isPrimaryContact: true,
    kycStatus: 'pending',
    accreditedInvestor: false,
    qualifiedClient: false,
    qualifiedPurchaser: false,
    riskTolerance: 'moderate_conservative',
    maritalStatus: 'single',
    employmentStatus: 'employed',
    employer: 'Tech Corp',
    occupation: 'Software Engineer',
    annualIncome: 185000,
    netWorth: 750000,
    liquidNetWorth: 450000,
    tier: 'gold',
    tags: ['tech-professional', 'first-time-investor'],
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: '2024-12-01T16:00:00Z',
  },
  {
    id: '5',
    householdId: 'h4',
    householdName: 'Martinez Family',
    firstName: 'Elena',
    lastName: 'Martinez',
    email: 'elena.martinez@email.com',
    phonePrimary: '(555) 456-7890',
    address: '321 Pine Lane',
    city: 'Miami',
    state: 'FL',
    zipCode: '33101',
    country: 'USA',
    ssn: '***-**-4567',
    isPrimaryContact: true,
    kycStatus: 'expired',
    kycVerifiedDate: '2022-12-01',
    kycExpirationDate: '2024-12-01',
    accreditedInvestor: true,
    qualifiedClient: false,
    qualifiedPurchaser: false,
    riskTolerance: 'moderate',
    maritalStatus: 'divorced',
    employmentStatus: 'self_employed',
    occupation: 'Business Consultant',
    annualIncome: 320000,
    netWorth: 2800000,
    liquidNetWorth: 1500000,
    tier: 'gold',
    tags: ['business-owner', 'international'],
    createdAt: '2022-06-15T10:00:00Z',
    updatedAt: '2024-11-28T11:00:00Z',
  },
];

const mockStats: ClientStats = {
  total: 5,
  byKycStatus: {
    pending: 1,
    verified: 3,
    failed: 0,
    expired: 1,
  },
  byTier: {
    platinum: 3,
    gold: 2,
    silver: 0,
    bronze: 0,
  },
  kycExpiringSoon: 1,
  accreditedCount: 4,
  qualifiedClientCount: 3,
};

export const clientsService = {
  // Get all clients with optional filtering
  async getAll(filter?: ClientFilter): Promise<Client[]> {
    try {
      const response = await api.get('/api/persons', { params: filter });
      return response.data;
    } catch {
      // Return mock data for development
      let clients = [...mockClients];
      
      if (filter?.search) {
        const search = filter.search.toLowerCase();
        clients = clients.filter(c => 
          c.firstName.toLowerCase().includes(search) ||
          c.lastName.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.householdName?.toLowerCase().includes(search)
        );
      }
      
      if (filter?.kycStatus) {
        clients = clients.filter(c => c.kycStatus === filter.kycStatus);
      }
      
      if (filter?.tier) {
        clients = clients.filter(c => c.tier === filter.tier);
      }
      
      if (filter?.householdId) {
        clients = clients.filter(c => c.householdId === filter.householdId);
      }
      
      if (filter?.isPrimaryContact !== undefined) {
        clients = clients.filter(c => c.isPrimaryContact === filter.isPrimaryContact);
      }
      
      if (filter?.accreditedInvestor !== undefined) {
        clients = clients.filter(c => c.accreditedInvestor === filter.accreditedInvestor);
      }
      
      return clients;
    }
  },

  // Get a single client by ID
  async getById(id: string): Promise<Client> {
    try {
      const response = await api.get(`/api/persons/${id}`);
      return response.data;
    } catch {
      const client = mockClients.find(c => c.id === id);
      if (!client) throw new Error('Client not found');
      return client;
    }
  },

  // Get clients by household
  async getByHousehold(householdId: string): Promise<Client[]> {
    try {
      const response = await api.get(`/api/persons/household/${householdId}`);
      return response.data;
    } catch {
      return mockClients.filter(c => c.householdId === householdId);
    }
  },

  // Get client statistics
  async getStats(): Promise<ClientStats> {
    try {
      const response = await api.get('/api/persons/stats');
      return response.data;
    } catch {
      return mockStats;
    }
  },

  // Create a new client
  async create(dto: CreateClientDto): Promise<Client> {
    const response = await api.post('/api/persons', dto);
    return response.data;
  },

  // Update a client
  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    const response = await api.patch(`/api/persons/${id}`, dto);
    return response.data;
  },

  // Delete a client (soft delete)
  async delete(id: string): Promise<void> {
    await api.delete(`/api/persons/${id}`);
  },

  // Verify KYC
  async verifyKyc(id: string, verificationData: { 
    documentType: string; 
    documentNumber: string;
    verificationMethod: string;
  }): Promise<Client> {
    const response = await api.post(`/api/persons/${id}/verify-kyc`, verificationData);
    return response.data;
  },

  // Get clients with expiring KYC
  async getExpiringKyc(daysAhead: number = 30): Promise<Client[]> {
    try {
      const response = await api.get('/api/persons/expiring-kyc', { params: { daysAhead } });
      return response.data;
    } catch {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      return mockClients.filter(c => {
        if (!c.kycExpirationDate) return false;
        const expDate = new Date(c.kycExpirationDate);
        return expDate <= futureDate;
      });
    }
  },

  // Bulk update clients
  async bulkUpdate(dto: BulkUpdateDto): Promise<BulkActionResult> {
    const response = await api.post('/api/persons/bulk-update', dto);
    return response.data;
  },

  // Bulk delete clients
  async bulkDelete(clientIds: string[]): Promise<BulkActionResult> {
    const response = await api.post('/api/persons/bulk-delete', { clientIds });
    return response.data;
  },

  // Export clients to CSV
  async exportToCsv(filter?: ClientFilter): Promise<Blob> {
    const response = await api.get('/api/persons/export', { 
      params: filter,
      responseType: 'blob' 
    });
    return response.data;
  },

  // Get client activity history
  async getActivityHistory(id: string): Promise<any[]> {
    const response = await api.get(`/api/persons/${id}/activity`);
    return response.data;
  },
};

export default clientsService;
