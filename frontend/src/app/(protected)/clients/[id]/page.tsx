'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PageHeader, 
  PageContent 
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  StatusBadge,
  Avatar,
  formatCurrency,
} from '@/components/ui';
import { 
  ArrowLeftIcon,
  PencilSquareIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import clientsService, { Client, KycStatus } from '@/services/clients.service';

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

const riskToleranceLabels: Record<string, string> = {
  conservative: 'Conservative',
  moderate_conservative: 'Moderate Conservative',
  moderate: 'Moderate',
  moderate_aggressive: 'Moderate Aggressive',
  aggressive: 'Aggressive',
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'investment' | 'documents' | 'activity'>('overview');

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        const data = await clientsService.getById(clientId);
        setClient(data);
      } catch (err) {
        console.error('Failed to fetch client:', err);
        setError('Failed to load client details');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Loading..."
          subtitle="Fetching client details"
        />
        <PageContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </PageContent>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div>
        <PageHeader
          title="Client Not Found"
          subtitle="The requested client could not be found"
        />
        <PageContent>
          <Card>
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="w-12 h-12 text-stone-500 mx-auto mb-4" />
              <p className="text-stone-400 mb-4">{error || 'Client not found'}</p>
              <Button onClick={() => router.push('/clients')}>
                Back to Clients
              </Button>
            </div>
          </Card>
        </PageContent>
      </div>
    );
  }

  const kycConfig = kycStatusConfig[client.kycStatus];
  const tier = client.tier ? tierConfig[client.tier] : null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserGroupIcon },
    { id: 'investment', label: 'Investment Profile', icon: ChartBarIcon },
    { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
    { id: 'activity', label: 'Activity', icon: ClockIcon },
  ];

  return (
    <>
      <PageHeader
        title={`${client.firstName} ${client.lastName}`}
        subtitle={
          <div className="flex items-center gap-3 mt-1">
            {client.isPrimaryContact && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                Primary Contact
              </span>
            )}
            {tier && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${tier.color}`}>
                {tier.label}
              </span>
            )}
            <Link 
              href={`/households/${client.householdId}`}
              className="text-sm text-stone-400 hover:text-blue-400"
            >
              {client.householdName}
            </Link>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              onClick={() => router.push('/clients')}
            >
              Back
            </Button>
            <Button leftIcon={<PencilSquareIcon className="w-4 h-4" />}>
              Edit Client
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-stone-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-stone-400 border-transparent hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <Card>
              <div className="p-4 border-b border-stone-800">
                <h3 className="font-semibold text-white">Contact Information</h3>
              </div>
              <div className="p-4 space-y-4">
                {client.email && (
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="w-5 h-5 text-stone-500" />
                    <div>
                      <p className="text-xs text-stone-500">Email</p>
                      <a href={`mailto:${client.email}`} className="text-sm text-blue-400 hover:underline">
                        {client.email}
                      </a>
                    </div>
                  </div>
                )}
                {client.phonePrimary && (
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="w-5 h-5 text-stone-500" />
                    <div>
                      <p className="text-xs text-stone-500">Phone</p>
                      <a href={`tel:${client.phonePrimary}`} className="text-sm text-white">
                        {client.phonePrimary}
                      </a>
                    </div>
                  </div>
                )}
                {(client.address || client.city) && (
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="w-5 h-5 text-stone-500" />
                    <div>
                      <p className="text-xs text-stone-500">Address</p>
                      <p className="text-sm text-white">
                        {client.address && <span>{client.address}<br /></span>}
                        {client.city && `${client.city}, `}{client.state} {client.zipCode}
                      </p>
                    </div>
                  </div>
                )}
                {client.dateOfBirth && (
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-stone-500" />
                    <div>
                      <p className="text-xs text-stone-500">Date of Birth</p>
                      <p className="text-sm text-white">{formatDate(client.dateOfBirth)}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* KYC & Compliance */}
            <Card>
              <div className="p-4 border-b border-stone-800">
                <h3 className="font-semibold text-white">Compliance Status</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-400">KYC Status</span>
                  <StatusBadge status={kycConfig.variant} label={kycConfig.label} />
                </div>
                {client.kycVerifiedDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-400">Verified Date</span>
                    <span className="text-sm text-white">{formatDate(client.kycVerifiedDate)}</span>
                  </div>
                )}
                {client.kycExpirationDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-400">Expiration</span>
                    <span className="text-sm text-white">{formatDate(client.kycExpirationDate)}</span>
                  </div>
                )}
                <div className="border-t border-stone-800 pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-400">Accredited Investor</span>
                    {client.accreditedInvestor ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-stone-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-400">Qualified Client</span>
                    {client.qualifiedClient ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-stone-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-400">Qualified Purchaser</span>
                    {client.qualifiedPurchaser ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-stone-500" />
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Financial Summary */}
            <Card>
              <div className="p-4 border-b border-stone-800">
                <h3 className="font-semibold text-white">Financial Summary</h3>
              </div>
              <div className="p-4 space-y-4">
                {client.netWorth !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-400">Net Worth</span>
                    <span className="text-sm font-medium text-white">{formatCurrency(client.netWorth)}</span>
                  </div>
                )}
                {client.liquidNetWorth !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-400">Liquid Net Worth</span>
                    <span className="text-sm text-white">{formatCurrency(client.liquidNetWorth)}</span>
                  </div>
                )}
                {client.annualIncome !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-400">Annual Income</span>
                    <span className="text-sm text-white">{formatCurrency(client.annualIncome)}</span>
                  </div>
                )}
                <div className="border-t border-stone-800 pt-4">
                  {client.employer && (
                    <div className="flex items-center gap-3 mb-3">
                      <BuildingOfficeIcon className="w-5 h-5 text-stone-500" />
                      <div>
                        <p className="text-xs text-stone-500">Employment</p>
                        <p className="text-sm text-white">{client.occupation} at {client.employer}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Tags */}
            {client.tags && client.tags.length > 0 && (
              <Card className="lg:col-span-3">
                <div className="p-4 border-b border-stone-800">
                  <h3 className="font-semibold text-white">Tags</h3>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {client.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-3 py-1 bg-stone-800 text-stone-300 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Notes */}
            {client.notes && (
              <Card className="lg:col-span-3">
                <div className="p-4 border-b border-stone-800">
                  <h3 className="font-semibold text-white">Notes</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-stone-300 whitespace-pre-wrap">{client.notes}</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'investment' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-4 border-b border-stone-800">
                <h3 className="font-semibold text-white">Investment Profile</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-400">Risk Tolerance</span>
                  <span className="text-sm text-white">
                    {client.riskTolerance ? riskToleranceLabels[client.riskTolerance] : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-400">Investment Experience</span>
                  <span className="text-sm text-white">{client.investmentExperience || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-400">Investment Objective</span>
                  <span className="text-sm text-white">{client.investmentObjective || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-400">Time Horizon</span>
                  <span className="text-sm text-white">{client.timeHorizon || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-400">Liquidity Needs</span>
                  <span className="text-sm text-white">{client.liquidityNeeds || '-'}</span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4 border-b border-stone-800">
                <h3 className="font-semibold text-white">Accounts</h3>
              </div>
              <div className="p-4 text-center py-8">
                <BanknotesIcon className="w-10 h-10 text-stone-500 mx-auto mb-3" />
                <p className="text-stone-400 text-sm">Linked accounts will appear here</p>
                <Button variant="ghost" size="sm" className="mt-4" onClick={() => router.push('/accounts')}>
                  View All Accounts
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'documents' && (
          <Card>
            <div className="p-4 border-b border-stone-800">
              <h3 className="font-semibold text-white">Client Documents</h3>
            </div>
            <div className="p-8 text-center">
              <DocumentTextIcon className="w-12 h-12 text-stone-500 mx-auto mb-4" />
              <p className="text-stone-400 mb-4">No documents uploaded yet</p>
              <Button variant="secondary">Upload Document</Button>
            </div>
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card>
            <div className="p-4 border-b border-stone-800">
              <h3 className="font-semibold text-white">Activity History</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="text-sm text-white">Client record updated</p>
                  <p className="text-xs text-stone-500">{formatDate(client.updatedAt)}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="text-sm text-white">Client created</p>
                  <p className="text-xs text-stone-500">{formatDate(client.createdAt)}</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </PageContent>
    </>
  );
}
