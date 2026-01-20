'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Users,
  DollarSign, Calendar, ChevronRight, ArrowUpRight, ArrowDownRight,
  Sparkles, Activity, Eye, Clock, RefreshCw, Filter, Download,
  BarChart3, PieChart, Zap, Star, Shield, Bell, CheckCircle,
  XCircle, Lightbulb, MessageSquare, Phone, Mail, FileText
} from 'lucide-react';

// Types
interface ChurnPrediction {
  clientId: string;
  clientName: string;
  householdAUM: number;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryFactors: string[];
  recommendedActions: string[];
  lastContact: Date;
  sentimentScore: number;
  engagementTrend: 'improving' | 'stable' | 'declining';
}

interface OpportunityScore {
  clientId: string;
  clientName: string;
  currentAUM: number;
  opportunityType: 'cross-sell' | 'upsell' | 'referral' | 'consolidation';
  score: number;
  potentialValue: number;
  confidence: number;
  triggers: string[];
  bestApproach: string;
  timing: 'immediate' | 'short-term' | 'long-term';
}

interface MarketCorrelation {
  clientId: string;
  clientName: string;
  marketSensitivity: number;
  volatilityTolerance: number;
  correlatedEvents: string[];
  predictedBehavior: string;
  riskScore: number;
}

interface BehavioralInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'prediction';
  title: string;
  description: string;
  affectedClients: number;
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
  impact: 'high' | 'medium' | 'low';
  createdAt: Date;
}

interface RevenueProjection {
  month: string;
  projected: number;
  actual?: number;
  confidence: number;
}

// Mock Data
const mockChurnPredictions: ChurnPrediction[] = [
  {
    clientId: '1', clientName: 'Thompson Family Trust', householdAUM: 4250000,
    churnProbability: 0.78, riskLevel: 'critical',
    primaryFactors: ['No contact in 90+ days', 'Negative market sentiment', 'Recent competitor inquiry'],
    recommendedActions: ['Schedule immediate review call', 'Prepare performance summary', 'Offer fee review'],
    lastContact: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), sentimentScore: 0.32, engagementTrend: 'declining'
  },
  {
    clientId: '2', clientName: 'Dr. Sarah Mitchell', householdAUM: 1850000,
    churnProbability: 0.65, riskLevel: 'high',
    primaryFactors: ['Missed last quarterly review', 'Decreased login frequency', 'Life event detected'],
    recommendedActions: ['Personal outreach from advisor', 'Review beneficiary designations', 'Discuss retirement timeline'],
    lastContact: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), sentimentScore: 0.48, engagementTrend: 'declining'
  },
  {
    clientId: '3', clientName: 'Martinez Holdings LLC', householdAUM: 8750000,
    churnProbability: 0.42, riskLevel: 'medium',
    primaryFactors: ['Business transition underway', 'Questions about alternative investments'],
    recommendedActions: ['Schedule business succession planning meeting', 'Introduce alternative investment options'],
    lastContact: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), sentimentScore: 0.61, engagementTrend: 'stable'
  },
  {
    clientId: '4', clientName: 'Chen Retirement Account', householdAUM: 2100000,
    churnProbability: 0.18, riskLevel: 'low',
    primaryFactors: ['High engagement', 'Recent positive feedback'],
    recommendedActions: ['Continue regular touchpoints', 'Ask for referrals'],
    lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), sentimentScore: 0.89, engagementTrend: 'improving'
  },
];

const mockOpportunities: OpportunityScore[] = [
  {
    clientId: '1', clientName: 'Williams Family Office', currentAUM: 12500000,
    opportunityType: 'cross-sell', score: 94, potentialValue: 850000, confidence: 0.87,
    triggers: ['Recent inheritance', 'Expressed interest in estate planning', 'Children approaching college age'],
    bestApproach: 'Comprehensive family wealth review focusing on multi-generational planning',
    timing: 'immediate'
  },
  {
    clientId: '2', clientName: 'Dr. James Parker', currentAUM: 3200000,
    opportunityType: 'consolidation', score: 88, potentialValue: 1200000, confidence: 0.82,
    triggers: ['Multiple 401k accounts detected', 'Recently changed jobs', 'Mentioned other advisors'],
    bestApproach: 'Offer consolidation benefits analysis with fee comparison',
    timing: 'short-term'
  },
  {
    clientId: '3', clientName: 'Anderson Trust', currentAUM: 5800000,
    opportunityType: 'referral', score: 91, potentialValue: 2500000, confidence: 0.79,
    triggers: ['High NPS score', 'Recent positive review', 'Active in community organizations'],
    bestApproach: 'Personal thank you with soft referral ask',
    timing: 'immediate'
  },
  {
    clientId: '4', clientName: 'Rivera Enterprises', currentAUM: 7200000,
    opportunityType: 'upsell', score: 76, potentialValue: 500000, confidence: 0.74,
    triggers: ['Business growth detected', 'Cash reserves increasing', 'Tax optimization questions'],
    bestApproach: 'Business cash management and tax-advantaged investment strategies',
    timing: 'short-term'
  },
];

const mockBehavioralInsights: BehavioralInsight[] = [
  {
    id: '1', type: 'pattern', title: 'Increased Tax-Related Queries',
    description: 'AI detected a 340% increase in tax-related document views and searches across 23 clients in the past 2 weeks.',
    affectedClients: 23, confidence: 0.92, actionable: true,
    suggestedAction: 'Proactively reach out with tax planning resources and year-end strategy sessions',
    impact: 'high', createdAt: new Date()
  },
  {
    id: '2', type: 'anomaly', title: 'Unusual Login Patterns Detected',
    description: '5 high-value clients showing after-hours portal access, potentially indicating concerns or urgency.',
    affectedClients: 5, confidence: 0.85, actionable: true,
    suggestedAction: 'Priority outreach to understand concerns and provide reassurance',
    impact: 'high', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3', type: 'trend', title: 'Rising Interest in ESG Investments',
    description: 'Machine learning model identified growing ESG/sustainable investing interest among millennial clients.',
    affectedClients: 34, confidence: 0.88, actionable: true,
    suggestedAction: 'Develop targeted ESG portfolio options and educational content',
    impact: 'medium', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '4', type: 'prediction', title: 'Q2 Inflow Forecast Strong',
    description: 'Based on client behavior patterns and historical data, Q2 net inflows predicted at $12.4M (89% confidence).',
    affectedClients: 0, confidence: 0.89, actionable: false,
    impact: 'medium', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
];

const mockRevenueProjections: RevenueProjection[] = [
  { month: 'Jan', projected: 485000, actual: 492000, confidence: 0.95 },
  { month: 'Feb', projected: 478000, actual: 471000, confidence: 0.93 },
  { month: 'Mar', projected: 512000, actual: 508000, confidence: 0.91 },
  { month: 'Apr', projected: 498000, confidence: 0.88 },
  { month: 'May', projected: 525000, confidence: 0.84 },
  { month: 'Jun', projected: 542000, confidence: 0.79 },
];

// Utility functions
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;
const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);

// Sub-components
const ChurnRiskPanel: React.FC<{ predictions: ChurnPrediction[] }> = ({ predictions }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const riskColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };

  const riskBgColors = {
    critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    high: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    medium: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    low: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  };

  const sortedPredictions = [...predictions].sort((a, b) => b.churnProbability - a.churnProbability);
  const atRiskAUM = predictions.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high')
    .reduce((sum, p) => sum + p.householdAUM, 0);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">At Risk AUM</span>
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(atRiskAUM)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 mb-1">Critical Risk</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {predictions.filter(p => p.riskLevel === 'critical').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 mb-1">High Risk</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {predictions.filter(p => p.riskLevel === 'high').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 mb-1">Avg Confidence</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">87%</p>
        </div>
      </div>

      {/* Risk List */}
      <div className="space-y-3">
        {sortedPredictions.map((prediction) => (
          <motion.div
            key={prediction.clientId}
            layout
            className={`rounded-xl border overflow-hidden ${riskBgColors[prediction.riskLevel]}`}
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === prediction.clientId ? null : prediction.clientId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${riskColors[prediction.riskLevel]}`} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{prediction.clientName}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(prediction.householdAUM)} AUM</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPercent(prediction.churnProbability)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{prediction.riskLevel} risk</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === prediction.clientId ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {/* Sentiment & Engagement */}
              <div className="flex items-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Sentiment: {formatPercent(prediction.sentimentScore)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {prediction.engagementTrend === 'declining' ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : prediction.engagementTrend === 'improving' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <Activity className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {prediction.engagementTrend}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Last contact: {formatDate(prediction.lastContact)}
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedId === prediction.clientId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Risk Factors</p>
                      <div className="flex flex-wrap gap-2">
                        {prediction.primaryFactors.map((factor, idx) => (
                          <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-xs">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recommended Actions</p>
                      <ul className="space-y-2">
                        {prediction.recommendedActions.map((action, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                        <Phone className="w-4 h-4" /> Call
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Mail className="w-4 h-4" /> Email
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Calendar className="w-4 h-4" /> Schedule
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const OpportunityScoringPanel: React.FC<{ opportunities: OpportunityScore[] }> = ({ opportunities }) => {
  const [filterType, setFilterType] = useState<OpportunityScore['opportunityType'] | 'all'>('all');

  const filteredOpportunities = filterType === 'all' 
    ? opportunities 
    : opportunities.filter(o => o.opportunityType === filterType);

  const totalPotential = opportunities.reduce((sum, o) => sum + o.potentialValue, 0);

  const typeIcons = {
    'cross-sell': Target,
    'upsell': TrendingUp,
    'referral': Users,
    'consolidation': PieChart
  };

  const typeColors = {
    'cross-sell': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    'upsell': 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    'referral': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'consolidation': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
  };

  const timingColors = {
    immediate: 'bg-green-500',
    'short-term': 'bg-yellow-500',
    'long-term': 'bg-blue-500'
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-green-100">Total Opportunity Value</span>
        </div>
        <p className="text-3xl font-bold">{formatCurrency(totalPotential)}</p>
        <p className="text-green-100 text-sm mt-1">{opportunities.length} opportunities identified</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'cross-sell', 'upsell', 'referral', 'consolidation'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type as typeof filterType)}
            className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
              filterType === type
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {type === 'all' ? 'All Types' : type}
          </button>
        ))}
      </div>

      {/* Opportunities List */}
      <div className="space-y-3">
        {filteredOpportunities.sort((a, b) => b.score - a.score).map((opportunity) => {
          const Icon = typeIcons[opportunity.opportunityType];
          return (
            <motion.div
              key={opportunity.clientId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[opportunity.opportunityType]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{opportunity.clientName}</p>
                    <p className="text-sm text-gray-500">Current AUM: {formatCurrency(opportunity.currentAUM)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{opportunity.score}</span>
                    <span className="text-sm text-gray-500">/100</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-2 h-2 rounded-full ${timingColors[opportunity.timing]}`} />
                    <span className="text-xs text-gray-500 capitalize">{opportunity.timing}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 dark:text-green-400">Potential Value</span>
                  <span className="font-bold text-green-700 dark:text-green-400">{formatCurrency(opportunity.potentialValue)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-green-700 dark:text-green-400">Confidence</span>
                  <span className="text-sm text-green-700 dark:text-green-400">{formatPercent(opportunity.confidence)}</span>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Triggers</p>
                <div className="flex flex-wrap gap-1">
                  {opportunity.triggers.map((trigger, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">{opportunity.bestApproach}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const BehavioralInsightsPanel: React.FC<{ insights: BehavioralInsight[] }> = ({ insights }) => {
  const typeIcons = {
    pattern: BarChart3,
    anomaly: AlertTriangle,
    trend: TrendingUp,
    prediction: Brain
  };

  const typeColors = {
    pattern: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    anomaly: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    trend: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    prediction: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
  };

  const impactColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-900 dark:text-white">AI-Generated Insights</span>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const Icon = typeIcons[insight.type];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[insight.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{insight.title}</p>
                    <div className={`w-2 h-2 rounded-full ${impactColors[insight.impact]}`} title={`${insight.impact} impact`} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{insight.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {formatPercent(insight.confidence)} confidence
                    </span>
                    {insight.affectedClients > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {insight.affectedClients} clients
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(insight.createdAt)}
                    </span>
                  </div>

                  {insight.actionable && insight.suggestedAction && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Suggested Action</p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{insight.suggestedAction}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const RevenueProjectionChart: React.FC<{ projections: RevenueProjection[] }> = ({ projections }) => {
  const maxValue = Math.max(...projections.map(p => Math.max(p.projected, p.actual || 0)));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Projections</h3>
          <p className="text-sm text-gray-500">AI-powered forecast with confidence intervals</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="flex items-end gap-4 h-48">
        {projections.map((projection, idx) => (
          <div key={projection.month} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex justify-center gap-1 h-40 items-end">
              {/* Projected bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(projection.projected / maxValue) * 100}%` }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="w-6 bg-blue-200 dark:bg-blue-900 rounded-t relative group"
                style={{ opacity: 0.3 + projection.confidence * 0.7 }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Projected: {formatCurrency(projection.projected)}
                </div>
              </motion.div>
              {/* Actual bar */}
              {projection.actual && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(projection.actual / maxValue) * 100}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.1 + 0.1 }}
                  className="w-6 bg-green-500 rounded-t relative group"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Actual: {formatCurrency(projection.actual)}
                  </div>
                </motion.div>
              )}
            </div>
            <span className="text-xs text-gray-500">{projection.month}</span>
            <span className="text-xs text-gray-400">{formatPercent(projection.confidence)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-200 dark:bg-blue-900 rounded" />
          <span className="text-sm text-gray-500">Projected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-sm text-gray-500">Actual</span>
        </div>
      </div>
    </div>
  );
};

// Main Component
export const PredictiveAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'churn' | 'opportunities' | 'insights' | 'projections'>('churn');

  const tabs: Array<{ id: typeof activeTab; label: string; icon: React.ElementType; color: string }> = [
    { id: 'churn', label: 'Churn Risk', icon: AlertTriangle, color: 'text-red-600' },
    { id: 'opportunities', label: 'Opportunities', icon: Target, color: 'text-green-600' },
    { id: 'insights', label: 'Behavioral Insights', icon: Brain, color: 'text-purple-600' },
    { id: 'projections', label: 'Projections', icon: TrendingUp, color: 'text-blue-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            Predictive Analytics
          </h1>
          <p className="text-gray-500 mt-1">AI-powered insights for proactive client management</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
            <Sparkles className="w-4 h-4" /> Model accuracy: 94.2%
          </span>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
            <RefreshCw className="w-4 h-4" /> Retrain Model
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? `border-current ${tab.color}`
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'churn' && (
          <motion.div
            key="churn"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ChurnRiskPanel predictions={mockChurnPredictions} />
          </motion.div>
        )}

        {activeTab === 'opportunities' && (
          <motion.div
            key="opportunities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <OpportunityScoringPanel opportunities={mockOpportunities} />
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BehavioralInsightsPanel insights={mockBehavioralInsights} />
          </motion.div>
        )}

        {activeTab === 'projections' && (
          <motion.div
            key="projections"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <RevenueProjectionChart projections={mockRevenueProjections} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compliance Disclaimer */}
      <div className="mt-6 p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          <strong className="text-neutral-600 dark:text-neutral-300">Important Disclosure:</strong> The analytics and projections displayed are based on historical patterns and statistical models for internal operational use only. These are not predictions of future results, investment advice, or guarantees of any outcomes. Past performance and model outputs do not guarantee future results. All business decisions should involve independent analysis and professional judgment. Model accuracy metrics reflect historical backtesting and may not indicate future performance.
        </p>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
