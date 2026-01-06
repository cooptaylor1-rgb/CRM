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
  StatusBadge,
  Modal,
  Input,
  Select,
} from '@/components/ui';
import { 
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CloudArrowDownIcon,
  LinkIcon,
  TrashIcon,
  ClockIcon,
  BuildingLibraryIcon,
  CurrencyDollarIcon,
  DocumentIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/components/ui/utils';
import { formatDistanceToNow, format } from 'date-fns';

// Types based on existing custodian service
interface CustodianConnection {
  id: string;
  custodianType: 'schwab' | 'fidelity' | 'pershing' | 'td_ameritrade';
  connectionName: string;
  status: 'active' | 'inactive' | 'pending' | 'error';
  lastSyncAt?: string;
  lastSyncStatus?: string;
  accountsLinked: number;
  totalAum: number;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  errors?: string[];
}

interface SyncJob {
  id: string;
  connectionId: string;
  connectionName: string;
  custodianType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  accountsSynced: number;
  positionsSynced: number;
  transactionsSynced: number;
  errors: string[];
}

interface DiscoveredAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  balance: number;
  isLinked: boolean;
  linkedAccountId?: string;
  linkedAccountName?: string;
}

// Mock data
const mockConnections: CustodianConnection[] = [
  {
    id: 'conn-001',
    custodianType: 'schwab',
    connectionName: 'Schwab Advisor Services',
    status: 'active',
    lastSyncAt: '2024-01-15T10:30:00Z',
    lastSyncStatus: 'success',
    accountsLinked: 45,
    totalAum: 125000000,
    syncFrequency: 'hourly',
  },
  {
    id: 'conn-002',
    custodianType: 'fidelity',
    connectionName: 'Fidelity Institutional',
    status: 'active',
    lastSyncAt: '2024-01-15T09:00:00Z',
    lastSyncStatus: 'success',
    accountsLinked: 28,
    totalAum: 78000000,
    syncFrequency: 'daily',
  },
  {
    id: 'conn-003',
    custodianType: 'pershing',
    connectionName: 'Pershing Advisor Solutions',
    status: 'error',
    lastSyncAt: '2024-01-14T15:00:00Z',
    lastSyncStatus: 'error',
    accountsLinked: 12,
    totalAum: 32000000,
    syncFrequency: 'daily',
    errors: ['Authentication token expired. Please re-authenticate.'],
  },
];

const mockSyncJobs: SyncJob[] = [
  {
    id: 'job-001',
    connectionId: 'conn-001',
    connectionName: 'Schwab Advisor Services',
    custodianType: 'schwab',
    status: 'completed',
    startedAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:32:45Z',
    accountsSynced: 45,
    positionsSynced: 523,
    transactionsSynced: 89,
    errors: [],
  },
  {
    id: 'job-002',
    connectionId: 'conn-002',
    connectionName: 'Fidelity Institutional',
    custodianType: 'fidelity',
    status: 'running',
    startedAt: '2024-01-15T11:00:00Z',
    accountsSynced: 15,
    positionsSynced: 178,
    transactionsSynced: 34,
    errors: [],
  },
  {
    id: 'job-003',
    connectionId: 'conn-003',
    connectionName: 'Pershing Advisor Solutions',
    custodianType: 'pershing',
    status: 'failed',
    startedAt: '2024-01-14T15:00:00Z',
    completedAt: '2024-01-14T15:00:05Z',
    accountsSynced: 0,
    positionsSynced: 0,
    transactionsSynced: 0,
    errors: ['Authentication failed: Token expired'],
  },
];

const mockDiscoveredAccounts: DiscoveredAccount[] = [
  { id: 'da-001', accountNumber: '****4521', accountName: 'Chen Family Trust', accountType: 'Trust', balance: 2450000, isLinked: true, linkedAccountId: 'acc-001', linkedAccountName: 'Chen Family Trust' },
  { id: 'da-002', accountNumber: '****7832', accountName: 'Sarah Chen IRA', accountType: 'IRA', balance: 845000, isLinked: true, linkedAccountId: 'acc-002', linkedAccountName: 'Sarah Chen - IRA' },
  { id: 'da-003', accountNumber: '****2198', accountName: 'Roberts Joint', accountType: 'Joint', balance: 1250000, isLinked: true, linkedAccountId: 'acc-003', linkedAccountName: 'Roberts Joint Account' },
  { id: 'da-004', accountNumber: '****9456', accountName: 'Wilson Taxable', accountType: 'Individual', balance: 520000, isLinked: false },
  { id: 'da-005', accountNumber: '****3367', accountName: 'Kim Family 401k', accountType: '401k', balance: 890000, isLinked: false },
];

const custodianLogos: Record<string, { name: string; color: string }> = {
  schwab: { name: 'Charles Schwab', color: 'bg-blue-100 text-blue-800' },
  fidelity: { name: 'Fidelity', color: 'bg-green-100 text-green-800' },
  pershing: { name: 'Pershing', color: 'bg-purple-100 text-purple-800' },
  td_ameritrade: { name: 'TD Ameritrade', color: 'bg-emerald-100 text-emerald-800' },
};

const formatCurrency = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export default function CustodianSyncPage() {
  const [connections, setConnections] = useState<CustodianConnection[]>(mockConnections);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>(mockSyncJobs);
  const [discoveredAccounts, setDiscoveredAccounts] = useState<DiscoveredAccount[]>(mockDiscoveredAccounts);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'connections' | 'sync-history' | 'account-linking'>('connections');
  const [selectedConnection, setSelectedConnection] = useState<CustodianConnection | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const stats = {
    totalConnections: connections.length,
    activeConnections: connections.filter(c => c.status === 'active').length,
    totalAccounts: connections.reduce((s, c) => s + c.accountsLinked, 0),
    totalAum: connections.reduce((s, c) => s + c.totalAum, 0),
    pendingLinks: discoveredAccounts.filter(a => !a.isLinked).length,
  };

  const handleSync = async (connectionId: string) => {
    setSyncing(connectionId);
    // Simulate sync
    await new Promise(r => setTimeout(r, 2000));
    setSyncing(null);
    
    // Update last sync time
    setConnections(prev => prev.map(c => 
      c.id === connectionId 
        ? { ...c, lastSyncAt: new Date().toISOString(), lastSyncStatus: 'success' }
        : c
    ));
  };

  const handleLinkAccount = (accountId: string) => {
    setDiscoveredAccounts(prev => prev.map(a => 
      a.id === accountId 
        ? { ...a, isLinked: true, linkedAccountId: `acc-new-${Date.now()}`, linkedAccountName: a.accountName }
        : a
    ));
  };

  return (
    <>
      <PageHeader
        title="Custodian Data Sync"
        subtitle="Manage custodian connections and sync account data"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              leftIcon={<ArrowPathIcon className={cn("w-4 h-4", syncing && "animate-spin")} />}
              onClick={() => connections.forEach(c => c.status === 'active' && handleSync(c.id))}
              disabled={!!syncing}
            >
              Sync All
            </Button>
            <Button 
              variant="primary" 
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setShowAddModal(true)}
            >
              Add Connection
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Stats */}
        <MetricGrid columns={4} className="mb-6">
          <MetricCard
            label="Connections"
            value={stats.totalConnections.toString()}
            subtext={`${stats.activeConnections} active`}
            icon="pipeline"
          />
          <MetricCard
            label="Linked Accounts"
            value={stats.totalAccounts.toString()}
            icon="households"
          />
          <MetricCard
            label="Total AUM"
            value={formatCurrency(stats.totalAum)}
            subtext="Across all custodians"
            icon="currency"
          />
          <MetricCard
            label="Pending Links"
            value={stats.pendingLinks.toString()}
            subtext="Unlinked accounts"
            icon="calendar"
          />
        </MetricGrid>

        {/* Tabs */}
        <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1 mb-6 w-fit">
          {[
            { id: 'connections', label: 'Connections' },
            { id: 'sync-history', label: 'Sync History' },
            { id: 'account-linking', label: 'Account Linking' },
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

        {activeTab === 'connections' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {connections.map(connection => (
              <Card key={connection.id} className="overflow-hidden">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-3 rounded-lg',
                        custodianLogos[connection.custodianType]?.color || 'bg-gray-100'
                      )}>
                        <BuildingLibraryIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-content-primary">{connection.connectionName}</h3>
                        <p className="text-sm text-content-tertiary">
                          {custodianLogos[connection.custodianType]?.name}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={
                        connection.status === 'active' ? 'success' :
                        connection.status === 'error' ? 'error' :
                        connection.status === 'pending' ? 'warning' : 'default'
                      }
                      label={connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                    />
                  </div>

                  {/* Error Message */}
                  {connection.errors && connection.errors.length > 0 && (
                    <div className="mb-4 p-3 bg-status-error-bg border border-status-error-text/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-status-error-text flex-shrink-0" />
                        <p className="text-sm text-status-error-text">{connection.errors[0]}</p>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-surface-secondary rounded-lg">
                      <p className="text-xs text-content-tertiary mb-1">Accounts Linked</p>
                      <p className="text-lg font-semibold text-content-primary">{connection.accountsLinked}</p>
                    </div>
                    <div className="p-3 bg-surface-secondary rounded-lg">
                      <p className="text-xs text-content-tertiary mb-1">Total AUM</p>
                      <p className="text-lg font-semibold text-content-primary">{formatCurrency(connection.totalAum)}</p>
                    </div>
                  </div>

                  {/* Sync Info */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-2 text-content-tertiary">
                      <ClockIcon className="w-4 h-4" />
                      <span>
                        {connection.lastSyncAt 
                          ? `Last sync: ${formatDistanceToNow(new Date(connection.lastSyncAt), { addSuffix: true })}`
                          : 'Never synced'
                        }
                      </span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-surface-secondary rounded">
                      {connection.syncFrequency}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-3 bg-surface-secondary border-t border-border flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<ArrowPathIcon className={cn("w-4 h-4", syncing === connection.id && "animate-spin")} />}
                    onClick={() => handleSync(connection.id)}
                    disabled={connection.status !== 'active' || !!syncing}
                  >
                    {syncing === connection.id ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost">Settings</Button>
                    {connection.status === 'error' && (
                      <Button size="sm" variant="ghost" className="text-accent-600">
                        Reconnect
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Add Connection Card */}
            <button
              onClick={() => setShowAddModal(true)}
              className={cn(
                'flex flex-col items-center justify-center p-8',
                'border-2 border-dashed border-border rounded-lg',
                'text-content-tertiary hover:text-content-secondary hover:border-border-focus',
                'transition-colors'
              )}
            >
              <PlusIcon className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Add Connection</span>
            </button>
          </div>
        )}

        {activeTab === 'sync-history' && (
          <Card>
            <CardHeader title="Sync History" subtitle="Recent data synchronization jobs" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Connection</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Started</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Accounts</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Positions</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Transactions</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {syncJobs.map(job => (
                    <tr key={job.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-2 rounded-lg',
                            custodianLogos[job.custodianType]?.color || 'bg-gray-100'
                          )}>
                            <BuildingLibraryIcon className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-content-primary">{job.connectionName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-content-secondary">
                        {format(new Date(job.startedAt), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={
                            job.status === 'completed' ? 'success' :
                            job.status === 'failed' ? 'error' :
                            job.status === 'running' ? 'info' : 'default'
                          }
                          label={job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-content-primary text-right font-medium">
                        {job.accountsSynced}
                      </td>
                      <td className="px-4 py-3 text-sm text-content-primary text-right font-medium">
                        {job.positionsSynced}
                      </td>
                      <td className="px-4 py-3 text-sm text-content-primary text-right font-medium">
                        {job.transactionsSynced}
                      </td>
                      <td className="px-4 py-3 text-sm text-content-tertiary">
                        {job.completedAt 
                          ? `${Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}s`
                          : job.status === 'running' ? 'In progress...' : '—'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'account-linking' && (
          <>
            {/* Summary */}
            <div className="flex items-center justify-between mb-6 p-4 bg-surface-secondary rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-status-success-text" />
                  <span className="text-sm text-content-primary">
                    <strong>{discoveredAccounts.filter(a => a.isLinked).length}</strong> accounts linked
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ExclamationCircleIcon className="w-5 h-5 text-status-warning-text" />
                  <span className="text-sm text-content-primary">
                    <strong>{discoveredAccounts.filter(a => !a.isLinked).length}</strong> unlinked accounts
                  </span>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                Auto-Link All
              </Button>
            </div>

            <Card>
              <CardHeader 
                title="Discovered Accounts" 
                subtitle="Match custodian accounts to CRM accounts"
              />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary">
                      <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Account Number</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Account Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Type</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Balance</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Linked To</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {discoveredAccounts.map(account => (
                      <tr key={account.id} className="hover:bg-surface-secondary transition-colors">
                        <td className="px-4 py-3 font-mono text-sm text-content-primary">
                          {account.accountNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-content-primary">
                          {account.accountName}
                        </td>
                        <td className="px-4 py-3 text-sm text-content-secondary">
                          {account.accountType}
                        </td>
                        <td className="px-4 py-3 text-sm text-content-primary text-right font-medium">
                          {formatCurrency(account.balance)}
                        </td>
                        <td className="px-4 py-3">
                          {account.isLinked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-status-success-bg text-status-success-text text-xs font-medium rounded-full">
                              <CheckCircleIcon className="w-3 h-3" />
                              Linked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-status-warning-bg text-status-warning-text text-xs font-medium rounded-full">
                              <ExclamationCircleIcon className="w-3 h-3" />
                              Unlinked
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-content-secondary">
                          {account.linkedAccountName || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {account.isLinked ? (
                            <Button size="sm" variant="ghost" className="text-status-error-text">
                              Unlink
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              leftIcon={<LinkIcon className="w-4 h-4" />}
                              onClick={() => handleLinkAccount(account.id)}
                            >
                              Link
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </PageContent>

      {/* Add Connection Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Custodian Connection"
        size="md"
      >
        <div className="p-6">
          <p className="text-sm text-content-secondary mb-6">
            Connect to your custodian to sync account data automatically.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                Custodian
              </label>
              <Select
                options={[
                  { value: '', label: 'Select a custodian...' },
                  { value: 'schwab', label: 'Charles Schwab' },
                  { value: 'fidelity', label: 'Fidelity' },
                  { value: 'pershing', label: 'Pershing' },
                  { value: 'td_ameritrade', label: 'TD Ameritrade' },
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                Connection Name
              </label>
              <Input placeholder="e.g., Main Schwab Account" />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                Sync Frequency
              </label>
              <Select
                options={[
                  { value: 'realtime', label: 'Real-time' },
                  { value: 'hourly', label: 'Hourly' },
                  { value: 'daily', label: 'Daily' },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              leftIcon={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
            >
              Connect & Authenticate
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
