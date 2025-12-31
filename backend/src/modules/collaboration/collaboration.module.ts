import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';
import {
  HouseholdTeam,
  ActivityFeed,
  Comment,
  Notification,
  NotificationPreference,
} from './entities/collaboration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HouseholdTeam,
      ActivityFeed,
      Comment,
      Notification,
      NotificationPreference,
    ]),
  ],
  controllers: [CollaborationController],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
