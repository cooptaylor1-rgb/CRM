'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, PageContent } from '@/components/layout/AppShell';
import { Button, Card, DataTable, EmptyState, StatusBadge } from '@/components/ui';
import { PlusIcon, BanknotesIcon } from '@heroicons/react/20/solid';
import { moneyMovementsService, MoneyMovement, MoneyMovementStatus } from '@/services/money-movements.service';
import { CreateMoneyMovementModal } from '@/components/modals';
import { useToastHelpers } from '@/components/notifications';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const statusConfig: Record<MoneyMovementStatus, { label: string; variant: StatusVariant }> = {
  requested: { label: 'Requested', variant: 'info' },
  in_review: { label: 'In review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'info' },
  initiated: { label: 'Initiated', variant: 'info' },
  submitted: { label: 'Submitted', variant: 'info' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  closed: { label: 'Closed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MoneyMovementsPage() {
  const router = useRouter();
  const toast = useToastHelpers();

  const searchParams = useSearchParams();
  const householdIdFilter = searchParams.get('householdId') || undefined;

  const [rows, setRows] = React.useState<MoneyMovement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await moneyMovementsService.list({ householdId: householdIdFilter });
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message = err?.message || 'Failed to load money movements';
      setRows([]);
      toast.error('Could not load money movements', message);
    } finally {
      setLoading(false);
    }
  }, [toast, householdIdFilter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <PageHeader
        title="Money Movements"
        subtitle="Track and manage money movement requests."
        actions={
          <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            New request
          </Button>
        }
      />

      <PageContent>
        <Card noPadding>
          <div className="p-4">
            <DataTable
              data={rows}
              loading={loading}
              onRowClick={(row) => router.push(`/money-movements/${row.id}`)}
              columns={[
                {
                  id: 'type',
                  header: 'Type',
                  accessorKey: 'type',
                  cell: ({ value }) => (
                    <span className="capitalize">{String(value ?? '').replace('_', ' ')}</span>
                  ),
                },
                {
                  id: 'amount',
                  header: 'Amount',
                  accessorFn: (row) => row,
                  cell: ({ value }) => {
                    const row = value as MoneyMovement;
                    if (row.amount === undefined || row.amount === null) return <span className="text-content-tertiary">-</span>;
                    return <span className="font-medium">{formatMoney(row.amount, row.currency)}</span>;
                  },
                },
                {
                  id: 'status',
                  header: 'Status',
                  accessorKey: 'status',
                  cell: ({ value }) => {
                    const status = (value as MoneyMovementStatus) || 'requested';
                    const cfg = statusConfig[status] ?? { label: String(status), variant: 'default' as const };
                    return <StatusBadge status={cfg.variant} label={cfg.label} />;
                  },
                },
                {
                  id: 'createdAt',
                  header: 'Created',
                  accessorKey: 'createdAt',
                  hiddenOnMobile: true,
                  cell: ({ value }) => formatDate(value as string | undefined),
                },
                {
                  id: 'title',
                  header: 'Title',
                  accessorKey: 'title',
                  hiddenOnMobile: true,
                  cell: ({ value }) => (
                    <span className="text-content-secondary line-clamp-1">{String(value ?? '')}</span>
                  ),
                },
              ]}
              emptyState={
                <EmptyState
                  icon={<BanknotesIcon className="w-6 h-6" />}
                  title="No money movements"
                  description="Create a request to get started."
                  action={
                    <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
                      New request
                    </Button>
                  }
                />
              }
            />
          </div>
        </Card>
      </PageContent>

      <CreateMoneyMovementModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false);
          fetchData();
        }}
      />
    </>
  );
}
