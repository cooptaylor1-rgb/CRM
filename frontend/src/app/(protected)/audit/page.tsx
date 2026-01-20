'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PageHeader,
  PageContent
} from '@/components/layout/AppShell';
import {
  Button,
  Card,
  Select,
  Input,
  StatusBadge,
  EmptyState,
  DataFreshness,
} from '@/components/ui';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { auditService } from '@/services/audit.service';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'access' | 'export';
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: string;
  ipAddress?: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
}

const actionConfig: Record<string, { label: string; variant: StatusVariant }> = {
  create: { label: 'Create', variant: 'success' },
  update: { label: 'Update', variant: 'info' },
  delete: { label: 'Delete', variant: 'error' },
  login: { label: 'Login', variant: 'default' },
  logout: { label: 'Logout', variant: 'default' },
  view: { label: 'View', variant: 'default' },
  export: { label: 'Export', variant: 'warning' },
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');

  const fetchAuditEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditService.getEvents({
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
      });
      setEvents(data as AuditEvent[]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch audit events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter]);

  useEffect(() => {
    fetchAuditEvents();
  }, [fetchAuditEvents]);

  const filteredEvents = events.filter((event) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        event.userName?.toLowerCase().includes(query) ||
        event.entityName?.toLowerCase().includes(query) ||
        event.entityType?.toLowerCase().includes(query) ||
        event.details?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="System activity and compliance record"
        actions={
          <Button
            variant="secondary"
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
          >
            Export Log
          </Button>
        }
      />

      <PageContent>
        {/* Filters */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
                <Input
                  type="text"
                  placeholder="Search by user, entity, or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={actionFilter}
                onChange={(value) => setActionFilter(value)}
                options={[
                  { value: '', label: 'All Actions' },
                  { value: 'create', label: 'Create' },
                  { value: 'update', label: 'Update' },
                  { value: 'delete', label: 'Delete' },
                  { value: 'login', label: 'Login' },
                  { value: 'logout', label: 'Logout' },
                  { value: 'view', label: 'View' },
                  { value: 'export', label: 'Export' },
                ]}
                className="w-40"
              />
              <Select
                value={entityFilter}
                onChange={(value) => setEntityFilter(value)}
                options={[
                  { value: '', label: 'All Entities' },
                  { value: 'household', label: 'Household' },
                  { value: 'account', label: 'Account' },
                  { value: 'person', label: 'Person' },
                  { value: 'task', label: 'Task' },
                  { value: 'document', label: 'Document' },
                  { value: 'user', label: 'User' },
                ]}
                className="w-40"
              />
              <DataFreshness
                lastUpdated={lastUpdated}
                onRefresh={fetchAuditEvents}
                isRefreshing={loading}
              />
            </div>
          </div>
        </Card>

        {/* Audit Log Table */}
        <Card noPadding>
          {error ? (
            <div className="p-6">
              <EmptyState
                icon={<DocumentTextIcon className="w-6 h-6" />}
                title="Unable to load audit log"
                description={error}
                action={
                  <Button variant="secondary" onClick={fetchAuditEvents}>
                    Retry
                  </Button>
                }
              />
            </div>
          ) : loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-surface-secondary rounded" />
                ))}
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<DocumentTextIcon className="w-6 h-6" />}
                title="No audit events"
                description={searchQuery || actionFilter || entityFilter
                  ? "No events match your current filters."
                  : "System activity will be recorded here."}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">
                      Action
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3 text-sm text-content-tertiary whitespace-nowrap">
                        {formatTimestamp(event.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-content-primary">
                          {event.userName}
                        </span>
                        {event.ipAddress && (
                          <span className="block text-xs text-content-tertiary">
                            {event.ipAddress}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={actionConfig[event.action]?.variant || 'default'}
                          label={actionConfig[event.action]?.label || event.action}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-content-primary capitalize">
                          {event.entityType}
                        </span>
                        {event.entityName && (
                          <span className="block text-xs text-content-tertiary">
                            {event.entityName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-content-secondary max-w-xs truncate">
                        {event.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Compliance Notice */}
        <p className="mt-4 text-xs text-content-tertiary text-center">
          Audit records are retained for a minimum of 7 years per SEC Rule 204-2 requirements.
          All timestamps are displayed in your local timezone.
        </p>
      </PageContent>
    </>
  );
}
