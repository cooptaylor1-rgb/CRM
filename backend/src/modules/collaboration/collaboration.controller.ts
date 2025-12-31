import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CollaborationService } from './collaboration.service';
import {
  AddTeamMemberDto,
  UpdateTeamMemberDto,
  CreateActivityDto,
  ActivityFilterDto,
  CreateCommentDto,
  UpdateCommentDto,
  UpdateNotificationPreferencesDto,
} from './collaboration.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

@ApiTags('Collaboration')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  // ==================== Team Management ====================

  @Post('households/:householdId/team')
  @ApiOperation({ summary: 'Add a team member to a household' })
  async addTeamMember(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: AddTeamMemberDto,
    @Request() req: RequestWithUser,
  ) {
    return this.collaborationService.addTeamMember(
      { ...dto, householdId },
      req.user.id,
    );
  }

  @Get('households/:householdId/team')
  @ApiOperation({ summary: 'Get household team members' })
  async getHouseholdTeam(@Param('householdId', ParseUUIDPipe) householdId: string) {
    return this.collaborationService.getHouseholdTeam(householdId);
  }

  @Put('households/:householdId/team/:userId')
  @ApiOperation({ summary: 'Update a team member' })
  async updateTeamMember(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.collaborationService.updateTeamMember(householdId, userId, dto);
  }

  @Delete('households/:householdId/team/:userId')
  @ApiOperation({ summary: 'Remove a team member' })
  async removeTeamMember(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.collaborationService.removeTeamMember(householdId, userId, req.user.id);
  }

  @Get('my-households')
  @ApiOperation({ summary: 'Get households assigned to current user' })
  async getMyHouseholds(@Request() req: RequestWithUser) {
    return this.collaborationService.getUserHouseholds(req.user.id);
  }

  // ==================== Activity Feed ====================

  @Get('activity')
  @ApiOperation({ summary: 'Get activity feed' })
  async getActivityFeed(@Query() filter: ActivityFilterDto) {
    return this.collaborationService.getActivityFeed(filter);
  }

  @Get('activity/my-feed')
  @ApiOperation({ summary: 'Get current user activity feed' })
  async getMyActivityFeed(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: number,
  ) {
    return this.collaborationService.getUserActivityFeed(req.user.id, limit);
  }

  @Get('households/:householdId/activity')
  @ApiOperation({ summary: 'Get household activity feed' })
  async getHouseholdActivity(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query('limit') limit?: number,
  ) {
    return this.collaborationService.getRecentActivity(householdId, limit);
  }

  @Post('activity')
  @ApiOperation({ summary: 'Log an activity' })
  async logActivity(
    @Body() dto: CreateActivityDto,
    @Request() req: RequestWithUser,
  ) {
    return this.collaborationService.logActivity(
      dto,
      req.user.id,
      `${req.user.firstName} ${req.user.lastName}`,
    );
  }

  // ==================== Comments ====================

  @Post('comments')
  @ApiOperation({ summary: 'Create a comment' })
  async createComment(
    @Body() dto: CreateCommentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.collaborationService.createComment(
      dto,
      req.user.id,
      `${req.user.firstName} ${req.user.lastName}`,
    );
  }

  @Get('comments/:entityType/:entityId')
  @ApiOperation({ summary: 'Get comments for an entity' })
  async getComments(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.collaborationService.getComments(entityType, entityId);
  }

  @Get('comments/:commentId/thread')
  @ApiOperation({ summary: 'Get comment thread' })
  async getCommentThread(@Param('commentId', ParseUUIDPipe) commentId: string) {
    return this.collaborationService.getCommentThread(commentId);
  }

  @Put('comments/:commentId')
  @ApiOperation({ summary: 'Update a comment' })
  async updateComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.collaborationService.updateComment(commentId, dto, req.user.id);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.collaborationService.deleteComment(commentId, req.user.id);
  }

  // ==================== Notifications ====================

  @Get('notifications')
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(
    @Request() req: RequestWithUser,
    @Query('unreadOnly') unreadOnly?: boolean,
    @Query('limit') limit?: number,
  ) {
    return this.collaborationService.getNotifications(
      req.user.id,
      unreadOnly,
      limit,
    );
  }

  @Get('notifications/unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Request() req: RequestWithUser) {
    const count = await this.collaborationService.getUnreadCount(req.user.id);
    return { count };
  }

  @Put('notifications/:notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.collaborationService.markAsRead(notificationId, req.user.id);
  }

  @Put('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req: RequestWithUser) {
    await this.collaborationService.markAllAsRead(req.user.id);
    return { success: true };
  }

  @Delete('notifications/:notificationId')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.collaborationService.deleteNotification(notificationId, req.user.id);
  }

  @Delete('notifications/clear-old')
  @ApiOperation({ summary: 'Clear old notifications' })
  async clearOldNotifications(
    @Request() req: RequestWithUser,
    @Query('daysOld') daysOld?: number,
  ) {
    const deleted = await this.collaborationService.clearOldNotifications(
      req.user.id,
      daysOld,
    );
    return { deleted };
  }

  // ==================== Notification Preferences ====================

  @Get('notifications/preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@Request() req: RequestWithUser) {
    return this.collaborationService.getOrCreatePreferences(req.user.id);
  }

  @Put('notifications/preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @Body() dto: UpdateNotificationPreferencesDto,
    @Request() req: RequestWithUser,
  ) {
    return this.collaborationService.updatePreferences(req.user.id, dto);
  }
}
