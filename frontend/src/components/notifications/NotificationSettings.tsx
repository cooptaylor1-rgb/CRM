'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  MoonIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, Input, Select } from '@/components/ui';
import notificationsService, { NotificationPreferences, NotificationType, NotificationChannel } from '@/services/notifications.service';

const channelConfig: Record<NotificationChannel, { label: string; icon: React.ElementType; description: string }> = {
  in_app: { label: 'In-App', icon: ComputerDesktopIcon, description: 'Notifications shown in the application' },
  email: { label: 'Email', icon: EnvelopeIcon, description: 'Notifications sent to your email' },
  push: { label: 'Push', icon: DevicePhoneMobileIcon, description: 'Browser/mobile push notifications' },
  sms: { label: 'SMS', icon: DevicePhoneMobileIcon, description: 'Text messages to your phone' },
};

const notificationTypeGroups: Record<string, { label: string; description: string; types: NotificationType[] }> = {
  tasks: {
    label: 'Tasks',
    description: 'Task assignments, due dates, and overdue alerts',
    types: ['task_due', 'task_overdue', 'task_assigned'],
  },
  meetings: {
    label: 'Meetings',
    description: 'Meeting reminders, scheduling, and cancellations',
    types: ['meeting_reminder', 'meeting_scheduled', 'meeting_cancelled'],
  },
  compliance: {
    label: 'Compliance & KYC',
    description: 'KYC verification alerts and compliance reviews',
    types: ['kyc_expiring', 'kyc_expired', 'kyc_verified', 'compliance_review', 'compliance_overdue'],
  },
  documents: {
    label: 'Documents',
    description: 'Document uploads, expiration, and signature requests',
    types: ['document_uploaded', 'document_expiring', 'signature_required', 'signature_received'],
  },
  billing: {
    label: 'Billing & Payments',
    description: 'Invoice generation and payment notifications',
    types: ['billing_generated', 'payment_received', 'payment_overdue'],
  },
  pipeline: {
    label: 'Pipeline & Accounts',
    description: 'Prospect and account status changes',
    types: ['account_opened', 'account_closed', 'prospect_converted', 'prospect_lost'],
  },
  system: {
    label: 'System',
    description: 'System alerts and announcements',
    types: ['system_alert', 'announcement'],
  },
};

const typeLabels: Record<NotificationType, string> = {
  task_due: 'Task Due',
  task_overdue: 'Task Overdue',
  task_assigned: 'Task Assigned',
  meeting_reminder: 'Meeting Reminder',
  meeting_scheduled: 'Meeting Scheduled',
  meeting_cancelled: 'Meeting Cancelled',
  kyc_expiring: 'KYC Expiring',
  kyc_expired: 'KYC Expired',
  kyc_verified: 'KYC Verified',
  document_uploaded: 'Document Uploaded',
  document_expiring: 'Document Expiring',
  signature_required: 'Signature Required',
  signature_received: 'Signature Received',
  compliance_review: 'Compliance Review',
  compliance_overdue: 'Compliance Overdue',
  billing_generated: 'Invoice Generated',
  payment_received: 'Payment Received',
  payment_overdue: 'Payment Overdue',
  account_opened: 'Account Opened',
  account_closed: 'Account Closed',
  prospect_converted: 'Prospect Converted',
  prospect_lost: 'Prospect Lost',
  system_alert: 'System Alert',
  announcement: 'Announcement',
};

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await notificationsService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    setSaving(true);
    try {
      const updated = await notificationsService.updatePreferences(updates);
      setPreferences(updated);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (channel: NotificationChannel) => {
    if (!preferences) return;
    savePreferences({
      channels: {
        ...preferences.channels,
        [channel]: !preferences.channels[channel],
      },
    });
  };

  const toggleTypeEnabled = (type: NotificationType) => {
    if (!preferences) return;
    const currentType = preferences.types[type];
    savePreferences({
      types: {
        ...preferences.types,
        [type]: {
          ...currentType,
          enabled: !currentType.enabled,
        },
      },
    });
  };

  const toggleTypeChannel = (type: NotificationType, channel: NotificationChannel) => {
    if (!preferences) return;
    const currentType = preferences.types[type];
    const channels = currentType.channels.includes(channel)
      ? currentType.channels.filter(c => c !== channel)
      : [...currentType.channels, channel];

    savePreferences({
      types: {
        ...preferences.types,
        [type]: {
          ...currentType,
          channels,
        },
      },
    });
  };

  const toggleQuietHours = () => {
    if (!preferences) return;
    savePreferences({
      quietHours: {
        ...preferences.quietHours,
        enabled: !preferences.quietHours.enabled,
      },
    });
  };

  const updateQuietHours = (field: 'start' | 'end', value: string) => {
    if (!preferences) return;
    savePreferences({
      quietHours: {
        ...preferences.quietHours,
        [field]: value,
      },
    });
  };

  const toggleDigest = () => {
    if (!preferences) return;
    savePreferences({
      digest: {
        ...preferences.digest,
        enabled: !preferences.digest.enabled,
      },
    });
  };

  const updateDigest = (field: 'frequency' | 'time', value: string) => {
    if (!preferences) return;
    savePreferences({
      digest: {
        ...preferences.digest,
        [field]: value,
      },
    });
  };

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-content-secondary">Loading preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card className="p-8 text-center">
        <p className="text-content-secondary">Failed to load notification preferences</p>
        <Button onClick={loadPreferences} className="mt-4">Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Global Channel Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-content-primary mb-1">Notification Channels</h3>
        <p className="text-sm text-content-secondary mb-6">
          Choose how you want to receive notifications
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(channelConfig) as [NotificationChannel, typeof channelConfig[NotificationChannel]][]).map(([channel, config]) => (
            <button
              key={channel}
              onClick={() => toggleChannel(channel)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                preferences.channels[channel]
                  ? 'border-accent-primary bg-accent-50/50'
                  : 'border-border hover:border-border-hover'
              }`}
            >
              <div className={`p-2 rounded-lg ${preferences.channels[channel] ? 'bg-accent-primary text-white' : 'bg-surface-secondary text-content-tertiary'}`}>
                <config.icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${preferences.channels[channel] ? 'text-content-primary' : 'text-content-secondary'}`}>
                  {config.label}
                </p>
                <p className="text-xs text-content-tertiary">{config.description}</p>
              </div>
              {preferences.channels[channel] && (
                <CheckIcon className="w-5 h-5 text-accent-primary ml-auto" />
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <MoonIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-content-primary">Quiet Hours</h3>
              <p className="text-sm text-content-secondary">
                Pause non-urgent notifications during specific hours
              </p>
            </div>
          </div>
          <button
            onClick={toggleQuietHours}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.quietHours.enabled ? 'bg-accent-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {preferences.quietHours.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Start Time</label>
              <Input
                type="time"
                value={preferences.quietHours.start}
                onChange={(e) => updateQuietHours('start', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">End Time</label>
              <Input
                type="time"
                value={preferences.quietHours.end}
                onChange={(e) => updateQuietHours('end', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Timezone</label>
              <Select
                value={preferences.quietHours.timezone}
                onChange={() => {}}
                options={[
                  { value: 'America/New_York', label: 'Eastern Time' },
                  { value: 'America/Chicago', label: 'Central Time' },
                  { value: 'America/Denver', label: 'Mountain Time' },
                  { value: 'America/Los_Angeles', label: 'Pacific Time' },
                ]}
              />
            </div>
          </motion.div>
        )}
      </Card>

      {/* Email Digest */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <EnvelopeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-content-primary">Email Digest</h3>
              <p className="text-sm text-content-secondary">
                Receive a summary of notifications via email
              </p>
            </div>
          </div>
          <button
            onClick={toggleDigest}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.digest.enabled ? 'bg-accent-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.digest.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {preferences.digest.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Frequency</label>
              <Select
                value={preferences.digest.frequency}
                onChange={(val) => updateDigest('frequency', val)}
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Delivery Time</label>
              <Input
                type="time"
                value={preferences.digest.time}
                onChange={(e) => updateDigest('time', e.target.value)}
              />
            </div>
          </motion.div>
        )}
      </Card>

      {/* Notification Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-content-primary mb-1">Notification Types</h3>
        <p className="text-sm text-content-secondary mb-6">
          Configure which notifications you want to receive and how
        </p>

        <div className="space-y-4">
          {Object.entries(notificationTypeGroups).map(([groupKey, group]) => (
            <div key={groupKey} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-secondary/50 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-semibold text-content-primary">{group.label}</h4>
                  <p className="text-xs text-content-secondary">{group.description}</p>
                </div>
                <motion.div
                  animate={{ rotate: expandedGroups.has(groupKey) ? 180 : 0 }}
                  className="text-content-tertiary"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: expandedGroups.has(groupKey) ? 'auto' : 0,
                  opacity: expandedGroups.has(groupKey) ? 1 : 0,
                }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {group.types.map((type) => {
                    const typePref = preferences.types[type];
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleTypeEnabled(type)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              typePref.enabled ? 'bg-accent-primary' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                typePref.enabled ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-sm ${typePref.enabled ? 'text-content-primary' : 'text-content-tertiary'}`}>
                            {typeLabels[type]}
                          </span>
                        </div>

                        {typePref.enabled && (
                          <div className="flex items-center gap-2">
                            {(['in_app', 'email', 'push'] as NotificationChannel[]).map((channel) => (
                              <button
                                key={channel}
                                onClick={() => toggleTypeChannel(type, channel)}
                                disabled={!preferences.channels[channel]}
                                className={`px-2 py-1 text-xs rounded transition-colors ${
                                  typePref.channels.includes(channel)
                                    ? 'bg-accent-primary text-white'
                                    : preferences.channels[channel]
                                    ? 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary'
                                    : 'bg-surface-secondary text-content-tertiary cursor-not-allowed'
                                }`}
                              >
                                {channelConfig[channel].label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </Card>

      {/* Save indicator */}
      {saving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 right-4 bg-surface-primary shadow-lg rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <div className="animate-spin w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full" />
          <span className="text-sm text-content-secondary">Saving...</span>
        </motion.div>
      )}
    </div>
  );
}
