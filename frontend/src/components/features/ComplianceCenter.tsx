'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
  UserIcon,
  GiftIcon,
  BriefcaseIcon,
  MegaphoneIcon,
  DocumentMagnifyingGlassIcon,
  ChevronRightIcon,
  PlusIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// ============================================
// Types
// ============================================

export type ComplianceItemType = 'adv_crs' | 'advertising' | 'pre_clearance' | 'gift' | 'outside_activity' | 'audit';
export type ComplianceStatus = 'pending' | 'approved' | 'rejected' | 'in_review' | 'expired' | 'due_soon';

export interface ComplianceItem {
  id: string;
  type: ComplianceItemType;
  title: string;
  description: string;
  status: ComplianceStatus;
  submittedBy: string;
  submittedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  attachments?: string[];
  notes?: string;
}

export interface ComplianceDeadline {
  id: string;
  title: string;
  type: ComplianceItemType;
  dueDate: Date;
  status: 'upcoming' | 'due_today' | 'overdue' | 'completed';
  assignee: string;
}

export interface ComplianceCenterProps {
  className?: string;
  onItemClick?: (item: ComplianceItem) => void;
  onNewRequest?: (type: ComplianceItemType) => void;
}

// ============================================
// Constants & Mock Data
// ============================================

const TYPE_CONFIG: Record<ComplianceItemType, { label: string; icon: React.ComponentType<any>; color: string }> = {
  adv_crs: { label: 'ADV/CRS', icon: DocumentTextIcon, color: 'text-blue-600 bg-blue-50' },
  advertising: { label: 'Advertising Review', icon: MegaphoneIcon, color: 'text-purple-600 bg-purple-50' },
  pre_clearance: { label: 'Pre-Clearance', icon: ShieldCheckIcon, color: 'text-green-600 bg-green-50' },
  gift: { label: 'Gift & Entertainment', icon: GiftIcon, color: 'text-pink-600 bg-pink-50' },
  outside_activity: { label: 'Outside Activity', icon: BriefcaseIcon, color: 'text-amber-600 bg-amber-50' },
  audit: { label: 'Audit Trail', icon: DocumentMagnifyingGlassIcon, color: 'text-gray-600 bg-gray-100' },
};

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
  pending: { label: 'Pending', color: 'text-yellow-600 bg-yellow-50', icon: ClockIcon },
  approved: { label: 'Approved', color: 'text-green-600 bg-green-50', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'text-red-600 bg-red-50', icon: XCircleIcon },
  in_review: { label: 'In Review', color: 'text-blue-600 bg-blue-50', icon: ArrowPathIcon },
  expired: { label: 'Expired', color: 'text-gray-600 bg-gray-100', icon: XCircleIcon },
  due_soon: { label: 'Due Soon', color: 'text-orange-600 bg-orange-50', icon: ExclamationTriangleIcon },
};

const generateMockData = (): { items: ComplianceItem[]; deadlines: ComplianceDeadline[] } => {
  const items: ComplianceItem[] = [
    { id: '1', type: 'pre_clearance', title: 'AAPL Stock Purchase', description: 'Request to purchase 100 shares of Apple Inc.', status: 'pending', submittedBy: 'John Smith', submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), priority: 'medium' },
    { id: '2', type: 'advertising', title: 'Q1 Newsletter', description: 'Review quarterly client newsletter before distribution', status: 'in_review', submittedBy: 'Sarah Johnson', submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), priority: 'high' },
    { id: '3', type: 'gift', title: 'Client Dinner - Johnson Family', description: 'Annual appreciation dinner at The Capital Grille, estimated $450', status: 'approved', submittedBy: 'Michael Chen', submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), reviewedBy: 'Compliance Officer', reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), priority: 'low' },
    { id: '4', type: 'outside_activity', title: 'Board Member - Local Charity', description: 'Request to serve on board of Community Foundation', status: 'pending', submittedBy: 'Emily Davis', submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), priority: 'medium' },
    { id: '5', type: 'adv_crs', title: 'Annual ADV Amendment', description: 'Required annual update to Form ADV Part 2', status: 'due_soon', submittedBy: 'System', submittedAt: new Date(), dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), priority: 'critical' },
    { id: '6', type: 'pre_clearance', title: 'MSFT Options Trade', description: 'Request to sell covered calls on Microsoft position', status: 'rejected', submittedBy: 'Robert Wilson', submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), reviewedBy: 'Compliance Officer', reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), priority: 'high', notes: 'Conflict with client holdings' },
  ];

  const deadlines: ComplianceDeadline[] = [
    { id: 'd1', title: 'Form ADV Annual Amendment', type: 'adv_crs', dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), status: 'upcoming', assignee: 'Compliance Team' },
    { id: 'd2', title: 'Quarterly 13F Filing', type: 'audit', dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), status: 'upcoming', assignee: 'Operations' },
    { id: 'd3', title: 'Annual Compliance Review', type: 'audit', dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), status: 'upcoming', assignee: 'CCO' },
    { id: 'd4', title: 'Code of Ethics Certification', type: 'audit', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: 'due_today', assignee: 'All Employees' },
  ];

  return { items, deadlines };
};

// ============================================
// Sub-Components
// ============================================

const StatusBadge: React.FC<{ status: ComplianceStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: ComplianceItem['priority'] }> = ({ priority }) => {
  const colors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    critical: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const MetricCard: React.FC<{ label: string; value: number; icon: React.ComponentType<any>; color: string }> = ({
  label, value, icon: Icon, color,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  </div>
);

const DeadlineCard: React.FC<{ deadline: ComplianceDeadline }> = ({ deadline }) => {
  const daysUntil = Math.ceil((deadline.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const typeConfig = TYPE_CONFIG[deadline.type];
  const Icon = typeConfig.icon;

  return (
    <div className={`p-4 rounded-lg border ${
      deadline.status === 'overdue' ? 'border-red-200 bg-red-50' :
      deadline.status === 'due_today' ? 'border-orange-200 bg-orange-50' :
      'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{deadline.title}</h4>
          <p className="text-xs text-gray-500 mt-1">{deadline.assignee}</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${
            daysUntil <= 0 ? 'text-red-600' : daysUntil <= 7 ? 'text-orange-600' : 'text-gray-600'
          }`}>
            {daysUntil <= 0 ? 'Overdue' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
          </p>
          <p className="text-xs text-gray-400">{deadline.dueDate.toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

const ComplianceItemRow: React.FC<{ item: ComplianceItem; onClick: () => void }> = ({ item, onClick }) => {
  const typeConfig = TYPE_CONFIG[item.type];
  const Icon = typeConfig.icon;

  return (
    <motion.button
      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      onClick={onClick}
      className="w-full px-6 py-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 text-left"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">{item.title}</h4>
          <PriorityBadge priority={item.priority} />
        </div>
        <p className="text-sm text-gray-500 truncate">{item.description}</p>
        <p className="text-xs text-gray-400 mt-1">
          {item.submittedBy} • {new Date(item.submittedAt).toLocaleDateString()}
        </p>
      </div>
      <StatusBadge status={item.status} />
      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
    </motion.button>
  );
};

const NewRequestModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (type: ComplianceItemType) => void }> = ({
  isOpen, onClose, onSubmit,
}) => (
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
          className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Compliance Request</h2>
          <div className="space-y-2">
            {Object.entries(TYPE_CONFIG).filter(([key]) => key !== 'audit').map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => { onSubmit(key as ComplianceItemType); onClose(); }}
                  className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{config.label}</span>
                </button>
              );
            })}
          </div>
          <button onClick={onClose} className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================
// Main Component
// ============================================

export const ComplianceCenter: React.FC<ComplianceCenterProps> = ({
  className = '',
  onItemClick,
  onNewRequest,
}) => {
  const [data] = useState(() => generateMockData());
  const [filterType, setFilterType] = useState<ComplianceItemType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ComplianceStatus | 'all'>('all');
  const [showNewModal, setShowNewModal] = useState(false);

  const metrics = useMemo(() => ({
    pending: data.items.filter(i => i.status === 'pending' || i.status === 'in_review').length,
    approved: data.items.filter(i => i.status === 'approved').length,
    rejected: data.items.filter(i => i.status === 'rejected').length,
    dueSoon: data.deadlines.filter(d => d.status === 'due_today' || d.status === 'overdue').length,
  }), [data]);

  const filteredItems = useMemo(() => {
    return data.items.filter(item => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      return true;
    });
  }, [data.items, filterType, filterStatus]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance Center</h1>
          <p className="text-gray-500 mt-1">Manage regulatory requirements and approvals</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          New Request
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Pending Review" value={metrics.pending} icon={ClockIcon} color="bg-yellow-100 text-yellow-600" />
        <MetricCard label="Approved" value={metrics.approved} icon={CheckCircleIcon} color="bg-green-100 text-green-600" />
        <MetricCard label="Rejected" value={metrics.rejected} icon={XCircleIcon} color="bg-red-100 text-red-600" />
        <MetricCard label="Deadlines Due" value={metrics.dueSoon} icon={ExclamationTriangleIcon} color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            >
              <option value="all">All Types</option>
              {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredItems.map(item => (
              <ComplianceItemRow
                key={item.id}
                item={item}
                onClick={() => onItemClick?.(item)}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="px-6 py-12 text-center text-gray-500">
                No compliance items match your filters
              </div>
            )}
          </div>
        </div>

        {/* Deadlines Sidebar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Deadlines</h3>
          </div>
          <div className="space-y-3">
            {data.deadlines.map(deadline => (
              <DeadlineCard key={deadline.id} deadline={deadline} />
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <NewRequestModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={type => onNewRequest?.(type)}
      />
    </div>
  );
};

export default ComplianceCenter;
