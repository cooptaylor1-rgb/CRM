import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum MeetingType {
  INITIAL_CONSULTATION = 'initial_consultation',
  ANNUAL_REVIEW = 'annual_review',
  QUARTERLY_REVIEW = 'quarterly_review',
  FINANCIAL_PLAN_REVIEW = 'financial_plan_review',
  INVESTMENT_REVIEW = 'investment_review',
  TAX_PLANNING = 'tax_planning',
  ESTATE_PLANNING = 'estate_planning',
  INSURANCE_REVIEW = 'insurance_review',
  AD_HOC = 'ad_hoc',
  PHONE_CALL = 'phone_call',
  VIDEO_CALL = 'video_call',
  IN_PERSON = 'in_person',
}

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: MeetingType,
    name: 'meeting_type',
    default: MeetingType.AD_HOC,
  })
  meetingType: MeetingType;

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    default: MeetingStatus.SCHEDULED,
  })
  status: MeetingStatus;

  // Scheduling
  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({ nullable: true })
  timezone: string;

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ name: 'recurrence_rule', nullable: true })
  recurrenceRule: string;

  @Column({ name: 'parent_meeting_id', type: 'uuid', nullable: true })
  parentMeetingId: string;

  // Location
  @Column({ nullable: true })
  location: string;

  @Column({ name: 'is_virtual', default: false })
  isVirtual: boolean;

  @Column({ name: 'video_link', nullable: true })
  videoLink: string;

  @Column({ name: 'dial_in_number', nullable: true })
  dialInNumber: string;

  @Column({ name: 'dial_in_pin', nullable: true })
  dialInPin: string;

  // Participants
  @Column({ name: 'household_id', type: 'uuid', nullable: true })
  householdId: string;

  @Column({ name: 'person_ids', type: 'uuid', array: true, default: '{}' })
  personIds: string[];

  @Column({ name: 'advisor_id', type: 'uuid' })
  advisorId: string;

  @Column({ name: 'attendee_ids', type: 'uuid', array: true, default: '{}' })
  attendeeIds: string[];

  @Column({ name: 'external_attendees', type: 'jsonb', nullable: true })
  externalAttendees: { name: string; email: string; role?: string }[];

  // Calendar Integration
  @Column({ name: 'outlook_event_id', nullable: true })
  outlookEventId: string;

  @Column({ name: 'google_event_id', nullable: true })
  googleEventId: string;

  @Column({ name: 'ical_uid', nullable: true })
  icalUid: string;

  // Preparation
  @Column({ name: 'agenda', type: 'text', nullable: true })
  agenda: string;

  @Column({ name: 'prep_notes', type: 'text', nullable: true })
  prepNotes: string;

  @Column({ name: 'documents_to_discuss', type: 'uuid', array: true, default: '{}' })
  documentsToDiscuss: string[];

  @Column({ name: 'reminder_sent', default: false })
  reminderSent: boolean;

  @Column({ name: 'reminder_time', type: 'timestamp', nullable: true })
  reminderTime: Date;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;
}

@Entity('meeting_notes')
export class MeetingNotes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meeting_id', type: 'uuid' })
  meetingId: string;

  // Raw Notes
  @Column({ name: 'raw_notes', type: 'text', nullable: true })
  rawNotes: string;

  @Column({ name: 'transcript', type: 'text', nullable: true })
  transcript: string;

  // AI-Generated Content
  @Column({ name: 'ai_summary', type: 'text', nullable: true })
  aiSummary: string;

  @Column({ name: 'key_points', type: 'jsonb', nullable: true })
  keyPoints: string[];

  @Column({ name: 'decisions_made', type: 'jsonb', nullable: true })
  decisionsMade: { decision: string; context?: string }[];

  @Column({ name: 'action_items', type: 'jsonb', nullable: true })
  actionItems: {
    description: string;
    assignedTo?: string;
    dueDate?: string;
    priority?: string;
    taskId?: string;
  }[];

  @Column({ name: 'follow_up_topics', type: 'jsonb', nullable: true })
  followUpTopics: string[];

  @Column({ name: 'client_concerns', type: 'jsonb', nullable: true })
  clientConcerns: string[];

  @Column({ name: 'opportunities_identified', type: 'jsonb', nullable: true })
  opportunitiesIdentified: string[];

  // Compliance
  @Column({ name: 'compliance_items', type: 'jsonb', nullable: true })
  complianceItems: { item: string; action?: string }[];

  @Column({ name: 'requires_documentation', default: false })
  requiresDocumentation: boolean;

  @Column({ name: 'documentation_completed', default: false })
  documentationCompleted: boolean;

  // Sentiment & Quality
  @Column({ name: 'client_sentiment', nullable: true })
  clientSentiment: string;

  @Column({ name: 'meeting_quality_score', type: 'int', nullable: true })
  meetingQualityScore: number;

  // Financial Topics Discussed
  @Column({ name: 'topics_discussed', type: 'text', array: true, default: '{}' })
  topicsDiscussed: string[];

  @Column({ name: 'portfolio_changes_discussed', type: 'jsonb', nullable: true })
  portfolioChangesDiscussed: any[];

  @Column({ name: 'planning_updates', type: 'jsonb', nullable: true })
  planningUpdates: any[];

  @Column({ name: 'next_meeting_date', type: 'date', nullable: true })
  nextMeetingDate: Date;

  @Column({ name: 'ai_generated_at', type: 'timestamp', nullable: true })
  aiGeneratedAt: Date;

  @Column({ name: 'manually_edited', default: false })
  manuallyEdited: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;
}
