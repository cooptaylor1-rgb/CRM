/**
 * Billing & Invoicing Service
 * Fee calculation, invoice generation, and payment tracking
 */
import api from './api';

// Types
export type BillingFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
export type BillingMethod = 'arrears' | 'advance';
export type InvoiceStatus = 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'void' | 'disputed';
export type PaymentMethod = 'ach' | 'wire' | 'check' | 'debit_from_account' | 'credit_card';
export type FeeType = 'management' | 'advisory' | 'financial_planning' | 'performance' | 'custodian' | 'other';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  householdId: string;
  householdName: string;
  
  // Period
  periodStart: string;
  periodEnd: string;
  billingFrequency: BillingFrequency;
  billingMethod: BillingMethod;
  
  // Amounts
  subtotal: number;
  discount: number;
  discountReason?: string;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // Status
  status: InvoiceStatus;
  dueDate: string;
  sentDate?: string;
  paidDate?: string;
  
  // Payment
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paymentNotes?: string;
  
  // Metadata
  notes?: string;
  internalNotes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  accountId?: string;
  accountName?: string;
  feeType: FeeType;
  description: string;
  
  // Calculation basis
  aum?: number;
  feeRate?: number;
  
  // Amounts
  quantity: number;
  unitPrice: number;
  amount: number;
  
  // Metadata
  periodStart?: string;
  periodEnd?: string;
}

export interface CreateInvoiceDto {
  householdId: string;
  periodStart: string;
  periodEnd: string;
  billingFrequency: BillingFrequency;
  billingMethod: BillingMethod;
  lineItems: Omit<InvoiceLineItem, 'id'>[];
  discount?: number;
  discountReason?: string;
  dueDate: string;
  notes?: string;
}

export interface UpdateInvoiceDto {
  discount?: number;
  discountReason?: string;
  dueDate?: string;
  notes?: string;
  internalNotes?: string;
  status?: InvoiceStatus;
}

export interface RecordPaymentDto {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference?: string;
  notes?: string;
}

export interface InvoiceFilter {
  search?: string;
  householdId?: string;
  status?: InvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface BillingStats {
  // Revenue
  totalBilledMtd: number;
  totalBilledYtd: number;
  totalCollectedMtd: number;
  totalCollectedYtd: number;
  
  // Invoices
  totalInvoices: number;
  byStatus: Record<InvoiceStatus, number>;
  overdueAmount: number;
  overdueCount: number;
  
  // Averages
  averageInvoice: number;
  averageCollectionDays: number;
  collectionRate: number;
}

export interface BillingRun {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  billingFrequency: BillingFrequency;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Results
  householdsProcessed: number;
  invoicesGenerated: number;
  totalAmount: number;
  errors: { householdId: string; error: string }[];
  
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreateBillingRunDto {
  name: string;
  periodStart: string;
  periodEnd: string;
  billingFrequency: BillingFrequency;
  householdIds?: string[]; // If empty, bill all eligible households
  autoSend?: boolean;
}

export interface FeeCalculation {
  householdId: string;
  householdName: string;
  accounts: {
    accountId: string;
    accountName: string;
    aum: number;
    feeScheduleId: string;
    feeScheduleName: string;
    effectiveRate: number;
    calculatedFee: number;
    tiers: {
      tierStart: number;
      tierEnd: number;
      rate: number;
      aumInTier: number;
      feeForTier: number;
    }[];
  }[];
  totalAum: number;
  totalFee: number;
  periodStart: string;
  periodEnd: string;
}

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-2024-001',
    householdId: 'h1',
    householdName: 'Anderson Family',
    periodStart: '2024-10-01',
    periodEnd: '2024-12-31',
    billingFrequency: 'quarterly',
    billingMethod: 'arrears',
    subtotal: 31250,
    discount: 0,
    tax: 0,
    total: 31250,
    amountPaid: 31250,
    amountDue: 0,
    lineItems: [
      {
        id: 'li1',
        accountId: 'acc1',
        accountName: 'Anderson Family Trust',
        feeType: 'management',
        description: 'Q4 2024 Management Fee - 1.00% annual rate',
        aum: 8500000,
        feeRate: 0.01,
        quantity: 1,
        unitPrice: 21250,
        amount: 21250,
        periodStart: '2024-10-01',
        periodEnd: '2024-12-31',
      },
      {
        id: 'li2',
        accountId: 'acc2',
        accountName: 'James Anderson IRA',
        feeType: 'management',
        description: 'Q4 2024 Management Fee - 1.00% annual rate',
        aum: 2500000,
        feeRate: 0.01,
        quantity: 1,
        unitPrice: 6250,
        amount: 6250,
        periodStart: '2024-10-01',
        periodEnd: '2024-12-31',
      },
      {
        id: 'li3',
        feeType: 'financial_planning',
        description: 'Annual Financial Planning Fee (pro-rated)',
        quantity: 1,
        unitPrice: 3750,
        amount: 3750,
      },
    ],
    status: 'paid',
    dueDate: '2025-01-15',
    sentDate: '2025-01-02',
    paidDate: '2025-01-10',
    paymentMethod: 'debit_from_account',
    paymentReference: 'Auto-debit from Account ***4567',
    createdBy: 'system',
    createdByName: 'Billing System',
    createdAt: '2025-01-02T08:00:00Z',
    updatedAt: '2025-01-10T14:00:00Z',
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV-2024-002',
    householdId: 'h2',
    householdName: 'Chen Family Trust',
    periodStart: '2024-10-01',
    periodEnd: '2024-12-31',
    billingFrequency: 'quarterly',
    billingMethod: 'arrears',
    subtotal: 93750,
    discount: 9375,
    discountReason: 'UHNW client discount - 10%',
    tax: 0,
    total: 84375,
    amountPaid: 0,
    amountDue: 84375,
    lineItems: [
      {
        id: 'li4',
        accountId: 'acc3',
        accountName: 'Chen Family Trust',
        feeType: 'management',
        description: 'Q4 2024 Management Fee - 0.75% annual rate',
        aum: 32000000,
        feeRate: 0.0075,
        quantity: 1,
        unitPrice: 60000,
        amount: 60000,
        periodStart: '2024-10-01',
        periodEnd: '2024-12-31',
      },
      {
        id: 'li5',
        accountId: 'acc4',
        accountName: 'Chen Foundation DAF',
        feeType: 'management',
        description: 'Q4 2024 Management Fee - 0.50% annual rate',
        aum: 13000000,
        feeRate: 0.005,
        quantity: 1,
        unitPrice: 16250,
        amount: 16250,
        periodStart: '2024-10-01',
        periodEnd: '2024-12-31',
      },
      {
        id: 'li6',
        feeType: 'advisory',
        description: 'Quarterly Advisory Retainer',
        quantity: 1,
        unitPrice: 17500,
        amount: 17500,
      },
    ],
    status: 'sent',
    dueDate: '2025-01-31',
    sentDate: '2025-01-02',
    notes: 'Thank you for your continued trust in our services.',
    createdBy: 'system',
    createdByName: 'Billing System',
    createdAt: '2025-01-02T08:00:00Z',
    updatedAt: '2025-01-02T10:00:00Z',
  },
  {
    id: 'inv3',
    invoiceNumber: 'INV-2024-003',
    householdId: 'h3',
    householdName: 'Williams Household',
    periodStart: '2024-10-01',
    periodEnd: '2024-12-31',
    billingFrequency: 'quarterly',
    billingMethod: 'arrears',
    subtotal: 1875,
    discount: 0,
    tax: 0,
    total: 1875,
    amountPaid: 0,
    amountDue: 1875,
    lineItems: [
      {
        id: 'li7',
        accountId: 'acc5',
        accountName: 'Williams Brokerage',
        feeType: 'management',
        description: 'Q4 2024 Management Fee - 1.00% annual rate',
        aum: 450000,
        feeRate: 0.01,
        quantity: 1,
        unitPrice: 1125,
        amount: 1125,
        periodStart: '2024-10-01',
        periodEnd: '2024-12-31',
      },
      {
        id: 'li8',
        accountId: 'acc6',
        accountName: 'Williams 401(k)',
        feeType: 'management',
        description: 'Q4 2024 Management Fee - 1.00% annual rate',
        aum: 300000,
        feeRate: 0.01,
        quantity: 1,
        unitPrice: 750,
        amount: 750,
        periodStart: '2024-10-01',
        periodEnd: '2024-12-31',
      },
    ],
    status: 'overdue',
    dueDate: '2024-12-15',
    sentDate: '2024-12-01',
    internalNotes: 'Follow up needed - payment not received',
    createdBy: 'system',
    createdByName: 'Billing System',
    createdAt: '2024-12-01T08:00:00Z',
    updatedAt: '2024-12-16T08:00:00Z',
  },
];

const mockStats: BillingStats = {
  totalBilledMtd: 117500,
  totalBilledYtd: 1450000,
  totalCollectedMtd: 31250,
  totalCollectedYtd: 1380000,
  totalInvoices: 3,
  byStatus: {
    draft: 0,
    pending: 0,
    sent: 1,
    paid: 1,
    overdue: 1,
    void: 0,
    disputed: 0,
  },
  overdueAmount: 1875,
  overdueCount: 1,
  averageInvoice: 39166.67,
  averageCollectionDays: 12,
  collectionRate: 95.2,
};

export const billingService = {
  // Get all invoices with filtering
  async getAll(filter?: InvoiceFilter): Promise<Invoice[]> {
    try {
      const response = await api.get('/api/billing/invoices', { params: filter });
      return response.data;
    } catch {
      let invoices = [...mockInvoices];
      
      if (filter?.search) {
        const search = filter.search.toLowerCase();
        invoices = invoices.filter(i => 
          i.invoiceNumber.toLowerCase().includes(search) ||
          i.householdName.toLowerCase().includes(search)
        );
      }
      
      if (filter?.status) {
        invoices = invoices.filter(i => i.status === filter.status);
      }
      
      if (filter?.householdId) {
        invoices = invoices.filter(i => i.householdId === filter.householdId);
      }
      
      return invoices;
    }
  },

  // Get invoice by ID
  async getById(id: string): Promise<Invoice> {
    try {
      const response = await api.get(`/api/billing/invoices/${id}`);
      return response.data;
    } catch {
      const invoice = mockInvoices.find(i => i.id === id);
      if (!invoice) throw new Error('Invoice not found');
      return invoice;
    }
  },

  // Get invoices for a household
  async getByHousehold(householdId: string): Promise<Invoice[]> {
    try {
      const response = await api.get(`/api/billing/invoices/household/${householdId}`);
      return response.data;
    } catch {
      return mockInvoices.filter(i => i.householdId === householdId);
    }
  },

  // Get billing statistics
  async getStats(): Promise<BillingStats> {
    try {
      const response = await api.get('/api/billing/stats');
      return response.data;
    } catch {
      return mockStats;
    }
  },

  // Create a new invoice
  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const response = await api.post('/api/billing/invoices', dto);
    return response.data;
  },

  // Update an invoice
  async update(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const response = await api.patch(`/api/billing/invoices/${id}`, dto);
    return response.data;
  },

  // Send an invoice
  async send(id: string, options?: { 
    recipientEmails?: string[];
    includeDetails?: boolean;
    customMessage?: string;
  }): Promise<Invoice> {
    const response = await api.post(`/api/billing/invoices/${id}/send`, options);
    return response.data;
  },

  // Record a payment
  async recordPayment(id: string, payment: RecordPaymentDto): Promise<Invoice> {
    const response = await api.post(`/api/billing/invoices/${id}/record-payment`, payment);
    return response.data;
  },

  // Void an invoice
  async void(id: string, reason: string): Promise<Invoice> {
    const response = await api.post(`/api/billing/invoices/${id}/void`, { reason });
    return response.data;
  },

  // Download invoice PDF
  async downloadPdf(id: string): Promise<Blob> {
    const response = await api.get(`/api/billing/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get overdue invoices
  async getOverdue(): Promise<Invoice[]> {
    try {
      const response = await api.get('/api/billing/invoices/overdue');
      return response.data;
    } catch {
      return mockInvoices.filter(i => i.status === 'overdue');
    }
  },

  // Calculate fees for a household
  async calculateFees(
    householdId: string, 
    periodStart: string, 
    periodEnd: string
  ): Promise<FeeCalculation> {
    const response = await api.post('/api/billing/calculate-fees', {
      householdId,
      periodStart,
      periodEnd,
    });
    return response.data;
  },

  // Preview billing run
  async previewBillingRun(dto: CreateBillingRunDto): Promise<{
    households: FeeCalculation[];
    totalAmount: number;
    householdCount: number;
  }> {
    const response = await api.post('/api/billing/runs/preview', dto);
    return response.data;
  },

  // Execute billing run
  async executeBillingRun(dto: CreateBillingRunDto): Promise<BillingRun> {
    const response = await api.post('/api/billing/runs', dto);
    return response.data;
  },

  // Get billing run history
  async getBillingRuns(): Promise<BillingRun[]> {
    const response = await api.get('/api/billing/runs');
    return response.data;
  },

  // Get billing run by ID
  async getBillingRun(id: string): Promise<BillingRun> {
    const response = await api.get(`/api/billing/runs/${id}`);
    return response.data;
  },

  // Send payment reminder
  async sendReminder(invoiceId: string, message?: string): Promise<void> {
    await api.post(`/api/billing/invoices/${invoiceId}/send-reminder`, { message });
  },

  // Bulk send invoices
  async bulkSend(invoiceIds: string[]): Promise<{ success: number; failed: number }> {
    const response = await api.post('/api/billing/invoices/bulk-send', { invoiceIds });
    return response.data;
  },

  // Export invoices
  async export(filter?: InvoiceFilter, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await api.get('/api/billing/invoices/export', {
      params: { ...filter, format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Get revenue report
  async getRevenueReport(startDate: string, endDate: string): Promise<{
    byMonth: { month: string; billed: number; collected: number }[];
    byHousehold: { householdId: string; householdName: string; total: number }[];
    byFeeType: Record<FeeType, number>;
    summary: {
      totalBilled: number;
      totalCollected: number;
      outstanding: number;
    };
  }> {
    const response = await api.get('/api/billing/reports/revenue', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },
};

export default billingService;
