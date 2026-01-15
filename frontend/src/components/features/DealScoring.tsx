'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../ui/utils';
import {
  ChartBarIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  PlayIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

export type ScoreCriteriaCategory =
  | 'engagement'
  | 'firmographic'
  | 'behavioral'
  | 'timeline'
  | 'qualification';

export type ScoreOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'contains'
  | 'is_empty'
  | 'is_not_empty'
  | 'days_since'
  | 'count_greater_than';

export interface ScoreCriteria {
  id: string;
  name: string;
  description?: string;
  category: ScoreCriteriaCategory;
  field: string;
  operator: ScoreOperator;
  value: string | number | [number, number];
  weight: number; // -100 to 100
  enabled: boolean;
}

export interface ScoringModel {
  id: string;
  name: string;
  description?: string;
  criteria: ScoreCriteria[];
  thresholds: {
    hot: number;
    warm: number;
    cold: number;
  };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DealScore {
  dealId: string;
  score: number;
  previousScore?: number;
  scoreDelta?: number;
  tier: 'hot' | 'warm' | 'cold' | 'freezing';
  breakdown: ScoreBreakdownItem[];
  recommendations: string[];
  lastCalculated: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface ScoreBreakdownItem {
  criteriaId: string;
  criteriaName: string;
  category: ScoreCriteriaCategory;
  points: number;
  maxPoints: number;
  matched: boolean;
  reason?: string;
}

export interface ScoreHistory {
  date: string;
  score: number;
  tier: DealScore['tier'];
}

// ============================================================================
// Configuration
// ============================================================================

const CATEGORY_CONFIGS: Record<ScoreCriteriaCategory, {
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}> = {
  engagement: {
    label: 'Engagement',
    description: 'How actively the prospect is engaging',
    icon: ChatBubbleLeftRightIcon,
    color: 'text-blue-400 bg-blue-500/10',
  },
  firmographic: {
    label: 'Firmographic',
    description: 'Company and financial attributes',
    icon: CurrencyDollarIcon,
    color: 'text-green-400 bg-green-500/10',
  },
  behavioral: {
    label: 'Behavioral',
    description: 'Actions and behavior patterns',
    icon: UserIcon,
    color: 'text-purple-400 bg-purple-500/10',
  },
  timeline: {
    label: 'Timeline',
    description: 'Time-based criteria',
    icon: CalendarDaysIcon,
    color: 'text-amber-400 bg-amber-500/10',
  },
  qualification: {
    label: 'Qualification',
    description: 'Sales qualification metrics',
    icon: CheckCircleIcon,
    color: 'text-cyan-400 bg-cyan-500/10',
  },
};

const FIELD_OPTIONS: Array<{
  value: string;
  label: string;
  category: ScoreCriteriaCategory;
  operators: ScoreOperator[];
}> = [
  // Engagement
  { value: 'email_opens', label: 'Email Opens', category: 'engagement', operators: ['greater_than', 'less_than', 'between'] },
  { value: 'email_clicks', label: 'Email Clicks', category: 'engagement', operators: ['greater_than', 'less_than', 'between'] },
  { value: 'meetings_count', label: 'Meetings Count', category: 'engagement', operators: ['greater_than', 'less_than', 'between'] },
  { value: 'calls_count', label: 'Calls Count', category: 'engagement', operators: ['greater_than', 'less_than', 'between'] },
  { value: 'website_visits', label: 'Website Visits', category: 'engagement', operators: ['greater_than', 'less_than', 'between'] },
  { value: 'last_activity_days', label: 'Days Since Last Activity', category: 'engagement', operators: ['less_than', 'greater_than'] },

  // Firmographic
  { value: 'deal_value', label: 'Deal Value', category: 'firmographic', operators: ['greater_than', 'less_than', 'between'] },
  { value: 'aum', label: 'Assets Under Management', category: 'firmographic', operators: ['greater_than', 'less_than', 'between'] },
  { value: 'household_size', label: 'Household Size', category: 'firmographic', operators: ['greater_than', 'less_than', 'equals'] },
  { value: 'client_tier', label: 'Client Tier', category: 'firmographic', operators: ['equals', 'not_equals'] },
  { value: 'industry', label: 'Industry', category: 'firmographic', operators: ['equals', 'not_equals', 'contains'] },

  // Behavioral
  { value: 'documents_viewed', label: 'Documents Viewed', category: 'behavioral', operators: ['greater_than', 'count_greater_than'] },
  { value: 'proposal_views', label: 'Proposal Views', category: 'behavioral', operators: ['greater_than', 'less_than'] },
  { value: 'replied_to_email', label: 'Replied to Email', category: 'behavioral', operators: ['equals'] },
  { value: 'attended_meeting', label: 'Attended Meeting', category: 'behavioral', operators: ['equals'] },
  { value: 'requested_info', label: 'Requested Information', category: 'behavioral', operators: ['equals'] },

  // Timeline
  { value: 'days_in_stage', label: 'Days in Current Stage', category: 'timeline', operators: ['less_than', 'greater_than', 'between'] },
  { value: 'days_since_created', label: 'Days Since Created', category: 'timeline', operators: ['less_than', 'greater_than', 'between'] },
  { value: 'expected_close_days', label: 'Days Until Expected Close', category: 'timeline', operators: ['less_than', 'greater_than', 'between'] },

  // Qualification
  { value: 'has_budget', label: 'Has Budget Confirmed', category: 'qualification', operators: ['equals'] },
  { value: 'has_authority', label: 'Decision Maker Identified', category: 'qualification', operators: ['equals'] },
  { value: 'has_need', label: 'Need Identified', category: 'qualification', operators: ['equals'] },
  { value: 'has_timeline', label: 'Timeline Established', category: 'qualification', operators: ['equals'] },
  { value: 'competitor_mentioned', label: 'Competitor Mentioned', category: 'qualification', operators: ['equals', 'not_equals'] },
];

const TIER_COLORS = {
  hot: 'text-red-400 bg-red-500/10 border-red-500/30',
  warm: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  cold: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  freezing: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
};

// ============================================================================
// Scoring Model Editor Component
// ============================================================================

export interface ScoringModelEditorProps {
  model?: ScoringModel;
  onSave: (model: Omit<ScoringModel, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  className?: string;
}

export function ScoringModelEditor({
  model,
  onSave,
  onCancel,
  className,
}: ScoringModelEditorProps) {
  const [name, setName] = useState(model?.name || 'Deal Scoring Model');
  const [description, setDescription] = useState(model?.description || '');
  const [criteria, setCriteria] = useState<ScoreCriteria[]>(model?.criteria || []);
  const [thresholds, setThresholds] = useState(model?.thresholds || { hot: 80, warm: 50, cold: 25 });
  const [enabled, setEnabled] = useState(model?.enabled ?? true);
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);

  const generateId = () => `crit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Calculate max possible score
  const maxScore = useMemo(() => {
    return criteria
      .filter(c => c.enabled && c.weight > 0)
      .reduce((acc, c) => acc + c.weight, 0);
  }, [criteria]);

  // Add criteria
  const addCriteria = useCallback((category: ScoreCriteriaCategory) => {
    const newCriteria: ScoreCriteria = {
      id: generateId(),
      name: 'New Criteria',
      category,
      field: FIELD_OPTIONS.find(f => f.category === category)?.value || '',
      operator: 'greater_than',
      value: 0,
      weight: 10,
      enabled: true,
    };
    setCriteria(prev => [...prev, newCriteria]);
    setExpandedCriteria(newCriteria.id);
  }, []);

  // Update criteria
  const updateCriteria = useCallback((criteriaId: string, updates: Partial<ScoreCriteria>) => {
    setCriteria(prev => prev.map(c =>
      c.id === criteriaId ? { ...c, ...updates } : c
    ));
  }, []);

  // Remove criteria
  const removeCriteria = useCallback((criteriaId: string) => {
    setCriteria(prev => prev.filter(c => c.id !== criteriaId));
  }, []);

  // Group criteria by category
  const groupedCriteria = useMemo(() => {
    const groups: Record<ScoreCriteriaCategory, ScoreCriteria[]> = {
      engagement: [],
      firmographic: [],
      behavioral: [],
      timeline: [],
      qualification: [],
    };
    criteria.forEach(c => {
      groups[c.category].push(c);
    });
    return groups;
  }, [criteria]);

  const handleSave = useCallback(() => {
    onSave({
      name,
      description,
      criteria,
      thresholds,
      enabled,
    });
  }, [name, description, criteria, thresholds, enabled, onSave]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent text-lg font-semibold text-white border-none focus:outline-none focus:ring-0"
              placeholder="Model Name"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-transparent text-sm text-neutral-400 border-none focus:outline-none focus:ring-0 w-full"
              placeholder="Add a description..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEnabled(!enabled)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              enabled
                ? 'bg-status-success-bg text-status-success-text'
                : 'bg-neutral-800 text-neutral-400'
            )}
          >
            {enabled ? <PlayIcon className="w-4 h-4" /> : <XMarkIcon className="w-4 h-4" />}
            {enabled ? 'Active' : 'Inactive'}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent-600 text-white hover:bg-accent-500 text-sm font-medium transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Save Model
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-6 p-6">
          {/* Left Column - Criteria */}
          <div className="col-span-2 space-y-6">
            {/* Category Sections */}
            {Object.entries(CATEGORY_CONFIGS).map(([category, config]) => {
              const categoryCriteria = groupedCriteria[category as ScoreCriteriaCategory];
              const CategoryIcon = config.icon;
              const categoryPoints = categoryCriteria
                .filter(c => c.enabled && c.weight > 0)
                .reduce((acc, c) => acc + c.weight, 0);

              return (
                <div key={category} className="bg-neutral-800/50 rounded-xl overflow-hidden">
                  {/* Category Header */}
                  <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.color)}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{config.label}</h3>
                        <p className="text-xs text-neutral-400">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-400">
                        {categoryPoints} pts possible
                      </span>
                      <button
                        onClick={() => addCriteria(category as ScoreCriteriaCategory)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Criteria List */}
                  <div className="divide-y divide-neutral-700">
                    {categoryCriteria.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-neutral-500">No criteria in this category</p>
                        <button
                          onClick={() => addCriteria(category as ScoreCriteriaCategory)}
                          className="mt-2 text-sm text-accent-400 hover:text-accent-300"
                        >
                          Add criteria
                        </button>
                      </div>
                    ) : (
                      categoryCriteria.map((crit) => (
                        <CriteriaItem
                          key={crit.id}
                          criteria={crit}
                          isExpanded={expandedCriteria === crit.id}
                          onToggleExpand={() => setExpandedCriteria(
                            expandedCriteria === crit.id ? null : crit.id
                          )}
                          onUpdate={(updates) => updateCriteria(crit.id, updates)}
                          onRemove={() => removeCriteria(crit.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Score Overview */}
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <h3 className="font-medium text-white mb-4">Score Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Max Possible Score</span>
                  <span className="text-lg font-bold text-white">{maxScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Active Criteria</span>
                  <span className="text-lg font-bold text-white">
                    {criteria.filter(c => c.enabled).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Thresholds */}
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <h3 className="font-medium text-white mb-4">Score Thresholds</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <FireIcon className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-neutral-300">Hot Lead</span>
                    </div>
                    <span className="text-sm font-mono text-neutral-400">≥ {thresholds.hot}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={thresholds.hot}
                    onChange={(e) => setThresholds(prev => ({
                      ...prev,
                      hot: Math.max(parseInt(e.target.value, 10), prev.warm + 1)
                    }))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <ArrowTrendingUpIcon className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-neutral-300">Warm Lead</span>
                    </div>
                    <span className="text-sm font-mono text-neutral-400">≥ {thresholds.warm}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={thresholds.warm}
                    onChange={(e) => setThresholds(prev => ({
                      ...prev,
                      warm: Math.min(Math.max(parseInt(e.target.value, 10), prev.cold + 1), prev.hot - 1)
                    }))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MinusIcon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-neutral-300">Cold Lead</span>
                    </div>
                    <span className="text-sm font-mono text-neutral-400">≥ {thresholds.cold}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={thresholds.cold}
                    onChange={(e) => setThresholds(prev => ({
                      ...prev,
                      cold: Math.min(parseInt(e.target.value, 10), prev.warm - 1)
                    }))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="pt-2 border-t border-neutral-700">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                    <span className="text-sm text-neutral-400">Freezing: &lt; {thresholds.cold}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <h3 className="font-medium text-white mb-4">Score Distribution</h3>
              <div className="h-4 rounded-full overflow-hidden flex">
                <div
                  className="bg-cyan-500"
                  style={{ width: `${thresholds.cold}%` }}
                  title={`Freezing: 0-${thresholds.cold - 1}`}
                />
                <div
                  className="bg-blue-500"
                  style={{ width: `${thresholds.warm - thresholds.cold}%` }}
                  title={`Cold: ${thresholds.cold}-${thresholds.warm - 1}`}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${thresholds.hot - thresholds.warm}%` }}
                  title={`Warm: ${thresholds.warm}-${thresholds.hot - 1}`}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${100 - thresholds.hot}%` }}
                  title={`Hot: ${thresholds.hot}-100`}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-neutral-500">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Criteria Item Component
// ============================================================================

interface CriteriaItemProps {
  criteria: ScoreCriteria;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<ScoreCriteria>) => void;
  onRemove: () => void;
}

function CriteriaItem({
  criteria,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
}: CriteriaItemProps) {
  const fieldConfig = FIELD_OPTIONS.find(f => f.value === criteria.field);

  return (
    <div className={cn(
      'transition-colors',
      !criteria.enabled && 'opacity-50'
    )}>
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={onToggleExpand}
          className="p-1 rounded text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronRightIcon className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')} />
        </button>

        <input
          type="checkbox"
          checked={criteria.enabled}
          onChange={(e) => onUpdate({ enabled: e.target.checked })}
          className="w-4 h-4 rounded border-neutral-600 bg-neutral-900 text-accent-600 focus:ring-accent-500"
        />

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={criteria.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full bg-transparent text-sm font-medium text-white border-none focus:outline-none focus:ring-0"
            placeholder="Criteria name"
          />
          <p className="text-xs text-neutral-500 truncate">
            {fieldConfig?.label} {criteria.operator.replace(/_/g, ' ')} {String(criteria.value)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            'px-2 py-1 rounded text-xs font-medium',
            criteria.weight > 0
              ? 'bg-status-success-bg/50 text-status-success-text'
              : criteria.weight < 0
                ? 'bg-status-error-bg/50 text-status-error-text'
                : 'bg-neutral-700 text-neutral-400'
          )}>
            {criteria.weight > 0 && '+'}{criteria.weight} pts
          </div>
          <button
            onClick={onRemove}
            className="p-1.5 rounded text-neutral-400 hover:text-status-error-text hover:bg-status-error-bg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-3 ml-10">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Field</label>
                  <select
                    value={criteria.field}
                    onChange={(e) => onUpdate({ field: e.target.value })}
                    className="w-full px-2 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-accent-500"
                  >
                    {FIELD_OPTIONS.filter(f => f.category === criteria.category).map((field) => (
                      <option key={field.value} value={field.value}>{field.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Operator</label>
                  <select
                    value={criteria.operator}
                    onChange={(e) => onUpdate({ operator: e.target.value as ScoreOperator })}
                    className="w-full px-2 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-accent-500"
                  >
                    {fieldConfig?.operators.map((op) => (
                      <option key={op} value={op}>{op.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Value</label>
                  <input
                    type={criteria.operator.includes('than') || criteria.operator.includes('between') ? 'number' : 'text'}
                    value={String(criteria.value)}
                    onChange={(e) => onUpdate({
                      value: criteria.operator.includes('than') || criteria.operator.includes('between')
                        ? parseFloat(e.target.value) || 0
                        : e.target.value
                    })}
                    className="w-full px-2 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-accent-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Weight: {criteria.weight > 0 && '+'}{criteria.weight} points
                </label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={criteria.weight}
                  onChange={(e) => onUpdate({ weight: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-accent-500"
                />
                <div className="flex justify-between text-[10px] text-neutral-600">
                  <span>-50 (negative)</span>
                  <span>0</span>
                  <span>+50 (positive)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={criteria.description || ''}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  className="w-full px-2 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-accent-500"
                  placeholder="Explain why this criteria matters..."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Deal Score Card Component
// ============================================================================

export interface DealScoreCardProps {
  score: DealScore;
  onViewDetails?: () => void;
  compact?: boolean;
  className?: string;
}

export function DealScoreCard({
  score,
  onViewDetails,
  compact = false,
  className,
}: DealScoreCardProps) {
  const tierConfig = {
    hot: { label: 'Hot', icon: FireIcon, color: 'text-red-400', bg: 'bg-red-500/10' },
    warm: { label: 'Warm', icon: ArrowTrendingUpIcon, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    cold: { label: 'Cold', icon: MinusIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    freezing: { label: 'Freezing', icon: ArrowTrendingDownIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  };

  const config = tierConfig[score.tier];
  const TierIcon = config.icon;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bg)}>
          <span className={cn('text-sm font-bold', config.color)}>{score.score}</span>
        </div>
        <div className="flex items-center gap-1">
          <TierIcon className={cn('w-4 h-4', config.color)} />
          <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
          {score.trend !== 'stable' && (
            <span className={cn(
              'text-[10px]',
              score.trend === 'up' ? 'text-status-success-text' : 'text-status-error-text'
            )}>
              {score.trend === 'up' ? '+' : ''}{score.trendPercentage}%
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-4 rounded-xl border',
      TIER_COLORS[score.tier],
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', config.bg)}>
            <span className={cn('text-xl font-bold', config.color)}>{score.score}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <TierIcon className={cn('w-5 h-5', config.color)} />
              <span className={cn('font-semibold', config.color)}>{config.label} Lead</span>
            </div>
            <p className="text-xs text-neutral-400">
              Last calculated {new Date(score.lastCalculated).toLocaleString()}
            </p>
          </div>
        </div>

        {score.trend !== 'stable' && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg',
            score.trend === 'up' ? 'bg-status-success-bg/30' : 'bg-status-error-bg/30'
          )}>
            {score.trend === 'up' ? (
              <ArrowTrendingUpIcon className="w-4 h-4 text-status-success-text" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 text-status-error-text" />
            )}
            <span className={cn(
              'text-sm font-medium',
              score.trend === 'up' ? 'text-status-success-text' : 'text-status-error-text'
            )}>
              {score.trend === 'up' ? '+' : ''}{score.trendPercentage}%
            </span>
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2 mb-4">
        <h4 className="text-xs font-medium text-neutral-400 uppercase">Score Breakdown</h4>
        {Object.entries(CATEGORY_CONFIGS).map(([category, catConfig]) => {
          const categoryItems = score.breakdown.filter(b => b.category === category);
          const categoryPoints = categoryItems.reduce((acc, b) => acc + b.points, 0);
          const categoryMax = categoryItems.reduce((acc, b) => acc + b.maxPoints, 0);
          const CategoryIcon = catConfig.icon;

          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="flex items-center gap-2">
              <CategoryIcon className={cn('w-4 h-4', catConfig.color.split(' ')[0])} />
              <span className="flex-1 text-sm text-neutral-300">{catConfig.label}</span>
              <div className="w-20 h-2 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={cn('h-full', catConfig.color.split(' ')[1]?.replace('/10', ''))}
                  style={{ width: `${categoryMax > 0 ? (categoryPoints / categoryMax) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-neutral-400 w-12 text-right">
                {categoryPoints}/{categoryMax}
              </span>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="pt-3 border-t border-neutral-700">
          <div className="flex items-center gap-2 mb-2">
            <LightBulbIcon className="w-4 h-4 text-accent-400" />
            <h4 className="text-xs font-medium text-accent-400">Recommendations</h4>
          </div>
          <ul className="space-y-1">
            {score.recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="text-xs text-neutral-400 flex items-start gap-2">
                <span className="text-accent-400 mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="mt-4 w-full py-2 text-sm font-medium text-accent-400 hover:text-accent-300 transition-colors"
        >
          View Full Analysis
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Score Trend Chart Component
// ============================================================================

export interface ScoreTrendChartProps {
  history: ScoreHistory[];
  thresholds: ScoringModel['thresholds'];
  className?: string;
}

export function ScoreTrendChart({
  history,
  thresholds,
  className,
}: ScoreTrendChartProps) {
  const maxScore = 100;
  const chartHeight = 120;

  return (
    <div className={cn('', className)}>
      <div className="relative h-32">
        {/* Threshold lines */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-red-500/30"
          style={{ top: `${100 - thresholds.hot}%` }}
        >
          <span className="absolute -top-3 right-0 text-[10px] text-red-400">Hot ({thresholds.hot})</span>
        </div>
        <div
          className="absolute left-0 right-0 border-t border-dashed border-amber-500/30"
          style={{ top: `${100 - thresholds.warm}%` }}
        >
          <span className="absolute -top-3 right-0 text-[10px] text-amber-400">Warm ({thresholds.warm})</span>
        </div>
        <div
          className="absolute left-0 right-0 border-t border-dashed border-blue-500/30"
          style={{ top: `${100 - thresholds.cold}%` }}
        >
          <span className="absolute -top-3 right-0 text-[10px] text-blue-400">Cold ({thresholds.cold})</span>
        </div>

        {/* Score line */}
        <svg className="absolute inset-0 w-full h-full">
          <polyline
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="2"
            points={history
              .map((h, i) => {
                const x = (i / (history.length - 1)) * 100;
                const y = 100 - h.score;
                return `${x}%,${y}%`;
              })
              .join(' ')}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>

        {/* Data points */}
        {history.map((h, i) => {
          const x = (i / (history.length - 1)) * 100;
          const y = 100 - h.score;
          const tierColor = TIER_COLORS[h.tier].split(' ')[0];

          return (
            <div
              key={i}
              className={cn('absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2', tierColor.replace('text-', 'bg-'))}
              style={{ left: `${x}%`, top: `${y}%` }}
              title={`${h.date}: ${h.score}`}
            />
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        {history.filter((_, i) => i === 0 || i === history.length - 1 || i === Math.floor(history.length / 2)).map((h, i) => (
          <span key={i} className="text-[10px] text-neutral-500">
            {new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Scoring Dashboard Component
// ============================================================================

export interface ScoringDashboardProps {
  models: ScoringModel[];
  topDeals: Array<{ deal: { id: string; name: string; value: number }; score: DealScore }>;
  onCreateModel: () => void;
  onEditModel: (model: ScoringModel) => void;
  onDeleteModel: (modelId: string) => void;
  onViewDeal: (dealId: string) => void;
  className?: string;
}

export function ScoringDashboard({
  models,
  topDeals,
  onCreateModel,
  onEditModel,
  onDeleteModel,
  onViewDeal,
  className,
}: ScoringDashboardProps) {
  const stats = useMemo(() => {
    const tierCounts = { hot: 0, warm: 0, cold: 0, freezing: 0 };
    topDeals.forEach(d => tierCounts[d.score.tier]++);
    const avgScore = topDeals.length > 0
      ? Math.round(topDeals.reduce((acc, d) => acc + d.score.score, 0) / topDeals.length)
      : 0;
    return { ...tierCounts, avgScore };
  }, [topDeals]);

  return (
    <div className={cn('', className)}>
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-neutral-800/50 rounded-xl">
          <p className="text-2xl font-bold text-white">{stats.avgScore}</p>
          <p className="text-sm text-neutral-400">Avg Score</p>
        </div>
        <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
          <p className="text-2xl font-bold text-red-400">{stats.hot}</p>
          <p className="text-sm text-red-400/60">Hot Leads</p>
        </div>
        <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <p className="text-2xl font-bold text-amber-400">{stats.warm}</p>
          <p className="text-sm text-amber-400/60">Warm Leads</p>
        </div>
        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-400">{stats.cold}</p>
          <p className="text-sm text-blue-400/60">Cold Leads</p>
        </div>
        <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
          <p className="text-2xl font-bold text-cyan-400">{stats.freezing}</p>
          <p className="text-sm text-cyan-400/60">Freezing</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Scoring Models */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Scoring Models</h3>
            <button
              onClick={onCreateModel}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-600 text-white hover:bg-accent-500 text-sm font-medium transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New Model
            </button>
          </div>

          <div className="space-y-3">
            {models.map((model) => (
              <div
                key={model.id}
                className={cn(
                  'p-4 rounded-xl border transition-all cursor-pointer hover:border-accent-500',
                  model.enabled
                    ? 'border-neutral-700 bg-neutral-800/50'
                    : 'border-neutral-800 bg-neutral-900/50 opacity-60'
                )}
                onClick={() => onEditModel(model)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 text-accent-400" />
                      <h4 className="font-medium text-white">{model.name}</h4>
                      <span className={cn(
                        'px-2 py-0.5 text-[10px] font-medium uppercase rounded-full',
                        model.enabled
                          ? 'bg-status-success-bg text-status-success-text'
                          : 'bg-neutral-700 text-neutral-400'
                      )}>
                        {model.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {model.description && (
                      <p className="text-sm text-neutral-400 mt-1">{model.description}</p>
                    )}
                    <p className="text-xs text-neutral-500 mt-2">
                      {model.criteria.filter(c => c.enabled).length} criteria
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteModel(model.id);
                    }}
                    className="p-2 rounded-lg text-neutral-400 hover:text-status-error-text hover:bg-status-error-bg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {models.length === 0 && (
              <div className="text-center py-8">
                <ChartBarIcon className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">No scoring models configured</p>
                <button
                  onClick={onCreateModel}
                  className="mt-2 text-sm text-accent-400 hover:text-accent-300"
                >
                  Create your first model
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Top Scored Deals */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Top Scored Deals</h3>
          <div className="space-y-2">
            {topDeals.slice(0, 10).map(({ deal, score }) => {
              const tierConfig = {
                hot: { icon: FireIcon, color: 'text-red-400', bg: 'bg-red-500/10' },
                warm: { icon: ArrowTrendingUpIcon, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                cold: { icon: MinusIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                freezing: { icon: ArrowTrendingDownIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              };
              const config = tierConfig[score.tier];
              const TierIcon = config.icon;

              return (
                <button
                  key={deal.id}
                  onClick={() => onViewDeal(deal.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors text-left"
                >
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
                    <span className={cn('text-sm font-bold', config.color)}>{score.score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{deal.name}</p>
                    <p className="text-xs text-neutral-400">
                      ${deal.value.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <TierIcon className={cn('w-4 h-4', config.color)} />
                    {score.trend !== 'stable' && (
                      <span className={cn(
                        'text-xs',
                        score.trend === 'up' ? 'text-status-success-text' : 'text-status-error-text'
                      )}>
                        {score.trend === 'up' ? '+' : ''}{score.trendPercentage}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {topDeals.length === 0 && (
              <div className="text-center py-8">
                <SparklesIcon className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">No deals scored yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
