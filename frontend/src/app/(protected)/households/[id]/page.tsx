'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  BuildingLibraryIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, PageContent } from '@/components/layout/AppShell';
import { Button, Card, StatusBadge, DataTable, EmptyState, formatCurrency, formatDate, formatDateTime } from '@/components/ui';
import { householdsService, Household, HouseholdTimelineItem, TimelineItemType } from '@/services/households.service';
import { CreateTaskModal, ScheduleMeetingModal, CreateMoneyMovementModal } from '@/components/modals';
import { 
  AssetAllocationManager, 
  FeeScheduleManager,
  ClientInsights,
  generateClientInsights,
  ClientJourneyTimeline,
  generateJourneyData,
} from '@/components/features';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const statusMap: Record<string, { label: string; variant: StatusVariant }> = {
  active: { label: 'Active', variant: 'success' },
  prospect: { label: 'Prospect', variant: 'info' },
  inactive: { label: 'Inactive', variant: 'default' },
  closed: { label: 'Closed', variant: 'error' },
};

const riskToleranceLabels: Record<string, string> = {
  conservative: 'Conservative',
  moderately_conservative: 'Moderately Conservative',
  moderate: 'Moderate',
  moderately_aggressive: 'Moderately Aggressive',
  aggressive: 'Aggressive',
};

const timelineTypeLabels: Record<TimelineItemType, string> = {
  task: 'Task',
  meeting: 'Meeting',
  money_movement: 'Money movement',
  compliance_review: 'Compliance',
};

const taskStatusVariant: Record<string, StatusVariant> = {
  pending: 'default',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
  on_hold: 'warning',
};

const meetingStatusVariant: Record<string, StatusVariant> = {
  scheduled: 'info',
  confirmed: 'success',
  in_progress: 'warning',
  completed: 'default',
  cancelled: 'error',
  no_show: 'error',
};

const moneyMovementStatusVariant: Record<string, StatusVariant> = {
  requested: 'info',
  in_review: 'warning',
  approved: 'info',
  initiated: 'info',
  submitted: 'info',
  confirmed: 'success',
  closed: 'default',
  cancelled: 'default',
};

const complianceStatusVariant: Record<string, StatusVariant> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  requires_action: 'error',
};

function getTimelineStatusVariant(item: HouseholdTimelineItem): StatusVariant {
  const status = String(item.status ?? '');
  switch (item.type) {
    case 'task':
      return taskStatusVariant[status] ?? 'default';
    case 'meeting':
      return meetingStatusVariant[status] ?? 'default';
    case 'money_movement':
      return moneyMovementStatusVariant[status] ?? 'default';
    case 'compliance_review':
      return complianceStatusVariant[status] ?? 'default';
    default:
      return 'default';
  }
}

function getTimelineIcon(type: TimelineItemType) {
  switch (type) {
    case 'task':
      return <ClipboardDocumentCheckIcon className="w-4 h-4 text-amber-400" />;
    case 'meeting':
      return <CalendarIcon className="w-4 h-4 text-purple-400" />;
    case 'money_movement':
      return <BanknotesIcon className="w-4 h-4 text-emerald-400" />;
    case 'compliance_review':
      return <ShieldCheckIcon className="w-4 h-4 text-blue-400" />;
  }
}

function getTimelineIconBg(type: TimelineItemType) {
  switch (type) {
    case 'task':
      return 'bg-amber-500/10';
    case 'meeting':
      return 'bg-purple-500/10';
    case 'money_movement':
      return 'bg-emerald-500/10';
    case 'compliance_review':
      return 'bg-blue-500/10';
  }
}

export default function HouseholdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const householdId = params.id as string;

  const [household, setHousehold] = useState<Household | null>(null);
  const [timeline, setTimeline] = useState<HouseholdTimelineItem[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<TimelineItemType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTimeline = timelineFilter === 'all' ? timeline : timeline.filter((t) => t.type === timelineFilter);
  const timelineCounts = {
    all: timeline.length,
    task: timeline.filter((t) => t.type === 'task').length,
    meeting: timeline.filter((t) => t.type === 'meeting').length,
    money_movement: timeline.filter((t) => t.type === 'money_movement').length,
    compliance_review: timeline.filter((t) => t.type === 'compliance_review').length,
  } as const;

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showScheduleMeeting, setShowScheduleMeeting] = useState(false);
  const [showCreateMoneyMovement, setShowCreateMoneyMovement] = useState(false);

  useEffect(() => {
    const fetchHousehold = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await householdsService.getHousehold(householdId);
        setHousehold(data);
      } catch (err: any) {
        console.error('Failed to fetch household:', err);
        setError(err.response?.data?.message || 'Failed to load household');
      } finally {
        setLoading(false);
      }
    };

    const fetchTimeline = async () => {
      try {
        setTimelineLoading(true);
        const items = await householdsService.getTimeline(householdId);
        setTimeline(items);
      } catch (err) {
        // Timeline is best-effort for now; don't fail the whole page.
        console.warn('Failed to fetch household timeline');
        setTimeline([]);
      } finally {
        setTimelineLoading(false);
      }
    };

    if (householdId) {
      fetchHousehold();
      fetchTimeline();
    }
  }, [householdId]);

  if (loading) {
    return (
      <>
        <PageHeader title="Loading..." />
        <PageContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !household) {
    return (
      <>
        <PageHeader title="Household Not Found" />
        <PageContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserGroupIcon className="w-16 h-16 text-stone-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Household Not Found</h2>
            <p className="text-stone-400 mb-6">{error || 'The household you are looking for does not exist.'}</p>
            <Link href="/households">
              <Button variant="secondary" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
                Back to Households
              </Button>
            </Link>
          </div>
        </PageContent>
      </>
    );
  }

  const status = statusMap[household.status] || { label: household.status, variant: 'default' as StatusVariant };

  return (
    <>
      <PageHeader
        title={household.name}
        subtitle={
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={status.variant} label={status.label} />
            {household.riskTolerance && (
              <span className="text-sm text-stone-400">
                {riskToleranceLabels[household.riskTolerance] || household.riskTolerance}
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/households">
              <Button variant="ghost" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
                Back
              </Button>
            </Link>
            <Button
              variant="secondary"
              leftIcon={<PencilSquareIcon className="w-4 h-4" />}
              onClick={() => router.push(`/households/${householdId}/edit`)}
            >
              Edit
            </Button>
          </div>
        }
      />

      <PageContent>
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                    <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-400">Total AUM</p>
                    <p className="text-xl font-semibold text-white">
                      {formatCurrency(household.totalAum)}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-lg">
                    <ChartBarIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-400">Risk Tolerance</p>
                    <p className="text-lg font-medium text-white capitalize">
                      {riskToleranceLabels[household.riskTolerance || ''] || household.riskTolerance || 'Not Set'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-400">Last Review</p>
                    <p className="text-lg font-medium text-white">
                      {household.lastReviewDate ? formatDate(household.lastReviewDate) : 'Never'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-400">Next Review</p>
                    <p className="text-lg font-medium text-white">
                      {household.nextReviewDate ? formatDate(household.nextReviewDate) : 'Not Scheduled'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Timeline */}
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Timeline</h2>
                <p className="text-sm text-stone-400">Recent activity across tasks, meetings, money movements, and compliance.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setShowCreateTask(true)}>
                  New Task
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowScheduleMeeting(true)}>
                  Schedule Meeting
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowCreateMoneyMovement(true)}>
                  New Money Movement
                </Button>
              </div>
            </div>



            <div className="flex flex-wrap items-center gap-2 mb-3">
              {[
                { key: 'all' as const, label: 'All', count: timelineCounts.all },
                { key: 'task' as const, label: 'Tasks', count: timelineCounts.task },
                { key: 'meeting' as const, label: 'Meetings', count: timelineCounts.meeting },
                { key: 'money_movement' as const, label: 'Money movements', count: timelineCounts.money_movement },
                { key: 'compliance_review' as const, label: 'Compliance', count: timelineCounts.compliance_review },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTimelineFilter(opt.key)}
                  className={
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ' +
                    (timelineFilter === opt.key
                      ? 'bg-surface-secondary border-border-default text-content-primary'
                      : 'bg-transparent border-border-default/50 text-content-secondary hover:text-content-primary hover:bg-surface-secondary')
                  }
                >
                  <span>{opt.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-primary/50 text-content-tertiary">
                    {opt.count}
                  </span>
                </button>
              ))}
            </div>

            <DataTable
              data={filteredTimeline.slice(0, 25)}
              loading={timelineLoading}
              onRowClick={(row) => {
                const item = row as HouseholdTimelineItem;
                if (item.type === 'money_movement') {
                  router.push(`/money-movements/${item.id}`);
                  return;
                }
                if (item.type === 'task') {
                  router.push(`/tasks?householdId=${householdId}`);
                  return;
                }
                if (item.type === 'meeting') {
                  router.push(`/meetings?householdId=${householdId}`);
                  return;
                }
                if (item.type === 'compliance_review') {
                  router.push(`/compliance?householdId=${householdId}`);
                  return;
                }
              }}
              columns={[
                {
                  id: 'activity',
                  header: 'Activity',
                  accessorFn: (row) => row,
                  cell: ({ value }) => {
                    const item = value as HouseholdTimelineItem;
                    const typeLabel = timelineTypeLabels[item.type] ?? item.type;
                    return (
                      <div className="flex items-start gap-3">
                        <div className={"mt-0.5 p-2 rounded-lg " + getTimelineIconBg(item.type)}>
                          {getTimelineIcon(item.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs uppercase tracking-wide text-content-tertiary">{typeLabel}</span>
                            {item.status ? (
                              <StatusBadge
                                status={getTimelineStatusVariant(item)}
                                label={String(item.status).replaceAll('_', ' ')}
                              />
                            ) : null}
                          </div>
                          <div className="font-medium text-content-primary truncate">{item.title}</div>
                          {item.subtitle ? (
                            <div className="text-sm text-content-secondary line-clamp-1">{item.subtitle}</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  id: 'amount',
                  header: 'Amount',
                  accessorFn: (row) => row,
                  hiddenOnMobile: true,
                  cell: ({ value }) => {
                    const item = value as HouseholdTimelineItem;
                    if (item.type !== 'money_movement') return <span className="text-content-tertiary">-</span>;
                    const amount = (item.entity as any)?.amount;
                    if (amount === undefined || amount === null) return <span className="text-content-tertiary">-</span>;
                    return <span className="font-medium">{formatCurrency(Number(amount))}</span>
                  },
                },
                {
                  id: 'occurredAt',
                  header: 'When',
                  accessorKey: 'occurredAt',
                  hiddenOnMobile: true,
                  cell: ({ value }) => (value ? formatDateTime(value as any) : '-'),
                },
              ]}
              emptyState={
                <EmptyState
                  icon={<CalendarIcon className="w-6 h-6" />}
                  title="No timeline items"
                  description="As activity happens (tasks, meetings, money movements), it will show up here."
                />
              }
            />
          </Card>

          {/* Investment Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Investment Objective */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <BuildingLibraryIcon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="font-medium text-white">Investment Objective</h3>
                </div>
                <p className="text-stone-300">
                  {household.investmentObjective || 'No investment objective defined for this household.'}
                </p>
              </Card>
            </motion.div>

            {/* Key Dates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="font-medium text-white">Key Dates</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Onboarding Date</span>
                    <span className="text-white">
                      {household.onboardingDate ? formatDate(household.onboardingDate) : 'Not Set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Created</span>
                    <span className="text-white">{formatDate(household.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Last Updated</span>
                    <span className="text-white">{formatDate(household.updatedAt)}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Asset Allocation & Fee Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AssetAllocationManager
                entityType="household"
                entityId={householdId}
                entityName={household.name}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <FeeScheduleManager
                entityType="household"
                entityId={householdId}
                entityName={household.name}
                currentAUM={household.totalAum}
              />
            </motion.div>
          </div>

          {/* AI-Powered Insights Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-content-primary">AI-Powered Insights</h2>
            </div>
            <ClientInsights 
              data={generateClientInsights({
                name: household.name,
                aum: household.totalAum,
                lastContact: household.updatedAt,
              })}
            />
          </motion.div>

          {/* Relationship Journey Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <ClientJourneyTimeline
              data={generateJourneyData(household.name)}
              maxEvents={8}
              onEventClick={(_event) => {
                // TODO: Navigate to event detail or show event modal
              }}
            />
          </motion.div>
        </div>
      </PageContent>

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onSuccess={() => {
          setShowCreateTask(false);
          // Refresh timeline (best-effort)
          householdsService.getTimeline(householdId).then(setTimeline).catch(() => null);
        }}
        preselectedHouseholdId={householdId}
      />

      <ScheduleMeetingModal
        isOpen={showScheduleMeeting}
        onClose={() => setShowScheduleMeeting(false)}
        onSuccess={() => {
          setShowScheduleMeeting(false);
          householdsService.getTimeline(householdId).then(setTimeline).catch(() => null);
        }}
        preselectedHouseholdId={householdId}
      />

      <CreateMoneyMovementModal
        isOpen={showCreateMoneyMovement}
        onClose={() => setShowCreateMoneyMovement(false)}
        onSuccess={() => {
          setShowCreateMoneyMovement(false);
          householdsService.getTimeline(householdId).then(setTimeline).catch(() => null);
        }}
        preselectedHouseholdId={householdId}
      />
    </>
  );
}
