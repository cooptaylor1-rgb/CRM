'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader, PageContent, ContentGrid } from '@/components/layout/AppShell';
import { Card, StatusBadge, Button, EmptyState } from '@/components/ui';
import { moneyMovementsService, MoneyMovement, MoneyMovementStatus } from '@/services/money-movements.service';
import { useToastHelpers } from '@/components/notifications';
import {
  ChevronLeftIcon,
  PaperClipIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/20/solid';

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

function formatMoney(amount: number | undefined, currency: string) {
  if (amount === undefined || amount === null) return '-';
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

export default function MoneyMovementDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const toast = useToastHelpers();

  const [data, setData] = React.useState<MoneyMovement | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await moneyMovementsService.getById(id);
      setData(res);
    } catch (err: any) {
      const message = err?.message || 'Failed to load request';
      toast.error('Could not load request', message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const status = data?.status || 'requested';
  const cfg = statusConfig[status] ?? { label: String(status), variant: 'default' as const };

  return (
    <>
      <PageHeader
        title={data ? `Money Movement ${data.id}` : 'Money Movement'}
        subtitle={
          data ? (
            <div className="flex items-center gap-2">
              <StatusBadge status={cfg.variant} label={cfg.label} />
              <span className="text-content-tertiary">•</span>
              <span className="capitalize">{data.type}</span>
              <span className="text-content-tertiary">•</span>
              <span className="font-medium">{formatMoney(data.amount, data.currency)}</span>
            </div>
          ) : undefined
        }
        breadcrumb={
          <Link href="/money-movements" className="inline-flex items-center gap-1 text-sm text-content-secondary hover:text-content-primary">
            <ChevronLeftIcon className="w-4 h-4" />
            Back to money movements
          </Link>
        }
        actions={
          <Button
            variant="ghost"
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      <PageContent>
        {loading ? (
          <Card className="p-6">
            <p className="text-sm text-content-secondary">Loading…</p>
          </Card>
        ) : !data ? (
          <Card className="p-6">
            <EmptyState
              icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
              title="Request not found"
              description="We couldn't load this money movement."
              action={
                <Link href="/money-movements">
                  <Button>Back to list</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <ContentGrid layout="primary-secondary">
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-content-primary">Request details</h2>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-content-secondary">Status</dt>
                  <dd>
                    <StatusBadge status={cfg.variant} label={cfg.label} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-content-secondary">Type</dt>
                  <dd className="capitalize text-content-primary">{data.type}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-content-secondary">Amount</dt>
                  <dd className="font-medium text-content-primary">{formatMoney(data.amount, data.currency)}</dd>
                </div>
                {data.title && (
                  <div className="pt-2 border-t border-border">
                    <dt className="text-content-secondary">Title</dt>
                    <dd className="mt-1 text-content-primary whitespace-pre-wrap">{data.title}</dd>
                  </div>
                )}

                {data.notes && (
                  <div className="pt-2 border-t border-border">
                    <dt className="text-content-secondary">Notes</dt>
                    <dd className="mt-1 text-content-primary whitespace-pre-wrap">{data.notes}</dd>
                  </div>
                )}
              </dl>
            </Card>

            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center gap-2">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 text-content-tertiary" />
                  <h2 className="text-sm font-semibold text-content-primary">Checklist</h2>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  {[ 
                    'Request received',
                    'KYC / compliance review',
                    'Submitted to custodian',
                    'Completed',
                  ].map((label) => (
                    <label key={label} className="flex items-center gap-2 text-content-secondary">
                      <input type="checkbox" disabled className="w-4 h-4 rounded border-border-input" />
                      <span>{label}</span>
                    </label>
                  ))}
                  <p className="text-xs text-content-tertiary mt-2">
                    Placeholder — checklist steps will be wired up to backend status/events.
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2">
                  <PaperClipIcon className="w-5 h-5 text-content-tertiary" />
                  <h2 className="text-sm font-semibold text-content-primary">Attachments</h2>
                </div>
                <p className="mt-3 text-sm text-content-secondary">
                  No attachments yet. (Placeholder)
                </p>
              </Card>
            </div>
          </ContentGrid>
        )}
      </PageContent>
    </>
  );
}
