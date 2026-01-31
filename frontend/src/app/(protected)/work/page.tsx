'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader, PageContent, ContentGrid } from '@/components/layout/AppShell';
import {
  Card,
  MetricCard,
  MetricGrid,
  Button,
  DataTable,
  EmptyState,
  StatusBadge,
  formatDateTime,
} from '@/components/ui';
import { workService, WorkSummary } from '@/services/work.service';
import { useToastHelpers } from '@/components/notifications';
import { BoltIcon, BanknotesIcon, CalendarDaysIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

function safeArray<T>(x: any): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

export default function WorkPage() {
  const router = useRouter();
  const toast = useToastHelpers();

  const [data, setData] = React.useState<WorkSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await workService.getSummary();
      setData(res);
    } catch (err: any) {
      toast.error('Could not load work queue', err?.message || 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const overdueTasks = safeArray<any>(data?.tasks?.overdue);
  const dueTodayTasks = safeArray<any>(data?.tasks?.dueToday);
  const meetingsToday = safeArray<any>(data?.meetings?.today);
  const mmNeedsAttention = safeArray<any>(data?.moneyMovements?.needsAttention);
  const prospectsDue = safeArray<any>(data?.prospects?.dueFollowUp);

  return (
    <>
      <PageHeader
        title="Work"
        subtitle="Advisor command center: priorities, meetings, and open loops."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={fetchData} disabled={loading}>
              Refresh
            </Button>
          </div>
        }
      />

      <PageContent>
        <MetricGrid className="mb-6">
          <Link href="/tasks" className="block">
            <MetricCard
              label="Overdue"
              value={overdueTasks.length}
              icon="tasks"
              change={overdueTasks.length > 0 ? { trend: 'down', value: 'clear these first' } : undefined}
            />
          </Link>
          <Link href="/tasks" className="block">
            <MetricCard label="Due today" value={dueTodayTasks.length} icon="tasks" />
          </Link>
          <Link href="/meetings" className="block">
            <MetricCard label="Meetings today" value={meetingsToday.length} icon="calendar" />
          </Link>
          <Link href="/money-movements" className="block">
            <MetricCard label="Money movements" value={mmNeedsAttention.length} icon="currency" />
          </Link>
        </MetricGrid>

        <ContentGrid layout="primary-secondary">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-content-tertiary" />
                <h2 className="text-sm font-semibold">Top priorities</h2>
              </div>
              <Link href="/tasks" className="text-sm text-brand-600 hover:underline">
                View all
              </Link>
            </div>

            <DataTable
              data={[...overdueTasks, ...dueTodayTasks].slice(0, 10)}
              loading={loading}
              onRowClick={() => router.push('/tasks')}
              columns={[
                {
                  id: 'title',
                  header: 'Task',
                  accessorKey: 'title',
                  cell: ({ value }) => <span className="font-medium">{String(value ?? '')}</span>,
                },
                {
                  id: 'priority',
                  header: 'Priority',
                  accessorKey: 'priority',
                  hiddenOnMobile: true,
                  cell: ({ value }) => {
                    const p = String(value ?? '');
                    const variant = p === 'urgent' ? 'error' : p === 'high' ? 'warning' : 'default';
                    return <StatusBadge status={variant as any} label={p} />;
                  },
                },
                {
                  id: 'dueDate',
                  header: 'Due',
                  accessorKey: 'dueDate',
                  hiddenOnMobile: true,
                  cell: ({ value }) => (value ? formatDateTime(value as any) : '-'),
                },
              ]}
              emptyState={
                <EmptyState
                  icon={<BoltIcon className="w-6 h-6" />}
                  title="No urgent work"
                  description="No overdue or due-today tasks assigned to you."
                  action={
                    <Link href="/tasks">
                      <Button variant="secondary">Open tasks</Button>
                    </Link>
                  }
                />
              }
            />
          </Card>

          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-semibold">Money movements needing attention</h2>
                <Link href="/money-movements" className="text-sm text-brand-600 hover:underline">
                  View
                </Link>
              </div>
              <DataTable
                data={mmNeedsAttention.slice(0, 8)}
                loading={loading}
                onRowClick={(row) => router.push(`/money-movements/${(row as any).id}`)}
                columns={[
                  {
                    id: 'type',
                    header: 'Type',
                    accessorKey: 'type',
                    cell: ({ value }) => <span className="capitalize">{String(value ?? '')}</span>,
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    accessorKey: 'status',
                    cell: ({ value }) => <StatusBadge status="info" label={String(value ?? '')} />,
                  },
                ]}
                emptyState={
                  <EmptyState
                    icon={<BanknotesIcon className="w-6 h-6" />}
                    title="No money movements"
                    description="Nothing waiting on action right now."
                  />
                }
              />
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-semibold">Meetings today</h2>
                <Link href="/meetings" className="text-sm text-brand-600 hover:underline">
                  Calendar
                </Link>
              </div>
              <DataTable
                data={meetingsToday.slice(0, 8)}
                loading={loading}
                onRowClick={() => router.push('/meetings')}
                columns={[
                  {
                    id: 'title',
                    header: 'Meeting',
                    accessorKey: 'title',
                    cell: ({ value }) => <span className="font-medium">{String(value ?? '')}</span>,
                  },
                  {
                    id: 'startTime',
                    header: 'Start',
                    accessorKey: 'startTime',
                    hiddenOnMobile: true,
                    cell: ({ value }) => (value ? formatDateTime(value as any) : '-'),
                  },
                ]}
                emptyState={
                  <EmptyState
                    icon={<CalendarDaysIcon className="w-6 h-6" />}
                    title="No meetings today"
                    description="Your calendar is clear."
                  />
                }
              />
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-semibold">Prospects due follow-up</h2>
                <Link href="/pipeline" className="text-sm text-brand-600 hover:underline">
                  Pipeline
                </Link>
              </div>
              <DataTable
                data={prospectsDue.slice(0, 8)}
                loading={loading}
                onRowClick={() => router.push('/pipeline')}
                columns={[
                  {
                    id: 'name',
                    header: 'Prospect',
                    accessorFn: (row) => `${(row as any).firstName ?? ''} ${(row as any).lastName ?? ''}`.trim(),
                    cell: ({ value }) => <span className="font-medium">{String(value ?? '')}</span>,
                  },
                  {
                    id: 'stage',
                    header: 'Stage',
                    accessorKey: 'stage',
                    hiddenOnMobile: true,
                    cell: ({ value }) => <StatusBadge status="default" label={String(value ?? '')} />,
                  },
                ]}
                emptyState={
                  <EmptyState
                    icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
                    title="No follow-ups due"
                    description="No scheduled follow-ups today."
                  />
                }
              />
            </Card>
          </div>
        </ContentGrid>
      </PageContent>
    </>
  );
}
