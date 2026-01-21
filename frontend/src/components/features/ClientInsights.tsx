'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, Badge, Button, formatCurrency, formatDate } from '../ui';
import {
  SparklesIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  GiftIcon,
  HomeIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  UserPlusIcon,
  BanknotesIcon,
  ShieldExclamationIcon,
  LightBulbIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../ui/utils';

/**
 * ClientInsights - AI-Powered Relationship Intelligence
 *
 * Analyzes client patterns, predicts needs, and surfaces actionable insights
 * to help advisors maintain proactive client relationships.
 */

export interface ClientInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'life_event' | 'pattern' | 'milestone' | 'recommendation';
  title: string;
  description: string;
  confidence: number; // 0-100
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedAction?: string;
  source?: string; // What data generated this insight
  detectedAt: string;
}

export interface RelationshipHealth {
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  factors: {
    communicationFrequency: number;
    responseRate: number;
    meetingAttendance: number;
    portfolioEngagement: number;
    referralActivity: number;
  };
  lastAssessment: string;
}

export interface LifeEvent {
  type: 'birthday' | 'anniversary' | 'retirement' | 'graduation' | 'new_home' | 'new_job' | 'inheritance' | 'marriage' | 'baby' | 'health';
  date: string;
  description: string;
  financialImpact?: 'high' | 'medium' | 'low';
  requiresAction: boolean;
}

export interface ClientInsightsData {
  clientId: string;
  clientName: string;
  relationshipHealth: RelationshipHealth;
  insights: ClientInsight[];
  upcomingLifeEvents: LifeEvent[];
  communicationSummary: {
    lastContact: string;
    avgResponseTime: string;
    preferredChannel: 'email' | 'phone' | 'meeting' | 'text';
    bestTimeToReach: string;
  };
  financialSnapshot: {
    aum: number;
    aumTrend: number; // percentage change
    riskScore: number;
    goalProgress: number;
  };
}

export interface ClientInsightsProps {
  data: ClientInsightsData;
  isLoading?: boolean;
  compact?: boolean;
  className?: string;
  onInsightAction?: (insight: ClientInsight) => void;
  onViewAll?: () => void;
}

const lifeEventIcons: Record<LifeEvent['type'], React.ReactNode> = {
  birthday: <GiftIcon className="w-4 h-4" />,
  anniversary: <HeartIcon className="w-4 h-4" />,
  retirement: <BanknotesIcon className="w-4 h-4" />,
  graduation: <AcademicCapIcon className="w-4 h-4" />,
  new_home: <HomeIcon className="w-4 h-4" />,
  new_job: <BriefcaseIcon className="w-4 h-4" />,
  inheritance: <BanknotesIcon className="w-4 h-4" />,
  marriage: <HeartIcon className="w-4 h-4" />,
  baby: <UserPlusIcon className="w-4 h-4" />,
  health: <ShieldExclamationIcon className="w-4 h-4" />,
};

const insightIcons: Record<ClientInsight['type'], React.ReactNode> = {
  opportunity: <LightBulbIcon className="w-4 h-4" />,
  risk: <ExclamationTriangleIcon className="w-4 h-4" />,
  life_event: <CalendarDaysIcon className="w-4 h-4" />,
  pattern: <ChartBarIcon className="w-4 h-4" />,
  milestone: <SparklesIcon className="w-4 h-4" />,
  recommendation: <LightBulbIcon className="w-4 h-4" />,
};

const insightColors: Record<ClientInsight['type'], string> = {
  opportunity: 'bg-green-500/10 text-green-500 border-green-500/20',
  risk: 'bg-red-500/10 text-red-500 border-red-500/20',
  life_event: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  pattern: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  milestone: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  recommendation: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
};

function RelationshipScoreRing({ score, trend, size = 'md' }: { 
  score: number; 
  trend: RelationshipHealth['trend'];
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: { ring: 60, stroke: 4, text: 'text-lg' },
    md: { ring: 80, stroke: 6, text: 'text-2xl' },
    lg: { ring: 100, stroke: 8, text: 'text-3xl' },
  };
  
  const { ring, stroke, text } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  const bgColor = score >= 80 ? 'stroke-green-500/20' : score >= 60 ? 'stroke-amber-500/20' : 'stroke-red-500/20';
  const strokeColor = score >= 80 ? 'stroke-green-500' : score >= 60 ? 'stroke-amber-500' : 'stroke-red-500';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={ring} height={ring} className="-rotate-90">
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={bgColor}
        />
        <motion.circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={strokeColor}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', text, color)}>{score}</span>
        <div className="flex items-center gap-0.5">
          {trend === 'improving' && <ArrowTrendingUpIcon className="w-3 h-3 text-green-500" />}
          {trend === 'declining' && <ArrowTrendingDownIcon className="w-3 h-3 text-red-500" />}
          <span className="text-[10px] text-content-tertiary uppercase">{trend}</span>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ 
  insight, 
  onAction 
}: { 
  insight: ClientInsight;
  onAction?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-3 rounded-lg border transition-all hover:shadow-md',
        'bg-surface border-border-default'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border',
          insightColors[insight.type]
        )}>
          {insightIcons[insight.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm text-content-primary truncate">
              {insight.title}
            </h4>
            {insight.priority === 'high' && (
              <Badge variant="error" size="sm">Urgent</Badge>
            )}
          </div>
          <p className="text-xs text-content-secondary line-clamp-2">
            {insight.description}
          </p>
          {insight.suggestedAction && (
            <p className="text-xs text-accent-primary mt-2 flex items-center gap-1">
              <LightBulbIcon className="w-3 h-3" />
              {insight.suggestedAction}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-content-tertiary">
              {insight.confidence}% confidence • {insight.source}
            </span>
            {insight.actionable && onAction && (
              <Button size="sm" variant="ghost" onClick={onAction}>
                Take Action
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LifeEventBadge({ event }: { event: LifeEvent }) {
  const isUpcoming = new Date(event.date) > new Date();
  const daysUntil = Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className={cn(
      'flex items-center gap-2 p-2 rounded-lg text-sm',
      event.requiresAction ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-surface-secondary'
    )}>
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center',
        event.requiresAction ? 'bg-amber-500/20 text-amber-500' : 'bg-purple-500/20 text-purple-500'
      )}>
        {lifeEventIcons[event.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-content-primary truncate">{event.description}</p>
        <p className="text-xs text-content-tertiary">
          {isUpcoming ? `In ${daysUntil} days` : formatDate(event.date)}
        </p>
      </div>
      {event.financialImpact === 'high' && (
        <Badge variant="warning" size="sm">$ Impact</Badge>
      )}
    </div>
  );
}

export function ClientInsights({
  data,
  isLoading = false,
  compact = false,
  className,
  onInsightAction,
  onViewAll,
}: ClientInsightsProps) {
  const { relationshipHealth, insights, upcomingLifeEvents, communicationSummary, financialSnapshot } = data;

  const prioritizedInsights = useMemo(() => {
    return [...insights]
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, compact ? 3 : 5);
  }, [insights, compact]);

  const highPriorityCount = insights.filter(i => i.priority === 'high').length;

  if (isLoading) {
    return (
      <Card className={cn('p-6 animate-pulse', className)}>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-surface-secondary" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 bg-surface-secondary rounded" />
            <div className="h-4 w-48 bg-surface-secondary rounded" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with Relationship Score */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-accent-primary/5 to-purple-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RelationshipScoreRing 
              score={relationshipHealth.score} 
              trend={relationshipHealth.trend}
              size={compact ? 'sm' : 'md'}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-content-primary">Relationship Health</h3>
                <SparklesIcon className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm text-content-secondary">
                {relationshipHealth.score >= 80 
                  ? 'Excellent relationship - keep nurturing!' 
                  : relationshipHealth.score >= 60 
                    ? 'Good relationship with room to grow'
                    : 'Needs attention - schedule a check-in'}
              </p>
              {highPriorityCount > 0 && (
                <Badge variant="error" size="sm" className="mt-1">
                  {highPriorityCount} urgent insight{highPriorityCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          
          {onViewAll && (
            <Button variant="secondary" size="sm" onClick={onViewAll}>
              View Full Profile
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      {!compact && (
        <div className="grid grid-cols-4 gap-px bg-border">
          <div className="bg-surface p-3 text-center">
            <p className="text-lg font-semibold text-content-primary">
              {formatCurrency(financialSnapshot.aum)}
            </p>
            <p className="text-xs text-content-tertiary flex items-center justify-center gap-1">
              AUM
              {financialSnapshot.aumTrend >= 0 ? (
                <ArrowTrendingUpIcon className="w-3 h-3 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="w-3 h-3 text-red-500" />
              )}
            </p>
          </div>
          <div className="bg-surface p-3 text-center">
            <p className="text-lg font-semibold text-content-primary">
              {communicationSummary.avgResponseTime}
            </p>
            <p className="text-xs text-content-tertiary">Avg Response</p>
          </div>
          <div className="bg-surface p-3 text-center">
            <p className="text-lg font-semibold text-content-primary capitalize">
              {communicationSummary.preferredChannel}
            </p>
            <p className="text-xs text-content-tertiary">Preferred</p>
          </div>
          <div className="bg-surface p-3 text-center">
            <p className="text-lg font-semibold text-content-primary">
              {financialSnapshot.goalProgress}%
            </p>
            <p className="text-xs text-content-tertiary">Goal Progress</p>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="p-4">
        <h4 className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-3 flex items-center gap-1">
          <LightBulbIcon className="w-3 h-3" />
          AI-Powered Insights
        </h4>
        <div className="space-y-3">
          {prioritizedInsights.map(insight => (
            <InsightCard 
              key={insight.id} 
              insight={insight}
              onAction={onInsightAction ? () => onInsightAction(insight) : undefined}
            />
          ))}
        </div>
        
        {insights.length > (compact ? 3 : 5) && (
          <button className="w-full text-center text-xs text-accent-primary hover:text-accent-primary-hover mt-3 py-2">
            View all {insights.length} insights
          </button>
        )}
      </div>

      {/* Upcoming Life Events */}
      {upcomingLifeEvents.length > 0 && (
        <div className="p-4 border-t border-border bg-surface-secondary/30">
          <h4 className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-3 flex items-center gap-1">
            <CalendarDaysIcon className="w-3 h-3" />
            Upcoming Life Events
          </h4>
          <div className="space-y-2">
            {upcomingLifeEvents.slice(0, compact ? 2 : 4).map((event, i) => (
              <LifeEventBadge key={i} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Communication Tip */}
      {!compact && communicationSummary.bestTimeToReach && (
        <div className="p-3 border-t border-border bg-accent-primary/5 flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-4 h-4 text-accent-primary" />
          <p className="text-xs text-content-secondary">
            <span className="font-medium text-content-primary">Pro tip:</span> Best time to reach is{' '}
            <span className="font-medium">{communicationSummary.bestTimeToReach}</span> via{' '}
            <span className="font-medium capitalize">{communicationSummary.preferredChannel}</span>
          </p>
        </div>
      )}
    </Card>
  );
}

/**
 * Generate mock insights for demo purposes
 * In production, this would come from an AI/ML backend
 */
export function generateClientInsights(clientData: {
  name: string;
  aum: number;
  lastContact?: string;
  meetingsAttended?: number;
  totalMeetings?: number;
}): ClientInsightsData {
  const daysSinceContact = clientData.lastContact 
    ? Math.floor((Date.now() - new Date(clientData.lastContact).getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  
  const insights: ClientInsight[] = [];
  
  // Communication pattern insight
  if (daysSinceContact > 30) {
    insights.push({
      id: '1',
      type: 'risk',
      title: 'Communication Gap Detected',
      description: `No contact in ${daysSinceContact} days. Historical pattern shows monthly check-ins work best for this client.`,
      confidence: 85,
      priority: daysSinceContact > 45 ? 'high' : 'medium',
      actionable: true,
      suggestedAction: 'Schedule a brief check-in call this week',
      source: 'Communication Analysis',
      detectedAt: new Date().toISOString(),
    });
  }

  // Market opportunity
  if (clientData.aum > 500000) {
    insights.push({
      id: '2',
      type: 'opportunity',
      title: 'Tax-Loss Harvesting Opportunity',
      description: 'Based on current market conditions and portfolio holdings, there may be tax optimization opportunities.',
      confidence: 72,
      priority: 'medium',
      actionable: true,
      suggestedAction: 'Review portfolio for tax-loss harvesting before year-end',
      source: 'Portfolio Analysis',
      detectedAt: new Date().toISOString(),
    });
  }

  // Milestone
  insights.push({
    id: '3',
    type: 'milestone',
    title: '5-Year Relationship Anniversary',
    description: 'This marks 5 years of working together. Consider a personalized acknowledgment.',
    confidence: 100,
    priority: 'low',
    actionable: true,
    suggestedAction: 'Send a handwritten note or small gift',
    source: 'Relationship Timeline',
    detectedAt: new Date().toISOString(),
  });

  // Pattern detection
  insights.push({
    id: '4',
    type: 'pattern',
    title: 'Engagement Pattern Shift',
    description: 'Client has been more engaged with portfolio updates recently, suggesting increased interest in investment details.',
    confidence: 68,
    priority: 'low',
    actionable: false,
    source: 'Behavioral Analysis',
    detectedAt: new Date().toISOString(),
  });

  const attendanceRate = clientData.meetingsAttended && clientData.totalMeetings 
    ? (clientData.meetingsAttended / clientData.totalMeetings) * 100 
    : 75;

  return {
    clientId: '1',
    clientName: clientData.name,
    relationshipHealth: {
      score: Math.min(100, Math.max(0, 85 - (daysSinceContact > 30 ? 15 : 0) + (attendanceRate > 80 ? 10 : 0))),
      trend: daysSinceContact > 45 ? 'declining' : daysSinceContact < 15 ? 'improving' : 'stable',
      factors: {
        communicationFrequency: Math.max(0, 100 - daysSinceContact * 2),
        responseRate: 85,
        meetingAttendance: attendanceRate,
        portfolioEngagement: 70,
        referralActivity: 20,
      },
      lastAssessment: new Date().toISOString(),
    },
    insights,
    upcomingLifeEvents: [
      {
        type: 'birthday',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        description: `${clientData.name.split(' ')[0]}'s Birthday`,
        requiresAction: true,
      },
      {
        type: 'retirement',
        date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Planned Retirement Date',
        financialImpact: 'high',
        requiresAction: false,
      },
    ],
    communicationSummary: {
      lastContact: clientData.lastContact || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      avgResponseTime: '4 hours',
      preferredChannel: 'email',
      bestTimeToReach: 'Tuesday/Thursday mornings',
    },
    financialSnapshot: {
      aum: clientData.aum,
      aumTrend: 5.2,
      riskScore: 65,
      goalProgress: 72,
    },
  };
}
