// Collaboration Components
export { default as TeamManagement } from '../collaboration/TeamManagement';
export { default as ActivityFeed } from '../collaboration/ActivityFeed';
export { NotificationCenter, NotificationBell } from '../collaboration/NotificationCenter';
export { default as Comments } from '../collaboration/Comments';

// Customization Components
export { default as CustomFieldManager } from '../customization/CustomFieldManager';
export { default as TagManager } from '../customization/TagManager';
export { SavedViewsPanel } from '../customization/SavedViewsPanel';
export { UserPreferencesPage } from '../customization/UserPreferencesPage';

// Integration Components
export { default as SchwabIntegration } from '../integrations/SchwabIntegration';

// Asset Allocation & Fee Management
export { default as AssetAllocationManager } from './AssetAllocationManager';
export { default as FeeScheduleManager } from './FeeScheduleManager';

// Magic Features - v1
export { SmartCommandPalette, useSmartCommandPalette } from './SmartCommandPalette';
export { ActivityTimeline, useActivityTimeline } from './ActivityTimeline';
export type { Activity } from './ActivityTimeline';

// Magic Features - v2: Next Best Actions
export { NextBestActions, useNextBestActions } from './NextBestActions';
export type { NextBestAction, NextBestActionsProps } from './NextBestActions';

// Magic Features - v2: Meeting Prep Brief
export { MeetingPrepBrief, useMeetingPrepData } from './MeetingPrepBrief';
export type { MeetingPrepData, MeetingPrepBriefProps } from './MeetingPrepBrief';

// Magic Features - v2: Audit Trail (Trust & Safety)
export { AuditTrail, AuditBadge } from './AuditTrail';
export type { AuditTrailProps, AuditBadgeProps } from './AuditTrail';

// ============================================
// Magic Features - v3: World-Class CRM
// ============================================

// Smart Client Insights - AI-powered relationship intelligence
export { 
  ClientInsights, 
  generateClientInsights,
} from './ClientInsights';
export type { 
  ClientInsightsProps, 
  ClientInsightsData,
  ClientInsight,
  RelationshipHealth,
  LifeEvent,
} from './ClientInsights';

// Conversational Search - Natural language query interface
export { 
  ConversationalSearch,
  QuickSearchBar,
} from './ConversationalSearch';
export type {
  ConversationalSearchProps,
  SearchResult,
  ParsedQuery,
  ParsedFilter,
} from './ConversationalSearch';

// Client Journey Timeline - Visual relationship story
export {
  ClientJourneyTimeline,
  generateJourneyData,
} from './ClientJourneyTimeline';
export type {
  ClientJourneyTimelineProps,
  ClientJourneyData,
  TimelineEvent,
  TimelineEventType,
  JourneyMilestone,
} from './ClientJourneyTimeline';

// Smart Notifications - Intelligent alert system
export {
  SmartNotifications,
  NotificationBell as SmartNotificationBell,
  generateMockNotifications,
} from './SmartNotifications';
export type {
  SmartNotificationsProps,
  SmartNotification,
  NotificationGroup,
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
} from './SmartNotifications';

// Keyboard First - Vim-style navigation for power users
export {
  KeyboardProvider,
  useKeyboard,
  KeyboardHints,
  KeyboardModeIndicator,
  Navigable,
  QuickJumpHints,
  usePageShortcuts,
  KeyHint,
} from './KeyboardFirst';
export type {
  KeyboardMode,
  KeyboardShortcut,
  NavigableItem,
} from './KeyboardFirst';