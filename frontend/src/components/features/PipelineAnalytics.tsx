'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  CalendarIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  DocumentArrowDownIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPES
// =============================================================================

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
}

interface StageMetrics {
  stageId: string;
  stageName: string;
  dealsCount: number;
  totalValue: number;
  avgDaysInStage: number;
  conversionRate: number; // % that move to next stage
  lossRate: number; // % that are lost at this stage
  avgDealSize: number;
  velocityTrend: 'improving' | 'stable' | 'declining';
}

interface PipelineSnapshot {
  date: string;
  stages: {
    stageId: string;
    dealsCount: number;
    totalValue: number;
  }[];
}

interface ForecastScenario {
  name: string;
  type: 'conservative' | 'realistic' | 'optimistic';
  probability: number;
  projectedRevenue: number;
  projectedDeals: number;
}

interface VelocityMetric {
  period: string;
  avgCycleTime: number; // days from lead to close
  avgTimePerStage: Record<string, number>;
  dealsAnalyzed: number;
}

interface ConversionFunnel {
  stage: string;
  entered: number;
  exited: number;
  converted: number;
  lost: number;
  conversionRate: number;
  dropOffRate: number;
}

interface RevenueProjection {
  month: string;
  projected: number;
  committed: number;
  bestCase: number;
  worstCase: number;
}

interface PipelineHealth {
  score: number; // 0-100
  status: 'healthy' | 'warning' | 'critical';
  issues: {
    type: 'velocity' | 'conversion' | 'coverage' | 'aging';
    severity: 'low' | 'medium' | 'high';
    message: string;
    recommendation: string;
  }[];
}

interface DateRange {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}

// =============================================================================
// SAMPLE DATA
// =============================================================================

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'lead', name: 'Lead', order: 1, color: '#6366f1' },
  { id: 'qualified', name: 'Qualified', order: 2, color: '#8b5cf6' },
  { id: 'proposal', name: 'Proposal', order: 3, color: '#a855f7' },
  { id: 'negotiation', name: 'Negotiation', order: 4, color: '#d946ef' },
  { id: 'closed_won', name: 'Closed Won', order: 5, color: '#22c55e' },
];

const SAMPLE_STAGE_METRICS: StageMetrics[] = [
  {
    stageId: 'lead',
    stageName: 'Lead',
    dealsCount: 45,
    totalValue: 2250000,
    avgDaysInStage: 5.2,
    conversionRate: 68,
    lossRate: 12,
    avgDealSize: 50000,
    velocityTrend: 'improving',
  },
  {
    stageId: 'qualified',
    stageName: 'Qualified',
    dealsCount: 32,
    totalValue: 1920000,
    avgDaysInStage: 8.7,
    conversionRate: 72,
    lossRate: 15,
    avgDealSize: 60000,
    velocityTrend: 'stable',
  },
  {
    stageId: 'proposal',
    stageName: 'Proposal',
    dealsCount: 24,
    totalValue: 1680000,
    avgDaysInStage: 12.3,
    conversionRate: 65,
    lossRate: 20,
    avgDealSize: 70000,
    velocityTrend: 'declining',
  },
  {
    stageId: 'negotiation',
    stageName: 'Negotiation',
    dealsCount: 16,
    totalValue: 1280000,
    avgDaysInStage: 15.8,
    conversionRate: 78,
    lossRate: 18,
    avgDealSize: 80000,
    velocityTrend: 'improving',
  },
  {
    stageId: 'closed_won',
    stageName: 'Closed Won',
    dealsCount: 12,
    totalValue: 1080000,
    avgDaysInStage: 0,
    conversionRate: 100,
    lossRate: 0,
    avgDealSize: 90000,
    velocityTrend: 'stable',
  },
];

const SAMPLE_VELOCITY_METRICS: VelocityMetric[] = [
  {
    period: 'Last 30 Days',
    avgCycleTime: 42,
    avgTimePerStage: { lead: 5, qualified: 9, proposal: 12, negotiation: 16 },
    dealsAnalyzed: 28,
  },
  {
    period: 'Last 60 Days',
    avgCycleTime: 45,
    avgTimePerStage: { lead: 6, qualified: 10, proposal: 13, negotiation: 16 },
    dealsAnalyzed: 52,
  },
  {
    period: 'Last 90 Days',
    avgCycleTime: 48,
    avgTimePerStage: { lead: 6, qualified: 11, proposal: 14, negotiation: 17 },
    dealsAnalyzed: 78,
  },
];

const SAMPLE_REVENUE_PROJECTIONS: RevenueProjection[] = [
  { month: 'Jan', projected: 850000, committed: 720000, bestCase: 980000, worstCase: 650000 },
  { month: 'Feb', projected: 920000, committed: 680000, bestCase: 1100000, worstCase: 580000 },
  { month: 'Mar', projected: 1050000, committed: 450000, bestCase: 1350000, worstCase: 380000 },
  { month: 'Apr', projected: 1180000, committed: 220000, bestCase: 1580000, worstCase: 180000 },
  { month: 'May', projected: 1320000, committed: 85000, bestCase: 1850000, worstCase: 65000 },
  { month: 'Jun', projected: 1450000, committed: 0, bestCase: 2100000, worstCase: 0 },
];

const SAMPLE_PIPELINE_HEALTH: PipelineHealth = {
  score: 72,
  status: 'warning',
  issues: [
    {
      type: 'velocity',
      severity: 'medium',
      message: 'Proposal stage velocity has declined 15% this month',
      recommendation: 'Review proposal process and identify bottlenecks',
    },
    {
      type: 'aging',
      severity: 'high',
      message: '8 deals have been stale for over 30 days',
      recommendation: 'Prioritize follow-up on aging deals or mark as lost',
    },
    {
      type: 'coverage',
      severity: 'low',
      message: 'Pipeline coverage is 2.8x quota (target: 3x)',
      recommendation: 'Increase prospecting activity to build pipeline',
    },
  ],
};

// =============================================================================
// DATE RANGE OPTIONS
// =============================================================================

const DATE_RANGES: DateRange[] = [
  {
    label: 'Last 7 Days',
    value: '7d',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  {
    label: 'Last 30 Days',
    value: '30d',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  {
    label: 'Last 90 Days',
    value: '90d',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  {
    label: 'This Quarter',
    value: 'quarter',
    startDate: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1),
    endDate: new Date(),
  },
  {
    label: 'This Year',
    value: 'year',
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getHealthColor(status: PipelineHealth['status']): string {
  switch (status) {
    case 'healthy':
      return 'text-status-success';
    case 'warning':
      return 'text-status-warning';
    case 'critical':
      return 'text-status-error';
    default:
      return 'text-neutral-500';
  }
}

function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low':
      return 'bg-status-info/10 text-status-info border-status-info/20';
    case 'medium':
      return 'bg-status-warning/10 text-status-warning border-status-warning/20';
    case 'high':
      return 'bg-status-error/10 text-status-error border-status-error/20';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

function getTrendIcon(trend: 'improving' | 'stable' | 'declining') {
  switch (trend) {
    case 'improving':
      return <ArrowTrendingUpIcon className="h-4 w-4 text-status-success" />;
    case 'declining':
      return <ArrowTrendingDownIcon className="h-4 w-4 text-status-error" />;
    default:
      return <ArrowPathIcon className="h-4 w-4 text-neutral-400" />;
  }
}

// =============================================================================
// CONVERSION FUNNEL COMPONENT
// =============================================================================

interface ConversionFunnelProps {
  metrics: StageMetrics[];
}

function ConversionFunnelChart({ metrics }: ConversionFunnelProps) {
  const maxDeals = Math.max(...metrics.map((m) => m.dealsCount));

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-neutral-900">Conversion Funnel</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-accent-primary" />
            <span className="text-neutral-600">Deals</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-status-success" />
            <span className="text-neutral-600">Converted</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-status-error" />
            <span className="text-neutral-600">Lost</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((stage, index) => {
          const widthPercent = (stage.dealsCount / maxDeals) * 100;
          const isLast = index === metrics.length - 1;

          return (
            <div key={stage.stageId} className="relative">
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-neutral-700 truncate">
                  {stage.stageName}
                </div>
                <div className="flex-1 relative">
                  <div className="h-10 bg-neutral-100 rounded-lg overflow-hidden">
                    <motion.div
                      className="h-full rounded-lg"
                      style={{
                        backgroundColor: PIPELINE_STAGES.find((s) => s.id === stage.stageId)?.color,
                        width: `${widthPercent}%`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                  <div className="absolute inset-y-0 left-2 flex items-center">
                    <span className="text-white text-sm font-medium drop-shadow">
                      {stage.dealsCount} deals
                    </span>
                  </div>
                </div>
                <div className="w-32 text-right">
                  <span className="text-sm font-medium text-neutral-900">
                    {formatCurrency(stage.totalValue)}
                  </span>
                </div>
              </div>

              {!isLast && (
                <div className="ml-24 pl-4 py-2 flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-1 text-status-success">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    <span>{stage.conversionRate}% converted</span>
                  </div>
                  <div className="flex items-center gap-1 text-status-error">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                    <span>{stage.lossRate}% lost</span>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-neutral-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-neutral-200 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-primary">
            {formatPercent(
              metrics.reduce((acc, m) => acc + m.conversionRate, 0) / (metrics.length - 1)
            )}
          </div>
          <div className="text-xs text-neutral-500">Avg Conversion Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-status-success">
            {metrics[metrics.length - 1].dealsCount}
          </div>
          <div className="text-xs text-neutral-500">Deals Won</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-900">
            {formatCurrency(metrics[metrics.length - 1].totalValue)}
          </div>
          <div className="text-xs text-neutral-500">Revenue Won</div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// VELOCITY METRICS COMPONENT
// =============================================================================

interface VelocityMetricsProps {
  metrics: VelocityMetric[];
  stages: PipelineStage[];
  stageMetrics: StageMetrics[];
}

function VelocityMetricsPanel({ metrics, stages, stageMetrics }: VelocityMetricsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(metrics[0].period);
  const currentMetrics = metrics.find((m) => m.period === selectedPeriod) || metrics[0];

  // Calculate velocity trend
  const velocityChange =
    metrics.length >= 2
      ? ((metrics[0].avgCycleTime - metrics[1].avgCycleTime) / metrics[1].avgCycleTime) * 100
      : 0;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-neutral-900">Deal Velocity</h3>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary"
        >
          {metrics.map((m) => (
            <option key={m.period} value={m.period}>
              {m.period}
            </option>
          ))}
        </select>
      </div>

      {/* Overall Cycle Time */}
      <div className="bg-gradient-to-br from-accent-primary/5 to-accent-primary/10 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-neutral-600 mb-1">Average Sales Cycle</div>
            <div className="text-4xl font-bold text-accent-primary">
              {currentMetrics.avgCycleTime} days
            </div>
            <div className="text-sm text-neutral-500 mt-1">
              Based on {currentMetrics.dealsAnalyzed} closed deals
            </div>
          </div>
          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
              velocityChange < 0
                ? 'bg-status-success/10 text-status-success'
                : velocityChange > 0
                  ? 'bg-status-error/10 text-status-error'
                  : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {velocityChange < 0 ? (
              <ArrowTrendingDownIcon className="h-4 w-4" />
            ) : velocityChange > 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4" />
            ) : (
              <ArrowPathIcon className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{Math.abs(velocityChange).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Time per Stage */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-neutral-700">Time by Stage</h4>
        {stages.slice(0, -1).map((stage) => {
          const timeInStage = currentMetrics.avgTimePerStage[stage.id] || 0;
          const stageData = stageMetrics.find((m) => m.stageId === stage.id);
          const maxTime = Math.max(...Object.values(currentMetrics.avgTimePerStage));
          const widthPercent = (timeInStage / maxTime) * 100;

          return (
            <div key={stage.id} className="flex items-center gap-3">
              <div className="w-24 text-sm text-neutral-600 truncate">{stage.name}</div>
              <div className="flex-1 h-6 bg-neutral-100 rounded overflow-hidden">
                <motion.div
                  className="h-full rounded flex items-center justify-end pr-2"
                  style={{ backgroundColor: stage.color, width: `${widthPercent}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-xs text-white font-medium">{timeInStage}d</span>
                </motion.div>
              </div>
              <div className="w-20 flex items-center justify-end gap-1">
                {stageData && getTrendIcon(stageData.velocityTrend)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Velocity Insights */}
      <div className="mt-6 pt-4 border-t border-neutral-200">
        <div className="flex items-start gap-2 p-3 bg-status-info/5 rounded-lg border border-status-info/20">
          <LightBulbIcon className="h-5 w-5 text-status-info flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-status-info">Velocity Insight</div>
            <div className="text-xs text-neutral-600 mt-1">
              Deals are spending the most time in the{' '}
              <span className="font-medium">
                {
                  Object.entries(currentMetrics.avgTimePerStage).sort((a, b) => b[1] - a[1])[0]?.[0]
                }
              </span>{' '}
              stage. Consider reviewing your process to identify bottlenecks.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// REVENUE FORECAST COMPONENT
// =============================================================================

interface RevenueForecastProps {
  projections: RevenueProjection[];
  quota?: number;
}

function RevenueForecastChart({ projections, quota = 6000000 }: RevenueForecastProps) {
  const [showBands, setShowBands] = useState(true);
  const maxValue = Math.max(...projections.map((p) => p.bestCase));

  // Calculate cumulative values
  const cumulativeProjections = projections.reduce(
    (acc, proj, idx) => {
      const prev = idx > 0 ? acc[idx - 1] : { projected: 0, committed: 0, bestCase: 0, worstCase: 0 };
      acc.push({
        month: proj.month,
        projected: prev.projected + proj.projected,
        committed: prev.committed + proj.committed,
        bestCase: prev.bestCase + proj.bestCase,
        worstCase: prev.worstCase + proj.worstCase,
      });
      return acc;
    },
    [] as RevenueProjection[]
  );

  const totalProjected = cumulativeProjections[cumulativeProjections.length - 1]?.projected || 0;
  const totalCommitted = cumulativeProjections[cumulativeProjections.length - 1]?.committed || 0;
  const quotaAttainment = (totalProjected / quota) * 100;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-neutral-900">Revenue Forecast</h3>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={showBands}
              onChange={(e) => setShowBands(e.target.checked)}
              className="rounded border-neutral-300 text-accent-primary focus:ring-accent-primary/20"
            />
            Show confidence bands
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-accent-primary/5 rounded-lg p-4">
          <div className="text-xs text-neutral-500 mb-1">Projected Revenue</div>
          <div className="text-xl font-bold text-accent-primary">
            {formatCurrency(totalProjected)}
          </div>
        </div>
        <div className="bg-status-success/5 rounded-lg p-4">
          <div className="text-xs text-neutral-500 mb-1">Committed</div>
          <div className="text-xl font-bold text-status-success">
            {formatCurrency(totalCommitted)}
          </div>
        </div>
        <div className="bg-neutral-100 rounded-lg p-4">
          <div className="text-xs text-neutral-500 mb-1">Annual Quota</div>
          <div className="text-xl font-bold text-neutral-700">{formatCurrency(quota)}</div>
        </div>
        <div
          className={`rounded-lg p-4 ${
            quotaAttainment >= 100
              ? 'bg-status-success/5'
              : quotaAttainment >= 80
                ? 'bg-status-warning/5'
                : 'bg-status-error/5'
          }`}
        >
          <div className="text-xs text-neutral-500 mb-1">Quota Attainment</div>
          <div
            className={`text-xl font-bold ${
              quotaAttainment >= 100
                ? 'text-status-success'
                : quotaAttainment >= 80
                  ? 'text-status-warning'
                  : 'text-status-error'
            }`}
          >
            {formatPercent(quotaAttainment)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-neutral-500">
          <span>{formatCurrency(maxValue)}</span>
          <span>{formatCurrency(maxValue * 0.75)}</span>
          <span>{formatCurrency(maxValue * 0.5)}</span>
          <span>{formatCurrency(maxValue * 0.25)}</span>
          <span>$0</span>
        </div>

        {/* Chart area */}
        <div className="absolute left-16 right-0 top-0 bottom-8">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-neutral-100 border-dashed" />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-around px-2">
            {projections.map((proj, idx) => {
              const projectedHeight = (proj.projected / maxValue) * 100;
              const committedHeight = (proj.committed / maxValue) * 100;
              const bestCaseHeight = (proj.bestCase / maxValue) * 100;
              const worstCaseHeight = (proj.worstCase / maxValue) * 100;

              return (
                <div key={proj.month} className="flex-1 flex flex-col items-center relative group">
                  {/* Confidence band */}
                  {showBands && (
                    <motion.div
                      className="absolute bottom-0 w-8 bg-accent-primary/10 rounded"
                      style={{ height: `${bestCaseHeight}%` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${bestCaseHeight}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                    />
                  )}

                  {/* Projected bar */}
                  <motion.div
                    className="w-6 bg-accent-primary rounded-t relative z-10"
                    style={{ height: `${projectedHeight}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${projectedHeight}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                  >
                    {/* Committed portion */}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 bg-status-success rounded-t"
                      style={{ height: `${(committedHeight / projectedHeight) * 100}%` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${(committedHeight / projectedHeight) * 100}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 + 0.2 }}
                    />
                  </motion.div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">
                    <div className="font-medium mb-1">{proj.month}</div>
                    <div className="flex justify-between gap-4">
                      <span>Projected:</span>
                      <span>{formatCurrency(proj.projected)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-status-success">
                      <span>Committed:</span>
                      <span>{formatCurrency(proj.committed)}</span>
                    </div>
                    {showBands && (
                      <>
                        <div className="flex justify-between gap-4 text-neutral-400">
                          <span>Best Case:</span>
                          <span>{formatCurrency(proj.bestCase)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-neutral-400">
                          <span>Worst Case:</span>
                          <span>{formatCurrency(proj.worstCase)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="absolute left-16 right-0 bottom-0 h-8 flex justify-around items-center">
          {projections.map((proj) => (
            <span key={proj.month} className="text-xs text-neutral-500">
              {proj.month}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-accent-primary" />
          <span className="text-neutral-600">Projected</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-status-success" />
          <span className="text-neutral-600">Committed</span>
        </div>
        {showBands && (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-accent-primary/20" />
            <span className="text-neutral-600">Confidence Range</span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PIPELINE HEALTH COMPONENT
// =============================================================================

interface PipelineHealthPanelProps {
  health: PipelineHealth;
}

function PipelineHealthPanel({ health }: PipelineHealthPanelProps) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-neutral-900">Pipeline Health</h3>
        </div>
      </div>

      {/* Health Score */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              className="stroke-neutral-100"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              className={
                health.status === 'healthy'
                  ? 'stroke-status-success'
                  : health.status === 'warning'
                    ? 'stroke-status-warning'
                    : 'stroke-status-error'
              }
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(health.score / 100) * 251.2} 251.2`}
              initial={{ strokeDasharray: '0 251.2' }}
              animate={{ strokeDasharray: `${(health.score / 100) * 251.2} 251.2` }}
              transition={{ duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getHealthColor(health.status)}`}>
              {health.score}
            </span>
          </div>
        </div>
        <div>
          <div
            className={`text-lg font-semibold capitalize ${getHealthColor(health.status)}`}
          >
            {health.status}
          </div>
          <div className="text-sm text-neutral-500">
            {health.issues.filter((i) => i.severity === 'high').length} critical issues,{' '}
            {health.issues.filter((i) => i.severity === 'medium').length} warnings
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-neutral-700 mb-3">Issues & Recommendations</h4>
        {health.issues.map((issue, idx) => (
          <div
            key={idx}
            className={`border rounded-lg overflow-hidden ${getSeverityColor(issue.severity)}`}
          >
            <button
              onClick={() => setExpandedIssue(expandedIssue === idx ? null : idx)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-2">
                {issue.severity === 'high' ? (
                  <ExclamationTriangleIcon className="h-4 w-4" />
                ) : issue.severity === 'medium' ? (
                  <InformationCircleIcon className="h-4 w-4" />
                ) : (
                  <InformationCircleIcon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{issue.message}</span>
              </div>
              <ChevronRightIcon
                className={`h-4 w-4 transition-transform ${
                  expandedIssue === idx ? 'rotate-90' : ''
                }`}
              />
            </button>
            <AnimatePresence>
              {expandedIssue === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-current/10"
                >
                  <div className="p-3 bg-white/50">
                    <div className="flex items-start gap-2">
                      <LightBulbIcon className="h-4 w-4 text-accent-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-neutral-700">Recommendation</div>
                        <div className="text-sm text-neutral-600">{issue.recommendation}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// STAGE DETAIL TABLE
// =============================================================================

interface StageDetailTableProps {
  metrics: StageMetrics[];
}

function StageDetailTable({ metrics }: StageDetailTableProps) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-semibold text-neutral-900">Stage Details</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Stage</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Deals</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Value</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Avg Size</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Avg Days</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Conv. Rate</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Loss Rate</th>
              <th className="px-4 py-3 text-center font-medium text-neutral-600">Velocity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {metrics.map((stage) => (
              <tr key={stage.stageId} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: PIPELINE_STAGES.find((s) => s.id === stage.stageId)?.color,
                      }}
                    />
                    <span className="font-medium text-neutral-900">{stage.stageName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-neutral-700">{stage.dealsCount}</td>
                <td className="px-4 py-3 text-right text-neutral-700">
                  {formatCurrency(stage.totalValue)}
                </td>
                <td className="px-4 py-3 text-right text-neutral-700">
                  {formatCurrency(stage.avgDealSize)}
                </td>
                <td className="px-4 py-3 text-right text-neutral-700">
                  {stage.avgDaysInStage > 0 ? `${stage.avgDaysInStage}d` : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`${
                      stage.conversionRate >= 70
                        ? 'text-status-success'
                        : stage.conversionRate >= 50
                          ? 'text-status-warning'
                          : 'text-status-error'
                    }`}
                  >
                    {stage.conversionRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`${
                      stage.lossRate <= 10
                        ? 'text-status-success'
                        : stage.lossRate <= 20
                          ? 'text-status-warning'
                          : 'text-status-error'
                    }`}
                  >
                    {stage.lossRate}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">{getTrendIcon(stage.velocityTrend)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

export interface PipelineAnalyticsDashboardProps {
  stageMetrics?: StageMetrics[];
  velocityMetrics?: VelocityMetric[];
  revenueProjections?: RevenueProjection[];
  pipelineHealth?: PipelineHealth;
  quota?: number;
  onExport?: (format: 'csv' | 'pdf') => void;
  onRefresh?: () => void;
}

export function PipelineAnalyticsDashboard({
  stageMetrics = SAMPLE_STAGE_METRICS,
  velocityMetrics = SAMPLE_VELOCITY_METRICS,
  revenueProjections = SAMPLE_REVENUE_PROJECTIONS,
  pipelineHealth = SAMPLE_PIPELINE_HEALTH,
  quota = 6000000,
  onExport,
  onRefresh,
}: PipelineAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<string>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'conversion' | 'velocity' | 'forecast'>(
    'overview'
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'conversion', label: 'Conversion', icon: FunnelIcon },
    { id: 'velocity', label: 'Velocity', icon: ClockIcon },
    { id: 'forecast', label: 'Forecast', icon: CurrencyDollarIcon },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Pipeline Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Analyze conversion rates, deal velocity, and revenue forecasts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary"
          >
            {DATE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Refresh data"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          )}
          {onExport && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors">
                <DocumentArrowDownIcon className="h-4 w-4" />
                Export
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-dropdown">
                <button
                  onClick={() => onExport('csv')}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-neutral-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => onExport('pdf')}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-neutral-50"
                >
                  Export as PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-500">Total Pipeline</span>
                  <FunnelIcon className="h-4 w-4 text-neutral-400" />
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(stageMetrics.reduce((acc, m) => acc + m.totalValue, 0))}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {stageMetrics.reduce((acc, m) => acc + m.dealsCount, 0)} deals
                </div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-500">Avg Deal Size</span>
                  <CurrencyDollarIcon className="h-4 w-4 text-neutral-400" />
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(
                    stageMetrics.reduce((acc, m) => acc + m.avgDealSize, 0) / stageMetrics.length
                  )}
                </div>
                <div className="text-xs text-status-success mt-1 flex items-center gap-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" />
                  +8% from last period
                </div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-500">Win Rate</span>
                  <CheckCircleIcon className="h-4 w-4 text-neutral-400" />
                </div>
                <div className="text-2xl font-bold text-status-success">
                  {formatPercent(
                    (stageMetrics[stageMetrics.length - 1].dealsCount / stageMetrics[0].dealsCount) *
                      100
                  )}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {stageMetrics[stageMetrics.length - 1].dealsCount} won of{' '}
                  {stageMetrics[0].dealsCount}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-500">Avg Cycle Time</span>
                  <ClockIcon className="h-4 w-4 text-neutral-400" />
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {velocityMetrics[0]?.avgCycleTime || 0} days
                </div>
                <div className="text-xs text-status-success mt-1 flex items-center gap-1">
                  <ArrowTrendingDownIcon className="h-3 w-3" />
                  -3 days from last period
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <ConversionFunnelChart metrics={stageMetrics} />
              </div>
              <div>
                <PipelineHealthPanel health={pipelineHealth} />
              </div>
            </div>

            <StageDetailTable metrics={stageMetrics} />
          </motion.div>
        )}

        {activeTab === 'conversion' && (
          <motion.div
            key="conversion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <ConversionFunnelChart metrics={stageMetrics} />
            <StageDetailTable metrics={stageMetrics} />
          </motion.div>
        )}

        {activeTab === 'velocity' && (
          <motion.div
            key="velocity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <VelocityMetricsPanel
              metrics={velocityMetrics}
              stages={PIPELINE_STAGES}
              stageMetrics={stageMetrics}
            />
            <StageDetailTable metrics={stageMetrics} />
          </motion.div>
        )}

        {activeTab === 'forecast' && (
          <motion.div
            key="forecast"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <RevenueForecastChart projections={revenueProjections} quota={quota} />
            <PipelineHealthPanel health={pipelineHealth} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compliance Disclaimer */}
      <div className="mt-6 p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          <InformationCircleIcon className="w-4 h-4 inline-block mr-1 -mt-0.5" />
          <strong className="text-neutral-600 dark:text-neutral-300">Disclosure:</strong> Pipeline projections and revenue forecasts are estimates based on historical conversion rates and current deal values. Actual outcomes may vary significantly. These metrics are for internal business planning purposes only and should not be construed as guaranteed revenue or relied upon for financial reporting.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  ConversionFunnelChart,
  VelocityMetricsPanel,
  RevenueForecastChart,
  PipelineHealthPanel,
  StageDetailTable,
};

export type {
  PipelineStage,
  StageMetrics,
  PipelineSnapshot,
  ForecastScenario,
  VelocityMetric,
  ConversionFunnel,
  RevenueProjection,
  PipelineHealth,
  DateRange,
};
