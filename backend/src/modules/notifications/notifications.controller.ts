import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService, NotificationFilter, NotificationStats } from './notifications.service';
import { CreateNotificationDto, BroadcastNotificationDto } from './dto/create-notification.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Notification, NotificationPreference, NotificationType, NotificationPriority, EntityType } from './entities/notification.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get notifications for the current user
   */
  @Get()
  async getNotifications(
    @CurrentUser() user: JwtPayload,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('type') type?: NotificationType,
    @Query('priority') priority?: NotificationPriority,
    @Query('entityType') entityType?: EntityType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('includeArchived') includeArchived?: string,
  ): Promise<Notification[]> {
    const filter: NotificationFilter = {
      unreadOnly: unreadOnly === 'true',
      type,
      priority,
      entityType,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      includeArchived: includeArchived === 'true',
    };

    return this.notificationsService.getForUser(user.sub, filter);
  }

  /**
   * Get notification statistics
   */
  @Get('stats')
  async getStats(@CurrentUser() user: JwtPayload): Promise<NotificationStats> {
    return this.notificationsService.getStats(user.sub);
  }

  /**
   * Get user notification preferences
   */
  @Get('preferences')
  async getPreferences(@CurrentUser() user: JwtPayload): Promise<NotificationPreference | null> {
    return this.notificationsService.getPreferences(user.sub);
  }

  /**
   * Update user notification preferences
   */
  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<NotificationPreference> {
    return this.notificationsService.updatePreferences(user.sub, dto);
  }

  /**
   * Mark all notifications as read
   */
  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser() user: JwtPayload): Promise<{ count: number }> {
    const count = await this.notificationsService.markAllAsRead(user.sub);
    return { count };
  }

  /**
   * Create a notification (admin/system use)
   */
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateNotificationDto,
  ): Promise<Notification[]> {
    return this.notificationsService.create(dto, user.sub);
  }

  /**
   * Broadcast notification to multiple users
   */
  @Post('broadcast')
  async broadcast(
    @CurrentUser() user: JwtPayload,
    @Body() dto: BroadcastNotificationDto,
  ): Promise<{ count: number }> {
    const count = await this.notificationsService.broadcast(dto, user.sub);
    return { count };
  }

  /**
   * Mark a notification as read
   */
  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  /**
   * Archive a notification
   */
  @Patch(':id/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archive(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.notificationsService.archive(id, user.sub);
  }

  /**
   * Delete a notification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.notificationsService.delete(id, user.sub);
  }
}
