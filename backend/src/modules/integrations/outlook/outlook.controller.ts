import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { OutlookService } from './outlook.service';
import {
  InitiateOutlookConnectionDto,
  CompleteOutlookConnectionDto,
  UpdateOutlookConnectionDto,
  GetEmailsQueryDto,
  TagEmailDto,
  BulkTagEmailsDto,
  GetEventsQueryDto,
  TagEventDto,
  CreateOutlookEventDto,
  UpdateOutlookEventDto,
  CreateMatchingRuleDto,
  UpdateMatchingRuleDto,
  TriggerSyncDto,
  LinkContactDto,
} from './outlook.dto';

interface JwtUser {
  id: string;
  email: string;
  firmId: string;
  role: string;
}

@Controller('integrations/outlook')
@UseGuards(JwtAuthGuard)
export class OutlookController {
  constructor(private readonly outlookService: OutlookService) {}

  // ==================== Connection Management ====================

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  async initiateConnection(
    @CurrentUser() user: JwtUser,
    @Body() dto: InitiateOutlookConnectionDto,
  ) {
    const authUrl = this.outlookService.getAuthorizationUrl(user.id, dto.redirectUri);
    return { authorizationUrl: authUrl };
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async completeConnection(
    @CurrentUser() user: JwtUser,
    @Body() dto: CompleteOutlookConnectionDto,
  ) {
    const connection = await this.outlookService.completeConnection(
      dto.code,
      user.id,
      user.firmId,
      dto.redirectUri,
    );

    return {
      success: true,
      connection: {
        id: connection.id,
        email: connection.email,
        displayName: connection.displayName,
        status: connection.status,
        syncEmails: connection.syncEmails,
        syncCalendar: connection.syncCalendar,
        syncContacts: connection.syncContacts,
      },
    };
  }

  @Get('connection')
  async getConnection(@CurrentUser() user: JwtUser) {
    const connection = await this.outlookService.getConnection(user.id);
    
    if (!connection) {
      return { connected: false };
    }

    return {
      connected: true,
      connection: {
        id: connection.id,
        email: connection.email,
        displayName: connection.displayName,
        status: connection.status,
        syncEmails: connection.syncEmails,
        syncCalendar: connection.syncCalendar,
        syncContacts: connection.syncContacts,
        autoTagEntities: connection.autoTagEntities,
        createActivities: connection.createActivities,
        lastEmailSync: connection.lastEmailSync,
        lastCalendarSync: connection.lastCalendarSync,
        lastContactSync: connection.lastContactSync,
      },
    };
  }

  @Patch('connection')
  async updateConnection(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateOutlookConnectionDto,
  ) {
    const connection = await this.outlookService.updateConnection(user.id, dto);
    
    return {
      success: true,
      connection: {
        id: connection.id,
        email: connection.email,
        displayName: connection.displayName,
        status: connection.status,
        syncEmails: connection.syncEmails,
        syncCalendar: connection.syncCalendar,
        syncContacts: connection.syncContacts,
        autoTagEntities: connection.autoTagEntities,
        createActivities: connection.createActivities,
      },
    };
  }

  @Delete('connection')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnectOutlook(@CurrentUser() user: JwtUser) {
    await this.outlookService.disconnectOutlook(user.id);
  }

  // ==================== Sync Control ====================

  @Get('sync/status')
  async getSyncStatus(@CurrentUser() user: JwtUser) {
    return this.outlookService.getSyncStatus(user.id);
  }

  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerSync(
    @CurrentUser() user: JwtUser,
    @Body() dto: TriggerSyncDto,
  ) {
    await this.outlookService.triggerSync(user.id, dto);
    return { message: 'Sync started', types: dto };
  }

  // ==================== Email Operations ====================

  @Get('emails')
  async getEmails(
    @CurrentUser() user: JwtUser,
    @Query() query: GetEmailsQueryDto,
  ) {
    return this.outlookService.getEmails(user.id, query);
  }

  @Get('emails/:emailId')
  async getEmail(
    @CurrentUser() user: JwtUser,
    @Param('emailId') emailId: string,
  ) {
    const result = await this.outlookService.getEmails(user.id, { limit: 1 } as any);
    const email = result.emails.find(e => e.id === emailId);
    if (!email) {
      return { error: 'Email not found' };
    }
    return email;
  }

  @Patch('emails/:emailId/tag')
  async tagEmail(
    @CurrentUser() user: JwtUser,
    @Param('emailId') emailId: string,
    @Body() dto: TagEmailDto,
  ) {
    const email = await this.outlookService.tagEmail(user.id, emailId, dto);
    return { success: true, email };
  }

  @Post('emails/bulk-tag')
  @HttpCode(HttpStatus.OK)
  async bulkTagEmails(
    @CurrentUser() user: JwtUser,
    @Body() dto: BulkTagEmailsDto,
  ) {
    const count = await this.outlookService.bulkTagEmails(user.id, dto);
    return { success: true, count };
  }

  // ==================== Calendar Operations ====================

  @Get('events')
  async getEvents(
    @CurrentUser() user: JwtUser,
    @Query() query: GetEventsQueryDto,
  ) {
    return this.outlookService.getEvents(user.id, query);
  }

  @Get('events/:eventId')
  async getEvent(
    @CurrentUser() user: JwtUser,
    @Param('eventId') eventId: string,
  ) {
    const result = await this.outlookService.getEvents(user.id, { limit: 1 } as any);
    const event = result.events.find(e => e.id === eventId);
    if (!event) {
      return { error: 'Event not found' };
    }
    return event;
  }

  @Post('events')
  async createEvent(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateOutlookEventDto,
  ) {
    const event = await this.outlookService.createEvent(user.id, dto);
    return { success: true, event };
  }

  @Patch('events/:eventId')
  async updateEvent(
    @CurrentUser() user: JwtUser,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateOutlookEventDto,
  ) {
    const event = await this.outlookService.updateEvent(user.id, eventId, dto);
    return { success: true, event };
  }

  @Delete('events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(
    @CurrentUser() user: JwtUser,
    @Param('eventId') eventId: string,
  ) {
    await this.outlookService.deleteEvent(user.id, eventId);
  }

  @Patch('events/:eventId/tag')
  async tagEvent(
    @CurrentUser() user: JwtUser,
    @Param('eventId') eventId: string,
    @Body() dto: TagEventDto,
  ) {
    const event = await this.outlookService.tagEvent(user.id, eventId, dto);
    return { success: true, event };
  }

  // ==================== Matching Rules ====================

  @Get('rules')
  async getMatchingRules(@CurrentUser() user: JwtUser) {
    const rules = await this.outlookService.getMatchingRules(user.firmId);
    return { rules };
  }

  @Post('rules')
  async createMatchingRule(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateMatchingRuleDto,
  ) {
    const rule = await this.outlookService.createMatchingRule(user.firmId, user.id, dto);
    return { success: true, rule };
  }

  @Put('rules/:ruleId')
  async updateMatchingRule(
    @CurrentUser() user: JwtUser,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateMatchingRuleDto,
  ) {
    const rule = await this.outlookService.updateMatchingRule(ruleId, user.firmId, dto);
    return { success: true, rule };
  }

  @Delete('rules/:ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMatchingRule(
    @CurrentUser() user: JwtUser,
    @Param('ruleId') ruleId: string,
  ) {
    await this.outlookService.deleteMatchingRule(ruleId, user.firmId);
  }

  // ==================== Analytics ====================

  @Get('analytics/emails')
  async getEmailAnalytics(
    @CurrentUser() user: JwtUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('householdId') householdId?: string,
  ) {
    // Return email analytics
    const status = await this.outlookService.getSyncStatus(user.id);
    return {
      totalEmails: status.emailCount,
      untaggedEmails: status.untaggedEmailCount,
      taggedPercentage: status.emailCount > 0 
        ? Math.round(((status.emailCount - status.untaggedEmailCount) / status.emailCount) * 100)
        : 0,
      householdId,
      period: { startDate, endDate },
    };
  }

  @Get('analytics/calendar')
  async getCalendarAnalytics(
    @CurrentUser() user: JwtUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('householdId') householdId?: string,
  ) {
    // Return calendar analytics
    const status = await this.outlookService.getSyncStatus(user.id);
    return {
      totalEvents: status.eventCount,
      untaggedEvents: status.untaggedEventCount,
      taggedPercentage: status.eventCount > 0
        ? Math.round(((status.eventCount - status.untaggedEventCount) / status.eventCount) * 100)
        : 0,
      householdId,
      period: { startDate, endDate },
    };
  }

  // ==================== Entity-Specific Queries ====================

  @Get('households/:householdId/emails')
  async getHouseholdEmails(
    @CurrentUser() user: JwtUser,
    @Param('householdId') householdId: string,
    @Query() query: GetEmailsQueryDto,
  ) {
    return this.outlookService.getEmails(user.id, { ...query, householdId });
  }

  @Get('households/:householdId/events')
  async getHouseholdEvents(
    @CurrentUser() user: JwtUser,
    @Param('householdId') householdId: string,
    @Query() query: GetEventsQueryDto,
  ) {
    return this.outlookService.getEvents(user.id, { ...query, householdId });
  }

  @Get('accounts/:accountId/emails')
  async getAccountEmails(
    @CurrentUser() user: JwtUser,
    @Param('accountId') accountId: string,
    @Query() query: GetEmailsQueryDto,
  ) {
    return this.outlookService.getEmails(user.id, { ...query, accountId });
  }

  @Get('accounts/:accountId/events')
  async getAccountEvents(
    @CurrentUser() user: JwtUser,
    @Param('accountId') accountId: string,
    @Query() query: GetEventsQueryDto,
  ) {
    return this.outlookService.getEvents(user.id, { ...query, accountId });
  }

  @Get('persons/:personId/emails')
  async getPersonEmails(
    @CurrentUser() user: JwtUser,
    @Param('personId') personId: string,
    @Query() query: GetEmailsQueryDto,
  ) {
    return this.outlookService.getEmails(user.id, { ...query, personId });
  }

  @Get('persons/:personId/events')
  async getPersonEvents(
    @CurrentUser() user: JwtUser,
    @Param('personId') personId: string,
    @Query() query: GetEventsQueryDto,
  ) {
    return this.outlookService.getEvents(user.id, { ...query, personId });
  }
}
