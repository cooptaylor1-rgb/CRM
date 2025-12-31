import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThan } from 'typeorm';
import {
  HouseholdTeam,
  ActivityFeed,
  Comment,
  Notification,
  NotificationPreference,
  TeamRole,
  ActivityType,
  NotificationType,
} from './entities/collaboration.entity';
import {
  AddTeamMemberDto,
  UpdateTeamMemberDto,
  CreateActivityDto,
  ActivityFilterDto,
  CreateCommentDto,
  UpdateCommentDto,
  CreateNotificationDto,
  UpdateNotificationPreferencesDto,
} from './collaboration.dto';

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  constructor(
    @InjectRepository(HouseholdTeam)
    private teamRepository: Repository<HouseholdTeam>,
    @InjectRepository(ActivityFeed)
    private activityRepository: Repository<ActivityFeed>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
  ) {}

  // ==================== Team Management ====================

  async addTeamMember(dto: AddTeamMemberDto, addedBy: string): Promise<HouseholdTeam> {
    // Check if already exists
    const existing = await this.teamRepository.findOne({
      where: { householdId: dto.householdId, userId: dto.userId },
    });

    if (existing) {
      throw new BadRequestException('User is already a team member for this household');
    }

    // Set default permissions based on role
    const permissions = dto.permissions || this.getDefaultPermissions(dto.teamRole);

    const teamMember = this.teamRepository.create({
      householdId: dto.householdId,
      userId: dto.userId,
      teamRole: dto.teamRole,
      receivesNotifications: dto.receivesNotifications ?? true,
      permissions,
      assignedAt: new Date(),
      assignedBy: addedBy,
      notes: dto.notes,
    });

    const saved = await this.teamRepository.save(teamMember);

    // Log activity
    await this.logActivity({
      activityType: ActivityType.TEAM_MEMBER_ADDED,
      householdId: dto.householdId,
      description: `Added team member with role ${dto.teamRole}`,
      metadata: { userId: dto.userId, role: dto.teamRole },
    }, addedBy, 'System');

    return saved;
  }

  async updateTeamMember(
    householdId: string,
    userId: string,
    dto: UpdateTeamMemberDto,
  ): Promise<HouseholdTeam> {
    const member = await this.teamRepository.findOne({
      where: { householdId, userId },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (dto.teamRole) member.teamRole = dto.teamRole;
    if (dto.receivesNotifications !== undefined) member.receivesNotifications = dto.receivesNotifications;
    if (dto.permissions) member.permissions = { ...member.permissions, ...dto.permissions };
    if (dto.notes !== undefined) member.notes = dto.notes;

    return this.teamRepository.save(member);
  }

  async removeTeamMember(
    householdId: string,
    userId: string,
    removedBy: string,
  ): Promise<void> {
    const member = await this.teamRepository.findOne({
      where: { householdId, userId },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    await this.teamRepository.remove(member);

    // Log activity
    await this.logActivity({
      activityType: ActivityType.TEAM_MEMBER_REMOVED,
      householdId,
      description: `Removed team member`,
      metadata: { userId, role: member.teamRole },
    }, removedBy, 'System');
  }

  async getHouseholdTeam(householdId: string): Promise<HouseholdTeam[]> {
    return this.teamRepository.find({
      where: { householdId },
      order: { teamRole: 'ASC', createdAt: 'ASC' },
    });
  }

  async getUserHouseholds(userId: string): Promise<HouseholdTeam[]> {
    return this.teamRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTeamMember(householdId: string, userId: string): Promise<HouseholdTeam | null> {
    return this.teamRepository.findOne({
      where: { householdId, userId },
    });
  }

  async hasPermission(
    householdId: string,
    userId: string,
    permission: keyof HouseholdTeam['permissions'],
  ): Promise<boolean> {
    const member = await this.getTeamMember(householdId, userId);
    if (!member) return false;

    // Primary and secondary advisors have all permissions
    if (member.teamRole === TeamRole.PRIMARY_ADVISOR || member.teamRole === TeamRole.SECONDARY_ADVISOR) {
      return true;
    }

    return member.permissions[permission] ?? false;
  }

  private getDefaultPermissions(role: TeamRole): HouseholdTeam['permissions'] {
    const defaults: Record<TeamRole, HouseholdTeam['permissions']> = {
      [TeamRole.PRIMARY_ADVISOR]: {
        canEdit: true,
        canDelete: true,
        canManageTeam: true,
        canViewFinancials: true,
        canTrade: true,
      },
      [TeamRole.SECONDARY_ADVISOR]: {
        canEdit: true,
        canDelete: true,
        canManageTeam: true,
        canViewFinancials: true,
        canTrade: true,
      },
      [TeamRole.CLIENT_SERVICE]: {
        canEdit: true,
        canDelete: false,
        canManageTeam: false,
        canViewFinancials: true,
        canTrade: false,
      },
      [TeamRole.PARAPLANNER]: {
        canEdit: true,
        canDelete: false,
        canManageTeam: false,
        canViewFinancials: true,
        canTrade: false,
      },
      [TeamRole.OPERATIONS]: {
        canEdit: true,
        canDelete: false,
        canManageTeam: false,
        canViewFinancials: true,
        canTrade: false,
      },
      [TeamRole.COMPLIANCE]: {
        canEdit: false,
        canDelete: false,
        canManageTeam: false,
        canViewFinancials: true,
        canTrade: false,
      },
      [TeamRole.VIEWER]: {
        canEdit: false,
        canDelete: false,
        canManageTeam: false,
        canViewFinancials: false,
        canTrade: false,
      },
    };

    return defaults[role];
  }

  // ==================== Activity Feed ====================

  async logActivity(
    dto: CreateActivityDto,
    userId: string,
    userName: string,
  ): Promise<ActivityFeed> {
    const activity = this.activityRepository.create({
      activityType: dto.activityType,
      householdId: dto.householdId,
      accountId: dto.accountId,
      userId,
      userName,
      description: dto.description,
      metadata: dto.metadata || {},
      relatedEntityId: dto.relatedEntityId,
      relatedEntityType: dto.relatedEntityType,
      isSystem: false,
    });

    return this.activityRepository.save(activity);
  }

  async getActivityFeed(filter: ActivityFilterDto): Promise<{
    items: ActivityFeed[];
    total: number;
  }> {
    const where: any = {};

    if (filter.householdId) where.householdId = filter.householdId;
    if (filter.userId) where.userId = filter.userId;
    if (filter.activityType) where.activityType = filter.activityType;

    if (filter.startDate && filter.endDate) {
      where.createdAt = Between(new Date(filter.startDate), new Date(filter.endDate));
    }

    const [items, total] = await this.activityRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: filter.limit || 50,
      skip: filter.offset || 0,
    });

    return { items, total };
  }

  async getRecentActivity(
    householdId: string,
    limit: number = 20,
  ): Promise<ActivityFeed[]> {
    return this.activityRepository.find({
      where: { householdId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUserActivityFeed(
    userId: string,
    limit: number = 50,
  ): Promise<ActivityFeed[]> {
    // Get user's households
    const teams = await this.getUserHouseholds(userId);
    const householdIds = teams.map(t => t.householdId);

    if (householdIds.length === 0) {
      return [];
    }

    return this.activityRepository.find({
      where: { householdId: In(householdIds) },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ==================== Comments ====================

  async createComment(
    dto: CreateCommentDto,
    userId: string,
    userName: string,
  ): Promise<Comment> {
    const comment = this.commentRepository.create({
      entityType: dto.entityType,
      entityId: dto.entityId,
      parentId: dto.parentId,
      userId,
      userName,
      content: dto.content,
      mentions: dto.mentions || [],
    });

    const saved = await this.commentRepository.save(comment);

    // Create notifications for mentions
    if (dto.mentions && dto.mentions.length > 0) {
      for (const mention of dto.mentions) {
        await this.createNotification({
          userId: mention.userId,
          notificationType: NotificationType.MENTION,
          title: 'You were mentioned',
          message: `${userName} mentioned you in a comment`,
          link: `/${dto.entityType}s/${dto.entityId}`,
          metadata: {
            entityType: dto.entityType,
            entityId: dto.entityId,
            mentionedBy: userId,
            mentionedByName: userName,
          },
          triggeredBy: userId,
        });
      }
    }

    // Log activity
    if (dto.entityType === 'household') {
      await this.logActivity({
        activityType: ActivityType.COMMENT_ADDED,
        householdId: dto.entityId,
        description: 'Added a comment',
        relatedEntityId: saved.id,
        relatedEntityType: 'comment',
      }, userId, userName);
    }

    return saved;
  }

  async updateComment(
    commentId: string,
    dto: UpdateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new BadRequestException('You can only edit your own comments');
    }

    comment.content = dto.content;
    if (dto.mentions) comment.mentions = dto.mentions;
    comment.isEdited = true;
    comment.editedAt = new Date();

    return this.commentRepository.save(comment);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new BadRequestException('You can only delete your own comments');
    }

    comment.isDeleted = true;
    comment.content = '[Comment deleted]';
    await this.commentRepository.save(comment);
  }

  async getComments(
    entityType: string,
    entityId: string,
  ): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { entityType: entityType as any, entityId, isDeleted: false },
      order: { createdAt: 'ASC' },
    });
  }

  async getCommentThread(commentId: string): Promise<Comment[]> {
    const parent = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!parent) {
      throw new NotFoundException('Comment not found');
    }

    const replies = await this.commentRepository.find({
      where: { parentId: commentId, isDeleted: false },
      order: { createdAt: 'ASC' },
    });

    return [parent, ...replies];
  }

  // ==================== Notifications ====================

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    // Check user preferences
    const preferences = await this.getOrCreatePreferences(dto.userId);
    
    // Check if this notification type is enabled
    const typeKey = this.getPreferenceKey(dto.notificationType);
    if (typeKey) {
      const prefs = preferences.inAppPreferences as Record<string, boolean>;
      if (prefs[typeKey] === false) {
        this.logger.debug(`Notification type ${dto.notificationType} disabled for user ${dto.userId}`);
        // Still create but mark as system-generated tracking
      }
    }

    const notification = this.notificationRepository.create({
      userId: dto.userId,
      notificationType: dto.notificationType,
      title: dto.title,
      message: dto.message,
      link: dto.link,
      metadata: dto.metadata || {},
      triggeredBy: dto.triggeredBy,
    });

    const saved = await this.notificationRepository.save(notification);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 50,
  ): Promise<Notification[]> {
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;

    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);
  }

  async clearOldNotifications(userId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository.delete({
      userId,
      createdAt: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }

  // ==================== Notification Preferences ====================

  async getPreferences(userId: string): Promise<NotificationPreference | null> {
    return this.preferenceRepository.findOne({
      where: { userId },
    });
  }

  async getOrCreatePreferences(userId: string): Promise<NotificationPreference> {
    let prefs = await this.getPreferences(userId);

    if (!prefs) {
      prefs = this.preferenceRepository.create({
        userId,
        emailPreferences: {
          mentions: true,
          taskAssigned: true,
          taskDue: true,
          meetingReminders: true,
          commentReplies: true,
          clientUpdates: false,
          dailyDigest: true,
          weeklyDigest: false,
        },
        inAppPreferences: {
          mentions: true,
          taskAssigned: true,
          taskDue: true,
          meetingReminders: true,
          commentReplies: true,
          clientUpdates: true,
          workflowActions: true,
        },
        soundEnabled: true,
        desktopEnabled: true,
        quietHoursEnabled: false,
      });
      prefs = await this.preferenceRepository.save(prefs);
    }

    return prefs;
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreference> {
    let prefs = await this.getOrCreatePreferences(userId);

    if (dto.emailPreferences) {
      prefs.emailPreferences = { ...prefs.emailPreferences, ...dto.emailPreferences };
    }
    if (dto.inAppPreferences) {
      prefs.inAppPreferences = { ...prefs.inAppPreferences, ...dto.inAppPreferences };
    }
    if (dto.soundEnabled !== undefined) prefs.soundEnabled = dto.soundEnabled;
    if (dto.desktopEnabled !== undefined) prefs.desktopEnabled = dto.desktopEnabled;
    if (dto.quietHoursStart) prefs.quietHoursStart = dto.quietHoursStart;
    if (dto.quietHoursEnd) prefs.quietHoursEnd = dto.quietHoursEnd;
    if (dto.quietHoursEnabled !== undefined) prefs.quietHoursEnabled = dto.quietHoursEnabled;

    return this.preferenceRepository.save(prefs);
  }

  private getPreferenceKey(notificationType: NotificationType): string | null {
    const mapping: Record<NotificationType, string | null> = {
      [NotificationType.MENTION]: 'mentions',
      [NotificationType.TASK_ASSIGNED]: 'taskAssigned',
      [NotificationType.TASK_DUE]: 'taskDue',
      [NotificationType.MEETING_REMINDER]: 'meetingReminders',
      [NotificationType.COMMENT_REPLY]: 'commentReplies',
      [NotificationType.WORKFLOW_ACTION]: 'workflowActions',
      [NotificationType.CLIENT_UPDATE]: 'clientUpdates',
      [NotificationType.DOCUMENT_ACTION]: null,
      [NotificationType.SYSTEM]: null,
    };

    return mapping[notificationType];
  }
}
