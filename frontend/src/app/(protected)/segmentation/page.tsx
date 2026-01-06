'use client';

import { useEffect, useState } from 'react';
import { 
  PageHeader, 
  PageContent,
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  CardHeader,
  MetricCard,
  MetricGrid,
  Modal,
  Input,
  Select,
} from '@/components/ui';
import { 
  PlusIcon,
  PencilSquareIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  TagIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/components/ui/utils';

interface ClientTier {
  id: string;
  name: string;
  color: string;
  criteria: {
    minAum?: number;
    maxAum?: number;
    minRevenue?: number;
    minRelationshipYears?: number;
    tags?: string[];
  };
  benefits: string[];
  serviceLevel: {
    reviewFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
    dedicatedAdvisor: boolean;
    prioritySupport: boolean;
    customReporting: boolean;
    eventInvitations: boolean;
  };
  householdCount: number;
  totalAum: number;
  avgAum: number;
}

interface ClientSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    field: string;
    operator: string;
    value: string | number | boolean;
  }[];
  isSystem: boolean;
  householdCount: number;
  createdAt: string;
}

const mockTiers: ClientTier[] = [
  {
    id: 'tier-platinum',
    name: 'Platinum',
    color: 'from-slate-400 to-slate-600',
    criteria: { minAum: 5000000 },
    benefits: [
      'Monthly portfolio reviews',
      'Dedicated relationship manager',
      '24/7 priority support',
      'Custom performance reporting',
      'Exclusive event invitations',
      'Family office services',
    ],
    serviceLevel: {
      reviewFrequency: 'monthly',
      dedicatedAdvisor: true,
      prioritySupport: true,
      customReporting: true,
      eventInvitations: true,
    },
    householdCount: 12,
    totalAum: 85000000,
    avgAum: 7083333,
  },
  {
    id: 'tier-gold',
    name: 'Gold',
    color: 'from-amber-400 to-amber-600',
    criteria: { minAum: 1000000, maxAum: 5000000 },
    benefits: [
      'Quarterly portfolio reviews',
      'Dedicated advisor team',
      'Priority support',
      'Enhanced reporting',
      'Select event invitations',
    ],
    serviceLevel: {
      reviewFrequency: 'quarterly',
      dedicatedAdvisor: true,
      prioritySupport: true,
      customReporting: false,
      eventInvitations: true,
    },
    householdCount: 28,
    totalAum: 42000000,
    avgAum: 1500000,
  },
  {
    id: 'tier-silver',
    name: 'Silver',
    color: 'from-gray-300 to-gray-500',
    criteria: { minAum: 250000, maxAum: 1000000 },
    benefits: [
      'Semi-annual portfolio reviews',
      'Advisor access',
      'Standard support',
      'Standard reporting',
    ],
    serviceLevel: {
      reviewFrequency: 'semi-annual',
      dedicatedAdvisor: false,
      prioritySupport: false,
      customReporting: false,
      eventInvitations: false,
    },
    householdCount: 45,
    totalAum: 18000000,
    avgAum: 400000,
  },
  {
    id: 'tier-bronze',
    name: 'Bronze',
    color: 'from-orange-400 to-orange-600',
    criteria: { minAum: 0, maxAum: 250000 },
    benefits: [
      'Annual portfolio reviews',
      'Digital advisory services',
      'Email support',
    ],
    serviceLevel: {
      reviewFrequency: 'annual',
      dedicatedAdvisor: false,
      prioritySupport: false,
      customReporting: false,
      eventInvitations: false,
    },
    householdCount: 67,
    totalAum: 5000000,
    avgAum: 74627,
  },
];

const mockSegments: ClientSegment[] = [
  {
    id: 'seg-001',
    name: 'High Net Worth',
    description: 'Households with AUM over $1M',
    criteria: [{ field: 'aum', operator: 'greater_than', value: 1000000 }],
    isSystem: true,
    householdCount: 40,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seg-002',
    name: 'Near Retirement',
    description: 'Primary members aged 55-65',
    criteria: [
      { field: 'primary_age', operator: 'greater_than', value: 55 },
      { field: 'primary_age', operator: 'less_than', value: 65 },
    ],
    isSystem: true,
    householdCount: 32,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seg-003',
    name: 'New Clients',
    description: 'Onboarded in the last 12 months',
    criteria: [{ field: 'relationship_start', operator: 'within_months', value: 12 }],
    isSystem: true,
    householdCount: 18,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seg-004',
    name: 'At-Risk Clients',
    description: 'No contact in 90+ days with declining AUM',
    criteria: [
      { field: 'last_contact', operator: 'older_than_days', value: 90 },
      { field: 'aum_change_90d', operator: 'less_than', value: 0 },
    ],
    isSystem: false,
    householdCount: 5,
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'seg-005',
    name: 'Quarterly Review Due',
    description: 'Clients due for quarterly review this month',
    criteria: [{ field: 'next_review', operator: 'within_days', value: 30 }],
    isSystem: false,
    householdCount: 24,
    createdAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'seg-006',
    name: 'Business Owners',
    description: 'Clients with business ownership tag',
    criteria: [{ field: 'tags', operator: 'contains', value: 'business_owner' }],
    isSystem: false,
    householdCount: 15,
    createdAt: '2024-01-08T00:00:00Z',
  },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export default function SegmentationPage() {
  const [tiers, setTiers] = useState<ClientTier[]>(mockTiers);
  const [segments, setSegments] = useState<ClientSegment[]>(mockSegments);
  const [activeTab, setActiveTab] = useState<'tiers' | 'segments'>('tiers');
  const [selectedTier, setSelectedTier] = useState<ClientTier | null>(null);
  const [showTierModal, setShowTierModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);

  const totalHouseholds = tiers.reduce((s, t) => s + t.householdCount, 0);
  const totalAum = tiers.reduce((s, t) => s + t.totalAum, 0);

  return (
    <>
      <PageHeader
        title="Client Segmentation"
        subtitle="Manage client tiers, segments, and service levels"
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'tiers' && (
              <Button 
                variant="primary" 
                leftIcon={<PlusIcon className="w-4 h-4" />}
                onClick={() => setShowTierModal(true)}
              >
                Add Tier
              </Button>
            )}
            {activeTab === 'segments' && (
              <Button 
                variant="primary" 
                leftIcon={<PlusIcon className="w-4 h-4" />}
                onClick={() => setShowSegmentModal(true)}
              >
                Create Segment
              </Button>
            )}
          </div>
        }
      />

      <PageContent>
        {/* Summary */}
        <MetricGrid columns={4} className="mb-6">
          <MetricCard
            label="Total Households"
            value={totalHouseholds.toString()}
            icon="households"
          />
          <MetricCard
            label="Total AUM"
            value={formatCurrency(totalAum)}
            icon="currency"
          />
          <MetricCard
            label="Client Tiers"
            value={tiers.length.toString()}
            icon="growth"
          />
          <MetricCard
            label="Segments"
            value={segments.length.toString()}
            icon="pipeline"
          />
        </MetricGrid>

        {/* Tabs */}
        <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1 mb-6 w-fit">
          {[
            { id: 'tiers', label: 'Client Tiers' },
            { id: 'segments', label: 'Smart Segments' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-surface-primary text-content-primary shadow-sm' 
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'tiers' && (
          <>
            {/* Tier Distribution */}
            <Card className="mb-6">
              <CardHeader title="Tier Distribution" subtitle="Household distribution across tiers" />
              <div className="p-6">
                <div className="flex h-8 rounded-lg overflow-hidden mb-4">
                  {tiers.map(tier => (
                    <div
                      key={tier.id}
                      className={cn('bg-gradient-to-r', tier.color)}
                      style={{ width: `${(tier.householdCount / totalHouseholds) * 100}%` }}
                      title={`${tier.name}: ${tier.householdCount} households`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6">
                  {tiers.map(tier => (
                    <div key={tier.id} className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-full bg-gradient-to-r', tier.color)} />
                      <span className="text-sm text-content-secondary">
                        {tier.name} ({tier.householdCount})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {tiers.map(tier => (
                <Card key={tier.id} className="overflow-hidden">
                  {/* Header */}
                  <div className={cn('p-4 bg-gradient-to-r text-white', tier.color)}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{tier.name}</h3>
                      <button
                        onClick={() => {
                          setSelectedTier(tier);
                          setShowTierModal(true);
                        }}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-white/80 mt-1">
                      {tier.criteria.minAum && tier.criteria.maxAum 
                        ? `${formatCurrency(tier.criteria.minAum)} - ${formatCurrency(tier.criteria.maxAum)}`
                        : tier.criteria.minAum 
                          ? `${formatCurrency(tier.criteria.minAum)}+`
                          : `Up to ${formatCurrency(tier.criteria.maxAum || 0)}`
                      }
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-content-tertiary">Households</p>
                        <p className="text-lg font-semibold text-content-primary">{tier.householdCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-content-tertiary">Total AUM</p>
                        <p className="text-lg font-semibold text-content-primary">{formatCurrency(tier.totalAum)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-content-tertiary">Avg AUM</p>
                      <p className="text-sm font-medium text-content-primary">{formatCurrency(tier.avgAum)}</p>
                    </div>

                    {/* Service Level */}
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-content-tertiary uppercase tracking-wider mb-2">Service Level</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircleIcon className="w-4 h-4 text-status-success-text" />
                          <span className="text-content-secondary">
                            {tier.serviceLevel.reviewFrequency === 'monthly' ? 'Monthly' :
                             tier.serviceLevel.reviewFrequency === 'quarterly' ? 'Quarterly' :
                             tier.serviceLevel.reviewFrequency === 'semi-annual' ? 'Semi-annual' : 'Annual'} reviews
                          </span>
                        </div>
                        {tier.serviceLevel.dedicatedAdvisor && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircleIcon className="w-4 h-4 text-status-success-text" />
                            <span className="text-content-secondary">Dedicated advisor</span>
                          </div>
                        )}
                        {tier.serviceLevel.prioritySupport && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircleIcon className="w-4 h-4 text-status-success-text" />
                            <span className="text-content-secondary">Priority support</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 bg-surface-secondary border-t border-border">
                    <Button size="sm" variant="secondary" className="w-full">
                      View Households
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {activeTab === 'segments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {segments.map(segment => (
              <Card key={segment.id} className="overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        segment.isSystem ? 'bg-accent-100' : 'bg-status-info-bg'
                      )}>
                        {segment.isSystem ? (
                          <SparklesIcon className="w-5 h-5 text-accent-600" />
                        ) : (
                          <FunnelIcon className="w-5 h-5 text-status-info-text" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-content-primary">{segment.name}</h3>
                        {segment.isSystem && (
                          <span className="text-xs text-content-tertiary">System segment</span>
                        )}
                      </div>
                    </div>
                    {!segment.isSystem && (
                      <button className="p-1 hover:bg-surface-secondary rounded transition-colors">
                        <PencilSquareIcon className="w-4 h-4 text-content-tertiary" />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-content-secondary mb-4">{segment.description}</p>

                  {/* Criteria Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {segment.criteria.map((c, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-surface-secondary text-xs text-content-secondary rounded"
                      >
                        {c.field} {c.operator.replace('_', ' ')} {c.value}
                      </span>
                    ))}
                  </div>

                  {/* Count */}
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4 text-content-tertiary" />
                    <span className="text-sm text-content-primary font-medium">
                      {segment.householdCount} households
                    </span>
                  </div>
                </div>

                <div className="px-5 py-3 bg-surface-secondary border-t border-border flex items-center justify-between">
                  <Button size="sm" variant="secondary">
                    View Households
                  </Button>
                  <Button size="sm" variant="ghost">
                    Export
                  </Button>
                </div>
              </Card>
            ))}

            {/* Create Segment Card */}
            <button
              onClick={() => setShowSegmentModal(true)}
              className={cn(
                'flex flex-col items-center justify-center p-8',
                'border-2 border-dashed border-border rounded-lg',
                'text-content-tertiary hover:text-content-secondary hover:border-border-focus',
                'transition-colors min-h-[200px]'
              )}
            >
              <PlusIcon className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Create Segment</span>
            </button>
          </div>
        )}
      </PageContent>

      {/* Tier Modal */}
      <Modal
        isOpen={showTierModal}
        onClose={() => {
          setShowTierModal(false);
          setSelectedTier(null);
        }}
        title={selectedTier ? `Edit ${selectedTier.name} Tier` : 'Create Client Tier'}
        size="lg"
      >
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                Tier Name
              </label>
              <Input 
                defaultValue={selectedTier?.name}
                placeholder="e.g., Platinum"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                Color Theme
              </label>
              <Select
                options={[
                  { value: 'slate', label: 'Platinum (Slate)' },
                  { value: 'amber', label: 'Gold (Amber)' },
                  { value: 'gray', label: 'Silver (Gray)' },
                  { value: 'orange', label: 'Bronze (Orange)' },
                ]}
              />
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-content-primary mb-3">AUM Criteria</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-content-tertiary mb-1">Minimum AUM</label>
                <Input 
                  type="number"
                  defaultValue={selectedTier?.criteria.minAum}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-content-tertiary mb-1">Maximum AUM</label>
                <Input 
                  type="number"
                  defaultValue={selectedTier?.criteria.maxAum}
                  placeholder="No limit"
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-content-primary mb-3">Service Level</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-content-secondary">Review Frequency</span>
                <Select
                  value={selectedTier?.serviceLevel.reviewFrequency || 'quarterly'}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'semi-annual', label: 'Semi-Annual' },
                    { value: 'annual', label: 'Annual' },
                  ]}
                />
              </div>
              {['Dedicated Advisor', 'Priority Support', 'Custom Reporting', 'Event Invitations'].map(benefit => (
                <label key={benefit} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-content-secondary">{benefit}</span>
                  <input type="checkbox" className="rounded border-border text-accent-600 focus:ring-accent-500" />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button variant="ghost" onClick={() => setShowTierModal(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              {selectedTier ? 'Save Changes' : 'Create Tier'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Segment Modal */}
      <Modal
        isOpen={showSegmentModal}
        onClose={() => setShowSegmentModal(false)}
        title="Create Smart Segment"
        size="lg"
      >
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-content-primary mb-1">
              Segment Name
            </label>
            <Input placeholder="e.g., High Growth Potential" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-content-primary mb-1">
              Description
            </label>
            <textarea 
              className={cn(
                'w-full px-3 py-2 rounded-lg border border-border',
                'bg-surface-primary text-content-primary text-sm',
                'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent',
                'resize-none'
              )}
              rows={2}
              placeholder="Describe what this segment represents..."
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-content-primary">Filter Criteria</h4>
              <Button size="sm" variant="ghost" leftIcon={<PlusIcon className="w-4 h-4" />}>
                Add Condition
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
                <Select
                  options={[
                    { value: 'aum', label: 'AUM' },
                    { value: 'primary_age', label: 'Primary Age' },
                    { value: 'relationship_years', label: 'Relationship Years' },
                    { value: 'last_contact', label: 'Last Contact' },
                    { value: 'tier', label: 'Client Tier' },
                    { value: 'tags', label: 'Tags' },
                  ]}
                />
                <Select
                  options={[
                    { value: 'greater_than', label: 'is greater than' },
                    { value: 'less_than', label: 'is less than' },
                    { value: 'equals', label: 'equals' },
                    { value: 'contains', label: 'contains' },
                  ]}
                />
                <Input placeholder="Value" className="flex-1" />
                <button className="p-1 text-content-tertiary hover:text-status-error-text">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button variant="ghost" onClick={() => setShowSegmentModal(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Create Segment
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// Missing import for TrashIcon
import { TrashIcon } from '@heroicons/react/24/outline';
