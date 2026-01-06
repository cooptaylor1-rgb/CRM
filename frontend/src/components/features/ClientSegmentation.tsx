'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, formatCurrency } from '../ui';
import {
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  MapPinIcon,
  ChartBarIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  EnvelopeIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  UsersIcon,
  ClockIcon,
  StarIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { cn } from '../ui/utils';

/**
 * ClientSegmentation - Smart Lists & Dynamic Segments
 * 
 * Power to slice and dice your client base:
 * - Complex multi-condition filters
 * - Dynamic segments that auto-update
 * - Saved smart lists
 * - Quick actions on segments
 * - AI-powered segment suggestions
 */

// ============================================
// Types
// ============================================

export type FilterField = 
  | 'aum'
  | 'aum_change'
  | 'age'
  | 'client_since'
  | 'last_contact'
  | 'next_review'
  | 'risk_tolerance'
  | 'status'
  | 'advisor'
  | 'tag'
  | 'state'
  | 'city'
  | 'household_size'
  | 'account_type'
  | 'fee_type'
  | 'revenue'
  | 'meeting_frequency'
  | 'email_engagement';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in'
  | 'before'
  | 'after'
  | 'within_days'
  | 'more_than_days_ago';

export interface FilterCondition {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: any;
  secondValue?: any; // For 'between' operator
}

export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
  logicalOperator: 'and' | 'or';
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  filterGroups: FilterGroup[];
  groupOperator: 'and' | 'or';
  color: string;
  icon: string;
  clientCount: number;
  totalAUM: number;
  isStarred: boolean;
  isDynamic: boolean;
  lastUpdated: string;
  createdAt: string;
  createdBy: string;
}

export interface SegmentClient {
  id: string;
  name: string;
  householdName: string;
  email: string;
  aum: number;
  aumChange: number;
  status: string;
  lastContact: string;
  advisor: string;
  tags: string[];
}

// ============================================
// Constants
// ============================================

const FIELD_CONFIG: Record<FilterField, {
  label: string;
  icon: React.ReactNode;
  type: 'number' | 'date' | 'string' | 'select' | 'multiselect';
  operators: FilterOperator[];
  options?: { value: string; label: string }[];
  unit?: string;
}> = {
  aum: {
    label: 'AUM',
    icon: <CurrencyDollarIcon className="w-4 h-4" />,
    type: 'number',
    operators: ['greater_than', 'less_than', 'between', 'equals'],
    unit: '$',
  },
  aum_change: {
    label: 'AUM Change (YTD)',
    icon: <ArrowTrendingUpIcon className="w-4 h-4" />,
    type: 'number',
    operators: ['greater_than', 'less_than', 'between'],
    unit: '%',
  },
  age: {
    label: 'Age',
    icon: <UserGroupIcon className="w-4 h-4" />,
    type: 'number',
    operators: ['greater_than', 'less_than', 'between', 'equals'],
    unit: 'years',
  },
  client_since: {
    label: 'Client Since',
    icon: <CalendarIcon className="w-4 h-4" />,
    type: 'date',
    operators: ['before', 'after', 'between'],
  },
  last_contact: {
    label: 'Last Contact',
    icon: <ClockIcon className="w-4 h-4" />,
    type: 'date',
    operators: ['within_days', 'more_than_days_ago', 'before', 'after'],
  },
  next_review: {
    label: 'Next Review',
    icon: <CalendarIcon className="w-4 h-4" />,
    type: 'date',
    operators: ['within_days', 'before', 'after'],
  },
  risk_tolerance: {
    label: 'Risk Tolerance',
    icon: <ChartBarIcon className="w-4 h-4" />,
    type: 'select',
    operators: ['equals', 'not_equals', 'in'],
    options: [
      { value: 'conservative', label: 'Conservative' },
      { value: 'moderate_conservative', label: 'Moderate Conservative' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'moderate_aggressive', label: 'Moderate Aggressive' },
      { value: 'aggressive', label: 'Aggressive' },
    ],
  },
  status: {
    label: 'Status',
    icon: <UserGroupIcon className="w-4 h-4" />,
    type: 'select',
    operators: ['equals', 'not_equals', 'in'],
    options: [
      { value: 'active', label: 'Active' },
      { value: 'prospect', label: 'Prospect' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'churned', label: 'Churned' },
    ],
  },
  advisor: {
    label: 'Advisor',
    icon: <UsersIcon className="w-4 h-4" />,
    type: 'select',
    operators: ['equals', 'not_equals', 'in'],
    options: [
      { value: 'jane_wilson', label: 'Jane Wilson' },
      { value: 'john_smith', label: 'John Smith' },
      { value: 'emily_chen', label: 'Emily Chen' },
    ],
  },
  tag: {
    label: 'Tag',
    icon: <TagIcon className="w-4 h-4" />,
    type: 'multiselect',
    operators: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
    options: [
      { value: 'hnw', label: 'HNW' },
      { value: 'uhnw', label: 'UHNW' },
      { value: 'retiree', label: 'Retiree' },
      { value: 'business_owner', label: 'Business Owner' },
      { value: 'referral_source', label: 'Referral Source' },
      { value: 'at_risk', label: 'At Risk' },
    ],
  },
  state: {
    label: 'State',
    icon: <MapPinIcon className="w-4 h-4" />,
    type: 'select',
    operators: ['equals', 'not_equals', 'in'],
    options: [
      { value: 'CA', label: 'California' },
      { value: 'NY', label: 'New York' },
      { value: 'TX', label: 'Texas' },
      { value: 'FL', label: 'Florida' },
    ],
  },
  city: {
    label: 'City',
    icon: <MapPinIcon className="w-4 h-4" />,
    type: 'string',
    operators: ['equals', 'contains'],
  },
  household_size: {
    label: 'Household Size',
    icon: <UserGroupIcon className="w-4 h-4" />,
    type: 'number',
    operators: ['equals', 'greater_than', 'less_than'],
    unit: 'members',
  },
  account_type: {
    label: 'Account Type',
    icon: <CurrencyDollarIcon className="w-4 h-4" />,
    type: 'multiselect',
    operators: ['contains', 'not_contains'],
    options: [
      { value: 'individual', label: 'Individual' },
      { value: 'joint', label: 'Joint' },
      { value: 'ira', label: 'IRA' },
      { value: 'roth_ira', label: 'Roth IRA' },
      { value: '401k', label: '401(k)' },
      { value: 'trust', label: 'Trust' },
    ],
  },
  fee_type: {
    label: 'Fee Structure',
    icon: <CurrencyDollarIcon className="w-4 h-4" />,
    type: 'select',
    operators: ['equals', 'not_equals'],
    options: [
      { value: 'aum', label: 'AUM-based' },
      { value: 'flat', label: 'Flat Fee' },
      { value: 'hourly', label: 'Hourly' },
      { value: 'commission', label: 'Commission' },
    ],
  },
  revenue: {
    label: 'Annual Revenue',
    icon: <CurrencyDollarIcon className="w-4 h-4" />,
    type: 'number',
    operators: ['greater_than', 'less_than', 'between'],
    unit: '$',
  },
  meeting_frequency: {
    label: 'Meetings (Last Year)',
    icon: <CalendarIcon className="w-4 h-4" />,
    type: 'number',
    operators: ['equals', 'greater_than', 'less_than'],
    unit: 'meetings',
  },
  email_engagement: {
    label: 'Email Open Rate',
    icon: <EnvelopeIcon className="w-4 h-4" />,
    type: 'number',
    operators: ['greater_than', 'less_than'],
    unit: '%',
  },
};

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  greater_than: 'is greater than',
  less_than: 'is less than',
  between: 'is between',
  contains: 'contains',
  not_contains: 'does not contain',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  in: 'is one of',
  not_in: 'is not one of',
  before: 'is before',
  after: 'is after',
  within_days: 'is within',
  more_than_days_ago: 'is more than',
};

const SEGMENT_COLORS = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { value: 'slate', label: 'Slate', class: 'bg-slate-500' },
];

const SEGMENT_ICONS = ['users', 'star', 'trending-up', 'currency', 'calendar', 'tag', 'bell', 'chart'];

const PRESET_SEGMENTS: Segment[] = [
  {
    id: 'hnw',
    name: 'High Net Worth',
    description: 'Clients with AUM over $1M',
    filterGroups: [{
      id: 'g1',
      conditions: [{ id: 'c1', field: 'aum', operator: 'greater_than', value: 1000000 }],
      logicalOperator: 'and',
    }],
    groupOperator: 'and',
    color: 'green',
    icon: 'currency',
    clientCount: 45,
    totalAUM: 128500000,
    isStarred: true,
    isDynamic: true,
    lastUpdated: new Date().toISOString(),
    createdAt: '2024-01-15',
    createdBy: 'System',
  },
  {
    id: 'at-risk',
    name: 'At Risk Clients',
    description: 'No contact in 30+ days with significant AUM',
    filterGroups: [{
      id: 'g1',
      conditions: [
        { id: 'c1', field: 'last_contact', operator: 'more_than_days_ago', value: 30 },
        { id: 'c2', field: 'aum', operator: 'greater_than', value: 500000 },
      ],
      logicalOperator: 'and',
    }],
    groupOperator: 'and',
    color: 'red',
    icon: 'bell',
    clientCount: 12,
    totalAUM: 24300000,
    isStarred: true,
    isDynamic: true,
    lastUpdated: new Date().toISOString(),
    createdAt: '2024-02-20',
    createdBy: 'System',
  },
  {
    id: 'upcoming-reviews',
    name: 'Upcoming Reviews',
    description: 'Annual reviews due in next 30 days',
    filterGroups: [{
      id: 'g1',
      conditions: [{ id: 'c1', field: 'next_review', operator: 'within_days', value: 30 }],
      logicalOperator: 'and',
    }],
    groupOperator: 'and',
    color: 'amber',
    icon: 'calendar',
    clientCount: 23,
    totalAUM: 45600000,
    isStarred: false,
    isDynamic: true,
    lastUpdated: new Date().toISOString(),
    createdAt: '2024-03-10',
    createdBy: 'System',
  },
  {
    id: 'retirees',
    name: 'Retirees',
    description: 'Clients aged 65+ or with retiree tag',
    filterGroups: [
      {
        id: 'g1',
        conditions: [{ id: 'c1', field: 'age', operator: 'greater_than', value: 65 }],
        logicalOperator: 'and',
      },
      {
        id: 'g2',
        conditions: [{ id: 'c2', field: 'tag', operator: 'contains', value: 'retiree' }],
        logicalOperator: 'and',
      },
    ],
    groupOperator: 'or',
    color: 'purple',
    icon: 'users',
    clientCount: 67,
    totalAUM: 89200000,
    isStarred: false,
    isDynamic: true,
    lastUpdated: new Date().toISOString(),
    createdAt: '2024-04-05',
    createdBy: 'System',
  },
  {
    id: 'growing-aum',
    name: 'Growing AUM',
    description: 'Clients with 10%+ AUM growth YTD',
    filterGroups: [{
      id: 'g1',
      conditions: [{ id: 'c1', field: 'aum_change', operator: 'greater_than', value: 10 }],
      logicalOperator: 'and',
    }],
    groupOperator: 'and',
    color: 'cyan',
    icon: 'trending-up',
    clientCount: 34,
    totalAUM: 56700000,
    isStarred: false,
    isDynamic: true,
    lastUpdated: new Date().toISOString(),
    createdAt: '2024-05-15',
    createdBy: 'System',
  },
];

const AI_SEGMENT_SUGGESTIONS = [
  {
    name: 'Engagement Opportunity',
    description: 'HNW clients with low meeting frequency - perfect for outreach',
    conditions: 'AUM > $500K AND Meetings < 2/year',
    estimatedCount: 18,
  },
  {
    name: 'Referral Candidates',
    description: 'Highly engaged clients who could be referral sources',
    conditions: 'Meetings > 4/year AND Email Open Rate > 70%',
    estimatedCount: 24,
  },
  {
    name: 'Consolidation Targets',
    description: 'Clients with multiple account types - may have outside assets',
    conditions: 'Account Types >= 3 AND AUM < $1M',
    estimatedCount: 15,
  },
];

// ============================================
// Sample Data
// ============================================

const SAMPLE_CLIENTS: SegmentClient[] = [
  { id: '1', name: 'John Smith', householdName: 'Smith Family', email: 'john@email.com', aum: 2500000, aumChange: 12.5, status: 'active', lastContact: '2025-01-05', advisor: 'Jane Wilson', tags: ['hnw', 'retiree'] },
  { id: '2', name: 'Sarah Johnson', householdName: 'Johnson Trust', email: 'sarah@email.com', aum: 4200000, aumChange: 8.3, status: 'active', lastContact: '2024-12-20', advisor: 'Jane Wilson', tags: ['uhnw', 'business_owner'] },
  { id: '3', name: 'Michael Chen', householdName: 'Chen Family', email: 'michael@email.com', aum: 1800000, aumChange: -2.1, status: 'active', lastContact: '2024-11-15', advisor: 'Emily Chen', tags: ['hnw'] },
  { id: '4', name: 'Emily Davis', householdName: 'Davis Family', email: 'emily@email.com', aum: 950000, aumChange: 15.2, status: 'active', lastContact: '2025-01-08', advisor: 'John Smith', tags: ['referral_source'] },
  { id: '5', name: 'Robert Wilson', householdName: 'Wilson Trust', email: 'robert@email.com', aum: 3100000, aumChange: 5.7, status: 'active', lastContact: '2024-10-30', advisor: 'Jane Wilson', tags: ['hnw', 'at_risk'] },
];

// ============================================
// Components
// ============================================

interface FilterConditionBuilderProps {
  condition: FilterCondition;
  onChange: (condition: FilterCondition) => void;
  onDelete: () => void;
  showDelete: boolean;
}

function FilterConditionBuilder({ condition, onChange, onDelete, showDelete }: FilterConditionBuilderProps) {
  const fieldConfig = FIELD_CONFIG[condition.field];
  const needsSecondValue = condition.operator === 'between';
  const needsDaysValue = condition.operator === 'within_days' || condition.operator === 'more_than_days_ago';

  return (
    <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-border">
      {/* Field selector */}
      <select
        value={condition.field}
        onChange={(e) => onChange({ ...condition, field: e.target.value as FilterField, value: undefined })}
        className="px-3 py-1.5 rounded border border-border bg-surface text-content-primary text-sm"
      >
        {Object.entries(FIELD_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={condition.operator}
        onChange={(e) => onChange({ ...condition, operator: e.target.value as FilterOperator })}
        className="px-3 py-1.5 rounded border border-border bg-surface text-content-primary text-sm"
      >
        {fieldConfig.operators.map(op => (
          <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
        ))}
      </select>

      {/* Value input(s) */}
      {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
        <>
          {fieldConfig.type === 'select' && (
            <select
              value={condition.value || ''}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              className="px-3 py-1.5 rounded border border-border bg-surface text-content-primary text-sm min-w-[150px]"
            >
              <option value="">Select...</option>
              {fieldConfig.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          {fieldConfig.type === 'number' && (
            <div className="flex items-center gap-1">
              {fieldConfig.unit === '$' && <span className="text-content-tertiary text-sm">$</span>}
              <input
                type="number"
                value={condition.value || ''}
                onChange={(e) => onChange({ ...condition, value: parseFloat(e.target.value) })}
                placeholder="Value"
                className="w-28 px-3 py-1.5 rounded border border-border bg-surface text-content-primary text-sm"
              />
              {fieldConfig.unit && fieldConfig.unit !== '$' && (
                <span className="text-content-tertiary text-sm">{fieldConfig.unit}</span>
              )}
            </div>
          )}

          {fieldConfig.type === 'date' && !needsDaysValue && (
            <input
              type="date"
              value={condition.value || ''}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              className="px-3 py-1.5 rounded border border-border bg-surface text-content-primary text-sm"
            />
          )}

          {needsDaysValue && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={condition.value || ''}
                onChange={(e) => onChange({ ...condition, value: parseInt(e.target.value) })}
                placeholder="Days"
                className="w-20 px-3 py-1.5 rounded border border-border bg-surface text-content-primary text-sm"
              />
              <span className="text-content-tertiary text-sm">days</span>
              {condition.operator === 'more_than_days_ago' && (
                <span className="text-content-tertiary text-sm">ago</span>
              )}
            </div>
          )}

          {fieldConfig.type === 'string' && (
            <input
              type="text"
              value={condition.value || ''}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              placeholder="Value"
              className="w-40 px-3 py-1.5 rounded border border-border bg-surface text-content-primary text-sm"
            />
          )}

          {needsSecondValue && (
            <>
              <span className="text-content-tertiary text-sm">and</span>
              <input
                type={fieldConfig.type === 'date' ? 'date' : 'number'}
                value={condition.secondValue || ''}
                onChange={(e) => onChange({ ...condition, secondValue: e.target.value })}
                placeholder="Value"
                className="w-28 px-3 py-1.5 rounded border border-border bg-surface text-content-primary text-sm"
              />
            </>
          )}
        </>
      )}

      {/* Delete button */}
      {showDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-500/10 text-content-tertiary hover:text-red-500 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface SegmentCardProps {
  segment: Segment;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
  isSelected: boolean;
}

function SegmentCard({ segment, onSelect, onEdit, onDelete, onToggleStar, isSelected }: SegmentCardProps) {
  const colorClass = SEGMENT_COLORS.find(c => c.value === segment.color)?.class || 'bg-blue-500';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all',
        isSelected
          ? 'border-accent-primary bg-accent-primary/5 ring-1 ring-accent-primary'
          : 'border-border bg-surface hover:border-accent-primary/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', colorClass)}>
            <UserGroupIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-content-primary">{segment.name}</h3>
              {segment.isDynamic && (
                <Badge variant="info" size="sm">Dynamic</Badge>
              )}
            </div>
            {segment.description && (
              <p className="text-sm text-content-secondary mt-0.5">{segment.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
          className="p-1 hover:bg-surface-secondary rounded transition-colors"
        >
          {segment.isStarred ? (
            <StarIconSolid className="w-5 h-5 text-amber-500" />
          ) : (
            <StarIcon className="w-5 h-5 text-content-tertiary hover:text-amber-500" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
        <div>
          <p className="text-2xl font-bold text-content-primary">{segment.clientCount}</p>
          <p className="text-xs text-content-tertiary">Clients</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-content-primary">{formatCurrency(segment.totalAUM)}</p>
          <p className="text-xs text-content-tertiary">Total AUM</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-xs text-content-tertiary">
          Updated {new Date(segment.lastUpdated).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded hover:bg-surface-secondary text-content-tertiary hover:text-content-primary"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded hover:bg-red-500/10 text-content-tertiary hover:text-red-500"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface ClientListProps {
  clients: SegmentClient[];
  onSelectClient: (client: SegmentClient) => void;
}

function ClientList({ clients, onSelectClient }: ClientListProps) {
  return (
    <div className="space-y-2">
      {clients.map(client => (
        <div
          key={client.id}
          onClick={() => onSelectClient(client)}
          className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border hover:border-accent-primary/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-accent-primary">
                {client.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <p className="font-medium text-content-primary">{client.name}</p>
              <p className="text-sm text-content-secondary">{client.householdName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-content-primary">{formatCurrency(client.aum)}</p>
            <p className={cn(
              'text-sm flex items-center justify-end gap-1',
              client.aumChange >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {client.aumChange >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
              {Math.abs(client.aumChange)}% YTD
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export interface ClientSegmentationProps {
  segments?: Segment[];
  clients?: SegmentClient[];
  onSaveSegment?: (segment: Segment) => void;
  onDeleteSegment?: (segmentId: string) => void;
  onBulkAction?: (segmentId: string, action: string) => void;
  className?: string;
}

export function ClientSegmentation({
  segments: initialSegments = PRESET_SEGMENTS,
  clients: initialClients = SAMPLE_CLIENTS,
  onSaveSegment,
  onDeleteSegment,
  onBulkAction,
  className,
}: ClientSegmentationProps) {
  const [segments, setSegments] = useState<Segment[]>(initialSegments);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [view, setView] = useState<'segments' | 'builder'>('segments');
  const [searchQuery, setSearchQuery] = useState('');

  // Builder state
  const [builderName, setBuilderName] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderColor, setBuilderColor] = useState('blue');
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([{
    id: 'g1',
    conditions: [{ id: 'c1', field: 'aum', operator: 'greater_than', value: undefined }],
    logicalOperator: 'and',
  }]);
  const [groupOperator, setGroupOperator] = useState<'and' | 'or'>('and');
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  // Filtered segments
  const filteredSegments = useMemo(() => {
    if (!searchQuery) return segments;
    const query = searchQuery.toLowerCase();
    return segments.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query)
    );
  }, [segments, searchQuery]);

  // Starred segments first
  const sortedSegments = useMemo(() => {
    return [...filteredSegments].sort((a, b) => {
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      return 0;
    });
  }, [filteredSegments]);

  const resetBuilder = () => {
    setBuilderName('');
    setBuilderDescription('');
    setBuilderColor('blue');
    setFilterGroups([{
      id: 'g1',
      conditions: [{ id: 'c1', field: 'aum', operator: 'greater_than', value: undefined }],
      logicalOperator: 'and',
    }]);
    setGroupOperator('and');
    setEditingSegment(null);
  };

  const handleCreateNew = () => {
    resetBuilder();
    setView('builder');
  };

  const handleEditSegment = (segment: Segment) => {
    setEditingSegment(segment);
    setBuilderName(segment.name);
    setBuilderDescription(segment.description || '');
    setBuilderColor(segment.color);
    setFilterGroups(segment.filterGroups);
    setGroupOperator(segment.groupOperator);
    setView('builder');
  };

  const handleAddCondition = (groupId: string) => {
    setFilterGroups(groups => groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          conditions: [...g.conditions, {
            id: `c${Date.now()}`,
            field: 'aum',
            operator: 'greater_than',
            value: undefined,
          }],
        };
      }
      return g;
    }));
  };

  const handleUpdateCondition = (groupId: string, conditionId: string, condition: FilterCondition) => {
    setFilterGroups(groups => groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          conditions: g.conditions.map(c => c.id === conditionId ? condition : c),
        };
      }
      return g;
    }));
  };

  const handleDeleteCondition = (groupId: string, conditionId: string) => {
    setFilterGroups(groups => groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          conditions: g.conditions.filter(c => c.id !== conditionId),
        };
      }
      return g;
    }).filter(g => g.conditions.length > 0));
  };

  const handleAddGroup = () => {
    setFilterGroups([...filterGroups, {
      id: `g${Date.now()}`,
      conditions: [{ id: `c${Date.now()}`, field: 'aum', operator: 'greater_than', value: undefined }],
      logicalOperator: 'and',
    }]);
  };

  const handleSaveSegment = () => {
    const newSegment: Segment = {
      id: editingSegment?.id || `segment-${Date.now()}`,
      name: builderName,
      description: builderDescription,
      filterGroups,
      groupOperator,
      color: builderColor,
      icon: 'users',
      clientCount: Math.floor(Math.random() * 50) + 10, // Mock count
      totalAUM: Math.floor(Math.random() * 50000000) + 10000000, // Mock AUM
      isStarred: editingSegment?.isStarred || false,
      isDynamic: true,
      lastUpdated: new Date().toISOString(),
      createdAt: editingSegment?.createdAt || new Date().toISOString(),
      createdBy: 'current-user',
    };

    if (editingSegment) {
      setSegments(segments.map(s => s.id === newSegment.id ? newSegment : s));
    } else {
      setSegments([...segments, newSegment]);
    }

    onSaveSegment?.(newSegment);
    resetBuilder();
    setView('segments');
  };

  const handleDeleteSegment = (segmentId: string) => {
    setSegments(segments.filter(s => s.id !== segmentId));
    if (selectedSegment?.id === segmentId) {
      setSelectedSegment(null);
    }
    onDeleteSegment?.(segmentId);
  };

  const handleToggleStar = (segmentId: string) => {
    setSegments(segments.map(s => 
      s.id === segmentId ? { ...s, isStarred: !s.isStarred } : s
    ));
  };

  const totalClients = segments.reduce((sum, s) => sum + s.clientCount, 0);
  const totalAUM = segments.reduce((sum, s) => sum + s.totalAUM, 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-content-primary">Client Segmentation</h2>
          </div>
          <p className="text-sm text-content-secondary mt-1">
            {segments.length} segments • {totalClients} unique clients • {formatCurrency(totalAUM)} total AUM
          </p>
        </div>

        {view === 'segments' && (
          <Button onClick={handleCreateNew}>
            <PlusIcon className="w-4 h-4 mr-1" />
            Create Segment
          </Button>
        )}

        {view === 'builder' && (
          <Button variant="secondary" onClick={() => { resetBuilder(); setView('segments'); }}>
            ← Back to Segments
          </Button>
        )}
      </div>

      {/* Segments View */}
      {view === 'segments' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Segment list */}
          <div className="col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search segments..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-content-primary placeholder:text-content-tertiary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            {/* Segment cards */}
            <div className="grid grid-cols-2 gap-4">
              {sortedSegments.map(segment => (
                <SegmentCard
                  key={segment.id}
                  segment={segment}
                  isSelected={selectedSegment?.id === segment.id}
                  onSelect={() => setSelectedSegment(segment)}
                  onEdit={() => handleEditSegment(segment)}
                  onDelete={() => handleDeleteSegment(segment.id)}
                  onToggleStar={() => handleToggleStar(segment.id)}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI Suggestions */}
            <Card className="p-4 border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-5 h-5 text-purple-500" />
                <h3 className="font-medium text-content-primary">AI Suggestions</h3>
              </div>
              <div className="space-y-3">
                {AI_SEGMENT_SUGGESTIONS.map((suggestion, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface border border-border hover:border-purple-500/50 cursor-pointer transition-colors">
                    <p className="font-medium text-content-primary text-sm">{suggestion.name}</p>
                    <p className="text-xs text-content-secondary mt-1">{suggestion.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <code className="text-xs text-purple-500">{suggestion.conditions}</code>
                      <span className="text-xs text-content-tertiary">~{suggestion.estimatedCount} clients</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Selected segment details */}
            {selectedSegment && (
              <Card className="p-4">
                <h3 className="font-medium text-content-primary mb-3">{selectedSegment.name}</h3>
                <p className="text-sm text-content-secondary mb-4">{selectedSegment.description}</p>
                
                <div className="space-y-2 mb-4">
                  <h4 className="text-xs font-medium text-content-tertiary uppercase tracking-wide">Quick Actions</h4>
                  <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => onBulkAction?.(selectedSegment.id, 'email')}>
                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                    Email All ({selectedSegment.clientCount})
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => onBulkAction?.(selectedSegment.id, 'task')}>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Create Tasks
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => onBulkAction?.(selectedSegment.id, 'export')}>
                    <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                    Export List
                  </Button>
                </div>

                <h4 className="text-xs font-medium text-content-tertiary uppercase tracking-wide mb-2">Sample Clients</h4>
                <ClientList
                  clients={SAMPLE_CLIENTS.slice(0, 3)}
                  onSelectClient={(client) => console.log('Selected:', client)}
                />
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Builder View */}
      {view === 'builder' && (
        <div className="space-y-6">
          {/* Segment Info */}
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">Segment Name</label>
                <input
                  type="text"
                  value={builderName}
                  onChange={(e) => setBuilderName(e.target.value)}
                  placeholder="e.g., High Net Worth Retirees"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-content-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">Color</label>
                <div className="flex items-center gap-2">
                  {SEGMENT_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setBuilderColor(color.value)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        color.class,
                        builderColor === color.value && 'ring-2 ring-offset-2 ring-accent-primary'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-content-primary mb-1">Description (optional)</label>
              <input
                type="text"
                value={builderDescription}
                onChange={(e) => setBuilderDescription(e.target.value)}
                placeholder="Describe this segment..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-content-primary"
              />
            </div>
          </Card>

          {/* Filter Builder */}
          <Card className="p-4">
            <h3 className="font-medium text-content-primary mb-4">Filter Conditions</h3>
            
            <div className="space-y-4">
              {filterGroups.map((group, groupIndex) => (
                <div key={group.id}>
                  {groupIndex > 0 && (
                    <div className="flex items-center justify-center my-4">
                      <button
                        onClick={() => setGroupOperator(groupOperator === 'and' ? 'or' : 'and')}
                        className="px-4 py-1 rounded-full bg-surface-secondary text-content-secondary text-sm font-medium hover:bg-surface-tertiary transition-colors"
                      >
                        {groupOperator.toUpperCase()}
                      </button>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-surface-secondary space-y-2">
                    {group.conditions.map((condition, condIndex) => (
                      <div key={condition.id}>
                        {condIndex > 0 && (
                          <div className="flex items-center gap-2 my-2 ml-4">
                            <button
                              onClick={() => {
                                setFilterGroups(groups => groups.map(g => 
                                  g.id === group.id ? { ...g, logicalOperator: g.logicalOperator === 'and' ? 'or' : 'and' } : g
                                ));
                              }}
                              className="px-3 py-0.5 rounded bg-surface text-content-tertiary text-xs font-medium hover:bg-surface-tertiary transition-colors"
                            >
                              {group.logicalOperator.toUpperCase()}
                            </button>
                          </div>
                        )}
                        <FilterConditionBuilder
                          condition={condition}
                          onChange={(c) => handleUpdateCondition(group.id, condition.id, c)}
                          onDelete={() => handleDeleteCondition(group.id, condition.id)}
                          showDelete={group.conditions.length > 1}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddCondition(group.id)}
                      className="w-full p-2 rounded border border-dashed border-border text-content-tertiary text-sm hover:border-accent-primary hover:text-accent-primary transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 inline mr-1" />
                      Add condition to this group
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddGroup}
              className="w-full mt-4 p-3 rounded-lg border-2 border-dashed border-border text-content-secondary hover:border-accent-primary hover:text-accent-primary transition-colors"
            >
              <PlusIcon className="w-5 h-5 inline mr-2" />
              Add Filter Group
            </button>
          </Card>

          {/* Preview & Save */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-content-tertiary" />
                <span className="text-content-primary font-medium">~{Math.floor(Math.random() * 30) + 10} clients match</span>
              </div>
              <Button variant="secondary" size="sm">
                <EyeIcon className="w-4 h-4 mr-1" />
                Preview Results
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => { resetBuilder(); setView('segments'); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveSegment} disabled={!builderName || filterGroups.length === 0}>
                {editingSegment ? 'Update Segment' : 'Create Segment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { FIELD_CONFIG, OPERATOR_LABELS, PRESET_SEGMENTS };
