'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, Skeleton, SkeletonText, formatCurrency, formatDate } from '../ui';
import {
  CalendarDaysIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../ui/utils';

/**
 * MeetingPrepBrief - Auto-generated meeting preparation summary
 * 
 * Aggregates relevant client information before a meeting to help
 * advisors prepare effectively. Shows recent activity, key metrics,
 * talking points, and potential concerns.
 */

export interface MeetingPrepData {
  meeting: {
    id: string;
    title: string;
    startTime: string;
    endTime?: string;
    type: 'annual_review' | 'portfolio_review' | 'financial_planning' | 'intro_call' | 'check_in' | 'other';
    notes?: string;
  };
  client: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    relationshipStartDate?: string;
    primaryAdvisor?: string;
  };
  financials?: {
    totalAum: number;
    ytdReturn?: number;
    lastRebalanceDate?: string;
    feeSchedule?: string;
  };
  recentActivity?: Array<{
    type: 'call' | 'email' | 'meeting' | 'task' | 'trade' | 'document';
    description: string;
    date: string;
  }>;
  openTasks?: Array<{
    id: string;
    title: string;
    dueDate?: string;
    isOverdue: boolean;
  }>;
  recentDocuments?: Array<{
    id: string;
    name: string;
    uploadDate: string;
  }>;
  suggestedTalkingPoints?: string[];
  potentialConcerns?: string[];
}

export interface MeetingPrepBriefProps {
  /** Meeting and client data */
  data: MeetingPrepData;
  /** Loading state */
  isLoading?: boolean;
  /** Compact mode for preview */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Navigate to full client profile */
  onViewClient?: () => void;
  /** Generate a PDF/printable version */
  onExport?: () => void;
}

const meetingTypeLabels: Record<MeetingPrepData['meeting']['type'], string> = {
  annual_review: 'Annual Review',
  portfolio_review: 'Portfolio Review',
  financial_planning: 'Financial Planning',
  intro_call: 'Introduction Call',
  check_in: 'Check-in',
  other: 'Meeting',
};

const activityIcons: Record<string, React.ReactNode> = {
  call: <PhoneIcon className="w-3 h-3" />,
  email: <EnvelopeIcon className="w-3 h-3" />,
  meeting: <CalendarDaysIcon className="w-3 h-3" />,
  task: <CheckCircleIcon className="w-3 h-3" />,
  trade: <ChartBarIcon className="w-3 h-3" />,
  document: <DocumentTextIcon className="w-3 h-3" />,
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-surface-secondary" />
        <div className="space-y-2">
          <div className="h-5 w-48 bg-surface-secondary rounded" />
          <div className="h-4 w-32 bg-surface-secondary rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-surface-secondary rounded-lg" />
        ))}
      </div>
      <div className="h-32 bg-surface-secondary rounded-lg" />
    </div>
  );
}

function Section({ title, icon, children, className }: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-xs font-medium text-content-tertiary uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

export function MeetingPrepBrief({
  data,
  isLoading = false,
  compact = false,
  className,
  onViewClient,
  onExport,
}: MeetingPrepBriefProps) {
  const { meeting, client, financials, recentActivity, openTasks, recentDocuments, suggestedTalkingPoints, potentialConcerns } = data;

  // Calculate time until meeting
  const timeUntilMeeting = useMemo(() => {
    const now = new Date();
    const meetingTime = new Date(meeting.startTime);
    const diffMs = meetingTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return 'In progress';
    if (diffMins < 60) return `In ${diffMins} min`;
    if (diffHours < 24) return `In ${diffHours}h`;
    return `In ${diffDays} days`;
  }, [meeting.startTime]);

  const isPast = new Date(meeting.startTime) < new Date();
  const isSoon = !isPast && new Date(meeting.startTime).getTime() - Date.now() < 60 * 60 * 1000; // within 1 hour

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <LoadingSkeleton />
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className={cn(
        'p-4 border-b border-border flex items-start justify-between',
        isSoon && 'bg-amber-500/5'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isSoon ? 'bg-amber-500/20 text-amber-500' : 'bg-accent-primary/10 text-accent-primary'
          )}>
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-content-primary">Meeting Prep Brief</h3>
              <Badge variant={isSoon ? 'warning' : 'default'} size="sm">
                {timeUntilMeeting}
              </Badge>
            </div>
            <p className="text-sm text-content-secondary">
              {meetingTypeLabels[meeting.type]} with {client.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onExport && (
            <Button variant="ghost" size="sm" onClick={onExport}>
              <ClipboardDocumentListIcon className="w-4 h-4" />
            </Button>
          )}
          {onViewClient && (
            <Button variant="secondary" size="sm" onClick={onViewClient}>
              View Profile
              <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Meeting Details */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5 text-content-secondary">
            <CalendarDaysIcon className="w-4 h-4" />
            {formatDate(meeting.startTime)}
          </div>
          <div className="flex items-center gap-1.5 text-content-secondary">
            <ClockIcon className="w-4 h-4" />
            {new Date(meeting.startTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
          {client.email && (
            <a 
              href={`mailto:${client.email}`}
              className="flex items-center gap-1.5 text-content-link hover:text-accent-primary"
            >
              <EnvelopeIcon className="w-4 h-4" />
              {client.email}
            </a>
          )}
          {client.phone && (
            <a 
              href={`tel:${client.phone}`}
              className="flex items-center gap-1.5 text-content-link hover:text-accent-primary"
            >
              <PhoneIcon className="w-4 h-4" />
              {client.phone}
            </a>
          )}
        </div>

        {/* Key Metrics */}
        {financials && !compact && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-surface-secondary rounded-lg">
              <p className="text-xs text-content-tertiary mb-1">Total AUM</p>
              <p className="text-lg font-semibold text-content-primary">
                {formatCurrency(financials.totalAum)}
              </p>
            </div>
            {financials.ytdReturn !== undefined && (
              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-xs text-content-tertiary mb-1">YTD Return</p>
                <p className={cn(
                  'text-lg font-semibold',
                  financials.ytdReturn >= 0 ? 'text-status-success-text' : 'text-status-error-text'
                )}>
                  {financials.ytdReturn >= 0 ? '+' : ''}{financials.ytdReturn.toFixed(1)}%
                </p>
              </div>
            )}
            {financials.lastRebalanceDate && (
              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-xs text-content-tertiary mb-1">Last Rebalance</p>
                <p className="text-lg font-semibold text-content-primary">
                  {formatDate(financials.lastRebalanceDate)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Concerns & Talking Points */}
        {!compact && (
          <div className="grid grid-cols-2 gap-4">
            {/* Potential Concerns */}
            {potentialConcerns && potentialConcerns.length > 0 && (
              <Section 
                title="Watch Out For" 
                icon={<ExclamationTriangleIcon className="w-3 h-3 text-status-warning-text" />}
              >
                <div className="bg-status-warning-bg border border-status-warning rounded-lg p-3">
                  <ul className="space-y-1.5">
                    {potentialConcerns.map((concern, i) => (
                      <li key={i} className="text-sm text-status-warning-text flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-status-warning-text mt-2 flex-shrink-0" />
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              </Section>
            )}

            {/* Suggested Talking Points */}
            {suggestedTalkingPoints && suggestedTalkingPoints.length > 0 && (
              <Section 
                title="Suggested Topics" 
                icon={<SparklesIcon className="w-3 h-3 text-amber-500" />}
              >
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <ul className="space-y-1.5">
                    {suggestedTalkingPoints.map((point, i) => (
                      <li key={i} className="text-sm text-content-primary flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </Section>
            )}
          </div>
        )}

        {/* Open Tasks */}
        {openTasks && openTasks.length > 0 && (
          <Section title="Open Tasks" icon={<ClipboardDocumentListIcon className="w-3 h-3" />}>
            <div className="space-y-2">
              {openTasks.slice(0, compact ? 2 : 5).map(task => (
                <div 
                  key={task.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md text-sm',
                    task.isOverdue ? 'bg-status-error-bg' : 'bg-surface-secondary'
                  )}
                >
                  <span className={task.isOverdue ? 'text-status-error-text' : 'text-content-primary'}>
                    {task.title}
                  </span>
                  {task.dueDate && (
                    <span className={cn(
                      'text-xs',
                      task.isOverdue ? 'text-status-error-text' : 'text-content-tertiary'
                    )}>
                      {task.isOverdue ? 'Overdue' : `Due ${formatDate(task.dueDate)}`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Recent Activity */}
        {recentActivity && recentActivity.length > 0 && !compact && (
          <Section title="Recent Activity" icon={<ClockIcon className="w-3 h-3" />}>
            <div className="space-y-2">
              {recentActivity.slice(0, 5).map((activity, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-content-tertiary">
                    {activityIcons[activity.type]}
                  </div>
                  <span className="flex-1 text-content-primary">{activity.description}</span>
                  <span className="text-xs text-content-tertiary">{formatDate(activity.date)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Meeting Notes */}
        {meeting.notes && (
          <Section title="Notes" icon={<DocumentTextIcon className="w-3 h-3" />}>
            <p className="text-sm text-content-secondary bg-surface-secondary p-3 rounded-lg">
              {meeting.notes}
            </p>
          </Section>
        )}
      </div>
    </Card>
  );
}

/**
 * Hook to generate meeting prep data from API responses
 */
export function useMeetingPrepData(meetingId: string, services: {
  getMeeting: (id: string) => Promise<any>;
  getClient: (id: string) => Promise<any>;
  getRecentActivity?: (clientId: string) => Promise<any[]>;
  getTasks?: (clientId: string) => Promise<any[]>;
}) {
  const [data, setData] = useState<MeetingPrepData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const meeting = await services.getMeeting(meetingId);
        const client = await services.getClient(meeting.householdId || meeting.clientId);
        
        const [activity, tasks] = await Promise.all([
          services.getRecentActivity?.(client.id) || [],
          services.getTasks?.(client.id) || [],
        ]);

        // Generate suggested talking points based on context
        const suggestedTalkingPoints: string[] = [];
        const potentialConcerns: string[] = [];

        // Add context-aware suggestions
        if (meeting.type === 'annual_review') {
          suggestedTalkingPoints.push('Review investment performance and market outlook');
          suggestedTalkingPoints.push('Discuss any changes in financial goals');
          suggestedTalkingPoints.push('Review estate planning and beneficiary designations');
        }

        const overdueTasks = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed');
        if (overdueTasks.length > 0) {
          potentialConcerns.push(`${overdueTasks.length} overdue task(s) to address`);
        }

        setData({
          meeting: {
            id: meeting.id,
            title: meeting.title,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            type: meeting.type || 'other',
            notes: meeting.notes,
          },
          client: {
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            status: client.status,
            relationshipStartDate: client.createdAt,
          },
          financials: client.aum ? {
            totalAum: client.aum,
            ytdReturn: client.ytdReturn,
            lastRebalanceDate: client.lastRebalanceDate,
          } : undefined,
          recentActivity: activity.slice(0, 10).map((a: any) => ({
            type: a.type,
            description: a.description || a.title,
            date: a.createdAt || a.date,
          })),
          openTasks: tasks.filter((t: any) => t.status !== 'completed').map((t: any) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate,
            isOverdue: t.dueDate && new Date(t.dueDate) < new Date(),
          })),
          suggestedTalkingPoints,
          potentialConcerns,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load meeting prep');
      } finally {
        setIsLoading(false);
      }
    }

    if (meetingId) {
      fetchData();
    }
  }, [meetingId, services]);

  return { data, isLoading, error };
}
