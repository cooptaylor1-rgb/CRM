'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, formatCurrency } from '../ui';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  PresentationChartLineIcon,
  BanknotesIcon,
  ScaleIcon,
  ReceiptPercentIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../ui/utils';

/**
 * PerformanceAnalytics - Comprehensive Business Intelligence
 * 
 * The complete picture of your advisory practice:
 * - AUM trends and flow analysis
 * - Activity metrics and productivity
 * - Revenue forecasting
 * - Client health scoring
 * - Team performance
 */

// ============================================
// Types
// ============================================

export interface TimeRange {
  label: string;
  value: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  days: number;
}

export interface MetricData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'flat';
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AUMFlowData {
  inflows: number;
  outflows: number;
  netFlow: number;
  marketChange: number;
}

export interface ActivityMetrics {
  meetings: MetricData;
  calls: MetricData;
  emails: MetricData;
  tasksCompleted: MetricData;
  avgResponseTime: MetricData; // in hours
}

export interface RevenueData {
  recurring: number;
  oneTime: number;
  projected: number;
  collected: number;
}

export interface ClientHealthData {
  healthy: number;
  atRisk: number;
  critical: number;
  totalScore: number;
}

export interface AdvisorPerformance {
  id: string;
  name: string;
  avatar?: string;
  aum: number;
  clients: number;
  meetings: number;
  revenue: number;
  healthScore: number;
}

// ============================================
// Constants
// ============================================

const TIME_RANGES: TimeRange[] = [
  { label: 'This Week', value: 'week', days: 7 },
  { label: 'This Month', value: 'month', days: 30 },
  { label: 'This Quarter', value: 'quarter', days: 90 },
  { label: 'This Year', value: 'year', days: 365 },
];

const SAMPLE_AUM_TREND: ChartDataPoint[] = [
  { date: '2024-07', value: 245000000 },
  { date: '2024-08', value: 252000000 },
  { date: '2024-09', value: 248000000 },
  { date: '2024-10', value: 261000000 },
  { date: '2024-11', value: 268000000 },
  { date: '2024-12', value: 275000000 },
  { date: '2025-01', value: 282000000 },
];

const SAMPLE_REVENUE_TREND: ChartDataPoint[] = [
  { date: '2024-07', value: 185000 },
  { date: '2024-08', value: 192000 },
  { date: '2024-09', value: 178000 },
  { date: '2024-10', value: 198000 },
  { date: '2024-11', value: 205000 },
  { date: '2024-12', value: 212000 },
  { date: '2025-01', value: 218000 },
];

const SAMPLE_ACTIVITY_TREND: ChartDataPoint[] = [
  { date: 'Mon', value: 12 },
  { date: 'Tue', value: 18 },
  { date: 'Wed', value: 15 },
  { date: 'Thu', value: 22 },
  { date: 'Fri', value: 14 },
  { date: 'Sat', value: 3 },
  { date: 'Sun', value: 0 },
];

const SAMPLE_ADVISORS: AdvisorPerformance[] = [
  { id: '1', name: 'Jane Wilson', aum: 125000000, clients: 48, meetings: 32, revenue: 95000, healthScore: 92 },
  { id: '2', name: 'John Smith', aum: 98000000, clients: 42, meetings: 28, revenue: 78000, healthScore: 87 },
  { id: '3', name: 'Emily Chen', aum: 59000000, clients: 31, meetings: 24, revenue: 45000, healthScore: 94 },
];

const AI_INSIGHTS = [
  {
    type: 'opportunity',
    title: '15 clients due for annual review',
    description: 'Schedule reviews before quarter end to maintain engagement',
    action: 'View clients',
    icon: <CalendarIcon className="w-5 h-5" />,
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    type: 'warning',
    title: '3 high-value clients at risk',
    description: 'No contact in 45+ days with AUM over $1M',
    action: 'Take action',
    icon: <ExclamationTriangleIcon className="w-5 h-5" />,
    color: 'text-amber-500 bg-amber-500/10',
  },
  {
    type: 'success',
    title: 'Revenue up 12% this quarter',
    description: 'Outperforming same period last year by $24,000',
    action: 'View details',
    icon: <ArrowTrendingUpIcon className="w-5 h-5" />,
    color: 'text-green-500 bg-green-500/10',
  },
  {
    type: 'info',
    title: 'Meeting efficiency improving',
    description: 'Average meeting prep time down 23% with AI assistance',
    action: 'Learn more',
    icon: <SparklesIcon className="w-5 h-5" />,
    color: 'text-purple-500 bg-purple-500/10',
  },
];

// ============================================
// Helper Components
// ============================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconColor: string;
  trend?: 'up' | 'down' | 'flat';
  onClick?: () => void;
}

function MetricCard({ title, value, subtitle, change, changeLabel, icon, iconColor, trend, onClick }: MetricCardProps) {
  return (
    <Card 
      className={cn('p-4', onClick && 'cursor-pointer hover:border-accent-primary/50 transition-colors')} 
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconColor)}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-content-tertiary'
          )}>
            {trend === 'up' && <ArrowTrendingUpIcon className="w-4 h-4" />}
            {trend === 'down' && <ArrowTrendingDownIcon className="w-4 h-4" />}
            {trend === 'flat' && <MinusIcon className="w-4 h-4" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-content-primary">{value}</p>
        <p className="text-sm text-content-tertiary mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-content-tertiary mt-1">{subtitle}</p>}
      </div>
    </Card>
  );
}

interface MiniChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showLabels?: boolean;
}

function MiniChart({ data, height = 60, color = '#3B82F6', showLabels = false }: MiniChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill={`${color}20`}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d.value - minValue) / range) * 100;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      {showLabels && (
        <div className="flex justify-between mt-1">
          {data.map((d, i) => (
            <span key={i} className="text-xs text-content-tertiary">{d.date}</span>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
  showLabel?: boolean;
}

function ProgressBar({ value, max, color, showLabel = false }: ProgressBarProps) {
  const percent = (value / max) * 100;

  return (
    <div className="relative">
      <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 -top-5 text-xs text-content-tertiary">
          {percent.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

interface FlowIndicatorProps {
  inflows: number;
  outflows: number;
}

function FlowIndicator({ inflows, outflows }: FlowIndicatorProps) {
  const net = inflows - outflows;
  const total = inflows + outflows;
  const inflowPercent = (inflows / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-content-secondary">Inflows</span>
        </div>
        <span className="font-medium text-green-500">+{formatCurrency(inflows)}</span>
      </div>
      <div className="h-3 bg-surface-secondary rounded-full overflow-hidden flex">
        <div className="bg-green-500" style={{ width: `${inflowPercent}%` }} />
        <div className="bg-red-500" style={{ width: `${100 - inflowPercent}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-content-secondary">Outflows</span>
        </div>
        <span className="font-medium text-red-500">-{formatCurrency(outflows)}</span>
      </div>
      <div className="pt-2 border-t border-border flex items-center justify-between">
        <span className="text-sm font-medium text-content-primary">Net Flow</span>
        <span className={cn('font-bold', net >= 0 ? 'text-green-500' : 'text-red-500')}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </span>
      </div>
    </div>
  );
}

interface AdvisorRowProps {
  advisor: AdvisorPerformance;
  rank: number;
}

function AdvisorRow({ advisor, rank }: AdvisorRowProps) {
  const healthColors = {
    high: 'text-green-500 bg-green-500/10',
    medium: 'text-amber-500 bg-amber-500/10',
    low: 'text-red-500 bg-red-500/10',
  };
  const healthLevel = advisor.healthScore >= 90 ? 'high' : advisor.healthScore >= 70 ? 'medium' : 'low';

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-secondary transition-colors">
      <span className="w-6 text-center text-sm font-medium text-content-tertiary">#{rank}</span>
      <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center">
        <span className="text-sm font-medium text-accent-primary">
          {advisor.name.split(' ').map(n => n[0]).join('')}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-content-primary">{advisor.name}</p>
        <p className="text-sm text-content-tertiary">{advisor.clients} clients</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-content-primary">{formatCurrency(advisor.aum)}</p>
        <p className="text-sm text-content-tertiary">{advisor.meetings} meetings</p>
      </div>
      <div className={cn('px-3 py-1 rounded-full text-sm font-medium', healthColors[healthLevel])}>
        {advisor.healthScore}%
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export interface PerformanceAnalyticsProps {
  className?: string;
}

export function PerformanceAnalytics({ className }: PerformanceAnalyticsProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(TIME_RANGES[1]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data
  const metrics = useMemo(() => ({
    totalAUM: {
      value: 282000000,
      change: 8.3,
      trend: 'up' as const,
    },
    totalClients: {
      value: 156,
      change: 4.2,
      trend: 'up' as const,
    },
    revenue: {
      value: 218000,
      change: 12.1,
      trend: 'up' as const,
    },
    avgClientAUM: {
      value: 1807692,
      change: 3.9,
      trend: 'up' as const,
    },
  }), []);

  const activityMetrics = useMemo(() => ({
    meetings: { current: 84, previous: 72, change: 12, changePercent: 16.7, trend: 'up' as const },
    calls: { current: 156, previous: 148, change: 8, changePercent: 5.4, trend: 'up' as const },
    emails: { current: 423, previous: 398, change: 25, changePercent: 6.3, trend: 'up' as const },
    tasksCompleted: { current: 234, previous: 212, change: 22, changePercent: 10.4, trend: 'up' as const },
    avgResponseTime: { current: 2.4, previous: 3.1, change: -0.7, changePercent: -22.6, trend: 'up' as const },
  }), []);

  const flowData: AUMFlowData = {
    inflows: 12500000,
    outflows: 4200000,
    netFlow: 8300000,
    marketChange: 6800000,
  };

  const clientHealth: ClientHealthData = {
    healthy: 128,
    atRisk: 21,
    critical: 7,
    totalScore: 82,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-semibold text-content-primary">Performance Analytics</h2>
          </div>
          <p className="text-sm text-content-secondary mt-1">
            Comprehensive view of your advisory practice
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex items-center bg-surface-secondary rounded-lg p-1">
            {TIME_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setSelectedRange(range)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  selectedRange.value === range.value
                    ? 'bg-surface text-content-primary shadow-sm'
                    : 'text-content-secondary hover:text-content-primary'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <ArrowPathIcon className={cn('w-4 h-4 mr-1', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>

          <Button variant="secondary" size="sm">
            <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total AUM"
          value={formatCurrency(metrics.totalAUM.value)}
          change={metrics.totalAUM.change}
          trend={metrics.totalAUM.trend}
          icon={<CurrencyDollarIcon className="w-5 h-5 text-emerald-500" />}
          iconColor="bg-emerald-500/10"
        />
        <MetricCard
          title="Total Clients"
          value={metrics.totalClients.value}
          subtitle="4 new this month"
          change={metrics.totalClients.change}
          trend={metrics.totalClients.trend}
          icon={<UserGroupIcon className="w-5 h-5 text-blue-500" />}
          iconColor="bg-blue-500/10"
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(metrics.revenue.value)}
          subtitle="$2.4M annual run rate"
          change={metrics.revenue.change}
          trend={metrics.revenue.trend}
          icon={<BanknotesIcon className="w-5 h-5 text-amber-500" />}
          iconColor="bg-amber-500/10"
        />
        <MetricCard
          title="Avg Client AUM"
          value={formatCurrency(metrics.avgClientAUM.value)}
          change={metrics.avgClientAUM.change}
          trend={metrics.avgClientAUM.trend}
          icon={<ScaleIcon className="w-5 h-5 text-purple-500" />}
          iconColor="bg-purple-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* AUM Trend */}
        <Card className="col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-content-primary">AUM Trend</h3>
              <p className="text-sm text-content-tertiary">Last 7 months</p>
            </div>
            <Badge variant="success" size="sm">+15.1% YTD</Badge>
          </div>
          <MiniChart data={SAMPLE_AUM_TREND} height={180} color="#10B981" />
          <div className="flex justify-between mt-2">
            {SAMPLE_AUM_TREND.map((d, i) => (
              <span key={i} className="text-xs text-content-tertiary">{d.date}</span>
            ))}
          </div>
        </Card>

        {/* AUM Flow */}
        <Card className="p-4">
          <h3 className="font-medium text-content-primary mb-4">AUM Flow ({selectedRange.label})</h3>
          <FlowIndicator inflows={flowData.inflows} outflows={flowData.outflows} />
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-secondary">Market Change</span>
              <span className={cn(
                'font-medium',
                flowData.marketChange >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {flowData.marketChange >= 0 ? '+' : ''}{formatCurrency(flowData.marketChange)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity & Health Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Activity Metrics */}
        <Card className="col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-content-primary">Activity Metrics</h3>
            <span className="text-sm text-content-tertiary">vs previous period</span>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                <CalendarIcon className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-content-primary">{activityMetrics.meetings.current}</p>
              <p className="text-xs text-content-tertiary">Meetings</p>
              <p className="text-xs text-green-500 mt-1">+{activityMetrics.meetings.changePercent.toFixed(0)}%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
                <PhoneIcon className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-content-primary">{activityMetrics.calls.current}</p>
              <p className="text-xs text-content-tertiary">Calls</p>
              <p className="text-xs text-green-500 mt-1">+{activityMetrics.calls.changePercent.toFixed(0)}%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
                <EnvelopeIcon className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-content-primary">{activityMetrics.emails.current}</p>
              <p className="text-xs text-content-tertiary">Emails</p>
              <p className="text-xs text-green-500 mt-1">+{activityMetrics.emails.changePercent.toFixed(0)}%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
                <CheckCircleIcon className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-content-primary">{activityMetrics.tasksCompleted.current}</p>
              <p className="text-xs text-content-tertiary">Tasks Done</p>
              <p className="text-xs text-green-500 mt-1">+{activityMetrics.tasksCompleted.changePercent.toFixed(0)}%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-lg bg-cyan-500/10 flex items-center justify-center mb-2">
                <ClockIcon className="w-6 h-6 text-cyan-500" />
              </div>
              <p className="text-2xl font-bold text-content-primary">{activityMetrics.avgResponseTime.current}h</p>
              <p className="text-xs text-content-tertiary">Avg Response</p>
              <p className="text-xs text-green-500 mt-1">{activityMetrics.avgResponseTime.changePercent.toFixed(0)}%</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-content-secondary mb-3">Activity This Week</h4>
            <MiniChart data={SAMPLE_ACTIVITY_TREND} height={60} color="#8B5CF6" showLabels />
          </div>
        </Card>

        {/* Client Health */}
        <Card className="p-4">
          <h3 className="font-medium text-content-primary mb-4">Client Health</h3>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              {/* Background circle */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              {/* Progress circle */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={clientHealth.totalScore >= 80 ? '#10B981' : clientHealth.totalScore >= 60 ? '#F59E0B' : '#EF4444'}
                strokeWidth="3"
                strokeDasharray={`${clientHealth.totalScore}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-content-primary">{clientHealth.totalScore}</span>
              <span className="text-xs text-content-tertiary">Score</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-content-secondary">Healthy</span>
              </div>
              <span className="font-medium text-content-primary">{clientHealth.healthy}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-content-secondary">At Risk</span>
              </div>
              <span className="font-medium text-amber-500">{clientHealth.atRisk}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-content-secondary">Critical</span>
              </div>
              <span className="font-medium text-red-500">{clientHealth.critical}</span>
            </div>
          </div>

          <Button variant="secondary" size="sm" className="w-full mt-4">
            View At-Risk Clients
          </Button>
        </Card>
      </div>

      {/* AI Insights & Team Performance */}
      <div className="grid grid-cols-3 gap-6">
        {/* AI Insights */}
        <Card className="p-4 border-purple-500/30 bg-purple-500/5">
          <div className="flex items-center gap-2 mb-4">
            <SparklesIcon className="w-5 h-5 text-purple-500" />
            <h3 className="font-medium text-content-primary">AI Insights</h3>
          </div>
          <div className="space-y-3">
            {AI_INSIGHTS.map((insight, i) => (
              <div key={i} className="p-3 rounded-lg bg-surface border border-border">
                <div className="flex items-start gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', insight.color)}>
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-content-primary text-sm">{insight.title}</p>
                    <p className="text-xs text-content-secondary mt-0.5">{insight.description}</p>
                    <button className="text-xs text-accent-primary hover:text-accent-primary-hover mt-2">
                      {insight.action} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Team Performance */}
        <Card className="col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-content-primary">Team Performance</h3>
            <Button variant="secondary" size="sm">
              <EyeIcon className="w-4 h-4 mr-1" />
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {SAMPLE_ADVISORS.map((advisor, i) => (
              <AdvisorRow key={advisor.id} advisor={advisor} rank={i + 1} />
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue Forecast */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-content-primary">Revenue Trend & Forecast</h3>
            <p className="text-sm text-content-tertiary">Monthly recurring revenue with 3-month projection</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-content-secondary">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500/40" />
              <span className="text-content-secondary">Projected</span>
            </div>
          </div>
        </div>
        <MiniChart data={SAMPLE_REVENUE_TREND} height={120} color="#3B82F6" />
        <div className="flex justify-between mt-2">
          {SAMPLE_REVENUE_TREND.map((d, i) => (
            <div key={i} className="text-center">
              <span className="text-xs text-content-tertiary block">{d.date}</span>
              <span className="text-xs font-medium text-content-primary">{formatCurrency(d.value)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
          <div>
            <p className="text-sm text-content-tertiary">Recurring Revenue</p>
            <p className="text-lg font-bold text-content-primary">{formatCurrency(195000)}</p>
          </div>
          <div>
            <p className="text-sm text-content-tertiary">One-Time Revenue</p>
            <p className="text-lg font-bold text-content-primary">{formatCurrency(23000)}</p>
          </div>
          <div>
            <p className="text-sm text-content-tertiary">Q1 Projection</p>
            <p className="text-lg font-bold text-green-500">{formatCurrency(680000)}</p>
          </div>
          <div>
            <p className="text-sm text-content-tertiary">YTD vs Goal</p>
            <p className="text-lg font-bold text-content-primary">87%</p>
            <ProgressBar value={87} max={100} color="bg-accent-primary" />
          </div>
        </div>
      </Card>
    </div>
  );
}
