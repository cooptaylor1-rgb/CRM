'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartPieIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  LinkIcon,
  CalendarIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  HandRaisedIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  MegaphoneIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  FunnelIcon,
  LightBulbIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPES
// =============================================================================

type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'custom';

interface ActivityType {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'outreach' | 'meeting' | 'content' | 'marketing' | 'sales';
  avgCost?: number;
}

interface AttributedActivity {
  id: string;
  type: string;
  date: string;
  description: string;
  dealId: string;
  dealName: string;
  attributedRevenue: number;
  attributionPercent: number;
  touchpointPosition: number;
  totalTouchpoints: number;
  owner: string;
}

interface ChannelAttribution {
  channel: string;
  touchpoints: number;
  attributedRevenue: number;
  attributedDeals: number;
  avgRevenuePerTouch: number;
  cost: number;
  roi: number;
  trend: 'up' | 'down' | 'stable';
  conversionRate: number;
}

interface ActivityROI {
  activityType: string;
  totalActivities: number;
  totalCost: number;
  attributedRevenue: number;
  roi: number;
  avgTimeToClose: number;
  conversionRate: number;
}

interface TouchpointJourney {
  dealId: string;
  dealName: string;
  dealValue: number;
  touchpoints: {
    date: string;
    type: string;
    channel: string;
    attribution: number;
    owner: string;
  }[];
  totalDays: number;
  closeDate: string;
}

interface AttributionInsight {
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  metric?: string;
  recommendation?: string;
}

interface ModelWeights {
  firstTouch: number;
  lastTouch: number;
  middleTouches: number;
}

// =============================================================================
// CONSTANTS & SAMPLE DATA
// =============================================================================

const ACTIVITY_TYPES: ActivityType[] = [
  { id: 'email', name: 'Email', icon: EnvelopeIcon, category: 'outreach', avgCost: 5 },
  { id: 'call', name: 'Call', icon: PhoneIcon, category: 'outreach', avgCost: 15 },
  { id: 'meeting', name: 'Meeting', icon: VideoCameraIcon, category: 'meeting', avgCost: 100 },
  { id: 'demo', name: 'Demo', icon: PresentationChartLineIcon, category: 'sales', avgCost: 200 },
  { id: 'proposal', name: 'Proposal', icon: DocumentTextIcon, category: 'sales', avgCost: 150 },
  { id: 'webinar', name: 'Webinar', icon: GlobeAltIcon, category: 'marketing', avgCost: 50 },
  { id: 'content', name: 'Content', icon: DocumentTextIcon, category: 'content', avgCost: 25 },
  { id: 'social', name: 'Social', icon: ChatBubbleLeftRightIcon, category: 'marketing', avgCost: 10 },
  { id: 'event', name: 'Event', icon: CalendarIcon, category: 'marketing', avgCost: 500 },
  { id: 'referral', name: 'Referral', icon: UserGroupIcon, category: 'outreach', avgCost: 0 },
  { id: 'inbound', name: 'Inbound', icon: HandRaisedIcon, category: 'marketing', avgCost: 75 },
  { id: 'ad', name: 'Paid Ad', icon: MegaphoneIcon, category: 'marketing', avgCost: 100 },
];

const ATTRIBUTION_MODELS: { id: AttributionModel; name: string; description: string }[] = [
  { id: 'first_touch', name: 'First Touch', description: '100% credit to first interaction' },
  { id: 'last_touch', name: 'Last Touch', description: '100% credit to final interaction' },
  { id: 'linear', name: 'Linear', description: 'Equal credit across all touchpoints' },
  { id: 'time_decay', name: 'Time Decay', description: 'More credit to recent interactions' },
  { id: 'position_based', name: 'Position Based', description: '40% first, 40% last, 20% middle' },
  { id: 'custom', name: 'Custom', description: 'Define your own weights' },
];

const SAMPLE_CHANNEL_ATTRIBUTION: ChannelAttribution[] = [
  {
    channel: 'Email Campaigns',
    touchpoints: 245,
    attributedRevenue: 1850000,
    attributedDeals: 28,
    avgRevenuePerTouch: 7551,
    cost: 12250,
    roi: 15002,
    trend: 'up',
    conversionRate: 11.4,
  },
  {
    channel: 'Cold Calls',
    touchpoints: 180,
    attributedRevenue: 920000,
    attributedDeals: 15,
    avgRevenuePerTouch: 5111,
    cost: 27000,
    roi: 3307,
    trend: 'stable',
    conversionRate: 8.3,
  },
  {
    channel: 'Demos',
    touchpoints: 65,
    attributedRevenue: 1450000,
    attributedDeals: 22,
    avgRevenuePerTouch: 22308,
    cost: 13000,
    roi: 11054,
    trend: 'up',
    conversionRate: 33.8,
  },
  {
    channel: 'Referrals',
    touchpoints: 42,
    attributedRevenue: 980000,
    attributedDeals: 12,
    avgRevenuePerTouch: 23333,
    cost: 0,
    roi: Infinity,
    trend: 'up',
    conversionRate: 28.6,
  },
  {
    channel: 'Webinars',
    touchpoints: 120,
    attributedRevenue: 680000,
    attributedDeals: 10,
    avgRevenuePerTouch: 5667,
    cost: 6000,
    roi: 11233,
    trend: 'down',
    conversionRate: 8.3,
  },
  {
    channel: 'Content Marketing',
    touchpoints: 310,
    attributedRevenue: 520000,
    attributedDeals: 8,
    avgRevenuePerTouch: 1677,
    cost: 7750,
    roi: 6610,
    trend: 'stable',
    conversionRate: 2.6,
  },
];

const SAMPLE_ACTIVITY_ROI: ActivityROI[] = [
  {
    activityType: 'Demo',
    totalActivities: 65,
    totalCost: 13000,
    attributedRevenue: 1450000,
    roi: 11054,
    avgTimeToClose: 28,
    conversionRate: 33.8,
  },
  {
    activityType: 'Meeting',
    totalActivities: 142,
    totalCost: 14200,
    attributedRevenue: 1120000,
    roi: 7787,
    avgTimeToClose: 35,
    conversionRate: 22.5,
  },
  {
    activityType: 'Email',
    totalActivities: 245,
    totalCost: 1225,
    attributedRevenue: 1850000,
    roi: 150920,
    avgTimeToClose: 42,
    conversionRate: 11.4,
  },
  {
    activityType: 'Call',
    totalActivities: 180,
    totalCost: 2700,
    attributedRevenue: 920000,
    roi: 33974,
    avgTimeToClose: 38,
    conversionRate: 8.3,
  },
  {
    activityType: 'Proposal',
    totalActivities: 48,
    totalCost: 7200,
    attributedRevenue: 1680000,
    roi: 23233,
    avgTimeToClose: 14,
    conversionRate: 45.8,
  },
];

const SAMPLE_TOUCHPOINT_JOURNEYS: TouchpointJourney[] = [
  {
    dealId: 'd1',
    dealName: 'Acme Corp - Enterprise',
    dealValue: 125000,
    totalDays: 45,
    closeDate: '2024-01-15',
    touchpoints: [
      { date: '2023-12-01', type: 'webinar', channel: 'Marketing', attribution: 15, owner: 'Marketing Team' },
      { date: '2023-12-05', type: 'email', channel: 'Outreach', attribution: 10, owner: 'Sarah Johnson' },
      { date: '2023-12-12', type: 'call', channel: 'Sales', attribution: 10, owner: 'Sarah Johnson' },
      { date: '2023-12-18', type: 'demo', channel: 'Sales', attribution: 25, owner: 'Mike Chen' },
      { date: '2024-01-02', type: 'proposal', channel: 'Sales', attribution: 20, owner: 'Sarah Johnson' },
      { date: '2024-01-10', type: 'meeting', channel: 'Sales', attribution: 20, owner: 'Sarah Johnson' },
    ],
  },
  {
    dealId: 'd2',
    dealName: 'TechStart Inc - Growth',
    dealValue: 85000,
    totalDays: 32,
    closeDate: '2024-01-18',
    touchpoints: [
      { date: '2023-12-17', type: 'referral', channel: 'Referral', attribution: 40, owner: 'James Wilson' },
      { date: '2023-12-20', type: 'call', channel: 'Sales', attribution: 15, owner: 'Lisa Park' },
      { date: '2023-12-28', type: 'demo', channel: 'Sales', attribution: 25, owner: 'Lisa Park' },
      { date: '2024-01-12', type: 'proposal', channel: 'Sales', attribution: 20, owner: 'Lisa Park' },
    ],
  },
  {
    dealId: 'd3',
    dealName: 'GlobalFinance Ltd',
    dealValue: 210000,
    totalDays: 68,
    closeDate: '2024-01-20',
    touchpoints: [
      { date: '2023-11-13', type: 'event', channel: 'Marketing', attribution: 20, owner: 'Events Team' },
      { date: '2023-11-18', type: 'email', channel: 'Outreach', attribution: 5, owner: 'David Kim' },
      { date: '2023-11-25', type: 'content', channel: 'Marketing', attribution: 5, owner: 'Content Team' },
      { date: '2023-12-04', type: 'call', channel: 'Sales', attribution: 10, owner: 'David Kim' },
      { date: '2023-12-15', type: 'meeting', channel: 'Sales', attribution: 15, owner: 'David Kim' },
      { date: '2023-12-22', type: 'demo', channel: 'Sales', attribution: 20, owner: 'Emma Stone' },
      { date: '2024-01-08', type: 'proposal', channel: 'Sales', attribution: 15, owner: 'David Kim' },
      { date: '2024-01-15', type: 'meeting', channel: 'Sales', attribution: 10, owner: 'David Kim' },
    ],
  },
];

const SAMPLE_INSIGHTS: AttributionInsight[] = [
  {
    type: 'success',
    title: 'Demos drive highest conversion',
    description: 'Deals with demos have 34% conversion rate vs. 12% average',
    metric: '+183% lift',
    recommendation: 'Prioritize demo scheduling for qualified leads',
  },
  {
    type: 'opportunity',
    title: 'Referrals underutilized',
    description: 'Referrals show highest ROI but only 8% of pipeline',
    metric: '$0 cost, 29% conversion',
    recommendation: 'Launch customer referral program',
  },
  {
    type: 'warning',
    title: 'Webinar ROI declining',
    description: 'Webinar attributed revenue down 25% vs last quarter',
    metric: '-25% QoQ',
    recommendation: 'Review webinar content and targeting strategy',
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

function formatROI(value: number): string {
  if (!isFinite(value)) return '∞';
  return `${value.toFixed(0)}%`;
}

function getActivityIcon(typeId: string) {
  const type = ACTIVITY_TYPES.find((t) => t.id === typeId);
  if (!type) return DocumentTextIcon;
  return type.icon;
}

function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return 'text-status-success';
    case 'down':
      return 'text-status-error';
    default:
      return 'text-neutral-500';
  }
}

function getInsightColor(type: AttributionInsight['type']): string {
  switch (type) {
    case 'success':
      return 'bg-status-success/10 border-status-success/20 text-status-success';
    case 'opportunity':
      return 'bg-status-info/10 border-status-info/20 text-status-info';
    case 'warning':
      return 'bg-status-warning/10 border-status-warning/20 text-status-warning';
    default:
      return 'bg-neutral-100 border-neutral-200 text-neutral-600';
  }
}

function getInsightIcon(type: AttributionInsight['type']) {
  switch (type) {
    case 'success':
      return CheckCircleIcon;
    case 'opportunity':
      return LightBulbIcon;
    case 'warning':
      return ExclamationTriangleIcon;
    default:
      return InformationCircleIcon;
  }
}

// =============================================================================
// ATTRIBUTION MODEL SELECTOR
// =============================================================================

interface ModelSelectorProps {
  selectedModel: AttributionModel;
  onModelChange: (model: AttributionModel) => void;
  customWeights?: ModelWeights;
  onCustomWeightsChange?: (weights: ModelWeights) => void;
}

function AttributionModelSelector({
  selectedModel,
  onModelChange,
  customWeights = { firstTouch: 40, lastTouch: 40, middleTouches: 20 },
  onCustomWeightsChange,
}: ModelSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-neutral-900">Attribution Model</h3>
        </div>
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="text-sm text-accent-primary hover:underline"
        >
          {showCustom ? 'Hide details' : 'Show details'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ATTRIBUTION_MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedModel === model.id
                ? 'border-accent-primary bg-accent-primary/5 ring-1 ring-accent-primary'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="text-sm font-medium text-neutral-900">{model.name}</div>
            <div className="text-xs text-neutral-500 mt-1">{model.description}</div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showCustom && selectedModel === 'custom' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-700">First Touch Weight</span>
                  <span className="text-sm font-medium text-accent-primary">
                    {customWeights.firstTouch}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customWeights.firstTouch}
                  onChange={(e) =>
                    onCustomWeightsChange?.({
                      ...customWeights,
                      firstTouch: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-700">Last Touch Weight</span>
                  <span className="text-sm font-medium text-accent-primary">
                    {customWeights.lastTouch}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customWeights.lastTouch}
                  onChange={(e) =>
                    onCustomWeightsChange?.({
                      ...customWeights,
                      lastTouch: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-700">Middle Touches Weight</span>
                  <span className="text-sm font-medium text-accent-primary">
                    {customWeights.middleTouches}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customWeights.middleTouches}
                  onChange={(e) =>
                    onCustomWeightsChange?.({
                      ...customWeights,
                      middleTouches: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              {customWeights.firstTouch + customWeights.lastTouch + customWeights.middleTouches !==
                100 && (
                <div className="text-xs text-status-warning flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Weights should sum to 100%
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// CHANNEL ATTRIBUTION TABLE
// =============================================================================

interface ChannelAttributionTableProps {
  data: ChannelAttribution[];
  onChannelClick?: (channel: string) => void;
}

function ChannelAttributionTable({ data, onChannelClick }: ChannelAttributionTableProps) {
  const [sortBy, setSortBy] = useState<keyof ChannelAttribution>('attributedRevenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });
  }, [data, sortBy, sortDir]);

  const totalRevenue = data.reduce((acc, d) => acc + d.attributedRevenue, 0);

  const handleSort = (column: keyof ChannelAttribution) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <ChartPieIcon className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-neutral-900">Channel Attribution</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Channel</th>
              <th
                className="px-4 py-3 text-right font-medium text-neutral-600 cursor-pointer hover:text-neutral-900"
                onClick={() => handleSort('attributedRevenue')}
              >
                Revenue {sortBy === 'attributedRevenue' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">% of Total</th>
              <th
                className="px-4 py-3 text-right font-medium text-neutral-600 cursor-pointer hover:text-neutral-900"
                onClick={() => handleSort('touchpoints')}
              >
                Touches {sortBy === 'touchpoints' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th
                className="px-4 py-3 text-right font-medium text-neutral-600 cursor-pointer hover:text-neutral-900"
                onClick={() => handleSort('conversionRate')}
              >
                Conv. Rate {sortBy === 'conversionRate' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Cost</th>
              <th
                className="px-4 py-3 text-right font-medium text-neutral-600 cursor-pointer hover:text-neutral-900"
                onClick={() => handleSort('roi')}
              >
                ROI {sortBy === 'roi' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-4 py-3 text-center font-medium text-neutral-600">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sortedData.map((channel) => {
              const percentOfTotal = (channel.attributedRevenue / totalRevenue) * 100;

              return (
                <tr
                  key={channel.channel}
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => onChannelClick?.(channel.channel)}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-neutral-900">{channel.channel}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900">
                    {formatCurrency(channel.attributedRevenue)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-neutral-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-accent-primary rounded"
                          style={{ width: `${percentOfTotal}%` }}
                        />
                      </div>
                      <span className="text-neutral-600 w-12">{formatPercent(percentOfTotal)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-700">{channel.touchpoints}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`${
                        channel.conversionRate >= 20
                          ? 'text-status-success'
                          : channel.conversionRate >= 10
                            ? 'text-status-warning'
                            : 'text-neutral-600'
                      }`}
                    >
                      {formatPercent(channel.conversionRate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600">
                    {formatCurrency(channel.cost)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-medium ${
                        channel.roi >= 10000
                          ? 'text-status-success'
                          : channel.roi >= 5000
                            ? 'text-status-warning'
                            : 'text-neutral-600'
                      }`}
                    >
                      {formatROI(channel.roi)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      {channel.trend === 'up' ? (
                        <ArrowTrendingUpIcon className="h-5 w-5 text-status-success" />
                      ) : channel.trend === 'down' ? (
                        <ArrowTrendingDownIcon className="h-5 w-5 text-status-error" />
                      ) : (
                        <ArrowPathIcon className="h-5 w-5 text-neutral-400" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// ACTIVITY ROI CHART
// =============================================================================

interface ActivityROIChartProps {
  data: ActivityROI[];
}

function ActivityROIChart({ data }: ActivityROIChartProps) {
  const maxROI = Math.max(...data.map((d) => d.roi));
  const maxRevenue = Math.max(...data.map((d) => d.attributedRevenue));

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-neutral-900">Activity ROI Analysis</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-accent-primary" />
            <span className="text-neutral-600">Revenue</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-status-success" />
            <span className="text-neutral-600">ROI %</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((activity) => {
          const revenueWidth = (activity.attributedRevenue / maxRevenue) * 100;
          const roiWidth = Math.min((activity.roi / maxROI) * 100, 100);
          const ActivityIcon = getActivityIcon(activity.activityType.toLowerCase());

          return (
            <div key={activity.activityType} className="group">
              <div className="flex items-center gap-3 mb-2">
                <ActivityIcon className="h-5 w-5 text-neutral-500" />
                <span className="text-sm font-medium text-neutral-900 w-24">
                  {activity.activityType}
                </span>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-neutral-100 rounded overflow-hidden">
                    <motion.div
                      className="h-full bg-accent-primary rounded"
                      initial={{ width: 0 }}
                      animate={{ width: `${revenueWidth}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="h-3 bg-neutral-100 rounded overflow-hidden">
                    <motion.div
                      className="h-full bg-status-success/60 rounded"
                      initial={{ width: 0 }}
                      animate={{ width: `${roiWidth}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                </div>
                <div className="w-32 text-right">
                  <div className="text-sm font-medium text-neutral-900">
                    {formatCurrency(activity.attributedRevenue)}
                  </div>
                  <div className="text-xs text-status-success">{formatROI(activity.roi)} ROI</div>
                </div>
              </div>

              {/* Expanded details on hover */}
              <div className="ml-8 pl-24 grid grid-cols-3 gap-4 text-xs text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <div>
                  <span className="text-neutral-400">Activities:</span> {activity.totalActivities}
                </div>
                <div>
                  <span className="text-neutral-400">Avg Time to Close:</span>{' '}
                  {activity.avgTimeToClose}d
                </div>
                <div>
                  <span className="text-neutral-400">Conversion:</span>{' '}
                  {formatPercent(activity.conversionRate)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// TOUCHPOINT JOURNEY VISUALIZATION
// =============================================================================

interface TouchpointJourneyProps {
  journeys: TouchpointJourney[];
  onDealClick?: (dealId: string) => void;
}

function TouchpointJourneyVisualization({ journeys, onDealClick }: TouchpointJourneyProps) {
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-neutral-900">Customer Journeys</h3>
        </div>
        <span className="text-sm text-neutral-500">{journeys.length} closed deals</span>
      </div>

      <div className="space-y-4">
        {journeys.map((journey) => (
          <div
            key={journey.dealId}
            className="border border-neutral-200 rounded-lg overflow-hidden"
          >
            {/* Deal Header */}
            <button
              onClick={() =>
                setExpandedDeal(expandedDeal === journey.dealId ? null : journey.dealId)
              }
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChevronRightIcon
                  className={`h-5 w-5 text-neutral-400 transition-transform ${
                    expandedDeal === journey.dealId ? 'rotate-90' : ''
                  }`}
                />
                <div className="text-left">
                  <div className="font-medium text-neutral-900">{journey.dealName}</div>
                  <div className="text-sm text-neutral-500">
                    {journey.touchpoints.length} touchpoints · {journey.totalDays} days
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-accent-primary">
                  {formatCurrency(journey.dealValue)}
                </div>
                <div className="text-xs text-neutral-500">Closed {journey.closeDate}</div>
              </div>
            </button>

            {/* Journey Timeline */}
            <AnimatePresence>
              {expandedDeal === journey.dealId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-2 border-t border-neutral-100">
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-200" />

                      {/* Touchpoints */}
                      <div className="space-y-4">
                        {journey.touchpoints.map((touch, idx) => {
                          const TouchIcon = getActivityIcon(touch.type);
                          const attributedValue = (touch.attribution / 100) * journey.dealValue;

                          return (
                            <div key={idx} className="relative flex items-start gap-4 pl-2">
                              {/* Icon */}
                              <div
                                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                  idx === 0
                                    ? 'bg-status-info text-white'
                                    : idx === journey.touchpoints.length - 1
                                      ? 'bg-status-success text-white'
                                      : 'bg-white border-2 border-neutral-300 text-neutral-500'
                                }`}
                              >
                                <TouchIcon className="h-4 w-4" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 pb-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium text-neutral-900 capitalize">
                                      {touch.type}
                                    </span>
                                    <span className="text-neutral-500 mx-2">·</span>
                                    <span className="text-sm text-neutral-500">{touch.channel}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm font-medium text-accent-primary">
                                      {formatCurrency(attributedValue)}
                                    </span>
                                    <span className="text-xs text-neutral-400 ml-1">
                                      ({touch.attribution}%)
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-neutral-500 mt-1">
                                  {touch.date} · {touch.owner}
                                </div>

                                {/* Attribution bar */}
                                <div className="mt-2 h-1.5 bg-neutral-100 rounded overflow-hidden">
                                  <motion.div
                                    className="h-full bg-accent-primary rounded"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${touch.attribution}%` }}
                                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* View Deal Button */}
                    {onDealClick && (
                      <button
                        onClick={() => onDealClick(journey.dealId)}
                        className="mt-4 w-full py-2 text-sm text-accent-primary hover:bg-accent-primary/5 rounded-lg transition-colors"
                      >
                        View Deal Details →
                      </button>
                    )}
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
// INSIGHTS PANEL
// =============================================================================

interface InsightsPanelProps {
  insights: AttributionInsight[];
}

function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <LightBulbIcon className="h-5 w-5 text-accent-primary" />
        <h3 className="font-semibold text-neutral-900">Attribution Insights</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const InsightIcon = getInsightIcon(insight.type);

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <InsightIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{insight.title}</span>
                    {insight.metric && (
                      <span className="text-sm font-medium">{insight.metric}</span>
                    )}
                  </div>
                  <p className="text-sm opacity-80 mt-1">{insight.description}</p>
                  {insight.recommendation && (
                    <p className="text-xs mt-2 pt-2 border-t border-current/10">
                      <span className="font-medium">Recommendation:</span> {insight.recommendation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// SUMMARY CARDS
// =============================================================================

interface SummaryCardsProps {
  channelData: ChannelAttribution[];
  activityData: ActivityROI[];
}

function SummaryCards({ channelData, activityData }: SummaryCardsProps) {
  const totalRevenue = channelData.reduce((acc, c) => acc + c.attributedRevenue, 0);
  const totalCost = channelData.reduce((acc, c) => acc + c.cost, 0);
  const overallROI = ((totalRevenue - totalCost) / totalCost) * 100;
  const avgConversion =
    channelData.reduce((acc, c) => acc + c.conversionRate, 0) / channelData.length;
  const topChannel = [...channelData].sort((a, b) => b.attributedRevenue - a.attributedRevenue)[0];

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-500">Attributed Revenue</span>
          <CurrencyDollarIcon className="h-4 w-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold text-neutral-900">{formatCurrency(totalRevenue)}</div>
        <div className="text-xs text-status-success mt-1 flex items-center gap-1">
          <ArrowTrendingUpIcon className="h-3 w-3" />
          +12% vs last period
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-500">Overall ROI</span>
          <ChartPieIcon className="h-4 w-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold text-status-success">{formatROI(overallROI)}</div>
        <div className="text-xs text-neutral-500 mt-1">
          {formatCurrency(totalCost)} invested
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-500">Avg Conversion</span>
          <FunnelIcon className="h-4 w-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold text-neutral-900">{formatPercent(avgConversion)}</div>
        <div className="text-xs text-status-success mt-1 flex items-center gap-1">
          <ArrowTrendingUpIcon className="h-3 w-3" />
          +2.3% vs last period
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-500">Top Channel</span>
          <CheckCircleIcon className="h-4 w-4 text-neutral-400" />
        </div>
        <div className="text-lg font-bold text-neutral-900 truncate">{topChannel?.channel}</div>
        <div className="text-xs text-neutral-500 mt-1">
          {formatCurrency(topChannel?.attributedRevenue || 0)} attributed
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

export interface RevenueAttributionDashboardProps {
  channelData?: ChannelAttribution[];
  activityData?: ActivityROI[];
  journeys?: TouchpointJourney[];
  insights?: AttributionInsight[];
  onDealClick?: (dealId: string) => void;
  onExport?: (format: 'csv' | 'pdf') => void;
  onRefresh?: () => void;
}

export function RevenueAttributionDashboard({
  channelData = SAMPLE_CHANNEL_ATTRIBUTION,
  activityData = SAMPLE_ACTIVITY_ROI,
  journeys = SAMPLE_TOUCHPOINT_JOURNEYS,
  insights = SAMPLE_INSIGHTS,
  onDealClick,
  onExport,
  onRefresh,
}: RevenueAttributionDashboardProps) {
  const [attributionModel, setAttributionModel] = useState<AttributionModel>('position_based');
  const [customWeights, setCustomWeights] = useState<ModelWeights>({
    firstTouch: 40,
    lastTouch: 40,
    middleTouches: 20,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'activities' | 'journeys'>(
    'overview'
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartPieIcon },
    { id: 'channels', label: 'Channels', icon: FunnelIcon },
    { id: 'activities', label: 'Activities', icon: ClockIcon },
    { id: 'journeys', label: 'Journeys', icon: LinkIcon },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Revenue Attribution</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track activity-to-revenue relationships and measure ROI
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            <button
              onClick={() => onExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* Attribution Model Selector */}
      <AttributionModelSelector
        selectedModel={attributionModel}
        onModelChange={setAttributionModel}
        customWeights={customWeights}
        onCustomWeightsChange={setCustomWeights}
      />

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
            <SummaryCards channelData={channelData} activityData={activityData} />

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <ChannelAttributionTable data={channelData} />
              </div>
              <div>
                <InsightsPanel insights={insights} />
              </div>
            </div>

            <ActivityROIChart data={activityData} />
          </motion.div>
        )}

        {activeTab === 'channels' && (
          <motion.div
            key="channels"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <ChannelAttributionTable data={channelData} />
            <InsightsPanel insights={insights.filter((i) => i.type !== 'success')} />
          </motion.div>
        )}

        {activeTab === 'activities' && (
          <motion.div
            key="activities"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <ActivityROIChart data={activityData} />

            {/* Activity Details Table */}
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-200">
                <h3 className="font-semibold text-neutral-900">Activity Performance Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-neutral-600">
                        Activity Type
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-neutral-600">Count</th>
                      <th className="px-4 py-3 text-right font-medium text-neutral-600">
                        Total Cost
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-neutral-600">Revenue</th>
                      <th className="px-4 py-3 text-right font-medium text-neutral-600">ROI</th>
                      <th className="px-4 py-3 text-right font-medium text-neutral-600">
                        Avg Time to Close
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-neutral-600">
                        Conversion
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {activityData.map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.activityType.toLowerCase());
                      return (
                        <tr key={activity.activityType} className="hover:bg-neutral-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ActivityIcon className="h-4 w-4 text-neutral-500" />
                              <span className="font-medium text-neutral-900">
                                {activity.activityType}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-neutral-700">
                            {activity.totalActivities}
                          </td>
                          <td className="px-4 py-3 text-right text-neutral-700">
                            {formatCurrency(activity.totalCost)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-neutral-900">
                            {formatCurrency(activity.attributedRevenue)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-status-success font-medium">
                              {formatROI(activity.roi)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-neutral-700">
                            {activity.avgTimeToClose}d
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`${
                                activity.conversionRate >= 30
                                  ? 'text-status-success'
                                  : activity.conversionRate >= 15
                                    ? 'text-status-warning'
                                    : 'text-neutral-600'
                              }`}
                            >
                              {formatPercent(activity.conversionRate)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'journeys' && (
          <motion.div
            key="journeys"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <TouchpointJourneyVisualization journeys={journeys} onDealClick={onDealClick} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  AttributionModelSelector,
  ChannelAttributionTable,
  ActivityROIChart,
  TouchpointJourneyVisualization,
  InsightsPanel,
  SummaryCards,
};

export type {
  AttributionModel,
  ActivityType,
  AttributedActivity,
  ChannelAttribution,
  ActivityROI,
  TouchpointJourney,
  AttributionInsight,
  ModelWeights,
};
