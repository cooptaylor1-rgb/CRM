'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Bell, Moon, Sun, Layout, Palette, Globe,
  Mail, MessageCircle, Calendar, Clock, Save, Check,
  ChevronRight, Monitor, Shield
} from 'lucide-react';
import customizationService, { UserPreference } from '@/services/customization.service';

const themeOptions = [
  { value: 'light', icon: Sun, label: 'Light', description: 'Clean and bright' },
  { value: 'dark', icon: Moon, label: 'Dark', description: 'Easy on the eyes' },
  { value: 'system', icon: Monitor, label: 'System', description: 'Match device settings' },
];

const languageOptions = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
];

const dateFormatOptions = [
  { value: 'MM/DD/YYYY', label: '12/31/2024', example: 'US format' },
  { value: 'DD/MM/YYYY', label: '31/12/2024', example: 'European format' },
  { value: 'YYYY-MM-DD', label: '2024-12-31', example: 'ISO format' },
];

const timeFormatOptions = [
  { value: '12h', label: '12-hour', example: '2:30 PM' },
  { value: '24h', label: '24-hour', example: '14:30' },
];

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, icon, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
    <div className="flex items-start gap-4 p-6 border-b border-gray-200 dark:border-gray-800">
      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
        value ? 'translate-x-6' : ''
      }`} />
    </button>
  </div>
);

interface LocalPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    mentions: boolean;
    reminders: boolean;
    updates: boolean;
  };
  dashboard: {
    defaultView: string;
    widgetLayout: any[];
    compactMode: boolean;
  };
}

export const UserPreferencesPage: React.FC = () => {
  const [preferences, setPreferences] = useState<LocalPreferences>({
    theme: 'system',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: {
      email: true,
      push: true,
      desktop: true,
      mentions: true,
      reminders: true,
      updates: false,
    },
    dashboard: {
      defaultView: 'overview',
      widgetLayout: [],
      compactMode: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await customizationService.getUserPreferences();
      if (data) {
        // Map server preferences to local state, preserving defaults for fields not in API
        setPreferences(prev => ({
          ...prev,
          theme: data.theme || prev.theme,
          language: data.language || prev.language,
          timezone: data.timezone || prev.timezone,
          dateFormat: data.dateFormat || prev.dateFormat,
        }));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await customizationService.updateUserPreferences({
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        dateFormat: preferences.dateFormat,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const updateNotification = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateDashboard = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      dashboard: { ...prev.dashboard, [key]: value },
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preferences</h1>
          <p className="text-gray-500 mt-1">Customize your experience</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
            saved 
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <SettingsSection
          title="Appearance"
          description="Customize how the app looks"
          icon={<Palette className="w-5 h-5" />}
        >
          <div className="space-y-6">
            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference('theme', option.value)}
                    className={`p-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${
                      preferences.theme === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <option.icon className={`w-6 h-6 ${
                      preferences.theme === option.value ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      preferences.theme === option.value ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-gray-400">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Compact mode */}
            <ToggleRow
              label="Compact mode"
              description="Reduce spacing and padding for more content"
              value={preferences.dashboard.compactMode}
              onChange={(v) => updateDashboard('compactMode', v)}
            />
          </div>
        </SettingsSection>

        {/* Language & Region */}
        <SettingsSection
          title="Language & Region"
          description="Set your locale preferences"
          icon={<Globe className="w-5 h-5" />}
        >
          <div className="space-y-6">
            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={preferences.language}
                onChange={(e) => updatePreference('language', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.flag} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {dateFormatOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference('dateFormat', option.value)}
                    className={`p-3 text-center rounded-xl border-2 transition-all ${
                      preferences.dateFormat === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      preferences.dateFormat === option.value ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {option.label}
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5">{option.example}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {timeFormatOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference('timeFormat', option.value)}
                    className={`p-3 text-center rounded-xl border-2 transition-all ${
                      preferences.timeFormat === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      preferences.timeFormat === option.value ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {option.label}
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5">{option.example}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          title="Notifications"
          description="Control how you receive notifications"
          icon={<Bell className="w-5 h-5" />}
        >
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <ToggleRow
              label="Email notifications"
              description="Receive email for important updates"
              value={preferences.notifications.email}
              onChange={(v) => updateNotification('email', v)}
            />
            <ToggleRow
              label="Push notifications"
              description="Receive push notifications on mobile"
              value={preferences.notifications.push}
              onChange={(v) => updateNotification('push', v)}
            />
            <ToggleRow
              label="Desktop notifications"
              description="Show browser notifications"
              value={preferences.notifications.desktop}
              onChange={(v) => updateNotification('desktop', v)}
            />
            <ToggleRow
              label="Mention alerts"
              description="Get notified when someone mentions you"
              value={preferences.notifications.mentions}
              onChange={(v) => updateNotification('mentions', v)}
            />
            <ToggleRow
              label="Reminder notifications"
              description="Receive task and meeting reminders"
              value={preferences.notifications.reminders}
              onChange={(v) => updateNotification('reminders', v)}
            />
            <ToggleRow
              label="Product updates"
              description="Get notified about new features"
              value={preferences.notifications.updates}
              onChange={(v) => updateNotification('updates', v)}
            />
          </div>
        </SettingsSection>

        {/* Dashboard */}
        <SettingsSection
          title="Dashboard"
          description="Customize your dashboard experience"
          icon={<Layout className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default view
              </label>
              <select
                value={preferences.dashboard.defaultView}
                onChange={(e) => updateDashboard('defaultView', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="overview">Overview</option>
                <option value="tasks">Tasks</option>
                <option value="calendar">Calendar</option>
                <option value="pipeline">Pipeline</option>
              </select>
            </div>
          </div>
        </SettingsSection>

        {/* Privacy & Security note */}
        <div className="flex items-start gap-4 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Privacy & Security</h3>
            <p className="text-sm text-gray-500 mt-1">
              For security settings like password change and two-factor authentication, 
              visit the <a href="/settings/security" className="text-blue-600 hover:underline">Security Settings</a> page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferencesPage;
