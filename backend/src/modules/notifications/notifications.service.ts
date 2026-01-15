import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Notification,
  NotificationPreference,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  EntityType,
} from './entities/notification.entity';
import { CreateNotificationDto, BroadcastNotificationDto } from './dto/create-notification.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { NotificationsGateway } from './notifications.gateway';

export interface NotificationStats {
  unreadCount: number;
  byType: Partial<Record<NotificationType, number>>;
  byPriority: Partial<Record<NotificationPriority, number>>;
  todayCount: number;
  urgentCount: number;
}

export interface NotificationFilter {
  unreadOnly?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  entityType?: EntityType;
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepo: Repository<NotificationPreference>,
    private gateway: NotificationsGateway,
  ) {}

  /**
   * Create notifications for multiple recipients
   */
  async create(dto: CreateNotificationDto, createdBy?: string): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const recipientId of dto.recipientIds) {
      // Check user preferences
      const preferences = await this.getPreferences(recipientId);
      const typeSettings = preferences?.typeSettings?.[dto.type];

      // Skip if user has disabled this notification type
      if (typeSettings && !typeSettings.enabled) {
        continue;
      }

      // Determine channels to use
      const channels = dto.channels || typeSettings?.channels || [NotificationChannel.IN_APP];

      // Check quiet hours
      if (this.isQuietHours(preferences)) {
        // During quiet hours, only urgent notifications or specific channels
        if (dto.priority !== NotificationPriority.URGENT) {
          // Queue for later delivery (for now, just skip non-in-app)
          const filteredChannels = channels.filter(c => c === NotificationChannel.IN_APP);
          if (filteredChannels.length === 0) continue;
        }
      }

      const notification = this.notificationRepo.create({
        type: dto.type,
        title: dto.title,
        message: dto.message,
        priority: dto.priority || NotificationPriority.NORMAL,
        recipientId,
        entityType: dto.entityType || null,
        entityId: dto.entityId || null,
        entityName: dto.entityName || null,
        actionUrl: dto.actionUrl || null,
        actionLabel: dto.actionLabel || null,
        channelsSent: channels,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        metadata: dto.metadata || null,
        createdBy: createdBy || null,
      });

      const saved = await this.notificationRepo.save(notification);
      notifications.push(saved);

      // Send real-time notification via WebSocket
      if (channels.includes(NotificationChannel.IN_APP)) {
        this.gateway.sendToUser(recipientId, 'notification', this.toClientFormat(saved));
      }

      // Queue email, push, SMS via external services (would integrate here)
      this.queueDelivery(saved, channels);
    }

    return notifications;
  }

  /**
   * Broadcast notification to all users or filtered group
   */
  async broadcast(dto: BroadcastNotificationDto, createdBy?: string): Promise<number> {
    // In production, this would query users based on roles/teams
    // For now, we'll use a placeholder approach
    const recipientIds = await this.getRecipientsByFilter(dto.roles, dto.teamIds);

    const createDto: CreateNotificationDto = {
      ...dto,
      recipientIds,
      type: dto.type,
      title: dto.title,
      message: dto.message,
    };

    const notifications = await this.create(createDto, createdBy);
    return notifications.length;
  }

  /**
   * Get notifications for a user
   */
  async getForUser(userId: string, filter: NotificationFilter = {}): Promise<Notification[]> {
    const query = this.notificationRepo.createQueryBuilder('n')
      .where('n.recipientId = :userId', { userId })
      .andWhere('n.expiresAt IS NULL OR n.expiresAt > :now', { now: new Date() });

    if (!filter.includeArchived) {
      query.andWhere('n.isArchived = false');
    }

    if (filter.unreadOnly) {
      query.andWhere('n.isRead = false');
    }

    if (filter.type) {
      query.andWhere('n.type = :type', { type: filter.type });
    }

    if (filter.priority) {
      query.andWhere('n.priority = :priority', { priority: filter.priority });
    }

    if (filter.entityType) {
      query.andWhere('n.entityType = :entityType', { entityType: filter.entityType });
    }

    query.orderBy('n.createdAt', 'DESC');

    if (filter.offset) {
      query.skip(filter.offset);
    }

    if (filter.limit) {
      query.take(filter.limit);
    } else {
      query.take(50); // Default limit
    }

    return query.getMany();
  }

  /**
   * Get notification statistics for a user
   */
  async getStats(userId: string): Promise<NotificationStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [unread, todayNotifications] = await Promise.all([
      this.notificationRepo.find({
        where: {
          recipientId: userId,
          isRead: false,
          isArchived: false,
        },
      }),
      this.notificationRepo.count({
        where: {
          recipientId: userId,
          createdAt: MoreThan(today),
        },
      }),
    ]);

    const byType: Partial<Record<NotificationType, number>> = {};
    const byPriority: Partial<Record<NotificationPriority, number>> = {};
    let urgentCount = 0;

    for (const notification of unread) {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
      if (notification.priority === NotificationPriority.URGENT) {
        urgentCount++;
      }
    }

    return {
      unreadCount: unread.length,
      byType,
      byPriority,
      todayCount: todayNotifications,
      urgentCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    const saved = await this.notificationRepo.save(notification);

    // Notify connected clients of the update
    this.gateway.sendToUser(userId, 'notification:read', { id });

    return saved;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationRepo.update(
      { recipientId: userId, isRead: false, isArchived: false },
      { isRead: true, readAt: new Date() },
    );

    // Notify connected clients
    this.gateway.sendToUser(userId, 'notifications:all-read', {});

    return result.affected || 0;
  }

  /**
   * Archive a notification
   */
  async archive(id: string, userId: string): Promise<void> {
    const result = await this.notificationRepo.update(
      { id, recipientId: userId },
      { isArchived: true, archivedAt: new Date() },
    );

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }

    this.gateway.sendToUser(userId, 'notification:archived', { id });
  }

  /**
   * Delete a notification
   */
  async delete(id: string, userId: string): Promise<void> {
    const result = await this.notificationRepo.delete({ id, recipientId: userId });

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }

    this.gateway.sendToUser(userId, 'notification:deleted', { id });
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreference | null> {
    return this.preferenceRepo.findOne({ where: { userId } });
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<NotificationPreference> {
    let preferences = await this.preferenceRepo.findOne({ where: { userId } });

    if (!preferences) {
      preferences = this.preferenceRepo.create({
        userId,
        channelSettings: { in_app: true, email: true, push: true, sms: false },
        typeSettings: this.getDefaultTypeSettings(),
        quietHours: { enabled: false, start: '22:00', end: '07:00', timezone: 'America/New_York', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        digestSettings: { enabled: true, frequency: 'daily', time: '08:00', timezone: 'America/New_York' },
      });
    }

    if (dto.channelSettings) {
      preferences.channelSettings = { ...preferences.channelSettings, ...dto.channelSettings };
    }

    if (dto.typeSettings) {
      preferences.typeSettings = { ...preferences.typeSettings, ...dto.typeSettings };
    }

    if (dto.quietHours) {
      preferences.quietHours = { ...preferences.quietHours, ...dto.quietHours };
    }

    if (dto.digestSettings) {
      preferences.digestSettings = { ...preferences.digestSettings, ...dto.digestSettings };
    }

    if (dto.pushToken !== undefined) {
      preferences.pushToken = dto.pushToken;
      preferences.pushTokenUpdatedAt = new Date();
    }

    return this.preferenceRepo.save(preferences);
  }

  /**
   * Clean up expired notifications
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpired(): Promise<void> {
    const result = await this.notificationRepo.delete({
      expiresAt: LessThan(new Date()),
    });

    this.logger.log(`Cleaned up ${result.affected} expired notifications`);
  }

  /**
   * Send daily digest emails
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyDigests(): Promise<void> {
    const preferences = await this.preferenceRepo.find({
      where: {
        // Would filter by digestSettings.enabled and time
      },
    });

    for (const pref of preferences) {
      if (pref.digestSettings?.enabled && pref.digestSettings.frequency === 'daily') {
        await this.sendDigest(pref.userId);
      }
    }
  }

  // Private helper methods

  private async sendDigest(userId: string): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const notifications = await this.notificationRepo.find({
      where: {
        recipientId: userId,
        createdAt: MoreThan(yesterday),
      },
      order: { priority: 'DESC', createdAt: 'DESC' },
    });

    if (notifications.length > 0) {
      // Would send digest email via email service
      this.logger.log(`Would send digest to user ${userId} with ${notifications.length} notifications`);
    }
  }

  private async getRecipientsByFilter(roles?: string[], teamIds?: string[]): Promise<string[]> {
    // In production, query user service for matching users
    // For now, return placeholder
    return ['user-1', 'user-2', 'user-3'];
  }

  private isQuietHours(preferences: NotificationPreference | null): boolean {
    if (!preferences?.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);

    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTime = currentHour * 60 + currentMin;
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  }

  private async queueDelivery(notification: Notification, channels: NotificationChannel[]): Promise<void> {
    // In production, this would queue messages for external delivery
    // via email service, push notification service, SMS gateway, etc.

    if (channels.includes(NotificationChannel.EMAIL)) {
      // await this.emailService.queue({ ... });
      this.logger.debug(`Would queue email for notification ${notification.id}`);
    }

    if (channels.includes(NotificationChannel.PUSH)) {
      // await this.pushService.queue({ ... });
      this.logger.debug(`Would queue push for notification ${notification.id}`);
    }

    if (channels.includes(NotificationChannel.SMS)) {
      // await this.smsService.queue({ ... });
      this.logger.debug(`Would queue SMS for notification ${notification.id}`);
    }
  }

  private toClientFormat(notification: Notification): any {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      entityType: notification.entityType,
      entityId: notification.entityId,
      entityName: notification.entityName,
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel,
      isRead: notification.isRead,
      isArchived: notification.isArchived,
      readAt: notification.readAt?.toISOString(),
      createdAt: notification.createdAt.toISOString(),
      expiresAt: notification.expiresAt?.toISOString(),
    };
  }

  private getDefaultTypeSettings(): Record<NotificationType, { enabled: boolean; channels: NotificationChannel[] }> {
    const defaults: Record<NotificationType, { enabled: boolean; channels: NotificationChannel[] }> = {} as any;

    // High priority - all channels
    const highPriority = [NotificationType.TASK_OVERDUE, NotificationType.KYC_EXPIRED, NotificationType.COMPLIANCE_OVERDUE, NotificationType.PAYMENT_OVERDUE, NotificationType.RISK_ALERT, NotificationType.SECURITY_ALERT];

    // Medium priority - in-app and email
    const mediumPriority = [NotificationType.TASK_DUE, NotificationType.TASK_ASSIGNED, NotificationType.MEETING_REMINDER, NotificationType.KYC_EXPIRING, NotificationType.DOCUMENT_EXPIRING, NotificationType.SIGNATURE_REQUIRED, NotificationType.COMPLIANCE_REVIEW];

    for (const type of Object.values(NotificationType)) {
      if (highPriority.includes(type)) {
        defaults[type] = { enabled: true, channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH] };
      } else if (mediumPriority.includes(type)) {
        defaults[type] = { enabled: true, channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL] };
      } else {
        defaults[type] = { enabled: true, channels: [NotificationChannel.IN_APP] };
      }
    }

    return defaults;
  }
}
