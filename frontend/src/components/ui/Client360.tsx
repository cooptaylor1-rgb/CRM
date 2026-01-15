'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';
import {
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BellAlertIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  PlusIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  HeartIcon,
  AcademicCapIcon,
  HomeIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  VideoCameraIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

// ============================================================================
// Types
// ============================================================================

export interface Client360Data {
  id: string;
  // Basic Info
  name: string;
  type: 'individual' | 'household' | 'entity';
  avatar?: string;
  initials: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  status: 'active' | 'prospect' | 'inactive' | 'churned';
  relationshipStart: string;
  primaryAdvisor: string;

  // Contact Info
  email: string;
  phone: string;
  address?: string;
  preferredContact: 'email' | 'phone' | 'text';

  // Financial Summary
  totalAUM: number;
  aumChange: number; // percentage change
  aumTrend: 'up' | 'down' | 'stable';
  annualRevenue: number;
  accounts: number;

  // Health Metrics
  healthScore: number; // 0-100
  engagementScore: number; // 0-100
  riskScore: number; // 0-100 (higher = more risk)
  satisfactionScore?: number; // 0-100
  churnRisk: 'low' | 'medium' | 'high';

  // Compliance
  kycStatus: 'current' | 'expiring' | 'expired' | 'pending';
  kycExpiration?: string;
  accreditedInvestor: boolean;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';

  // Activity Summary
  lastContact: string;
  lastMeeting: string;
  nextMeeting?: string;
  openTasks: number;
  pendingDocuments: number;

  // Life Events & Goals
  lifeEvents?: LifeEvent[];
  goals?: ClientGoal[];

  // Recent Activity
  recentActivity?: ActivityItem[];

  // Relationships
  familyMembers?: FamilyMember[];

  // Accounts Summary
  accountsSummary?: AccountSummary[];

  // AI Insights
  insights?: AIInsight[];

  // Quick Actions
  suggestedActions?: SuggestedAction[];
}

interface LifeEvent {
  id: string;
  type: 'birthday' | 'anniversary' | 'retirement' | 'graduation' | 'wedding' | 'baby' | 'home' | 'custom';
  title: string;
  date: string;
  notes?: string;
}

interface ClientGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'on-track' | 'at-risk' | 'behind';
}

interface ActivityItem {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'document' | 'note' | 'trade';
  title: string;
  description?: string;
  date: string;
  user?: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age?: number;
  isPrimary: boolean;
}

interface AccountSummary {
  id: string;
  name: string;
  type: string;
  balance: number;
  performance: number;
  custodian: string;
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'milestone';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'document';
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// Main Client 360 Component
// ============================================================================

export interface Client360Props {
  data: Client360Data;
  onAction?: (action: string, data?: any) => void;
  onClose?: () => void;
  className?: string;
}

export function Client360({ data, onAction, onClose, className }: Client360Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'accounts' | 'documents' | 'goals'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserCircleIcon },
    { id: 'activity', label: 'Activity', icon: ClockIcon },
    { id: 'accounts', label: 'Accounts', icon: BriefcaseIcon },
    { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
    { id: 'goals', label: 'Goals', icon: ChartBarIcon },
  ] as const;

  return (
    <div className={cn('bg-app min-h-screen', className)}>
      {/* Header Section */}
      <Client360Header data={data} onAction={onAction} />

      {/* Quick Stats Bar */}
      <QuickStatsBar data={data} />

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-surface border-b border-neutral-800">
        <div className="container-page">
          <nav className="flex gap-1 -mb-px overflow-x-auto" aria-label="Client sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    isActive
                      ? 'text-accent-400 border-accent-400'
                      : 'text-neutral-400 border-transparent hover:text-white hover:border-neutral-600'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="container-page py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <OverviewTab data={data} onAction={onAction} />
            </motion.div>
          )}
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ActivityTab data={data} />
            </motion.div>
          )}
          {activeTab === 'accounts' && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AccountsTab data={data} onAction={onAction} />
            </motion.div>
          )}
          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DocumentsTab data={data} onAction={onAction} />
            </motion.div>
          )}
          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GoalsTab data={data} onAction={onAction} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// Header Component
// ============================================================================

function Client360Header({ data, onAction }: { data: Client360Data; onAction?: (action: string, data?: any) => void }) {
  const tierColors = {
    platinum: 'from-slate-400 to-slate-600',
    gold: 'from-amber-400 to-amber-600',
    silver: 'from-gray-400 to-gray-500',
    bronze: 'from-orange-400 to-orange-600',
  };

  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    prospect: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    inactive: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
    churned: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="bg-gradient-to-b from-neutral-800/50 to-transparent border-b border-neutral-800">
      <div className="container-page py-6">
        <div className="flex items-start justify-between gap-6">
          {/* Left: Avatar & Basic Info */}
          <div className="flex items-start gap-5">
            {/* Avatar with tier indicator */}
            <div className="relative">
              <div className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br shadow-lg',
                tierColors[data.tier]
              )}>
                {data.initials}
              </div>
              {data.tier === 'platinum' && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <StarIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Name & Details */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">{data.name}</h1>
                <span className={cn(
                  'px-2.5 py-0.5 text-xs font-medium rounded-full border',
                  statusColors[data.status]
                )}>
                  {data.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <EnvelopeIcon className="w-4 h-4" />
                  {data.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="w-4 h-4" />
                  {data.phone}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                <span>Client since {new Date(data.relationshipStart).getFullYear()}</span>
                <span>•</span>
                <span>Advisor: {data.primaryAdvisor}</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2">
            <QuickActionButton
              icon={PhoneIcon}
              label="Call"
              onClick={() => onAction?.('call', data)}
            />
            <QuickActionButton
              icon={EnvelopeIcon}
              label="Email"
              onClick={() => onAction?.('email', data)}
            />
            <QuickActionButton
              icon={CalendarDaysIcon}
              label="Schedule"
              onClick={() => onAction?.('schedule', data)}
            />
            <QuickActionButton
              icon={PencilSquareIcon}
              label="Note"
              onClick={() => onAction?.('note', data)}
            />
            <div className="w-px h-8 bg-neutral-700 mx-1" />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAction?.('meeting-prep', data)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg font-medium hover:bg-accent-500 transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              Prepare for Meeting
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors group"
    >
      <Icon className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
      <span className="text-xs text-neutral-500 group-hover:text-neutral-300">{label}</span>
    </motion.button>
  );
}

// ============================================================================
// Quick Stats Bar
// ============================================================================

function QuickStatsBar({ data }: { data: Client360Data }) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const healthColor = data.healthScore >= 80 ? 'text-green-400' : data.healthScore >= 60 ? 'text-amber-400' : 'text-red-400';
  const churnColors = {
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-amber-500/20 text-amber-400',
    high: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="bg-neutral-900/50 border-b border-neutral-800">
      <div className="container-page py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* AUM */}
          <StatItem
            label="Total AUM"
            value={formatCurrency(data.totalAUM)}
            trend={data.aumTrend}
            change={data.aumChange}
          />
          {/* Revenue */}
          <StatItem
            label="Annual Revenue"
            value={formatCurrency(data.annualRevenue)}
          />
          {/* Health Score */}
          <StatItem
            label="Health Score"
            value={`${data.healthScore}/100`}
            valueColor={healthColor}
          />
          {/* Engagement */}
          <StatItem
            label="Engagement"
            value={`${data.engagementScore}/100`}
          />
          {/* Churn Risk */}
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500 mb-1">Churn Risk</span>
            <span className={cn('px-2 py-1 text-xs font-medium rounded-full w-fit', churnColors[data.churnRisk])}>
              {data.churnRisk.toUpperCase()}
            </span>
          </div>
          {/* Last Contact */}
          <StatItem
            label="Last Contact"
            value={formatRelativeDate(data.lastContact)}
          />
          {/* Open Tasks */}
          <StatItem
            label="Open Tasks"
            value={data.openTasks.toString()}
            highlight={data.openTasks > 0}
          />
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  trend,
  change,
  valueColor,
  highlight,
}: {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  valueColor?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-neutral-500 mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn('text-lg font-semibold', valueColor || 'text-white', highlight && 'text-accent-400')}>
          {value}
        </span>
        {trend && change !== undefined && (
          <span className={cn(
            'flex items-center text-xs font-medium',
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-neutral-400'
          )}>
            {trend === 'up' ? <ArrowTrendingUpIcon className="w-3 h-3 mr-0.5" /> : trend === 'down' ? <ArrowTrendingDownIcon className="w-3 h-3 mr-0.5" /> : null}
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({ data, onAction }: { data: Client360Data; onAction?: (action: string, data?: any) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - AI Insights & Actions */}
      <div className="lg:col-span-2 space-y-6">
        {/* AI Insights */}
        {data.insights && data.insights.length > 0 && (
          <Card title="AI Insights" icon={SparklesIcon} accent>
            <div className="space-y-3">
              {data.insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} onAction={onAction} />
              ))}
            </div>
          </Card>
        )}

        {/* Suggested Actions */}
        {data.suggestedActions && data.suggestedActions.length > 0 && (
          <Card title="Recommended Actions" icon={CheckCircleIcon}>
            <div className="space-y-2">
              {data.suggestedActions.map((action) => (
                <ActionCard key={action.id} action={action} onAction={onAction} />
              ))}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card title="Recent Activity" icon={ClockIcon} action={{ label: 'View All', onClick: () => {} }}>
          <ActivityTimeline activities={data.recentActivity || []} limit={5} />
        </Card>
      </div>

      {/* Right Column - Details */}
      <div className="space-y-6">
        {/* Contact Info */}
        <Card title="Contact Information" icon={UserCircleIcon}>
          <div className="space-y-3">
            <InfoRow icon={EnvelopeIcon} label="Email" value={data.email} copyable />
            <InfoRow icon={PhoneIcon} label="Phone" value={data.phone} copyable />
            {data.address && <InfoRow icon={MapPinIcon} label="Address" value={data.address} />}
            <InfoRow icon={ChatBubbleLeftRightIcon} label="Preferred Contact" value={data.preferredContact} />
          </div>
        </Card>

        {/* Compliance Status */}
        <Card title="Compliance" icon={ShieldCheckIcon}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">KYC Status</span>
              <KYCBadge status={data.kycStatus} expiration={data.kycExpiration} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Accredited Investor</span>
              <span className={cn('text-sm font-medium', data.accreditedInvestor ? 'text-green-400' : 'text-neutral-400')}>
                {data.accreditedInvestor ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Risk Tolerance</span>
              <span className="text-sm font-medium text-white capitalize">{data.riskTolerance}</span>
            </div>
          </div>
        </Card>

        {/* Family Members */}
        {data.familyMembers && data.familyMembers.length > 0 && (
          <Card title="Household Members" icon={UserCircleIcon} action={{ label: 'View Tree', onClick: () => onAction?.('view-family-tree', data) }}>
            <div className="space-y-2">
              {data.familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800/50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{member.name}</p>
                      <p className="text-xs text-neutral-500">{member.relationship}</p>
                    </div>
                  </div>
                  {member.isPrimary && (
                    <span className="text-xs text-accent-400">Primary</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Upcoming Events */}
        {data.lifeEvents && data.lifeEvents.length > 0 && (
          <Card title="Upcoming Events" icon={CalendarDaysIcon}>
            <div className="space-y-2">
              {data.lifeEvents.slice(0, 3).map((event) => (
                <LifeEventCard key={event.id} event={event} />
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Activity Tab
// ============================================================================

function ActivityTab({ data }: { data: Client360Data }) {
  const [filter, setFilter] = useState<'all' | 'calls' | 'emails' | 'meetings' | 'tasks'>('all');

  const filteredActivities = useMemo(() => {
    if (!data.recentActivity) return [];
    if (filter === 'all') return data.recentActivity;
    const typeMap: Record<typeof filter, string[]> = {
      calls: ['call'],
      emails: ['email'],
      meetings: ['meeting'],
      tasks: ['task'],
      all: [],
    };
    return data.recentActivity.filter(a => typeMap[filter].includes(a.type));
  }, [data.recentActivity, filter]);

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'calls', 'emails', 'meetings', 'tasks'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              filter === f
                ? 'bg-accent-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline activities={filteredActivities} />
    </div>
  );
}

// ============================================================================
// Accounts Tab
// ============================================================================

function AccountsTab({ data, onAction }: { data: Client360Data; onAction?: (action: string, data?: any) => void }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total AUM" value={formatCurrency(data.totalAUM)} />
        <SummaryCard title="Accounts" value={data.accounts.toString()} />
        <SummaryCard title="Annual Revenue" value={formatCurrency(data.annualRevenue)} />
        <SummaryCard title="Avg Performance" value="+8.2% YTD" positive />
      </div>

      {/* Accounts List */}
      <Card title="Accounts" icon={BriefcaseIcon} action={{ label: 'Add Account', onClick: () => onAction?.('add-account', data) }}>
        <div className="space-y-2">
          {data.accountsSummary?.map((account) => (
            <AccountRow key={account.id} account={account} onClick={() => onAction?.('view-account', account)} />
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Documents Tab
// ============================================================================

function DocumentsTab({ data, onAction }: { data: Client360Data; onAction?: (action: string, data?: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search documents..."
            className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
        <button
          onClick={() => onAction?.('upload-document', data)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg font-medium hover:bg-accent-500 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DocumentCategory title="Investment Documents" count={5} icon={ChartBarIcon} />
        <DocumentCategory title="Legal & Compliance" count={3} icon={ShieldCheckIcon} />
        <DocumentCategory title="Correspondence" count={12} icon={EnvelopeIcon} />
      </div>
    </div>
  );
}

// ============================================================================
// Goals Tab
// ============================================================================

function GoalsTab({ data, onAction }: { data: Client360Data; onAction?: (action: string, data?: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Financial Goals</h2>
        <button
          onClick={() => onAction?.('add-goal', data)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg font-medium hover:bg-accent-500 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.goals?.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onClick={() => onAction?.('view-goal', goal)} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Supporting Components
// ============================================================================

function Card({
  title,
  icon: Icon,
  children,
  action,
  accent,
  className,
}: {
  title: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(
      'rounded-xl border p-5',
      accent ? 'bg-accent-500/5 border-accent-500/20' : 'bg-neutral-900/50 border-neutral-800',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={cn('w-5 h-5', accent ? 'text-accent-400' : 'text-neutral-400')} />}
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs font-medium text-accent-400 hover:text-accent-300"
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function InsightCard({ insight, onAction }: { insight: AIInsight; onAction?: (action: string, data?: any) => void }) {
  const typeStyles = {
    opportunity: { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: ArrowTrendingUpIcon, color: 'text-green-400' },
    risk: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ExclamationTriangleIcon, color: 'text-red-400' },
    recommendation: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: SparklesIcon, color: 'text-blue-400' },
    milestone: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: StarIcon, color: 'text-amber-400' },
  };

  const style = typeStyles[insight.type];
  const Icon = style.icon;

  return (
    <div className={cn('p-4 rounded-lg border', style.bg, style.border)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5', style.color)} />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{insight.title}</p>
          <p className="text-xs text-neutral-400 mt-1">{insight.description}</p>
          {insight.actionable && (
            <button
              onClick={() => onAction?.('insight-action', insight)}
              className={cn('mt-2 text-xs font-medium', style.color)}
            >
              Take Action →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ action, onAction }: { action: SuggestedAction; onAction?: (action: string, data?: any) => void }) {
  const typeIcons = {
    call: PhoneIcon,
    email: EnvelopeIcon,
    meeting: CalendarDaysIcon,
    task: CheckCircleIcon,
    document: DocumentTextIcon,
  };
  const Icon = typeIcons[action.type];

  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => onAction?.('suggested-action', action)}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center">
        <Icon className="w-4 h-4 text-neutral-300" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{action.title}</p>
        <p className="text-xs text-neutral-500">{action.description}</p>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-neutral-500" />
    </motion.button>
  );
}

function ActivityTimeline({ activities, limit }: { activities: ActivityItem[]; limit?: number }) {
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  const typeIcons = {
    call: PhoneIcon,
    email: EnvelopeIcon,
    meeting: VideoCameraIcon,
    task: CheckCircleIcon,
    document: DocumentTextIcon,
    note: PencilSquareIcon,
    trade: ArrowPathIcon,
  };

  return (
    <div className="space-y-4">
      {displayActivities.map((activity, index) => {
        const Icon = typeIcons[activity.type];
        return (
          <div key={activity.id} className="flex gap-4">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                <Icon className="w-4 h-4 text-neutral-400" />
              </div>
              {index < displayActivities.length - 1 && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-full bg-neutral-800" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">{activity.title}</p>
                <span className="text-xs text-neutral-500">{formatRelativeDate(activity.date)}</span>
              </div>
              {activity.description && (
                <p className="text-xs text-neutral-400 mt-1">{activity.description}</p>
              )}
              {activity.user && (
                <p className="text-xs text-neutral-500 mt-1">by {activity.user}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, copyable }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-neutral-400">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

function KYCBadge({ status, expiration }: { status: string; expiration?: string }) {
  const styles = {
    current: 'bg-green-500/20 text-green-400',
    expiring: 'bg-amber-500/20 text-amber-400',
    expired: 'bg-red-500/20 text-red-400',
    pending: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', styles[status as keyof typeof styles])}>
      {status.toUpperCase()}
    </span>
  );
}

function LifeEventCard({ event }: { event: LifeEvent }) {
  const typeIcons = {
    birthday: HeartIcon,
    anniversary: HeartIcon,
    retirement: BriefcaseIcon,
    graduation: AcademicCapIcon,
    wedding: HeartIcon,
    baby: HeartIcon,
    home: HomeIcon,
    custom: CalendarDaysIcon,
  };
  const Icon = typeIcons[event.type];

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/50">
      <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
        <Icon className="w-4 h-4 text-neutral-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-white">{event.title}</p>
        <p className="text-xs text-neutral-500">{new Date(event.date).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, positive }: { title: string; value: string; positive?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
      <p className="text-xs text-neutral-500 mb-1">{title}</p>
      <p className={cn('text-xl font-semibold', positive ? 'text-green-400' : 'text-white')}>{value}</p>
    </div>
  );
}

function AccountRow({ account, onClick }: { account: AccountSummary; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors text-left"
    >
      <div>
        <p className="text-sm font-medium text-white">{account.name}</p>
        <p className="text-xs text-neutral-500">{account.type} • {account.custodian}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-white">{formatCurrency(account.balance)}</p>
        <p className={cn('text-xs', account.performance >= 0 ? 'text-green-400' : 'text-red-400')}>
          {account.performance >= 0 ? '+' : ''}{account.performance}%
        </p>
      </div>
    </motion.button>
  );
}

function DocumentCategory({ title, count, icon: Icon }: { title: string; count: number; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors text-left"
    >
      <Icon className="w-8 h-8 text-neutral-400 mb-3" />
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="text-xs text-neutral-500">{count} documents</p>
    </motion.button>
  );
}

function GoalCard({ goal, onClick }: { goal: ClientGoal; onClick: () => void }) {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const statusColors = {
    'on-track': 'text-green-400',
    'at-risk': 'text-amber-400',
    'behind': 'text-red-400',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="p-5 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors text-left"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-white">{goal.title}</p>
          <p className="text-xs text-neutral-500">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
        </div>
        <span className={cn('text-xs font-medium capitalize', statusColors[goal.status])}>
          {goal.status.replace('-', ' ')}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-neutral-400">{formatCurrency(goal.currentAmount)}</span>
          <span className="text-neutral-400">{formatCurrency(goal.targetAmount)}</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            className={cn(
              'h-full rounded-full',
              goal.status === 'on-track' ? 'bg-green-500' : goal.status === 'at-risk' ? 'bg-amber-500' : 'bg-red-500'
            )}
          />
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
