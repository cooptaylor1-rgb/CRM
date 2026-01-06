'use client';

import { useEffect, useState } from 'react';
import { 
  PageHeader, 
  PageContent,
  ContentGrid,
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  CardHeader,
  MetricCard,
  MetricGrid,
  Select,
  TrendIndicator,
  SegmentedDonutChart,
  formatCurrency,
} from '@/components/ui';
import { 
  ArrowDownTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { analyticsService, FirmOverview, ClientProfitability } from '@/services/analytics.service';

const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export default function AnalyticsPage() {
  const [firmOverview, setFirmOverview] = useState<FirmOverview | null>(null);
  const [profitability, setProfitability] = useState<ClientProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('ytd');
  const [activeTab, setActiveTab] = useState<'overview' | 'profitability' | 'performance' | 'reports'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overview, profit] = await Promise.all([
          analyticsService.getFirmOverview(),
          analyticsService.getClientProfitability(),
        ]);
        setFirmOverview(overview);
        setProfitability(profit);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);

  // Mock data for charts
  const aumByTier = [
    { label: 'Platinum', value: 85000000, color: 'hsl(215, 20%, 45%)' },
    { label: 'Gold', value: 42000000, color: 'hsl(45, 80%, 50%)' },
    { label: 'Silver', value: 18000000, color: 'hsl(210, 10%, 60%)' },
    { label: 'Bronze', value: 5000000, color: 'hsl(25, 70%, 55%)' },
  ];

  const revenueByType = [
    { label: 'Management Fees', value: 1250000, color: 'hsl(198, 44%, 34%)' },
    { label: 'Advisory Fees', value: 320000, color: 'hsl(152, 38%, 40%)' },
    { label: 'Planning Fees', value: 180000, color: 'hsl(262, 32%, 50%)' },
    { label: 'Performance Fees', value: 95000, color: 'hsl(38, 58%, 50%)' },
  ];

  const monthlyRevenue = [
    { month: 'Jan', value: 145000 },
    { month: 'Feb', value: 152000 },
    { month: 'Mar', value: 148000 },
    { month: 'Apr', value: 165000 },
    { month: 'May', value: 158000 },
    { month: 'Jun', value: 172000 },
    { month: 'Jul', value: 168000 },
    { month: 'Aug', value: 175000 },
    { month: 'Sep', value: 180000 },
    { month: 'Oct', value: 185000 },
    { month: 'Nov', value: 178000 },
    { month: 'Dec', value: 192000 },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title="Analytics" subtitle="Loading..." />
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Analytics & Reports"
        subtitle="Firm performance, client profitability, and business intelligence"
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={dateRange}
              onChange={(val) => setDateRange(val)}
              options={[
                { value: 'mtd', label: 'Month to Date' },
                { value: 'qtd', label: 'Quarter to Date' },
                { value: 'ytd', label: 'Year to Date' },
                { value: 'last_year', label: 'Last Year' },
                { value: 'custom', label: 'Custom Range' },
              ]}
            />
            <Button variant="secondary" leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}>
              Export
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Tabs */}
        <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1 mb-6 w-fit">
          {[
            { id: 'overview', label: 'Firm Overview' },
            { id: 'profitability', label: 'Client Profitability' },
            { id: 'performance', label: 'Performance' },
            { id: 'reports', label: 'Reports' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-surface-primary text-content-primary shadow-sm' 
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && firmOverview && (
          <>
            {/* Key Metrics */}
            <MetricGrid columns={4} className="mb-6">
              <MetricCard
                label="Assets Under Management"
                value={formatCompactCurrency(firmOverview.aum.total)}
                change={{
                  value: `${firmOverview.aum.changePercent >= 0 ? '+' : ''}${firmOverview.aum.changePercent.toFixed(1)}%`,
                  trend: firmOverview.aum.changePercent >= 0 ? 'up' : 'down',
                }}
                icon="currency"
              />
              <MetricCard
                label="YTD Revenue"
                value={formatCompactCurrency(firmOverview.revenue.ytd)}
                change={{
                  value: `${firmOverview.revenue.changePercent >= 0 ? '+' : ''}${firmOverview.revenue.changePercent.toFixed(1)}%`,
                  trend: firmOverview.revenue.changePercent >= 0 ? 'up' : 'down',
                }}
                icon="revenue"
              />
              <MetricCard
                label="Total Clients"
                value={firmOverview.clients.total.toString()}
                subtext={`${firmOverview.clients.new} new, ${firmOverview.clients.lost} lost`}
                icon="households"
              />
              <MetricCard
                label="Client Retention"
                value={`${firmOverview.clients.retentionRate.toFixed(1)}%`}
                subtext={`${formatCompactCurrency(firmOverview.clients.averageAum)} avg AUM`}
                icon="growth"
              />
            </MetricGrid>

            {/* AUM & Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader title="AUM by Client Tier" />
                <div className="p-6">
                  <div className="flex items-center gap-8">
                    <div className="w-48 h-48">
                      <SegmentedDonutChart
                        data={aumByTier}
                        size={192}
                        innerLabel={formatCompactCurrency(aumByTier.reduce((s, d) => s + d.value, 0))}
                        innerSubLabel="Total AUM"
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      {aumByTier.map(tier => (
                        <div key={tier.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                            <span className="text-sm text-content-primary">{tier.label}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-content-primary">
                              {formatCompactCurrency(tier.value)}
                            </span>
                            <span className="text-xs text-content-tertiary ml-2">
                              ({((tier.value / aumByTier.reduce((s, d) => s + d.value, 0)) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Revenue by Fee Type" />
                <div className="p-6">
                  <div className="flex items-center gap-8">
                    <div className="w-48 h-48">
                      <SegmentedDonutChart
                        data={revenueByType}
                        size={192}
                        innerLabel={formatCompactCurrency(revenueByType.reduce((s, d) => s + d.value, 0))}
                        innerSubLabel="Total Revenue"
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      {revenueByType.map(type => (
                        <div key={type.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                            <span className="text-sm text-content-primary">{type.label}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-content-primary">
                              {formatCompactCurrency(type.value)}
                            </span>
                            <span className="text-xs text-content-tertiary ml-2">
                              ({((type.value / revenueByType.reduce((s, d) => s + d.value, 0)) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Monthly Revenue Trend */}
            <Card className="mb-6">
              <CardHeader 
                title="Monthly Revenue" 
                subtitle="Year to date revenue by month"
                action={
                  <Select
                    value="revenue"
                    onChange={() => {}}
                    options={[
                      { value: 'revenue', label: 'Revenue' },
                      { value: 'aum', label: 'AUM' },
                      { value: 'clients', label: 'Client Count' },
                    ]}
                  />
                }
              />
              <div className="p-6">
                <div className="h-64 flex items-end gap-2">
                  {monthlyRevenue.map((month, idx) => {
                    const maxValue = Math.max(...monthlyRevenue.map(m => m.value));
                    const height = (month.value / maxValue) * 100;
                    return (
                      <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-accent-500 rounded-t hover:bg-accent-600 transition-colors cursor-pointer group relative"
                          style={{ height: `${height}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-elevated shadow-lg rounded text-xs font-medium text-content-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatCurrency(month.value)}
                          </div>
                        </div>
                        <span className="text-xs text-content-tertiary">{month.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Efficiency Metrics & Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Efficiency Metrics" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent-100 rounded-lg">
                        <CurrencyDollarIcon className="w-5 h-5 text-accent-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-content-primary">Revenue per Advisor</p>
                        <p className="text-xs text-content-tertiary">Annual revenue per FTE</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-content-primary">
                      {formatCompactCurrency(firmOverview.efficiency.revenuePerAdvisor)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent-100 rounded-lg">
                        <ChartBarIcon className="w-5 h-5 text-accent-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-content-primary">AUM per Advisor</p>
                        <p className="text-xs text-content-tertiary">Assets managed per FTE</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-content-primary">
                      {formatCompactCurrency(firmOverview.efficiency.aumPerAdvisor)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent-100 rounded-lg">
                        <UserGroupIcon className="w-5 h-5 text-accent-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-content-primary">Households per Advisor</p>
                        <p className="text-xs text-content-tertiary">Client relationships per FTE</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-content-primary">
                      {firmOverview.efficiency.householdsPerAdvisor}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success-100 rounded-lg">
                        <ArrowTrendingUpIcon className="w-5 h-5 text-status-success-text" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-content-primary">Operating Margin</p>
                        <p className="text-xs text-content-tertiary">Net income / revenue</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-status-success-text">
                      {firmOverview.efficiency.operatingMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Compliance Status" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-status-warning-bg rounded-lg">
                        <ClockIcon className="w-5 h-5 text-status-warning-text" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-content-primary">Overdue Reviews</p>
                        <p className="text-xs text-content-tertiary">Client reviews past due</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-status-warning-text">
                      {firmOverview.compliance.overdueReviews}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-status-error-bg rounded-lg">
                        <ExclamationTriangleIcon className="w-5 h-5 text-status-error-text" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-content-primary">Expiring KYC</p>
                        <p className="text-xs text-content-tertiary">KYC expiring in 30 days</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-status-error-text">
                      {firmOverview.compliance.expiringKyc}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-status-info-bg rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-status-info-text" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-content-primary">Open Issues</p>
                        <p className="text-xs text-content-tertiary">Compliance issues requiring attention</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-status-info-text">
                      {firmOverview.compliance.openIssues}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'profitability' && (
          <>
            {/* Profitability Summary */}
            <MetricGrid columns={4} className="mb-6">
              <MetricCard
                label="Total Revenue"
                value={formatCompactCurrency(profitability.reduce((s, c) => s + c.totalRevenue, 0))}
                icon="revenue"
              />
              <MetricCard
                label="Average Margin"
                value={`${(profitability.reduce((s, c) => s + c.netMargin, 0) / profitability.length).toFixed(1)}%`}
                icon="growth"
              />
              <MetricCard
                label="Top Tier Clients"
                value={profitability.filter(c => c.tier === 'platinum').length.toString()}
                subtext="Platinum tier"
                icon="households"
              />
              <MetricCard
                label="Avg Revenue/Hour"
                value={formatCurrency(profitability.reduce((s, c) => s + c.revenuePerHour, 0) / profitability.length)}
                icon="calendar"
              />
            </MetricGrid>

            {/* Profitability Table */}
            <Card>
              <CardHeader 
                title="Client Profitability Analysis" 
                subtitle="Revenue, costs, and profitability by household"
              />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary">
                      <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Household</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Tier</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">AUM</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Revenue</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Cost</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Profit</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Margin</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Hours</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">$/Hour</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {profitability.map(client => (
                      <tr key={client.householdId} className="hover:bg-surface-secondary transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-content-primary">{client.householdName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            client.tier === 'platinum' ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white' :
                            client.tier === 'gold' ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' :
                            client.tier === 'silver' ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white' :
                            'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
                          }`}>
                            {client.tier.charAt(0).toUpperCase() + client.tier.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-content-primary">
                          {formatCompactCurrency(client.aum)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-content-primary">
                          {formatCurrency(client.totalRevenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-content-secondary">
                          {formatCurrency(client.totalCost)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          <span className={client.netProfit >= 0 ? 'text-status-success-text' : 'text-status-error-text'}>
                            {formatCurrency(client.netProfit)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <span className={client.netMargin >= 30 ? 'text-status-success-text' : client.netMargin >= 15 ? 'text-status-warning-text' : 'text-status-error-text'}>
                            {client.netMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-content-secondary">
                          {client.totalHours.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-content-primary">
                          {formatCurrency(client.revenuePerHour)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold ${
                            client.profitabilityScore >= 80 ? 'bg-status-success-bg text-status-success-text' :
                            client.profitabilityScore >= 60 ? 'bg-status-warning-bg text-status-warning-text' :
                            'bg-status-error-bg text-status-error-text'
                          }`}>
                            {client.profitabilityScore}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'performance' && (
          <Card className="p-12 text-center">
            <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-content-tertiary" />
            <h3 className="text-lg font-medium text-content-primary mb-2">Performance Reporting</h3>
            <p className="text-content-secondary mb-6">
              Time-weighted returns, benchmark comparisons, and attribution analysis coming soon.
            </p>
            <Button variant="secondary">Configure Performance Benchmarks</Button>
          </Card>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                title: 'Quarterly Review Report', 
                description: 'Comprehensive quarterly performance and activity summary',
                icon: CalendarIcon,
                action: 'Generate' 
              },
              { 
                title: 'Client Profitability Report', 
                description: 'Detailed revenue and cost analysis by household',
                icon: CurrencyDollarIcon,
                action: 'Generate' 
              },
              { 
                title: 'AUM & Revenue Trend', 
                description: 'Historical AUM and revenue with projections',
                icon: ChartBarIcon,
                action: 'Generate' 
              },
              { 
                title: 'Compliance Summary', 
                description: 'KYC status, review schedule, and regulatory items',
                icon: CheckCircleIcon,
                action: 'Generate' 
              },
              { 
                title: 'Client Retention Analysis', 
                description: 'Client acquisition, attrition, and retention metrics',
                icon: UserGroupIcon,
                action: 'Generate' 
              },
              { 
                title: 'Advisor Productivity', 
                description: 'Advisor efficiency and capacity analysis',
                icon: BuildingOfficeIcon,
                action: 'Generate' 
              },
            ].map(report => (
              <Card key={report.title} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-accent-100 rounded-lg">
                    <report.icon className="w-6 h-6 text-accent-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-content-primary">{report.title}</h3>
                    <p className="text-sm text-content-secondary mt-1 mb-4">{report.description}</p>
                    <Button size="sm" variant="secondary">{report.action}</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContent>
    </>
  );
}
