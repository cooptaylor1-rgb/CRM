import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkController } from './work.controller';
import { WorkService } from './work.service';
import { Task } from '../tasks/entities/task.entity';
import { Meeting } from '../meetings/entities/meeting.entity';
import { Prospect } from '../pipeline/entities/prospect.entity';
import { MoneyMovementRequest } from '../money-movements/entities/money-movement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Meeting, Prospect, MoneyMovementRequest])],
  controllers: [WorkController],
  providers: [WorkService],
})
export class WorkModule {}
