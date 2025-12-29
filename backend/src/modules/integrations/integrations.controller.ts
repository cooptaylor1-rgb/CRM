import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Redirect,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import {
  InitiateOAuthDto,
  CompleteOAuthDto,
  UpdateIntegrationSettingsDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  CalendarFilterDto,
  SendEmailDto,
  EmailFilterDto,
  LinkEmailDto,
  ArchiveEmailDto,
  ManualSyncDto,
} from './dto/integration.dto';
import { IntegrationProvider } from './entities/integration.entity';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // ==================== OAuth ====================

  @Post('oauth/initiate')
  @ApiOperation({ summary: 'Get OAuth URL for Microsoft/Google integration' })
  @ApiResponse({ status: 200, description: 'OAuth URL generated' })
  initiateOAuth(@Body() dto: InitiateOAuthDto, @Request() req: RequestWithUser) {
    const url = this.integrationsService.getOAuthUrl(dto.provider, req.user.id);
    return { url };
  }

  @Get('oauth/callback')
  @ApiOperation({ summary: 'OAuth callback handler' })
  async handleCallback(@Query('code') code: string, @Query('state') state: string) {
    const integration = await this.integrationsService.handleOAuthCallback(code, state);
    return { 
      success: true, 
      message: 'Integration connected successfully',
      provider: integration.provider,
    };
  }

  // ==================== Integration Management ====================

  @Get()
  @ApiOperation({ summary: 'Get all user integrations' })
  @ApiResponse({ status: 200, description: 'List of user integrations' })
  getUserIntegrations(@Request() req: RequestWithUser) {
    return this.integrationsService.getUserIntegrations(req.user.id);
  }

  @Get(':provider')
  @ApiOperation({ summary: 'Get integration by provider' })
  @ApiResponse({ status: 200, description: 'Integration details' })
  getIntegration(@Param('provider') provider: IntegrationProvider, @Request() req: RequestWithUser) {
    return this.integrationsService.getIntegration(req.user.id, provider);
  }

  @Patch(':provider/settings')
  @ApiOperation({ summary: 'Update integration settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  updateSettings(
    @Param('provider') provider: IntegrationProvider,
    @Body() dto: UpdateIntegrationSettingsDto,
    @Request() req: RequestWithUser,
  ) {
    return this.integrationsService.updateSettings(req.user.id, provider, dto);
  }

  @Delete(':provider')
  @ApiOperation({ summary: 'Disconnect an integration' })
  @ApiResponse({ status: 200, description: 'Integration disconnected' })
  disconnectIntegration(@Param('provider') provider: IntegrationProvider, @Request() req: RequestWithUser) {
    return this.integrationsService.disconnectIntegration(req.user.id, provider);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get integration statistics' })
  @ApiResponse({ status: 200, description: 'Integration statistics' })
  getStats(@Request() req: RequestWithUser) {
    return this.integrationsService.getIntegrationStats(req.user.id);
  }

  // ==================== Calendar ====================

  @Get('calendar/events')
  @ApiOperation({ summary: 'Get synced calendar events' })
  @ApiResponse({ status: 200, description: 'List of calendar events' })
  getCalendarEvents(@Query() filter: CalendarFilterDto, @Request() req: RequestWithUser) {
    return this.integrationsService.getCalendarEvents(req.user.id, filter);
  }

  @Post('calendar/events/:provider')
  @ApiOperation({ summary: 'Create a calendar event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  createCalendarEvent(
    @Param('provider') provider: IntegrationProvider,
    @Body() dto: CreateCalendarEventDto,
    @Request() req: RequestWithUser,
  ) {
    return this.integrationsService.createCalendarEvent(req.user.id, provider, dto);
  }

  @Patch('calendar/events/:eventId')
  @ApiOperation({ summary: 'Update a calendar event' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  updateCalendarEvent(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateCalendarEventDto,
    @Request() req: RequestWithUser,
  ) {
    return this.integrationsService.updateCalendarEvent(req.user.id, eventId, dto);
  }

  @Delete('calendar/events/:eventId')
  @ApiOperation({ summary: 'Delete a calendar event' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  deleteCalendarEvent(@Param('eventId') eventId: string, @Request() req: RequestWithUser) {
    return this.integrationsService.deleteCalendarEvent(req.user.id, eventId);
  }

  @Patch('calendar/events/:eventId/link')
  @ApiOperation({ summary: 'Link calendar event to household/person' })
  @ApiResponse({ status: 200, description: 'Event linked' })
  linkCalendarEvent(
    @Param('eventId') eventId: string,
    @Request() req: RequestWithUser,
    @Query('householdId') householdId?: string,
    @Query('personId') personId?: string,
  ) {
    return this.integrationsService.linkCalendarEventToEntity(
      req.user.id,
      eventId,
      householdId,
      personId,
    );
  }

  // ==================== Email ====================

  @Get('email/messages')
  @ApiOperation({ summary: 'Get synced emails' })
  @ApiResponse({ status: 200, description: 'List of emails' })
  getEmails(@Query() filter: EmailFilterDto, @Request() req: RequestWithUser) {
    return this.integrationsService.getEmails(req.user.id, filter);
  }

  @Get('email/messages/:emailId')
  @ApiOperation({ summary: 'Get a specific email' })
  @ApiResponse({ status: 200, description: 'Email details' })
  getEmail(@Param('emailId') emailId: string, @Request() req: RequestWithUser) {
    return this.integrationsService.getEmail(req.user.id, emailId);
  }

  @Post('email/send/:provider')
  @ApiOperation({ summary: 'Send an email' })
  @ApiResponse({ status: 201, description: 'Email sent' })
  sendEmail(
    @Param('provider') provider: IntegrationProvider,
    @Body() dto: SendEmailDto,
    @Request() req: RequestWithUser,
  ) {
    return this.integrationsService.sendEmail(req.user.id, provider, dto);
  }

  @Patch('email/messages/:emailId/link')
  @ApiOperation({ summary: 'Link email to household/person and add notes' })
  @ApiResponse({ status: 200, description: 'Email linked' })
  linkEmail(
    @Param('emailId') emailId: string,
    @Body() dto: LinkEmailDto,
    @Request() req: RequestWithUser,
  ) {
    return this.integrationsService.linkEmail(req.user.id, emailId, dto);
  }

  @Post('email/archive')
  @ApiOperation({ summary: 'Archive multiple emails' })
  @ApiResponse({ status: 200, description: 'Emails archived' })
  archiveEmails(@Body() dto: ArchiveEmailDto, @Request() req: RequestWithUser) {
    return this.integrationsService.archiveEmails(req.user.id, dto.emailIds);
  }

  @Get('email/threads')
  @ApiOperation({ summary: 'Get email threads' })
  @ApiResponse({ status: 200, description: 'List of email threads' })
  getEmailThreads(@Query('householdId') householdId: string, @Request() req: RequestWithUser) {
    return this.integrationsService.getEmailThreads(req.user.id, householdId);
  }

  @Get('email/threads/:conversationId')
  @ApiOperation({ summary: 'Get emails in a thread' })
  @ApiResponse({ status: 200, description: 'Emails in thread' })
  getEmailThread(@Param('conversationId') conversationId: string, @Request() req: RequestWithUser) {
    return this.integrationsService.getEmailThread(req.user.id, conversationId);
  }

  // ==================== Sync ====================

  @Post(':provider/sync')
  @ApiOperation({ summary: 'Trigger manual sync' })
  @ApiResponse({ status: 200, description: 'Sync initiated' })
  triggerSync(
    @Param('provider') provider: IntegrationProvider,
    @Body() dto: ManualSyncDto,
    @Request() req: RequestWithUser,
  ) {
    return this.integrationsService.triggerSync(req.user.id, provider, dto);
  }

  @Get('sync/logs')
  @ApiOperation({ summary: 'Get sync logs' })
  @ApiResponse({ status: 200, description: 'List of sync logs' })
  getSyncLogs(@Query('provider') provider: IntegrationProvider, @Request() req: RequestWithUser) {
    return this.integrationsService.getSyncLogs(req.user.id, provider);
  }
}
