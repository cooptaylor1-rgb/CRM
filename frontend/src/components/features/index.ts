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

// ============================================
// Magic Features - v4: Enterprise-Grade CRM
// ============================================

// Workflow Automation Engine - Visual workflow builder
export {
  WorkflowAutomation,
  WORKFLOW_TEMPLATES,
  TRIGGER_CONFIG,
  ACTION_CONFIG,
} from './WorkflowAutomation';
export type {
  WorkflowAutomationProps,
  Workflow,
  WorkflowTrigger,
  WorkflowAction,
  WorkflowCondition,
  WorkflowTemplate,
  TriggerType,
  ActionType,
  ConditionOperator,
} from './WorkflowAutomation';

// Smart Email Composer - AI-assisted email drafting
export {
  SmartEmailComposer,
  EMAIL_TEMPLATES,
  MERGE_FIELDS,
} from './SmartEmailComposer';
export type {
  SmartEmailComposerProps,
  EmailTemplate,
  MergeField,
  EmailRecipient,
  DraftEmail,
  ToneType,
  AIEmailContext,
} from './SmartEmailComposer';

// Client Segmentation - Dynamic smart lists
export {
  ClientSegmentation,
  FIELD_CONFIG,
  OPERATOR_LABELS,
  PRESET_SEGMENTS,
} from './ClientSegmentation';
export type {
  ClientSegmentationProps,
  Segment,
  FilterCondition,
  FilterGroup,
  FilterField,
  FilterOperator,
  SegmentClient,
} from './ClientSegmentation';

// Meeting Notes AI - Smart meeting capture
export {
  MeetingNotesAI,
  EXAMPLE_MEETING_NOTES,
} from './MeetingNotesAI';
export type {
  MeetingNotesAIProps,
  MeetingNote,
  AISummary,
  ActionItem,
  Attendee,
  NoteCategory,
} from './MeetingNotesAI';

// Performance Analytics Dashboard - Business intelligence
export {
  PerformanceAnalytics,
} from './PerformanceAnalytics';
export type {
  PerformanceAnalyticsProps,
  TimeRange,
  MetricData,
  ChartDataPoint,
  AUMFlowData,
  ActivityMetrics,
  RevenueData,
  ClientHealthData,
  AdvisorPerformance,
} from './PerformanceAnalytics';

// ============================================
// Magic Features - v5: Enterprise Integration
// ============================================

// Custodian Integration Hub - Multi-custodian data sync
export {
  CustodianIntegrationHub,
} from './CustodianIntegrationHub';
export type {
  CustodianIntegrationHubProps,
  CustodianType,
  ConnectionStatus,
  SyncFrequency,
  DataType,
  CustodianConnection,
  CustodianAccount,
  Position,
  SyncEvent,
  TradeConfirmation,
  FeeReconciliation,
} from './CustodianIntegrationHub';

// Compliance Center - Regulatory compliance management
export {
  ComplianceCenter,
} from './ComplianceCenter';
export type {
  ComplianceCenterProps,
  ComplianceItemType,
  ComplianceStatus,
  ComplianceItem,
  ComplianceDeadline,
} from './ComplianceCenter';

// Fee Billing Engine - Automated fee management
export {
  FeeBillingEngine,
} from './FeeBillingEngine';
export type {
  FeeBillingEngineProps,
  BillingFrequency,
  FeeType,
  InvoiceStatus,
  FeeSchedule,
  Invoice,
  BillingMetrics,
} from './FeeBillingEngine';

// AI Advisor Assistant - Intelligent copilot
export {
  AIAdvisorAssistant,
} from './AIAdvisorAssistant';
export type {
  AIAdvisorAssistantProps,
  MessageRole,
  SuggestionType,
  ChatMessage,
  QuickSuggestion,
  ActionCard,
  ClientResult,
} from './AIAdvisorAssistant';

// Document Collaboration - Secure document management
export {
  DocumentCollaboration,
} from './DocumentCollaboration';
export type {
  DocumentCollaborationProps,
  DocumentType,
  DocumentStatus,
  Document,
  DocumentVersion,
  DocumentShare,
  SharePermission,
  Folder,
} from './DocumentCollaboration';

// Tax Planning Tools - Tax-loss harvesting and optimization
export {
  TaxPlanningTools,
} from './TaxPlanningTools';
export type {
  TaxPlanningToolsProps,
  TaxLotMethod,
  TaxLot,
  HarvestingOpportunity,
  TaxProjection,
} from './TaxPlanningTools';

// Risk Assessment Module - Portfolio risk analysis
export {
  RiskAssessmentModule,
} from './RiskAssessmentModule';
export type {
  RiskAssessmentModuleProps,
  RiskLevel,
  RiskProfile,
  PortfolioRisk,
  StressTest,
  RebalanceAlert,
} from './RiskAssessmentModule';

// ============================================
// Magic Features - v6: Enterprise Excellence
// ============================================

// Client Portal Dashboard - Client-facing portfolio view
export { ClientPortal } from './ClientPortal';

// Predictive Analytics Engine - AI churn prediction and opportunity scoring
export { PredictiveAnalytics } from './PredictiveAnalytics';

// Real-time Streaming Dashboard - Live market data and portfolio updates
export { RealtimeStreamingDashboard } from './RealtimeStreamingDashboard';

// Advanced Report Builder - Drag-drop report designer with scheduling
export { AdvancedReportBuilder } from './AdvancedReportBuilder';

// Goal Planning & Monte Carlo - Probabilistic financial projections
export { GoalPlanningMonteCarlo } from './GoalPlanningMonteCarlo';

// Estate Planning Module - Family tree, beneficiaries, trusts
export { EstatePlanningModule } from './EstatePlanningModule';

// Integration Marketplace - Third-party app connections and data sync
export { IntegrationMarketplace } from './IntegrationMarketplace';

// Client Segmentation Engine - Automated tiering and service models
export { ClientSegmentationEngine } from './ClientSegmentationEngine';