'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, Skeleton, formatDate, formatDateTime } from '../ui';
import {
  ClockIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  ShieldCheckIcon,
  UserIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../ui/utils';
import { auditService, AuditEvent } from '@/services/audit.service';

/**
 * AuditTrail - Display audit history for entities or users
 * 
 * Provides transparency into who did what and when,
 * building trust and supporting compliance requirements.
 */

export interface AuditTrailProps {
  /** Filter by entity type and ID */
  entityType?: string;
  entityId?: string;
  /** Filter by user ID */
  userId?: string;
  /** Maximum events to show */
  maxItems?: number;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Title override */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <PlusIcon className="w-4 h-4" />,
  update: <PencilSquareIcon className="w-4 h-4" />,
  delete: <TrashIcon className="w-4 h-4" />,
  view: <EyeIcon className="w-4 h-4" />,
  export: <ArrowDownTrayIcon className="w-4 h-4" />,
  login: <ArrowRightOnRectangleIcon className="w-4 h-4" />,
  logout: <ArrowLeftOnRectangleIcon className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  create: 'bg-green-500/10 text-green-500 border-green-500/20',
  update: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  delete: 'bg-red-500/10 text-red-500 border-red-500/20',
  view: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  export: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  login: 'bg-green-500/10 text-green-500 border-green-500/20',
  logout: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const actionLabels: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  view: 'Viewed',
  export: 'Exported',
  login: 'Logged in',
  logout: 'Logged out',
};

function AuditEventItem({ 
  event, 
  showEntity = true,
  expanded = false,
  onToggle,
}: { 
  event: AuditEvent; 
  showEntity?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const hasChanges = event.changes && Object.keys(event.changes).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div 
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg transition-colors',
          hasChanges && 'cursor-pointer hover:bg-surface-secondary/50',
          expanded && 'bg-surface-secondary/30'
        )}
        onClick={hasChanges ? onToggle : undefined}
      >
        {/* Action Icon */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border',
          actionColors[event.action] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        )}>
          {actionIcons[event.action] || <ClockIcon className="w-4 h-4" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-content-primary">
                <span className="font-medium">{event.userName || event.userEmail || 'System'}</span>
                {' '}
                <span className="text-content-secondary">
                  {actionLabels[event.action] || event.action}
                </span>
                {showEntity && event.entityType && (
                  <>
                    {' '}
                    <span className="text-content-secondary">
                      {event.entityType.replace(/_/g, ' ')}
                    </span>
                  </>
                )}
              </p>
              <p className="text-xs text-content-tertiary mt-0.5">
                {formatDateTime(event.timestamp)}
              </p>
            </div>

            {hasChanges && (
              <button className="text-content-tertiary hover:text-content-secondary">
                {expanded ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Expanded Changes */}
          <AnimatePresence>
            {expanded && hasChanges && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 bg-surface-secondary rounded-md space-y-2">
                  <p className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
                    Changes Made
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(event.changes!).map(([field, { old: oldVal, new: newVal }]) => (
                      <div key={field} className="text-sm">
                        <span className="text-content-secondary">{field}:</span>
                        {' '}
                        {oldVal !== undefined && oldVal !== null && (
                          <span className="text-status-error-text line-through mr-2">
                            {typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)}
                          </span>
                        )}
                        <span className="text-status-success-text">
                          {typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function LoadingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-surface-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-surface-secondary" />
            <div className="h-3 w-1/3 rounded bg-surface-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditTrail({
  entityType,
  entityId,
  userId,
  maxItems = 20,
  compact = false,
  title = 'Activity History',
  className,
}: AuditTrailProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuditEvents() {
      try {
        setIsLoading(true);
        setError(null);
        
        let data: AuditEvent[];
        if (entityType && entityId) {
          data = await auditService.getByEntity(entityType, entityId);
        } else if (userId) {
          data = await auditService.getByUser(userId);
        } else {
          data = await auditService.getEvents({ limit: maxItems });
        }
        
        setEvents(data);
      } catch (err) {
        console.error('Failed to fetch audit events:', err);
        setError('Unable to load activity history');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAuditEvents();
  }, [entityType, entityId, userId, maxItems]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (filterAction) {
      result = result.filter(e => e.action === filterAction);
    }
    return result.slice(0, maxItems);
  }, [events, filterAction, maxItems]);

  const uniqueActions = useMemo(() => {
    return [...new Set(events.map(e => e.action))];
  }, [events]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
            <ShieldCheckIcon className="w-4 h-4 text-accent-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-content-primary text-sm">{title}</h3>
            <p className="text-xs text-content-tertiary">
              {isLoading ? 'Loading...' : `${filteredEvents.length} events`}
            </p>
          </div>
        </div>

        {/* Filter */}
        {!compact && uniqueActions.length > 1 && (
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-content-tertiary" />
            <select
              value={filterAction || ''}
              onChange={(e) => setFilterAction(e.target.value || null)}
              className="text-xs bg-surface-secondary border border-border rounded px-2 py-1 text-content-primary"
            >
              <option value="">All actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {actionLabels[action] || action}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className={cn(
        'divide-y divide-border/50',
        compact ? 'max-h-[300px] overflow-y-auto' : ''
      )}>
        {error ? (
          <div className="p-8 text-center">
            <ShieldCheckIcon className="w-10 h-10 text-content-tertiary mx-auto mb-2" />
            <p className="text-sm text-content-secondary">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-3"
            >
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <LoadingSkeleton count={compact ? 3 : 5} />
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center">
            <ClockIcon className="w-10 h-10 text-content-tertiary mx-auto mb-2" />
            <p className="text-sm text-content-secondary">No activity recorded yet</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredEvents.map((event) => (
              <AuditEventItem
                key={event.id}
                event={event}
                showEntity={!entityType}
                expanded={expandedEvent === event.id}
                onToggle={() => setExpandedEvent(
                  expandedEvent === event.id ? null : event.id
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer - show when there are more events */}
      {events.length > maxItems && (
        <div className="p-3 border-t border-border bg-surface-secondary/50">
          <button className="text-xs text-accent-primary hover:text-accent-primary-hover transition-colors w-full text-center">
            View all {events.length} events
          </button>
        </div>
      )}
    </Card>
  );
}

/**
 * Inline audit badge for showing last modified info
 */
export interface AuditBadgeProps {
  lastModified?: string;
  lastModifiedBy?: string;
  className?: string;
}

export function AuditBadge({ lastModified, lastModifiedBy, className }: AuditBadgeProps) {
  if (!lastModified) return null;

  return (
    <div className={cn(
      'flex items-center gap-1.5 text-xs text-content-tertiary',
      className
    )}>
      <ClockIcon className="w-3 h-3" />
      <span>
        Updated {formatDate(lastModified)}
        {lastModifiedBy && ` by ${lastModifiedBy}`}
      </span>
    </div>
  );
}
