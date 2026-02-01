'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  SegmentedDonutChart,
  Modal,
} from '@/components/ui';
import { 
  PlusIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  ArrowPathIcon,
  FunnelIcon,
  EyeIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/components/ui/utils';
import { format, formatDistanceToNow, addDays, isBefore, isWithinInterval } from 'date-fns';

// Types
interface ComplianceReview {
  id: string;
  householdId: string;
  householdName: string;
  reviewType: 'annual' | 'quarterly' | 'kyc_refresh' | 'suitability' | 'best_interest';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'scheduled';
  assignedTo: string;
  dueDate: string;
  completedDate?: string;
  notes?: string;
  riskLevel: 'low' | 'medium' | 'high';
  lastReviewDate?: string;
}

interface ComplianceAlert {
  id: string;
  type: 'expiring_document' | 'overdue_review' | 'regulatory_update' | 'risk_change' | 'audit_finding';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  householdId?: string;
  householdName?: string;
  createdAt: string;
  resolved: boolean;
}

interface RegulatoryRequirement {
  id: string;
  name: string;
  regulation: string;
  frequency: string;
  description: string;
  status: 'compliant' | 'attention' | 'non_compliant';
  nextDue?: string;
  lastCompleted?: string;
  completionRate: number;
}

// Mock data
const mockReviews: ComplianceReview[] = [
  {
    id: 'cr1',
    householdId: 'h1',
    householdName: 'Anderson Family',
    reviewType: 'annual',
    status: 'pending',
    assignedTo: 'Sarah Mitchell',
    dueDate: addDays(new Date(), 5).toISOString(),
    riskLevel: 'low',
    lastReviewDate: '2023-01-15',
  },
  {
    id: 'cr2',
    householdId: 'h2',
    householdName: 'Chen Family Trust',
    reviewType: 'kyc_refresh',
    status: 'overdue',
    assignedTo: 'James Wilson',
    dueDate: addDays(new Date(), -3).toISOString(),
    riskLevel: 'high',
    lastReviewDate: '2022-06-20',
  },
  {
    id: 'cr3',
    householdId: 'h3',
    householdName: 'Williams Household',
    reviewType: 'suitability',
    status: 'in_progress',
    assignedTo: 'Sarah Mitchell',
    dueDate: addDays(new Date(), 10).toISOString(),
    riskLevel: 'medium',
    lastReviewDate: '2023-09-01',
  },
  {
    id: 'cr4',
    householdId: 'h4',
    householdName: 'Thompson Partners',
    reviewType: 'quarterly',
    status: 'completed',
    assignedTo: 'Michael Chen',
    dueDate: addDays(new Date(), -2).toISOString(),
    completedDate: addDays(new Date(), -3).toISOString(),
    riskLevel: 'low',
    lastReviewDate: '2024-01-05',
  },
  {
    id: 'cr5',
    householdId: 'h5',
    householdName: 'Davis Family Office',
    reviewType: 'best_interest',
    status: 'scheduled',
    assignedTo: 'James Wilson',
    dueDate: addDays(new Date(), 15).toISOString(),
    riskLevel: 'medium',
    lastReviewDate: '2023-07-15',
  },
];

const mockAlerts: ComplianceAlert[] = [
  {
    id: 'a1',
    type: 'expiring_document',
    severity: 'warning',
    title: 'IMA Expiring Soon',
    description: 'Investment Management Agreement for Anderson Family expires in 30 days',
    householdId: 'h1',
    householdName: 'Anderson Family',
    createdAt: addDays(new Date(), -2).toISOString(),
    resolved: false,
  },
  {
    id: 'a2',
    type: 'overdue_review',
    severity: 'critical',
    title: 'KYC Review Overdue',
    description: 'Chen Family Trust KYC refresh is 3 days overdue',
    householdId: 'h2',
    householdName: 'Chen Family Trust',
    createdAt: addDays(new Date(), -3).toISOString(),
    resolved: false,
  },
  {
    id: 'a3',
    type: 'regulatory_update',
    severity: 'info',
    title: 'SEC Rule Change',
    description: 'New custody rule amendments effective March 2024 - Review required',
    createdAt: addDays(new Date(), -5).toISOString(),
    resolved: false,
  },
  {
    id: 'a4',
    type: 'risk_change',
    severity: 'warning',
    title: 'Risk Profile Change Detected',
    description: 'Williams Household portfolio drift may require suitability review',
    householdId: 'h3',
    householdName: 'Williams Household',
    createdAt: addDays(new Date(), -1).toISOString(),
    resolved: false,
  },
];

const mockRequirements: RegulatoryRequirement[] = [
  {
    id: 'req1',
    name: 'Annual Compliance Review',
    regulation: 'SEC Rule 206(4)-7',
    frequency: 'Annual',
    description: 'Annual review of compliance policies and procedures',
    status: 'compliant',
    lastCompleted: '2024-01-10',
    nextDue: '2025-01-10',
    completionRate: 100,
  },
  {
    id: 'req2',
    name: 'Customer Identification (KYC)',
    regulation: 'USA PATRIOT Act',
    frequency: 'Ongoing',
    description: 'Verify identity of customers and maintain records',
    status: 'attention',
    completionRate: 87,
  },
  {
    id: 'req3',
    name: 'Best Interest Documentation',
    regulation: 'Reg BI',
    frequency: 'Per Transaction',
    description: 'Document best interest analysis for recommendations',
    status: 'compliant',
    completionRate: 95,
  },
  {
    id: 'req4',
    name: 'Form ADV Updates',
    regulation: 'SEC Form ADV',
    frequency: 'Annual + Material Changes',
    description: 'Maintain current registration and brochure',
    status: 'compliant',
    lastCompleted: '2024-01-05',
    nextDue: '2025-01-05',
    completionRate: 100,
  },
  {
    id: 'req5',
    name: 'Custody Rule Compliance',
    regulation: 'SEC Rule 206(4)-2',
    frequency: 'Ongoing',
    description: 'Surprise examination and custodian statements',
    status: 'compliant',
    completionRate: 100,
  },
];

const statusStyles = {
  pending: { color: 'warning' as const, label: 'Pending' },
  in_progress: { color: 'info' as const, label: 'In Progress' },
  completed: { color: 'success' as const, label: 'Completed' },
  overdue: { color: 'error' as const, label: 'Overdue' },
  scheduled: { color: 'default' as const, label: 'Scheduled' },
};

const reviewTypeLabels: Record<string, string> = {
  annual: 'Annual Review',
  quarterly: 'Quarterly Review',
  kyc_refresh: 'KYC Refresh',
  suitability: 'Suitability Review',
  best_interest: 'Best Interest',
};

const alertSeverityStyles = {
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
};

export default function CompliancePage() {
  const searchParams = useSearchParams();
  const householdIdFilter = searchParams.get('householdId') || undefined;

  const [reviews, setReviews] = useState<ComplianceReview[]>(mockReviews);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>(mockAlerts);
  const [requirements] = useState<RegulatoryRequirement[]>(mockRequirements);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'alerts' | 'requirements'>('overview');

  useEffect(() => {
    if (householdIdFilter) {
      setActiveTab('reviews');
    }
  }, [householdIdFilter]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<ComplianceReview | null>(null);

  const stats = {
    pendingReviews: reviews.filter(r => r.status === 'pending').length,
    overdueReviews: reviews.filter(r => r.status === 'overdue').length,
    completedThisMonth: reviews.filter(r => r.status === 'completed').length,
    complianceScore: Math.round(
      requirements.reduce((sum, r) => sum + r.completionRate, 0) / requirements.length
    ),
    unresolvedAlerts: alerts.filter(a => !a.resolved).length,
    criticalAlerts: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
  };

  const reviewsByStatus = [
    { label: 'Completed', value: reviews.filter(r => r.status === 'completed').length, color: '#22c55e' },
    { label: 'In Progress', value: reviews.filter(r => r.status === 'in_progress').length, color: '#3b82f6' },
    { label: 'Pending', value: reviews.filter(r => r.status === 'pending').length, color: '#f59e0b' },
    { label: 'Overdue', value: reviews.filter(r => r.status === 'overdue').length, color: '#ef4444' },
    { label: 'Scheduled', value: reviews.filter(r => r.status === 'scheduled').length, color: '#6b7280' },
  ].filter(s => s.value > 0);

  const filteredReviews = (statusFilter === 'all'
    ? reviews
    : reviews.filter(r => r.status === statusFilter)
  ).filter(r => (householdIdFilter ? r.householdId === householdIdFilter : true));

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, resolved: true } : a
    ));
  };

  return (
    <>
      <PageHeader
        title="Compliance Dashboard"
        subtitle="Manage regulatory requirements, reviews, and compliance monitoring"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
            >
              Export Report
            </Button>
            <Button 
              variant="primary" 
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              Schedule Review
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Critical Alerts Banner */}
        {stats.criticalAlerts > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">
                {stats.criticalAlerts} Critical Alert{stats.criticalAlerts > 1 ? 's' : ''} Requiring Immediate Attention
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                Overdue compliance reviews and regulatory requirements need action.
              </p>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setActiveTab('alerts')}
            >
              View Alerts
            </Button>
          </div>
        )}

        {/* Stats */}
        <MetricGrid columns={4} className="mb-6">
          <MetricCard
            label="Compliance Score"
            value={`${stats.complianceScore}%`}
            icon="growth"
          />
          <MetricCard
            label="Pending Reviews"
            value={stats.pendingReviews.toString()}
            subtext={`${stats.overdueReviews} overdue`}
            icon="calendar"
          />
          <MetricCard
            label="Completed (MTD)"
            value={stats.completedThisMonth.toString()}
            icon="tasks"
          />
          <MetricCard
            label="Active Alerts"
            value={stats.unresolvedAlerts.toString()}
            subtext={`${stats.criticalAlerts} critical`}
            icon="documents"
          />
        </MetricGrid>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'alerts', label: 'Alerts', badge: stats.unresolvedAlerts },
              { id: 'requirements', label: 'Requirements' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-surface-primary text-content-primary shadow-sm' 
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reviews by Status */}
            <Card className="p-6">
              <h3 className="font-medium text-content-primary mb-4">Reviews by Status</h3>
              <div className="flex items-center justify-center">
                <SegmentedDonutChart
                  data={reviewsByStatus}
                  size={180}
                />
              </div>
              <div className="mt-4 space-y-2">
                {reviewsByStatus.map(status => (
                  <div key={status.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-content-secondary">{status.label}</span>
                    </div>
                    <span className="font-medium text-content-primary">{status.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Upcoming Reviews */}
            <Card className="lg:col-span-2">
              <CardHeader 
                title="Upcoming Reviews" 
                subtitle="Due within the next 14 days"
                action={
                  <Button size="sm" variant="ghost" onClick={() => setActiveTab('reviews')}>
                    View All
                  </Button>
                }
              />
              <div className="divide-y divide-border">
                {reviews
                  .filter(r => ['pending', 'scheduled'].includes(r.status))
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .slice(0, 4)
                  .map(review => (
                    <div key={review.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-secondary transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'p-2 rounded-lg',
                          review.riskLevel === 'high' ? 'bg-red-100 dark:bg-red-900/20' :
                          review.riskLevel === 'medium' ? 'bg-amber-100 dark:bg-amber-900/20' :
                          'bg-green-100 dark:bg-green-900/20'
                        )}>
                          <ShieldCheckIcon className={cn(
                            'w-5 h-5',
                            review.riskLevel === 'high' ? 'text-red-600 dark:text-red-400' :
                            review.riskLevel === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                            'text-green-600 dark:text-green-400'
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-content-primary">{review.householdName}</p>
                          <p className="text-sm text-content-secondary">{reviewTypeLabels[review.reviewType]}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-content-primary">
                          {format(new Date(review.dueDate), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-content-tertiary">
                          {formatDistanceToNow(new Date(review.dueDate), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Recent Alerts */}
            <Card className="lg:col-span-2">
              <CardHeader 
                title="Recent Alerts" 
                subtitle="Unresolved compliance alerts"
                action={
                  <Button size="sm" variant="ghost" onClick={() => setActiveTab('alerts')}>
                    View All
                  </Button>
                }
              />
              <div className="space-y-3 p-6 pt-0">
                {alerts.filter(a => !a.resolved).slice(0, 3).map(alert => (
                  <div 
                    key={alert.id} 
                    className={cn(
                      'p-4 rounded-lg border',
                      alertSeverityStyles[alert.severity]
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm opacity-80 mt-0.5">{alert.description}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Regulatory Compliance */}
            <Card>
              <CardHeader 
                title="Regulatory Status" 
                subtitle="Key compliance areas"
              />
              <div className="space-y-4 p-6 pt-0">
                {requirements.slice(0, 4).map(req => (
                  <div key={req.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-content-primary text-sm truncate">{req.name}</p>
                      <p className="text-xs text-content-tertiary">{req.regulation}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-surface-secondary rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            'h-full rounded-full transition-all',
                            req.completionRate === 100 ? 'bg-green-500' :
                            req.completionRate >= 80 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: `${req.completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-content-secondary w-10 text-right">
                        {req.completionRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <Card>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-content-tertiary" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm bg-transparent border-0 text-content-primary focus:ring-0"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="overdue">Overdue</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Household</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Review Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Assigned To</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Due Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Risk</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredReviews.map(review => (
                    <tr key={review.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-content-primary">{review.householdName}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-content-secondary">
                        {reviewTypeLabels[review.reviewType]}
                      </td>
                      <td className="px-4 py-3 text-sm text-content-secondary">
                        {review.assignedTo}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={cn(
                          'text-content-primary',
                          isBefore(new Date(review.dueDate), new Date()) && review.status !== 'completed' && 'text-red-600 dark:text-red-400'
                        )}>
                          {format(new Date(review.dueDate), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          review.riskLevel === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          review.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        )}>
                          {review.riskLevel.charAt(0).toUpperCase() + review.riskLevel.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={statusStyles[review.status].color}
                          label={statusStyles[review.status].label}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setSelectedReview(review)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.filter(a => !a.resolved).length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-content-primary">All Clear</h3>
                <p className="text-content-secondary mt-1">No unresolved compliance alerts</p>
              </Card>
            ) : (
              alerts.filter(a => !a.resolved).map(alert => (
                <div 
                  key={alert.id} 
                  className={cn(
                    'p-5 rounded-lg border',
                    alertSeverityStyles[alert.severity]
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">
                        {alert.severity === 'critical' ? (
                          <ExclamationTriangleIcon className="w-5 h-5" />
                        ) : alert.severity === 'warning' ? (
                          <BellAlertIcon className="w-5 h-5" />
                        ) : (
                          <ShieldCheckIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm opacity-80 mt-1">{alert.description}</p>
                        {alert.householdName && (
                          <p className="text-sm mt-2">
                            <span className="opacity-60">Household:</span>{' '}
                            <span className="font-medium">{alert.householdName}</span>
                          </p>
                        )}
                        <p className="text-xs opacity-60 mt-2">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary">
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Requirements Tab */}
        {activeTab === 'requirements' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requirements.map(req => (
              <Card key={req.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-content-primary">{req.name}</h3>
                    <p className="text-sm text-content-secondary">{req.regulation}</p>
                  </div>
                  <span className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-full',
                    req.status === 'compliant' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    req.status === 'attention' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  )}>
                    {req.status === 'compliant' ? 'Compliant' : 
                     req.status === 'attention' ? 'Needs Attention' : 'Non-Compliant'}
                  </span>
                </div>
                <p className="text-sm text-content-secondary mb-4">{req.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-content-tertiary">Completion Rate</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-surface-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full',
                          req.completionRate === 100 ? 'bg-green-500' :
                          req.completionRate >= 80 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                        style={{ width: `${req.completionRate}%` }}
                      />
                    </div>
                    <span className="font-medium text-content-primary">{req.completionRate}%</span>
                  </div>
                </div>
                {(req.lastCompleted || req.nextDue) && (
                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
                    {req.lastCompleted && (
                      <div>
                        <p className="text-content-tertiary">Last Completed</p>
                        <p className="font-medium text-content-primary">
                          {format(new Date(req.lastCompleted), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    {req.nextDue && (
                      <div>
                        <p className="text-content-tertiary">Next Due</p>
                        <p className="font-medium text-content-primary">
                          {format(new Date(req.nextDue), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </PageContent>

      {/* Review Detail Modal */}
      {selectedReview && (
        <Modal
          isOpen={!!selectedReview}
          onClose={() => setSelectedReview(null)}
          title="Compliance Review Details"
          size="md"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-content-primary">{selectedReview.householdName}</h3>
                <p className="text-sm text-content-secondary">{reviewTypeLabels[selectedReview.reviewType]}</p>
              </div>
              <StatusBadge
                status={statusStyles[selectedReview.status].color}
                label={statusStyles[selectedReview.status].label}
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-content-tertiary">Assigned To</p>
                  <p className="font-medium text-content-primary">{selectedReview.assignedTo}</p>
                </div>
                <div>
                  <p className="text-sm text-content-tertiary">Risk Level</p>
                  <p className={cn(
                    'font-medium',
                    selectedReview.riskLevel === 'high' ? 'text-red-600' :
                    selectedReview.riskLevel === 'medium' ? 'text-amber-600' : 'text-green-600'
                  )}>
                    {selectedReview.riskLevel.charAt(0).toUpperCase() + selectedReview.riskLevel.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-content-tertiary">Due Date</p>
                  <p className="font-medium text-content-primary">
                    {format(new Date(selectedReview.dueDate), 'MMM d, yyyy')}
                  </p>
                </div>
                {selectedReview.lastReviewDate && (
                  <div>
                    <p className="text-sm text-content-tertiary">Last Review</p>
                    <p className="font-medium text-content-primary">
                      {format(new Date(selectedReview.lastReviewDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
              <Button variant="ghost" onClick={() => setSelectedReview(null)}>
                Close
              </Button>
              {selectedReview.status !== 'completed' && (
                <Button variant="primary">
                  {selectedReview.status === 'pending' ? 'Start Review' : 'Continue Review'}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
