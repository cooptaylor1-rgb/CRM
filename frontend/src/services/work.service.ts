import api, { parseApiError } from './api';

export interface WorkSummary {
  now: string;
  tasks: {
    overdue: any[];
    dueToday: any[];
  };
  moneyMovements: {
    needsAttention: any[];
  };
  meetings: {
    today: any[];
  };
  prospects: {
    dueFollowUp: any[];
  };
}

export const workService = {
  async getSummary(): Promise<WorkSummary> {
    try {
      const res = await api.get<WorkSummary>('/work/summary');
      return res.data;
    } catch (err) {
      throw parseApiError(err);
    }
  },
};
