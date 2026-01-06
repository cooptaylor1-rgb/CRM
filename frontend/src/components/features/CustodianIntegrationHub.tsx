'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsRightLeftIcon,
  ShieldCheckIcon,
  CogIcon,
  BellIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

// ============================================
// Types
// ============================================

export type CustodianType = 'schwab' | 'fidelity' | 'pershing' | 'td_ameritrade' | 'interactive_brokers';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'syncing' | 'pending';

export type SyncFrequency = 'real_time' | 'hourly' | 'daily' | 'weekly' | 'manual';

export type DataType = 'positions' | 'transactions' | 'balances' | 'cost_basis' | 'performance' | 'documents';

export interface CustodianConnection {
  id: string;
  custodian: CustodianType;
  status: ConnectionStatus;
  accountCount: number;
  totalAUM: number;
  lastSync: Date;
  nextSync: Date | null;
  syncFrequency: SyncFrequency;
  enabledDataTypes: DataType[];
  errorMessage?: string;
  credentials: {
    apiKeyConfigured: boolean;
    oauthConnected: boolean;
    expiresAt?: Date;
  };
}

export interface CustodianAccount {
  id: string;
  custodianId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  clientName: string;
  clientId: string;
  balance: number;
  lastUpdated: Date;
  status: 'active' | 'inactive' | 'pending' | 'closed';
  positions: Position[];
}

export interface Position {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  marketValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
  assetClass: string;
}

export interface SyncEvent {
  id: string;
  custodianId: string;
  timestamp: Date;
  type: 'full_sync' | 'incremental' | 'positions' | 'transactions' | 'balances';
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  recordsFailed: number;
  duration: number;
  errorDetails?: string;
}

export interface TradeConfirmation {
  id: string;
  custodianId: string;
  accountNumber: string;
  clientName: string;
  tradeDate: Date;
  settlementDate: Date;
  symbol: string;
  description: string;
  action: 'buy' | 'sell' | 'dividend' | 'transfer';
  quantity: number;
  price: number;
  amount: number;
  status: 'pending' | 'settled' | 'cancelled';
  acknowledged: boolean;
}

export interface FeeReconciliation {
  id: string;
  custodianId: string;
  period: string;
  expectedFees: number;
  actualFees: number;
  variance: number;
  variancePercent: number;
  status: 'matched' | 'discrepancy' | 'pending_review';
  accounts: number;
  lastReviewed?: Date;
}

export interface CustodianIntegrationHubProps {
  className?: string;
  onConnect?: (custodian: CustodianType) => void;
  onDisconnect?: (connectionId: string) => void;
  onSync?: (connectionId: string) => void;
}

// ============================================
// Constants
// ============================================

const CUSTODIAN_CONFIG: Record<CustodianType, {
  name: string;
  logo: string;
  color: string;
  bgColor: string;
  features: string[];
}> = {
  schwab: {
    name: 'Charles Schwab',
    logo: '🏦',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: ['Real-time positions', 'Trade confirmations', 'Cost basis', 'Performance reporting'],
  },
  fidelity: {
    name: 'Fidelity',
    logo: '💚',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: ['Account aggregation', 'Document vault', 'Fee billing', 'Tax lot data'],
  },
  pershing: {
    name: 'Pershing',
    logo: '🔵',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    features: ['NetX360 integration', 'Advisory billing', 'Performance analytics', 'Client reporting'],
  },
  td_ameritrade: {
    name: 'TD Ameritrade',
    logo: '🟢',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    features: ['VEO integration', 'Trading platform', 'Research data', 'Account management'],
  },
  interactive_brokers: {
    name: 'Interactive Brokers',
    logo: '🔴',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    features: ['Multi-currency', 'Global markets', 'Prime brokerage', 'API access'],
  },
};

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
  connected: { label: 'Connected', color: 'text-green-600 bg-green-50', icon: CheckCircleIcon },
  disconnected: { label: 'Disconnected', color: 'text-gray-500 bg-gray-100', icon: XCircleIcon },
  error: { label: 'Error', color: 'text-red-600 bg-red-50', icon: ExclamationTriangleIcon },
  syncing: { label: 'Syncing...', color: 'text-blue-600 bg-blue-50', icon: ArrowPathIcon },
  pending: { label: 'Pending Setup', color: 'text-yellow-600 bg-yellow-50', icon: ClockIcon },
};

// Mock data generator
const generateMockData = (): {
  connections: CustodianConnection[];
  accounts: CustodianAccount[];
  syncEvents: SyncEvent[];
  tradeConfirmations: TradeConfirmation[];
  feeReconciliations: FeeReconciliation[];
} => {
  const connections: CustodianConnection[] = [
    {
      id: 'conn-1',
      custodian: 'schwab',
      status: 'connected',
      accountCount: 245,
      totalAUM: 125000000,
      lastSync: new Date(Date.now() - 15 * 60 * 1000),
      nextSync: new Date(Date.now() + 45 * 60 * 1000),
      syncFrequency: 'hourly',
      enabledDataTypes: ['positions', 'transactions', 'balances', 'cost_basis'],
      credentials: { apiKeyConfigured: true, oauthConnected: true, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    },
    {
      id: 'conn-2',
      custodian: 'fidelity',
      status: 'connected',
      accountCount: 178,
      totalAUM: 89000000,
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextSync: new Date(Date.now() + 22 * 60 * 60 * 1000),
      syncFrequency: 'daily',
      enabledDataTypes: ['positions', 'transactions', 'balances', 'documents'],
      credentials: { apiKeyConfigured: true, oauthConnected: true },
    },
    {
      id: 'conn-3',
      custodian: 'pershing',
      status: 'error',
      accountCount: 92,
      totalAUM: 45000000,
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextSync: null,
      syncFrequency: 'daily',
      enabledDataTypes: ['positions', 'balances'],
      errorMessage: 'Authentication token expired. Please re-authenticate.',
      credentials: { apiKeyConfigured: true, oauthConnected: false },
    },
    {
      id: 'conn-4',
      custodian: 'td_ameritrade',
      status: 'syncing',
      accountCount: 56,
      totalAUM: 28000000,
      lastSync: new Date(Date.now() - 30 * 60 * 1000),
      nextSync: null,
      syncFrequency: 'hourly',
      enabledDataTypes: ['positions', 'transactions', 'balances'],
      credentials: { apiKeyConfigured: true, oauthConnected: true },
    },
  ];

  const accounts: CustodianAccount[] = [
    {
      id: 'acc-1',
      custodianId: 'conn-1',
      accountNumber: '****4521',
      accountName: 'Johnson Family Trust',
      accountType: 'Trust',
      clientName: 'Robert & Sarah Johnson',
      clientId: 'client-1',
      balance: 2450000,
      lastUpdated: new Date(Date.now() - 15 * 60 * 1000),
      status: 'active',
      positions: [
        { id: 'p1', symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', quantity: 2500, price: 245.32, marketValue: 613300, costBasis: 520000, gainLoss: 93300, gainLossPercent: 17.94, assetClass: 'US Equity' },
        { id: 'p2', symbol: 'BND', name: 'Vanguard Total Bond Market ETF', quantity: 3000, price: 72.15, marketValue: 216450, costBasis: 225000, gainLoss: -8550, gainLossPercent: -3.8, assetClass: 'Fixed Income' },
        { id: 'p3', symbol: 'VXUS', name: 'Vanguard Total Intl Stock ETF', quantity: 1800, price: 58.90, marketValue: 106020, costBasis: 95000, gainLoss: 11020, gainLossPercent: 11.6, assetClass: 'Intl Equity' },
      ],
    },
    {
      id: 'acc-2',
      custodianId: 'conn-1',
      accountNumber: '****7832',
      accountName: 'Williams IRA',
      accountType: 'IRA',
      clientName: 'Michael Williams',
      clientId: 'client-2',
      balance: 875000,
      lastUpdated: new Date(Date.now() - 15 * 60 * 1000),
      status: 'active',
      positions: [
        { id: 'p4', symbol: 'SPY', name: 'SPDR S&P 500 ETF', quantity: 1200, price: 485.50, marketValue: 582600, costBasis: 450000, gainLoss: 132600, gainLossPercent: 29.47, assetClass: 'US Equity' },
        { id: 'p5', symbol: 'AGG', name: 'iShares Core US Aggregate Bond', quantity: 1500, price: 98.20, marketValue: 147300, costBasis: 155000, gainLoss: -7700, gainLossPercent: -4.97, assetClass: 'Fixed Income' },
      ],
    },
    {
      id: 'acc-3',
      custodianId: 'conn-2',
      accountNumber: '****9124',
      accountName: 'Chen Joint Account',
      accountType: 'Joint',
      clientName: 'David & Lisa Chen',
      clientId: 'client-3',
      balance: 1250000,
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'active',
      positions: [],
    },
  ];

  const syncEvents: SyncEvent[] = [
    { id: 'sync-1', custodianId: 'conn-1', timestamp: new Date(Date.now() - 15 * 60 * 1000), type: 'full_sync', status: 'success', recordsProcessed: 2450, recordsFailed: 0, duration: 45 },
    { id: 'sync-2', custodianId: 'conn-1', timestamp: new Date(Date.now() - 75 * 60 * 1000), type: 'incremental', status: 'success', recordsProcessed: 156, recordsFailed: 0, duration: 12 },
    { id: 'sync-3', custodianId: 'conn-2', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), type: 'full_sync', status: 'success', recordsProcessed: 1890, recordsFailed: 3, duration: 38 },
    { id: 'sync-4', custodianId: 'conn-3', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), type: 'full_sync', status: 'failed', recordsProcessed: 0, recordsFailed: 0, duration: 2, errorDetails: 'Authentication failed: Token expired' },
    { id: 'sync-5', custodianId: 'conn-4', timestamp: new Date(Date.now() - 30 * 60 * 1000), type: 'positions', status: 'partial', recordsProcessed: 520, recordsFailed: 8, duration: 18 },
  ];

  const tradeConfirmations: TradeConfirmation[] = [
    { id: 'trade-1', custodianId: 'conn-1', accountNumber: '****4521', clientName: 'Robert & Sarah Johnson', tradeDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), settlementDate: new Date(Date.now()), symbol: 'VTI', description: 'Vanguard Total Stock Market ETF', action: 'buy', quantity: 50, price: 245.32, amount: 12266, status: 'settled', acknowledged: true },
    { id: 'trade-2', custodianId: 'conn-1', accountNumber: '****7832', clientName: 'Michael Williams', tradeDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), settlementDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), symbol: 'SPY', description: 'SPDR S&P 500 ETF', action: 'sell', quantity: 25, price: 485.50, amount: 12137.50, status: 'pending', acknowledged: false },
    { id: 'trade-3', custodianId: 'conn-2', accountNumber: '****9124', clientName: 'David & Lisa Chen', tradeDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), settlementDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), symbol: 'AAPL', description: 'Apple Inc.', action: 'buy', quantity: 100, price: 178.25, amount: 17825, status: 'settled', acknowledged: false },
    { id: 'trade-4', custodianId: 'conn-1', accountNumber: '****4521', clientName: 'Robert & Sarah Johnson', tradeDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), settlementDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), symbol: 'MSFT', description: 'Microsoft Corporation', action: 'dividend', quantity: 0, price: 0, amount: 425.50, status: 'settled', acknowledged: true },
  ];

  const feeReconciliations: FeeReconciliation[] = [
    { id: 'fee-1', custodianId: 'conn-1', period: 'Q4 2025', expectedFees: 312500, actualFees: 312500, variance: 0, variancePercent: 0, status: 'matched', accounts: 245, lastReviewed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { id: 'fee-2', custodianId: 'conn-2', period: 'Q4 2025', expectedFees: 222500, actualFees: 221875, variance: -625, variancePercent: -0.28, status: 'discrepancy', accounts: 178, lastReviewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { id: 'fee-3', custodianId: 'conn-3', period: 'Q4 2025', expectedFees: 112500, actualFees: 0, variance: -112500, variancePercent: -100, status: 'pending_review', accounts: 92 },
    { id: 'fee-4', custodianId: 'conn-1', period: 'Q3 2025', expectedFees: 298750, actualFees: 298750, variance: 0, variancePercent: 0, status: 'matched', accounts: 238, lastReviewed: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000) },
  ];

  return { connections, accounts, syncEvents, tradeConfirmations, feeReconciliations };
};

// ============================================
// Helper Components
// ============================================

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(2)}`;
};

const formatFullCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const StatusBadge: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className={`w-3.5 h-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
};

// ============================================
// Sub-Components
// ============================================

const ConnectionCard: React.FC<{
  connection: CustodianConnection;
  onSync: () => void;
  onSettings: () => void;
  onViewAccounts: () => void;
}> = ({ connection, onSync, onSettings, onViewAccounts }) => {
  const config = CUSTODIAN_CONFIG[connection.custodian];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center text-2xl`}>
            {config.logo}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{config.name}</h3>
            <StatusBadge status={connection.status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSync}
            disabled={connection.status === 'syncing'}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Sync now"
          >
            <ArrowPathIcon className={`w-5 h-5 ${connection.status === 'syncing' ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onSettings}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <CogIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {connection.errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{connection.errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Accounts</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{connection.accountCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total AUM</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(connection.totalAUM)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span className="flex items-center gap-1">
          <ClockIcon className="w-3.5 h-3.5" />
          Last sync: {formatTimeAgo(connection.lastSync)}
        </span>
        {connection.nextSync && (
          <span>Next: {formatTimeAgo(connection.nextSync)}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {connection.enabledDataTypes.map((type) => (
          <span
            key={type}
            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
          >
            {type.replace('_', ' ')}
          </span>
        ))}
      </div>

      <button
        onClick={onViewAccounts}
        className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <EyeIcon className="w-4 h-4" />
        View Accounts
      </button>
    </motion.div>
  );
};

const AggregatedView: React.FC<{
  connections: CustodianConnection[];
  accounts: CustodianAccount[];
}> = ({ connections, accounts }) => {
  const totals = useMemo(() => {
    const totalAUM = connections.reduce((sum, c) => sum + c.totalAUM, 0);
    const totalAccounts = connections.reduce((sum, c) => sum + c.accountCount, 0);
    const connectedCustodians = connections.filter(c => c.status === 'connected').length;
    const totalPositions = accounts.reduce((sum, a) => sum + a.positions.length, 0);
    
    return { totalAUM, totalAccounts, connectedCustodians, totalPositions };
  }, [connections, accounts]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white"
      >
        <div className="flex items-center gap-2 mb-2">
          <BanknotesIcon className="w-5 h-5 opacity-80" />
          <span className="text-sm font-medium opacity-80">Total AUM</span>
        </div>
        <p className="text-2xl font-bold">{formatCurrency(totals.totalAUM)}</p>
        <p className="text-xs opacity-70 mt-1">Across all custodians</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white"
      >
        <div className="flex items-center gap-2 mb-2">
          <BuildingLibraryIcon className="w-5 h-5 opacity-80" />
          <span className="text-sm font-medium opacity-80">Accounts</span>
        </div>
        <p className="text-2xl font-bold">{totals.totalAccounts}</p>
        <p className="text-xs opacity-70 mt-1">{totals.totalPositions} positions</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white"
      >
        <div className="flex items-center gap-2 mb-2">
          <LinkIcon className="w-5 h-5 opacity-80" />
          <span className="text-sm font-medium opacity-80">Connected</span>
        </div>
        <p className="text-2xl font-bold">{totals.connectedCustodians}/{connections.length}</p>
        <p className="text-xs opacity-70 mt-1">Custodians active</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white"
      >
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheckIcon className="w-5 h-5 opacity-80" />
          <span className="text-sm font-medium opacity-80">Data Fresh</span>
        </div>
        <p className="text-2xl font-bold">98%</p>
        <p className="text-xs opacity-70 mt-1">Updated &lt;1 hour</p>
      </motion.div>
    </div>
  );
};

const TradeConfirmationsPanel: React.FC<{
  confirmations: TradeConfirmation[];
  connections: CustodianConnection[];
  onAcknowledge: (id: string) => void;
}> = ({ confirmations, connections, onAcknowledge }) => {
  const getCustodianName = (custodianId: string) => {
    const conn = connections.find(c => c.id === custodianId);
    return conn ? CUSTODIAN_CONFIG[conn.custodian].name : 'Unknown';
  };

  const unacknowledged = confirmations.filter(c => !c.acknowledged);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowsRightLeftIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Trade Confirmations</h3>
          {unacknowledged.length > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
              {unacknowledged.length} pending
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {confirmations.slice(0, 5).map((trade) => (
          <div key={trade.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    trade.action === 'buy' ? 'bg-green-100 text-green-700' :
                    trade.action === 'sell' ? 'bg-red-100 text-red-700' :
                    trade.action === 'dividend' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {trade.action.toUpperCase()}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{trade.symbol}</span>
                  <span className="text-gray-500 text-sm">• {trade.clientName}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {trade.quantity > 0 ? `${trade.quantity} shares @ ${formatFullCurrency(trade.price)}` : trade.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {getCustodianName(trade.custodianId)} • {trade.accountNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">{formatFullCurrency(trade.amount)}</p>
                <p className={`text-xs ${trade.status === 'settled' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {trade.status}
                </p>
                {!trade.acknowledged && (
                  <button
                    onClick={() => onAcknowledge(trade.id)}
                    className="mt-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FeeReconciliationPanel: React.FC<{
  reconciliations: FeeReconciliation[];
  connections: CustodianConnection[];
  onReview: (id: string) => void;
}> = ({ reconciliations, connections, onReview }) => {
  const getCustodianName = (custodianId: string) => {
    const conn = connections.find(c => c.id === custodianId);
    return conn ? CUSTODIAN_CONFIG[conn.custodian].name : 'Unknown';
  };

  const issues = reconciliations.filter(r => r.status !== 'matched');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BanknotesIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Fee Reconciliation</h3>
          {issues.length > 0 && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              {issues.length} needs review
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {reconciliations.map((rec) => (
          <div key={rec.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">{rec.period}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    rec.status === 'matched' ? 'bg-green-100 text-green-700' :
                    rec.status === 'discrepancy' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {rec.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {getCustodianName(rec.custodianId)} • {rec.accounts} accounts
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">{formatFullCurrency(rec.expectedFees)}</p>
                {rec.variance !== 0 && (
                  <p className={`text-sm flex items-center gap-1 justify-end ${rec.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {rec.variance > 0 ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                    {formatFullCurrency(Math.abs(rec.variance))} ({rec.variancePercent.toFixed(2)}%)
                  </p>
                )}
                {rec.status !== 'matched' && (
                  <button
                    onClick={() => onReview(rec.id)}
                    className="mt-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SyncHistoryPanel: React.FC<{
  events: SyncEvent[];
  connections: CustodianConnection[];
}> = ({ events, connections }) => {
  const getCustodianName = (custodianId: string) => {
    const conn = connections.find(c => c.id === custodianId);
    return conn ? CUSTODIAN_CONFIG[conn.custodian].name : 'Unknown';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <CloudArrowDownIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Sync History</h3>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {events.map((event) => (
          <div key={event.id} className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                event.status === 'success' ? 'bg-green-500' :
                event.status === 'partial' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {getCustodianName(event.custodianId)}
                </p>
                <p className="text-xs text-gray-500">
                  {event.type.replace('_', ' ')} • {event.recordsProcessed} records
                  {event.recordsFailed > 0 && ` (${event.recordsFailed} failed)`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{formatTimeAgo(event.timestamp)}</p>
              <p className="text-xs text-gray-400">{event.duration}s</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AccountsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  connection: CustodianConnection | null;
  accounts: CustodianAccount[];
}> = ({ isOpen, onClose, connection, accounts }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

  const filteredAccounts = useMemo(() => {
    if (!connection) return [];
    return accounts
      .filter(a => a.custodianId === connection.id)
      .filter(a => 
        a.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.accountNumber.includes(searchQuery)
      );
  }, [connection, accounts, searchQuery]);

  if (!connection) return null;

  const config = CUSTODIAN_CONFIG[connection.custodian];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center text-xl`}>
                  {config.logo}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{config.name} Accounts</h2>
                  <p className="text-sm text-gray-500">{filteredAccounts.length} accounts • {formatCurrency(connection.totalAUM)} AUM</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
              {filteredAccounts.map((account) => (
                <div key={account.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <button
                    onClick={() => setExpandedAccount(expandedAccount === account.id ? null : account.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">{account.accountName}</span>
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                          {account.accountType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {account.clientName} • {account.accountNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">{formatFullCurrency(account.balance)}</p>
                        <p className="text-xs text-gray-500">{account.positions.length} positions</p>
                      </div>
                      {account.positions.length > 0 && (
                        expandedAccount === account.id ? 
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" /> :
                          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedAccount === account.id && account.positions.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-gray-50 dark:bg-gray-900/50"
                      >
                        <table className="w-full">
                          <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                              <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                              <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                              <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                              <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {account.positions.map((position) => (
                              <tr key={position.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                <td className="px-6 py-3">
                                  <p className="font-medium text-gray-900 dark:text-white">{position.symbol}</p>
                                  <p className="text-xs text-gray-500">{position.assetClass}</p>
                                </td>
                                <td className="px-6 py-3 text-right text-gray-900 dark:text-white">
                                  {position.quantity.toLocaleString()}
                                </td>
                                <td className="px-6 py-3 text-right text-gray-900 dark:text-white">
                                  ${position.price.toFixed(2)}
                                </td>
                                <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">
                                  {formatFullCurrency(position.marketValue)}
                                </td>
                                <td className="px-6 py-3 text-right">
                                  <span className={position.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {position.gainLoss >= 0 ? '+' : ''}{formatFullCurrency(position.gainLoss)}
                                    <span className="text-xs ml-1">({position.gainLossPercent.toFixed(1)}%)</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AddCustodianModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  existingCustodians: CustodianType[];
  onConnect: (custodian: CustodianType) => void;
}> = ({ isOpen, onClose, existingCustodians, onConnect }) => {
  const availableCustodians = Object.entries(CUSTODIAN_CONFIG).filter(
    ([key]) => !existingCustodians.includes(key as CustodianType)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Custodian</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {availableCustodians.length === 0 ? (
                <p className="text-center text-gray-500 py-8">All supported custodians are already connected.</p>
              ) : (
                availableCustodians.map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      onConnect(key as CustodianType);
                      onClose();
                    }}
                    className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center text-2xl`}>
                      {config.logo}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{config.name}</h3>
                      <p className="text-sm text-gray-500">{config.features.slice(0, 2).join(' • ')}</p>
                    </div>
                    <LinkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// Main Component
// ============================================

export const CustodianIntegrationHub: React.FC<CustodianIntegrationHubProps> = ({
  className = '',
  onConnect,
  onDisconnect,
  onSync,
}) => {
  const [data] = useState(() => generateMockData());
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'fees' | 'sync'>('overview');
  const [selectedConnection, setSelectedConnection] = useState<CustodianConnection | null>(null);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [acknowledgedTrades, setAcknowledgedTrades] = useState<Set<string>>(new Set());

  const handleSync = useCallback((connectionId: string) => {
    onSync?.(connectionId);
    // In real app, this would trigger actual sync
  }, [onSync]);

  const handleAcknowledgeTrade = useCallback((tradeId: string) => {
    setAcknowledgedTrades(prev => new Set(prev).add(tradeId));
  }, []);

  const tradeConfirmationsWithAck = useMemo(() => {
    return data.tradeConfirmations.map(t => ({
      ...t,
      acknowledged: t.acknowledged || acknowledgedTrades.has(t.id),
    }));
  }, [data.tradeConfirmations, acknowledgedTrades]);

  const tabs: Array<{ id: 'overview' | 'trades' | 'fees' | 'sync'; label: string; icon: React.ComponentType<any>; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: BuildingLibraryIcon },
    { id: 'trades', label: 'Trades', icon: ArrowsRightLeftIcon, badge: tradeConfirmationsWithAck.filter(t => !t.acknowledged).length },
    { id: 'fees', label: 'Fees', icon: BanknotesIcon, badge: data.feeReconciliations.filter(r => r.status !== 'matched').length },
    { id: 'sync', label: 'Sync Log', icon: CloudArrowDownIcon },
  ];

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custodian Integration Hub</h1>
          <p className="text-gray-500 mt-1">Manage custodian connections and data synchronization</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <LinkIcon className="w-5 h-5" />
          Add Custodian
        </button>
      </div>

      {/* Aggregated Metrics */}
      <AggregatedView connections={data.connections} accounts={data.accounts} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.connections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  onSync={() => handleSync(connection.id)}
                  onSettings={() => {}}
                  onViewAccounts={() => {
                    setSelectedConnection(connection);
                    setShowAccountsModal(true);
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'trades' && (
          <motion.div
            key="trades"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <TradeConfirmationsPanel
              confirmations={tradeConfirmationsWithAck}
              connections={data.connections}
              onAcknowledge={handleAcknowledgeTrade}
            />
          </motion.div>
        )}

        {activeTab === 'fees' && (
          <motion.div
            key="fees"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <FeeReconciliationPanel
              reconciliations={data.feeReconciliations}
              connections={data.connections}
              onReview={() => {}}
            />
          </motion.div>
        )}

        {activeTab === 'sync' && (
          <motion.div
            key="sync"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SyncHistoryPanel events={data.syncEvents} connections={data.connections} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AccountsModal
        isOpen={showAccountsModal}
        onClose={() => setShowAccountsModal(false)}
        connection={selectedConnection}
        accounts={data.accounts}
      />

      <AddCustodianModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        existingCustodians={data.connections.map(c => c.custodian)}
        onConnect={(custodian) => onConnect?.(custodian)}
      />
    </div>
  );
};

export default CustodianIntegrationHub;
