'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Calendar,
  ChevronRight,
  Clock,
  Paperclip,
  Video,
  MapPin,
  Users,
  ExternalLink,
  RefreshCw,
  Tag,
  X,
  Home,
  User,
  Building2,
  Loader2,
  Inbox,
} from 'lucide-react';
import * as outlookService from '@/services/outlook.service';
import type { OutlookEmail, OutlookEvent } from '@/services/outlook.service';

// ==================== Types ====================

interface EntityCommunicationsProps {
  entityType: 'household' | 'account' | 'person';
  entityId: string;
  entityName: string;
  maxItems?: number;
  showHeader?: boolean;
  onViewAll?: () => void;
}

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

// ==================== Email Item ====================

interface EmailItemProps {
  email: OutlookEmail;
  onClick?: () => void;
}

function EmailItem({ email, onClick }: EmailItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
          email.isRead ? 'bg-slate-300 dark:bg-slate-600' : 'bg-blue-500'
        }`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm truncate ${
              email.isRead 
                ? 'text-slate-600 dark:text-slate-400' 
                : 'font-medium text-slate-900 dark:text-white'
            }`}>
              {email.fromName || email.fromAddress}
            </span>
            <span className="text-xs text-slate-500 flex-shrink-0">
              {formatDate(email.receivedAt)}
            </span>
          </div>
          
          <div className={`text-sm truncate ${
            email.isRead 
              ? 'text-slate-500' 
              : 'text-slate-800 dark:text-slate-200'
          }`}>
            {email.subject}
          </div>
          
          <div className="flex items-center gap-2 mt-1.5">
            {email.hasAttachments && (
              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
            )}
            {email.importance === 'high' && (
              <span className="text-xs text-red-500 font-medium">Important</span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

// ==================== Event Item ====================

interface EventItemProps {
  event: OutlookEvent;
  onClick?: () => void;
}

function EventItem({ event, onClick }: EventItemProps) {
  const isPast = new Date(event.endTime) < new Date();
  const isToday = new Date(event.startTime).toDateString() === new Date().toDateString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`p-3 rounded-xl cursor-pointer transition-colors ${
        isPast 
          ? 'bg-slate-50/50 dark:bg-white/[0.02] opacity-60'
          : isToday
            ? 'bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-200 dark:ring-blue-500/20'
            : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
      } ${event.isCancelled ? 'line-through opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-1 h-full rounded-full self-stretch min-h-[3rem] ${
          event.showAs === 'busy' ? 'bg-blue-500' :
          event.showAs === 'tentative' ? 'bg-amber-500' :
          event.showAs === 'oof' ? 'bg-purple-500' :
          'bg-slate-300'
        }`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {event.subject}
            </span>
            {event.isOnlineMeeting && (
              <Video className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {new Date(event.startTime).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric' 
              })}
              {' · '}
              {formatEventTime(event.startTime, event.endTime, event.isAllDay)}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.attendees.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">
                {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

// ==================== Empty State ====================

interface EmptyStateProps {
  type: 'emails' | 'events';
  entityName: string;
}

function EmptyState({ type, entityName }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {type === 'emails' ? (
        <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
      ) : (
        <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No {type} found for {entityName}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        {type === 'emails' 
          ? 'Emails will appear here when synced'
          : 'Calendar events will appear here when synced'
        }
      </p>
    </div>
  );
}

// ==================== Main Component ====================

export function EntityCommunications({
  entityType,
  entityId,
  entityName,
  maxItems = 5,
  showHeader = true,
  onViewAll,
}: EntityCommunicationsProps) {
  const [activeTab, setActiveTab] = useState<'emails' | 'events'>('emails');
  const [emails, setEmails] = useState<OutlookEmail[]>([]);
  const [events, setEvents] = useState<OutlookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [totalEmails, setTotalEmails] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  // Load connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await outlookService.getOutlookConnection();
        setIsConnected(result.connected);
      } catch (error) {
        setIsConnected(false);
      }
    };
    checkConnection();
  }, []);

  // Load emails for entity
  const loadEmails = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      let result;
      switch (entityType) {
        case 'household':
          result = await outlookService.getHouseholdEmails(entityId, { limit: maxItems });
          break;
        case 'account':
          result = await outlookService.getAccountEmails(entityId, { limit: maxItems });
          break;
        case 'person':
          result = await outlookService.getPersonEmails(entityId, { limit: maxItems });
          break;
      }
      if (result) {
        setEmails(result.emails);
        setTotalEmails(result.total);
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, maxItems, isConnected]);

  // Load events for entity
  const loadEvents = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      let result;
      const filters = { limit: maxItems };
      switch (entityType) {
        case 'household':
          result = await outlookService.getHouseholdEvents(entityId, filters);
          break;
        case 'person':
          result = await outlookService.getPersonEvents(entityId, filters);
          break;
        // Note: Account events would need a separate endpoint
        default:
          result = await outlookService.getEvents({ accountId: entityId, limit: maxItems });
      }
      if (result) {
        setEvents(result.events);
        setTotalEvents(result.total);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, maxItems, isConnected]);

  // Load data when tab changes or entity changes
  useEffect(() => {
    if (activeTab === 'emails') {
      loadEmails();
    } else {
      loadEvents();
    }
  }, [activeTab, loadEmails, loadEvents]);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/10 p-6">
        {showHeader && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Communications
              </h3>
              <p className="text-sm text-slate-500">Outlook integration</p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Mail className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Connect Outlook to see communications
          </p>
          <a
            href="/settings/integrations"
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Set up integration →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/10">
      {/* Header */}
      {showHeader && (
        <div className="p-4 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                {activeTab === 'emails' ? (
                  <Mail className="w-5 h-5 text-blue-600" />
                ) : (
                  <Calendar className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Communications
                </h3>
                <p className="text-sm text-slate-500">
                  {activeTab === 'emails' 
                    ? `${totalEmails} email${totalEmails !== 1 ? 's' : ''}`
                    : `${totalEvents} event${totalEvents !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
            
            <button
              onClick={() => activeTab === 'emails' ? loadEmails() : loadEvents()}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 p-1 bg-slate-100 dark:bg-white/5 rounded-lg">
            <button
              onClick={() => setActiveTab('emails')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'emails'
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Mail className="w-4 h-4" />
              Emails
              {totalEmails > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-xs text-blue-600">
                  {totalEmails}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'events'
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Events
              {totalEvents > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-xs text-emerald-600">
                  {totalEvents}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : activeTab === 'emails' ? (
          emails.length > 0 ? (
            <div className="space-y-2">
              {emails.map((email) => (
                <EmailItem key={email.id} email={email} />
              ))}
            </div>
          ) : (
            <EmptyState type="emails" entityName={entityName} />
          )
        ) : (
          events.length > 0 ? (
            <div className="space-y-2">
              {events.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState type="events" entityName={entityName} />
          )
        )}
      </div>

      {/* View All Footer */}
      {((activeTab === 'emails' && totalEmails > maxItems) || 
        (activeTab === 'events' && totalEvents > maxItems)) && (
        <div className="px-4 pb-4">
          <button
            onClick={onViewAll}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            View all {activeTab === 'emails' ? totalEmails : totalEvents} {activeTab}
          </button>
        </div>
      )}
    </div>
  );
}

export default EntityCommunications;
