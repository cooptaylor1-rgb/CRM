'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BanknotesIcon,
  CalculatorIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  PlusIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// ============================================
// Types
// ============================================

export type BillingFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
export type FeeType = 'aum' | 'flat' | 'tiered' | 'performance' | 'hourly';
export type InvoiceStatus = 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'disputed';

export interface FeeSchedule {
  id: string;
  name: string;
  type: FeeType;
  tiers?: { min: number; max: number; rate: number }[];
  flatAmount?: number;
  hourlyRate?: number;
  performanceFee?: number;
  minimumFee?: number;
  billingFrequency: BillingFrequency;
  clientCount: number;
}

export interface Invoice {
  id: string;
  clientName: string;
  householdId: string;
  period: string;
  aum: number;
  feeAmount: number;
  status: InvoiceStatus;
  dueDate: Date;
  createdAt: Date;
  sentAt?: Date;
  paidAt?: Date;
  scheduleId: string;
}

export interface BillingMetrics {
  totalBilled: number;
  collected: number;
  outstanding: number;
  overdue: number;
  averageFee: number;
  collectionRate: number;
}

export interface FeeBillingEngineProps {
  className?: string;
  onGenerateInvoices?: () => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

// ============================================
// Constants & Mock Data
// ============================================

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
  draft: { label: 'Draft', color: 'text-gray-600 bg-gray-100', icon: DocumentTextIcon },
  pending: { label: 'Pending', color: 'text-yellow-600 bg-yellow-50', icon: ClockIcon },
  sent: { label: 'Sent', color: 'text-blue-600 bg-blue-50', icon: PaperAirplaneIcon },
  paid: { label: 'Paid', color: 'text-green-600 bg-green-50', icon: CheckCircleIcon },
  overdue: { label: 'Overdue', color: 'text-red-600 bg-red-50', icon: ExclamationTriangleIcon },
  disputed: { label: 'Disputed', color: 'text-orange-600 bg-orange-50', icon: ExclamationTriangleIcon },
};

const FEE_TYPE_LABELS: Record<FeeType, string> = {
  aum: 'AUM-Based',
  flat: 'Flat Fee',
  tiered: 'Tiered AUM',
  performance: 'Performance',
  hourly: 'Hourly',
};

const generateMockData = (): { schedules: FeeSchedule[]; invoices: Invoice[]; metrics: BillingMetrics } => {
  const schedules: FeeSchedule[] = [
    {
      id: 'sch-1', name: 'Standard AUM', type: 'aum', billingFrequency: 'quarterly', clientCount: 145,
      tiers: [{ min: 0, max: 1000000, rate: 0.01 }, { min: 1000000, max: 5000000, rate: 0.0075 }, { min: 5000000, max: Infinity, rate: 0.005 }],
      minimumFee: 1500,
    },
    {
      id: 'sch-2', name: 'High Net Worth', type: 'tiered', billingFrequency: 'quarterly', clientCount: 42,
      tiers: [{ min: 0, max: 2000000, rate: 0.008 }, { min: 2000000, max: 10000000, rate: 0.006 }, { min: 10000000, max: Infinity, rate: 0.004 }],
      minimumFee: 5000,
    },
    { id: 'sch-3', name: 'Financial Planning', type: 'flat', flatAmount: 5000, billingFrequency: 'annual', clientCount: 28 },
    { id: 'sch-4', name: 'Consultation', type: 'hourly', hourlyRate: 350, billingFrequency: 'monthly', clientCount: 15 },
  ];

  const invoices: Invoice[] = [
    { id: 'inv-1', clientName: 'Johnson Family Trust', householdId: 'hh-1', period: 'Q4 2025', aum: 2450000, feeAmount: 6125, status: 'paid', dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), sentAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), scheduleId: 'sch-1' },
    { id: 'inv-2', clientName: 'Williams IRA', householdId: 'hh-2', period: 'Q4 2025', aum: 875000, feeAmount: 2187.50, status: 'sent', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), scheduleId: 'sch-1' },
    { id: 'inv-3', clientName: 'Chen Family Office', householdId: 'hh-3', period: 'Q4 2025', aum: 12500000, feeAmount: 15000, status: 'overdue', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), sentAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), scheduleId: 'sch-2' },
    { id: 'inv-4', clientName: 'Davis Revocable Trust', householdId: 'hh-4', period: 'Q4 2025', aum: 3200000, feeAmount: 6400, status: 'pending', dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), scheduleId: 'sch-1' },
    { id: 'inv-5', clientName: 'Martinez Planning', householdId: 'hh-5', period: '2025', aum: 0, feeAmount: 5000, status: 'draft', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), createdAt: new Date(), scheduleId: 'sch-3' },
    { id: 'inv-6', clientName: 'Thompson 401k', householdId: 'hh-6', period: 'Q4 2025', aum: 450000, feeAmount: 1500, status: 'disputed', dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), sentAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), scheduleId: 'sch-1' },
  ];

  const metrics: BillingMetrics = {
    totalBilled: 287000,
    collected: 245000,
    outstanding: 42000,
    overdue: 15000,
    averageFee: 2850,
    collectionRate: 85.4,
  };

  return { schedules, invoices, metrics };
};

// ============================================
// Sub-Components
// ============================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatShortCurrency = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return formatCurrency(amount);
};

const StatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const MetricCard: React.FC<{ label: string; value: string; subValue?: string; icon: React.ComponentType<any>; color: string }> = ({
  label, value, subValue, icon: Icon, color,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const FeeScheduleCard: React.FC<{ schedule: FeeSchedule; expanded: boolean; onToggle: () => void }> = ({
  schedule, expanded, onToggle,
}) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <CalculatorIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-left">
          <h4 className="font-medium text-gray-900 dark:text-white">{schedule.name}</h4>
          <p className="text-sm text-gray-500">{FEE_TYPE_LABELS[schedule.type]} • {schedule.billingFrequency}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{schedule.clientCount} clients</span>
        {expanded ? <ChevronDownIcon className="w-5 h-5 text-gray-400" /> : <ChevronRightIcon className="w-5 h-5 text-gray-400" />}
      </div>
    </button>
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden bg-gray-50 dark:bg-gray-900/50"
        >
          <div className="px-4 py-3 space-y-2">
            {schedule.tiers && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Fee Tiers</p>
                {schedule.tiers.map((tier, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600 dark:text-gray-300">
                      {formatShortCurrency(tier.min)} - {tier.max === Infinity ? '∞' : formatShortCurrency(tier.max)}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{(tier.rate * 100).toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            )}
            {schedule.flatAmount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Flat Fee</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(schedule.flatAmount)}</span>
              </div>
            )}
            {schedule.hourlyRate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hourly Rate</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(schedule.hourlyRate)}/hr</span>
              </div>
            )}
            {schedule.minimumFee && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Minimum Fee</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(schedule.minimumFee)}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const InvoiceRow: React.FC<{ invoice: Invoice; onView: () => void }> = ({ invoice, onView }) => (
  <div className="px-6 py-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">{invoice.clientName}</h4>
        <StatusBadge status={invoice.status} />
      </div>
      <p className="text-sm text-gray-500">
        {invoice.period} • {invoice.aum > 0 ? `AUM: ${formatShortCurrency(invoice.aum)}` : 'Fixed Fee'}
      </p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(invoice.feeAmount)}</p>
      <p className="text-xs text-gray-500">Due: {invoice.dueDate.toLocaleDateString()}</p>
    </div>
    <button onClick={onView} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
      <EyeIcon className="w-5 h-5" />
    </button>
  </div>
);

// ============================================
// Main Component
// ============================================

export const FeeBillingEngine: React.FC<FeeBillingEngineProps> = ({
  className = '',
  onGenerateInvoices,
  onViewInvoice,
}) => {
  const [data] = useState(() => generateMockData());
  const [activeTab, setActiveTab] = useState<'invoices' | 'schedules'>('invoices');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return data.invoices;
    return data.invoices.filter(inv => inv.status === statusFilter);
  }, [data.invoices, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<InvoiceStatus, number> = { draft: 0, pending: 0, sent: 0, paid: 0, overdue: 0, disputed: 0 };
    data.invoices.forEach(inv => counts[inv.status]++);
    return counts;
  }, [data.invoices]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Billing Engine</h1>
          <p className="text-gray-500 mt-1">Manage fee schedules and generate invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onGenerateInvoices}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Generate Invoices
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Billed" value={formatShortCurrency(data.metrics.totalBilled)} subValue="This quarter" icon={BanknotesIcon} color="bg-blue-100 text-blue-600" />
        <MetricCard label="Collected" value={formatShortCurrency(data.metrics.collected)} subValue={`${data.metrics.collectionRate}% rate`} icon={CheckCircleIcon} color="bg-green-100 text-green-600" />
        <MetricCard label="Outstanding" value={formatShortCurrency(data.metrics.outstanding)} icon={ClockIcon} color="bg-yellow-100 text-yellow-600" />
        <MetricCard label="Overdue" value={formatShortCurrency(data.metrics.overdue)} icon={ExclamationTriangleIcon} color="bg-red-100 text-red-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'invoices' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Invoices ({data.invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'schedules' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Fee Schedules ({data.schedules.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'invoices' && (
          <motion.div
            key="invoices"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({data.invoices.length})
              </button>
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as InvoiceStatus)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {STATUS_CONFIG[status as InvoiceStatus].label} ({count})
                </button>
              ))}
            </div>

            {/* Invoice List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {filteredInvoices.map(invoice => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onView={() => onViewInvoice?.(invoice)}
                />
              ))}
              {filteredInvoices.length === 0 && (
                <div className="px-6 py-12 text-center text-gray-500">No invoices match the selected filter</div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'schedules' && (
          <motion.div
            key="schedules"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {data.schedules.map(schedule => (
              <FeeScheduleCard
                key={schedule.id}
                schedule={schedule}
                expanded={expandedSchedule === schedule.id}
                onToggle={() => setExpandedSchedule(expandedSchedule === schedule.id ? null : schedule.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeeBillingEngine;
