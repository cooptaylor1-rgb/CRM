'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  LockClosedIcon,
  KeyIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
  FlagIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPES
// =============================================================================

type AuditEventType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'login'
  | 'logout'
  | 'permission_change'
  | 'bulk_action'
  | 'compliance_check'
  | 'approval'
  | 'rejection';

type EntityType = 'client' | 'deal' | 'contact' | 'document' | 'user' | 'system' | 'report';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending_review' | 'exempted';

interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  changes?: {
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }[];
  metadata?: Record<string, unknown>;
  riskLevel: RiskLevel;
  flagged: boolean;
  notes?: string;
}

interface ComplianceCheckpoint {
  id: string;
  name: string;
  description: string;
  category: 'data_protection' | 'financial' | 'regulatory' | 'internal_policy' | 'security';
  frequency: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastChecked: string;
  nextCheck: string;
  status: ComplianceStatus;
  automatedCheck: boolean;
  ruleDefinition?: string;
  passRate: number;
  totalChecks: number;
  failedItems: number;
}

interface ComplianceReport {
  id: string;
  name: string;
  type: 'audit_log' | 'compliance_summary' | 'access_report' | 'change_log' | 'risk_assessment';
  generatedAt: string;
  generatedBy: string;
  dateRange: { start: string; end: string };
  format: 'pdf' | 'csv' | 'excel';
  size: string;
  downloadUrl?: string;
}

interface DataRetentionPolicy {
  id: string;
  entityType: EntityType;
  retentionPeriod: number; // days
  autoDelete: boolean;
  archiveFirst: boolean;
  exemptCategories: string[];
  lastEnforced: string;
  recordsAffected: number;
}

interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  accessType: 'view' | 'edit' | 'download' | 'share';
  resourceType: EntityType;
  resourceId: string;
  resourceName: string;
  timestamp: string;
  duration?: number; // seconds
  sensitiveData: boolean;
}

interface ComplianceAlert {
  id: string;
  type: 'violation' | 'warning' | 'info';
  title: string;
  description: string;
  checkpoint?: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
  assignedTo?: string;
}

// =============================================================================
// CONSTANTS & SAMPLE DATA
// =============================================================================

const EVENT_TYPE_CONFIG: Record<AuditEventType, { label: string; icon: typeof EyeIcon; color: string }> = {
  create: { label: 'Created', icon: PlusIcon, color: 'text-status-success' },
  read: { label: 'Viewed', icon: EyeIcon, color: 'text-status-info' },
  update: { label: 'Updated', icon: PencilIcon, color: 'text-status-warning' },
  delete: { label: 'Deleted', icon: TrashIcon, color: 'text-status-error' },
  export: { label: 'Exported', icon: DocumentArrowDownIcon, color: 'text-accent-primary' },
  login: { label: 'Logged In', icon: KeyIcon, color: 'text-status-success' },
  logout: { label: 'Logged Out', icon: ArrowTopRightOnSquareIcon, color: 'text-neutral-500' },
  permission_change: { label: 'Permissions Changed', icon: LockClosedIcon, color: 'text-status-warning' },
  bulk_action: { label: 'Bulk Action', icon: ClipboardDocumentCheckIcon, color: 'text-accent-primary' },
  compliance_check: { label: 'Compliance Check', icon: ShieldCheckIcon, color: 'text-status-info' },
  approval: { label: 'Approved', icon: CheckCircleIcon, color: 'text-status-success' },
  rejection: { label: 'Rejected', icon: XCircleIcon, color: 'text-status-error' },
};

const ENTITY_TYPE_CONFIG: Record<EntityType, { label: string; color: string }> = {
  client: { label: 'Client', color: 'bg-blue-100 text-blue-700' },
  deal: { label: 'Deal', color: 'bg-green-100 text-green-700' },
  contact: { label: 'Contact', color: 'bg-purple-100 text-purple-700' },
  document: { label: 'Document', color: 'bg-yellow-100 text-yellow-700' },
  user: { label: 'User', color: 'bg-pink-100 text-pink-700' },
  system: { label: 'System', color: 'bg-gray-100 text-gray-700' },
  report: { label: 'Report', color: 'bg-indigo-100 text-indigo-700' },
};

const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-status-success', bgColor: 'bg-status-success/10' },
  medium: { label: 'Medium', color: 'text-status-warning', bgColor: 'bg-status-warning/10' },
  high: { label: 'High', color: 'text-status-error', bgColor: 'bg-status-error/10' },
  critical: { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const COMPLIANCE_STATUS_CONFIG: Record<ComplianceStatus, { label: string; color: string; icon: typeof CheckCircleIcon }> = {
  compliant: { label: 'Compliant', color: 'text-status-success', icon: CheckCircleIcon },
  non_compliant: { label: 'Non-Compliant', color: 'text-status-error', icon: XCircleIcon },
  pending_review: { label: 'Pending Review', color: 'text-status-warning', icon: ClockIcon },
  exempted: { label: 'Exempted', color: 'text-neutral-500', icon: InformationCircleIcon },
};

const SAMPLE_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'ae1',
    timestamp: '2024-01-20T14:32:15Z',
    eventType: 'update',
    entityType: 'client',
    entityId: 'c123',
    entityName: 'Acme Corporation',
    userId: 'u1',
    userName: 'Sarah Johnson',
    userEmail: 'sarah.j@company.com',
    ipAddress: '192.168.1.45',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    changes: [
      { field: 'risk_rating', oldValue: 'low', newValue: 'medium' },
      { field: 'aum', oldValue: '2500000', newValue: '3200000' },
    ],
    riskLevel: 'low',
    flagged: false,
  },
  {
    id: 'ae2',
    timestamp: '2024-01-20T14:28:42Z',
    eventType: 'export',
    entityType: 'report',
    entityId: 'r456',
    entityName: 'Q4 Portfolio Performance Report',
    userId: 'u2',
    userName: 'Mike Chen',
    userEmail: 'mike.c@company.com',
    ipAddress: '192.168.1.87',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    metadata: { format: 'pdf', includesSensitiveData: true },
    riskLevel: 'medium',
    flagged: true,
    notes: 'Contains sensitive client financial data',
  },
  {
    id: 'ae3',
    timestamp: '2024-01-20T14:15:03Z',
    eventType: 'delete',
    entityType: 'document',
    entityId: 'd789',
    entityName: 'Legacy Investment Agreement',
    userId: 'u3',
    userName: 'Lisa Park',
    userEmail: 'lisa.p@company.com',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    riskLevel: 'high',
    flagged: true,
    notes: 'Document deletion requires manager approval',
  },
  {
    id: 'ae4',
    timestamp: '2024-01-20T13:45:22Z',
    eventType: 'permission_change',
    entityType: 'user',
    entityId: 'u4',
    entityName: 'David Kim',
    userId: 'u1',
    userName: 'Sarah Johnson',
    userEmail: 'sarah.j@company.com',
    ipAddress: '192.168.1.45',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    changes: [
      { field: 'role', oldValue: 'advisor', newValue: 'senior_advisor' },
      { field: 'permissions.can_export', oldValue: 'false', newValue: 'true' },
    ],
    riskLevel: 'medium',
    flagged: false,
  },
  {
    id: 'ae5',
    timestamp: '2024-01-20T12:30:00Z',
    eventType: 'bulk_action',
    entityType: 'client',
    entityId: 'bulk_001',
    entityName: '15 Client Records',
    userId: 'u2',
    userName: 'Mike Chen',
    userEmail: 'mike.c@company.com',
    ipAddress: '192.168.1.87',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    metadata: { action: 'update_status', affected_count: 15 },
    riskLevel: 'high',
    flagged: true,
    notes: 'Bulk modification of client statuses',
  },
  {
    id: 'ae6',
    timestamp: '2024-01-20T11:15:45Z',
    eventType: 'login',
    entityType: 'system',
    entityId: 'session_123',
    entityName: 'System Login',
    userId: 'u5',
    userName: 'Emma Stone',
    userEmail: 'emma.s@company.com',
    ipAddress: '203.45.67.89',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)',
    metadata: { location: 'New York, US', device: 'mobile' },
    riskLevel: 'low',
    flagged: false,
  },
];

const SAMPLE_CHECKPOINTS: ComplianceCheckpoint[] = [
  {
    id: 'cp1',
    name: 'KYC Documentation Complete',
    description: 'Verify all clients have complete Know Your Customer documentation',
    category: 'regulatory',
    frequency: 'daily',
    lastChecked: '2024-01-20T08:00:00Z',
    nextCheck: '2024-01-21T08:00:00Z',
    status: 'compliant',
    automatedCheck: true,
    passRate: 98.5,
    totalChecks: 1250,
    failedItems: 19,
  },
  {
    id: 'cp2',
    name: 'Data Encryption Standards',
    description: 'Ensure all sensitive data is encrypted at rest and in transit',
    category: 'security',
    frequency: 'real_time',
    lastChecked: '2024-01-20T14:30:00Z',
    nextCheck: '2024-01-20T14:35:00Z',
    status: 'compliant',
    automatedCheck: true,
    passRate: 100,
    totalChecks: 45000,
    failedItems: 0,
  },
  {
    id: 'cp3',
    name: 'Suitability Assessment Review',
    description: 'Review client investment suitability assessments quarterly',
    category: 'financial',
    frequency: 'quarterly',
    lastChecked: '2024-01-15T10:00:00Z',
    nextCheck: '2024-04-15T10:00:00Z',
    status: 'pending_review',
    automatedCheck: false,
    passRate: 92.3,
    totalChecks: 420,
    failedItems: 32,
  },
  {
    id: 'cp4',
    name: 'Access Rights Audit',
    description: 'Audit user access rights and permissions monthly',
    category: 'internal_policy',
    frequency: 'monthly',
    lastChecked: '2024-01-01T09:00:00Z',
    nextCheck: '2024-02-01T09:00:00Z',
    status: 'non_compliant',
    automatedCheck: false,
    ruleDefinition: 'All users must have appropriate access levels reviewed',
    passRate: 85.2,
    totalChecks: 48,
    failedItems: 7,
  },
  {
    id: 'cp5',
    name: 'GDPR Data Processing',
    description: 'Verify GDPR compliance for EU client data processing',
    category: 'data_protection',
    frequency: 'weekly',
    lastChecked: '2024-01-18T06:00:00Z',
    nextCheck: '2024-01-25T06:00:00Z',
    status: 'compliant',
    automatedCheck: true,
    passRate: 99.8,
    totalChecks: 8500,
    failedItems: 17,
  },
];

const SAMPLE_REPORTS: ComplianceReport[] = [
  {
    id: 'rpt1',
    name: 'January 2024 Audit Log',
    type: 'audit_log',
    generatedAt: '2024-01-20T12:00:00Z',
    generatedBy: 'Sarah Johnson',
    dateRange: { start: '2024-01-01', end: '2024-01-20' },
    format: 'pdf',
    size: '2.4 MB',
  },
  {
    id: 'rpt2',
    name: 'Q4 2023 Compliance Summary',
    type: 'compliance_summary',
    generatedAt: '2024-01-05T09:00:00Z',
    generatedBy: 'Compliance Team',
    dateRange: { start: '2023-10-01', end: '2023-12-31' },
    format: 'pdf',
    size: '5.8 MB',
  },
  {
    id: 'rpt3',
    name: 'User Access Report - January',
    type: 'access_report',
    generatedAt: '2024-01-19T15:30:00Z',
    generatedBy: 'Mike Chen',
    dateRange: { start: '2024-01-01', end: '2024-01-19' },
    format: 'excel',
    size: '1.2 MB',
  },
  {
    id: 'rpt4',
    name: 'Risk Assessment 2024',
    type: 'risk_assessment',
    generatedAt: '2024-01-10T10:00:00Z',
    generatedBy: 'Risk Committee',
    dateRange: { start: '2023-01-01', end: '2023-12-31' },
    format: 'pdf',
    size: '8.3 MB',
  },
];

const SAMPLE_ALERTS: ComplianceAlert[] = [
  {
    id: 'alert1',
    type: 'violation',
    title: 'Failed Access Rights Audit',
    description: '7 users have excessive permissions that need review',
    checkpoint: 'Access Rights Audit',
    timestamp: '2024-01-20T10:00:00Z',
    acknowledged: false,
  },
  {
    id: 'alert2',
    type: 'warning',
    title: 'KYC Documentation Expiring',
    description: '12 clients have KYC documents expiring in the next 30 days',
    checkpoint: 'KYC Documentation Complete',
    timestamp: '2024-01-20T08:15:00Z',
    acknowledged: true,
    assignedTo: 'Lisa Park',
  },
  {
    id: 'alert3',
    type: 'info',
    title: 'Quarterly Review Due',
    description: 'Suitability assessment review scheduled for January 25th',
    checkpoint: 'Suitability Assessment Review',
    timestamp: '2024-01-19T14:00:00Z',
    acknowledged: true,
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// =============================================================================
// AUDIT EVENT LIST COMPONENT
// =============================================================================

interface AuditEventListProps {
  events: AuditEvent[];
  onEventClick?: (event: AuditEvent) => void;
  onFlagToggle?: (eventId: string, flagged: boolean) => void;
}

function AuditEventList({ events, onEventClick, onFlagToggle }: AuditEventListProps) {
  const [filter, setFilter] = useState<{
    eventType: AuditEventType | 'all';
    entityType: EntityType | 'all';
    riskLevel: RiskLevel | 'all';
    flaggedOnly: boolean;
  }>({
    eventType: 'all',
    entityType: 'all',
    riskLevel: 'all',
    flaggedOnly: false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filter.eventType !== 'all' && event.eventType !== filter.eventType) return false;
      if (filter.entityType !== 'all' && event.entityType !== filter.entityType) return false;
      if (filter.riskLevel !== 'all' && event.riskLevel !== filter.riskLevel) return false;
      if (filter.flaggedOnly && !event.flagged) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          event.entityName.toLowerCase().includes(query) ||
          event.userName.toLowerCase().includes(query) ||
          event.userEmail.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [events, filter, searchQuery]);

  return (
    <div className="bg-white rounded-lg border border-neutral-200">
      {/* Header & Filters */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-accent-primary" />
            <h3 className="font-semibold text-neutral-900">Audit Trail</h3>
          </div>
          <span className="text-sm text-neutral-500">
            {filteredEvents.length} events
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, user, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filter.eventType}
            onChange={(e) => setFilter({ ...filter, eventType: e.target.value as AuditEventType | 'all' })}
            className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-accent-primary/20"
          >
            <option value="all">All Events</option>
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            value={filter.entityType}
            onChange={(e) => setFilter({ ...filter, entityType: e.target.value as EntityType | 'all' })}
            className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-accent-primary/20"
          >
            <option value="all">All Entities</option>
            {Object.entries(ENTITY_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            value={filter.riskLevel}
            onChange={(e) => setFilter({ ...filter, riskLevel: e.target.value as RiskLevel | 'all' })}
            className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-accent-primary/20"
          >
            <option value="all">All Risk Levels</option>
            {Object.entries(RISK_LEVEL_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-neutral-600 px-3 py-1.5 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
            <input
              type="checkbox"
              checked={filter.flaggedOnly}
              onChange={(e) => setFilter({ ...filter, flaggedOnly: e.target.checked })}
              className="rounded border-neutral-300 text-accent-primary focus:ring-accent-primary/20"
            />
            Flagged Only
          </label>
        </div>
      </div>

      {/* Event List */}
      <div className="divide-y divide-neutral-100 max-h-[600px] overflow-y-auto">
        {filteredEvents.map((event) => {
          const eventConfig = EVENT_TYPE_CONFIG[event.eventType];
          const entityConfig = ENTITY_TYPE_CONFIG[event.entityType];
          const riskConfig = RISK_LEVEL_CONFIG[event.riskLevel];
          const EventIcon = eventConfig.icon;

          return (
            <div key={event.id} className="hover:bg-neutral-50 transition-colors">
              <button
                onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${riskConfig.bgColor}`}>
                    <EventIcon className={`h-4 w-4 ${eventConfig.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${eventConfig.color}`}>
                        {eventConfig.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${entityConfig.color}`}>
                        {entityConfig.label}
                      </span>
                      {event.flagged && (
                        <FlagIcon className="h-4 w-4 text-status-error" />
                      )}
                    </div>
                    <div className="text-sm text-neutral-900 font-medium truncate">
                      {event.entityName}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {event.userName} · {getRelativeTime(event.timestamp)}
                    </div>
                  </div>

                  {/* Risk Badge & Expand */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${riskConfig.bgColor} ${riskConfig.color}`}>
                      {riskConfig.label}
                    </span>
                    <ChevronRightIcon
                      className={`h-4 w-4 text-neutral-400 transition-transform ${
                        expandedEvent === event.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedEvent === event.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* User Details */}
                      <div className="bg-neutral-50 rounded-lg p-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-neutral-500">User:</span>{' '}
                            <span className="text-neutral-900">{event.userName}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Email:</span>{' '}
                            <span className="text-neutral-900">{event.userEmail}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">IP:</span>{' '}
                            <span className="text-neutral-900 font-mono text-xs">{event.ipAddress}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Time:</span>{' '}
                            <span className="text-neutral-900">{formatTimestamp(event.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Changes */}
                      {event.changes && event.changes.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-neutral-500 uppercase">Changes</h4>
                          <div className="space-y-1">
                            {event.changes.map((change, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className="text-neutral-600 font-medium">{change.field}:</span>
                                <span className="text-status-error line-through">{change.oldValue || 'null'}</span>
                                <span className="text-neutral-400">→</span>
                                <span className="text-status-success">{change.newValue || 'null'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {event.notes && (
                        <div className="p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <InformationCircleIcon className="h-4 w-4 text-status-warning flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-neutral-700">{event.notes}</span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onFlagToggle?.(event.id, !event.flagged);
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            event.flagged
                              ? 'bg-status-error/10 text-status-error hover:bg-status-error/20'
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          <FlagIcon className="h-4 w-4" />
                          {event.flagged ? 'Unflag' : 'Flag'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-lg text-sm transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="p-8 text-center text-neutral-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>No audit events match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// COMPLIANCE CHECKPOINTS COMPONENT
// =============================================================================

interface ComplianceCheckpointsProps {
  checkpoints: ComplianceCheckpoint[];
  onCheckpointClick?: (checkpoint: ComplianceCheckpoint) => void;
  onRunCheck?: (checkpointId: string) => void;
}

function ComplianceCheckpoints({ checkpoints, onCheckpointClick, onRunCheck }: ComplianceCheckpointsProps) {
  const [expandedCheckpoint, setExpandedCheckpoint] = useState<string | null>(null);

  const categoryGroups = useMemo(() => {
    const groups: Record<string, ComplianceCheckpoint[]> = {};
    checkpoints.forEach((cp) => {
      if (!groups[cp.category]) groups[cp.category] = [];
      groups[cp.category].push(cp);
    });
    return groups;
  }, [checkpoints]);

  const overallCompliance = useMemo(() => {
    const compliant = checkpoints.filter((cp) => cp.status === 'compliant').length;
    return (compliant / checkpoints.length) * 100;
  }, [checkpoints]);

  return (
    <div className="bg-white rounded-lg border border-neutral-200">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-accent-primary" />
            <h3 className="font-semibold text-neutral-900">Compliance Checkpoints</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm text-neutral-500">Overall Compliance</div>
              <div className={`text-lg font-bold ${overallCompliance >= 90 ? 'text-status-success' : overallCompliance >= 70 ? 'text-status-warning' : 'text-status-error'}`}>
                {overallCompliance.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Progress Bar */}
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${overallCompliance >= 90 ? 'bg-status-success' : overallCompliance >= 70 ? 'bg-status-warning' : 'bg-status-error'}`}
            initial={{ width: 0 }}
            animate={{ width: `${overallCompliance}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="divide-y divide-neutral-100">
        {Object.entries(categoryGroups).map(([category, cps]) => (
          <div key={category} className="p-4">
            <h4 className="text-sm font-medium text-neutral-700 capitalize mb-3">
              {category.replace(/_/g, ' ')}
            </h4>
            <div className="space-y-2">
              {cps.map((checkpoint) => {
                const statusConfig = COMPLIANCE_STATUS_CONFIG[checkpoint.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <div key={checkpoint.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedCheckpoint(expandedCheckpoint === checkpoint.id ? null : checkpoint.id)}
                      className="w-full p-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                        <div className="text-left">
                          <div className="font-medium text-neutral-900">{checkpoint.name}</div>
                          <div className="text-xs text-neutral-500">
                            {checkpoint.automatedCheck ? 'Automated' : 'Manual'} · {checkpoint.frequency}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {checkpoint.passRate.toFixed(1)}% pass rate
                          </div>
                        </div>
                        <ChevronRightIcon
                          className={`h-4 w-4 text-neutral-400 transition-transform ${
                            expandedCheckpoint === checkpoint.id ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedCheckpoint === checkpoint.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-3 border-t border-neutral-100 pt-3">
                            <p className="text-sm text-neutral-600">{checkpoint.description}</p>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-neutral-500">Last Checked:</span>
                                <div className="text-neutral-900">{formatDate(checkpoint.lastChecked)}</div>
                              </div>
                              <div>
                                <span className="text-neutral-500">Next Check:</span>
                                <div className="text-neutral-900">{formatDate(checkpoint.nextCheck)}</div>
                              </div>
                              <div>
                                <span className="text-neutral-500">Failed Items:</span>
                                <div className={checkpoint.failedItems > 0 ? 'text-status-error font-medium' : 'text-neutral-900'}>
                                  {checkpoint.failedItems} of {checkpoint.totalChecks}
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-neutral-500">Pass Rate</span>
                                <span className="text-xs font-medium text-neutral-900">
                                  {checkpoint.passRate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    checkpoint.passRate >= 95 ? 'bg-status-success' :
                                    checkpoint.passRate >= 85 ? 'bg-status-warning' : 'bg-status-error'
                                  }`}
                                  style={{ width: `${checkpoint.passRate}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              {checkpoint.automatedCheck && onRunCheck && (
                                <button
                                  onClick={() => onRunCheck(checkpoint.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm hover:bg-accent-primary/90 transition-colors"
                                >
                                  <ArrowPathIcon className="h-4 w-4" />
                                  Run Check Now
                                </button>
                              )}
                              <button
                                onClick={() => onCheckpointClick?.(checkpoint)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-sm hover:bg-neutral-200 transition-colors"
                              >
                                <EyeIcon className="h-4 w-4" />
                                View Details
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// REPORTS LIST COMPONENT
// =============================================================================

interface ReportsListProps {
  reports: ComplianceReport[];
  onDownload?: (report: ComplianceReport) => void;
  onGenerate?: () => void;
}

function ReportsList({ reports, onDownload, onGenerate }: ReportsListProps) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200">
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-neutral-900">Compliance Reports</h3>
        </div>
        {onGenerate && (
          <button
            onClick={onGenerate}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm hover:bg-accent-primary/90 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Generate Report
          </button>
        )}
      </div>

      <div className="divide-y divide-neutral-100">
        {reports.map((report) => (
          <div key={report.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-primary/10 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-accent-primary" />
              </div>
              <div>
                <div className="font-medium text-neutral-900">{report.name}</div>
                <div className="text-xs text-neutral-500">
                  {formatDate(report.generatedAt)} · {report.generatedBy} · {report.size}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded uppercase">
                {report.format}
              </span>
              {onDownload && (
                <button
                  onClick={() => onDownload(report)}
                  className="p-2 text-neutral-500 hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="p-8 text-center text-neutral-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>No reports generated yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ALERTS PANEL COMPONENT
// =============================================================================

interface AlertsPanelProps {
  alerts: ComplianceAlert[];
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}

function AlertsPanel({ alerts, onAcknowledge, onResolve }: AlertsPanelProps) {
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="bg-white rounded-lg border border-neutral-200">
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellAlertIcon className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-neutral-900">Compliance Alerts</h3>
          {unacknowledgedCount > 0 && (
            <span className="px-2 py-0.5 bg-status-error text-white text-xs rounded-full">
              {unacknowledgedCount}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-neutral-100 max-h-[400px] overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 ${!alert.acknowledged ? 'bg-status-error/5' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                alert.type === 'violation' ? 'bg-status-error/10' :
                alert.type === 'warning' ? 'bg-status-warning/10' : 'bg-status-info/10'
              }`}>
                {alert.type === 'violation' ? (
                  <XCircleIcon className="h-4 w-4 text-status-error" />
                ) : alert.type === 'warning' ? (
                  <ExclamationTriangleIcon className="h-4 w-4 text-status-warning" />
                ) : (
                  <InformationCircleIcon className="h-4 w-4 text-status-info" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-neutral-900">{alert.title}</div>
                <div className="text-sm text-neutral-600 mt-1">{alert.description}</div>
                <div className="text-xs text-neutral-500 mt-2">
                  {getRelativeTime(alert.timestamp)}
                  {alert.checkpoint && ` · ${alert.checkpoint}`}
                  {alert.assignedTo && ` · Assigned to ${alert.assignedTo}`}
                </div>
                {!alert.acknowledged && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => onAcknowledge?.(alert.id)}
                      className="text-xs px-3 py-1.5 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      Acknowledge
                    </button>
                    {alert.type === 'violation' && (
                      <button
                        onClick={() => onResolve?.(alert.id)}
                        className="text-xs px-3 py-1.5 bg-accent-primary text-white hover:bg-accent-primary/90 rounded-lg transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="p-8 text-center text-neutral-500">
            <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-status-success" />
            <p>No active alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SUMMARY STATS COMPONENT
// =============================================================================

interface SummaryStatsProps {
  events: AuditEvent[];
  checkpoints: ComplianceCheckpoint[];
  alerts: ComplianceAlert[];
}

function SummaryStats({ events, checkpoints, alerts }: SummaryStatsProps) {
  const highRiskEvents = events.filter((e) => e.riskLevel === 'high' || e.riskLevel === 'critical').length;
  const flaggedEvents = events.filter((e) => e.flagged).length;
  const complianceRate = (checkpoints.filter((c) => c.status === 'compliant').length / checkpoints.length) * 100;
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-500">Total Events</span>
          <ClockIcon className="h-4 w-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold text-neutral-900">{events.length}</div>
        <div className="text-xs text-neutral-500 mt-1">Last 24 hours</div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-500">High Risk Events</span>
          <ExclamationTriangleIcon className="h-4 w-4 text-status-error" />
        </div>
        <div className={`text-2xl font-bold ${highRiskEvents > 0 ? 'text-status-error' : 'text-status-success'}`}>
          {highRiskEvents}
        </div>
        <div className="text-xs text-neutral-500 mt-1">{flaggedEvents} flagged</div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-500">Compliance Rate</span>
          <ShieldCheckIcon className="h-4 w-4 text-status-success" />
        </div>
        <div className={`text-2xl font-bold ${complianceRate >= 90 ? 'text-status-success' : complianceRate >= 70 ? 'text-status-warning' : 'text-status-error'}`}>
          {complianceRate.toFixed(1)}%
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          {checkpoints.filter((c) => c.status === 'compliant').length} of {checkpoints.length} passing
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-500">Active Alerts</span>
          <BellAlertIcon className="h-4 w-4 text-status-warning" />
        </div>
        <div className={`text-2xl font-bold ${activeAlerts > 0 ? 'text-status-warning' : 'text-status-success'}`}>
          {activeAlerts}
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          {alerts.filter((a) => a.type === 'violation').length} violations
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

export interface ComplianceAuditDashboardProps {
  auditEvents?: AuditEvent[];
  checkpoints?: ComplianceCheckpoint[];
  reports?: ComplianceReport[];
  alerts?: ComplianceAlert[];
  onEventClick?: (event: AuditEvent) => void;
  onEventFlagToggle?: (eventId: string, flagged: boolean) => void;
  onCheckpointClick?: (checkpoint: ComplianceCheckpoint) => void;
  onRunCheck?: (checkpointId: string) => void;
  onReportDownload?: (report: ComplianceReport) => void;
  onReportGenerate?: () => void;
  onAlertAcknowledge?: (alertId: string) => void;
  onAlertResolve?: (alertId: string) => void;
  onRefresh?: () => void;
}

export function ComplianceAuditDashboard({
  auditEvents = SAMPLE_AUDIT_EVENTS,
  checkpoints = SAMPLE_CHECKPOINTS,
  reports = SAMPLE_REPORTS,
  alerts = SAMPLE_ALERTS,
  onEventClick,
  onEventFlagToggle,
  onCheckpointClick,
  onRunCheck,
  onReportDownload,
  onReportGenerate,
  onAlertAcknowledge,
  onAlertResolve,
  onRefresh,
}: ComplianceAuditDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'checkpoints' | 'reports'>(
    'overview'
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ShieldCheckIcon },
    { id: 'audit', label: 'Audit Trail', icon: ClockIcon },
    { id: 'checkpoints', label: 'Checkpoints', icon: ClipboardDocumentCheckIcon },
    { id: 'reports', label: 'Reports', icon: DocumentTextIcon },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Compliance & Audit</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Monitor compliance status, review audit trails, and generate reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Refresh data"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          )}
          {onReportGenerate && (
            <button
              onClick={onReportGenerate}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Generate Report
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <SummaryStats events={auditEvents} checkpoints={checkpoints} alerts={alerts} />

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <ComplianceCheckpoints
                  checkpoints={checkpoints}
                  onCheckpointClick={onCheckpointClick}
                  onRunCheck={onRunCheck}
                />
              </div>
              <div>
                <AlertsPanel
                  alerts={alerts}
                  onAcknowledge={onAlertAcknowledge}
                  onResolve={onAlertResolve}
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AuditEventList
              events={auditEvents}
              onEventClick={onEventClick}
              onFlagToggle={onEventFlagToggle}
            />
          </motion.div>
        )}

        {activeTab === 'checkpoints' && (
          <motion.div
            key="checkpoints"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ComplianceCheckpoints
              checkpoints={checkpoints}
              onCheckpointClick={onCheckpointClick}
              onRunCheck={onRunCheck}
            />
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ReportsList
              reports={reports}
              onDownload={onReportDownload}
              onGenerate={onReportGenerate}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  AuditEventList,
  ComplianceCheckpoints,
  ReportsList,
  AlertsPanel,
  SummaryStats,
};

export type {
  AuditEventType,
  EntityType,
  RiskLevel,
  ComplianceStatus,
  AuditEvent,
  ComplianceCheckpoint,
  ComplianceReport,
  DataRetentionPolicy,
  AccessLog,
  ComplianceAlert,
};
