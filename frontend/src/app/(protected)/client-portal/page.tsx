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
} from '@/components/ui';
import { 
  PlusIcon,
  UserGroupIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  LinkIcon,
  DocumentIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  PaperAirplaneIcon,
  KeyIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/components/ui/utils';
import { format, formatDistanceToNow } from 'date-fns';

// Types
type PortalStatus = 'active' | 'pending' | 'invited' | 'disabled' | 'expired';

interface ClientPortalUser {
  id: string;
  householdId: string;
  householdName: string;
  personId: string;
  personName: string;
  email: string;
  status: PortalStatus;
  role: 'primary' | 'secondary' | 'readonly';
  lastLogin?: string;
  invitedAt?: string;
  activatedAt?: string;
  createdAt: string;
  permissions: {
    viewAccounts: boolean;
    viewDocuments: boolean;
    viewPerformance: boolean;
    uploadDocuments: boolean;
    scheduleeMeetings: boolean;
    viewBilling: boolean;
  };
}

interface PortalActivity {
  id: string;
  userId: string;
  userName: string;
  householdName: string;
  action: 'login' | 'view_accounts' | 'view_documents' | 'download_document' | 'upload_document' | 'schedule_meeting' | 'view_performance';
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

interface PortalStats {
  totalUsers: number;
  activeUsers: number;
  pendingInvites: number;
  loginsLast30Days: number;
  documentsViewed: number;
}

// Mock data
const mockUsers: ClientPortalUser[] = [
  {
    id: 'cpu1',
    householdId: 'h1',
    householdName: 'Anderson Family',
    personId: 'p1',
    personName: 'James Anderson',
    email: 'james.anderson@email.com',
    status: 'active',
    role: 'primary',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    activatedAt: '2023-06-15T10:00:00Z',
    createdAt: '2023-06-15T09:00:00Z',
    permissions: {
      viewAccounts: true,
      viewDocuments: true,
      viewPerformance: true,
      uploadDocuments: true,
      scheduleeMeetings: true,
      viewBilling: true,
    },
  },
  {
    id: 'cpu2',
    householdId: 'h1',
    householdName: 'Anderson Family',
    personId: 'p2',
    personName: 'Sarah Anderson',
    email: 'sarah.anderson@email.com',
    status: 'active',
    role: 'secondary',
    lastLogin: new Date(Date.now() - 172800000).toISOString(),
    activatedAt: '2023-07-01T14:00:00Z',
    createdAt: '2023-06-30T10:00:00Z',
    permissions: {
      viewAccounts: true,
      viewDocuments: true,
      viewPerformance: true,
      uploadDocuments: false,
      scheduleeMeetings: true,
      viewBilling: false,
    },
  },
  {
    id: 'cpu3',
    householdId: 'h2',
    householdName: 'Chen Family Trust',
    personId: 'p3',
    personName: 'Michael Chen',
    email: 'michael.chen@email.com',
    status: 'invited',
    role: 'primary',
    invitedAt: new Date(Date.now() - 259200000).toISOString(),
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    permissions: {
      viewAccounts: true,
      viewDocuments: true,
      viewPerformance: true,
      uploadDocuments: true,
      scheduleeMeetings: true,
      viewBilling: true,
    },
  },
  {
    id: 'cpu4',
    householdId: 'h3',
    householdName: 'Williams Household',
    personId: 'p4',
    personName: 'Robert Williams',
    email: 'robert.williams@email.com',
    status: 'pending',
    role: 'primary',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    permissions: {
      viewAccounts: true,
      viewDocuments: true,
      viewPerformance: true,
      uploadDocuments: true,
      scheduleeMeetings: true,
      viewBilling: true,
    },
  },
  {
    id: 'cpu5',
    householdId: 'h4',
    householdName: 'Thompson Partners',
    personId: 'p5',
    personName: 'Emily Thompson',
    email: 'emily.thompson@email.com',
    status: 'disabled',
    role: 'primary',
    lastLogin: new Date(Date.now() - 7776000000).toISOString(),
    activatedAt: '2022-01-01T10:00:00Z',
    createdAt: '2022-01-01T09:00:00Z',
    permissions: {
      viewAccounts: true,
      viewDocuments: true,
      viewPerformance: true,
      uploadDocuments: true,
      scheduleeMeetings: true,
      viewBilling: true,
    },
  },
];

const mockActivity: PortalActivity[] = [
  { id: 'a1', userId: 'cpu1', userName: 'James Anderson', householdName: 'Anderson Family', action: 'login', timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: 'a2', userId: 'cpu1', userName: 'James Anderson', householdName: 'Anderson Family', action: 'view_performance', timestamp: new Date(Date.now() - 90000000).toISOString() },
  { id: 'a3', userId: 'cpu2', userName: 'Sarah Anderson', householdName: 'Anderson Family', action: 'download_document', details: 'Q4 2023 Statement.pdf', timestamp: new Date(Date.now() - 172800000).toISOString() },
  { id: 'a4', userId: 'cpu1', userName: 'James Anderson', householdName: 'Anderson Family', action: 'view_documents', timestamp: new Date(Date.now() - 259200000).toISOString() },
  { id: 'a5', userId: 'cpu2', userName: 'Sarah Anderson', householdName: 'Anderson Family', action: 'schedule_meeting', details: 'Quarterly Review', timestamp: new Date(Date.now() - 432000000).toISOString() },
];

const statusStyles: Record<PortalStatus, { color: 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }> = {
  active: { color: 'success', label: 'Active' },
  pending: { color: 'warning', label: 'Pending Setup' },
  invited: { color: 'info', label: 'Invited' },
  disabled: { color: 'default', label: 'Disabled' },
  expired: { color: 'error', label: 'Expired' },
};

const actionLabels: Record<string, { label: string; icon: any }> = {
  login: { label: 'Logged in', icon: KeyIcon },
  view_accounts: { label: 'Viewed accounts', icon: ChartBarIcon },
  view_documents: { label: 'Viewed documents', icon: DocumentIcon },
  download_document: { label: 'Downloaded document', icon: DocumentIcon },
  upload_document: { label: 'Uploaded document', icon: DocumentIcon },
  schedule_meeting: { label: 'Scheduled meeting', icon: CalendarDaysIcon },
  view_performance: { label: 'Viewed performance', icon: ChartBarIcon },
};

export default function ClientPortalPage() {
  const [users, setUsers] = useState<ClientPortalUser[]>(mockUsers);
  const [activity] = useState<PortalActivity[]>(mockActivity);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'settings'>('users');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClientPortalUser | null>(null);

  const stats: PortalStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingInvites: users.filter(u => u.status === 'invited' || u.status === 'pending').length,
    loginsLast30Days: 47,
    documentsViewed: 156,
  };

  const filteredUsers = statusFilter === 'all'
    ? users
    : users.filter(u => u.status === statusFilter);

  const handleResendInvite = async (userId: string) => {
    // Mock implementation
    console.log('Resending invite to', userId);
  };

  const handleDisableUser = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: 'disabled' as PortalStatus } : u
    ));
  };

  const handleEnableUser = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: 'active' as PortalStatus } : u
    ));
  };

  return (
    <>
      <PageHeader
        title="Client Portal"
        subtitle="Manage client access to the self-service portal"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              leftIcon={<LinkIcon className="w-4 h-4" />}
            >
              Portal Settings
            </Button>
            <Button 
              variant="primary" 
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setShowInviteModal(true)}
            >
              Invite Client
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Stats */}
        <MetricGrid columns={4} className="mb-6">
          <MetricCard
            label="Total Users"
            value={stats.totalUsers.toString()}
            subtext={`${stats.pendingInvites} pending invites`}
            icon="households"
          />
          <MetricCard
            label="Active Users"
            value={stats.activeUsers.toString()}
            subtext={`${((stats.activeUsers / stats.totalUsers) * 100).toFixed(0)}% of total`}
            icon="growth"
          />
          <MetricCard
            label="Logins (30d)"
            value={stats.loginsLast30Days.toString()}
            icon="calendar"
          />
          <MetricCard
            label="Documents Viewed"
            value={stats.documentsViewed.toString()}
            icon="documents"
          />
        </MetricGrid>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1">
            {[
              { id: 'users', label: 'Portal Users' },
              { id: 'activity', label: 'Activity Log' },
              { id: 'settings', label: 'Settings' },
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

          {activeTab === 'users' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm bg-surface-secondary border border-border rounded-md px-3 py-2 text-content-primary focus:ring-1 focus:ring-accent-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="pending">Pending</option>
              <option value="disabled">Disabled</option>
            </select>
          )}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Household</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Last Login</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-content-primary">{user.personName}</p>
                          <p className="text-sm text-content-tertiary">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-content-secondary">
                        {user.householdName}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                          user.role === 'primary' ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' :
                          user.role === 'secondary' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-content-secondary">
                        {user.lastLogin ? (
                          <span title={format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a')}>
                            {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-content-tertiary">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={statusStyles[user.status].color}
                          label={statusStyles[user.status].label}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setSelectedUser(user)}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          {user.status === 'invited' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleResendInvite(user.id)}
                            >
                              <PaperAirplaneIcon className="w-4 h-4" />
                            </Button>
                          )}
                          {user.status === 'active' ? (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDisableUser(user.id)}
                            >
                              <LockClosedIcon className="w-4 h-4" />
                            </Button>
                          ) : user.status === 'disabled' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEnableUser(user.id)}
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <Card>
            <CardHeader title="Recent Activity" subtitle="Client portal activity log" />
            <div className="divide-y divide-border">
              {activity.map(item => {
                const actionInfo = actionLabels[item.action];
                const ActionIcon = actionInfo?.icon || BellIcon;
                return (
                  <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="p-2 bg-surface-secondary rounded-lg">
                      <ActionIcon className="w-5 h-5 text-content-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-content-primary">
                        <span className="font-medium">{item.userName}</span>
                        {' '}
                        <span className="text-content-secondary">{actionInfo?.label || item.action}</span>
                        {item.details && (
                          <span className="text-content-tertiary"> - {item.details}</span>
                        )}
                      </p>
                      <p className="text-xs text-content-tertiary">
                        {item.householdName} • {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-medium text-content-primary mb-4">Portal Features</h3>
              <div className="space-y-4">
                {[
                  { id: 'accounts', label: 'View Account Balances', description: 'Clients can see account values and positions', enabled: true },
                  { id: 'documents', label: 'Document Access', description: 'Clients can view and download statements', enabled: true },
                  { id: 'performance', label: 'Performance Reports', description: 'Show portfolio performance metrics', enabled: true },
                  { id: 'upload', label: 'Document Upload', description: 'Allow clients to upload documents', enabled: false },
                  { id: 'meetings', label: 'Schedule Meetings', description: 'Clients can request meetings', enabled: true },
                  { id: 'billing', label: 'View Invoices', description: 'Show billing and fee information', enabled: false },
                ].map(feature => (
                  <div key={feature.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-content-primary text-sm">{feature.label}</p>
                      <p className="text-xs text-content-tertiary">{feature.description}</p>
                    </div>
                    <button
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        feature.enabled ? 'bg-accent-600' : 'bg-surface-secondary'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          feature.enabled ? 'translate-x-4' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-medium text-content-primary mb-4">Branding & Customization</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-content-primary mb-1">Portal URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value="portal.wealthcrm.com/your-firm"
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-surface-secondary border border-border rounded-md text-content-secondary"
                    />
                    <Button size="sm" variant="secondary">
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-content-primary mb-1">Logo</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <p className="text-sm text-content-tertiary">Drag and drop or click to upload</p>
                    <p className="text-xs text-content-tertiary mt-1">PNG, SVG up to 2MB</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-content-primary mb-1">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-600 border border-border" />
                    <input
                      type="text"
                      value="#2563eb"
                      className="px-3 py-2 text-sm bg-surface-secondary border border-border rounded-md text-content-primary w-28"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <Button variant="primary">Save Changes</Button>
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <h3 className="font-medium text-content-primary mb-4">Notifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-content-secondary mb-3">Client Notifications</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'New document available', enabled: true },
                      { label: 'Account statement ready', enabled: true },
                      { label: 'Meeting reminder', enabled: true },
                      { label: 'Performance report available', enabled: false },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-content-primary">{item.label}</span>
                        <input type="checkbox" defaultChecked={item.enabled} className="rounded border-border text-accent-600 focus:ring-accent-500" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-content-secondary mb-3">Advisor Notifications</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Client logged in', enabled: false },
                      { label: 'Document downloaded', enabled: true },
                      { label: 'Meeting scheduled', enabled: true },
                      { label: 'Document uploaded', enabled: true },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-content-primary">{item.label}</span>
                        <input type="checkbox" defaultChecked={item.enabled} className="rounded border-border text-accent-600 focus:ring-accent-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </PageContent>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Client to Portal"
        size="md"
      >
        <div className="p-6">
          <p className="text-sm text-content-secondary mb-6">
            Send a portal invitation to a client. They will receive an email with instructions to set up their account.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                Select Household
              </label>
              <select className="w-full px-3 py-2 text-sm bg-surface-secondary border border-border rounded-md text-content-primary focus:ring-1 focus:ring-accent-500">
                <option value="">Choose household...</option>
                <option value="h1">Anderson Family</option>
                <option value="h2">Chen Family Trust</option>
                <option value="h3">Williams Household</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                Select Person
              </label>
              <select className="w-full px-3 py-2 text-sm bg-surface-secondary border border-border rounded-md text-content-primary focus:ring-1 focus:ring-accent-500">
                <option value="">Choose person...</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                Portal Role
              </label>
              <select className="w-full px-3 py-2 text-sm bg-surface-secondary border border-border rounded-md text-content-primary focus:ring-1 focus:ring-accent-500">
                <option value="primary">Primary (Full Access)</option>
                <option value="secondary">Secondary (Limited)</option>
                <option value="readonly">Read Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">
                Permissions
              </label>
              <div className="space-y-2">
                {[
                  'View Account Balances',
                  'View Documents',
                  'View Performance',
                  'Upload Documents',
                  'Schedule Meetings',
                  'View Billing',
                ].map((perm, idx) => (
                  <label key={idx} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked={idx < 4} className="rounded border-border text-accent-600 focus:ring-accent-500" />
                    <span className="text-sm text-content-primary">{perm}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
            <Button variant="ghost" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}>
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="Portal User Details"
          size="md"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-content-primary">{selectedUser.personName}</h3>
                <p className="text-sm text-content-secondary">{selectedUser.email}</p>
              </div>
              <StatusBadge
                status={statusStyles[selectedUser.status].color}
                label={statusStyles[selectedUser.status].label}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-content-tertiary">Household</p>
                <p className="font-medium text-content-primary">{selectedUser.householdName}</p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">Role</p>
                <p className="font-medium text-content-primary capitalize">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">Last Login</p>
                <p className="font-medium text-content-primary">
                  {selectedUser.lastLogin ? format(new Date(selectedUser.lastLogin), 'MMM d, yyyy h:mm a') : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">Created</p>
                <p className="font-medium text-content-primary">
                  {format(new Date(selectedUser.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-content-primary mb-2">Permissions</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedUser.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    {value ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm text-content-secondary capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
              {selectedUser.status === 'active' && (
                <Button variant="secondary" leftIcon={<KeyIcon className="w-4 h-4" />}>
                  Reset Password
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
