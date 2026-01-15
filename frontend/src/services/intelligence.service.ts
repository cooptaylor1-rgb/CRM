import { api, parseApiError } from './api';

// =============================================================================
// Types
// =============================================================================

export type InsightType =
  | 'risk_alert'
  | 'opportunity'
  | 'life_event'
  | 'portfolio_drift'
  | 'rebalancing_needed'
  | 'tax_optimization'
  | 'fee_review'
  | 'engagement_drop'
  | 'milestone'
  | 'compliance_reminder'
  | 'market_impact'
  | 'estate_planning';

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type InsightStatus = 'new' | 'viewed' | 'acknowledged' | 'actioned' | 'dismissed' | 'expired';

export interface ClientInsight {
  id: string;
  householdId: string;
  type: InsightType;
  priority: InsightPriority;
  status: InsightStatus;
  title: string;
  description: string;
  data?: Record<string, unknown>;
  recommendedAction?: string;
  confidenceScore?: number;
  potentialImpact?: number;
  expiresAt?: string;
  actionedAt?: string;
  actionedBy?: string;
  actionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LifeEventType =
  | 'marriage'
  | 'divorce'
  | 'birth_of_child'
  | 'death_in_family'
  | 'child_graduation'
  | 'child_college'
  | 'retirement'
  | 'job_change'
  | 'business_sale'
  | 'promotion'
  | 'inheritance'
  | 'large_withdrawal'
  | 'large_deposit'
  | 'home_purchase'
  | 'home_sale'
  | 'major_illness'
  | 'disability'
  | 'long_term_care'
  | 'birthday_milestone'
  | 'account_anniversary'
  | 'aum_milestone'
  | 'estate_plan_update'
  | 'beneficiary_change'
  | 'rmd_approaching';

export type EventSource = 'detected' | 'reported' | 'advisor' | 'system';
export type EventImpact = 'critical' | 'high' | 'medium' | 'low';

export interface LifeEvent {
  id: string;
  householdId: string;
  personId?: string;
  eventType: LifeEventType;
  source: EventSource;
  impact: EventImpact;
  title: string;
  description?: string;
  eventDate: string;
  metadata?: Record<string, unknown>;
  recommendedActions?: string[];
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  confidenceScore?: number;
  createdAt: string;
  updatedAt: string;
  person?: { firstName: string; lastName: string };
  household?: { name: string };
}

export interface TalkingPoint {
  topic: string;
  context: string;
  suggestedApproach: string;
  priority: 'must_discuss' | 'should_discuss' | 'optional';
}

export interface ActionItem {
  item: string;
  dueDate: string | null;
  assignee: string | null;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface BriefSection {
  title: string;
  content: string;
  priority: number;
  type: 'summary' | 'detail' | 'action' | 'warning' | 'opportunity';
}

export interface PortfolioSnapshot {
  totalAum: number;
  ytdReturn: number;
  inceptionReturn: number;
  assetAllocation: { name: string; percentage: number; value: number }[];
  topHoldings: { symbol: string; name: string; value: number; weight: number }[];
  recentActivity: { date: string; type: string; description: string }[];
}

export interface ClientProfile {
  householdName: string;
  primaryContact: string;
  relationshipLength: string;
  riskTolerance: string;
  investmentObjective: string;
  lastMeetingDate: string | null;
  communicationPreference: string;
}

export interface MeetingBrief {
  id: string;
  householdId: string;
  meetingId?: string;
  meetingDate: string;
  meetingType?: string;
  purpose?: string;
  clientProfile: ClientProfile;
  portfolioSnapshot: PortfolioSnapshot;
  talkingPoints: TalkingPoint[];
  sections: BriefSection[];
  actionItems: ActionItem[];
  warnings?: string[];
  opportunities?: string[];
  executiveSummary?: string;
  generatedAt: string;
  generatedBy?: string;
  isViewed: boolean;
  viewedAt?: string;
  advisorNotes?: { note: string; addedAt: string; addedBy: string }[];
  createdAt: string;
  updatedAt: string;
  household?: { name: string };
}

export type RiskLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface RiskFactorScore {
  factor: string;
  score: number;
  weight: number;
  trend: 'improving' | 'stable' | 'declining';
  details: string;
}

export interface RiskCategory {
  category: string;
  score: number;
  factors: RiskFactorScore[];
}

export interface RiskScore {
  id: string;
  householdId: string;
  overallScore: number;
  riskLevel: RiskLevel;
  attritionScore: number;
  complianceScore: number;
  portfolioScore: number;
  engagementScore: number;
  riskCategories: RiskCategory[];
  keyFactors: string[];
  recommendations: string[];
  trendDirection?: 'improving' | 'stable' | 'declining';
  scoreChange?: number;
  calculatedAt: string;
  nextCalculationAt?: string;
  createdAt: string;
}

export interface InsightsDashboard {
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<string, number>;
  recentInsights: ClientInsight[];
}

export interface IntelligenceSummary {
  householdId: string;
  insights: {
    total: number;
    byPriority: { critical: number; high: number; medium: number; low: number };
    items: ClientInsight[];
  };
  lifeEvents: {
    total: number;
    unacknowledged: number;
    items: LifeEvent[];
  };
  riskScore: RiskScore | { message: string };
  recentBriefs: MeetingBrief[];
  generatedAt: string;
}

// =============================================================================
// UI Mappings
// =============================================================================

export const insightTypeLabels: Record<InsightType, string> = {
  risk_alert: 'Risk Alert',
  opportunity: 'Opportunity',
  life_event: 'Life Event',
  portfolio_drift: 'Portfolio Drift',
  rebalancing_needed: 'Rebalancing Needed',
  tax_optimization: 'Tax Optimization',
  fee_review: 'Fee Review',
  engagement_drop: 'Engagement Drop',
  milestone: 'Milestone',
  compliance_reminder: 'Compliance Reminder',
  market_impact: 'Market Impact',
  estate_planning: 'Estate Planning',
};

export const insightPriorityColors: Record<InsightPriority, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  info: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const lifeEventTypeLabels: Record<LifeEventType, string> = {
  marriage: 'Marriage',
  divorce: 'Divorce',
  birth_of_child: 'Birth of Child',
  death_in_family: 'Death in Family',
  child_graduation: 'Child Graduation',
  child_college: 'Child Going to College',
  retirement: 'Retirement',
  job_change: 'Job Change',
  business_sale: 'Business Sale',
  promotion: 'Promotion',
  inheritance: 'Inheritance',
  large_withdrawal: 'Large Withdrawal',
  large_deposit: 'Large Deposit',
  home_purchase: 'Home Purchase',
  home_sale: 'Home Sale',
  major_illness: 'Major Illness',
  disability: 'Disability',
  long_term_care: 'Long-Term Care',
  birthday_milestone: 'Birthday Milestone',
  account_anniversary: 'Account Anniversary',
  aum_milestone: 'AUM Milestone',
  estate_plan_update: 'Estate Plan Update',
  beneficiary_change: 'Beneficiary Change',
  rmd_approaching: 'RMD Approaching',
};

export const lifeEventTypeIcons: Record<LifeEventType, string> = {
  marriage: '💍',
  divorce: '💔',
  birth_of_child: '👶',
  death_in_family: '🕯️',
  child_graduation: '🎓',
  child_college: '🏫',
  retirement: '🏖️',
  job_change: '💼',
  business_sale: '🏢',
  promotion: '📈',
  inheritance: '📜',
  large_withdrawal: '💸',
  large_deposit: '💰',
  home_purchase: '🏠',
  home_sale: '🏡',
  major_illness: '🏥',
  disability: '♿',
  long_term_care: '🏥',
  birthday_milestone: '🎂',
  account_anniversary: '🎉',
  aum_milestone: '🏆',
  estate_plan_update: '📋',
  beneficiary_change: '👥',
  rmd_approaching: '⏰',
};

export const riskLevelLabels: Record<RiskLevel, string> = {
  very_low: 'Very Low',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
};

export const riskLevelColors: Record<RiskLevel, string> = {
  very_low: 'bg-green-100 text-green-800',
  low: 'bg-green-50 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  very_high: 'bg-red-100 text-red-800',
};

// =============================================================================
// API Functions
// =============================================================================

export const intelligenceService = {
  // Insights
  async getInsights(params?: {
    householdId?: string;
    type?: InsightType;
    priority?: InsightPriority;
    status?: InsightStatus;
    limit?: number;
  }): Promise<ClientInsight[]> {
    const { data } = await api.get('/intelligence/insights', { params });
    return data;
  },

  async getInsightsDashboard(): Promise<InsightsDashboard> {
    const { data } = await api.get('/intelligence/insights/dashboard');
    return data;
  },

  async createInsight(insight: Partial<ClientInsight>): Promise<ClientInsight> {
    const { data } = await api.post('/intelligence/insights', insight);
    return data;
  },

  async updateInsightStatus(
    id: string,
    status: InsightStatus,
    actionNotes?: string,
  ): Promise<ClientInsight> {
    const { data } = await api.patch(`/intelligence/insights/${id}/status`, {
      status,
      actionNotes,
    });
    return data;
  },

  async generateInsightsForHousehold(householdId: string): Promise<{
    message: string;
    count: number;
    insights: ClientInsight[];
  }> {
    const { data } = await api.post(`/intelligence/insights/generate/${householdId}`);
    return data;
  },

  // Life Events
  async getLifeEvents(params?: {
    householdId?: string;
    eventType?: LifeEventType;
    source?: EventSource;
    acknowledged?: 'true' | 'false';
    startDate?: string;
    endDate?: string;
  }): Promise<LifeEvent[]> {
    const { data } = await api.get('/intelligence/life-events', { params });
    return data;
  },

  async createLifeEvent(event: {
    householdId: string;
    personId?: string;
    eventType: LifeEventType;
    source?: EventSource;
    impact?: EventImpact;
    title: string;
    description?: string;
    eventDate: string;
    metadata?: Record<string, unknown>;
    recommendedActions?: string[];
  }): Promise<LifeEvent> {
    const { data } = await api.post('/intelligence/life-events', event);
    return data;
  },

  async acknowledgeLifeEvent(id: string): Promise<LifeEvent> {
    const { data } = await api.patch(`/intelligence/life-events/${id}/acknowledge`);
    return data;
  },

  async detectLifeEventsForHousehold(householdId: string): Promise<{
    message: string;
    count: number;
    events: LifeEvent[];
  }> {
    const { data } = await api.post(`/intelligence/life-events/detect/${householdId}`);
    return data;
  },

  // Meeting Briefs
  async getMeetingBriefs(params?: {
    householdId?: string;
    startDate?: string;
    endDate?: string;
    meetingType?: string;
  }): Promise<MeetingBrief[]> {
    const { data } = await api.get('/intelligence/briefs', { params });
    return data;
  },

  async getMeetingBrief(id: string, markViewed = false): Promise<MeetingBrief> {
    const { data } = await api.get(`/intelligence/briefs/${id}`, {
      params: { markViewed: markViewed ? 'true' : undefined },
    });
    return data;
  },

  async generateMeetingBrief(params: {
    householdId: string;
    meetingId?: string;
    meetingDate: string;
    meetingType?: string;
    purpose?: string;
    additionalTopics?: string[];
  }): Promise<MeetingBrief> {
    const { data } = await api.post('/intelligence/briefs/generate', params);
    return data;
  },

  async updateMeetingBrief(
    id: string,
    updates: {
      talkingPoints?: TalkingPoint[];
      actionItems?: ActionItem[];
      advisorNote?: { note: string };
    },
  ): Promise<MeetingBrief> {
    const { data } = await api.patch(`/intelligence/briefs/${id}`, updates);
    return data;
  },

  // Risk Scores
  async getRiskScore(householdId: string): Promise<RiskScore | null> {
    try {
      const { data } = await api.get(`/intelligence/risk-scores/${householdId}`);
      return data;
    } catch {
      return null;
    }
  },

  async getRiskScoreHistory(householdId: string, months = 12): Promise<RiskScore[]> {
    const { data } = await api.get(`/intelligence/risk-scores/${householdId}/history`, {
      params: { months },
    });
    return data;
  },

  async calculateRiskScore(householdId: string): Promise<RiskScore> {
    const { data } = await api.post(`/intelligence/risk-scores/${householdId}/calculate`);
    return data;
  },

  async getHighRiskHouseholds(limit = 20): Promise<{ household: { id: string; name: string }; riskScore: RiskScore }[]> {
    const { data } = await api.get('/intelligence/risk-scores/high-risk/households', {
      params: { limit },
    });
    return data;
  },

  // Summary
  async getHouseholdIntelligenceSummary(householdId: string): Promise<IntelligenceSummary> {
    const { data } = await api.get(`/intelligence/summary/${householdId}`);
    return data;
  },
};

export default intelligenceService;
