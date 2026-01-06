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
  Input,
} from '@/components/ui';
import { 
  PlusIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PaperAirplaneIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CursorArrowRaysIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import { Fragment } from 'react';
import { cn } from '@/components/ui/utils';
import { 
  emailTemplatesService, 
  EmailTemplate, 
  SentEmail,
  EmailStats,
  EmailTemplateCategory,
} from '@/services/email-templates.service';
import { formatDistanceToNow, format } from 'date-fns';

const statusStyles: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: 'Draft' },
  sent: { color: 'info', label: 'Sent' },
  delivered: { color: 'success', label: 'Delivered' },
  opened: { color: 'success', label: 'Opened' },
  clicked: { color: 'success', label: 'Clicked' },
  bounced: { color: 'error', label: 'Bounced' },
  failed: { color: 'error', label: 'Failed' },
};

const categoryColors: Record<EmailTemplateCategory, string> = {
  onboarding: 'bg-status-success-bg text-status-success-text',
  compliance: 'bg-status-warning-bg text-status-warning-text',
  client_service: 'bg-accent-100 text-accent-700',
  billing: 'bg-status-info-bg text-status-info-text',
  marketing: 'bg-purple-100 text-purple-700',
  meeting: 'bg-cyan-100 text-cyan-700',
  document: 'bg-orange-100 text-orange-700',
  system: 'bg-gray-100 text-gray-700',
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'sent' | 'analytics'>('templates');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [templatesData, sentData, statsData] = await Promise.all([
          emailTemplatesService.getTemplates(),
          emailTemplatesService.getSentEmails(),
          emailTemplatesService.getStats(),
        ]);
        setTemplates(templatesData);
        setSentEmails(sentData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch email data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const categories = emailTemplatesService.getCategories();
  const filteredTemplates = categoryFilter === 'all' 
    ? templates 
    : templates.filter(t => t.category === categoryFilter);

  if (loading) {
    return (
      <>
        <PageHeader title="Email Templates" subtitle="Loading..." />
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
        title="Email Templates"
        subtitle="Create, manage, and track email communications"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}
              onClick={() => setShowComposeModal(true)}
            >
              Compose
            </Button>
            <Button 
              variant="primary" 
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              New Template
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Stats */}
        {stats && (
          <MetricGrid columns={4} className="mb-6">
            <MetricCard
              label="Emails Sent"
              value={stats.totalSent.toLocaleString()}
              subtext="All time"
              icon="documents"
            />
            <MetricCard
              label="Delivery Rate"
              value={`${stats.deliveryRate.toFixed(1)}%`}
              subtext={`${stats.totalDelivered.toLocaleString()} delivered`}
              icon="tasks"
            />
            <MetricCard
              label="Open Rate"
              value={`${stats.openRate.toFixed(1)}%`}
              subtext={`${stats.totalOpened.toLocaleString()} opened`}
              icon="growth"
            />
            <MetricCard
              label="Click Rate"
              value={`${stats.clickRate.toFixed(1)}%`}
              subtext={`${stats.totalClicked.toLocaleString()} clicks`}
              icon="pipeline"
            />
          </MetricGrid>
        )}

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1">
            {[
              { id: 'templates', label: 'Templates' },
              { id: 'sent', label: 'Sent Emails' },
              { id: 'analytics', label: 'Analytics' },
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

          {activeTab === 'templates' && (
            <Select
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(c => ({ value: c.value, label: c.label })),
              ]}
            />
          )}
        </div>

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          categoryColors[template.category]
                        )}>
                          {categories.find(c => c.value === template.category)?.label}
                        </span>
                        {template.isSystem && (
                          <span className="px-1.5 py-0.5 text-xs bg-surface-secondary text-content-tertiary rounded">
                            System
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-content-primary truncate">{template.name}</h3>
                    </div>

                    <Menu as="div" className="relative">
                      <Menu.Button className="p-1 rounded-md hover:bg-surface-secondary">
                        <EllipsisHorizontalIcon className="w-5 h-5 text-content-tertiary" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 mt-1 w-40 bg-surface rounded-lg border border-border shadow-lg py-1 z-10">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setShowPreview(true);
                                }}
                                className={cn(
                                  'w-full flex items-center gap-2 px-3 py-2 text-sm',
                                  active && 'bg-surface-secondary'
                                )}
                              >
                                <EyeIcon className="w-4 h-4" /> Preview
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={cn(
                                  'w-full flex items-center gap-2 px-3 py-2 text-sm',
                                  active && 'bg-surface-secondary'
                                )}
                              >
                                <PencilSquareIcon className="w-4 h-4" /> Edit
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={cn(
                                  'w-full flex items-center gap-2 px-3 py-2 text-sm',
                                  active && 'bg-surface-secondary'
                                )}
                              >
                                <DocumentDuplicateIcon className="w-4 h-4" /> Duplicate
                              </button>
                            )}
                          </Menu.Item>
                          {!template.isSystem && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-status-error-text',
                                    active && 'bg-surface-secondary'
                                  )}
                                >
                                  <TrashIcon className="w-4 h-4" /> Delete
                                </button>
                              )}
                            </Menu.Item>
                          )}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>

                  {/* Subject Preview */}
                  <div className="mb-3">
                    <p className="text-xs text-content-tertiary mb-1">Subject</p>
                    <p className="text-sm text-content-secondary truncate">{template.subject}</p>
                  </div>

                  {/* Variables */}
                  {template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.variables.slice(0, 4).map(variable => (
                        <span 
                          key={variable}
                          className="px-1.5 py-0.5 text-xs bg-surface-secondary text-content-tertiary rounded font-mono"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                      {template.variables.length > 4 && (
                        <span className="px-1.5 py-0.5 text-xs text-content-tertiary">
                          +{template.variables.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm pt-3 border-t border-border">
                    <div className="flex items-center gap-1 text-content-tertiary">
                      <EnvelopeIcon className="w-4 h-4" />
                      <span>{template.usageCount} sent</span>
                    </div>
                    {template.lastUsedAt && (
                      <div className="text-content-tertiary">
                        Last: {formatDistanceToNow(new Date(template.lastUsedAt), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-3 bg-surface-secondary border-t border-border">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowComposeModal(true);
                    }}
                  >
                    Use Template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'sent' && (
          <Card>
            <CardHeader title="Sent Emails" subtitle="Track delivery and engagement" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Recipient</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Subject</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Template</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Sent</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Opens</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-content-secondary uppercase tracking-wider">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sentEmails.map(email => (
                    <tr key={email.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-content-primary">{email.toName || email.to}</p>
                          <p className="text-xs text-content-tertiary">{email.to}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-content-secondary max-w-xs truncate">
                        {email.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-content-secondary">
                        {email.templateName || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-content-secondary">
                        {format(new Date(email.sentAt), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={statusStyles[email.status]?.color as 'success' | 'warning' | 'error' | 'info' | 'default'}
                          label={statusStyles[email.status]?.label || email.status}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'font-medium',
                          email.openCount > 0 ? 'text-status-success-text' : 'text-content-tertiary'
                        )}>
                          {email.openCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'font-medium',
                          email.clickCount > 0 ? 'text-status-success-text' : 'text-content-tertiary'
                        )}>
                          {email.clickCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'analytics' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Email Performance" subtitle="Last 30 days" />
              <div className="p-6 space-y-6">
                {[
                  { label: 'Delivery Rate', value: stats.deliveryRate, color: 'bg-status-success-text' },
                  { label: 'Open Rate', value: stats.openRate, color: 'bg-accent-500' },
                  { label: 'Click Rate', value: stats.clickRate, color: 'bg-status-info-text' },
                  { label: 'Bounce Rate', value: stats.bounceRate, color: 'bg-status-error-text' },
                ].map(metric => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-content-secondary">{metric.label}</span>
                      <span className="text-sm font-medium text-content-primary">{metric.value.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn('h-full rounded-full transition-all', metric.color)}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Top Performing Templates" subtitle="By open rate" />
              <div className="p-6 space-y-4">
                {templates
                  .filter(t => t.usageCount > 0)
                  .sort((a, b) => b.usageCount - a.usageCount)
                  .slice(0, 5)
                  .map((template, idx) => (
                    <div key={template.id} className="flex items-center gap-4">
                      <span className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-xs font-medium text-content-tertiary">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-content-primary truncate">{template.name}</p>
                        <p className="text-xs text-content-tertiary">{template.usageCount} emails sent</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-content-primary">72%</p>
                        <p className="text-xs text-content-tertiary">open rate</p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}
      </PageContent>

      {/* Preview Modal */}
      {selectedTemplate && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Template Preview"
          size="lg"
        >
          <div className="p-6">
            <div className="mb-4">
              <p className="text-xs text-content-tertiary mb-1">Subject</p>
              <p className="text-sm font-medium text-content-primary">{selectedTemplate.subject}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-content-tertiary mb-1">Body</p>
              <div className="p-4 bg-surface-secondary rounded-lg text-sm text-content-secondary whitespace-pre-wrap font-mono">
                {selectedTemplate.body}
              </div>
            </div>

            {selectedTemplate.variables.length > 0 && (
              <div>
                <p className="text-xs text-content-tertiary mb-2">Variables</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map(v => (
                    <span key={v} className="px-2 py-1 bg-surface-secondary text-content-secondary text-xs rounded font-mono">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Compose Modal */}
      <Modal
        isOpen={showComposeModal}
        onClose={() => {
          setShowComposeModal(false);
          setSelectedTemplate(null);
        }}
        title={selectedTemplate ? `Send: ${selectedTemplate.name}` : 'Compose Email'}
        size="lg"
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">To</label>
              <Input 
                placeholder="Enter recipient email(s)" 
                className="w-full"
              />
              <p className="text-xs text-content-tertiary mt-1">Separate multiple emails with commas</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">Subject</label>
              <Input 
                defaultValue={selectedTemplate?.subject || ''}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">Message</label>
              <textarea 
                rows={10}
                defaultValue={selectedTemplate?.body || ''}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border border-border',
                  'bg-surface-primary text-content-primary text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent',
                  'resize-none'
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
            <Button variant="ghost" onClick={() => setShowComposeModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}>
              Send Email
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
