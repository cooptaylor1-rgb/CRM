// Enhanced Entities Service - Trusts, LLCs, and Legal Entity Management
import api from './api';

// Types
export type EntityType = 
  | 'trust' | 'corporation' | 'llc' | 'partnership' | 'foundation' | 'estate'
  | 'flp' | 'grat' | 'qprt' | 'ilit' | 'crt' | 'daf' | 'private_foundation';

export type TrustType = 
  | 'revocable' | 'irrevocable' | 'living' | 'testamentary' | 'charitable' 
  | 'special_needs' | 'spendthrift' | 'generation_skipping' | 'grantor' | 'non_grantor';

export type EntityStatus = 'active' | 'inactive' | 'dissolved' | 'terminated' | 'pending';

export type EntityRole = 
  | 'grantor' | 'trustee' | 'co_trustee' | 'successor_trustee' 
  | 'beneficiary' | 'remainder_beneficiary' | 'income_beneficiary' | 'protector'
  | 'manager' | 'member' | 'general_partner' | 'limited_partner'
  | 'shareholder' | 'officer' | 'director' | 'registered_agent';

export interface LegalEntity {
  id: string;
  firmId: string;
  householdId?: string;
  entityType: EntityType;
  trustType?: TrustType;
  legalName: string;
  shortName?: string;
  taxId?: string;
  taxIdType?: string;
  
  // Formation
  stateOfFormation?: string;
  countryOfFormation: string;
  formationDate?: string;
  fiscalYearEnd?: string;
  status: EntityStatus;

  // Trust-specific
  trustDate?: string;
  terminationDate?: string;
  terminationCondition?: string;
  distributionStandard?: string;
  situsState?: string;
  governingLaw?: string;
  isGrantorTrust: boolean;
  gstExempt: boolean;
  pourOverWill: boolean;

  // LLC-specific
  operatingAgreementDate?: string;
  taxClassification?: string;
  registeredAgentName?: string;
  registeredAgentAddress?: string;
  principalOfficeAddress?: string;

  // Valuation
  estimatedValue?: number;
  valuationDate?: string;
  valuationMethod?: string;

  // Compliance
  annualReportDue?: string;
  lastAnnualReportDate?: string;
  lastK1Date?: string;
  requires1099: boolean;

  // Professional contacts
  attorneyName?: string;
  attorneyFirm?: string;
  attorneyContact?: string;
  accountantName?: string;
  accountantFirm?: string;
  accountantContact?: string;

  // Documents
  primaryDocumentId?: string;
  amendmentIds?: string[];

  // Metadata
  purpose?: string;
  notes?: string;
  metadata?: Record<string, any>;

  // Relationships
  relationships?: EntityRelationship[];

  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface EntityRelationship {
  id: string;
  entityId: string;
  personId?: string;
  relatedEntityId?: string;
  role: EntityRole;
  roleTitle?: string;
  ownershipPercentage?: number;
  distributionPercentage?: number;
  capitalContribution?: number;
  isPrimary: boolean;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  successionOrder?: number;
  notes?: string;
  permissions?: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
  
  // Populated
  person?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  relatedEntity?: {
    id: string;
    legalName: string;
    entityType: EntityType;
  };
}

export interface EntityDistribution {
  id: string;
  entityId: string;
  beneficiaryId?: string;
  beneficiaryEntityId?: string;
  distributionDate: string;
  amount: number;
  distributionType: string;
  paymentMethod?: string;
  accountId?: string;
  purpose?: string;
  notes?: string;
  approvedBy?: string;
  documentId?: string;
  createdAt: string;
}

export interface EntityDocument {
  id: string;
  entityId: string;
  documentId: string;
  documentType: string;
  documentDate?: string;
  description?: string;
  isPrimary: boolean;
  effectiveDate?: string;
  expirationDate?: string;
  createdAt: string;
}

export interface EntityStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalEstimatedValue: number;
}

export interface DistributionSummary {
  totalDistributed: number;
  byType: Record<string, number>;
  byBeneficiary: Record<string, number>;
}

// Entities API
export const entitiesService = {
  // Entity CRUD
  getEntities: async (options?: {
    householdId?: string;
    entityType?: EntityType;
    status?: EntityStatus;
    search?: string;
  }): Promise<LegalEntity[]> => {
    const response = await api.get('/entities', { params: options });
    return response.data;
  },

  getEntity: async (id: string): Promise<LegalEntity> => {
    const response = await api.get(`/entities/${id}`);
    return response.data;
  },

  createEntity: async (data: Partial<LegalEntity>): Promise<LegalEntity> => {
    const response = await api.post('/entities', data);
    return response.data;
  },

  updateEntity: async (id: string, data: Partial<LegalEntity>): Promise<LegalEntity> => {
    const response = await api.patch(`/entities/${id}`, data);
    return response.data;
  },

  deleteEntity: async (id: string): Promise<void> => {
    await api.delete(`/entities/${id}`);
  },

  // Entity Queries
  getEntitiesByHousehold: async (householdId: string): Promise<LegalEntity[]> => {
    const response = await api.get(`/entities/household/${householdId}`);
    return response.data;
  },

  getEntitiesByPerson: async (personId: string): Promise<LegalEntity[]> => {
    const response = await api.get(`/entities/person/${personId}`);
    return response.data;
  },

  getEntityStats: async (): Promise<EntityStats> => {
    const response = await api.get('/entities/stats');
    return response.data;
  },

  getUpcomingCompliance: async (daysAhead?: number): Promise<LegalEntity[]> => {
    const response = await api.get('/entities/compliance/upcoming', {
      params: daysAhead ? { daysAhead } : {},
    });
    return response.data;
  },

  // Relationships
  getRelationships: async (entityId: string, options?: {
    role?: EntityRole;
    activeOnly?: boolean;
  }): Promise<EntityRelationship[]> => {
    const response = await api.get(`/entities/${entityId}/relationships`, { params: options });
    return response.data;
  },

  addRelationship: async (entityId: string, data: {
    personId?: string;
    relatedEntityId?: string;
    role: EntityRole;
    roleTitle?: string;
    ownershipPercentage?: number;
    distributionPercentage?: number;
    capitalContribution?: number;
    isPrimary?: boolean;
    startDate?: string;
    endDate?: string;
    successionOrder?: number;
    notes?: string;
    permissions?: Record<string, boolean>;
  }): Promise<EntityRelationship> => {
    const response = await api.post(`/entities/${entityId}/relationships`, data);
    return response.data;
  },

  updateRelationship: async (relationshipId: string, data: Partial<{
    role: EntityRole;
    roleTitle: string;
    ownershipPercentage: number;
    distributionPercentage: number;
    isPrimary: boolean;
    isActive: boolean;
    endDate: string;
    successionOrder: number;
    notes: string;
    permissions: Record<string, boolean>;
  }>): Promise<EntityRelationship> => {
    const response = await api.patch(`/entities/relationships/${relationshipId}`, data);
    return response.data;
  },

  removeRelationship: async (relationshipId: string): Promise<void> => {
    await api.delete(`/entities/relationships/${relationshipId}`);
  },

  getTrustees: async (entityId: string): Promise<EntityRelationship[]> => {
    const response = await api.get(`/entities/${entityId}/trustees`);
    return response.data;
  },

  getBeneficiaries: async (entityId: string): Promise<EntityRelationship[]> => {
    const response = await api.get(`/entities/${entityId}/beneficiaries`);
    return response.data;
  },

  getMembers: async (entityId: string): Promise<EntityRelationship[]> => {
    const response = await api.get(`/entities/${entityId}/members`);
    return response.data;
  },

  // Distributions
  getDistributions: async (entityId: string, options?: {
    year?: number;
    beneficiaryId?: string;
    distributionType?: string;
  }): Promise<EntityDistribution[]> => {
    const response = await api.get(`/entities/${entityId}/distributions`, { params: options });
    return response.data;
  },

  recordDistribution: async (entityId: string, data: {
    beneficiaryId?: string;
    beneficiaryEntityId?: string;
    distributionDate: string;
    amount: number;
    distributionType?: string;
    paymentMethod?: string;
    accountId?: string;
    purpose?: string;
    notes?: string;
    documentId?: string;
  }): Promise<EntityDistribution> => {
    const response = await api.post(`/entities/${entityId}/distributions`, data);
    return response.data;
  },

  getDistributionSummary: async (entityId: string, year?: number): Promise<DistributionSummary> => {
    const response = await api.get(`/entities/${entityId}/distributions/summary`, {
      params: year ? { year } : {},
    });
    return response.data;
  },

  // Documents
  getEntityDocuments: async (entityId: string, documentType?: string): Promise<EntityDocument[]> => {
    const response = await api.get(`/entities/${entityId}/documents`, {
      params: documentType ? { documentType } : {},
    });
    return response.data;
  },

  linkDocument: async (entityId: string, data: {
    documentId: string;
    documentType: string;
    documentDate?: string;
    description?: string;
    isPrimary?: boolean;
    effectiveDate?: string;
    expirationDate?: string;
  }): Promise<EntityDocument> => {
    const response = await api.post(`/entities/${entityId}/documents`, data);
    return response.data;
  },

  unlinkDocument: async (entityDocId: string): Promise<void> => {
    await api.delete(`/entities/documents/${entityDocId}`);
  },
};

export default entitiesService;
