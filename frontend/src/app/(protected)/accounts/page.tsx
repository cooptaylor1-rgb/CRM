'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PageHeader, 
  PageContent 
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  StatusBadge,
  DataTable,
  ConfirmModal,
  formatCurrency,
  type Column,
  type SortDirection,
} from '@/components/ui';
import { PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';
import { accountsService, Account } from '@/services/accounts.service';
import { AddAccountModal } from '@/components/modals';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const statusMap: Record<string, { label: string; variant: StatusVariant }> = {
  open: { label: 'Open', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  closed: { label: 'Closed', variant: 'error' },
  restricted: { label: 'Restricted', variant: 'warning' },
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
  custodial: 'Custodial',
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [sortState, setSortState] = useState<{ column: string; direction: SortDirection }>({
    column: 'accountName',
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const pageSize = 10;

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDeleteAccount = async () => {
    if (!deleteAccountId) return;
    try {
      await accountsService.deleteAccount(deleteAccountId);
      setDeleteAccountId(null);
      fetchAccounts();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = accounts;

    // Search filter
    if (searchValue) {
      const query = searchValue.toLowerCase();
      filtered = accounts.filter(
        (a) =>
          a.accountName.toLowerCase().includes(query) ||
          a.accountNumber.toLowerCase().includes(query) ||
          a.accountType.toLowerCase().includes(query) ||
          (a.custodian && a.custodian.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortState.column && sortState.direction) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';

        switch (sortState.column) {
          case 'accountNumber':
            aVal = a.accountNumber;
            bVal = b.accountNumber;
            break;
          case 'accountName':
            aVal = a.accountName;
            bVal = b.accountName;
            break;
          case 'accountType':
            aVal = a.accountType;
            bVal = b.accountType;
            break;
          case 'currentValue':
            aVal = a.currentValue;
            bVal = b.currentValue;
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortState.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const comparison = String(aVal).localeCompare(String(bVal));
        return sortState.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [accounts, searchValue, sortState]);

  // Paginate
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage]);

  const columns: Column<Account>[] = [
    {
      id: 'accountNumber',
      header: 'Account #',
      accessorKey: 'accountNumber',
      sortable: true,
      cell: ({ value }) => (
        <span className="font-mono text-sm text-content-primary">{value as string}</span>
      ),
    },
    {
      id: 'accountName',
      header: 'Name',
      accessorKey: 'accountName',
      sortable: true,
      cell: ({ value }) => (
        <span className="font-medium text-content-primary">{value as string}</span>
      ),
    },
    {
      id: 'accountType',
      header: 'Type',
      accessorKey: 'accountType',
      sortable: true,
      cell: ({ value }) => (
        <span className="text-content-secondary capitalize">
          {accountTypeLabels[value as string] || (value as string).replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      id: 'custodian',
      header: 'Custodian',
      accessorKey: 'custodian',
      hiddenOnMobile: true,
      cell: ({ value }) => (
        <span className="text-content-secondary">
          {(value as string) || 'N/A'}
        </span>
      ),
    },
    {
      id: 'currentValue',
      header: 'Value',
      accessorKey: 'currentValue',
      sortable: true,
      align: 'right',
      cell: ({ value }) => (
        <span className="font-medium text-content-primary">
          {formatCurrency(value as number)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: ({ value }) => {
        const status = statusMap[value as string] || { label: String(value), variant: 'default' as StatusVariant };
        return <StatusBadge status={status.variant} label={status.label} />;
      },
    },
    {
      id: 'actions',
      header: '',
      width: '120px',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            title="View details"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/accounts/${row.id}`);
            }}
          >
            <EyeIcon className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/accounts/${row.id}/edit`);
            }}
          >
            <PencilSquareIcon className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteAccountId(row.id);
            }}
          >
            <TrashIcon className="w-4 h-4 text-status-error-text" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSortChange = (column: string, direction: SortDirection) => {
    setSortState({ column, direction });
    setCurrentPage(1);
  };

  // Calculate total AUM
  const totalAum = accounts.reduce((sum, acc) => sum + acc.currentValue, 0);

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle={`${processedData.length} account${processedData.length !== 1 ? 's' : ''} • ${formatCurrency(totalAum)} total AUM`}
        actions={
          <Button 
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Account
          </Button>
        }
      />

      <PageContent>
        <Card noPadding>
          <DataTable
            data={paginatedData}
            columns={columns}
            loading={loading}
            searchable
            searchValue={searchValue}
            onSearchChange={(value) => {
              setSearchValue(value);
              setCurrentPage(1);
            }}
            sortState={sortState}
            onSortChange={handleSortChange}
            pagination={{
              currentPage,
              pageSize,
              totalItems: processedData.length,
              onPageChange: setCurrentPage,
            }}
            onRowClick={(row) => {
              router.push(`/accounts/${row.id}`);
            }}
            striped
            emptyState={
              <div className="text-center py-8">
                <p className="text-content-secondary mb-4">
                  No accounts found. Click &quot;Add Account&quot; to create one.
                </p>
                <Button 
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                  onClick={() => setShowAddModal(true)}
                >
                  Add Account
                </Button>
              </div>
            }
          />
        </Card>
      </PageContent>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchAccounts}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteAccountId}
        onClose={() => setDeleteAccountId(null)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete this account? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
