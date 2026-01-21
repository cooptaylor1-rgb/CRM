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
  Select,
  StatusBadge,
  Modal,
} from '@/components/ui';
import { 
  PlusIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  EyeIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/components/ui/utils';
import { billingService, Invoice, BillingRun, InvoiceStatus } from '@/services/billing.service';
import { formatDistanceToNow, format } from 'date-fns';

const statusStyles: Record<InvoiceStatus, { color: 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }> = {
  draft: { color: 'default', label: 'Draft' },
  pending: { color: 'warning', label: 'Pending' },
  sent: { color: 'info', label: 'Sent' },
  paid: { color: 'success', label: 'Paid' },
  overdue: { color: 'error', label: 'Overdue' },
  void: { color: 'default', label: 'Void' },
  disputed: { color: 'error', label: 'Disputed' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'billing-runs' | 'reports'>('invoices');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showRunBillingModal, setShowRunBillingModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await billingService.getAll();
        // Ensure data is always an array
        setInvoices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Ensure invoices is always an array for safe array operations
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  
  const filteredInvoices = statusFilter === 'all' 
    ? safeInvoices 
    : safeInvoices.filter(i => i.status === statusFilter);

  const stats = {
    totalOutstanding: safeInvoices.filter(i => ['sent', 'viewed', 'partial', 'overdue'].includes(i.status))
      .reduce((s, i) => s + i.amountDue - i.amountPaid, 0),
    totalCollected: safeInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amountPaid, 0),
    overdueCount: safeInvoices.filter(i => i.status === 'overdue').length,
    pendingCount: safeInvoices.filter(i => ['sent', 'viewed'].includes(i.status)).length,
  };

  const handleSendInvoice = async (invoiceId: string) => {
    await billingService.send(invoiceId);
    setInvoices(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map(i => 
        i.id === invoiceId ? { ...i, status: 'sent' as InvoiceStatus, sentAt: new Date().toISOString() } : i
      );
    });
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Billing" subtitle="Loading..." />
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Billing & Invoicing"
        subtitle="Generate invoices and manage fee collection"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              leftIcon={<ArrowPathIcon className="w-4 h-4" />}
              onClick={() => setShowRunBillingModal(true)}
            >
              Run Billing
            </Button>
            <Button 
              variant="primary" 
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              Create Invoice
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Stats */}
        <MetricGrid columns={4} className="mb-6">
          <MetricCard
            label="Outstanding"
            value={formatCurrency(stats.totalOutstanding)}
            subtext={`${stats.pendingCount} pending invoices`}
            icon="currency"
          />
          <MetricCard
            label="Collected YTD"
            value={formatCurrency(stats.totalCollected)}
            icon="revenue"
          />
          <MetricCard
            label="Overdue"
            value={stats.overdueCount.toString()}
            subtext="Invoices past due"
            icon="tasks"
          />
          <MetricCard
            label="Average Days to Pay"
            value="14"
            subtext="Last 90 days"
            icon="calendar"
          />
        </MetricGrid>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1">
            {[
              { id: 'invoices', label: 'Invoices' },
              { id: 'billing-runs', label: 'Billing Runs' },
              { id: 'reports', label: 'Reports' },
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

          {activeTab === 'invoices' && (
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'draft', label: 'Draft' },
                { value: 'sent', label: 'Sent' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
              ]}
            />
          )}
        </div>

        {activeTab === 'invoices' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Invoice #</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Household</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Period</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Amount</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Paid</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Due Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-content-primary">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-content-primary">{invoice.householdName}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-content-secondary">
                        {format(new Date(invoice.periodStart), 'MMM d')} - {format(new Date(invoice.periodEnd), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-content-primary text-right font-medium">
                        {formatCurrency(invoice.amountDue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={invoice.amountPaid > 0 ? 'text-status-success-text font-medium' : 'text-content-tertiary'}>
                          {formatCurrency(invoice.amountPaid)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-content-secondary">
                        {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={statusStyles[invoice.status].color}
                          label={statusStyles[invoice.status].label}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          {invoice.status === 'draft' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleSendInvoice(invoice.id)}
                            >
                              <PaperAirplaneIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <PrinterIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'billing-runs' && (
          <Card>
            <CardHeader 
              title="Billing Runs" 
              subtitle="Batch invoice generation history"
              action={
                <Button 
                  variant="primary" 
                  size="sm"
                  leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                  onClick={() => setShowRunBillingModal(true)}
                >
                  New Billing Run
                </Button>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Run ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Period</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Run Date</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Invoices</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Total Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { id: 'BR-2024-001', type: 'Quarterly', period: 'Q4 2023', date: '2024-01-01', invoices: 85, amount: 245000, status: 'completed' },
                    { id: 'BR-2023-004', type: 'Quarterly', period: 'Q3 2023', date: '2023-10-01', invoices: 82, amount: 238500, status: 'completed' },
                    { id: 'BR-2023-003', type: 'Quarterly', period: 'Q2 2023', date: '2023-07-01', invoices: 78, amount: 225000, status: 'completed' },
                  ].map(run => (
                    <tr key={run.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-content-primary">{run.id}</td>
                      <td className="px-4 py-3 text-sm text-content-secondary">{run.type}</td>
                      <td className="px-4 py-3 text-sm text-content-primary font-medium">{run.period}</td>
                      <td className="px-4 py-3 text-sm text-content-secondary">{format(new Date(run.date), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-sm text-content-primary text-right">{run.invoices}</td>
                      <td className="px-4 py-3 text-sm text-content-primary text-right font-medium">{formatCurrency(run.amount)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status="success" label="Completed" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Revenue Summary', description: 'Monthly and quarterly revenue breakdown', icon: CurrencyDollarIcon },
              { title: 'Aging Report', description: 'Outstanding invoices by age bucket', icon: ClockIcon },
              { title: 'Collection Report', description: 'Payment collection timeline', icon: CheckCircleIcon },
              { title: 'Fee Analysis', description: 'Fee breakdown by type and client', icon: DocumentTextIcon },
            ].map(report => (
              <Card key={report.title} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-accent-100 rounded-lg">
                    <report.icon className="w-6 h-6 text-accent-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-content-primary">{report.title}</h3>
                    <p className="text-sm text-content-secondary mt-1 mb-4">{report.description}</p>
                    <Button size="sm" variant="secondary" leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}>
                      Generate
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContent>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          size="lg"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-content-primary">{selectedInvoice.householdName}</h3>
                <p className="text-sm text-content-tertiary">
                  {format(new Date(selectedInvoice.periodStart), 'MMM d')} - {format(new Date(selectedInvoice.periodEnd), 'MMM d, yyyy')}
                </p>
              </div>
              <StatusBadge
                status={statusStyles[selectedInvoice.status].color}
                label={statusStyles[selectedInvoice.status].label}
              />
            </div>

            <div className="border border-border rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-secondary">
                    <th className="text-left px-4 py-2 text-xs font-medium text-content-secondary">Description</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-content-secondary">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedInvoice.lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-content-primary">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-content-primary text-right font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-secondary">
                    <td className="px-4 py-3 text-sm font-semibold text-content-primary">Total</td>
                    <td className="px-4 py-3 text-sm font-semibold text-content-primary text-right">
                      {formatCurrency(selectedInvoice.amountDue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-content-tertiary">Created</p>
                <p className="font-medium text-content-primary">
                  {format(new Date(selectedInvoice.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-content-tertiary">Due Date</p>
                <p className="font-medium text-content-primary">
                  {format(new Date(selectedInvoice.dueDate), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
              <Button variant="ghost" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
              <Button variant="secondary" leftIcon={<PrinterIcon className="w-4 h-4" />}>
                Print
              </Button>
              {selectedInvoice.status === 'draft' && (
                <Button 
                  variant="primary" 
                  leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}
                  onClick={() => {
                    handleSendInvoice(selectedInvoice.id);
                    setSelectedInvoice(null);
                  }}
                >
                  Send Invoice
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Run Billing Modal */}
      <Modal
        isOpen={showRunBillingModal}
        onClose={() => setShowRunBillingModal(false)}
        title="Run Billing"
        size="md"
      >
        <div className="p-6">
          <p className="text-sm text-content-secondary mb-6">
            Generate invoices for all eligible accounts based on their fee schedules.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                Billing Period
              </label>
              <Select
                options={[
                  { value: 'q1-2024', label: 'Q1 2024 (Jan - Mar)' },
                  { value: 'q4-2023', label: 'Q4 2023 (Oct - Dec)' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                Fee Type
              </label>
              <Select
                options={[
                  { value: 'all', label: 'All Fee Types' },
                  { value: 'management', label: 'Management Fees Only' },
                  { value: 'advisory', label: 'Advisory Fees Only' },
                ]}
              />
            </div>

            <div className="p-4 bg-surface-secondary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-content-secondary">Eligible Accounts</span>
                <span className="text-sm font-medium text-content-primary">85</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-content-secondary">Estimated Total</span>
                <span className="text-sm font-medium text-content-primary">{formatCurrency(245000)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
            <Button variant="ghost" onClick={() => setShowRunBillingModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" leftIcon={<ArrowPathIcon className="w-4 h-4" />}>
              Generate Invoices
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
