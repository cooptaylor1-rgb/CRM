'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MailIcon,
  SendIcon,
  InboxIcon,
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  TagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  MousePointerClickIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  UsersIcon,
  EditIcon,
  CopyIcon,
  TrashIcon,
  Loader2Icon,
  LayoutTemplateIcon,
  BarChart3Icon,
  TrendingUpIcon,
} from 'lucide-react';
import { Card, Badge, Button, Input, Select, Modal, ModalFooter, FormGroup, Skeleton } from '@/components/ui';
import {
  emailTemplatesService,
  EmailTemplate,
  SentEmail,
  EmailTemplateCategory,
  EmailStatus,
  EmailStats,
} from '@/services/email-templates.service';

// =============================================================================
// Types
// =============================================================================

type TabType = 'compose' | 'templates' | 'sent' | 'analytics';

// =============================================================================
// Component
// =============================================================================

export function CommunicationHub() {
  const [activeTab, setActiveTab] = React.useState<TabType>('compose');
  const [loading, setLoading] = React.useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <MailIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Communication Hub</h1>
            <p className="text-sm text-muted-foreground">
              Email templates, campaigns, and analytics
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { id: 'compose', label: 'Compose', icon: SendIcon },
          { id: 'templates', label: 'Templates', icon: LayoutTemplateIcon },
          { id: 'sent', label: 'Sent Emails', icon: InboxIcon },
          { id: 'analytics', label: 'Analytics', icon: BarChart3Icon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'compose' && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ComposeEmail />
            </motion.div>
          )}
          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TemplateLibrary />
            </motion.div>
          )}
          {activeTab === 'sent' && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SentEmailsList />
            </motion.div>
          )}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EmailAnalytics />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// =============================================================================
// Compose Email
// =============================================================================

function ComposeEmail() {
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('');
  const [formData, setFormData] = React.useState({
    recipients: '',
    subject: '',
    body: '',
  });
  const [variables, setVariables] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await emailTemplatesService.getTemplates();
      setTemplates(data);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = await emailTemplatesService.getTemplate(templateId);
      if (template) {
        setFormData({
          ...formData,
          subject: template.subject,
          body: template.body,
        });
        // Initialize variables
        const vars: Record<string, string> = {};
        template.variables.forEach((v) => {
          vars[v] = '';
        });
        setVariables(vars);
      }
    }
  };

  const handleSend = async () => {
    if (!formData.recipients.trim()) {
      toast.error('Please enter at least one recipient');
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    setSending(true);
    try {
      const recipients = formData.recipients.split(',').map((r) => r.trim());
      const renderedSubject = emailTemplatesService.renderTemplate(formData.subject, variables);
      const renderedBody = emailTemplatesService.renderTemplate(formData.body, variables);

      await emailTemplatesService.sendEmail({
        templateId: selectedTemplate || undefined,
        to: recipients,
        subject: renderedSubject,
        body: renderedBody,
        variables,
      });

      toast.success(`Email sent to ${recipients.length} recipient(s)`);
      setFormData({ recipients: '', subject: '', body: '' });
      setSelectedTemplate('');
      setVariables({});
    } catch {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const detectedVariables = React.useMemo(() => {
    const subjectVars = emailTemplatesService.extractVariables(formData.subject);
    const bodyVars = emailTemplatesService.extractVariables(formData.body);
    return [...new Set([...subjectVars, ...bodyVars])];
  }, [formData.subject, formData.body]);

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Compose Form */}
      <Card className="lg:col-span-2 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Compose Email</h2>
        <FormGroup>
          <Select
            label="Use Template (Optional)"
            options={[
              { value: '', label: 'No template - start from scratch' },
              ...templates.map((t) => ({ value: t.id, label: t.name })),
            ]}
            value={selectedTemplate}
            onChange={handleTemplateSelect}
          />

          <Input
            label="Recipients"
            placeholder="Enter email addresses separated by commas"
            value={formData.recipients}
            onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
          />

          <Input
            label="Subject"
            placeholder="Email subject line"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Message Body
            </label>
            <textarea
              className="w-full h-64 p-3 border border-border rounded-lg bg-background text-foreground resize-none"
              placeholder="Compose your email message..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use {`{{variable_name}}`} syntax for dynamic content
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={sending} className="gap-2">
              {sending ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <SendIcon className="w-4 h-4" />
              )}
              Send Email
            </Button>
          </div>
        </FormGroup>
      </Card>

      {/* Variables Panel */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TagIcon className="w-4 h-4" />
          Template Variables
        </h3>
        {detectedVariables.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No variables detected. Add variables using {`{{name}}`} syntax.
          </p>
        ) : (
          <div className="space-y-3">
            {detectedVariables.map((varName) => (
              <div key={varName}>
                <label className="block text-xs text-muted-foreground mb-1">
                  {varName}
                </label>
                <Input
                  placeholder={`Value for ${varName}`}
                  value={variables[varName] || ''}
                  onChange={(e) =>
                    setVariables({ ...variables, [varName]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// =============================================================================
// Template Library
// =============================================================================

function TemplateLibrary() {
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState<EmailTemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showEditor, setShowEditor] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<EmailTemplate | null>(null);

  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await emailTemplatesService.getTemplates();
      setTemplates(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = React.useMemo(() => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.subject.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [templates, selectedCategory, searchQuery]);

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      await emailTemplatesService.duplicateTemplate(template.id);
      toast.success('Template duplicated');
      loadTemplates();
    } catch {
      toast.error('Failed to duplicate template');
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (template.isSystem) {
      toast.error('System templates cannot be deleted');
      return;
    }
    try {
      await emailTemplatesService.deleteTemplate(template.id);
      toast.success('Template deleted');
      loadTemplates();
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const categories = emailTemplatesService.getCategories();
  const categoryColors: Record<EmailTemplateCategory, string> = {
    onboarding: 'bg-green-100 text-green-800',
    compliance: 'bg-red-100 text-red-800',
    client_service: 'bg-blue-100 text-blue-800',
    billing: 'bg-yellow-100 text-yellow-800',
    marketing: 'bg-purple-100 text-purple-800',
    meeting: 'bg-pink-100 text-pink-800',
    document: 'bg-orange-100 text-orange-800',
    system: 'bg-gray-100 text-gray-800',
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground w-64"
            />
          </div>
          <Select
            value={selectedCategory}
            onChange={(v) => setSelectedCategory(v as EmailTemplateCategory | 'all')}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map((c) => ({ value: c.value, label: c.label })),
            ]}
          />
        </div>
        <Button className="gap-2" onClick={() => setShowEditor(true)}>
          <PlusIcon className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Badge className={categoryColors[template.category]}>
                  {categories.find((c) => c.value === template.category)?.label}
                </Badge>
                {template.isSystem && (
                  <Badge variant="secondary">System</Badge>
                )}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {template.subject}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>{template.usageCount} uses</span>
                <span>{template.variables.length} variables</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(template)}
                >
                  <EditIcon className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(template)}
                >
                  <CopyIcon className="w-3 h-3" />
                </Button>
                {!template.isSystem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileTextIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No templates found</p>
        </div>
      )}

      {/* Template Editor Modal */}
      <TemplateEditorModal
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSave={() => {
          loadTemplates();
          setShowEditor(false);
          setEditingTemplate(null);
        }}
      />
    </div>
  );
}

// =============================================================================
// Template Editor Modal
// =============================================================================

function TemplateEditorModal({
  isOpen,
  onClose,
  template,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  onSave: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    subject: '',
    body: '',
    category: 'client_service' as EmailTemplateCategory,
  });

  React.useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        category: template.category,
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        body: '',
        category: 'client_service',
      });
    }
  }, [template]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.subject.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const variables = emailTemplatesService.extractVariables(
        formData.subject + ' ' + formData.body
      );

      if (template) {
        await emailTemplatesService.updateTemplate(template.id, {
          ...formData,
          variables,
        });
        toast.success('Template updated');
      } else {
        await emailTemplatesService.createTemplate({
          ...formData,
          variables,
        });
        toast.success('Template created');
      }
      onSave();
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const categories = emailTemplatesService.getCategories();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? 'Edit Template' : 'Create Template'}
      size="lg"
    >
      <FormGroup>
        <Input
          label="Template Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Select
          label="Category"
          options={categories}
          value={formData.category}
          onChange={(v) => setFormData({ ...formData, category: v as EmailTemplateCategory })}
        />
        <Input
          label="Subject Line"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email Body
          </label>
          <textarea
            className="w-full h-48 p-3 border border-border rounded-lg bg-background text-foreground resize-none"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          />
        </div>
      </FormGroup>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// =============================================================================
// Sent Emails List
// =============================================================================

function SentEmailsList() {
  const [emails, setEmails] = React.useState<SentEmail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<EmailStatus | 'all'>('all');

  React.useEffect(() => {
    loadEmails();
  }, [statusFilter]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const filter = statusFilter === 'all' ? undefined : { status: statusFilter };
      const data = await emailTemplatesService.getSentEmails(filter);
      setEmails(data);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<EmailStatus, { icon: React.ElementType; color: string }> = {
    draft: { icon: FileTextIcon, color: 'text-gray-500' },
    sent: { icon: SendIcon, color: 'text-blue-500' },
    delivered: { icon: CheckCircleIcon, color: 'text-green-500' },
    opened: { icon: EyeIcon, color: 'text-purple-500' },
    clicked: { icon: MousePointerClickIcon, color: 'text-indigo-500' },
    bounced: { icon: XCircleIcon, color: 'text-red-500' },
    failed: { icon: XCircleIcon, color: 'text-red-500' },
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as EmailStatus | 'all')}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'sent', label: 'Sent' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'opened', label: 'Opened' },
            { value: 'clicked', label: 'Clicked' },
            { value: 'bounced', label: 'Bounced' },
          ]}
        />
        <Button variant="outline" onClick={loadEmails} className="gap-2">
          <RefreshCwIcon className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Email List */}
      <Card>
        <div className="divide-y divide-border">
          {emails.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <InboxIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No emails found</p>
            </div>
          ) : (
            emails.map((email) => {
              const StatusIcon = statusConfig[email.status].icon;
              return (
                <div
                  key={email.id}
                  className="p-4 hover:bg-background-secondary transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <StatusIcon
                        className={`w-5 h-5 mt-0.5 ${statusConfig[email.status].color}`}
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {email.toName || email.to}
                        </p>
                        <p className="text-sm text-muted-foreground">{email.subject}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>
                            {new Date(email.sentAt).toLocaleDateString()}
                          </span>
                          {email.templateName && (
                            <Badge variant="secondary" className="text-xs">
                              {email.templateName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <EyeIcon className="w-4 h-4" />
                        <span>{email.openCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MousePointerClickIcon className="w-4 h-4" />
                        <span>{email.clickCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

// =============================================================================
// Email Analytics
// =============================================================================

function EmailAnalytics() {
  const [stats, setStats] = React.useState<EmailStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await emailTemplatesService.getStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const metrics = [
    {
      label: 'Delivery Rate',
      value: `${stats.deliveryRate.toFixed(1)}%`,
      sublabel: `${stats.totalDelivered.toLocaleString()} delivered`,
      color: 'text-green-600',
      icon: CheckCircleIcon,
    },
    {
      label: 'Open Rate',
      value: `${stats.openRate.toFixed(1)}%`,
      sublabel: `${stats.totalOpened.toLocaleString()} opened`,
      color: 'text-purple-600',
      icon: EyeIcon,
    },
    {
      label: 'Click Rate',
      value: `${stats.clickRate.toFixed(1)}%`,
      sublabel: `${stats.totalClicked.toLocaleString()} clicked`,
      color: 'text-blue-600',
      icon: MousePointerClickIcon,
    },
    {
      label: 'Bounce Rate',
      value: `${stats.bounceRate.toFixed(1)}%`,
      sublabel: `${stats.totalBounced.toLocaleString()} bounced`,
      color: 'text-red-600',
      icon: XCircleIcon,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{metric.sublabel}</p>
                </div>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Total Sent Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Total Emails Sent</h3>
            <p className="text-3xl font-bold text-primary mt-2">
              {stats.totalSent.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUpIcon className="w-5 h-5" />
            <span className="text-sm font-medium">+12% this month</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CommunicationHub;
