import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseholdsService } from './households.service';
import { HouseholdsController } from './households.controller';
import { Household } from './entities/household.entity';
import { AuditModule } from '../audit/audit.module';
import { Task } from '../tasks/entities/task.entity';
import { Meeting } from '../meetings/entities/meeting.entity';
import { MoneyMovementRequest } from '../money-movements/entities/money-movement.entity';
import { ComplianceReview } from '../compliance/entities/compliance-review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Household, Task, Meeting, MoneyMovementRequest, ComplianceReview]),
    AuditModule,
  ],
  controllers: [HouseholdsController],
  providers: [HouseholdsService],
  exports: [HouseholdsService],
})
export class HouseholdsModule {}
