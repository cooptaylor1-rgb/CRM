import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  OutlookConnection,
  OutlookEmail,
  OutlookEvent,
  OutlookMatchingRule,
  OutlookContact,
  OutlookConnectionStatus,
  EmailImportance,
  MeetingResponseStatus,
} from './outlook.entity';
import {
  UpdateOutlookConnectionDto,
  GetEmailsQueryDto,
  GetEventsQueryDto,
  TagEmailDto,
  TagEventDto,
  CreateOutlookEventDto,
  UpdateOutlookEventDto,
  CreateMatchingRuleDto,
  UpdateMatchingRuleDto,
  TriggerSyncDto,
} from './outlook.dto';

// Microsoft Graph API types
interface GraphTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface GraphUser {
  id: string;
  mail: string;
  displayName: string;
  userPrincipalName: string;
}

interface GraphMessage {
  id: string;
  conversationId: string;
  internetMessageId: string;
  subject: string;
  bodyPreview: string;
  from: { emailAddress: { address: string; name: string } };
  toRecipients: Array<{ emailAddress: { address: string; name: string } }>;
  ccRecipients: Array<{ emailAddress: { address: string; name: string } }>;
  bccRecipients: Array<{ emailAddress: { address: string; name: string } }>;
  receivedDateTime: string;
  sentDateTime: string;
  isRead: boolean;
  isDraft: boolean;
  hasAttachments: boolean;
  importance: string;
  parentFolderId: string;
  categories: string[];
}

interface GraphEvent {
  id: string;
  iCalUId: string;
  seriesMasterId?: string;
  subject: string;
  body: { contentType: string; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  isAllDay: boolean;
  isCancelled: boolean;
  isOnlineMeeting: boolean;
  onlineMeeting?: { joinUrl: string };
  onlineMeetingProvider?: string;
  location?: { displayName: string; address?: any; coordinates?: any };
  organizer: { emailAddress: { address: string; name: string } };
  attendees: Array<{
    emailAddress: { address: string; name: string };
    type: string;
    status: { response: string };
  }>;
  recurrence?: any;
  categories: string[];
  sensitivity: string;
  showAs: string;
}

@Injectable()
export class OutlookService {
  private readonly logger = new Logger(OutlookService.name);
  private readonly graphBaseUrl = 'https://graph.microsoft.com/v1.0';
  private readonly authBaseUrl = 'https://login.microsoftonline.com';
  private syncInProgress = new Map<string, boolean>();

  constructor(
    @InjectRepository(OutlookConnection)
    private connectionRepo: Repository<OutlookConnection>,
    @InjectRepository(OutlookEmail)
    private emailRepo: Repository<OutlookEmail>,
    @InjectRepository(OutlookEvent)
    private eventRepo: Repository<OutlookEvent>,
    @InjectRepository(OutlookMatchingRule)
    private ruleRepo: Repository<OutlookMatchingRule>,
    @InjectRepository(OutlookContact)
    private contactRepo: Repository<OutlookContact>,
    private configService: ConfigService
  ) {}

  // ==================== OAuth & Connection ====================

  getAuthorizationUrl(userId: string, redirectUri?: string): string {
    const clientId = this.configService.get('MICROSOFT_CLIENT_ID') || '';
    const baseRedirect = redirectUri || this.configService.get('MICROSOFT_REDIRECT_URI') || '';
    const scopes = [
      'offline_access',
      'User.Read',
      'Mail.Read',
      'Mail.Send',
      'Calendars.ReadWrite',
      'Contacts.Read',
    ].join(' ');

    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

    const params = new URLSearchParams();
    params.set('client_id', clientId);
    params.set('response_type', 'code');
    params.set('redirect_uri', baseRedirect);
    params.set('response_mode', 'query');
    params.set('scope', scopes);
    params.set('state', state);
    params.set('prompt', 'consent');

    return `${this.authBaseUrl}/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async completeConnection(
    code: string,
    userId: string,
    firmId: string,
    redirectUri?: string
  ): Promise<OutlookConnection> {
    const clientId = this.configService.get('MICROSOFT_CLIENT_ID') || '';
    const clientSecret = this.configService.get('MICROSOFT_CLIENT_SECRET') || '';
    const baseRedirect = redirectUri || this.configService.get('MICROSOFT_REDIRECT_URI') || '';

    try {
      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(
        code,
        clientId,
        clientSecret,
        baseRedirect
      );

      // Get user profile
      const userProfile = await this.getGraphUser(tokenResponse.access_token);

      // Create or update connection
      let connection = await this.connectionRepo.findOne({ where: { userId } });

      if (!connection) {
        connection = this.connectionRepo.create({
          userId,
          firmId,
        });
      }

      connection.microsoftUserId = userProfile.id;
      connection.email = userProfile.mail || userProfile.userPrincipalName;
      connection.displayName = userProfile.displayName;
      connection.accessToken = tokenResponse.access_token;
      connection.refreshToken = tokenResponse.refresh_token;
      connection.tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      connection.status = OutlookConnectionStatus.CONNECTED;
      connection.errorMessage = undefined;

      const saved = await this.connectionRepo.save(connection);

      // Trigger initial sync
      this.triggerSync(userId, { emails: true, calendar: true, contacts: true });

      return saved;
    } catch (error) {
      this.logger.error(`Failed to complete Outlook connection: ${error.message}`);
      throw new BadRequestException('Failed to connect to Outlook');
    }
  }

  private async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<GraphTokenResponse> {
    const params = new URLSearchParams();
    params.set('client_id', clientId);
    params.set('client_secret', clientSecret);
    params.set('code', code);
    params.set('redirect_uri', redirectUri);
    params.set('grant_type', 'authorization_code');

    const response = await fetch(`${this.authBaseUrl}/common/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Token exchange failed');
    }

    return response.json();
  }

  private async refreshAccessToken(connection: OutlookConnection): Promise<string> {
    const clientId = this.configService.get('MICROSOFT_CLIENT_ID');
    const clientSecret = this.configService.get('MICROSOFT_CLIENT_SECRET');

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refreshToken!,
      grant_type: 'refresh_token',
    });

    const response = await fetch(`${this.authBaseUrl}/common/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      connection.status = OutlookConnectionStatus.EXPIRED;
      connection.errorMessage = 'Token refresh failed - reconnection required';
      await this.connectionRepo.save(connection);
      throw new UnauthorizedException('Outlook connection expired');
    }

    const tokens: GraphTokenResponse = await response.json();
    
    connection.accessToken = tokens.access_token;
    connection.refreshToken = tokens.refresh_token;
    connection.tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    connection.status = OutlookConnectionStatus.CONNECTED;
    await this.connectionRepo.save(connection);

    return tokens.access_token;
  }

  private async getValidAccessToken(connection: OutlookConnection): Promise<string> {
    if (!connection.accessToken) {
      throw new UnauthorizedException('No access token available');
    }

    // Refresh if expiring in next 5 minutes
    if (connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
      return this.refreshAccessToken(connection);
    }

    return connection.accessToken;
  }

  async getConnection(userId: string): Promise<OutlookConnection | null> {
    return this.connectionRepo.findOne({ where: { userId } });
  }

  async updateConnection(userId: string, dto: UpdateOutlookConnectionDto): Promise<OutlookConnection> {
    const connection = await this.connectionRepo.findOne({ where: { userId } });
    if (!connection) {
      throw new NotFoundException('Outlook connection not found');
    }

    Object.assign(connection, dto);
    return this.connectionRepo.save(connection);
  }

  async disconnectOutlook(userId: string): Promise<void> {
    const connection = await this.connectionRepo.findOne({ where: { userId } });
    if (!connection) return;

    // Clear tokens and mark as disconnected
    connection.accessToken = undefined;
    connection.refreshToken = undefined;
    connection.status = OutlookConnectionStatus.DISCONNECTED;
    await this.connectionRepo.save(connection);
  }

  // ==================== Graph API Helpers ====================

  private async getGraphUser(accessToken: string): Promise<GraphUser> {
    const response = await fetch(`${this.graphBaseUrl}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }

  private async graphRequest<T>(
    connection: OutlookConnection,
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const accessToken = await this.getValidAccessToken(connection);
    
    const response = await fetch(`${this.graphBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Graph API error: ${response.status}`);
    }

    return response.json();
  }

  // ==================== Email Sync ====================

  async syncEmails(userId: string, fullSync = false): Promise<number> {
    const connection = await this.getConnection(userId);
    if (!connection || connection.status !== OutlookConnectionStatus.CONNECTED) {
      throw new BadRequestException('Outlook not connected');
    }

    if (!connection.syncEmails) {
      return 0;
    }

    const syncKey = `email-${userId}`;
    if (this.syncInProgress.get(syncKey)) {
      this.logger.log('Email sync already in progress');
      return 0;
    }

    this.syncInProgress.set(syncKey, true);
    let syncedCount = 0;

    try {
      const daysToSync = connection.emailFilters?.daysToSync || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToSync);

      let endpoint = '/me/messages';
      const params = new URLSearchParams({
        $top: '100',
        $orderby: 'receivedDateTime desc',
        $filter: `receivedDateTime ge ${startDate.toISOString()}`,
        $select: 'id,conversationId,internetMessageId,subject,bodyPreview,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,sentDateTime,isRead,isDraft,hasAttachments,importance,parentFolderId,categories',
      });

      // Use delta if available and not full sync
      if (!fullSync && connection.emailDeltaToken) {
        endpoint = `/me/messages/delta?$deltatoken=${connection.emailDeltaToken}`;
      } else {
        endpoint = `/me/messages?${params.toString()}`;
      }

      let hasMore = true;
      let deltaToken: string | undefined;

      while (hasMore) {
        const response = await this.graphRequest<any>(connection, endpoint);
        const messages: GraphMessage[] = response.value || [];

        for (const msg of messages) {
          await this.upsertEmail(connection.id, msg);
          syncedCount++;
        }

        if (response['@odata.nextLink']) {
          endpoint = response['@odata.nextLink'].replace(this.graphBaseUrl, '');
        } else {
          hasMore = false;
          deltaToken = response['@odata.deltaLink']?.split('$deltatoken=')[1];
        }
      }

      // Update sync state
      connection.lastEmailSync = new Date();
      if (deltaToken) {
        connection.emailDeltaToken = deltaToken;
      }
      await this.connectionRepo.save(connection);

      // Auto-tag new emails
      if (connection.autoTagEntities) {
        await this.autoTagEmails(connection);
      }

      this.logger.log(`Synced ${syncedCount} emails for user ${userId}`);
    } catch (error) {
      this.logger.error(`Email sync failed: ${error.message}`);
      connection.errorMessage = error.message;
      await this.connectionRepo.save(connection);
    } finally {
      this.syncInProgress.delete(syncKey);
    }

    return syncedCount;
  }

  private async upsertEmail(connectionId: string, msg: GraphMessage): Promise<OutlookEmail> {
    let email = await this.emailRepo.findOne({
      where: { connectionId, outlookMessageId: msg.id },
    });

    if (!email) {
      email = this.emailRepo.create({ connectionId, outlookMessageId: msg.id });
    }

    email.conversationId = msg.conversationId;
    email.internetMessageId = msg.internetMessageId;
    email.subject = msg.subject || '(No Subject)';
    email.bodyPreview = msg.bodyPreview;
    email.fromAddress = msg.from?.emailAddress?.address || '';
    email.fromName = msg.from?.emailAddress?.name;
    email.toRecipients = (msg.toRecipients || []).map(r => ({
      address: r.emailAddress.address,
      name: r.emailAddress.name,
    }));
    email.ccRecipients = (msg.ccRecipients || []).map(r => ({
      address: r.emailAddress.address,
      name: r.emailAddress.name,
    }));
    email.bccRecipients = (msg.bccRecipients || []).map(r => ({
      address: r.emailAddress.address,
      name: r.emailAddress.name,
    }));
    email.receivedAt = new Date(msg.receivedDateTime);
    email.sentAt = msg.sentDateTime ? new Date(msg.sentDateTime) : undefined;
    email.isRead = msg.isRead;
    email.isDraft = msg.isDraft;
    email.hasAttachments = msg.hasAttachments;
    email.importance = msg.importance?.toLowerCase() as EmailImportance || EmailImportance.NORMAL;
    email.folderId = msg.parentFolderId;
    email.categories = msg.categories || [];

    return this.emailRepo.save(email);
  }

  // ==================== Calendar Sync ====================

  async syncCalendar(userId: string, fullSync = false): Promise<number> {
    const connection = await this.getConnection(userId);
    if (!connection || connection.status !== OutlookConnectionStatus.CONNECTED) {
      throw new BadRequestException('Outlook not connected');
    }

    if (!connection.syncCalendar) {
      return 0;
    }

    const syncKey = `calendar-${userId}`;
    if (this.syncInProgress.get(syncKey)) {
      this.logger.log('Calendar sync already in progress');
      return 0;
    }

    this.syncInProgress.set(syncKey, true);
    let syncedCount = 0;

    try {
      const daysBehind = connection.calendarFilters?.daysBehind || 30;
      const daysAhead = connection.calendarFilters?.daysAhead || 90;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBehind);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      let endpoint = '/me/calendar/calendarView';
      const params = new URLSearchParams({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        $top: '100',
        $orderby: 'start/dateTime',
        $select: 'id,iCalUId,seriesMasterId,subject,body,start,end,isAllDay,isCancelled,isOnlineMeeting,onlineMeeting,onlineMeetingProvider,location,organizer,attendees,recurrence,categories,sensitivity,showAs',
      });

      endpoint = `${endpoint}?${params.toString()}`;

      let hasMore = true;

      while (hasMore) {
        const response = await this.graphRequest<any>(connection, endpoint);
        const events: GraphEvent[] = response.value || [];

        for (const evt of events) {
          // Skip private events if configured
          if (connection.calendarFilters?.excludePrivate && evt.sensitivity === 'private') {
            continue;
          }
          // Skip all-day events if configured
          if (connection.calendarFilters?.excludeAllDay && evt.isAllDay) {
            continue;
          }

          await this.upsertEvent(connection.id, evt);
          syncedCount++;
        }

        if (response['@odata.nextLink']) {
          endpoint = response['@odata.nextLink'].replace(this.graphBaseUrl, '');
        } else {
          hasMore = false;
        }
      }

      // Update sync state
      connection.lastCalendarSync = new Date();
      await this.connectionRepo.save(connection);

      // Auto-tag new events
      if (connection.autoTagEntities) {
        await this.autoTagEvents(connection);
      }

      this.logger.log(`Synced ${syncedCount} events for user ${userId}`);
    } catch (error) {
      this.logger.error(`Calendar sync failed: ${error.message}`);
      connection.errorMessage = error.message;
      await this.connectionRepo.save(connection);
    } finally {
      this.syncInProgress.delete(syncKey);
    }

    return syncedCount;
  }

  private async upsertEvent(connectionId: string, evt: GraphEvent): Promise<OutlookEvent> {
    let event = await this.eventRepo.findOne({
      where: { connectionId, outlookEventId: evt.id },
    });

    if (!event) {
      event = this.eventRepo.create({ connectionId, outlookEventId: evt.id });
    }

    event.iCalUId = evt.iCalUId;
    event.seriesMasterId = evt.seriesMasterId;
    event.subject = evt.subject || '(No Subject)';
    event.body = evt.body?.content;
    event.bodyContentType = evt.body?.contentType;
    event.startTime = new Date(evt.start.dateTime);
    event.endTime = new Date(evt.end.dateTime);
    event.timezone = evt.start.timeZone;
    event.isAllDay = evt.isAllDay;
    event.isCancelled = evt.isCancelled;
    event.isOnlineMeeting = evt.isOnlineMeeting;
    event.onlineMeetingUrl = evt.onlineMeeting?.joinUrl;
    event.onlineMeetingProvider = evt.onlineMeetingProvider;
    event.location = evt.location?.displayName;
    event.locationDetails = evt.location ? {
      displayName: evt.location.displayName,
      address: evt.location.address,
      coordinates: evt.location.coordinates,
    } : undefined;
    event.organizerEmail = evt.organizer?.emailAddress?.address || '';
    event.organizerName = evt.organizer?.emailAddress?.name;
    event.attendees = (evt.attendees || []).map(a => ({
      email: a.emailAddress.address,
      name: a.emailAddress.name,
      type: a.type as 'required' | 'optional' | 'resource',
      responseStatus: this.mapResponseStatus(a.status?.response),
    }));
    event.isRecurring = !!evt.recurrence;
    event.recurrence = evt.recurrence;
    event.categories = evt.categories || [];
    event.sensitivity = evt.sensitivity as any;
    event.showAs = evt.showAs as any;

    return this.eventRepo.save(event);
  }

  private mapResponseStatus(response: string): MeetingResponseStatus {
    switch (response?.toLowerCase()) {
      case 'organizer': return MeetingResponseStatus.ORGANIZER;
      case 'tentativelyaccepted': return MeetingResponseStatus.TENTATIVE;
      case 'accepted': return MeetingResponseStatus.ACCEPTED;
      case 'declined': return MeetingResponseStatus.DECLINED;
      default: return MeetingResponseStatus.NONE;
    }
  }

  // ==================== Entity Tagging ====================

  async autoTagEmails(connection: OutlookConnection): Promise<number> {
    // Get untagged emails
    const untaggedEmails = await this.emailRepo.find({
      where: {
        connectionId: connection.id,
        manuallyTagged: false,
        householdId: IsNull(),
        personId: IsNull(),
      },
      take: 500,
    });

    // Get matching rules
    const rules = await this.ruleRepo.find({
      where: { firmId: connection.firmId, isActive: true },
      order: { priority: 'ASC' },
    });

    let taggedCount = 0;

    for (const email of untaggedEmails) {
      const match = await this.findEntityMatch(email, rules, connection.firmId);
      if (match) {
        if (match.householdId) email.householdId = match.householdId;
        if (match.accountId) email.accountId = match.accountId;
        if (match.personId) email.personId = match.personId;
        email.matchMetadata = match.metadata;
        await this.emailRepo.save(email);
        taggedCount++;
      }
    }

    return taggedCount;
  }

  async autoTagEvents(connection: OutlookConnection): Promise<number> {
    // Get untagged events
    const untaggedEvents = await this.eventRepo.find({
      where: {
        connectionId: connection.id,
        manuallyTagged: false,
        householdId: IsNull(),
        personId: IsNull(),
      },
      take: 500,
    });

    // Get matching rules
    const rules = await this.ruleRepo.find({
      where: { firmId: connection.firmId, isActive: true },
      order: { priority: 'ASC' },
    });

    let taggedCount = 0;

    for (const event of untaggedEvents) {
      const match = await this.findEventEntityMatch(event, rules, connection.firmId);
      if (match) {
        if (match.householdId) event.householdId = match.householdId;
        if (match.accountId) event.accountId = match.accountId;
        if (match.personId) event.personId = match.personId;
        event.matchMetadata = match.metadata;
        await this.eventRepo.save(event);
        taggedCount++;
      }
    }

    return taggedCount;
  }

  private async findEntityMatch(
    email: OutlookEmail,
    rules: OutlookMatchingRule[],
    firmId: string,
  ): Promise<{
    householdId?: string;
    accountId?: string;
    personId?: string;
    metadata: any;
  } | null> {
    const allAddresses = [
      email.fromAddress,
      ...email.toRecipients.map(r => r.address),
      ...email.ccRecipients.map(r => r.address),
    ].filter(Boolean);

    // Check rules first
    for (const rule of rules) {
      for (const address of allAddresses) {
        let isMatch = false;

        switch (rule.ruleType) {
          case 'email_address':
            isMatch = address.toLowerCase() === rule.pattern.toLowerCase();
            break;
          case 'email_domain':
            isMatch = address.toLowerCase().endsWith(`@${rule.pattern.toLowerCase()}`);
            break;
          case 'subject_pattern':
            isMatch = new RegExp(rule.pattern, 'i').test(email.subject);
            break;
        }

        if (isMatch) {
          return {
            [rule.entityType === 'household' ? 'householdId' : 
             rule.entityType === 'account' ? 'accountId' : 'personId']: rule.entityId,
            metadata: {
              matchedBy: 'rule',
              ruleName: rule.name,
              confidence: 100,
            },
          };
        }
      }
    }

    // TODO: Implement database lookup for person emails
    // This would query the persons table to find matching email addresses
    
    return null;
  }

  private async findEventEntityMatch(
    event: OutlookEvent,
    rules: OutlookMatchingRule[],
    firmId: string,
  ): Promise<{
    householdId?: string;
    accountId?: string;
    personId?: string;
    metadata: any;
  } | null> {
    const allAddresses = [
      event.organizerEmail,
      ...event.attendees.map(a => a.email),
    ].filter(Boolean);

    // Check rules
    for (const rule of rules) {
      for (const address of allAddresses) {
        let isMatch = false;

        switch (rule.ruleType) {
          case 'email_address':
            isMatch = address.toLowerCase() === rule.pattern.toLowerCase();
            break;
          case 'email_domain':
            isMatch = address.toLowerCase().endsWith(`@${rule.pattern.toLowerCase()}`);
            break;
          case 'subject_pattern':
            isMatch = new RegExp(rule.pattern, 'i').test(event.subject);
            break;
        }

        if (isMatch) {
          return {
            [rule.entityType === 'household' ? 'householdId' : 
             rule.entityType === 'account' ? 'accountId' : 'personId']: rule.entityId,
            metadata: {
              matchedBy: 'rule',
              ruleName: rule.name,
              confidence: 100,
            },
          };
        }
      }
    }

    return null;
  }

  // ==================== Email CRUD ====================

  async getEmails(userId: string, query: GetEmailsQueryDto): Promise<{ emails: OutlookEmail[]; total: number }> {
    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new NotFoundException('Outlook connection not found');
    }

    const qb = this.emailRepo.createQueryBuilder('email')
      .where('email.connectionId = :connectionId', { connectionId: connection.id });

    if (query.householdId) {
      qb.andWhere('email.householdId = :householdId', { householdId: query.householdId });
    }
    if (query.accountId) {
      qb.andWhere('email.accountId = :accountId', { accountId: query.accountId });
    }
    if (query.personId) {
      qb.andWhere('email.personId = :personId', { personId: query.personId });
    }
    if (query.untaggedOnly) {
      qb.andWhere('email.householdId IS NULL AND email.personId IS NULL');
    }
    if (query.unreadOnly) {
      qb.andWhere('email.isRead = false');
    }
    if (query.search) {
      qb.andWhere('(email.subject ILIKE :search OR email.fromAddress ILIKE :search)', 
        { search: `%${query.search}%` });
    }
    if (query.folder) {
      qb.andWhere('email.folderName = :folder', { folder: query.folder });
    }
    if (query.startDate) {
      qb.andWhere('email.receivedAt >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('email.receivedAt <= :endDate', { endDate: query.endDate });
    }

    const [emails, total] = await qb
      .orderBy('email.receivedAt', 'DESC')
      .skip(query.offset || 0)
      .take(query.limit || 50)
      .getManyAndCount();

    return { emails, total };
  }

  async tagEmail(userId: string, emailId: string, dto: TagEmailDto): Promise<OutlookEmail> {
    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new NotFoundException('Outlook connection not found');
    }

    const email = await this.emailRepo.findOne({
      where: { id: emailId, connectionId: connection.id },
    });
    if (!email) {
      throw new NotFoundException('Email not found');
    }

    if (dto.householdId !== undefined) email.householdId = dto.householdId || undefined;
    if (dto.accountId !== undefined) email.accountId = dto.accountId || undefined;
    if (dto.personId !== undefined) email.personId = dto.personId || undefined;
    email.manuallyTagged = true;

    return this.emailRepo.save(email);
  }

  async bulkTagEmails(userId: string, dto: { emailIds: string[]; householdId?: string; accountId?: string; personId?: string }): Promise<number> {
    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new NotFoundException('Outlook connection not found');
    }

    const result = await this.emailRepo.update(
      { id: In(dto.emailIds), connectionId: connection.id },
      {
        householdId: dto.householdId || undefined,
        accountId: dto.accountId || undefined,
        personId: dto.personId || undefined,
        manuallyTagged: true,
      },
    );

    return result.affected || 0;
  }

  // ==================== Event CRUD ====================

  async getEvents(userId: string, query: GetEventsQueryDto): Promise<{ events: OutlookEvent[]; total: number }> {
    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new NotFoundException('Outlook connection not found');
    }

    const qb = this.eventRepo.createQueryBuilder('event')
      .where('event.connectionId = :connectionId', { connectionId: connection.id });

    if (query.householdId) {
      qb.andWhere('event.householdId = :householdId', { householdId: query.householdId });
    }
    if (query.accountId) {
      qb.andWhere('event.accountId = :accountId', { accountId: query.accountId });
    }
    if (query.personId) {
      qb.andWhere('event.personId = :personId', { personId: query.personId });
    }
    if (query.untaggedOnly) {
      qb.andWhere('event.householdId IS NULL AND event.personId IS NULL');
    }
    if (query.search) {
      qb.andWhere('event.subject ILIKE :search', { search: `%${query.search}%` });
    }
    if (query.startDate) {
      qb.andWhere('event.startTime >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('event.endTime <= :endDate', { endDate: query.endDate });
    }

    const [events, total] = await qb
      .orderBy('event.startTime', 'ASC')
      .skip(query.offset || 0)
      .take(query.limit || 50)
      .getManyAndCount();

    return { events, total };
  }

  async tagEvent(userId: string, eventId: string, dto: TagEventDto): Promise<OutlookEvent> {
    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new NotFoundException('Outlook connection not found');
    }

    const event = await this.eventRepo.findOne({
      where: { id: eventId, connectionId: connection.id },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (dto.householdId !== undefined) event.householdId = dto.householdId || undefined;
    if (dto.accountId !== undefined) event.accountId = dto.accountId || undefined;
    if (dto.personId !== undefined) event.personId = dto.personId || undefined;
    if (dto.syncToCrmMeetings !== undefined) event.syncToCrmMeetings = dto.syncToCrmMeetings;
    event.manuallyTagged = true;

    return this.eventRepo.save(event);
  }

  async createEvent(userId: string, dto: CreateOutlookEventDto): Promise<OutlookEvent> {
    const connection = await this.getConnection(userId);
    if (!connection || connection.status !== OutlookConnectionStatus.CONNECTED) {
      throw new BadRequestException('Outlook not connected');
    }

    const graphEvent = {
      subject: dto.subject,
      body: dto.body ? { contentType: 'HTML', content: dto.body } : undefined,
      start: { dateTime: dto.startTime, timeZone: dto.timezone || 'UTC' },
      end: { dateTime: dto.endTime, timeZone: dto.timezone || 'UTC' },
      isAllDay: dto.isAllDay || false,
      location: dto.location ? { displayName: dto.location } : undefined,
      attendees: dto.attendees?.map(a => ({
        emailAddress: { address: a.email, name: a.name },
        type: a.type || 'required',
      })),
      isOnlineMeeting: dto.isOnlineMeeting || false,
      onlineMeetingProvider: dto.onlineMeetingProvider,
    };

    const created = await this.graphRequest<GraphEvent>(connection, '/me/events', {
      method: 'POST',
      body: JSON.stringify(graphEvent),
    });

    const event = await this.upsertEvent(connection.id, created);
    
    // Apply CRM tags
    if (dto.householdId) event.householdId = dto.householdId;
    if (dto.accountId) event.accountId = dto.accountId;
    if (dto.personId) event.personId = dto.personId;
    event.manuallyTagged = true;

    return this.eventRepo.save(event);
  }

  async updateEvent(userId: string, eventId: string, dto: UpdateOutlookEventDto): Promise<OutlookEvent> {
    const connection = await this.getConnection(userId);
    if (!connection || connection.status !== OutlookConnectionStatus.CONNECTED) {
      throw new BadRequestException('Outlook not connected');
    }

    const event = await this.eventRepo.findOne({
      where: { id: eventId, connectionId: connection.id },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const graphUpdate: any = {};
    if (dto.subject) graphUpdate.subject = dto.subject;
    if (dto.body) graphUpdate.body = { contentType: 'HTML', content: dto.body };
    if (dto.startTime) graphUpdate.start = { dateTime: dto.startTime, timeZone: event.timezone || 'UTC' };
    if (dto.endTime) graphUpdate.end = { dateTime: dto.endTime, timeZone: event.timezone || 'UTC' };
    if (dto.location) graphUpdate.location = { displayName: dto.location };
    if (dto.attendees) {
      graphUpdate.attendees = dto.attendees.map(a => ({
        emailAddress: { address: a.email, name: a.name },
        type: a.type || 'required',
      }));
    }

    await this.graphRequest(connection, `/me/events/${event.outlookEventId}`, {
      method: 'PATCH',
      body: JSON.stringify(graphUpdate),
    });

    // Update local record
    if (dto.subject) event.subject = dto.subject;
    if (dto.body) event.body = dto.body;
    if (dto.startTime) event.startTime = new Date(dto.startTime);
    if (dto.endTime) event.endTime = new Date(dto.endTime);
    if (dto.location) event.location = dto.location;
    if (dto.attendees) {
      event.attendees = dto.attendees.map(a => ({
        email: a.email,
        name: a.name,
        type: (a.type || 'required') as 'required' | 'optional' | 'resource',
        responseStatus: MeetingResponseStatus.NONE,
      }));
    }

    return this.eventRepo.save(event);
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const connection = await this.getConnection(userId);
    if (!connection || connection.status !== OutlookConnectionStatus.CONNECTED) {
      throw new BadRequestException('Outlook not connected');
    }

    const event = await this.eventRepo.findOne({
      where: { id: eventId, connectionId: connection.id },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.graphRequest(connection, `/me/events/${event.outlookEventId}`, {
      method: 'DELETE',
    });

    await this.eventRepo.remove(event);
  }

  // ==================== Matching Rules ====================

  async createMatchingRule(
    firmId: string,
    userId: string,
    dto: CreateMatchingRuleDto
  ): Promise<OutlookMatchingRule> {
    const rule = this.ruleRepo.create({
      name: dto.name,
      description: dto.description,
      ruleType: dto.ruleType as 'email_domain' | 'email_address' | 'name_pattern' | 'subject_pattern' | 'custom',
      pattern: dto.pattern,
      entityType: dto.entityType as 'household' | 'account' | 'person',
      entityId: dto.entityId,
      priority: dto.priority ?? 0,
      firmId,
      createdBy: userId,
    });
    return this.ruleRepo.save(rule);
  }

  async getMatchingRules(firmId: string): Promise<OutlookMatchingRule[]> {
    return this.ruleRepo.find({
      where: { firmId },
      order: { priority: 'ASC' },
    });
  }

  async updateMatchingRule(
    ruleId: string,
    firmId: string,
    dto: UpdateMatchingRuleDto
  ): Promise<OutlookMatchingRule> {
    const rule = await this.ruleRepo.findOne({ where: { id: ruleId, firmId } });
    if (!rule) {
      throw new NotFoundException('Matching rule not found');
    }

    Object.assign(rule, dto);
    return this.ruleRepo.save(rule);
  }

  async deleteMatchingRule(ruleId: string, firmId: string): Promise<void> {
    const rule = await this.ruleRepo.findOne({ where: { id: ruleId, firmId } });
    if (!rule) {
      throw new NotFoundException('Matching rule not found');
    }
    await this.ruleRepo.remove(rule);
  }

  // ==================== Sync Control ====================

  async triggerSync(userId: string, dto: TriggerSyncDto): Promise<void> {
    if (dto.emails) {
      this.syncEmails(userId, dto.fullSync).catch(e => 
        this.logger.error(`Email sync failed: ${e.message}`));
    }
    if (dto.calendar) {
      this.syncCalendar(userId, dto.fullSync).catch(e => 
        this.logger.error(`Calendar sync failed: ${e.message}`));
    }
    // Contact sync would be implemented similarly
  }

  async getSyncStatus(userId: string): Promise<{
    isConnected: boolean;
    connectionStatus: string;
    lastEmailSync?: Date;
    lastCalendarSync?: Date;
    lastContactSync?: Date;
    emailCount: number;
    eventCount: number;
    contactCount: number;
    untaggedEmailCount: number;
    untaggedEventCount: number;
    syncInProgress: boolean;
    errors: string[];
  }> {
    const connection = await this.getConnection(userId);
    
    if (!connection) {
      return {
        isConnected: false,
        connectionStatus: 'not_connected',
        emailCount: 0,
        eventCount: 0,
        contactCount: 0,
        untaggedEmailCount: 0,
        untaggedEventCount: 0,
        syncInProgress: false,
        errors: [],
      };
    }

    const [emailCount, eventCount, contactCount, untaggedEmailCount, untaggedEventCount] = await Promise.all([
      this.emailRepo.count({ where: { connectionId: connection.id } }),
      this.eventRepo.count({ where: { connectionId: connection.id } }),
      this.contactRepo.count({ where: { connectionId: connection.id } }),
      this.emailRepo.count({ where: { connectionId: connection.id, householdId: IsNull(), personId: IsNull() } }),
      this.eventRepo.count({ where: { connectionId: connection.id, householdId: IsNull(), personId: IsNull() } }),
    ]);

    return {
      isConnected: connection.status === OutlookConnectionStatus.CONNECTED,
      connectionStatus: connection.status,
      lastEmailSync: connection.lastEmailSync,
      lastCalendarSync: connection.lastCalendarSync,
      lastContactSync: connection.lastContactSync,
      emailCount,
      eventCount,
      contactCount,
      untaggedEmailCount,
      untaggedEventCount,
      syncInProgress: this.syncInProgress.has(`email-${userId}`) || this.syncInProgress.has(`calendar-${userId}`),
      errors: connection.errorMessage ? [connection.errorMessage] : [],
    };
  }
}
