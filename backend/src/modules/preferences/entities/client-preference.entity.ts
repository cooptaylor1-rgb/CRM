import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

export enum ContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  TEXT = 'text',
  VIDEO_CALL = 'video_call',
  IN_PERSON = 'in_person',
  MAIL = 'mail',
}

export enum ContactFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi_annually',
  ANNUALLY = 'annually',
  AS_NEEDED = 'as_needed',
}

export enum MeetingPreference {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  FLEXIBLE = 'flexible',
}

@Entity('client_preferences')
export class ClientPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id', type: 'uuid', unique: true })
  householdId: string;

  // Communication Preferences
  @Column({
    type: 'enum',
    enum: ContactMethod,
    name: 'preferred_contact_method',
    default: ContactMethod.EMAIL,
  })
  preferredContactMethod: ContactMethod;

  @Column({
    type: 'enum',
    enum: ContactFrequency,
    name: 'preferred_contact_frequency',
    default: ContactFrequency.QUARTERLY,
  })
  preferredContactFrequency: ContactFrequency;

  @Column({ name: 'best_time_to_call', nullable: true })
  bestTimeToCall: string;

  @Column({ name: 'do_not_contact_days', type: 'text', array: true, default: '{}' })
  doNotContactDays: string[];

  @Column({ name: 'email_opt_in', default: true })
  emailOptIn: boolean;

  @Column({ name: 'newsletter_opt_in', default: true })
  newsletterOptIn: boolean;

  @Column({ name: 'marketing_opt_in', default: false })
  marketingOptIn: boolean;

  // Meeting Preferences
  @Column({
    type: 'enum',
    enum: MeetingPreference,
    name: 'meeting_time_preference',
    default: MeetingPreference.FLEXIBLE,
  })
  meetingTimePreference: MeetingPreference;

  @Column({ name: 'preferred_meeting_location', nullable: true })
  preferredMeetingLocation: string;

  @Column({ name: 'virtual_meeting_preference', default: false })
  virtualMeetingPreference: boolean;

  @Column({ name: 'meeting_duration_preference', type: 'int', default: 60 })
  meetingDurationPreference: number;

  // Personal Interests (for relationship building)
  @Column({ type: 'text', array: true, default: '{}' })
  hobbies: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  interests: string[];

  @Column({ name: 'favorite_sports_teams', type: 'text', array: true, default: '{}' })
  favoriteSportsTeams: string[];

  @Column({ name: 'charitable_interests', type: 'text', array: true, default: '{}' })
  charitableInterests: string[];

  @Column({ name: 'alma_mater', nullable: true })
  almaMater: string;

  @Column({ name: 'military_service', nullable: true })
  militaryService: string;

  // Important Dates
  @Column({ name: 'wedding_anniversary', type: 'date', nullable: true })
  weddingAnniversary: Date;

  @Column({ name: 'retirement_date', type: 'date', nullable: true })
  retirementDate: Date;

  @Column({ name: 'important_dates', type: 'jsonb', nullable: true })
  importantDates: { date: string; description: string; recurring: boolean }[];

  // Gift Preferences
  @Column({ name: 'gift_preferences', type: 'text', nullable: true })
  giftPreferences: string;

  @Column({ name: 'dietary_restrictions', type: 'text', array: true, default: '{}' })
  dietaryRestrictions: string[];

  @Column({ name: 'allergies', type: 'text', nullable: true })
  allergies: string;

  @Column({ name: 'wine_preferences', nullable: true })
  winePreferences: string;

  @Column({ name: 'restaurant_preferences', nullable: true })
  restaurantPreferences: string;

  // Family Info
  @Column({ name: 'children_info', type: 'jsonb', nullable: true })
  childrenInfo: { name: string; birthdate: string; school?: string; interests?: string[] }[];

  @Column({ name: 'pet_info', type: 'jsonb', nullable: true })
  petInfo: { name: string; type: string; breed?: string }[];

  // Travel
  @Column({ name: 'favorite_destinations', type: 'text', array: true, default: '{}' })
  favoriteDestinations: string[];

  @Column({ name: 'upcoming_travel', type: 'jsonb', nullable: true })
  upcomingTravel: { destination: string; dates: string; notes?: string }[];

  // Service Preferences
  @Column({ name: 'statement_delivery', default: 'electronic' })
  statementDelivery: string;

  @Column({ name: 'tax_document_delivery', default: 'electronic' })
  taxDocumentDelivery: string;

  @Column({ name: 'report_frequency', default: 'quarterly' })
  reportFrequency: string;

  // Special Instructions
  @Column({ name: 'special_instructions', type: 'text', nullable: true })
  specialInstructions: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;
}
