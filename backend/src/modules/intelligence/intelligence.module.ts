import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';

import { ClientInsight } from './entities/client-insight.entity';
import { LifeEvent } from './entities/life-event.entity';
import { MeetingBrief } from './entities/meeting-brief.entity';
import { RiskScore } from './entities/risk-score.entity';

import { Household } from '../households/entities/household.entity';
import { Person } from '../persons/entities/person.entity';
import { Account } from '../accounts/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientInsight,
      LifeEvent,
      MeetingBrief,
      RiskScore,
      Household,
      Person,
      Account,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [IntelligenceController],
  providers: [IntelligenceService],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
