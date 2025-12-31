'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Calendar,
  RefreshCw,
  Settings,
  Link2,
  Link2Off,
  Check,
  X,
  Search,
  Filter,
  Tag,
  Home,
  User,
  Building2,
  ChevronRight,
  ChevronDown,
  Clock,
  AlertCircle,
  Inbox,
  Send,
  Archive,
  Paperclip,
  ExternalLink,
  Users,
  Video,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Zap,
  BarChart3,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import * as outlookService from '@/services/outlook.service';
import type {
  OutlookConnection,
  OutlookEmail,
  OutlookEvent,
  OutlookMatchingRule,
  SyncStatus,
} from '@/services/outlook.service';

// ==================== Utility Functions ====================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatEventTime(start: string, end: string, isAllDay: boolean): string {
  if (isAllDay) return 'All day';
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${startTime} - ${endTime}`;
}

// ==================== Connection Card ====================

interface ConnectionCardProps {
  connection: OutlookConnection | null;
  syncStatus: SyncStatus | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  onSettingsOpen: () => void;
  isLoading: boolean;
}

function ConnectionCard({
  connection,
  syncStatus,
  onConnect,
  onDisconnect,
  onSync,
  onSettingsOpen,
  isLoading,
}: ConnectionCardProps) {
  const isConnected = connection && connection.status === 'connected';

  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/10 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            isConnected 
              ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' 
              : 'bg-slate-100 dark:bg-white/5'
          }`}>
            <Mail className={`w-7 h-7 ${isConnected ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Microsoft Outlook
            </h3>
            {isConnected ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {connection.email}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Connect to sync emails and calendar
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <>
              <button
                onClick={onSettingsOpen}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={onSync}
                disabled={syncStatus?.syncInProgress || isLoading}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${
                  syncStatus?.syncInProgress ? 'animate-spin' : ''
                }`} />
              </button>
            </>
          )}
          
          <button
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
              isConnected
                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isConnected ? (
              <>
                <Link2Off className="w-4 h-4" />
                Disconnect
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Connect
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sync Status */}
      {isConnected && syncStatus && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
              <Mail className="w-4 h-4" />
              Emails
            </div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white">
              {syncStatus.emailCount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              {syncStatus.untaggedEmailCount} untagged
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Events
            </div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white">
              {syncStatus.eventCount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              {syncStatus.untaggedEventCount} untagged
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Last Email Sync
            </div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {syncStatus.lastEmailSync 
                ? formatDate(syncStatus.lastEmailSync) 
                : 'Never'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Last Calendar Sync
            </div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {syncStatus.lastCalendarSync 
                ? formatDate(syncStatus.lastCalendarSync) 
                : 'Never'}
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {syncStatus?.errors && syncStatus.errors.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Sync Errors
          </div>
          <ul className="mt-2 space-y-1">
            {syncStatus.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-600/80 dark:text-red-400/80">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ==================== Email List ====================

interface EmailListProps {
  emails: OutlookEmail[];
  selectedEmailId: string | null;
  onEmailSelect: (email: OutlookEmail) => void;
  onTagEmail: (emailId: string, tags: { householdId?: string; accountId?: string; personId?: string }) => void;
  isLoading: boolean;
}

function EmailList({ emails, selectedEmailId, onEmailSelect, onTagEmail, isLoading }: EmailListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">No emails found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-white/5">
      {emails.map((email) => (
        <motion.div
          key={email.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => onEmailSelect(email)}
          className={`p-4 cursor-pointer transition-colors ${
            selectedEmailId === email.id
              ? 'bg-blue-50 dark:bg-blue-500/10'
              : 'hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
              email.isRead ? 'bg-transparent' : 'bg-blue-600'
            }`} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm truncate ${
                  email.isRead 
                    ? 'text-slate-600 dark:text-slate-400' 
                    : 'font-semibold text-slate-900 dark:text-white'
                }`}>
                  {email.fromName || email.fromAddress}
                </span>
                <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                  {formatDate(email.receivedAt)}
                </span>
              </div>
              
              <div className={`text-sm truncate ${
                email.isRead 
                  ? 'text-slate-500 dark:text-slate-500' 
                  : 'text-slate-900 dark:text-white'
              }`}>
                {email.subject}
              </div>
              
              <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-1">
                {email.bodyPreview}
              </div>

              <div className="flex items-center gap-2 mt-2">
                {email.hasAttachments && (
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                )}
                {email.importance === 'high' && (
                  <span className="text-xs text-red-500 font-medium">Important</span>
                )}
                {email.householdId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                    <Home className="w-3 h-3" />
                    Tagged
                  </span>
                )}
                {email.personId && !email.householdId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-xs text-blue-700 dark:text-blue-400">
                    <User className="w-3 h-3" />
                    Tagged
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ==================== Event List ====================

interface EventListProps {
  events: OutlookEvent[];
  selectedEventId: string | null;
  onEventSelect: (event: OutlookEvent) => void;
  isLoading: boolean;
}

function EventList({ events, selectedEventId, onEventSelect, isLoading }: EventListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">No events found</p>
      </div>
    );
  }

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.startTime).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {} as Record<string, OutlookEvent[]>);

  return (
    <div className="divide-y divide-slate-100 dark:divide-white/5">
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date} className="py-2">
          <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
            {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          {dateEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => onEventSelect(event)}
              className={`p-4 cursor-pointer transition-colors ${
                selectedEventId === event.id
                  ? 'bg-blue-50 dark:bg-blue-500/10'
                  : 'hover:bg-slate-50 dark:hover:bg-white/5'
              } ${event.isCancelled ? 'opacity-50 line-through' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-1 h-full rounded-full self-stretch ${
                  event.showAs === 'busy' ? 'bg-blue-500' :
                  event.showAs === 'tentative' ? 'bg-amber-500' :
                  event.showAs === 'oof' ? 'bg-purple-500' :
                  'bg-slate-300'
                }`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {event.subject}
                    </span>
                    {event.isOnlineMeeting && (
                      <Video className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {formatEventTime(event.startTime, event.endTime, event.isAllDay)}
                  </div>

                  {event.location && (
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    {event.attendees.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Users className="w-3.5 h-3.5" />
                        {event.attendees.length}
                      </span>
                    )}
                    {event.householdId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                        <Home className="w-3 h-3" />
                        Tagged
                      </span>
                    )}
                    {event.personId && !event.householdId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-xs text-blue-700 dark:text-blue-400">
                        <User className="w-3 h-3" />
                        Tagged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ==================== Matching Rules ====================

interface MatchingRulesProps {
  rules: OutlookMatchingRule[];
  onCreateRule: () => void;
  onEditRule: (rule: OutlookMatchingRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleRule: (ruleId: string, isActive: boolean) => void;
}

function MatchingRules({ rules, onCreateRule, onEditRule, onDeleteRule, onToggleRule }: MatchingRulesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Auto-Tagging Rules
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create rules to automatically tag emails and events
          </p>
        </div>
        <button
          onClick={onCreateRule}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-white/5 rounded-xl">
          <Zap className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No rules configured</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Create rules to auto-tag communications
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-colors ${
                rule.isActive
                  ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'
                  : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    rule.ruleType === 'email_domain' ? 'bg-blue-100 dark:bg-blue-500/20' :
                    rule.ruleType === 'email_address' ? 'bg-emerald-100 dark:bg-emerald-500/20' :
                    rule.ruleType === 'subject_pattern' ? 'bg-amber-100 dark:bg-amber-500/20' :
                    'bg-purple-100 dark:bg-purple-500/20'
                  }`}>
                    {rule.ruleType === 'email_domain' && <Mail className="w-5 h-5 text-blue-600" />}
                    {rule.ruleType === 'email_address' && <User className="w-5 h-5 text-emerald-600" />}
                    {rule.ruleType === 'subject_pattern' && <Tag className="w-5 h-5 text-amber-600" />}
                    {rule.ruleType === 'ai' && <Zap className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {rule.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {rule.ruleType === 'email_domain' && `@${rule.pattern}`}
                      {rule.ruleType === 'email_address' && rule.pattern}
                      {rule.ruleType === 'subject_pattern' && `Subject matches "${rule.pattern}"`}
                      {rule.ruleType === 'ai' && 'AI-powered matching'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rule.matchCount !== undefined && (
                    <span className="text-sm text-slate-500">
                      {rule.matchCount} matches
                    </span>
                  )}
                  <button
                    onClick={() => onToggleRule(rule.id, !rule.isActive)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      rule.isActive ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      rule.isActive ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                  <button
                    onClick={() => onEditRule(rule)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <Edit className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => onDeleteRule(rule.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== Settings Modal ====================

interface SettingsModalProps {
  connection: OutlookConnection;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Partial<OutlookConnection>) => void;
}

function SettingsModal({ connection, isOpen, onClose, onSave }: SettingsModalProps) {
  const [settings, setSettings] = useState({
    syncEmails: connection.syncEmails,
    syncCalendar: connection.syncCalendar,
    syncContacts: connection.syncContacts,
    autoTagEntities: connection.autoTagEntities,
    createActivities: connection.createActivities,
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Outlook Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Sync Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sync Options
              </h3>
              
              {[
                { key: 'syncEmails', label: 'Sync Emails', icon: Mail },
                { key: 'syncCalendar', label: 'Sync Calendar', icon: Calendar },
                { key: 'syncContacts', label: 'Sync Contacts', icon: Users },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-slate-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings[key as keyof typeof settings]}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                    className="w-5 h-5 rounded text-blue-600"
                  />
                </label>
              ))}
            </div>

            {/* Automation Options */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Automation
              </h3>
              
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">Auto-tag Entities</span>
                    <p className="text-xs text-slate-500">Automatically tag emails and events</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoTagEntities}
                  onChange={(e) => setSettings({ ...settings, autoTagEntities: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 cursor-pointer">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">Create Activities</span>
                    <p className="text-xs text-slate-500">Log emails and meetings as activities</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.createActivities}
                  onChange={(e) => setSettings({ ...settings, createActivities: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(settings);
                onClose();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ==================== Main Component ====================

type TabType = 'emails' | 'calendar' | 'rules' | 'analytics';

export function OutlookIntegration() {
  const [activeTab, setActiveTab] = useState<TabType>('emails');
  const [connection, setConnection] = useState<OutlookConnection | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [emails, setEmails] = useState<OutlookEmail[]>([]);
  const [events, setEvents] = useState<OutlookEvent[]>([]);
  const [rules, setRules] = useState<OutlookMatchingRule[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUntagged, setFilterUntagged] = useState(false);

  // Load connection status
  const loadConnection = useCallback(async () => {
    try {
      const result = await outlookService.getOutlookConnection();
      if (result.connected && result.connection) {
        setConnection(result.connection);
      } else {
        setConnection(null);
      }
    } catch (error) {
      console.error('Failed to load connection:', error);
    }
  }, []);

  // Load sync status
  const loadSyncStatus = useCallback(async () => {
    try {
      const status = await outlookService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }, []);

  // Load emails
  const loadEmails = useCallback(async () => {
    if (!connection) return;
    setIsLoading(true);
    try {
      const result = await outlookService.getEmails({
        search: searchQuery || undefined,
        untaggedOnly: filterUntagged || undefined,
        limit: 50,
      });
      setEmails(result.emails);
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setIsLoading(false);
    }
  }, [connection, searchQuery, filterUntagged]);

  // Load events
  const loadEvents = useCallback(async () => {
    if (!connection) return;
    setIsLoading(true);
    try {
      const result = await outlookService.getEvents({
        search: searchQuery || undefined,
        untaggedOnly: filterUntagged || undefined,
        limit: 50,
      });
      setEvents(result.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [connection, searchQuery, filterUntagged]);

  // Load rules
  const loadRules = useCallback(async () => {
    try {
      const result = await outlookService.getMatchingRules();
      setRules(result.rules);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  // Load data when connection changes
  useEffect(() => {
    if (connection) {
      loadSyncStatus();
      loadRules();
    }
  }, [connection, loadSyncStatus, loadRules]);

  // Load tab-specific data
  useEffect(() => {
    if (!connection) return;
    
    if (activeTab === 'emails') {
      loadEmails();
    } else if (activeTab === 'calendar') {
      loadEvents();
    }
  }, [connection, activeTab, loadEmails, loadEvents]);

  // Handle OAuth connect
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const result = await outlookService.initiateOutlookConnection(
        `${window.location.origin}/api/integrations/outlook/callback`
      );
      window.location.href = result.authorizationUrl;
    } catch (error) {
      console.error('Failed to initiate connection:', error);
      setIsLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Outlook?')) return;
    setIsLoading(true);
    try {
      await outlookService.disconnectOutlook();
      setConnection(null);
      setSyncStatus(null);
      setEmails([]);
      setEvents([]);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sync
  const handleSync = async () => {
    try {
      await outlookService.triggerSync({ emails: true, calendar: true });
      loadSyncStatus();
      // Reload data after a delay
      setTimeout(() => {
        loadEmails();
        loadEvents();
        loadSyncStatus();
      }, 2000);
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  };

  // Handle settings save
  const handleSettingsSave = async (settings: Partial<OutlookConnection>) => {
    try {
      const result = await outlookService.updateOutlookConnection(settings);
      setConnection(result.connection);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  // Handle email tag
  const handleTagEmail = async (emailId: string, tags: { householdId?: string; accountId?: string; personId?: string }) => {
    try {
      await outlookService.tagEmail(emailId, tags);
      loadEmails();
    } catch (error) {
      console.error('Failed to tag email:', error);
    }
  };

  // Handle rule toggle
  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await outlookService.updateMatchingRule(ruleId, { isActive });
      loadRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  // Handle rule delete
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await outlookService.deleteMatchingRule(ruleId);
      loadRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const tabs = [
    { id: 'emails' as const, label: 'Emails', icon: Mail },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'rules' as const, label: 'Auto-Tag Rules', icon: Zap },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Connection Card */}
      <ConnectionCard
        connection={connection}
        syncStatus={syncStatus}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onSync={handleSync}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        isLoading={isLoading}
      />

      {/* Content */}
      {connection && connection.status === 'connected' && (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/10">
            {(activeTab === 'emails' || activeTab === 'calendar') && (
              <div className="p-4 border-b border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border-0 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => setFilterUntagged(!filterUntagged)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      filterUntagged
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Untagged Only
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'emails' && (
              <EmailList
                emails={emails}
                selectedEmailId={selectedEmailId}
                onEmailSelect={(email) => setSelectedEmailId(email.id)}
                onTagEmail={handleTagEmail}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'calendar' && (
              <EventList
                events={events}
                selectedEventId={selectedEventId}
                onEventSelect={(event) => setSelectedEventId(event.id)}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'rules' && (
              <div className="p-6">
                <MatchingRules
                  rules={rules}
                  onCreateRule={() => {}}
                  onEditRule={() => {}}
                  onDeleteRule={handleDeleteRule}
                  onToggleRule={handleToggleRule}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Email Tagging</h3>
                        <p className="text-sm text-slate-500">Organization rate</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Tagged</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {syncStatus ? syncStatus.emailCount - syncStatus.untaggedEmailCount : 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Untagged</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {syncStatus?.untaggedEmailCount || 0}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mt-3">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ 
                            width: `${syncStatus && syncStatus.emailCount > 0 
                              ? ((syncStatus.emailCount - syncStatus.untaggedEmailCount) / syncStatus.emailCount) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Event Tagging</h3>
                        <p className="text-sm text-slate-500">Organization rate</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Tagged</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {syncStatus ? syncStatus.eventCount - syncStatus.untaggedEventCount : 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Untagged</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {syncStatus?.untaggedEventCount || 0}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mt-3">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ 
                            width: `${syncStatus && syncStatus.eventCount > 0 
                              ? ((syncStatus.eventCount - syncStatus.untaggedEventCount) / syncStatus.eventCount) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Settings Modal */}
      {connection && (
        <SettingsModal
          connection={connection}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSettingsSave}
        />
      )}
    </div>
  );
}

export default OutlookIntegration;
