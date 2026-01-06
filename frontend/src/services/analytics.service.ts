import api from './api';

export interface AdvisorDashboard {
  overview: {
    totalHouseholds: number;
    totalAum: number;
    mtdRevenue: number;
    ytdRevenue: number;
    pipelineValue: number;
    tasksOverdue: number;
    meetingsThisWeek: number;
    reviewsDue: number;
  };
  recentActivity: {
    tasksCompleted: number;
    meetingsCompleted: number;
    emailsSent: number;
    newProspects: number;
  };
  goals: {
    revenueTarget: number;
    revenueActual: number;
    revenueProgress: number;
    meetingsTarget: number;
    meetingsActual: number;
    meetingsProgress: number;
    newClientsTarget: number;
    newClientsActual: number;
    newClientsProgress: number;
  };
  topClients: {
    householdId: string;
    householdName: string;
    aum: number;
    revenue: number;
    lastContact: string;
  }[];
  upcomingMeetings: {
    id: string;
    title: string;
    householdId?: string;
    householdName: string;
    startTime: string;
    type: string;
  }[];
  alerts: {
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    count?: number;
  }[];
}

export interface ClientProfitability {
  householdId: string;
  householdName: string;
  tier: string;
  aum: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  netMargin: number;
  revenuePerHour: number;
  profitPerHour: number;
  totalHours: number;
  effectiveFeeRate: number;
  profitabilityScore: number;
}

export interface FirmOverview {
  aum: {
    total: number;
    change: number;
    changePercent: number;
    netNewAssets: number;
    marketChange: number;
  };
  revenue: {
    mtd: number;
    ytd: number;
    projectedAnnual: number;
    changePercent: number;
  };
  clients: {
    total: number;
    new: number;
    lost: number;
    retentionRate: number;
    averageAum: number;
  };
  efficiency: {
    revenuePerAdvisor: number;
    aumPerAdvisor: number;
    householdsPerAdvisor: number;
    operatingMargin: number;
  };
  compliance: {
    overdueReviews: number;
    expiringKyc: number;
    openIssues: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  dueDate?: string;
  householdId?: string;
  assignedToId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  location?: string;
  householdId?: string;
}

export const analyticsService = {
  // Dashboard
  async getDashboard(startDate?: string, endDate?: string): Promise<AdvisorDashboard> {
    const now = new Date();
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (!startDate) params.startDate = new Date(now.getFullYear(), 0, 1).toISOString();
    if (!endDate) params.endDate = now.toISOString();
    
    const response = await api.get('/analytics/dashboard', { params });
    return response.data;
  },

  // Client Profitability
  async getClientProfitability(filters?: {
    startDate?: string;
    endDate?: string;
    tier?: string;
  }): Promise<ClientProfitability[]> {
    const now = new Date();
    const params: any = {
      startDate: filters?.startDate || new Date(now.getFullYear(), 0, 1).toISOString(),
      endDate: filters?.endDate || now.toISOString(),
    };
    if (filters?.tier) params.tier = filters.tier;
    
    const response = await api.get('/analytics/profitability', { params });
    return response.data;
  },

  async getHouseholdProfitability(householdId: string): Promise<ClientProfitability> {
    const response = await api.get(`/analytics/profitability/household/${householdId}`);
    return response.data;
  },

  // Firm Overview
  async getFirmOverview(startDate?: string, endDate?: string): Promise<FirmOverview> {
    const now = new Date();
    const params: any = {
      startDate: startDate || new Date(now.getFullYear(), 0, 1).toISOString(),
      endDate: endDate || now.toISOString(),
    };
    
    const response = await api.get('/analytics/firm/overview', { params });
    return response.data;
  },

  // Goals
  async updateGoals(goals: {
    revenueTarget?: number;
    meetingsTarget?: number;
    newClientsTarget?: number;
    aumTarget?: number;
  }): Promise<void> {
    await api.patch('/analytics/goals', goals);
  },
};

export const tasksService = {
  async getTasks(filters?: { status?: string; priority?: string; category?: string }): Promise<Task[]> {
    const response = await api.get('/api/tasks', { params: filters });
    return response.data;
  },

  async getMyTasks(): Promise<Task[]> {
    const response = await api.get('/api/tasks/my-tasks');
    return response.data;
  },

  async getOverdueTasks(): Promise<Task[]> {
    const response = await api.get('/api/tasks/overdue');
    return response.data;
  },

  async getTaskStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    dueSoon: number;
  }> {
    const response = await api.get('/api/tasks/stats');
    return response.data;
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    const response = await api.post('/api/tasks', task);
    return response.data;
  },

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const response = await api.put(`/api/tasks/${id}`, task);
    return response.data;
  },

  async completeTask(id: string): Promise<Task> {
    const response = await api.put(`/api/tasks/${id}/complete`);
    return response.data;
  },
};

export const meetingsService = {
  async getMeetings(filters?: { startDate?: string; endDate?: string }): Promise<Meeting[]> {
    const response = await api.get('/api/meetings', { params: filters });
    return response.data;
  },

  async getTodaysMeetings(): Promise<Meeting[]> {
    const response = await api.get('/api/meetings/today');
    return response.data;
  },

  async getUpcomingMeetings(days?: number): Promise<Meeting[]> {
    const response = await api.get('/api/meetings/upcoming', { params: { days: days || 7 } });
    return response.data;
  },

  async getMeetingStats(): Promise<{
    totalThisMonth: number;
    byType: Record<string, number>;
    completedThisMonth: number;
    cancelledThisMonth: number;
    averageDuration: number;
  }> {
    const response = await api.get('/api/meetings/stats');
    return response.data;
  },

  async createMeeting(meeting: Partial<Meeting>): Promise<Meeting> {
    const response = await api.post('/api/meetings', meeting);
    return response.data;
  },
};

export const pipelineService = {
  async getProspects(filters?: { stage?: string }): Promise<any[]> {
    const response = await api.get('/api/pipeline/prospects', { params: filters });
    return response.data;
  },

  async getPipelineStats(): Promise<{
    totalProspects: number;
    byStage: Record<string, number>;
    totalPipelineValue: number;
    conversionRate: number;
    averageDaysInPipeline: number;
    followUpsDue: number;
  }> {
    const response = await api.get('/api/pipeline/analytics');
    return response.data;
  },
};
