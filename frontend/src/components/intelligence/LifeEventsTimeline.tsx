'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  HeartIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FilterIcon,
  PlusIcon,
  BriefcaseIcon,
  HomeIcon,
  GiftIcon,
  TrendingUpIcon,
  UserPlusIcon,
  GraduationCapIcon,
  CakeIcon,
  AlertCircleIcon,
  ClockIcon,
  BuildingIcon,
  UsersIcon,
  FileTextIcon,
  DollarSignIcon,
  HeartPulseIcon,
  TrophyIcon,
} from 'lucide-react';
import { Card, Badge, Button, Select, Skeleton } from '@/components/ui';
import {
  intelligenceService,
  LifeEvent,
  LifeEventType,
  lifeEventTypeLabels,
} from '@/services/intelligence.service';

// =============================================================================
// Life Event Icon Mapping
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
// Types
// =============================================================================

interface LifeEventsTimelineProps {
  householdId?: string;
  limit?: number;
  showFilters?: boolean;
  showAddButton?: boolean;
  onAddEvent?: () => void;
}

type FilterType = 'all' | 'family' | 'career' | 'financial' | 'health' | 'milestone';

// =============================================================================
// Component
// =============================================================================

export function LifeEventsTimeline({
  householdId,
  limit,
  showFilters = true,
  showAddButton = false,
  onAddEvent,
}: LifeEventsTimelineProps) {
  const [loading, setLoading] = React.useState(true);
  const [events, setEvents] = React.useState<LifeEvent[]>([]);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<FilterType>('all');
  const [showAcknowledged, setShowAcknowledged] = React.useState(false);

  const loadEvents = React.useCallback(async () => {
    try {
      const data = await intelligenceService.getLifeEvents({
        householdId,
        acknowledged: showAcknowledged ? undefined : 'false',
      });
      setEvents(limit ? data.slice(0, limit) : data);
    } catch {
      toast.error('Failed to load life events');
    } finally {
      setLoading(false);
    }
  }, [householdId, limit, showAcknowledged]);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleAcknowledge = async (eventId: string) => {
    try {
      await intelligenceService.acknowledgeLifeEvent(eventId);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, isAcknowledged: true, acknowledgedAt: new Date().toISOString() }
            : e
        )
      );
      toast.success('Event acknowledged');
    } catch {
      toast.error('Failed to acknowledge event');
    }
  };

  const filterEvents = (events: LifeEvent[]): LifeEvent[] => {
    if (filter === 'all') return events;

    const typeCategories: Record<FilterType, LifeEventType[]> = {
      all: [],
      family: ['marriage', 'divorce', 'birth_of_child', 'death_in_family', 'child_graduation', 'child_college'],
      career: ['retirement', 'job_change', 'business_sale', 'promotion'],
      financial: ['inheritance', 'large_withdrawal', 'large_deposit', 'home_purchase', 'home_sale'],
      health: ['major_illness', 'disability', 'long_term_care'],
      milestone: ['birthday_milestone', 'account_anniversary', 'aum_milestone', 'estate_plan_update', 'beneficiary_change', 'rmd_approaching'],
    };

    return events.filter((e) => typeCategories[filter].includes(e.eventType));
  };

  const filteredEvents = filterEvents(events);

  // Group events by month
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const date = new Date(event.eventDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, LifeEvent[]>);

  if (loading) {
    return <TimelineSkeleton />;
  }

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-pink-500" />
            <h2 className="font-semibold text-foreground">Life Events</h2>
            <Badge variant="secondary">{filteredEvents.length}</Badge>
          </div>
          {showAddButton && (
            <Button variant="outline" size="sm" onClick={onAddEvent} className="gap-1">
              <PlusIcon className="w-4 h-4" />
              Add Event
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center gap-2 mt-3">
            <FilterIcon className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {(['all', 'family', 'career', 'financial', 'health', 'milestone'] as FilterType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filter === type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                )
              )}
            </div>
            <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showAcknowledged}
                onChange={(e) => setShowAcknowledged(e.target.checked)}
                className="rounded"
              />
              Show acknowledged
            </label>
          </div>
        )}
      </div>

      <div className="p-4">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No life events found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([month, monthEvents]) => (
                <div key={month}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {new Date(month + '-01').toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {monthEvents.map((event) => (
                        <EventItem
                          key={event.id}
                          event={event}
                          isExpanded={expandedId === event.id}
                          onToggle={() =>
                            setExpandedId(expandedId === event.id ? null : event.id)
                          }
                          onAcknowledge={() => handleAcknowledge(event.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function EventItem({
  event,
  isExpanded,
  onToggle,
  onAcknowledge,
}: {
  event: LifeEvent;
  isExpanded: boolean;
  onToggle: () => void;
  onAcknowledge: () => void;
}) {
  const impactColors = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-900/10',
    high: 'border-orange-500 bg-orange-50 dark:bg-orange-900/10',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
    low: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border-l-4 rounded-r-lg ${
        event.isAcknowledged
          ? 'border-gray-300 bg-gray-50 dark:bg-gray-800/50 opacity-75'
          : impactColors[event.impact]
      }`}
    >
      <div
        className="p-3 cursor-pointer flex items-start gap-3"
        onClick={onToggle}
      >
        <div className="p-2 bg-white/50 dark:bg-white/10 rounded-lg text-current">
          {getLifeEventIcon(event.eventType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground truncate">{event.title}</h4>
            {event.isAcknowledged && (
              <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {lifeEventTypeLabels[event.eventType]}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {new Date(event.eventDate).toLocaleDateString()}
            </span>
            {event.confidenceScore && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {event.confidenceScore}% confidence
                </span>
              </>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 ml-11 space-y-3">
              {event.description && (
                <p className="text-sm text-foreground/80">{event.description}</p>
              )}

              {event.recommendedActions && event.recommendedActions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Recommended Actions:
                  </p>
                  <ul className="space-y-1">
                    {event.recommendedActions.map((action, i) => (
                      <li
                        key={i}
                        className="text-sm text-foreground/80 flex items-center gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {event.person && (
                <p className="text-xs text-muted-foreground">
                  Related to: {event.person.firstName} {event.person.lastName}
                </p>
              )}

              {!event.isAcknowledged && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcknowledge();
                  }}
                  className="gap-1"
                >
                  <CheckIcon className="w-3 h-3" />
                  Acknowledge
                </Button>
              )}

              {event.isAcknowledged && event.acknowledgedAt && (
                <p className="text-xs text-muted-foreground">
                  Acknowledged on {new Date(event.acknowledgedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TimelineSkeleton() {
  return (
    <Card>
      <div className="p-4 border-b border-border">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </Card>
  );
}

export default LifeEventsTimeline;
