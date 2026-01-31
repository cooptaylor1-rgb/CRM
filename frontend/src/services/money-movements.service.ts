import api, { parseApiError } from './api';

// NOTE: Backend currently uses a global prefix "api" AND controller paths that include "api/...",
// so the effective backend routes are "/api/api/...".
// We call those routes here for correctness, and we can normalize later.
const BASE = '/api/money-movements';

export type MoneyMovementStatus =
  | 'requested'
  | 'in_review'
  | 'approved'
  | 'initiated'
  | 'submitted'
  | 'confirmed'
  | 'closed'
  | 'cancelled';

export type MoneyMovementType = 'wire' | 'ach' | 'journal' | 'distribution' | 'other';

export interface MoneyMovement {
  id: string;
  type: MoneyMovementType;
  status: MoneyMovementStatus;
  amount?: number;
  currency: string;
  title?: string;
  notes?: string;
  neededByDate?: string;
  createdAt?: string;
  updatedAt?: string;
  checklist?: any;
  initiationArtifacts?: any;
}

export interface CreateMoneyMovementDto {
  type: MoneyMovementType;
  amount?: number;
  currency?: string;
  title?: string;
  notes?: string;
  neededByDate?: string;
  checklist?: any;
  householdId?: string;
  personId?: string;
  accountId?: string;
}

class MoneyMovementsService {
  async list(): Promise<MoneyMovement[]> {
    try {
      const res = await api.get<MoneyMovement[]>(BASE);
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      throw parseApiError(err);
    }
  }

  async getById(id: string): Promise<MoneyMovement> {
    try {
      const res = await api.get<MoneyMovement>(`${BASE}/${id}`);
      return res.data;
    } catch (err) {
      throw parseApiError(err);
    }
  }

  async create(dto: CreateMoneyMovementDto): Promise<MoneyMovement> {
    try {
      const res = await api.post<MoneyMovement>(BASE, dto);
      return res.data;
    } catch (err) {
      throw parseApiError(err);
    }
  }
}

export const moneyMovementsService = new MoneyMovementsService();
