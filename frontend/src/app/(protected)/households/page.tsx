'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PageHeader, 
  PageContent 
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  StatusBadge,
  Avatar,
  ConfirmModal,
  formatCurrency,
  formatDate,
  SkeletonHouseholds,
  ErrorState,
  DataFreshness,
  EmptyState,
} from '@/components/ui';
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/20/solid';
import {
  ChartPieIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { householdsService, Household } from '@/services/households.service';
import { AddHouseholdModal } from '@/components/modals';
import { AssetAllocationManager, FeeScheduleManager } from '@/components/features';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const statusMap: Record<string, { label: string; variant: StatusVariant }> = {
  active: { label: 'Active', variant: 'success' },
  prospect: { label: 'Prospect', variant: 'info' },
  inactive: { label: 'Inactive', variant: 'default' },
  closed: { label: 'Closed', variant: 'error' },
};

type ExpandedTab = 'allocation' | 'fees' | 'members' | 'documents' | 'activity' | 'settings';

export default function HouseholdsPage() {
  const router = useRouter();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteHouseholdId, setDeleteHouseholdId] = useState<string | null>(null);
  const [expandedHousehold, setExpandedHousehold] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ExpandedTab>('allocation');

  const fetchHouseholds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await householdsService.getHouseholds();
      // Ensure data is always an array
      setHouseholds(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch households:', err);
      setError(err instanceof Error ? err.message : 'Failed to load households');
      setHouseholds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHouseholds();
  }, []);

  const handleDeleteHousehold = async () => {
    if (!deleteHouseholdId) return;
    try {
      await householdsService.deleteHousehold(deleteHouseholdId);
      setDeleteHouseholdId(null);
      setExpandedHousehold(null);
      fetchHouseholds();
    } catch (error) {
      console.error('Failed to delete household:', error);
    }
  };

  const filteredData = useMemo(() => {
    // Ensure households is always an array
    const safeHouseholds = Array.isArray(households) ? households : [];
    if (!searchValue) return safeHouseholds;
    const query = searchValue.toLowerCase();
    return safeHouseholds.filter(
      (h) =>
        h.name.toLowerCase().includes(query) ||
        h.status.toLowerCase().includes(query)
    );
  }, [households, searchValue]);

  const toggleExpand = (householdId: string) => {
    if (expandedHousehold === householdId) {
      setExpandedHousehold(null);
    } else {
      setExpandedHousehold(householdId);
      setActiveTab('allocation');
    }
  };

  const tabs: { id: ExpandedTab; label: string; icon: React.ReactNode }[] = [
    { id: 'allocation', label: 'Asset Allocation', icon: <ChartPieIcon className="w-4 h-4" /> },
    { id: 'fees', label: 'Fee Schedule', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
    { id: 'members', label: 'Members', icon: <UserGroupIcon className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <DocumentTextIcon className="w-4 h-4" /> },
    { id: 'activity', label: 'Activity', icon: <CalendarDaysIcon className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Cog6ToothIcon className="w-4 h-4" /> },
  ];

  return (
    <>
      <PageHeader
        title="Households"
        subtitle={
          <div className="flex items-center gap-3">
            <span>{filteredData.length} household{filteredData.length !== 1 ? 's' : ''} total</span>
            <DataFreshness 
              lastUpdated={lastUpdated} 
              onRefresh={fetchHouseholds}
              isRefreshing={loading}
            />
          </div>
        }
        actions={
          <Button 
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Household
          </Button>
        }
      />

      <PageContent>
        <Card noPadding>
          {/* Search Bar */}
          <div className="p-4 border-b border-stone-800">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search households..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Households List */}
          {error ? (
            <ErrorState
              title="Couldn't load households"
              message={error}
              onRetry={fetchHouseholds}
            />
          ) : loading ? (
            <SkeletonHouseholds rows={5} />
          ) : filteredData.length === 0 ? (
            <EmptyState
              icon={<UserGroupIcon className="w-6 h-6" />}
              title={searchValue ? 'No households match your search' : 'No households yet'}
              description={searchValue ? 'Try adjusting your search terms.' : 'Create your first household to get started.'}
              action={!searchValue && (
                <Button 
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                  onClick={() => setShowAddModal(true)}
                >
                  Add Household
                </Button>
              )}
            />
          ) : (
            <div className="divide-y divide-stone-800">
              {filteredData.map((household) => {
                const status = statusMap[household.status] || { label: household.status, variant: 'default' as StatusVariant };
                const isExpanded = expandedHousehold === household.id;

                return (
                  <div key={household.id} className="bg-stone-900/30">
                    {/* Main Row */}
                    <div 
                      className={`flex items-center gap-4 p-4 hover:bg-stone-800/50 transition-colors cursor-pointer ${isExpanded ? 'bg-stone-800/30' : ''}`}
                      onClick={() => toggleExpand(household.id)}
                    >
                      {/* Expand/Collapse Icon */}
                      <button
                        className="p-1 text-stone-500 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(household.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className="w-5 h-5" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5" />
                        )}
                      </button>

                      {/* Avatar & Name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar name={household.name} size="md" />
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{household.name}</p>
                          <p className="text-sm text-stone-400 truncate">
                            {household.riskTolerance ? `${household.riskTolerance} risk` : 'Risk not set'}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="hidden sm:block">
                        <StatusBadge status={status.variant} label={status.label} />
                      </div>

                      {/* AUM */}
                      <div className="hidden md:block text-right">
                        <p className="text-sm text-stone-400">Total AUM</p>
                        <p className="font-semibold text-white">{formatCurrency(household.totalAum)}</p>
                      </div>

                      {/* Last Review */}
                      <div className="hidden lg:block text-right">
                        <p className="text-sm text-stone-400">Last Review</p>
                        <p className="text-white">
                          {household.lastReviewDate ? formatDate(household.lastReviewDate) : 'Never'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteHouseholdId(household.id);
                          }}
                        >
                          <TrashIcon className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-stone-800 bg-stone-900/50">
                            {/* Tabs */}
                            <div className="flex items-center gap-1 p-2 border-b border-stone-800 overflow-x-auto">
                              {tabs.map((tab) => (
                                <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id)}
                                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                                    activeTab === tab.id
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
                                  }`}
                                >
                                  {tab.icon}
                                  {tab.label}
                                </button>
                              ))}
                            </div>

                            {/* Tab Content */}
                            <div className="p-4">
                              {activeTab === 'allocation' && (
                                <AssetAllocationManager
                                  entityType="household"
                                  entityId={household.id}
                                  entityName={household.name}
                                />
                              )}

                              {activeTab === 'fees' && (
                                <FeeScheduleManager
                                  entityType="household"
                                  entityId={household.id}
                                  entityName={household.name}
                                  currentAUM={household.totalAum}
                                />
                              )}

                              {activeTab === 'members' && (
                                <div className="bg-stone-800/30 rounded-lg p-6 text-center">
                                  <UserGroupIcon className="w-10 h-10 text-stone-500 mx-auto mb-3" />
                                  <p className="text-stone-400 text-sm">Household members will appear here</p>
                                  <p className="text-stone-500 text-xs mt-1">Link clients and contacts to this household</p>
                                </div>
                              )}

                              {activeTab === 'documents' && (
                                <div className="bg-stone-800/30 rounded-lg p-6 text-center">
                                  <DocumentTextIcon className="w-10 h-10 text-stone-500 mx-auto mb-3" />
                                  <p className="text-stone-400 text-sm">Documents will appear here</p>
                                  <p className="text-stone-500 text-xs mt-1">Upload and manage household documents</p>
                                </div>
                              )}

                              {activeTab === 'activity' && (
                                <div className="bg-stone-800/30 rounded-lg p-6 text-center">
                                  <CalendarDaysIcon className="w-10 h-10 text-stone-500 mx-auto mb-3" />
                                  <p className="text-stone-400 text-sm">Activity history will appear here</p>
                                  <p className="text-stone-500 text-xs mt-1">View meetings, communications, and tasks</p>
                                </div>
                              )}

                              {activeTab === 'settings' && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-stone-800/30 rounded-lg p-4">
                                      <h4 className="text-sm font-medium text-white mb-3">Household Details</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Status</span>
                                          <StatusBadge status={status.variant} label={status.label} />
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Risk Tolerance</span>
                                          <span className="text-white capitalize">{household.riskTolerance || 'Not Set'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Investment Objective</span>
                                          <span className="text-white">{household.investmentObjective || 'Not Set'}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="bg-stone-800/30 rounded-lg p-4">
                                      <h4 className="text-sm font-medium text-white mb-3">Key Dates</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Onboarding</span>
                                          <span className="text-white">{household.onboardingDate ? formatDate(household.onboardingDate) : 'Not Set'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Last Review</span>
                                          <span className="text-white">{household.lastReviewDate ? formatDate(household.lastReviewDate) : 'Never'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Next Review</span>
                                          <span className="text-white">{household.nextReviewDate ? formatDate(household.nextReviewDate) : 'Not Scheduled'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </PageContent>

      {/* Add Household Modal */}
      <AddHouseholdModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchHouseholds}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteHouseholdId}
        onClose={() => setDeleteHouseholdId(null)}
        onConfirm={handleDeleteHousehold}
        title="Delete Household"
        message="Are you sure you want to delete this household? This action cannot be undone and will remove all associated data."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
