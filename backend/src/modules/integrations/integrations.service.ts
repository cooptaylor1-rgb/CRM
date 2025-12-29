import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  UserIntegration,
  SyncedCalendarEvent,
  SyncedEmail,
  EmailThread,
  IntegrationSyncLog,
  IntegrationProvider,
  IntegrationStatus,
  SyncDirection,
} from './entities/integration.entity';
import {
  IntegrationSettingsDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  CalendarFilterDto,
  SendEmailDto,
  EmailFilterDto,
  LinkEmailDto,
  ManualSyncDto,
} from './dto/integration.dto';

// Microsoft Graph API interfaces
interface MicrosoftGraphConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
}

@Injectable()
export class IntegrationsService {
  private microsoftConfig: MicrosoftGraphConfig;

  constructor(
    @InjectRepository(UserIntegration)
    private integrationRepository: Repository<UserIntegration>,
    @InjectRepository(SyncedCalendarEvent)
    private calendarRepository: Repository<SyncedCalendarEvent>,
    @InjectRepository(SyncedEmail)
    private emailRepository: Repository<SyncedEmail>,
    @InjectRepository(EmailThread)
    private threadRepository: Repository<EmailThread>,
    @InjectRepository(IntegrationSyncLog)
    private syncLogRepository: Repository<IntegrationSyncLog>,
    private configService: ConfigService,
  ) {
    this.microsoftConfig = {
      clientId: this.configService.get('MICROSOFT_CLIENT_ID') || '',
      clientSecret: this.configService.get('MICROSOFT_CLIENT_SECRET') || '',
      tenantId: this.configService.get('MICROSOFT_TENANT_ID') || 'common',
      redirectUri: this.configService.get('MICROSOFT_REDIRECT_URI') || 'http://localhost:3000/api/integrations/oauth/callback',
    };
  }

  // ==================== OAuth ====================

  getOAuthUrl(provider: IntegrationProvider, userId: string): string {
    if (provider === IntegrationProvider.MICROSOFT) {
      const scopes = [
        'openid',
        'profile',
        'email',
        'offline_access',
        'Calendars.ReadWrite',
        'Mail.ReadWrite',
        'Mail.Send',
        'Contacts.Read',
      ];

      const state = Buffer.from(JSON.stringify({ userId, provider })).toString('base64');

      return `https://login.microsoftonline.com/${this.microsoftConfig.tenantId}/oauth2/v2.0/authorize?` +
        `client_id=${this.microsoftConfig.clientId}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(this.microsoftConfig.redirectUri)}` +
        `&scope=${encodeURIComponent(scopes.join(' '))}` +
        `&state=${state}` +
        `&response_mode=query`;
    }

    throw new BadRequestException(`Provider ${provider} not supported`);
  }

  async handleOAuthCallback(
    code: string,
    state: string,
  ): Promise<UserIntegration> {
    const { userId, provider } = JSON.parse(Buffer.from(state, 'base64').toString());

    if (provider === IntegrationProvider.MICROSOFT) {
      // In production, exchange code for tokens via Microsoft Graph API
      // For now, simulate the token exchange
      const mockTokens = {
        access_token: 'mock_access_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now(),
        expires_in: 3600,
        scope: 'Calendars.ReadWrite Mail.ReadWrite Mail.Send',
      };

      let integration = await this.integrationRepository.findOne({
        where: { userId, provider },
      });

      if (integration) {
        integration.accessToken = mockTokens.access_token;
        integration.refreshToken = mockTokens.refresh_token;
        integration.tokenExpiresAt = new Date(Date.now() + mockTokens.expires_in * 1000);
        integration.status = IntegrationStatus.ACTIVE;
        integration.scopes = mockTokens.scope.split(' ');
      } else {
        integration = this.integrationRepository.create({
          userId,
          provider,
          accessToken: mockTokens.access_token,
          refreshToken: mockTokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + mockTokens.expires_in * 1000),
          status: IntegrationStatus.ACTIVE,
          scopes: mockTokens.scope.split(' '),
          settings: {
            syncCalendar: true,
            syncEmail: true,
            syncContacts: false,
            syncDirection: SyncDirection.BIDIRECTIONAL,
            autoArchiveEmails: false,
            archiveClientEmailsOnly: true,
          },
        });
      }

      return this.integrationRepository.save(integration);
    }

    throw new BadRequestException(`Provider ${provider} not supported`);
  }

  async getIntegration(userId: string, provider: IntegrationProvider): Promise<UserIntegration> {
    const integration = await this.integrationRepository.findOne({
      where: { userId, provider },
    });
    if (!integration) {
      throw new NotFoundException(`Integration not found for provider ${provider}`);
    }
    return integration;
  }

  async getUserIntegrations(userId: string): Promise<UserIntegration[]> {
    return this.integrationRepository.find({ where: { userId } });
  }

  async updateSettings(userId: string, provider: IntegrationProvider, settings: Partial<IntegrationSettingsDto>): Promise<UserIntegration> {
    const integration = await this.getIntegration(userId, provider);
    integration.settings = { ...integration.settings, ...settings };
    return this.integrationRepository.save(integration);
  }

  async disconnectIntegration(userId: string, provider: IntegrationProvider): Promise<void> {
    const integration = await this.getIntegration(userId, provider);
    integration.status = IntegrationStatus.REVOKED;
    integration.accessToken = undefined;
    integration.refreshToken = undefined;
    await this.integrationRepository.save(integration);
  }

  // ==================== Calendar ====================

  async getCalendarEvents(userId: string, filter: CalendarFilterDto): Promise<SyncedCalendarEvent[]> {
    const where: any = { userId };

    if (filter.startDate && filter.endDate) {
      where.startTime = Between(new Date(filter.startDate), new Date(filter.endDate));
    }
    if (filter.linkedHouseholdId) where.linkedHouseholdId = filter.linkedHouseholdId;
    if (filter.linkedPersonId) where.linkedPersonId = filter.linkedPersonId;

    return this.calendarRepository.find({
      where,
      order: { startTime: 'ASC' },
    });
  }

  async createCalendarEvent(
    userId: string,
    provider: IntegrationProvider,
    dto: CreateCalendarEventDto,
  ): Promise<SyncedCalendarEvent> {
    const integration = await this.getIntegration(userId, provider);
    
    if (integration.status !== IntegrationStatus.ACTIVE) {
      throw new BadRequestException('Integration is not active');
    }

    // In production, create event via Microsoft Graph API
    // For now, simulate the creation
    const externalId = 'ms_event_' + Date.now();

    const event = this.calendarRepository.create({
      userId,
      provider,
      externalId,
      subject: dto.subject,
      body: dto.body,
      location: dto.location,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      isAllDay: dto.isAllDay || false,
      attendees: dto.attendees || [],
      syncDirection: SyncDirection.OUTBOUND,
      lastSyncedAt: new Date(),
      linkedHouseholdId: dto.linkedHouseholdId,
      linkedPersonId: dto.linkedPersonId,
      onlineMeetingUrl: dto.createOnlineMeeting 
        ? `https://teams.microsoft.com/l/meetup-join/${externalId}`
        : undefined,
      rawData: { source: 'crm' },
    });

    return this.calendarRepository.save(event);
  }

  async updateCalendarEvent(
    userId: string,
    eventId: string,
    dto: UpdateCalendarEventDto,
  ): Promise<SyncedCalendarEvent> {
    const event = await this.calendarRepository.findOne({
      where: { id: eventId, userId },
    });

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    // In production, update via Microsoft Graph API
    Object.assign(event, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : event.startTime,
      endTime: dto.endTime ? new Date(dto.endTime) : event.endTime,
      lastSyncedAt: new Date(),
    });

    return this.calendarRepository.save(event);
  }

  async deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
    const event = await this.calendarRepository.findOne({
      where: { id: eventId, userId },
    });

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    // In production, delete via Microsoft Graph API
    await this.calendarRepository.softRemove(event);
  }

  async linkCalendarEventToEntity(
    userId: string,
    eventId: string,
    householdId?: string,
    personId?: string,
  ): Promise<SyncedCalendarEvent> {
    const event = await this.calendarRepository.findOne({
      where: { id: eventId, userId },
    });

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    if (householdId) event.linkedHouseholdId = householdId;
    if (personId) event.linkedPersonId = personId;

    return this.calendarRepository.save(event);
  }

  // ==================== Email ====================

  async getEmails(userId: string, filter: EmailFilterDto): Promise<SyncedEmail[]> {
    const where: any = { userId };

    if (filter.startDate && filter.endDate) {
      where.receivedAt = Between(new Date(filter.startDate), new Date(filter.endDate));
    }
    if (filter.folder) where.folderName = filter.folder;
    if (filter.isRead !== undefined) where.isRead = filter.isRead;
    if (filter.hasAttachments !== undefined) where.hasAttachments = filter.hasAttachments;
    if (filter.linkedHouseholdId) where.linkedHouseholdId = filter.linkedHouseholdId;
    if (filter.linkedPersonId) where.linkedPersonId = filter.linkedPersonId;
    if (filter.isClientCommunication !== undefined) where.isClientCommunication = filter.isClientCommunication;
    if (filter.isArchived !== undefined) where.isArchived = filter.isArchived;

    let emails = await this.emailRepository.find({
      where,
      order: { receivedAt: 'DESC' },
      take: 100,
    });

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      emails = emails.filter(e => 
        e.subject.toLowerCase().includes(searchLower) ||
        e.bodyPreview?.toLowerCase().includes(searchLower)
      );
    }

    return emails;
  }

  async getEmail(userId: string, emailId: string): Promise<SyncedEmail> {
    const email = await this.emailRepository.findOne({
      where: { id: emailId, userId },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    return email;
  }

  async sendEmail(userId: string, provider: IntegrationProvider, dto: SendEmailDto): Promise<SyncedEmail> {
    const integration = await this.getIntegration(userId, provider);

    if (integration.status !== IntegrationStatus.ACTIVE) {
      throw new BadRequestException('Integration is not active');
    }

    // In production, send via Microsoft Graph API
    const externalId = 'ms_email_sent_' + Date.now();

    const email = this.emailRepository.create({
      userId,
      provider,
      externalId,
      subject: dto.subject,
      body: dto.body,
      bodyPreview: dto.body.substring(0, 200),
      bodyContentType: dto.bodyContentType || 'html',
      from: { email: integration.externalEmail || 'user@example.com' },
      to: dto.to,
      cc: dto.cc || [],
      sentAt: new Date(),
      receivedAt: new Date(),
      importance: dto.importance || 'normal',
      folderName: 'Sent Items',
      isRead: true,
      hasAttachments: false,
      attachments: [],
      lastSyncedAt: new Date(),
      linkedHouseholdId: dto.linkedHouseholdId,
      linkedPersonId: dto.linkedPersonId,
      isClientCommunication: !!(dto.linkedHouseholdId || dto.linkedPersonId),
      rawData: { source: 'crm' },
    });

    return this.emailRepository.save(email);
  }

  async linkEmail(userId: string, emailId: string, dto: LinkEmailDto): Promise<SyncedEmail> {
    const email = await this.getEmail(userId, emailId);

    if (dto.linkedHouseholdId !== undefined) email.linkedHouseholdId = dto.linkedHouseholdId;
    if (dto.linkedPersonId !== undefined) email.linkedPersonId = dto.linkedPersonId;
    if (dto.internalNotes !== undefined) email.internalNotes = dto.internalNotes;
    if (dto.isClientCommunication !== undefined) email.isClientCommunication = dto.isClientCommunication;

    return this.emailRepository.save(email);
  }

  async archiveEmails(userId: string, emailIds: string[]): Promise<number> {
    const result = await this.emailRepository.update(
      { id: In(emailIds), userId },
      { isArchived: true },
    );
    return result.affected || 0;
  }

  async getEmailThreads(userId: string, householdId?: string): Promise<EmailThread[]> {
    const where: any = { userId };
    if (householdId) where.linkedHouseholdId = householdId;

    return this.threadRepository.find({
      where,
      order: { lastMessageAt: 'DESC' },
      take: 50,
    });
  }

  async getEmailThread(userId: string, conversationId: string): Promise<SyncedEmail[]> {
    return this.emailRepository.find({
      where: { userId, conversationId },
      order: { receivedAt: 'ASC' },
    });
  }

  // ==================== Sync ====================

  async triggerSync(userId: string, provider: IntegrationProvider, dto: ManualSyncDto): Promise<IntegrationSyncLog> {
    const integration = await this.getIntegration(userId, provider);

    if (integration.status !== IntegrationStatus.ACTIVE) {
      throw new BadRequestException('Integration is not active');
    }

    const syncLog = this.syncLogRepository.create({
      userId,
      provider,
      syncType: dto.syncType,
      status: 'started',
      startedAt: new Date(),
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsDeleted: 0,
      errors: 0,
      errorDetails: [],
    });

    await this.syncLogRepository.save(syncLog);

    // In production, this would call Microsoft Graph API to sync data
    // Simulate sync process
    try {
      if (dto.syncType === 'calendar' || dto.syncType === 'full') {
        // Simulate syncing calendar events
        syncLog.itemsProcessed += 10;
        syncLog.itemsCreated += 3;
        syncLog.itemsUpdated += 2;
      }

      if (dto.syncType === 'email' || dto.syncType === 'full') {
        // Simulate syncing emails
        syncLog.itemsProcessed += 25;
        syncLog.itemsCreated += 10;
        syncLog.itemsUpdated += 5;
      }

      syncLog.status = 'completed';
      syncLog.completedAt = new Date();
      integration.lastSyncAt = new Date();
      integration.lastSyncError = undefined;

    } catch (error) {
      syncLog.status = 'failed';
      syncLog.completedAt = new Date();
      syncLog.errors = 1;
      syncLog.errorDetails = [{ message: error.message }];
      integration.lastSyncError = error.message;
    }

    await this.integrationRepository.save(integration);
    return this.syncLogRepository.save(syncLog);
  }

  async getSyncLogs(userId: string, provider?: IntegrationProvider): Promise<IntegrationSyncLog[]> {
    const where: any = { userId };
    if (provider) where.provider = provider;

    return this.syncLogRepository.find({
      where,
      order: { startedAt: 'DESC' },
      take: 20,
    });
  }

  // ==================== Auto-linking ====================

  async autoLinkEmailsToClients(userId: string): Promise<number> {
    // This would match email addresses to persons in the database
    // and automatically link emails to the correct household/person
    // Placeholder for the actual implementation
    return 0;
  }

  // ==================== Statistics ====================

  async getIntegrationStats(userId: string): Promise<{
    totalCalendarEvents: number;
    upcomingEvents: number;
    totalEmails: number;
    unreadEmails: number;
    clientEmails: number;
    lastSyncAt?: Date;
  }> {
    const now = new Date();

    const [totalCalendarEvents, upcomingEvents, totalEmails, unreadEmails, clientEmails] = await Promise.all([
      this.calendarRepository.count({ where: { userId } }),
      this.calendarRepository.count({ 
        where: { 
          userId,
          startTime: Between(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
        },
      }),
      this.emailRepository.count({ where: { userId } }),
      this.emailRepository.count({ where: { userId, isRead: false } }),
      this.emailRepository.count({ where: { userId, isClientCommunication: true } }),
    ]);

    const integrations = await this.getUserIntegrations(userId);
    const lastSyncAt = integrations
      .map(i => i.lastSyncAt)
      .filter((d): d is Date => d !== null && d !== undefined)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      totalCalendarEvents,
      upcomingEvents,
      totalEmails,
      unreadEmails,
      clientEmails,
      lastSyncAt,
    };
  }
}
