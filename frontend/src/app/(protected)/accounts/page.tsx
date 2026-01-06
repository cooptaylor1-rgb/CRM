'use client';

import { useEffect, useState, useMemo } from 'react';
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
  ConfirmModal,
  formatCurrency,
  formatDate,
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
  BanknotesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { accountsService, Account } from '@/services/accounts.service';
import { householdsService, Household } from '@/services/households.service';
import { AssetAllocationManager, FeeScheduleManager } from '@/components/features';
import { Modal } from '@/components/ui';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const statusMap: Record<string, { label: string; variant: StatusVariant }> = {
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'info' },
  inactive: { label: 'Inactive', variant: 'default' },
  closed: { label: 'Closed', variant: 'error' },
};

const accountTypeLabels: Record<string, string> = {
  individual: 'Individual',
  joint: 'Joint',
  ira: 'IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  trust: 'Trust',
  corporate: 'Corporate',
  partnership: 'Partnership',
  estate: 'Estate',
  custodial: 'Custodial',
};

type ExpandedTab = 'allocation' | 'fees' | 'positions' | 'transactions' | 'documents' | 'settings';

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ExpandedTab>('allocation');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountName: '',
    accountNumber: '',
    accountType: 'individual',
    householdId: '',
    custodian: '',
    status: 'active',
    currentValue: 0,
    managementStyle: 'discretionary',
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const [accountsData, householdsData] = await Promise.all([
        accountsService.getAccounts(),
        householdsService.getHouseholds(),
      ]);
      setAccounts(accountsData);
      setHouseholds(householdsData);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async () => {
    if (!newAccount.accountName || !newAccount.householdId) return;
    try {
      setCreating(true);
      await accountsService.createAccount(newAccount);
      setShowCreateModal(false);
      setNewAccount({
        accountName: '',
        accountNumber: '',
        accountType: 'individual',
        householdId: '',
        custodian: '',
        status: 'active',
        currentValue: 0,
        managementStyle: 'discretionary',
      });
      fetchAccounts();
    } catch (error) {
      console.error('Failed to create account:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountId) return;
    try {
      await accountsService.deleteAccount(deleteAccountId);
      setDeleteAccountId(null);
      setExpandedAccount(null);
      fetchAccounts();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchValue) return accounts;
    const query = searchValue.toLowerCase();
    return accounts.filter(
      (a) =>
        a.accountName.toLowerCase().includes(query) ||
        a.accountNumber.toLowerCase().includes(query) ||
        a.accountType.toLowerCase().includes(query) ||
        a.status.toLowerCase().includes(query)
    );
  }, [accounts, searchValue]);

  const toggleExpand = (accountId: string) => {
    if (expandedAccount === accountId) {
      setExpandedAccount(null);
    } else {
      setExpandedAccount(accountId);
      setActiveTab('allocation');
    }
  };

  const tabs: { id: ExpandedTab; label: string; icon: React.ReactNode }[] = [
    { id: 'allocation', label: 'Asset Allocation', icon: <ChartPieIcon className="w-4 h-4" /> },
    { id: 'fees', label: 'Fee Schedule', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
    { id: 'positions', label: 'Positions', icon: <BanknotesIcon className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transactions', icon: <ArrowPathIcon className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <DocumentTextIcon className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Cog6ToothIcon className="w-4 h-4" /> },
  ];

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle={`${filteredData.length} account${filteredData.length !== 1 ? 's' : ''} total`}
        actions={
          <Button 
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Account
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
                placeholder="Search accounts..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Accounts List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <BanknotesIcon className="w-12 h-12 text-stone-500 mx-auto mb-4" />
              <p className="text-stone-400 mb-4">
                {searchValue ? 'No accounts match your search.' : 'No accounts found. Click "Add Account" to create one.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-800">
              {filteredData.map((account) => {
                const status = statusMap[account.status] || { label: account.status, variant: 'default' as StatusVariant };
                const isExpanded = expandedAccount === account.id;

                return (
                  <div key={account.id} className="bg-stone-900/30">
                    {/* Main Row */}
                    <div 
                      className={`flex items-center gap-4 p-4 hover:bg-stone-800/50 transition-colors cursor-pointer ${isExpanded ? 'bg-stone-800/30' : ''}`}
                      onClick={() => toggleExpand(account.id)}
                    >
                      {/* Expand/Collapse Icon */}
                      <button
                        className="p-1 text-stone-500 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(account.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className="w-5 h-5" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5" />
                        )}
                      </button>

                      {/* Icon & Name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <BuildingLibraryIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{account.accountName}</p>
                          <p className="text-sm text-stone-400 truncate">
                            {account.accountNumber} • {accountTypeLabels[account.accountType] || account.accountType}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="hidden sm:block">
                        <StatusBadge status={status.variant} label={status.label} />
                      </div>

                      {/* Value */}
                      <div className="hidden md:block text-right">
                        <p className="text-sm text-stone-400">Value</p>
                        <p className="font-semibold text-white">{formatCurrency(account.currentValue)}</p>
                      </div>

                      {/* Custodian */}
                      <div className="hidden lg:block text-right">
                        <p className="text-sm text-stone-400">Custodian</p>
                        <p className="text-white">{account.custodian || 'Not Set'}</p>
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
                            setDeleteAccountId(account.id);
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
                                  entityType="account"
                                  entityId={account.id}
                                  entityName={account.accountName}
                                />
                              )}

                              {activeTab === 'fees' && (
                                <FeeScheduleManager
                                  entityType="account"
                                  entityId={account.id}
                                  entityName={account.accountName}
                                  currentAUM={account.currentValue}
                                />
                              )}

                              {activeTab === 'positions' && (
                                <div className="bg-stone-800/30 rounded-lg p-6 text-center">
                                  <BanknotesIcon className="w-10 h-10 text-stone-500 mx-auto mb-3" />
                                  <p className="text-stone-400 text-sm">Account positions will appear here</p>
                                  <p className="text-stone-500 text-xs mt-1">View holdings, lots, and performance</p>
                                </div>
                              )}

                              {activeTab === 'transactions' && (
                                <div className="bg-stone-800/30 rounded-lg p-6 text-center">
                                  <ArrowPathIcon className="w-10 h-10 text-stone-500 mx-auto mb-3" />
                                  <p className="text-stone-400 text-sm">Transaction history will appear here</p>
                                  <p className="text-stone-500 text-xs mt-1">View buys, sells, dividends, and transfers</p>
                                </div>
                              )}

                              {activeTab === 'documents' && (
                                <div className="bg-stone-800/30 rounded-lg p-6 text-center">
                                  <DocumentTextIcon className="w-10 h-10 text-stone-500 mx-auto mb-3" />
                                  <p className="text-stone-400 text-sm">Account documents will appear here</p>
                                  <p className="text-stone-500 text-xs mt-1">View statements, tax forms, and agreements</p>
                                </div>
                              )}

                              {activeTab === 'settings' && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-stone-800/30 rounded-lg p-4">
                                      <h4 className="text-sm font-medium text-white mb-3">Account Details</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Status</span>
                                          <StatusBadge status={status.variant} label={status.label} />
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Account Type</span>
                                          <span className="text-white">{accountTypeLabels[account.accountType] || account.accountType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Custodian</span>
                                          <span className="text-white">{account.custodian || 'Not Set'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Management Style</span>
                                          <span className="text-white capitalize">{account.managementStyle || 'Not Set'}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="bg-stone-800/30 rounded-lg p-4">
                                      <h4 className="text-sm font-medium text-white mb-3">Key Dates</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Opened</span>
                                          <span className="text-white">{account.openedDate ? formatDate(account.openedDate) : 'Not Set'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Created</span>
                                          <span className="text-white">{formatDate(account.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">Last Updated</span>
                                          <span className="text-white">{formatDate(account.updatedAt)}</span>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteAccountId}
        onClose={() => setDeleteAccountId(null)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete this account? This action cannot be undone and will remove all associated data."
        confirmText="Delete"
        variant="danger"
      />

      {/* Create Account Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Account"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Account Name *</label>
            <input
              type="text"
              value={newAccount.accountName}
              onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
              placeholder="e.g., Smith Family Trust"
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Account Number</label>
            <input
              type="text"
              value={newAccount.accountNumber}
              onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
              placeholder="e.g., 1234-5678"
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Household *</label>
            <select
              value={newAccount.householdId}
              onChange={(e) => setNewAccount({ ...newAccount, householdId: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Select a household...</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Account Type</label>
              <select
                value={newAccount.accountType}
                onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value })}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {Object.entries(accountTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Status</label>
              <select
                value={newAccount.status}
                onChange={(e) => setNewAccount({ ...newAccount, status: e.target.value })}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Custodian</label>
              <input
                type="text"
                value={newAccount.custodian}
                onChange={(e) => setNewAccount({ ...newAccount, custodian: e.target.value })}
                placeholder="e.g., Schwab"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Current Value</label>
              <input
                type="number"
                value={newAccount.currentValue}
                onChange={(e) => setNewAccount({ ...newAccount, currentValue: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Management Style</label>
            <select
              value={newAccount.managementStyle}
              onChange={(e) => setNewAccount({ ...newAccount, managementStyle: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="discretionary">Discretionary</option>
              <option value="non-discretionary">Non-Discretionary</option>
              <option value="advisory">Advisory</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-700">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAccount}
              disabled={creating || !newAccount.accountName || !newAccount.householdId}
            >
              {creating ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
