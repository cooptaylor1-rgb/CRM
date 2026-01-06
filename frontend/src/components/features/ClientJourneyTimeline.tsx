'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, formatCurrency, formatDate } from '../ui';
import {
  SparklesIcon,
  UserPlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ChartBarIcon,
  GiftIcon,
  HeartIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  AcademicCapIcon,
  StarIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../ui/utils';

/**
 * ClientJourneyTimeline - Visual Relationship Story
 * 
 * A magical timeline that tells the complete story of your relationship
 * with each client. Milestones, interactions, life events, and portfolio
 * changes - all in one beautiful, scrollable narrative.
 */

export type TimelineEventType =
  | 'first_contact'
  | 'onboarding'
  | 'meeting'
  | 'call'
  | 'email'
  | 'document'
  | 'portfolio_change'
  | 'life_event'
  | 'milestone'
  | 'issue'
  | 'resolution'
  | 'referral'
  | 'review'
  | 'note';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  date: string;
  importance: 'high' | 'medium' | 'low';
  automated?: boolean;
  metadata?: {
    amount?: number;
    amountChange?: number;
    percentChange?: number;
    attendees?: string[];
    duration?: string;
    outcome?: 'positive' | 'neutral' | 'negative';
    lifeEventType?: string;
    documentType?: string;
    relatedTo?: string;
  };
  linkedEntities?: {
    type: 'document' | 'meeting' | 'task' | 'email';
    id: string;
    title: string;
  }[];
}

export interface JourneyMilestone {
  id: string;
  title: string;
  date: string;
  description: string;
  celebration?: boolean;
  icon?: React.ReactNode;
}

export interface ClientJourneyData {
  clientId: string;
  clientName: string;
  relationshipStartDate: string;
  totalAUM: number;
  events: TimelineEvent[];
  milestones: JourneyMilestone[];
  stats: {
    totalMeetings: number;
    totalCalls: number;
    totalEmails: number;
    referralsMade: number;
    aumGrowth: number;
    satisfactionScore?: number;
  };
}

export interface ClientJourneyTimelineProps {
  data: ClientJourneyData;
  isLoading?: boolean;
  compact?: boolean;
  maxEvents?: number;
  className?: string;
  onEventClick?: (event: TimelineEvent) => void;
  onViewAll?: () => void;
}

const eventIcons: Record<TimelineEventType, React.ReactNode> = {
  first_contact: <UserPlusIcon className="w-4 h-4" />,
  onboarding: <CheckCircleIcon className="w-4 h-4" />,
  meeting: <CalendarIcon className="w-4 h-4" />,
  call: <PhoneIcon className="w-4 h-4" />,
  email: <EnvelopeIcon className="w-4 h-4" />,
  document: <DocumentTextIcon className="w-4 h-4" />,
  portfolio_change: <ChartBarIcon className="w-4 h-4" />,
  life_event: <HeartIcon className="w-4 h-4" />,
  milestone: <TrophyIcon className="w-4 h-4" />,
  issue: <ExclamationTriangleIcon className="w-4 h-4" />,
  resolution: <CheckCircleIcon className="w-4 h-4" />,
  referral: <UserPlusIcon className="w-4 h-4" />,
  review: <StarIcon className="w-4 h-4" />,
  note: <PencilIcon className="w-4 h-4" />,
};

const eventColors: Record<TimelineEventType, { bg: string; icon: string; border: string }> = {
  first_contact: { bg: 'bg-green-500/10', icon: 'text-green-500', border: 'border-green-500/30' },
  onboarding: { bg: 'bg-blue-500/10', icon: 'text-blue-500', border: 'border-blue-500/30' },
  meeting: { bg: 'bg-purple-500/10', icon: 'text-purple-500', border: 'border-purple-500/30' },
  call: { bg: 'bg-cyan-500/10', icon: 'text-cyan-500', border: 'border-cyan-500/30' },
  email: { bg: 'bg-slate-500/10', icon: 'text-slate-500', border: 'border-slate-500/30' },
  document: { bg: 'bg-amber-500/10', icon: 'text-amber-500', border: 'border-amber-500/30' },
  portfolio_change: { bg: 'bg-indigo-500/10', icon: 'text-indigo-500', border: 'border-indigo-500/30' },
  life_event: { bg: 'bg-pink-500/10', icon: 'text-pink-500', border: 'border-pink-500/30' },
  milestone: { bg: 'bg-amber-500/10', icon: 'text-amber-500', border: 'border-amber-500/30' },
  issue: { bg: 'bg-red-500/10', icon: 'text-red-500', border: 'border-red-500/30' },
  resolution: { bg: 'bg-green-500/10', icon: 'text-green-500', border: 'border-green-500/30' },
  referral: { bg: 'bg-emerald-500/10', icon: 'text-emerald-500', border: 'border-emerald-500/30' },
  review: { bg: 'bg-yellow-500/10', icon: 'text-yellow-500', border: 'border-yellow-500/30' },
  note: { bg: 'bg-slate-500/10', icon: 'text-slate-500', border: 'border-slate-500/30' },
};

function TimelineEventCard({
  event,
  isLast,
  onClick,
}: {
  event: TimelineEvent;
  isLast: boolean;
  onClick?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = eventColors[event.type];

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
      )}

      {/* Event dot */}
      <div className={cn(
        'absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2',
        colors.bg, colors.icon, colors.border,
        event.importance === 'high' && 'ring-2 ring-offset-2 ring-offset-surface ring-current/30'
      )}>
        {eventIcons[event.type]}
      </div>

      {/* Event content */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'ml-4 pb-6 group',
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                'font-medium text-content-primary',
                event.importance === 'high' && 'text-accent-primary'
              )}>
                {event.title}
              </h4>
              {event.importance === 'high' && (
                <Badge variant="warning" size="sm">Important</Badge>
              )}
              {event.automated && (
                <Badge variant="info" size="sm">
                  <SparklesIcon className="w-3 h-3 mr-1" />
                  Auto-logged
                </Badge>
              )}
            </div>
            <p className="text-xs text-content-tertiary mt-0.5">
              {formatDate(event.date)}
              {event.metadata?.duration && ` • ${event.metadata.duration}`}
            </p>
          </div>

          {/* Metadata badges */}
          {event.metadata?.amount && (
            <Badge variant="info" size="sm">
              {formatCurrency(event.metadata.amount)}
              {event.metadata.percentChange && (
                <span className={cn(
                  'ml-1',
                  event.metadata.percentChange >= 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  ({event.metadata.percentChange > 0 ? '+' : ''}{event.metadata.percentChange}%)
                </span>
              )}
            </Badge>
          )}

          {event.metadata?.outcome && (
            <Badge
              variant={event.metadata.outcome === 'positive' ? 'success' : event.metadata.outcome === 'negative' ? 'error' : 'default'}
              size="sm"
            >
              {event.metadata.outcome === 'positive' ? <CheckCircleIcon className="w-3 h-3 mr-1" /> : null}
              {event.metadata.outcome.charAt(0).toUpperCase() + event.metadata.outcome.slice(1)}
            </Badge>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className={cn(
            'text-sm text-content-secondary mt-2',
            !isExpanded && 'line-clamp-2'
          )}>
            {event.description}
          </p>
        )}

        {/* Attendees */}
        {event.metadata?.attendees && event.metadata.attendees.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-content-tertiary">With:</span>
            <div className="flex -space-x-1">
              {event.metadata.attendees.slice(0, 3).map((name, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center text-xs font-medium text-accent-primary border-2 border-surface"
                  title={name}
                >
                  {name.charAt(0)}
                </div>
              ))}
              {event.metadata.attendees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-xs text-content-tertiary border-2 border-surface">
                  +{event.metadata.attendees.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Linked entities */}
        {event.linkedEntities && event.linkedEntities.length > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {event.linkedEntities.map((entity, i) => (
              <button
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-secondary hover:bg-surface-tertiary text-xs text-content-secondary transition-colors"
              >
                {entity.type === 'document' && <DocumentTextIcon className="w-3 h-3" />}
                {entity.type === 'meeting' && <CalendarIcon className="w-3 h-3" />}
                {entity.type === 'task' && <CheckCircleIcon className="w-3 h-3" />}
                {entity.title}
              </button>
            ))}
          </div>
        )}

        {/* Expand toggle */}
        {event.description && event.description.length > 150 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-xs text-accent-primary hover:text-accent-primary-hover mt-2 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="w-3 h-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-3 h-3" /> Show more
              </>
            )}
          </button>
        )}
      </motion.div>
    </div>
  );
}

function MilestoneMarker({ milestone }: { milestone: JourneyMilestone }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative pl-8 py-4"
    >
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
        {milestone.icon || <TrophyIcon className="w-4 h-4 text-white" />}
      </div>
      <div className="ml-4 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2">
          {milestone.celebration && <span className="text-lg">🎉</span>}
          <h4 className="font-semibold text-amber-600 dark:text-amber-400">{milestone.title}</h4>
        </div>
        <p className="text-sm text-content-secondary mt-1">{milestone.description}</p>
        <p className="text-xs text-content-tertiary mt-2">{formatDate(milestone.date)}</p>
      </div>
    </motion.div>
  );
}

function RelationshipSummary({ data }: { data: ClientJourneyData }) {
  const yearsWithClient = Math.floor(
    (Date.now() - new Date(data.relationshipStartDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  const monthsWithClient = Math.floor(
    (Date.now() - new Date(data.relationshipStartDate).getTime()) / (30.44 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-secondary/50 rounded-lg mb-6">
      <div className="text-center">
        <p className="text-2xl font-bold text-content-primary">
          {yearsWithClient > 0 ? `${yearsWithClient}y` : `${monthsWithClient}mo`}
        </p>
        <p className="text-xs text-content-tertiary">Relationship</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-content-primary">{data.stats.totalMeetings}</p>
        <p className="text-xs text-content-tertiary">Meetings</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <p className="text-2xl font-bold text-content-primary">
            {data.stats.aumGrowth > 0 ? '+' : ''}{data.stats.aumGrowth}%
          </p>
          {data.stats.aumGrowth >= 0 ? (
            <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
          ) : (
            <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
          )}
        </div>
        <p className="text-xs text-content-tertiary">AUM Growth</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-content-primary">{data.stats.referralsMade}</p>
        <p className="text-xs text-content-tertiary">Referrals</p>
      </div>
    </div>
  );
}

type FilterType = 'all' | 'meetings' | 'calls' | 'documents' | 'milestones' | 'changes';

export function ClientJourneyTimeline({
  data,
  isLoading = false,
  compact = false,
  maxEvents = 10,
  className,
  onEventClick,
  onViewAll,
}: ClientJourneyTimelineProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAll, setShowAll] = useState(false);

  // Combine events and milestones, sorted by date
  const timelineItems = useMemo(() => {
    const filterMap: Record<FilterType, TimelineEventType[]> = {
      all: [],
      meetings: ['meeting', 'call'],
      calls: ['call'],
      documents: ['document'],
      milestones: ['milestone', 'first_contact', 'onboarding'],
      changes: ['portfolio_change'],
    };

    let filtered = data.events;
    if (filter !== 'all') {
      filtered = data.events.filter(e => filterMap[filter].includes(e.type));
    }

    // Merge with milestones
    const combined = [
      ...filtered.map(e => ({ ...e, _type: 'event' as const })),
      ...data.milestones.map(m => ({ ...m, _type: 'milestone' as const })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return showAll ? combined : combined.slice(0, maxEvents);
  }, [data.events, data.milestones, filter, showAll, maxEvents]);

  const totalItems = data.events.length + data.milestones.length;

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-surface-secondary" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-surface-secondary rounded" />
                <div className="h-3 w-48 bg-surface-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-content-primary">Relationship Journey</h3>
            <SparklesIcon className="w-4 h-4 text-amber-500" />
          </div>
          {onViewAll && (
            <Button variant="secondary" size="sm" onClick={onViewAll}>
              <EyeIcon className="w-4 h-4 mr-1" />
              Full History
            </Button>
          )}
        </div>

        {/* Summary stats */}
        {!compact && <RelationshipSummary data={data} />}

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <FunnelIcon className="w-4 h-4 text-content-tertiary flex-shrink-0" />
          {(['all', 'meetings', 'calls', 'documents', 'milestones', 'changes'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors',
                filter === f
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {timelineItems.length === 0 ? (
          <div className="text-center py-8 text-content-tertiary">
            <ClockIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No events match this filter</p>
          </div>
        ) : (
          <div className="relative">
            <AnimatePresence>
              {timelineItems.map((item, i) => (
                <React.Fragment key={item.id}>
                  {item._type === 'milestone' ? (
                    <MilestoneMarker milestone={item as JourneyMilestone} />
                  ) : (
                    <TimelineEventCard
                      event={item as TimelineEvent}
                      isLast={i === timelineItems.length - 1}
                      onClick={onEventClick ? () => onEventClick(item as TimelineEvent) : undefined}
                    />
                  )}
                </React.Fragment>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load more */}
        {totalItems > maxEvents && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 text-center text-sm text-accent-primary hover:text-accent-primary-hover border-t border-border mt-4"
          >
            Show all {totalItems} events
          </button>
        )}
      </div>
    </Card>
  );
}

/**
 * Generate mock journey data for demo
 */
export function generateJourneyData(clientName: string): ClientJourneyData {
  const startDate = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000); // 3 years ago

  const events: TimelineEvent[] = [
    {
      id: '1',
      type: 'first_contact',
      title: 'Initial Discovery Call',
      description: 'Discussed retirement goals and current portfolio. Client expressed interest in comprehensive wealth management.',
      date: startDate.toISOString(),
      importance: 'high',
      metadata: {
        duration: '45 min',
        outcome: 'positive',
      },
    },
    {
      id: '2',
      type: 'onboarding',
      title: 'Account Opened',
      description: 'Completed paperwork and transferred $1.2M from previous custodian.',
      date: new Date(startDate.getTime() + 14 * 86400000).toISOString(),
      importance: 'high',
      metadata: {
        amount: 1200000,
      },
    },
    {
      id: '3',
      type: 'portfolio_change',
      title: 'Initial Portfolio Allocation',
      description: 'Implemented balanced growth portfolio aligned with 15-year retirement timeline.',
      date: new Date(startDate.getTime() + 21 * 86400000).toISOString(),
      importance: 'medium',
      metadata: {
        amount: 1200000,
      },
    },
    {
      id: '4',
      type: 'meeting',
      title: 'Quarterly Review Q2',
      description: 'Reviewed performance, discussed market conditions. Client very satisfied with returns.',
      date: new Date(startDate.getTime() + 90 * 86400000).toISOString(),
      importance: 'medium',
      metadata: {
        duration: '1 hour',
        attendees: [clientName, 'Sarah Johnson'],
        outcome: 'positive',
      },
    },
    {
      id: '5',
      type: 'life_event',
      title: 'Grandson Born',
      description: 'Discussed 529 plan options for education savings.',
      date: new Date(startDate.getTime() + 180 * 86400000).toISOString(),
      importance: 'high',
      automated: true,
      metadata: {
        lifeEventType: 'baby',
      },
    },
    {
      id: '6',
      type: 'referral',
      title: 'Referred Colleague',
      description: 'Client referred their business partner who is also interested in retirement planning.',
      date: new Date(startDate.getTime() + 365 * 86400000).toISOString(),
      importance: 'high',
      metadata: {
        outcome: 'positive',
      },
    },
    {
      id: '7',
      type: 'portfolio_change',
      title: 'Additional Investment',
      description: 'Added $300K from bonus payout, rebalanced to maintain target allocation.',
      date: new Date(startDate.getTime() + 400 * 86400000).toISOString(),
      importance: 'medium',
      metadata: {
        amount: 1500000,
        amountChange: 300000,
        percentChange: 25,
      },
    },
    {
      id: '8',
      type: 'document',
      title: 'Estate Plan Review',
      description: 'Updated beneficiary designations after birth of grandson.',
      date: new Date(startDate.getTime() + 500 * 86400000).toISOString(),
      importance: 'medium',
      linkedEntities: [
        { type: 'document', id: 'doc1', title: 'Beneficiary Form.pdf' },
        { type: 'document', id: 'doc2', title: 'Trust Amendment.pdf' },
      ],
    },
    {
      id: '9',
      type: 'meeting',
      title: 'Annual Planning Session',
      description: 'Comprehensive review of all financial goals, updated retirement projections.',
      date: new Date(Date.now() - 30 * 86400000).toISOString(),
      importance: 'high',
      metadata: {
        duration: '2 hours',
        attendees: [clientName, 'Spouse', 'Sarah Johnson', 'Tax Advisor'],
        outcome: 'positive',
      },
    },
    {
      id: '10',
      type: 'call',
      title: 'Market Update Call',
      description: 'Proactive call to discuss recent market volatility and reassure about long-term strategy.',
      date: new Date(Date.now() - 7 * 86400000).toISOString(),
      importance: 'medium',
      metadata: {
        duration: '20 min',
        outcome: 'positive',
      },
    },
  ];

  const milestones: JourneyMilestone[] = [
    {
      id: 'm1',
      title: '1 Year Anniversary',
      date: new Date(startDate.getTime() + 365 * 86400000).toISOString(),
      description: 'Celebrated first year of partnership with personalized thank you note.',
      celebration: true,
    },
    {
      id: 'm2',
      title: 'Portfolio Hit $1.5M',
      date: new Date(startDate.getTime() + 450 * 86400000).toISOString(),
      description: 'Portfolio growth plus contributions reached new milestone.',
      celebration: true,
    },
    {
      id: 'm3',
      title: '3 Year Anniversary',
      date: new Date(Date.now() - 30 * 86400000).toISOString(),
      description: 'Three years of trusted partnership. Portfolio has grown 52% since inception.',
      celebration: true,
    },
  ];

  return {
    clientId: '1',
    clientName,
    relationshipStartDate: startDate.toISOString(),
    totalAUM: 1850000,
    events,
    milestones,
    stats: {
      totalMeetings: 14,
      totalCalls: 28,
      totalEmails: 156,
      referralsMade: 2,
      aumGrowth: 52,
      satisfactionScore: 9.5,
    },
  };
}
