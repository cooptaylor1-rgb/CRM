'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BrainIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  CalendarIcon,
  SparklesIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  HeartIcon,
  ShieldAlertIcon,
  TargetIcon,
  UsersIcon,
  BriefcaseIcon,
  HomeIcon,
  UserPlusIcon,
  GraduationCapIcon,
  CakeIcon,
  AlertCircleIcon,
  ClockIcon,
  BuildingIcon,
  FileTextIcon,
  DollarSignIcon,
  HeartPulseIcon,
  TrophyIcon,
} from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '@/components/ui';
import {
  intelligenceService,
  ClientInsight,
  LifeEvent,
  LifeEventType,
  RiskScore,
  InsightsDashboard,
  insightTypeLabels,
  insightPriorityColors,
  lifeEventTypeLabels,
  riskLevelLabels,
  riskLevelColors,
} from '@/services/intelligence.service';

// =============================================================================
// Life Event Icon Helper
// =============================================================================

const getLifeEventIcon = (eventType: LifeEventType): React.ReactNode => {
  const iconClass = "w-5 h-5";
  switch (eventType) {
    case 'marriage':
    case 'divorce':
      return <HeartIcon className={iconClass} />;
    case 'birth_of_child':
      return <UserPlusIcon className={iconClass} />;
    case 'death_in_family':
      return <HeartPulseIcon className={iconClass} />;
    case 'child_graduation':
    case 'child_college':
      return <GraduationCapIcon className={iconClass} />;
    case 'retirement':
      return <CalendarIcon className={iconClass} />;
    case 'job_change':
    case 'promotion':
      return <BriefcaseIcon className={iconClass} />;
    case 'business_sale':
      return <BuildingIcon className={iconClass} />;
    case 'inheritance':
    case 'large_withdrawal':
    case 'large_deposit':
      return <DollarSignIcon className={iconClass} />;
    case 'home_purchase':
    case 'home_sale':
      return <HomeIcon className={iconClass} />;
    case 'major_illness':
    case 'disability':
    case 'long_term_care':
      return <AlertCircleIcon className={iconClass} />;
    case 'birthday_milestone':
      return <CakeIcon className={iconClass} />;
    case 'account_anniversary':
    case 'aum_milestone':
      return <TrophyIcon className={iconClass} />;
    case 'estate_plan_update':
      return <FileTextIcon className={iconClass} />;
    case 'beneficiary_change':
      return <UsersIcon className={iconClass} />;
    case 'rmd_approaching':
      return <ClockIcon className={iconClass} />;
    default:
      return <CalendarIcon className={iconClass} />;
  }
};

// =============================================================================
// Component
// =============================================================================

export function IntelligenceDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [dashboard, setDashboard] = React.useState<InsightsDashboard | null>(null);
  const [lifeEvents, setLifeEvents] = React.useState<LifeEvent[]>([]);
  const [highRiskHouseholds, setHighRiskHouseholds] = React.useState<
    { household: { id: string; name: string }; riskScore: RiskScore }[]
  >([]);

  const loadData = React.useCallback(async (showRefreshToast = false) => {
    try {
      const [dashboardData, eventsData, highRiskData] = await Promise.all([
        intelligenceService.getInsightsDashboard(),
        intelligenceService.getLifeEvents({ acknowledged: 'false' }),
        intelligenceService.getHighRiskHouseholds(5),
      ]);

      setDashboard(dashboardData);
      setLifeEvents(eventsData.slice(0, 5));
      setHighRiskHouseholds(highRiskData);

      if (showRefreshToast) {
        toast.success('Intelligence data refreshed');
      }
    } catch (err) {
      toast.error('Failed to load intelligence data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleAcknowledgeEvent = async (eventId: string) => {
    try {
      await intelligenceService.acknowledgeLifeEvent(eventId);
      setLifeEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success('Life event acknowledged');
    } catch {
      toast.error('Failed to acknowledge event');
    }
  };

  const handleDismissInsight = async (insightId: string) => {
    try {
      await intelligenceService.updateInsightStatus(insightId, 'dismissed');
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recentInsights: prev.recentInsights.filter((i) => i.id !== insightId),
        };
      });
      toast.success('Insight dismissed');
    } catch {
      toast.error('Failed to dismiss insight');
    }
  };

  if (loading) {
    return <IntelligenceDashboardSkeleton />;
  }

  const totalInsights = dashboard
    ? dashboard.critical + dashboard.high + dashboard.medium + dashboard.low
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
            <BrainIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Client Intelligence</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered insights and recommendations
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Critical Insights"
          value={dashboard?.critical || 0}
          icon={<AlertTriangleIcon className="w-5 h-5" />}
          color="red"
          subtitle="Requires immediate attention"
        />
        <StatCard
          title="Active Insights"
          value={totalInsights}
          icon={<SparklesIcon className="w-5 h-5" />}
          color="purple"
          subtitle="Across all priorities"
        />
        <StatCard
          title="Pending Life Events"
          value={lifeEvents.length}
          icon={<HeartIcon className="w-5 h-5" />}
          color="pink"
          subtitle="Requiring acknowledgment"
        />
        <StatCard
          title="High Risk Clients"
          value={highRiskHouseholds.length}
          icon={<ShieldAlertIcon className="w-5 h-5" />}
          color="orange"
          subtitle="Need proactive outreach"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Insights */}
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Recent Insights</h2>
              <Badge variant="secondary">{totalInsights} total</Badge>
            </div>
          </div>
          <div className="divide-y divide-border">
            {dashboard?.recentInsights.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <SparklesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No active insights</p>
              </div>
            ) : (
              dashboard?.recentInsights.map((insight) => (
                <InsightRow
                  key={insight.id}
                  insight={insight}
                  onDismiss={() => handleDismissInsight(insight.id)}
                />
              ))
            )}
          </div>
        </Card>

        {/* Life Events */}
        <Card>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Life Events</h2>
              <Badge variant="secondary">{lifeEvents.length} pending</Badge>
            </div>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {lifeEvents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pending life events</p>
              </div>
            ) : (
              lifeEvents.map((event) => (
                <LifeEventRow
                  key={event.id}
                  event={event}
                  onAcknowledge={() => handleAcknowledgeEvent(event.id)}
                />
              ))
            )}
          </div>
        </Card>
      </div>

      {/* High Risk Households */}
      {highRiskHouseholds.length > 0 && (
        <Card>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlertIcon className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold text-foreground">High Risk Households</h2>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
            {highRiskHouseholds.map(({ household, riskScore }) => (
              <HighRiskCard
                key={household.id}
                householdName={household.name}
                riskScore={riskScore}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Insight Type Breakdown */}
      {dashboard && Object.keys(dashboard.byType).length > 0 && (
        <Card>
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Insights by Category</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(dashboard.byType).map(([type, count]) => (
                <div
                  key={type}
                  className="p-3 rounded-lg bg-background-secondary border border-border"
                >
                  <p className="text-sm text-muted-foreground">
                    {insightTypeLabels[type as keyof typeof insightTypeLabels] || type}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'red' | 'purple' | 'pink' | 'orange' | 'green' | 'blue';
  subtitle: string;
}) {
  const colorClasses = {
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div
            className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white`}
          >
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function InsightRow({
  insight,
  onDismiss,
}: {
  insight: ClientInsight;
  onDismiss: () => void;
}) {
  return (
    <div className="p-4 hover:bg-background-secondary transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={insightPriorityColors[insight.priority]}>
              {insight.priority}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {insightTypeLabels[insight.type]}
            </span>
          </div>
          <h3 className="font-medium text-foreground truncate">{insight.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {insight.description}
          </p>
          {insight.recommendedAction && (
            <p className="text-xs text-primary mt-2">
              Recommended: {insight.recommendedAction}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {insight.confidenceScore && (
            <span className="text-xs text-muted-foreground">
              {insight.confidenceScore}% confidence
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

function LifeEventRow({
  event,
  onAcknowledge,
}: {
  event: LifeEvent;
  onAcknowledge: () => void;
}) {
  return (
    <div className="p-4 hover:bg-background-secondary transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-muted rounded-lg text-muted-foreground">
          {getLifeEventIcon(event.eventType)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm">{event.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lifeEventTypeLabels[event.eventType]}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(event.eventDate).toLocaleDateString()}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onAcknowledge}>
          Acknowledge
        </Button>
      </div>
    </div>
  );
}

function HighRiskCard({
  householdName,
  riskScore,
}: {
  householdName: string;
  riskScore: RiskScore;
}) {
  const score = Number(riskScore.overallScore);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center gap-2 mb-2">
        <UsersIcon className="w-4 h-4 text-muted-foreground" />
        <p className="font-medium text-foreground text-sm truncate">{householdName}</p>
      </div>
      <div className="flex items-center justify-between">
        <Badge className={riskLevelColors[riskScore.riskLevel]}>
          {riskLevelLabels[riskScore.riskLevel]}
        </Badge>
        <span className="text-lg font-bold text-foreground">{score.toFixed(0)}</span>
      </div>
      {riskScore.keyFactors.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {riskScore.keyFactors[0]}
        </p>
      )}
    </Card>
  );
}

function IntelligenceDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default IntelligenceDashboard;
