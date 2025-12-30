'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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
  Avatar,
  ConfirmModal,
  formatCurrency,
  formatDate,
  type Column,
  type SortDirection,
} from '@/components/ui';
import { PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';
import { householdsService, Household } from '@/services/households.service';
import { AddHouseholdModal } from '@/components/modals';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const statusMap: Record<string, { label: string; variant: StatusVariant }> = {
  active: { label: 'Active', variant: 'success' },
  prospect: { label: 'Prospect', variant: 'info' },
  inactive: { label: 'Inactive', variant: 'default' },
  closed: { label: 'Closed', variant: 'error' },
};

export default function HouseholdsPage() {
  const router = useRouter();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [sortState, setSortState] = useState<{ column: string; direction: SortDirection }>({
    column: 'name',
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteHouseholdId, setDeleteHouseholdId] = useState<string | null>(null);
  const pageSize = 10;

  const fetchHouseholds = async () => {
    try {
      setLoading(true);
      const data = await householdsService.getHouseholds();
      setHouseholds(data);
    } catch (error) {
      console.error('Failed to fetch households:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, []);

  const handleDeleteHousehold = async () => {
    if (!deleteHouseholdId) return;
    try {
      await householdsService.deleteHousehold(deleteHouseholdId);
      setDeleteHouseholdId(null);
      fetchHouseholds();
    } catch (error) {
      console.error('Failed to delete household:', error);
    }
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = households;

    // Search filter
    if (searchValue) {
      const query = searchValue.toLowerCase();
      filtered = households.filter(
        (h) =>
          h.name.toLowerCase().includes(query) ||
          h.status.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortState.column && sortState.direction) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';

        switch (sortState.column) {
          case 'name':
            aVal = a.name;
            bVal = b.name;
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          case 'totalAum':
            aVal = a.totalAum;
            bVal = b.totalAum;
            break;
          case 'riskTolerance':
            aVal = a.riskTolerance || '';
            bVal = b.riskTolerance || '';
            break;
          case 'lastReviewDate':
            aVal = a.lastReviewDate || '';
            bVal = b.lastReviewDate || '';
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
  }, [households, searchValue, sortState]);

  // Paginate
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage]);

  const columns: Column<Household>[] = [
    {
      id: 'name',
      header: 'Household',
      accessorKey: 'name',
      sortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-content-primary">{row.name}</p>
          </div>
        </div>
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
      id: 'totalAum',
      header: 'Total AUM',
      accessorKey: 'totalAum',
      sortable: true,
      align: 'right',
      cell: ({ value }) => (
        <span className="font-medium text-content-primary">
          {formatCurrency(value as number)}
        </span>
      ),
    },
    {
      id: 'riskTolerance',
      header: 'Risk Tolerance',
      accessorKey: 'riskTolerance',
      sortable: true,
      cell: ({ value }) => (
        <span className="capitalize text-content-secondary">
          {(value as string) || 'N/A'}
        </span>
      ),
    },
    {
      id: 'lastReviewDate',
      header: 'Last Review',
      accessorKey: 'lastReviewDate',
      sortable: true,
      hiddenOnMobile: true,
      cell: ({ value }) => (
        <span className="text-content-secondary">
          {value ? formatDate(value as string) : 'Never'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: '120px',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/households/${row.id}`}>
            <Button variant="ghost" size="sm" title="View details">
              <EyeIcon className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/households/${row.id}/edit`);
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
              setDeleteHouseholdId(row.id);
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

  return (
    <>
      <PageHeader
        title="Households"
        subtitle={`${processedData.length} household${processedData.length !== 1 ? 's' : ''} total`}
        actions={
          <Button 
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Household
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
              router.push(`/households/${row.id}`);
            }}
            striped
            emptyState={
              <div className="text-center py-8">
                <p className="text-content-secondary mb-4">
                  No households found. Click &quot;Add Household&quot; to create one.
                </p>
                <Button 
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                  onClick={() => setShowAddModal(true)}
                >
                  Add Household
                </Button>
              </div>
            }
          />
        </Card>
      </PageContent>

      {/* Add Household Modal */}
      <AddHouseholdModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchHouseholds}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteHouseholdId}
        onClose={() => setDeleteHouseholdId(null)}
        onConfirm={handleDeleteHousehold}
        title="Delete Household"
        message="Are you sure you want to delete this household? This action cannot be undone and will remove all associated data."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
