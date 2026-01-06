'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Plus, Search, Filter, ExternalLink, Settings, RefreshCw,
  CheckCircle, XCircle, Clock, AlertCircle, Star, Download, Zap,
  Link2, Unlink, Shield, Key, Database, Activity, ChevronRight,
  Puzzle, Globe, Mail, Calendar, FileText, DollarSign, Users,
  BarChart3, Cloud, Lock, Unlock, Eye, MoreVertical, ArrowUpRight
} from 'lucide-react';

// Types
interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'custodian' | 'crm' | 'accounting' | 'communication' | 'document' | 'analytics' | 'compliance' | 'planning';
  provider: string;
  logoUrl?: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: Date;
  features: string[];
  pricing: 'free' | 'included' | 'premium';
  rating: number;
  reviewCount: number;
  isPopular: boolean;
  isNew: boolean;
  dataFlows: DataFlow[];
  config?: IntegrationConfig;
}

interface DataFlow {
  id: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  dataType: string;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  lastSync?: Date;
  recordCount?: number;
  status: 'active' | 'paused' | 'error';
}

interface IntegrationConfig {
  apiKey?: string;
  clientId?: string;
  webhookUrl?: string;
  syncFrequency: string;
  dataMapping: Record<string, string>;
  permissions: string[];
}

interface SyncLog {
  id: string;
  integrationId: string;
  integrationName: string;
  timestamp: Date;
  type: 'sync' | 'webhook' | 'manual';
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  duration: number;
  message?: string;
}

// Mock Data
const mockIntegrations: Integration[] = [
  {
    id: '1', name: 'Schwab Advisor Services', description: 'Real-time portfolio data, trading, and account management',
    category: 'custodian', provider: 'Charles Schwab', status: 'connected', lastSync: new Date(Date.now() - 15 * 60 * 1000),
    features: ['Portfolio sync', 'Trade execution', 'Account opening', 'Fee billing'],
    pricing: 'included', rating: 4.8, reviewCount: 245, isPopular: true, isNew: false,
    dataFlows: [
      { id: 'd1', direction: 'inbound', dataType: 'Positions', frequency: 'realtime', lastSync: new Date(), recordCount: 1247, status: 'active' },
      { id: 'd2', direction: 'inbound', dataType: 'Transactions', frequency: 'daily', lastSync: new Date(), recordCount: 89, status: 'active' },
      { id: 'd3', direction: 'outbound', dataType: 'Trade Orders', frequency: 'realtime', status: 'active' },
    ]
  },
  {
    id: '2', name: 'Fidelity Institutional', description: 'Custodial services with advanced clearing capabilities',
    category: 'custodian', provider: 'Fidelity', status: 'connected', lastSync: new Date(Date.now() - 60 * 60 * 1000),
    features: ['Portfolio sync', 'Settlements', 'Corporate actions'],
    pricing: 'included', rating: 4.6, reviewCount: 189, isPopular: true, isNew: false,
    dataFlows: [
      { id: 'd4', direction: 'bidirectional', dataType: 'Accounts', frequency: 'daily', lastSync: new Date(), recordCount: 342, status: 'active' },
    ]
  },
  {
    id: '3', name: 'Salesforce', description: 'Enterprise CRM integration for client relationship management',
    category: 'crm', provider: 'Salesforce', status: 'disconnected',
    features: ['Contact sync', 'Opportunity tracking', 'Activity logging'],
    pricing: 'premium', rating: 4.5, reviewCount: 156, isPopular: true, isNew: false,
    dataFlows: []
  },
  {
    id: '4', name: 'QuickBooks Online', description: 'Accounting and billing automation',
    category: 'accounting', provider: 'Intuit', status: 'connected', lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
    features: ['Invoice sync', 'Payment tracking', 'Expense management'],
    pricing: 'premium', rating: 4.3, reviewCount: 98, isPopular: false, isNew: false,
    dataFlows: [
      { id: 'd5', direction: 'outbound', dataType: 'Invoices', frequency: 'daily', lastSync: new Date(), recordCount: 45, status: 'active' },
    ]
  },
  {
    id: '5', name: 'Microsoft 365', description: 'Email, calendar, and document collaboration',
    category: 'communication', provider: 'Microsoft', status: 'connected', lastSync: new Date(Date.now() - 5 * 60 * 1000),
    features: ['Email logging', 'Calendar sync', 'Teams meetings', 'SharePoint docs'],
    pricing: 'included', rating: 4.7, reviewCount: 312, isPopular: true, isNew: false,
    dataFlows: [
      { id: 'd6', direction: 'bidirectional', dataType: 'Calendar Events', frequency: 'realtime', status: 'active' },
      { id: 'd7', direction: 'inbound', dataType: 'Emails', frequency: 'realtime', recordCount: 1893, status: 'active' },
    ]
  },
  {
    id: '6', name: 'DocuSign', description: 'Electronic signature and document workflow',
    category: 'document', provider: 'DocuSign', status: 'connected', lastSync: new Date(Date.now() - 30 * 60 * 1000),
    features: ['E-signatures', 'Document templates', 'Audit trail'],
    pricing: 'premium', rating: 4.9, reviewCount: 178, isPopular: true, isNew: false,
    dataFlows: [
      { id: 'd8', direction: 'bidirectional', dataType: 'Documents', frequency: 'realtime', status: 'active' },
    ]
  },
  {
    id: '7', name: 'Orion Portfolio Solutions', description: 'Advanced portfolio management and reporting',
    category: 'analytics', provider: 'Orion', status: 'error', lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
    features: ['Performance reporting', 'Billing', 'Client portal'],
    pricing: 'premium', rating: 4.4, reviewCount: 134, isPopular: false, isNew: false,
    dataFlows: [
      { id: 'd9', direction: 'inbound', dataType: 'Performance', frequency: 'daily', status: 'error' },
    ]
  },
  {
    id: '8', name: 'Compliance.ai', description: 'Automated regulatory compliance monitoring',
    category: 'compliance', provider: 'Compliance.ai', status: 'pending',
    features: ['Rule monitoring', 'Alert generation', 'Filing assistance'],
    pricing: 'premium', rating: 4.2, reviewCount: 67, isPopular: false, isNew: true,
    dataFlows: []
  },
  {
    id: '9', name: 'MoneyGuidePro', description: 'Comprehensive financial planning software',
    category: 'planning', provider: 'Envestnet', status: 'connected', lastSync: new Date(Date.now() - 45 * 60 * 1000),
    features: ['Plan sync', 'Goal tracking', 'Monte Carlo'],
    pricing: 'premium', rating: 4.6, reviewCount: 203, isPopular: true, isNew: false,
    dataFlows: [
      { id: 'd10', direction: 'bidirectional', dataType: 'Financial Plans', frequency: 'daily', recordCount: 156, status: 'active' },
    ]
  },
  {
    id: '10', name: 'RightCapital', description: 'Modern financial planning with client collaboration',
    category: 'planning', provider: 'RightCapital', status: 'disconnected',
    features: ['Planning tools', 'Client portal', 'Tax analysis'],
    pricing: 'premium', rating: 4.7, reviewCount: 89, isPopular: false, isNew: true,
    dataFlows: []
  },
];

const mockSyncLogs: SyncLog[] = [
  { id: '1', integrationId: '1', integrationName: 'Schwab Advisor Services', timestamp: new Date(Date.now() - 15 * 60 * 1000), type: 'sync', status: 'success', recordsProcessed: 1247, duration: 45 },
  { id: '2', integrationId: '5', integrationName: 'Microsoft 365', timestamp: new Date(Date.now() - 20 * 60 * 1000), type: 'webhook', status: 'success', recordsProcessed: 23, duration: 2 },
  { id: '3', integrationId: '7', integrationName: 'Orion Portfolio Solutions', timestamp: new Date(Date.now() - 60 * 60 * 1000), type: 'sync', status: 'failed', recordsProcessed: 0, duration: 120, message: 'API authentication error' },
  { id: '4', integrationId: '6', integrationName: 'DocuSign', timestamp: new Date(Date.now() - 90 * 60 * 1000), type: 'webhook', status: 'success', recordsProcessed: 5, duration: 1 },
  { id: '5', integrationId: '4', integrationName: 'QuickBooks Online', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), type: 'sync', status: 'partial', recordsProcessed: 42, duration: 67, message: '3 invoices skipped due to missing data' },
];

// Utility Functions
const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
const formatDuration = (seconds: number) => seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

// Sub-components
const IntegrationCard: React.FC<{
  integration: Integration;
  onConnect: () => void;
  onManage: () => void;
}> = ({ integration, onConnect, onManage }) => {
  const statusStyles = {
    connected: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
    disconnected: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', icon: Unlink },
    error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle },
    pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: Clock },
  };

  const categoryIcons: Record<Integration['category'], React.ElementType> = {
    custodian: Database,
    crm: Users,
    accounting: DollarSign,
    communication: Mail,
    document: FileText,
    analytics: BarChart3,
    compliance: Shield,
    planning: Calendar,
  };

  const StatusIcon = statusStyles[integration.status].icon;
  const CategoryIcon = categoryIcons[integration.category];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
              <CategoryIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">{integration.name}</h4>
                {integration.isNew && (
                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">New</span>
                )}
                {integration.isPopular && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <p className="text-xs text-gray-500">{integration.provider}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusStyles[integration.status].bg} ${statusStyles[integration.status].text}`}>
            <StatusIcon className="w-3 h-3" />
            <span className="capitalize">{integration.status}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{integration.description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {integration.features.slice(0, 3).map((feature) => (
            <span key={feature} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
              {feature}
            </span>
          ))}
          {integration.features.length > 3 && (
            <span className="px-2 py-0.5 text-gray-500 text-xs">+{integration.features.length - 3} more</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" /> {integration.rating}
            </span>
            <span>{integration.reviewCount} reviews</span>
            {integration.lastSync && (
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> {formatDate(integration.lastSync)}
              </span>
            )}
          </div>
          {integration.status === 'connected' ? (
            <button
              onClick={onManage}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Settings className="w-3 h-3" /> Manage
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Link2 className="w-3 h-3" /> Connect
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const DataFlowPanel: React.FC<{ integration: Integration }> = ({ integration }) => {
  if (integration.dataFlows.length === 0) return null;

  const directionIcons = {
    inbound: ArrowUpRight,
    outbound: ArrowUpRight,
    bidirectional: RefreshCw,
  };

  const frequencyLabels = {
    realtime: 'Real-time',
    hourly: 'Hourly',
    daily: 'Daily',
    weekly: 'Weekly',
    manual: 'Manual',
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900 dark:text-white text-sm">Data Flows</h4>
      {integration.dataFlows.map((flow) => {
        const DirectionIcon = directionIcons[flow.direction];
        return (
          <div
            key={flow.id}
            className={`p-3 rounded-lg border ${
              flow.status === 'active' ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' :
              flow.status === 'error' ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' :
              'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DirectionIcon className={`w-4 h-4 ${
                  flow.direction === 'inbound' ? 'text-green-600 rotate-180' :
                  flow.direction === 'outbound' ? 'text-blue-600' : 'text-purple-600'
                }`} />
                <span className="font-medium text-gray-900 dark:text-white text-sm">{flow.dataType}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs ${
                flow.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                flow.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {flow.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{frequencyLabels[flow.frequency]}</span>
              {flow.recordCount && <span>{flow.recordCount.toLocaleString()} records</span>}
              {flow.lastSync && <span>Last: {formatDate(flow.lastSync)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SyncLogsPanel: React.FC<{ logs: SyncLog[] }> = ({ logs }) => {
  const statusStyles = {
    success: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    partial: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
    failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900 dark:text-white">Sync Activity</span>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900 dark:text-white text-sm">{log.integrationName}</span>
              <span className={`px-2 py-0.5 rounded text-xs capitalize ${statusStyles[log.status].bg} ${statusStyles[log.status].text}`}>
                {log.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{formatDate(log.timestamp)}</span>
              <span className="capitalize">{log.type}</span>
              <span>{log.recordsProcessed.toLocaleString()} records</span>
              <span>{formatDuration(log.duration)}</span>
            </div>
            {log.message && (
              <p className="text-xs text-gray-500 mt-1 bg-gray-50 dark:bg-gray-700 rounded p-1.5">{log.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const IntegrationModal: React.FC<{
  integration: Integration;
  onClose: () => void;
}> = ({ integration, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'logs'>('overview');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                <Puzzle className="w-7 h-7 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{integration.name}</h2>
                <p className="text-sm text-gray-500">{integration.provider}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            {['overview', 'settings', 'logs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-4 py-2 rounded-lg text-sm capitalize ${
                  activeTab === tab
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-400">{integration.description}</p>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {integration.features.map((feature) => (
                    <span key={feature} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              <DataFlowPanel integration={integration} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Credentials</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value="••••••••••••••••"
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                  />
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sync Frequency</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</label>
                <div className="space-y-2">
                  {['Read accounts', 'Write transactions', 'Execute trades', 'Access reports'].map((perm) => (
                    <label key={perm} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              {mockSyncLogs.filter(l => l.integrationId === integration.id).length > 0 ? (
                mockSyncLogs.filter(l => l.integrationId === integration.id).map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{log.type}</span>
                      <span className={`px-2 py-0.5 rounded text-xs capitalize ${
                        log.status === 'success' ? 'bg-green-100 text-green-700' :
                        log.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(log.timestamp)} • {log.recordsProcessed} records • {formatDuration(log.duration)}
                    </div>
                    {log.message && <p className="text-xs text-gray-500 mt-1">{log.message}</p>}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No sync logs available</p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm">
            <Unlink className="w-4 h-4" /> Disconnect
          </button>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
              <RefreshCw className="w-4 h-4" /> Sync Now
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              <CheckCircle className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main Component
export const IntegrationMarketplace: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Integration['category'] | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Integration['status'] | 'all'>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const filteredIntegrations = useMemo(() => {
    return mockIntegrations.filter((i) => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           i.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, categoryFilter, statusFilter]);

  const connectedCount = mockIntegrations.filter(i => i.status === 'connected').length;
  const errorCount = mockIntegrations.filter(i => i.status === 'error').length;

  const categories = [
    { id: 'all', label: 'All', icon: Globe },
    { id: 'custodian', label: 'Custodians', icon: Database },
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'accounting', label: 'Accounting', icon: DollarSign },
    { id: 'communication', label: 'Communication', icon: Mail },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'planning', label: 'Planning', icon: Calendar },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            Integration Marketplace
          </h1>
          <p className="text-gray-500 mt-1">Connect your favorite tools and services</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
              <CheckCircle className="w-4 h-4" /> {connectedCount} connected
            </span>
            {errorCount > 0 && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                <AlertCircle className="w-4 h-4" /> {errorCount} errors
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
        >
          <option value="all">All Status</option>
          <option value="connected">Connected</option>
          <option value="disconnected">Disconnected</option>
          <option value="error">Error</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id as typeof categoryFilter)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
              categoryFilter === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Integrations Grid */}
        <div className="col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onConnect={() => setSelectedIntegration(integration)}
                onManage={() => setSelectedIntegration(integration)}
              />
            ))}
          </div>
          {filteredIntegrations.length === 0 && (
            <div className="text-center py-12">
              <Puzzle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No integrations found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          <SyncLogsPanel logs={mockSyncLogs} />
        </div>
      </div>

      {/* Integration Modal */}
      <AnimatePresence>
        {selectedIntegration && (
          <IntegrationModal
            integration={selectedIntegration}
            onClose={() => setSelectedIntegration(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntegrationMarketplace;
