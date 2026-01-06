'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  PageHeader, 
  PageContent 
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  StatusBadge,
  Input,
  Select,
  Avatar,
  Modal,
  ModalFooter,
  Checkbox,
  formatCurrency,
} from '@/components/ui';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import clientsService, { Client, KycStatus, ClientFilter, ClientStats } from '@/services/clients.service';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const kycStatusConfig: Record<KycStatus, { label: string; variant: StatusVariant; icon: any }> = {
  pending: { label: 'Pending', variant: 'warning', icon: ClockIcon },
  verified: { label: 'Verified', variant: 'success', icon: CheckCircleIcon },
  failed: { label: 'Failed', variant: 'error', icon: XCircleIcon },
  expired: { label: 'Expired', variant: 'error', icon: ExclamationTriangleIcon },
};

const tierConfig: Record<string, { label: string; color: string }> = {
  platinum: { label: 'Platinum', color: 'bg-gradient-to-r from-slate-400 to-slate-600 text-white' },
  gold: { label: 'Gold', color: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' },
  silver: { label: 'Silver', color: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white' },
  bronze: { label: 'Bronze', color: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' },
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const maskSSN = (ssn?: string) => {
  if (!ssn) return '-';
  return ssn; // Already masked from backend
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ClientFilter>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'kyc_expiring' | 'accredited'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsData, statsData] = await Promise.all([
        clientsService.getAll({ ...filter, search: searchQuery }),
        clientsService.getStats(),
      ]);
      setClients(clientsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter, searchQuery]);

  const filteredClients = useMemo(() => {
    let result = clients;
    
    if (activeTab === 'kyc_expiring') {
      result = result.filter(c => c.kycStatus === 'expired' || c.kycStatus === 'pending');
    } else if (activeTab === 'accredited') {
      result = result.filter(c => c.accreditedInvestor);
    }
    
    return result;
  }, [clients, activeTab]);

  const handleSelectAll = () => {
    if (selectedIds.size === filteredClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClients.map(c => c.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = async () => {
    try {
      const blob = await clientsService.exportToCsv(filter);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={stats ? `${stats.total} total clients • ${stats.kycExpiringSoon} KYC expiring soon` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary"
              leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button 
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Add Client
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Total</p>
              <p className="text-2xl font-semibold text-content-primary mt-1">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Verified</p>
              <p className="text-2xl font-semibold text-status-success-text mt-1">{stats.byKycStatus.verified}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Pending KYC</p>
              <p className="text-2xl font-semibold text-status-warning-text mt-1">{stats.byKycStatus.pending}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Expired KYC</p>
              <p className="text-2xl font-semibold text-status-error-text mt-1">{stats.byKycStatus.expired}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Accredited</p>
              <p className="text-2xl font-semibold text-accent-primary mt-1">{stats.accreditedCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Qualified</p>
              <p className="text-2xl font-semibold text-content-primary mt-1">{stats.qualifiedClientCount}</p>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1 mb-6 w-fit">
          {[
            { id: 'all', label: 'All Clients' },
            { id: 'kyc_expiring', label: 'KYC Attention' },
            { id: 'accredited', label: 'Accredited' },
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

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-tertiary" />
            <Input
              placeholder="Search clients by name, email, or household..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filter.kycStatus || ''}
              onChange={(val) => setFilter({ ...filter, kycStatus: val as KycStatus || undefined })}
              options={[
                { value: '', label: 'All KYC Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'verified', label: 'Verified' },
                { value: 'expired', label: 'Expired' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
            <Select
              value={filter.tier || ''}
              onChange={(val) => setFilter({ ...filter, tier: val || undefined })}
              options={[
                { value: '', label: 'All Tiers' },
                { value: 'platinum', label: 'Platinum' },
                { value: 'gold', label: 'Gold' },
                { value: 'silver', label: 'Silver' },
                { value: 'bronze', label: 'Bronze' },
              ]}
            />
            <Button
              variant="secondary"
              leftIcon={<FunnelIcon className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-accent-50 rounded-lg border border-accent-200">
            <span className="text-sm font-medium text-accent-700">
              {selectedIds.size} client{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">Send Email</Button>
              <Button size="sm" variant="secondary">Update Tags</Button>
              <Button size="sm" variant="secondary">Export Selected</Button>
            </div>
            <button 
              className="ml-auto text-sm text-accent-600 hover:text-accent-800"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Client List */}
        <Card>
          {/* Header Row */}
          <div className="flex items-center px-4 py-3 border-b border-border bg-surface-secondary text-xs font-medium text-content-secondary uppercase tracking-wider">
            <div className="w-8">
              <Checkbox
                checked={selectedIds.size === filteredClients.length && filteredClients.length > 0}
                onChange={handleSelectAll}
              />
            </div>
            <div className="flex-1 min-w-0">Client</div>
            <div className="w-48 hidden lg:block">Contact</div>
            <div className="w-32 hidden md:block">KYC Status</div>
            <div className="w-28 hidden lg:block">Tier</div>
            <div className="w-32 hidden xl:block">Net Worth</div>
            <div className="w-8"></div>
          </div>

          {/* Client Rows */}
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-content-secondary">Loading clients...</div>
            ) : filteredClients.length === 0 ? (
              <div className="p-8 text-center text-content-secondary">
                <UserIcon className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
                <p className="font-medium">No clients found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div key={client.id}>
                  {/* Main Row */}
                  <div 
                    className={`flex items-center px-4 py-3 hover:bg-surface-secondary transition-colors cursor-pointer ${
                      expandedId === client.id ? 'bg-surface-secondary' : ''
                    }`}
                    onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                  >
                    <div className="w-8" onClick={(e) => { e.stopPropagation(); handleSelect(client.id); }}>
                      <Checkbox
                        checked={selectedIds.has(client.id)}
                        onChange={() => handleSelect(client.id)}
                      />
                    </div>
                    
                    {/* Client Info */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <Avatar 
                        name={`${client.firstName} ${client.lastName}`} 
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/clients/${client.id}`}
                            className="font-medium text-content-primary hover:text-accent-primary truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {client.firstName} {client.lastName}
                          </Link>
                          {client.isPrimaryContact && (
                            <span className="px-1.5 py-0.5 text-2xs font-medium bg-accent-100 text-accent-700 rounded">
                              Primary
                            </span>
                          )}
                          {client.accreditedInvestor && (
                            <ShieldCheckIcon className="w-4 h-4 text-status-success-text" title="Accredited Investor" />
                          )}
                        </div>
                        <Link 
                          href={`/households/${client.householdId}`}
                          className="text-sm text-content-secondary hover:text-accent-primary truncate block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {client.householdName}
                        </Link>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="w-48 hidden lg:block">
                      <div className="text-sm text-content-primary truncate">{client.email || '-'}</div>
                      <div className="text-sm text-content-secondary">{client.phonePrimary || '-'}</div>
                    </div>

                    {/* KYC Status */}
                    <div className="w-32 hidden md:block">
                      <StatusBadge
                        status={client.kycStatus === 'failed' ? 'error' : client.kycStatus}
                        label={kycStatusConfig[client.kycStatus].label}
                      />
                      {client.kycExpirationDate && client.kycStatus === 'verified' && (
                        <div className="text-2xs text-content-tertiary mt-0.5">
                          Exp: {formatDate(client.kycExpirationDate)}
                        </div>
                      )}
                    </div>

                    {/* Tier */}
                    <div className="w-28 hidden lg:block">
                      {client.tier && (
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${tierConfig[client.tier]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {tierConfig[client.tier]?.label || client.tier}
                        </span>
                      )}
                    </div>

                    {/* Net Worth */}
                    <div className="w-32 hidden xl:block">
                      <div className="text-sm font-medium text-content-primary">
                        {client.netWorth ? formatCurrency(client.netWorth) : '-'}
                      </div>
                      {client.liquidNetWorth && (
                        <div className="text-2xs text-content-tertiary">
                          {formatCurrency(client.liquidNetWorth)} liquid
                        </div>
                      )}
                    </div>

                    {/* Expand Icon */}
                    <div className="w-8 flex justify-end">
                      <motion.div
                        animate={{ rotate: expandedId === client.id ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRightIcon className="w-5 h-5 text-content-tertiary" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {expandedId === client.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-6 bg-surface-secondary border-t border-border">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Personal Information */}
                            <div>
                              <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
                                Personal Information
                              </h4>
                              <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <dt className="text-content-secondary">Date of Birth</dt>
                                  <dd className="text-content-primary font-medium">{formatDate(client.dateOfBirth)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-content-secondary">SSN</dt>
                                  <dd className="text-content-primary font-medium font-mono">{maskSSN(client.ssn)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-content-secondary">Marital Status</dt>
                                  <dd className="text-content-primary font-medium capitalize">{client.maritalStatus?.replace('_', ' ') || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-content-secondary">Employment</dt>
                                  <dd className="text-content-primary font-medium capitalize">{client.employmentStatus?.replace('_', ' ') || '-'}</dd>
                                </div>
                                {client.employer && (
                                  <div className="flex justify-between">
                                    <dt className="text-content-secondary">Employer</dt>
                                    <dd className="text-content-primary font-medium">{client.employer}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>

                            {/* Investment Profile */}
                            <div>
                              <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
                                Investment Profile
                              </h4>
                              <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <dt className="text-content-secondary">Risk Tolerance</dt>
                                  <dd className="text-content-primary font-medium capitalize">{client.riskTolerance?.replace('_', ' ') || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-content-secondary">Time Horizon</dt>
                                  <dd className="text-content-primary font-medium">{client.timeHorizon || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-content-secondary">Objective</dt>
                                  <dd className="text-content-primary font-medium">{client.investmentObjective || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-content-secondary">Annual Income</dt>
                                  <dd className="text-content-primary font-medium">{client.annualIncome ? formatCurrency(client.annualIncome) : '-'}</dd>
                                </div>
                              </dl>
                            </div>

                            {/* Compliance & Status */}
                            <div>
                              <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
                                Compliance Status
                              </h4>
                              <dl className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                  <dt className="text-content-secondary">Accredited Investor</dt>
                                  <dd>
                                    {client.accreditedInvestor ? (
                                      <CheckCircleIcon className="w-5 h-5 text-status-success-text" />
                                    ) : (
                                      <XCircleIcon className="w-5 h-5 text-content-tertiary" />
                                    )}
                                  </dd>
                                </div>
                                <div className="flex justify-between items-center">
                                  <dt className="text-content-secondary">Qualified Client</dt>
                                  <dd>
                                    {client.qualifiedClient ? (
                                      <CheckCircleIcon className="w-5 h-5 text-status-success-text" />
                                    ) : (
                                      <XCircleIcon className="w-5 h-5 text-content-tertiary" />
                                    )}
                                  </dd>
                                </div>
                                <div className="flex justify-between items-center">
                                  <dt className="text-content-secondary">Qualified Purchaser</dt>
                                  <dd>
                                    {client.qualifiedPurchaser ? (
                                      <CheckCircleIcon className="w-5 h-5 text-status-success-text" />
                                    ) : (
                                      <XCircleIcon className="w-5 h-5 text-content-tertiary" />
                                    )}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-content-secondary">KYC Verified</dt>
                                  <dd className="text-content-primary font-medium">{formatDate(client.kycVerifiedDate)}</dd>
                                </div>
                              </dl>
                              
                              {/* Tags */}
                              {client.tags && client.tags.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2">
                                    Tags
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {client.tags.map(tag => (
                                      <span key={tag} className="px-2 py-0.5 bg-surface-tertiary text-content-secondary text-xs rounded-full">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                            <Button size="sm" variant="secondary" leftIcon={<EnvelopeIcon className="w-4 h-4" />}>
                              Send Email
                            </Button>
                            <Button size="sm" variant="secondary" leftIcon={<PhoneIcon className="w-4 h-4" />}>
                              Log Call
                            </Button>
                            <Button size="sm" variant="secondary" leftIcon={<CalendarIcon className="w-4 h-4" />}>
                              Schedule Meeting
                            </Button>
                            <Button size="sm" variant="secondary" leftIcon={<DocumentIcon className="w-4 h-4" />}>
                              View Documents
                            </Button>
                            {client.kycStatus !== 'verified' && (
                              <Button size="sm" variant="secondary" leftIcon={<ShieldCheckIcon className="w-4 h-4" />}>
                                Verify KYC
                              </Button>
                            )}
                            <div className="ml-auto">
                              <Link href={`/clients/${client.id}`}>
                                <Button size="sm">View Full Profile</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </Card>
      </PageContent>

      {/* Create Client Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Client"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">First Name</label>
              <Input placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Last Name</label>
              <Input placeholder="Smith" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Email</label>
            <Input type="email" placeholder="john.smith@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Phone</label>
            <Input type="tel" placeholder="(555) 123-4567" />
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Household</label>
            <Select 
              options={[
                { value: '', label: 'Select household...' },
                { value: 'h1', label: 'Anderson Family' },
                { value: 'h2', label: 'Chen Family Trust' },
                { value: 'new', label: '+ Create New Household' },
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="primaryContact" />
            <label htmlFor="primaryContact" className="text-sm text-content-secondary">
              Set as primary contact for household
            </label>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button onClick={() => setShowCreateModal(false)}>Add Client</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
