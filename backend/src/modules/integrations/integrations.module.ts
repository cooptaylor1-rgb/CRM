import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import {
  UserIntegration,
  SyncedCalendarEvent,
  SyncedEmail,
  EmailThread,
  IntegrationSyncLog,
} from './entities/integration.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      UserIntegration,
      SyncedCalendarEvent,
      SyncedEmail,
      EmailThread,
      IntegrationSyncLog,
    ]),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
