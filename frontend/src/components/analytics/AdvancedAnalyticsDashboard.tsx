'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  UsersIcon,
  DollarSignIcon,
  BarChart3Icon,
  PieChartIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ActivityIcon,
  TargetIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  DownloadIcon,
  FilterIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { Card, Badge, Button, Select, Skeleton } from '@/components/ui';

// =============================================================================
// Types
// =============================================================================

interface MetricCardData {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  color: string;
}

interface ChartDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

interface PipelineStage {
  name: string;
  count: number;
  value: number;
  conversion: number;
}

// =============================================================================
// Mock Data (Would come from API in production)
// =============================================================================

const mockMetrics: MetricCardData[] = [
  {
    title: 'Total AUM',
    value: '$847.2M',
    change: 8.3,
    changeLabel: 'vs last month',
    icon: DollarSignIcon,
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Active Clients',
    value: 342,
    change: 5.2,
    changeLabel: 'vs last month',
    icon: UsersIcon,
    color: 'from-green-500 to-green-600',
  },
  {
    title: 'Monthly Revenue',
    value: '$1.24M',
    change: 12.4,
    changeLabel: 'vs last month',
    icon: TrendingUpIcon,
    color: 'from-purple-500 to-purple-600',
  },
  {
    title: 'Avg Client Value',
    value: '$2.48M',
    change: 3.1,
    changeLabel: 'vs last month',
    icon: TargetIcon,
    color: 'from-orange-500 to-orange-600',
  },
];

const mockAumTrend: ChartDataPoint[] = [
  { label: 'Jan', value: 720, previousValue: 680 },
  { label: 'Feb', value: 735, previousValue: 700 },
  { label: 'Mar', value: 758, previousValue: 715 },
  { label: 'Apr', value: 771, previousValue: 730 },
  { label: 'May', value: 789, previousValue: 745 },
  { label: 'Jun', value: 802, previousValue: 760 },
  { label: 'Jul', value: 815, previousValue: 775 },
  { label: 'Aug', value: 827, previousValue: 790 },
  { label: 'Sep', value: 838, previousValue: 805 },
  { label: 'Oct', value: 847, previousValue: 820 },
];

const mockPipelineStages: PipelineStage[] = [
  { name: 'Lead', count: 45, value: 12500000, conversion: 68 },
  { name: 'Qualified', count: 32, value: 9800000, conversion: 72 },
  { name: 'Proposal', count: 18, value: 6200000, conversion: 61 },
  { name: 'Negotiation', count: 12, value: 4100000, conversion: 83 },
  { name: 'Won', count: 8, value: 2800000, conversion: 100 },
];

const mockAssetAllocation = [
  { name: 'US Equities', value: 42, color: '#3B82F6' },
  { name: 'International Equities', value: 18, color: '#10B981' },
  { name: 'Fixed Income', value: 25, color: '#F59E0B' },
  { name: 'Alternatives', value: 10, color: '#8B5CF6' },
  { name: 'Cash', value: 5, color: '#6B7280' },
];

const mockTopAdvisors = [
  { name: 'Jennifer Adams', aum: 185.2, clients: 48, newClients: 6, retention: 98 },
  { name: 'Michael Chen', aum: 162.8, clients: 42, newClients: 4, retention: 96 },
  { name: 'Sarah Williams', aum: 148.5, clients: 38, newClients: 5, retention: 97 },
  { name: 'David Johnson', aum: 134.2, clients: 35, newClients: 3, retention: 94 },
  { name: 'Emily Brown', aum: 121.8, clients: 32, newClients: 4, retention: 95 },
];

const mockClientActivity = [
  { label: 'Meetings This Month', value: 87, target: 100, trend: 12 },
  { label: 'Reviews Completed', value: 45, target: 60, trend: -5 },
  { label: 'Tasks Completed', value: 234, target: 250, trend: 8 },
  { label: 'Documents Signed', value: 32, target: 40, trend: 15 },
];

// =============================================================================
// Component
// =============================================================================

export function AdvancedAnalyticsDashboard() {
  const [timeRange, setTimeRange] = React.useState('month');
  const [loading, setLoading] = React.useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive view of your wealth management practice
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={timeRange}
            onChange={setTimeRange}
            options={[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'quarter', label: 'This Quarter' },
              { value: 'year', label: 'This Year' },
              { value: 'ytd', label: 'Year to Date' },
            ]}
          />
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <DownloadIcon className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockMetrics.map((metric, index) => (
          <MetricCard key={metric.title} data={metric} delay={index * 0.1} />
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AUM Trend Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">AUM Growth Trend</h3>
              <p className="text-sm text-muted-foreground">Assets under management over time</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <ArrowUpIcon className="w-3 h-3" />
              +17.6% YoY
            </Badge>
          </div>
          <AumTrendChart data={mockAumTrend} />
        </Card>

        {/* Asset Allocation */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Asset Allocation</h3>
            <PieChartIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <AssetAllocationChart data={mockAssetAllocation} />
        </Card>
      </div>

      {/* Pipeline & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Sales Pipeline</h3>
              <p className="text-sm text-muted-foreground">Prospect conversion funnel</p>
            </div>
            <Badge variant="secondary">$35.4M potential</Badge>
          </div>
          <PipelineFunnel stages={mockPipelineStages} />
        </Card>

        {/* Client Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Activity Metrics</h3>
              <p className="text-sm text-muted-foreground">This month vs targets</p>
            </div>
            <ActivityIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <ActivityMetrics data={mockClientActivity} />
        </Card>
      </div>

      {/* Advisor Performance */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-foreground">Advisor Performance</h3>
            <p className="text-sm text-muted-foreground">Top performers by AUM</p>
          </div>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
        <AdvisorLeaderboard advisors={mockTopAdvisors} />
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          label="New Clients (MTD)"
          value={12}
          icon={UsersIcon}
          trend={+3}
        />
        <QuickStat
          label="Avg Meeting Length"
          value="47 min"
          icon={ClockIcon}
          trend={-5}
        />
        <QuickStat
          label="Client Satisfaction"
          value="94%"
          icon={CheckCircleIcon}
          trend={+2}
        />
        <QuickStat
          label="At-Risk Clients"
          value={8}
          icon={AlertTriangleIcon}
          trend={-2}
          invertTrend
        />
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function MetricCard({ data, delay }: { data: MetricCardData; delay: number }) {
  const Icon = data.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{data.title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{data.value}</p>
            <div className="flex items-center gap-1 mt-2">
              {data.change >= 0 ? (
                <ArrowUpIcon className="w-3 h-3 text-green-500" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  data.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(data.change)}%
              </span>
              <span className="text-xs text-muted-foreground">{data.changeLabel}</span>
            </div>
          </div>
          <div
            className={`p-3 rounded-lg bg-gradient-to-br ${data.color} text-white`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function AumTrendChart({ data }: { data: ChartDataPoint[] }) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.previousValue || 0)));

  return (
    <div className="h-64">
      <div className="flex items-end justify-between h-48 gap-2">
        {data.map((point, i) => (
          <div key={point.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex-1 w-full flex items-end gap-1">
              {point.previousValue && (
                <motion.div
                  className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: `${(point.previousValue / maxValue) * 100}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                />
              )}
              <motion.div
                className="flex-1 bg-primary rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${(point.value / maxValue) * 100}%` }}
                transition={{ delay: i * 0.05 + 0.1, duration: 0.5 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {data.map((point) => (
          <span key={point.label} className="text-xs text-muted-foreground">
            {point.label}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded" />
          <span className="text-xs text-muted-foreground">Current Year</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
          <span className="text-xs text-muted-foreground">Previous Year</span>
        </div>
      </div>
    </div>
  );
}

function AssetAllocationChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulativePercent = 0;

  return (
    <div className="space-y-4">
      {/* Donut Chart */}
      <div className="relative w-40 h-40 mx-auto">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {data.map((item, i) => {
            const percent = (item.value / total) * 100;
            const dashArray = `${percent} ${100 - percent}`;
            const dashOffset = -cumulativePercent;
            cumulativePercent += percent;

            return (
              <circle
                key={item.name}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={item.color}
                strokeWidth="20"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">$847M</p>
            <p className="text-xs text-muted-foreground">Total AUM</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-foreground">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineFunnel({ stages }: { stages: PipelineStage[] }) {
  const maxValue = stages[0]?.value || 1;

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <motion.div
          key={stage.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">{stage.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{stage.count} prospects</span>
              <span className="text-sm font-medium text-foreground">
                ${(stage.value / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
          <div className="h-8 bg-background-secondary rounded overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded flex items-center justify-end pr-2"
              initial={{ width: 0 }}
              animate={{ width: `${(stage.value / maxValue) * 100}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <span className="text-xs text-white font-medium">{stage.conversion}%</span>
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ActivityMetrics({
  data,
}: {
  data: { label: string; value: number; target: number; trend: number }[];
}) {
  return (
    <div className="space-y-4">
      {data.map((item, i) => {
        const progress = (item.value / item.target) * 100;
        const isOnTrack = progress >= 80;

        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-foreground">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {item.value} / {item.target}
                </span>
                <span
                  className={`text-xs ${item.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {item.trend >= 0 ? '+' : ''}
                  {item.trend}%
                </span>
              </div>
            </div>
            <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isOnTrack ? 'bg-green-500' : 'bg-yellow-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function AdvisorLeaderboard({
  advisors,
}: {
  advisors: {
    name: string;
    aum: number;
    clients: number;
    newClients: number;
    retention: number;
  }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
              Advisor
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
              AUM
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
              Clients
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
              New (MTD)
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
              Retention
            </th>
          </tr>
        </thead>
        <tbody>
          {advisors.map((advisor, i) => (
            <motion.tr
              key={advisor.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="border-b border-border last:border-0 hover:bg-background-secondary"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-sm font-medium">
                    {advisor.name.charAt(0)}
                  </div>
                  <span className="font-medium text-foreground">{advisor.name}</span>
                </div>
              </td>
              <td className="text-right py-3 px-4 font-medium text-foreground">
                ${advisor.aum}M
              </td>
              <td className="text-right py-3 px-4 text-foreground">{advisor.clients}</td>
              <td className="text-right py-3 px-4">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  +{advisor.newClients}
                </Badge>
              </td>
              <td className="text-right py-3 px-4">
                <span
                  className={`font-medium ${
                    advisor.retention >= 95 ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {advisor.retention}%
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuickStat({
  label,
  value,
  icon: Icon,
  trend,
  invertTrend = false,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend: number;
  invertTrend?: boolean;
}) {
  const trendPositive = invertTrend ? trend < 0 : trend > 0;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-background-secondary">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">{value}</span>
            <span
              className={`text-xs font-medium ${
                trendPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend > 0 ? '+' : ''}
              {trend}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default AdvancedAnalyticsDashboard;
