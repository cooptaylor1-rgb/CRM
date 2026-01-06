'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analyticsService, AdvisorDashboard } from '@/services/analytics.service';
import { tasksService, Task } from '@/services/tasks.service';
import { PageHeader, PageContent, ContentGrid } from '@/components/layout/AppShell';
import {
  MetricCard,
  MetricGrid,
  Card,
  CardHeader,
  Button,
  Badge,
  GoalProgress,
  ActionCenter,
  ActionItem,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  SkeletonDashboard,
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
  DataFreshness,
} from '@/components/ui';
import { 
  NextBestActions, 
  useNextBestActions,
  ConversationalSearch,
  SmartNotifications,
  SmartNotificationBell,
  generateMockNotifications,
} from '@/components/features';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowRightIcon,
  CalendarIcon,
  UserGroupIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<AdvisorDashboard | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => generateMockNotifications());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardData, tasksData] = await Promise.all([
        analyticsService.getDashboard(),
        tasksService.getAll({}).catch(() => []),
      ]);
      setDashboard(dashboardData);
      setTasks(tasksData);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generate next best actions from tasks and dashboard data
  const nextBestActions = useNextBestActions({
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      status: t.status,
      householdId: t.householdId,
      householdName: undefined, // Could be enriched
    })),
    meetings: dashboard?.upcomingMeetings?.map(m => ({
      id: m.id,
      title: m.title,
      startTime: m.startTime,
      householdId: (m as { householdId?: string }).householdId || '',
      householdName: m.householdName,
    })) || [],
  });

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Advisor Dashboard"
          subtitle="Loading your workspace..."
        />
        <PageContent>
          <SkeletonDashboard />
        </PageContent>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div>
        <PageHeader title="Advisor Dashboard" />
        <PageContent>
          <Card className="p-8">
            <EmptyState
              icon={<ExclamationTriangleIcon />}
              title="Unable to load dashboard"
              description={error || 'An unexpected error occurred. Please try again.'}
              action={
                <Button variant="secondary" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              }
            />
          </Card>
        </PageContent>
      </div>
    );
  }

  const { overview, recentActivity, goals, topClients, upcomingMeetings, alerts } = dashboard;

  // Calculate action items from alerts
  const actionItems = alerts?.map((alert) => ({
    label: alert.message,
    count: alert.count || 0,
    severity: (alert.severity === 'critical' ? 'high' : alert.severity === 'warning' ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    icon: alert.severity === 'critical' ? (
      <ExclamationTriangleIcon className="w-4 h-4" />
    ) : (
      <ClockIcon className="w-4 h-4" />
    ),
    href: alert.severity === 'critical' ? '/compliance' : '/tasks',
  })) || [];

  // Sort by severity
  actionItems.sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Advisor Dashboard"
        subtitle={
          <div className="flex items-center gap-3">
            <span>Welcome back</span>
            <DataFreshness 
              lastUpdated={lastUpdated} 
              onRefresh={fetchData}
              isRefreshing={loading}
            />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <SmartNotificationBell 
              count={notifications.filter(n => !n.read).length}
              urgentCount={notifications.filter(n => n.priority === 'urgent' && !n.read).length}
              onClick={() => setShowNotifications(!showNotifications)}
            />
          </div>
        }
      />

      <PageContent>
        {/* Smart Conversational Search - Magic v3 */}
        <Card className="mb-6 overflow-visible relative">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-content-primary">Ask anything about your clients</h3>
            </div>
            <ConversationalSearch 
              onSearch={(query, parsed) => {
                console.log('Search:', query, parsed);
              }}
              onResultSelect={(result) => {
                if (result.type === 'client' || result.type === 'household') {
                  router.push(`/households/${result.id}`);
                } else if (result.type === 'task') {
                  router.push(`/tasks`);
                } else if (result.type === 'meeting') {
                  router.push(`/meetings`);
                }
              }}
            />
          </div>
        </Card>

        {/* Notifications Panel (Slide-in) */}
        {showNotifications && (
          <div className="fixed top-20 right-4 z-50 w-96">
            <SmartNotifications
              notifications={notifications}
              onDismiss={(id) => setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
              )}
              onMarkRead={(id) => setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, read: true } : n)
              )}
              onMarkAllRead={() => setNotifications(prev => 
                prev.map(n => ({ ...n, read: true }))
              )}
              onNotificationClick={(notification) => {
                setShowNotifications(false);
                if (notification.relatedEntity) {
                  if (notification.relatedEntity.type === 'client') {
                    router.push(`/households/${notification.relatedEntity.id}`);
                  }
                }
              }}
            />
          </div>
        )}

        {/* Metrics Grid */}
        <MetricGrid columns={4} className="mb-6">
          <MetricCard
            label="Total Households"
            value={overview.totalHouseholds}
            icon="households"
            subtext="active clients"
          />
          <MetricCard
            label="Total AUM"
            value={overview.totalAum}
            formatAsCurrency
            icon="currency"
            change={
              overview.totalAum > 0
                ? { value: '+2.3% MTD', trend: 'up' }
                : undefined
            }
          />
          <MetricCard
            label="YTD Revenue"
            value={overview.ytdRevenue}
            formatAsCurrency
            icon="revenue"
            subtext="vs target"
          />
          <MetricCard
            label="Pipeline Value"
            value={overview.pipelineValue}
            formatAsCurrency
            icon="pipeline"
            subtext="active opportunities"
          />
        </MetricGrid>

        {/* Two Column Layout */}
        <ContentGrid layout="primary-secondary">
          {/* Left Column - Primary Content */}
          <div className="space-y-6">
            {/* Goals Progress */}
            <Card>
              <CardHeader title="Annual Goals" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GoalProgress
                  label="Revenue"
                  actual={goals.revenueActual}
                  target={goals.revenueTarget}
                  progress={goals.revenueProgress}
                  variant={goals.revenueProgress >= 100 ? 'success' : 'default'}
                  formatValue={(v) => formatCurrency(Number(v))}
                />
                <GoalProgress
                  label="Meetings"
                  actual={goals.meetingsActual}
                  target={goals.meetingsTarget}
                  progress={goals.meetingsProgress}
                  variant={goals.meetingsProgress >= 100 ? 'success' : 'default'}
                />
                <GoalProgress
                  label="New Clients"
                  actual={goals.newClientsActual}
                  target={goals.newClientsTarget}
                  progress={goals.newClientsProgress}
                  variant={goals.newClientsProgress >= 100 ? 'success' : 'default'}
                />
              </div>
            </Card>

            {/* Top Clients Table */}
            <Card noPadding>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <h3 className="text-subtitle text-content-primary">Top Clients by AUM</h3>
                <Link
                  href="/households"
                  className="text-sm text-content-link hover:text-content-primary transition-colors flex items-center gap-1"
                >
                  View all
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>
              {topClients && topClients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Household</TableHead>
                      <TableHead className="text-right">AUM</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Last Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClients.slice(0, 5).map((client) => (
                      <TableRow key={client.householdId}>
                        <TableCell>
                          <Link
                            href={`/households/${client.householdId}`}
                            className="font-medium text-content-link hover:underline"
                          >
                            {client.householdName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(client.aum)}
                        </TableCell>
                        <TableCell className="text-right text-content-secondary">
                          {formatCurrency(client.revenue)}
                        </TableCell>
                        <TableCell className="text-right text-content-tertiary text-sm">
                          {formatRelativeTime(client.lastContact)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="px-5 pb-5">
                  <EmptyState
                    icon={<UserGroupIcon />}
                    title="No clients yet"
                    description="Add your first household to get started"
                  />
                </div>
              )}
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader title="This Month's Activity" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <p className="text-2xl font-semibold text-accent-600">
                    {recentActivity.tasksCompleted}
                  </p>
                  <p className="text-sm text-content-secondary">Tasks Done</p>
                </div>
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <p className="text-2xl font-semibold text-accent-600">
                    {recentActivity.meetingsCompleted}
                  </p>
                  <p className="text-sm text-content-secondary">Meetings</p>
                </div>
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <p className="text-2xl font-semibold text-accent-600">
                    {recentActivity.emailsSent}
                  </p>
                  <p className="text-sm text-content-secondary">Emails</p>
                </div>
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <p className="text-2xl font-semibold text-accent-600">
                    {recentActivity.newProspects}
                  </p>
                  <p className="text-sm text-content-secondary">New Leads</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Secondary Content */}
          <div className="space-y-6">
            {/* Next Best Actions - Magic v2 */}
            <NextBestActions 
              actions={nextBestActions} 
              maxItems={5}
              compact
            />

            {/* Action Center */}
            {actionItems.length > 0 && (
              <ActionCenter
                title="Action Required"
                footer={
                  <Link
                    href="/tasks"
                    className="text-sm text-content-link hover:text-content-primary transition-colors flex items-center gap-1"
                  >
                    Review all items
                    <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                }
              >
                {actionItems.map((item, idx) => (
                  <ActionItem
                    key={idx}
                    icon={item.icon}
                    label={item.label}
                    count={item.count}
                    severity={item.severity}
                    href={item.href}
                  />
                ))}
              </ActionCenter>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader title="Quick Stats" />
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-content-secondary">Overdue Tasks</span>
                  <Badge variant={overview.tasksOverdue > 0 ? 'error' : 'default'}>
                    {overview.tasksOverdue}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-content-secondary">Meetings This Week</span>
                  <Badge variant="info">{overview.meetingsThisWeek}</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-content-secondary">Reviews Due</span>
                  <Badge variant={overview.reviewsDue > 0 ? 'warning' : 'default'}>
                    {overview.reviewsDue}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Upcoming Meetings */}
            <Card>
              <CardHeader
                title="Upcoming Meetings"
                action={
                  <Link
                    href="/meetings"
                    className="text-sm text-content-link hover:text-content-primary transition-colors"
                  >
                    View all
                  </Link>
                }
              />
              {upcomingMeetings && upcomingMeetings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMeetings.slice(0, 4).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-md bg-accent-100 flex items-center justify-center shrink-0">
                        <CalendarIcon className="w-4 h-4 text-accent-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-content-primary truncate">
                          {meeting.title}
                        </p>
                        <p className="text-xs text-content-tertiary truncate">
                          {meeting.householdName}
                        </p>
                        <p className="text-xs text-content-secondary mt-1">
                          {formatDateTime(meeting.startTime)}
                        </p>
                      </div>
                      <Badge variant="default" size="sm">
                        {meeting.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CalendarIcon />}
                  title="No upcoming meetings"
                  description="Schedule a meeting to stay connected with clients"
                />
              )}
            </Card>
          </div>
        </ContentGrid>
      </PageContent>
    </div>
  );
}
