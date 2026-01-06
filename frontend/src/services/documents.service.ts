/**
 * Documents Service
 * SEC Rule 204-2 compliant document management
 */
import api from './api';

// Types
export type DocumentType = 
  | 'ima' | 'ips' | 'financial_plan' | 'account_statement' 
  | 'tax_document' | 'estate_document' | 'trust_document'
  | 'compliance' | 'correspondence' | 'contract' | 'identity'
  | 'performance_report' | 'invoice' | 'other';

export type DocumentStatus = 'active' | 'superseded' | 'archived' | 'pending_review';

export type DocumentCategory = 
  | 'client_agreement' | 'regulatory' | 'financial' | 'legal'
  | 'correspondence' | 'internal' | 'marketing' | 'compliance';

export interface Document {
  id: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  category: DocumentCategory;
  status: DocumentStatus;
  
  // File info
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl?: string;
  
  // Associations
  householdId?: string;
  householdName?: string;
  accountId?: string;
  accountName?: string;
  personId?: string;
  personName?: string;
  entityId?: string;
  entityName?: string;
  
  // Versioning (SEC 204-2 compliance)
  version: number;
  originalDocumentId?: string;
  supersededBy?: string;
  supersessionReason?: string;
  
  // Dates
  documentDate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  retentionUntil?: string;
  
  // Metadata
  uploadedBy: string;
  uploadedByName?: string;
  tags?: string[];
  isConfidential: boolean;
  requiresSignature: boolean;
  signatureStatus?: 'pending' | 'signed' | 'declined';
  signedDate?: string;
  signedBy?: string;
  
  // Audit
  accessLog?: DocumentAccessLog[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAccessLog {
  id: string;
  userId: string;
  userName: string;
  action: 'view' | 'download' | 'print' | 'share';
  timestamp: string;
  ipAddress?: string;
}

export interface CreateDocumentDto {
  title: string;
  description?: string;
  documentType: DocumentType;
  category: DocumentCategory;
  householdId?: string;
  accountId?: string;
  personId?: string;
  entityId?: string;
  documentDate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  tags?: string[];
  isConfidential?: boolean;
  requiresSignature?: boolean;
}

export interface UpdateDocumentDto {
  title?: string;
  description?: string;
  category?: DocumentCategory;
  tags?: string[];
  expirationDate?: string;
  isConfidential?: boolean;
}

export interface DocumentFilter {
  search?: string;
  documentType?: DocumentType;
  category?: DocumentCategory;
  status?: DocumentStatus;
  householdId?: string;
  accountId?: string;
  personId?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  uploadedBy?: string;
  requiresSignature?: boolean;
  signatureStatus?: string;
}

export interface DocumentStats {
  total: number;
  byType: Record<DocumentType, number>;
  byCategory: Record<DocumentCategory, number>;
  byStatus: Record<DocumentStatus, number>;
  pendingSignatures: number;
  expiringDocuments: number;
  recentUploads: number;
  totalStorageUsed: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  documentType: DocumentType;
  category: DocumentCategory;
  templateUrl: string;
  fields: TemplateField[];
  isActive: boolean;
}

export interface TemplateField {
  name: string;
  type: 'text' | 'date' | 'number' | 'signature' | 'checkbox';
  label: string;
  required: boolean;
  defaultValue?: string;
}

// Mock data
const mockDocuments: Document[] = [
  {
    id: 'd1',
    title: 'Investment Management Agreement - Anderson Family',
    description: 'Signed IMA for discretionary portfolio management',
    documentType: 'ima',
    category: 'client_agreement',
    status: 'active',
    fileName: 'anderson-ima-2024.pdf',
    fileSize: 245760,
    mimeType: 'application/pdf',
    householdId: 'h1',
    householdName: 'Anderson Family',
    version: 1,
    documentDate: '2024-01-15',
    effectiveDate: '2024-01-15',
    uploadedBy: 'user1',
    uploadedByName: 'John Smith',
    tags: ['ima', 'signed', 'discretionary'],
    isConfidential: true,
    requiresSignature: true,
    signatureStatus: 'signed',
    signedDate: '2024-01-15',
    signedBy: 'James Anderson',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'd2',
    title: 'Investment Policy Statement - Anderson Family',
    description: 'IPS outlining investment objectives and constraints',
    documentType: 'ips',
    category: 'client_agreement',
    status: 'active',
    fileName: 'anderson-ips-2024.pdf',
    fileSize: 156789,
    mimeType: 'application/pdf',
    householdId: 'h1',
    householdName: 'Anderson Family',
    version: 2,
    originalDocumentId: 'd0',
    supersessionReason: 'Updated risk tolerance and allocation targets',
    documentDate: '2024-06-01',
    effectiveDate: '2024-06-01',
    uploadedBy: 'user1',
    uploadedByName: 'John Smith',
    tags: ['ips', 'updated', 'risk-profile'],
    isConfidential: true,
    requiresSignature: true,
    signatureStatus: 'signed',
    signedDate: '2024-06-01',
    signedBy: 'James Anderson',
    createdAt: '2024-06-01T14:00:00Z',
    updatedAt: '2024-06-01T14:00:00Z',
  },
  {
    id: 'd3',
    title: 'Q3 2024 Performance Report - Chen Family Trust',
    description: 'Quarterly performance and attribution report',
    documentType: 'performance_report',
    category: 'financial',
    status: 'active',
    fileName: 'chen-performance-q3-2024.pdf',
    fileSize: 524288,
    mimeType: 'application/pdf',
    householdId: 'h2',
    householdName: 'Chen Family Trust',
    version: 1,
    documentDate: '2024-10-15',
    uploadedBy: 'user1',
    uploadedByName: 'John Smith',
    tags: ['performance', 'quarterly', 'q3-2024'],
    isConfidential: true,
    requiresSignature: false,
    createdAt: '2024-10-15T09:00:00Z',
    updatedAt: '2024-10-15T09:00:00Z',
  },
  {
    id: 'd4',
    title: 'Form ADV Part 2A - Firm Brochure',
    description: 'SEC required disclosure document',
    documentType: 'compliance',
    category: 'regulatory',
    status: 'active',
    fileName: 'form-adv-part2a-2024.pdf',
    fileSize: 892416,
    mimeType: 'application/pdf',
    version: 1,
    documentDate: '2024-03-31',
    effectiveDate: '2024-03-31',
    expirationDate: '2025-03-31',
    uploadedBy: 'user2',
    uploadedByName: 'Admin User',
    tags: ['adv', 'regulatory', 'disclosure'],
    isConfidential: false,
    requiresSignature: false,
    createdAt: '2024-03-31T08:00:00Z',
    updatedAt: '2024-03-31T08:00:00Z',
  },
  {
    id: 'd5',
    title: 'Trust Document - Williams Irrevocable Trust',
    description: 'Trust agreement establishing irrevocable trust',
    documentType: 'trust_document',
    category: 'legal',
    status: 'active',
    fileName: 'williams-trust-agreement.pdf',
    fileSize: 1048576,
    mimeType: 'application/pdf',
    householdId: 'h3',
    householdName: 'Williams Household',
    version: 1,
    documentDate: '2023-08-15',
    effectiveDate: '2023-08-15',
    uploadedBy: 'user1',
    uploadedByName: 'John Smith',
    tags: ['trust', 'irrevocable', 'estate-planning'],
    isConfidential: true,
    requiresSignature: false,
    createdAt: '2023-08-15T11:00:00Z',
    updatedAt: '2023-08-15T11:00:00Z',
  },
  {
    id: 'd6',
    title: 'Fee Invoice - Q4 2024 - Martinez Family',
    description: 'Quarterly management fee invoice',
    documentType: 'invoice',
    category: 'financial',
    status: 'active',
    fileName: 'martinez-invoice-q4-2024.pdf',
    fileSize: 45056,
    mimeType: 'application/pdf',
    householdId: 'h4',
    householdName: 'Martinez Family',
    version: 1,
    documentDate: '2024-12-31',
    uploadedBy: 'system',
    uploadedByName: 'System Generated',
    tags: ['invoice', 'quarterly', 'q4-2024'],
    isConfidential: true,
    requiresSignature: false,
    createdAt: '2024-12-31T00:00:00Z',
    updatedAt: '2024-12-31T00:00:00Z',
  },
];

const mockStats: DocumentStats = {
  total: 6,
  byType: {
    ima: 1,
    ips: 1,
    financial_plan: 0,
    account_statement: 0,
    tax_document: 0,
    estate_document: 0,
    trust_document: 1,
    compliance: 1,
    correspondence: 0,
    contract: 0,
    identity: 0,
    performance_report: 1,
    invoice: 1,
    other: 0,
  },
  byCategory: {
    client_agreement: 2,
    regulatory: 1,
    financial: 2,
    legal: 1,
    correspondence: 0,
    internal: 0,
    marketing: 0,
    compliance: 0,
  },
  byStatus: {
    active: 6,
    superseded: 0,
    archived: 0,
    pending_review: 0,
  },
  pendingSignatures: 0,
  expiringDocuments: 1,
  recentUploads: 3,
  totalStorageUsed: 2912401,
};

const mockTemplates: DocumentTemplate[] = [
  {
    id: 't1',
    name: 'Investment Management Agreement',
    description: 'Standard IMA template for discretionary management',
    documentType: 'ima',
    category: 'client_agreement',
    templateUrl: '/templates/ima-standard.docx',
    fields: [
      { name: 'clientName', type: 'text', label: 'Client Name', required: true },
      { name: 'effectiveDate', type: 'date', label: 'Effective Date', required: true },
      { name: 'feeRate', type: 'number', label: 'Annual Fee Rate (%)', required: true },
      { name: 'clientSignature', type: 'signature', label: 'Client Signature', required: true },
    ],
    isActive: true,
  },
  {
    id: 't2',
    name: 'Investment Policy Statement',
    description: 'IPS template with risk profiling sections',
    documentType: 'ips',
    category: 'client_agreement',
    templateUrl: '/templates/ips-standard.docx',
    fields: [
      { name: 'clientName', type: 'text', label: 'Client Name', required: true },
      { name: 'riskTolerance', type: 'text', label: 'Risk Tolerance', required: true },
      { name: 'investmentObjective', type: 'text', label: 'Investment Objective', required: true },
      { name: 'timeHorizon', type: 'text', label: 'Time Horizon', required: true },
    ],
    isActive: true,
  },
];

export const documentsService = {
  // Get all documents with filtering
  async getAll(filter?: DocumentFilter): Promise<Document[]> {
    try {
      const response = await api.get('/api/documents', { params: filter });
      return response.data;
    } catch {
      let docs = [...mockDocuments];
      
      if (filter?.search) {
        const search = filter.search.toLowerCase();
        docs = docs.filter(d => 
          d.title.toLowerCase().includes(search) ||
          d.description?.toLowerCase().includes(search) ||
          d.fileName.toLowerCase().includes(search)
        );
      }
      
      if (filter?.documentType) {
        docs = docs.filter(d => d.documentType === filter.documentType);
      }
      
      if (filter?.category) {
        docs = docs.filter(d => d.category === filter.category);
      }
      
      if (filter?.status) {
        docs = docs.filter(d => d.status === filter.status);
      }
      
      if (filter?.householdId) {
        docs = docs.filter(d => d.householdId === filter.householdId);
      }
      
      return docs;
    }
  },

  // Get document by ID
  async getById(id: string): Promise<Document> {
    try {
      const response = await api.get(`/api/documents/${id}`);
      return response.data;
    } catch {
      const doc = mockDocuments.find(d => d.id === id);
      if (!doc) throw new Error('Document not found');
      return doc;
    }
  },

  // Get documents for a household
  async getByHousehold(householdId: string): Promise<Document[]> {
    try {
      const response = await api.get(`/api/documents/household/${householdId}`);
      return response.data;
    } catch {
      return mockDocuments.filter(d => d.householdId === householdId);
    }
  },

  // Get documents for an account
  async getByAccount(accountId: string): Promise<Document[]> {
    try {
      const response = await api.get(`/api/documents/account/${accountId}`);
      return response.data;
    } catch {
      return mockDocuments.filter(d => d.accountId === accountId);
    }
  },

  // Get document statistics
  async getStats(): Promise<DocumentStats> {
    try {
      const response = await api.get('/api/documents/stats');
      return response.data;
    } catch {
      return mockStats;
    }
  },

  // Upload a new document
  async upload(file: File, metadata: CreateDocumentDto): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });
    
    const response = await api.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Update document metadata (not content - SEC compliance)
  async update(id: string, dto: UpdateDocumentDto): Promise<Document> {
    const response = await api.patch(`/api/documents/${id}`, dto);
    return response.data;
  },

  // Create document amendment (new version - SEC 204-2 compliance)
  async createAmendment(
    originalId: string, 
    file: File, 
    metadata: CreateDocumentDto,
    supersessionReason: string
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('supersessionReason', supersessionReason);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });
    
    const response = await api.post(`/api/documents/${originalId}/amend`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Archive a document (not delete - SEC compliance)
  async archive(id: string, reason: string): Promise<Document> {
    const response = await api.post(`/api/documents/${id}/archive`, { reason });
    return response.data;
  },

  // Download document
  async download(id: string): Promise<Blob> {
    const response = await api.get(`/api/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get document preview URL
  async getPreviewUrl(id: string): Promise<string> {
    const response = await api.get(`/api/documents/${id}/preview-url`);
    return response.data.url;
  },

  // Get document version history
  async getVersionHistory(id: string): Promise<Document[]> {
    try {
      const response = await api.get(`/api/documents/${id}/versions`);
      return response.data;
    } catch {
      return mockDocuments.filter(d => d.originalDocumentId === id || d.id === id);
    }
  },

  // Get access log for a document
  async getAccessLog(id: string): Promise<DocumentAccessLog[]> {
    const response = await api.get(`/api/documents/${id}/access-log`);
    return response.data;
  },

  // Log document access (called automatically on view/download)
  async logAccess(id: string, action: 'view' | 'download' | 'print' | 'share'): Promise<void> {
    await api.post(`/api/documents/${id}/log-access`, { action });
  },

  // Get document templates
  async getTemplates(): Promise<DocumentTemplate[]> {
    try {
      const response = await api.get('/api/documents/templates');
      return response.data;
    } catch {
      return mockTemplates;
    }
  },

  // Generate document from template
  async generateFromTemplate(
    templateId: string, 
    fieldValues: Record<string, any>,
    metadata: CreateDocumentDto
  ): Promise<Document> {
    const response = await api.post('/api/documents/generate', {
      templateId,
      fieldValues,
      metadata,
    });
    return response.data;
  },

  // Send document for signature
  async sendForSignature(id: string, recipients: { email: string; name: string }[]): Promise<void> {
    await api.post(`/api/documents/${id}/send-for-signature`, { recipients });
  },

  // Get documents pending signature
  async getPendingSignatures(): Promise<Document[]> {
    try {
      const response = await api.get('/api/documents/pending-signatures');
      return response.data;
    } catch {
      return mockDocuments.filter(d => d.signatureStatus === 'pending');
    }
  },

  // Get expiring documents
  async getExpiring(daysAhead: number = 30): Promise<Document[]> {
    try {
      const response = await api.get('/api/documents/expiring', { params: { daysAhead } });
      return response.data;
    } catch {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      return mockDocuments.filter(d => {
        if (!d.expirationDate) return false;
        const expDate = new Date(d.expirationDate);
        return expDate <= futureDate;
      });
    }
  },

  // Bulk download as ZIP
  async bulkDownload(documentIds: string[]): Promise<Blob> {
    const response = await api.post('/api/documents/bulk-download', 
      { documentIds }, 
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Share document (generate shareable link)
  async share(id: string, options: { 
    expiresIn?: number; 
    requiresPassword?: boolean;
    password?: string;
  }): Promise<{ shareUrl: string; expiresAt: string }> {
    const response = await api.post(`/api/documents/${id}/share`, options);
    return response.data;
  },

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },
};

export default documentsService;
