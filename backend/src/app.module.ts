import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { HouseholdsModule } from './modules/households/households.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { PersonsModule } from './modules/persons/persons.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { AuditModule } from './modules/audit/audit.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { HealthController } from './health.controller';
import { EncryptionModule } from './common/services/encryption.module';

// New feature modules
import { TasksModule } from './modules/tasks/tasks.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { SecurityModule } from './modules/security/security.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

// Advanced feature modules - Custodian, Collaboration, Customization
import { CustodianModule } from './modules/integrations/custodian/custodian.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { CustomizationModule } from './modules/customization/customization.module';

// Import all entities explicitly for production builds
import { User } from './modules/auth/entities/user.entity';
import { Role } from './modules/auth/entities/role.entity';
import { Household } from './modules/households/entities/household.entity';
import { Account } from './modules/accounts/entities/account.entity';
import { Position } from './modules/accounts/entities/position.entity';
import { Person } from './modules/persons/entities/person.entity';
import { LegalEntity, EntityRelationship, EntityDistribution, EntityDocument } from './modules/entities/entities/entity.entity';
import { AuditEvent } from './modules/audit/entities/audit-event.entity';
import { ComplianceReview } from './modules/compliance/entities/compliance-review.entity';
import { Document } from './modules/documents/entities/document.entity';

// New module entities
import { Task } from './modules/tasks/entities/task.entity';
import { Prospect, ProspectActivity } from './modules/pipeline/entities/prospect.entity';
import { ClientPreference } from './modules/preferences/entities/client-preference.entity';
import { ClientRelationship } from './modules/preferences/entities/client-relationship.entity';
import { SecurityIncident } from './modules/security/entities/security-incident.entity';
import { KycVerification, SuspiciousActivityReport } from './modules/security/entities/kyc.entity';
import { Meeting, MeetingNotes } from './modules/meetings/entities/meeting.entity';
import { WorkflowTemplate, WorkflowInstance } from './modules/workflows/entities/workflow.entity';
import { UserIntegration, SyncedCalendarEvent, SyncedEmail, EmailThread, IntegrationSyncLog } from './modules/integrations/entities/integration.entity';
import { ClientProfitability, AdvisorMetrics, FirmMetrics, ActivitySnapshot } from './modules/analytics/entities/analytics.entity';

// Custodian integration entities
import { CustodianConnection, CustodianAccountLink, CustodianSyncLog } from './modules/integrations/custodian/custodian.entity';

// Collaboration entities
import { HouseholdTeam, ActivityFeed, Comment, Notification, NotificationPreference } from './modules/collaboration/entities/collaboration.entity';

// Customization entities
import { CustomFieldDefinition, CustomFieldValue, Tag, EntityTag, SavedView, UserPreference } from './modules/customization/entities/customization.entity';

// Outlook integration entities
import { OutlookConnection, OutlookEmail, OutlookEvent, OutlookMatchingRule, OutlookContact } from './modules/integrations/outlook/outlook.entity';
import { OutlookModule } from './modules/integrations/outlook/outlook.module';

// Allocations (Asset Allocation & Fee Schedules) entities
import { TargetAssetAllocation, AllocationLineItem, FeeSchedule, FeeTier, FeeHistory } from './modules/allocations/entities/allocation.entity';
import { AllocationsModule } from './modules/allocations/allocations.module';

// Intelligence (AI-Powered Client Intelligence) module & entities
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { ClientInsight } from './modules/intelligence/entities/client-insight.entity';
import { LifeEvent } from './modules/intelligence/entities/life-event.entity';
import { MeetingBrief } from './modules/intelligence/entities/meeting-brief.entity';
import { RiskScore } from './modules/intelligence/entities/risk-score.entity';

const entities = [
  // Core entities
  User,
  Role,
  Household,
  Account,
  Position,
  Person,
  LegalEntity,
  EntityRelationship,
  EntityDistribution,
  EntityDocument,
  AuditEvent,
  ComplianceReview,
  Document,
  // Task management
  Task,
  // Pipeline
  Prospect,
  ProspectActivity,
  // Client preferences
  ClientPreference,
  ClientRelationship,
  // Security & compliance
  SecurityIncident,
  KycVerification,
  SuspiciousActivityReport,
  // Meetings
  Meeting,
  MeetingNotes,
  // Workflows
  WorkflowTemplate,
  WorkflowInstance,
  // Integrations
  UserIntegration,
  SyncedCalendarEvent,
  SyncedEmail,
  EmailThread,
  IntegrationSyncLog,
  // Analytics
  ClientProfitability,
  AdvisorMetrics,
  FirmMetrics,
  ActivitySnapshot,
  // Custodian integration
  CustodianConnection,
  CustodianAccountLink,
  CustodianSyncLog,
  // Collaboration
  HouseholdTeam,
  ActivityFeed,
  Comment,
  Notification,
  NotificationPreference,
  // Customization
  CustomFieldDefinition,
  CustomFieldValue,
  Tag,
  EntityTag,
  SavedView,
  UserPreference,
  // Outlook integration
  OutlookConnection,
  OutlookEmail,
  OutlookEvent,
  OutlookMatchingRule,
  OutlookContact,
  // Allocations (Asset Allocation & Fee Schedules)
  TargetAssetAllocation,
  AllocationLineItem,
  FeeSchedule,
  FeeTier,
  FeeHistory,
  // Intelligence (AI-Powered Client Intelligence)
  ClientInsight,
  LifeEvent,
  MeetingBrief,
  RiskScore,
];

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database connection
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseConfig');

        // Railway provides DATABASE_URL automatically when Postgres is linked
        // It may also be available as POSTGRES_URL or similar
        const databaseUrl = configService.get('DATABASE_URL') ||
                           configService.get('POSTGRES_URL') ||
                           configService.get('POSTGRESQL_URL');

        logger.log('Configuring database connection...');

        // If DATABASE_URL is provided (Railway), use it directly
        if (databaseUrl) {
          logger.log('Using DATABASE_URL for connection');
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: entities,
            synchronize: true, // Auto-create tables
            logging: false,
            ssl: { rejectUnauthorized: false },
          };
        }

        logger.log('Using individual DB_* environment variables');
        // Otherwise use individual environment variables
        return {
          type: 'postgres',
          host: configService.get('DB_HOST') || 'localhost',
          port: configService.get('DB_PORT') || 5432,
          username: configService.get('DB_USER') || 'postgres',
          password: configService.get('DB_PASSWORD') || 'postgres',
          database: configService.get('DB_NAME') || 'crm_db',
          entities: entities,
          synchronize: true, // Auto-sync in development
          logging: configService.get('NODE_ENV') === 'development',
          ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        };
      },
    }),

    // Feature modules
    EncryptionModule,
    AuthModule,
    HouseholdsModule,
    AccountsModule,
    PersonsModule,
    EntitiesModule,
    AuditModule,
    ComplianceModule,
    DocumentsModule,
    // New feature modules
    TasksModule,
    PipelineModule,
    PreferencesModule,
    SecurityModule,
    MeetingsModule,
    WorkflowsModule,
    IntegrationsModule,
    AnalyticsModule,
    // Advanced feature modules
    CustodianModule,
    CollaborationModule,
    CustomizationModule,
    OutlookModule,
    AllocationsModule,
    IntelligenceModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
