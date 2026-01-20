'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Link2, RefreshCw, Check, AlertCircle, Clock, 
  ChevronRight, Plus, Trash2, Settings, ExternalLink, Shield,
  ArrowRight, Loader2
} from 'lucide-react';
import custodianService, {
  CustodianConnection,
  CustodianAccountLink,
  DiscoveredAccount
} from '@/services/custodian.service';
import { toast } from 'react-hot-toast';

// Schwab brand colors
const schwabColors = {
  primary: '#00a3e0',
  secondary: '#003d71',
  accent: '#0072ce',
};

interface ConnectionCardProps {
  connection: CustodianConnection;
  onSelect: () => void;
  onSync: () => void;
  onDelete: () => void;
  isSelected: boolean;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onSelect,
  onSync,
  onDelete,
  isSelected,
}) => {
  const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    error: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        group relative bg-white dark:bg-gray-900 rounded-xl border
        ${isSelected 
          ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
        }
        p-6 cursor-pointer transition-all duration-200
      `}
      onClick={onSelect}
    >
      {/* Schwab logo */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: `linear-gradient(135deg, ${schwabColors.primary}, ${schwabColors.secondary})` }}
          >
            CS
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {connection.connectionName}
            </h3>
            <p className="text-sm text-gray-500 capitalize">
              {connection.custodianType.replace('_', ' ')}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[connection.status]}`}>
          {connection.status}
        </span>
      </div>

      {/* Sync info */}
      <div className="space-y-2 text-sm">
        {connection.lastSyncAt && (
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last sync: {new Date(connection.lastSyncAt).toLocaleString()}</span>
          </div>
        )}
        {connection.lastSyncStatus && (
          <div className="flex items-center gap-2 text-gray-500">
            {connection.lastSyncStatus === 'success' ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="capitalize">{connection.lastSyncStatus}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={(e) => { e.stopPropagation(); onSync(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Sync
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <ChevronRight className={`w-5 h-5 text-gray-400 ml-auto transition-transform ${isSelected ? 'rotate-90' : ''}`} />
      </div>
    </motion.div>
  );
};

interface AccountLinkRowProps {
  link: CustodianAccountLink;
  onUnlink: () => void;
  onSync: () => void;
}

const AccountLinkRow: React.FC<AccountLinkRowProps> = ({ link, onUnlink, onSync }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {link.custodianAccountNumber}
          </p>
          <p className="text-sm text-gray-500">
            Sync: {link.syncFrequency} · {link.isAutoSync ? 'Auto' : 'Manual'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onSync}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          title="Sync now"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={onUnlink}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
          title="Unlink account"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface DiscoveredAccountCardProps {
  account: DiscoveredAccount;
  onLink: (crmAccountId: string) => void;
}

const DiscoveredAccountCard: React.FC<DiscoveredAccountCardProps> = ({ account, onLink }) => {
  const [selectedCrmAccount, setSelectedCrmAccount] = useState(account.suggestedCrmAccount?.id || '');

  return (
    <div className={`
      p-4 rounded-lg border
      ${account.isLinked 
        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' 
        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
      }
    `}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {account.accountName}
            </h4>
            {account.isLinked && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-600 bg-emerald-100 rounded-full">
                <Check className="w-3 h-3" /> Linked
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {account.accountNumber} · {account.accountType}
          </p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
            ${account.balance.toLocaleString()}
          </p>
        </div>

        {!account.isLinked && (
          <div className="flex items-center gap-2">
            <select
              value={selectedCrmAccount}
              onChange={(e) => setSelectedCrmAccount(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select CRM Account</option>
              {account.suggestedCrmAccount && (
                <option value={account.suggestedCrmAccount.id}>
                  {account.suggestedCrmAccount.name} (Suggested)
                </option>
              )}
            </select>
            <button
              onClick={() => selectedCrmAccount && onLink(selectedCrmAccount)}
              disabled={!selectedCrmAccount}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg transition-colors"
            >
              Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SchwabIntegrationPage() {
  const [connections, setConnections] = useState<CustodianConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<CustodianAccountLink[]>([]);
  const [discoveredAccounts, setDiscoveredAccounts] = useState<DiscoveredAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showNewConnectionModal, setShowNewConnectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'linked' | 'discover'>('linked');

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      loadLinkedAccounts(selectedConnection);
    }
  }, [selectedConnection]);

  const loadConnections = async () => {
    try {
      const data = await custodianService.getConnections();
      setConnections(data);
      if (data.length > 0 && !selectedConnection) {
        setSelectedConnection(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedAccounts = async (connectionId: string) => {
    try {
      const accounts = await custodianService.getLinkedAccounts(connectionId);
      setLinkedAccounts(accounts);
    } catch (error) {
      console.error('Failed to load linked accounts:', error);
    }
  };

  const discoverAccounts = async () => {
    if (!selectedConnection) return;
    try {
      setLoading(true);
      const accounts = await custodianService.discoverAccounts(selectedConnection);
      setDiscoveredAccounts(accounts);
      setActiveTab('discover');
    } catch (error) {
      console.error('Failed to discover accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      setSyncing(true);
      await custodianService.syncConnection(connectionId);
      await loadConnections();
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleLinkAccount = async (custodianAccountId: string, crmAccountId: string) => {
    if (!selectedConnection) return;
    const account = discoveredAccounts.find(a => a.custodianAccountId === custodianAccountId);
    if (!account) return;

    try {
      await custodianService.linkAccount(selectedConnection, {
        crmAccountId,
        custodianAccountId,
        custodianAccountNumber: account.accountNumber,
        isAutoSync: true,
        syncFrequency: 'daily',
      });
      await loadLinkedAccounts(selectedConnection);
      await discoverAccounts();
    } catch (error) {
      console.error('Failed to link account:', error);
    }
  };

  const handleUnlinkAccount = async (linkId: string) => {
    if (!confirm('Are you sure you want to unlink this account?')) return;
    try {
      await custodianService.unlinkAccount(linkId);
      if (selectedConnection) {
        await loadLinkedAccounts(selectedConnection);
      }
    } catch (error) {
      console.error('Failed to unlink account:', error);
    }
  };

  const handleAutoLink = async () => {
    if (!selectedConnection) return;
    try {
      setLoading(true);
      const result = await custodianService.autoLinkAccounts(selectedConnection);
      toast.success(`Auto-linked ${result.linked} accounts. ${result.skipped} skipped.`);
      await loadLinkedAccounts(selectedConnection);
      await discoverAccounts();
    } catch (error) {
      console.error('Failed to auto-link:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedConnectionData = connections.find(c => c.id === selectedConnection);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Custodian Integrations
              </h1>
              <p className="text-gray-500 mt-1">
                Connect and sync with Charles Schwab and other custodians
              </p>
            </div>
            <button
              onClick={() => setShowNewConnectionModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Connection
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Connections List */}
          <div className="col-span-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Connections
            </h2>
            
            {loading && connections.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No custodian connections yet</p>
                <button
                  onClick={() => setShowNewConnectionModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first connection
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map(connection => (
                  <ConnectionCard
                    key={connection.id}
                    connection={connection}
                    isSelected={selectedConnection === connection.id}
                    onSelect={() => setSelectedConnection(connection.id)}
                    onSync={() => handleSync(connection.id)}
                    onDelete={() => {/* TODO */}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="col-span-8">
            {selectedConnectionData ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Connection Header */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                        style={{ background: `linear-gradient(135deg, ${schwabColors.primary}, ${schwabColors.secondary})` }}
                      >
                        CS
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {selectedConnectionData.connectionName}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {linkedAccounts.length} linked accounts
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={discoverAccounts}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Discover Accounts
                      </button>
                      <button
                        onClick={() => handleSync(selectedConnectionData.id)}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Sync All'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setActiveTab('linked')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'linked'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Linked Accounts ({linkedAccounts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'discover'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Discover ({discoveredAccounts.filter(a => !a.isLinked).length})
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === 'linked' ? (
                      <motion.div
                        key="linked"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        {linkedAccounts.length === 0 ? (
                          <div className="text-center py-12">
                            <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-2">No accounts linked yet</p>
                            <button
                              onClick={discoverAccounts}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Discover accounts to link
                            </button>
                          </div>
                        ) : (
                          linkedAccounts.map(link => (
                            <AccountLinkRow
                              key={link.id}
                              link={link}
                              onUnlink={() => handleUnlinkAccount(link.id)}
                              onSync={() => custodianService.syncAccount(link.id)}
                            />
                          ))
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="discover"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {discoveredAccounts.length > 0 && (
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-500">
                              Found {discoveredAccounts.length} accounts from Schwab
                            </p>
                            <button
                              onClick={handleAutoLink}
                              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              <ArrowRight className="w-4 h-4" />
                              Auto-link all
                            </button>
                          </div>
                        )}
                        
                        {discoveredAccounts.length === 0 ? (
                          <div className="text-center py-12">
                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-2">No accounts discovered</p>
                            <button
                              onClick={discoverAccounts}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Refresh discovery
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {discoveredAccounts.map(account => (
                              <DiscoveredAccountCard
                                key={account.custodianAccountId}
                                account={account}
                                onLink={(crmAccountId) => handleLinkAccount(account.custodianAccountId, crmAccountId)}
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="text-center">
                  <Shield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500">Select a connection to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
