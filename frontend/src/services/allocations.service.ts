import api from './api';

// ==================== Types ====================

export type AssetClass =
  | 'US_LARGE_CAP'
  | 'US_MID_CAP'
  | 'US_SMALL_CAP'
  | 'INTERNATIONAL_DEVELOPED'
  | 'INTERNATIONAL_EMERGING'
  | 'GLOBAL_EQUITY'
  | 'US_INVESTMENT_GRADE_BONDS'
  | 'US_HIGH_YIELD_BONDS'
  | 'INTERNATIONAL_BONDS'
  | 'MUNICIPAL_BONDS'
  | 'TIPS'
  | 'REAL_ESTATE'
  | 'COMMODITIES'
  | 'ALTERNATIVES'
  | 'CASH'
  | 'OTHER';

export type AllocationEntityType = 'household' | 'account' | 'person';

export type FeeType = 'AUM' | 'FLAT' | 'HOURLY' | 'PERFORMANCE' | 'SUBSCRIPTION' | 'TRANSACTION';

export type FeeFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export type BillingMethod = 'ADVANCE' | 'ARREARS';

export interface AllocationLineItem {
  id: string;
  assetClass: AssetClass;
  targetPercentage: number;
  minPercentage?: number;
  maxPercentage?: number;
  notes?: string;
}

export interface TargetAssetAllocation {
  id: string;
  firmId: string;
  entityType: AllocationEntityType;
  householdId?: string;
  accountId?: string;
  personId?: string;
  name: string;
  description?: string;
  lineItems: AllocationLineItem[];
  isActive: boolean;
  effectiveDate: string;
  expirationDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeTier {
  id: string;
  minValue: number;
  maxValue?: number;
  rate: number;
  flatFee?: number;
}

export interface FeeSchedule {
  id: string;
  firmId: string;
  entityType: AllocationEntityType;
  householdId?: string;
  accountId?: string;
  personId?: string;
  name: string;
  description?: string;
  feeType: FeeType;
  frequency: FeeFrequency;
  billingMethod: BillingMethod;
  tiers: FeeTier[];
  minimumFee?: number;
  maximumFee?: number;
  isActive: boolean;
  effectiveDate: string;
  expirationDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeHistory {
  id: string;
  feeScheduleId: string;
  entityType: AllocationEntityType;
  householdId?: string;
  accountId?: string;
  personId?: string;
  periodStart: string;
  periodEnd: string;
  billableAmount: number;
  feeAmount: number;
  notes?: string;
  billedAt?: string;
  invoiceNumber?: string;
  createdById: string;
  createdAt: string;
}

export interface FeeCalculationResult {
  totalFee: number;
  breakdown: Array<{
    tier: FeeTier;
    amountInTier: number;
    feeForTier: number;
  }>;
  effectiveRate: number;
  scheduleId: string;
  scheduleName: string;
  feeType: FeeType;
}

// ==================== DTOs ====================

export interface CreateAllocationLineItemDto {
  assetClass: AssetClass;
  targetPercentage: number;
  minPercentage?: number;
  maxPercentage?: number;
  notes?: string;
}

export interface CreateTargetAllocationDto {
  entityType: AllocationEntityType;
  householdId?: string;
  accountId?: string;
  personId?: string;
  name: string;
  description?: string;
  lineItems: CreateAllocationLineItemDto[];
  effectiveDate?: string;
  expirationDate?: string;
}

export interface UpdateTargetAllocationDto {
  name?: string;
  description?: string;
  lineItems?: CreateAllocationLineItemDto[];
  isActive?: boolean;
  effectiveDate?: string;
  expirationDate?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface CreateFeeTierDto {
  minValue: number;
  maxValue?: number;
  rate: number;
  flatFee?: number;
}

export interface CreateFeeScheduleDto {
  entityType: AllocationEntityType;
  householdId?: string;
  accountId?: string;
  personId?: string;
  name: string;
  description?: string;
  feeType: FeeType;
  frequency: FeeFrequency;
  billingMethod: BillingMethod;
  tiers: CreateFeeTierDto[];
  minimumFee?: number;
  maximumFee?: number;
  effectiveDate?: string;
  expirationDate?: string;
}

export interface UpdateFeeScheduleDto {
  name?: string;
  description?: string;
  feeType?: FeeType;
  frequency?: FeeFrequency;
  billingMethod?: BillingMethod;
  tiers?: CreateFeeTierDto[];
  minimumFee?: number;
  maximumFee?: number;
  isActive?: boolean;
  effectiveDate?: string;
  expirationDate?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface CalculateFeeDto {
  feeScheduleId: string;
  billableAmount: number;
}

export interface RecordFeeHistoryDto {
  feeScheduleId: string;
  entityType: AllocationEntityType;
  householdId?: string;
  accountId?: string;
  personId?: string;
  periodStart: string;
  periodEnd: string;
  billableAmount: number;
  feeAmount: number;
  notes?: string;
}

// ==================== Asset Class Display Mapping ====================

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  US_LARGE_CAP: 'US Large Cap',
  US_MID_CAP: 'US Mid Cap',
  US_SMALL_CAP: 'US Small Cap',
  INTERNATIONAL_DEVELOPED: 'Int\'l Developed',
  INTERNATIONAL_EMERGING: 'Int\'l Emerging',
  GLOBAL_EQUITY: 'Global Equity',
  US_INVESTMENT_GRADE_BONDS: 'US Investment Grade Bonds',
  US_HIGH_YIELD_BONDS: 'US High Yield Bonds',
  INTERNATIONAL_BONDS: 'International Bonds',
  MUNICIPAL_BONDS: 'Municipal Bonds',
  TIPS: 'TIPS',
  REAL_ESTATE: 'Real Estate',
  COMMODITIES: 'Commodities',
  ALTERNATIVES: 'Alternatives',
  CASH: 'Cash',
  OTHER: 'Other',
};

export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  US_LARGE_CAP: '#2563eb',
  US_MID_CAP: '#3b82f6',
  US_SMALL_CAP: '#60a5fa',
  INTERNATIONAL_DEVELOPED: '#059669',
  INTERNATIONAL_EMERGING: '#10b981',
  GLOBAL_EQUITY: '#34d399',
  US_INVESTMENT_GRADE_BONDS: '#7c3aed',
  US_HIGH_YIELD_BONDS: '#8b5cf6',
  INTERNATIONAL_BONDS: '#a78bfa',
  MUNICIPAL_BONDS: '#c4b5fd',
  TIPS: '#d8b4fe',
  REAL_ESTATE: '#ea580c',
  COMMODITIES: '#f59e0b',
  ALTERNATIVES: '#84cc16',
  CASH: '#6b7280',
  OTHER: '#9ca3af',
};

export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  AUM: 'Assets Under Management',
  FLAT: 'Flat Fee',
  HOURLY: 'Hourly Rate',
  PERFORMANCE: 'Performance Fee',
  SUBSCRIPTION: 'Subscription',
  TRANSACTION: 'Transaction Fee',
};

export const FEE_FREQUENCY_LABELS: Record<FeeFrequency, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  SEMI_ANNUAL: 'Semi-Annual',
  ANNUAL: 'Annual',
};

// ==================== API Functions ====================

// Target Asset Allocations
export async function createTargetAllocation(dto: CreateTargetAllocationDto): Promise<TargetAssetAllocation> {
  const response = await api.post('/allocations/target', dto);
  return response.data.allocation;
}

export async function getTargetAllocations(query?: {
  entityType?: AllocationEntityType;
  householdId?: string;
  accountId?: string;
  personId?: string;
  isActive?: boolean;
}): Promise<{ allocations: TargetAssetAllocation[]; total: number }> {
  const response = await api.get('/allocations/target', { params: query });
  return response.data;
}

export async function getTargetAllocation(id: string): Promise<TargetAssetAllocation> {
  const response = await api.get(`/allocations/target/${id}`);
  return response.data;
}

export async function updateTargetAllocation(id: string, dto: UpdateTargetAllocationDto): Promise<TargetAssetAllocation> {
  const response = await api.put(`/allocations/target/${id}`, dto);
  return response.data.allocation;
}

export async function deleteTargetAllocation(id: string): Promise<void> {
  await api.delete(`/allocations/target/${id}`);
}

// Entity-specific allocation shortcuts
export async function getHouseholdAllocation(householdId: string): Promise<TargetAssetAllocation | null> {
  const response = await api.get(`/allocations/households/${householdId}/target`);
  return response.data.allocation || response.data;
}

export async function getAccountAllocation(accountId: string): Promise<TargetAssetAllocation | null> {
  const response = await api.get(`/allocations/accounts/${accountId}/target`);
  return response.data.allocation || response.data;
}

export async function getPersonAllocation(personId: string): Promise<TargetAssetAllocation | null> {
  const response = await api.get(`/allocations/persons/${personId}/target`);
  return response.data.allocation || response.data;
}

// Fee Schedules
export async function createFeeSchedule(dto: CreateFeeScheduleDto): Promise<FeeSchedule> {
  const response = await api.post('/allocations/fees', dto);
  return response.data.feeSchedule;
}

export async function getFeeSchedules(query?: {
  entityType?: AllocationEntityType;
  householdId?: string;
  accountId?: string;
  personId?: string;
  feeType?: FeeType;
  isActive?: boolean;
}): Promise<{ feeSchedules: FeeSchedule[]; total: number }> {
  const response = await api.get('/allocations/fees', { params: query });
  return response.data;
}

export async function getFeeSchedule(id: string): Promise<FeeSchedule> {
  const response = await api.get(`/allocations/fees/${id}`);
  return response.data;
}

export async function updateFeeSchedule(id: string, dto: UpdateFeeScheduleDto): Promise<FeeSchedule> {
  const response = await api.put(`/allocations/fees/${id}`, dto);
  return response.data.feeSchedule;
}

export async function deleteFeeSchedule(id: string): Promise<void> {
  await api.delete(`/allocations/fees/${id}`);
}

// Entity-specific fee schedule shortcuts
export async function getHouseholdFeeSchedule(householdId: string): Promise<FeeSchedule | null> {
  const response = await api.get(`/allocations/households/${householdId}/fees`);
  return response.data.feeSchedule || response.data;
}

export async function getAccountFeeSchedule(accountId: string): Promise<FeeSchedule | null> {
  const response = await api.get(`/allocations/accounts/${accountId}/fees`);
  return response.data.feeSchedule || response.data;
}

export async function getPersonFeeSchedule(personId: string): Promise<FeeSchedule | null> {
  const response = await api.get(`/allocations/persons/${personId}/fees`);
  return response.data.feeSchedule || response.data;
}

// Fee Calculation
export async function calculateFee(dto: CalculateFeeDto): Promise<FeeCalculationResult> {
  const response = await api.post('/allocations/fees/calculate', dto);
  return response.data;
}

// Fee History
export async function recordFeeHistory(dto: RecordFeeHistoryDto): Promise<FeeHistory> {
  const response = await api.post('/allocations/fees/history', dto);
  return response.data.history;
}

export async function getHouseholdFeeHistory(householdId: string, limit?: number): Promise<FeeHistory[]> {
  const response = await api.get(`/allocations/households/${householdId}/fees/history`, { params: { limit } });
  return response.data.history;
}

export async function getAccountFeeHistory(accountId: string, limit?: number): Promise<FeeHistory[]> {
  const response = await api.get(`/allocations/accounts/${accountId}/fees/history`, { params: { limit } });
  return response.data.history;
}

export async function getPersonFeeHistory(personId: string, limit?: number): Promise<FeeHistory[]> {
  const response = await api.get(`/allocations/persons/${personId}/fees/history`, { params: { limit } });
  return response.data.history;
}

export async function markFeeAsBilled(historyId: string, invoiceNumber: string): Promise<FeeHistory> {
  const response = await api.patch(`/allocations/fees/history/${historyId}/billed`, { invoiceNumber });
  return response.data.history;
}

// Utility Functions
export function getTotalPercentage(lineItems: CreateAllocationLineItemDto[]): number {
  return lineItems.reduce((sum, item) => sum + item.targetPercentage, 0);
}

export function validateAllocation(lineItems: CreateAllocationLineItemDto[]): { valid: boolean; error?: string } {
  const total = getTotalPercentage(lineItems);
  if (Math.abs(total - 100) > 0.01) {
    return { valid: false, error: `Allocations must sum to 100%. Current total: ${total.toFixed(2)}%` };
  }
  
  for (const item of lineItems) {
    if (item.minPercentage !== undefined && item.targetPercentage < item.minPercentage) {
      return { valid: false, error: `${ASSET_CLASS_LABELS[item.assetClass]} is below minimum (${item.minPercentage}%)` };
    }
    if (item.maxPercentage !== undefined && item.targetPercentage > item.maxPercentage) {
      return { valid: false, error: `${ASSET_CLASS_LABELS[item.assetClass]} exceeds maximum (${item.maxPercentage}%)` };
    }
  }
  
  return { valid: true };
}

export function formatFeeAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(rate: number, decimals = 2): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

export function formatBasisPoints(rate: number): string {
  return `${(rate * 10000).toFixed(0)} bps`;
}
