'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, PageContent } from '@/components/layout/AppShell';
import { Button, Card, StatusBadge, formatCurrency, formatDate } from '@/components/ui';
import { accountsService, Account } from '@/services/accounts.service';
import { AssetAllocationManager, FeeScheduleManager } from '@/components/features';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const statusMap: Record<string, { label: string; variant: StatusVariant }> = {
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'info' },
  inactive: { label: 'Inactive', variant: 'default' },
  closed: { label: 'Closed', variant: 'error' },
};

const accountTypeLabels: Record<string, string> = {
  individual: 'Individual',
  joint: 'Joint',
  ira: 'IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  trust: 'Trust',
  corporate: 'Corporate',
  partnership: 'Partnership',
  estate: 'Estate',
  custodial: 'Custodial',
};

const managementStyleLabels: Record<string, string> = {
  discretionary: 'Discretionary',
  non_discretionary: 'Non-Discretionary',
  advisory: 'Advisory',
};

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await accountsService.getAccount(accountId);
        setAccount(data);
      } catch (err: any) {
        console.error('Failed to fetch account:', err);
        setError(err.response?.data?.message || 'Failed to load account');
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchAccount();
    }
  }, [accountId]);

  if (loading) {
    return (
      <>
        <PageHeader title="Loading..." />
        <PageContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !account) {
    return (
      <>
        <PageHeader title="Account Not Found" />
        <PageContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BanknotesIcon className="w-16 h-16 text-stone-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Account Not Found</h2>
            <p className="text-stone-400 mb-6">{error || 'The account you are looking for does not exist.'}</p>
            <Link href="/accounts">
              <Button variant="secondary" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
                Back to Accounts
              </Button>
            </Link>
          </div>
        </PageContent>
      </>
    );
  }

  const status = statusMap[account.status] || { label: account.status, variant: 'default' as StatusVariant };

  return (
    <>
      <PageHeader
        title={account.accountName}
        subtitle={
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={status.variant} label={status.label} />
            <span className="text-sm text-stone-400">{account.accountNumber}</span>
            {account.accountType && (
              <span className="text-sm text-stone-400">
                • {accountTypeLabels[account.accountType] || account.accountType}
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/accounts">
              <Button variant="ghost" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
                Back
              </Button>
            </Link>
            <Button
              variant="secondary"
              leftIcon={<PencilSquareIcon className="w-4 h-4" />}
              onClick={() => router.push(`/accounts/${accountId}/edit`)}
            >
              Edit
            </Button>
          </div>
        }
      />

      <PageContent>
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                    <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-400">Current Value</p>
                    <p className="text-xl font-semibold text-white">
                      {formatCurrency(account.currentValue)}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-lg">
                    <IdentificationIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-400">Account Type</p>
                    <p className="text-lg font-medium text-white">
                      {accountTypeLabels[account.accountType] || account.accountType}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 rounded-lg">
                    <BuildingOfficeIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-400">Custodian</p>
                    <p className="text-lg font-medium text-white">
                      {account.custodian || 'Not Set'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-lg">
                    <ChartPieIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-400">Management Style</p>
                    <p className="text-lg font-medium text-white">
                      {managementStyleLabels[account.managementStyle || ''] || account.managementStyle || 'Not Set'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Account Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="font-medium text-white">Account Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Account Number</span>
                    <span className="text-white font-mono">{account.accountNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Opened Date</span>
                    <span className="text-white">
                      {account.openedDate ? formatDate(account.openedDate) : 'Not Set'}
                    </span>
                  </div>
                  {account.closedDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Closed Date</span>
                      <span className="text-white">{formatDate(account.closedDate)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Created</span>
                    <span className="text-white">{formatDate(account.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Last Updated</span>
                    <span className="text-white">{formatDate(account.updatedAt)}</span>
                  </div>
                  {account.householdId && (
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Household</span>
                      <Link href={`/households/${account.householdId}`} className="text-blue-400 hover:text-blue-300">
                        View Household
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Asset Allocation & Fee Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <AssetAllocationManager
                entityType="account"
                entityId={accountId}
                entityName={account.accountName}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <FeeScheduleManager
                entityType="account"
                entityId={accountId}
                entityName={account.accountName}
                currentAUM={account.currentValue}
              />
            </motion.div>
          </div>
        </div>
      </PageContent>
    </>
  );
}
