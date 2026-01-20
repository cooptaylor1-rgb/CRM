import api from './api';

export type EmailTemplateCategory = 
  | 'onboarding'
  | 'compliance'
  | 'client_service'
  | 'billing'
  | 'marketing'
  | 'meeting'
  | 'document'
  | 'system';

export type EmailStatus = 'draft' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: EmailTemplateCategory;
  variables: string[];
  isSystem: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  lastUsedAt?: string;
}

export interface EmailTrackingEvent {
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  timestamp: string;
  metadata?: {
    linkUrl?: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface SentEmail {
  id: string;
  templateId?: string;
  templateName?: string;
  to: string;
  toName?: string;
  subject: string;
  body: string;
  status: EmailStatus;
  sentAt: string;
  sentBy: string;
  householdId?: string;
  householdName?: string;
  trackingEvents: EmailTrackingEvent[];
  openCount: number;
  clickCount: number;
}

export interface EmailStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

// Mock templates
const mockTemplates: EmailTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Welcome Email',
    subject: 'Welcome to {{firm_name}}, {{first_name}}!',
    body: `Dear {{first_name}},

Welcome to {{firm_name}}! We are delighted to have you as a client.

Your dedicated advisor, {{advisor_name}}, will be reaching out shortly to schedule an introductory call and begin the onboarding process.

In the meantime, please feel free to review the attached documents and don't hesitate to reach out if you have any questions.

Best regards,
{{advisor_name}}
{{firm_name}}`,
    category: 'onboarding',
    variables: ['first_name', 'firm_name', 'advisor_name'],
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    usageCount: 156,
    lastUsedAt: '2024-01-14T10:30:00Z',
  },
  {
    id: 'tpl-002',
    name: 'KYC Renewal Request',
    subject: 'Action Required: Please Update Your KYC Information',
    body: `Dear {{first_name}},

As part of our ongoing commitment to regulatory compliance and your account security, we need to update your Know Your Customer (KYC) information.

Your current KYC documentation will expire on {{expiry_date}}.

Please click the link below to securely update your information:
{{update_link}}

If you have any questions, please don't hesitate to contact us.

Best regards,
{{advisor_name}}
{{firm_name}}`,
    category: 'compliance',
    variables: ['first_name', 'expiry_date', 'update_link', 'advisor_name', 'firm_name'],
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    usageCount: 89,
    lastUsedAt: '2024-01-13T14:20:00Z',
  },
  {
    id: 'tpl-003',
    name: 'Quarterly Review Invitation',
    subject: "Let's Schedule Your Q{{quarter}} Portfolio Review",
    body: `Dear {{first_name}},

It's time for your quarterly portfolio review! I'd like to schedule a meeting to discuss your investment performance, review your financial goals, and make any necessary adjustments to your strategy.

Key Topics:
- Portfolio performance summary
- Market outlook
- Any changes to your financial situation
- Goal progress review

Please use the link below to select a time that works best for you:
{{scheduling_link}}

I look forward to speaking with you soon.

Best regards,
{{advisor_name}}`,
    category: 'meeting',
    variables: ['first_name', 'quarter', 'scheduling_link', 'advisor_name'],
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    usageCount: 234,
    lastUsedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'tpl-004',
    name: 'Meeting Reminder',
    subject: 'Reminder: Your Meeting Tomorrow at {{meeting_time}}',
    body: `Dear {{first_name}},

This is a friendly reminder about your upcoming meeting:

Date: {{meeting_date}}
Time: {{meeting_time}}
Duration: {{meeting_duration}}
Location: {{meeting_location}}

{{#if meeting_agenda}}
Agenda:
{{meeting_agenda}}
{{/if}}

Please let us know if you need to reschedule.

Best regards,
{{advisor_name}}`,
    category: 'meeting',
    variables: ['first_name', 'meeting_date', 'meeting_time', 'meeting_duration', 'meeting_location', 'meeting_agenda', 'advisor_name'],
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    usageCount: 445,
    lastUsedAt: '2024-01-15T16:00:00Z',
  },
  {
    id: 'tpl-005',
    name: 'Document Signature Request',
    subject: 'Please Sign: {{document_name}}',
    body: `Dear {{first_name}},

We have prepared the following document for your review and signature:

Document: {{document_name}}
Description: {{document_description}}

Please click the link below to review and sign the document:
{{signature_link}}

This link will expire on {{expiry_date}}.

If you have any questions about this document, please contact us.

Best regards,
{{advisor_name}}
{{firm_name}}`,
    category: 'document',
    variables: ['first_name', 'document_name', 'document_description', 'signature_link', 'expiry_date', 'advisor_name', 'firm_name'],
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    usageCount: 178,
    lastUsedAt: '2024-01-14T11:45:00Z',
  },
  {
    id: 'tpl-006',
    name: 'Birthday Greeting',
    subject: 'Happy Birthday, {{first_name}}!',
    body: `Dear {{first_name}},

Wishing you a wonderful birthday filled with joy and celebration!

On behalf of everyone at {{firm_name}}, we hope this special day brings you happiness and that the year ahead is filled with prosperity and good health.

Warmest wishes,
{{advisor_name}}
{{firm_name}}`,
    category: 'client_service',
    variables: ['first_name', 'advisor_name', 'firm_name'],
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    usageCount: 67,
    lastUsedAt: '2024-01-12T08:00:00Z',
  },
  {
    id: 'tpl-007',
    name: 'Invoice Notification',
    subject: 'Your Invoice for {{billing_period}}',
    body: `Dear {{first_name}},

Please find attached your invoice for {{billing_period}}.

Invoice Summary:
- Invoice Number: {{invoice_number}}
- Amount Due: {{amount_due}}
- Due Date: {{due_date}}

Payment Methods:
- ACH Transfer (preferred)
- Wire Transfer
- Check

If you have any questions regarding this invoice, please don't hesitate to contact our billing department.

Best regards,
{{firm_name}}`,
    category: 'billing',
    variables: ['first_name', 'billing_period', 'invoice_number', 'amount_due', 'due_date', 'firm_name'],
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    usageCount: 312,
    lastUsedAt: '2024-01-15T07:00:00Z',
  },
  {
    id: 'tpl-008',
    name: 'Market Update',
    subject: '{{firm_name}} Market Commentary - {{month}} {{year}}',
    body: `Dear {{first_name}},

Here is our monthly market commentary for {{month}} {{year}}.

{{market_summary}}

Key Takeaways:
{{key_points}}

As always, we remain focused on your long-term financial goals. If you would like to discuss how recent market developments may affect your portfolio, please don't hesitate to reach out.

Best regards,
{{advisor_name}}
{{firm_name}}`,
    category: 'marketing',
    variables: ['first_name', 'firm_name', 'month', 'year', 'market_summary', 'key_points', 'advisor_name'],
    isSystem: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    usageCount: 156,
    lastUsedAt: '2024-01-10T09:00:00Z',
  },
];

const mockSentEmails: SentEmail[] = [
  {
    id: 'email-001',
    templateId: 'tpl-003',
    templateName: 'Quarterly Review Invitation',
    to: 'sarah.chen@email.com',
    toName: 'Sarah Chen',
    subject: "Let's Schedule Your Q1 Portfolio Review",
    body: '...',
    status: 'opened',
    sentAt: '2024-01-15T10:30:00Z',
    sentBy: 'Michael Johnson',
    householdId: 'hh-001',
    householdName: 'Chen Family',
    trackingEvents: [
      { type: 'sent', timestamp: '2024-01-15T10:30:00Z' },
      { type: 'delivered', timestamp: '2024-01-15T10:30:05Z' },
      { type: 'opened', timestamp: '2024-01-15T11:45:00Z', metadata: { userAgent: 'Mozilla/5.0...' } },
      { type: 'clicked', timestamp: '2024-01-15T11:46:00Z', metadata: { linkUrl: 'https://schedule.example.com/...' } },
    ],
    openCount: 3,
    clickCount: 1,
  },
  {
    id: 'email-002',
    templateId: 'tpl-002',
    templateName: 'KYC Renewal Request',
    to: 'michael.roberts@email.com',
    toName: 'Michael Roberts',
    subject: 'Action Required: Please Update Your KYC Information',
    body: '...',
    status: 'delivered',
    sentAt: '2024-01-15T09:00:00Z',
    sentBy: 'Emily Davis',
    householdId: 'hh-002',
    householdName: 'Roberts Family',
    trackingEvents: [
      { type: 'sent', timestamp: '2024-01-15T09:00:00Z' },
      { type: 'delivered', timestamp: '2024-01-15T09:00:03Z' },
    ],
    openCount: 0,
    clickCount: 0,
  },
  {
    id: 'email-003',
    templateId: 'tpl-004',
    templateName: 'Meeting Reminder',
    to: 'jennifer.wilson@email.com',
    toName: 'Jennifer Wilson',
    subject: 'Reminder: Your Meeting Tomorrow at 2:00 PM',
    body: '...',
    status: 'clicked',
    sentAt: '2024-01-14T16:00:00Z',
    sentBy: 'Michael Johnson',
    householdId: 'hh-003',
    householdName: 'Wilson Family',
    trackingEvents: [
      { type: 'sent', timestamp: '2024-01-14T16:00:00Z' },
      { type: 'delivered', timestamp: '2024-01-14T16:00:02Z' },
      { type: 'opened', timestamp: '2024-01-14T16:15:00Z' },
      { type: 'clicked', timestamp: '2024-01-14T16:16:00Z', metadata: { linkUrl: 'https://meet.example.com/...' } },
    ],
    openCount: 2,
    clickCount: 1,
  },
  {
    id: 'email-004',
    templateId: 'tpl-001',
    templateName: 'Welcome Email',
    to: 'david.kim@email.com',
    toName: 'David Kim',
    subject: 'Welcome to Pinnacle Wealth, David!',
    body: '...',
    status: 'bounced',
    sentAt: '2024-01-14T11:00:00Z',
    sentBy: 'Sarah Miller',
    householdId: 'hh-004',
    householdName: 'Kim Family',
    trackingEvents: [
      { type: 'sent', timestamp: '2024-01-14T11:00:00Z' },
      { type: 'bounced', timestamp: '2024-01-14T11:00:10Z' },
    ],
    openCount: 0,
    clickCount: 0,
  },
];

class EmailTemplatesService {
  async getTemplates(category?: EmailTemplateCategory): Promise<EmailTemplate[]> {
    await new Promise(r => setTimeout(r, 300));
    if (category) {
      return mockTemplates.filter(t => t.category === category);
    }
    return mockTemplates;
  }

  async getTemplate(id: string): Promise<EmailTemplate | null> {
    await new Promise(r => setTimeout(r, 200));
    return mockTemplates.find(t => t.id === id) || null;
  }

  async createTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    await new Promise(r => setTimeout(r, 300));
    const template: EmailTemplate = {
      id: `tpl-${Date.now()}`,
      name: data.name || 'New Template',
      subject: data.subject || '',
      body: data.body || '',
      category: data.category || 'client_service',
      variables: data.variables || [],
      isSystem: false,
      createdBy: 'current_user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };
    return template;
  }

  async updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    await new Promise(r => setTimeout(r, 300));
    const existing = mockTemplates.find(t => t.id === id);
    if (!existing) throw new Error('Template not found');
    
    return {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteTemplate(id: string): Promise<void> {
    await new Promise(r => setTimeout(r, 200));
  }

  async duplicateTemplate(id: string): Promise<EmailTemplate> {
    const existing = await this.getTemplate(id);
    if (!existing) throw new Error('Template not found');
    
    return this.createTemplate({
      ...existing,
      name: `${existing.name} (Copy)`,
    });
  }

  async getSentEmails(filter?: { 
    templateId?: string; 
    status?: EmailStatus;
    householdId?: string;
  }): Promise<SentEmail[]> {
    await new Promise(r => setTimeout(r, 300));
    
    let emails = [...mockSentEmails];
    
    if (filter?.templateId) {
      emails = emails.filter(e => e.templateId === filter.templateId);
    }
    if (filter?.status) {
      emails = emails.filter(e => e.status === filter.status);
    }
    if (filter?.householdId) {
      emails = emails.filter(e => e.householdId === filter.householdId);
    }
    
    return emails;
  }

  async sendEmail(data: {
    templateId?: string;
    to: string[];
    subject: string;
    body: string;
    variables?: Record<string, string>;
  }): Promise<SentEmail[]> {
    await new Promise(r => setTimeout(r, 500));
    
    return data.to.map(email => ({
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      templateId: data.templateId,
      to: email,
      subject: data.subject,
      body: data.body,
      status: 'sent' as EmailStatus,
      sentAt: new Date().toISOString(),
      sentBy: 'Current User',
      trackingEvents: [{ type: 'sent' as const, timestamp: new Date().toISOString() }],
      openCount: 0,
      clickCount: 0,
    }));
  }

  async getStats(dateRange?: { start: string; end: string }): Promise<EmailStats> {
    await new Promise(r => setTimeout(r, 200));
    
    return {
      totalSent: 1847,
      totalDelivered: 1789,
      totalOpened: 1245,
      totalClicked: 567,
      totalBounced: 58,
      deliveryRate: 96.9,
      openRate: 69.6,
      clickRate: 45.5,
      bounceRate: 3.1,
    };
  }

  getCategories(): { value: EmailTemplateCategory; label: string }[] {
    return [
      { value: 'onboarding', label: 'Onboarding' },
      { value: 'compliance', label: 'Compliance' },
      { value: 'client_service', label: 'Client Service' },
      { value: 'billing', label: 'Billing' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'meeting', label: 'Meetings' },
      { value: 'document', label: 'Documents' },
      { value: 'system', label: 'System' },
    ];
  }

  extractVariables(text: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }

  renderTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }
}

export const emailTemplatesService = new EmailTemplatesService();
