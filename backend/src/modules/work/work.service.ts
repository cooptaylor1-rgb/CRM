import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, Not, In, IsNull } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { Meeting, MeetingStatus } from '../meetings/entities/meeting.entity';
import { Prospect, PipelineStage } from '../pipeline/entities/prospect.entity';
import { MoneyMovementRequest, MoneyMovementStatus } from '../money-movements/entities/money-movement.entity';

export interface WorkSummary {
  now: string;
  tasks: {
    overdue: Task[];
    dueToday: Task[];
  };
  moneyMovements: {
    needsAttention: MoneyMovementRequest[];
  };
  meetings: {
    today: Meeting[];
  };
  prospects: {
    dueFollowUp: Prospect[];
  };
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

@Injectable()
export class WorkService {
  constructor(
    @InjectRepository(Task) private tasksRepo: Repository<Task>,
    @InjectRepository(Meeting) private meetingsRepo: Repository<Meeting>,
    @InjectRepository(Prospect) private prospectsRepo: Repository<Prospect>,
    @InjectRepository(MoneyMovementRequest) private mmRepo: Repository<MoneyMovementRequest>,
  ) {}

  async getSummary(userId: string): Promise<WorkSummary> {
    const now = new Date();
    const sod = startOfDay(now);
    const eod = endOfDay(now);

    const openTaskStatuses = [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.ON_HOLD];

    const [overdue, dueToday, meetingsToday, mmNeedsAttention, prospectsDue] = await Promise.all([
      this.tasksRepo.find({
        where: {
          assignedTo: userId,
          status: In(openTaskStatuses),
          dueDate: LessThan(now),
          deletedAt: IsNull(),
        },
        order: { dueDate: 'ASC', priority: 'DESC', updatedAt: 'DESC' },
        take: 25,
      }),
      this.tasksRepo.find({
        where: {
          assignedTo: userId,
          status: In(openTaskStatuses),
          dueDate: Between(sod, eod),
          deletedAt: IsNull(),
        },
        order: { dueDate: 'ASC', priority: 'DESC', updatedAt: 'DESC' },
        take: 25,
      }),
      this.meetingsRepo.find({
        where: {
          advisorId: userId,
          status: In([MeetingStatus.SCHEDULED, MeetingStatus.CONFIRMED, MeetingStatus.IN_PROGRESS]),
          startTime: Between(sod, eod),
          deletedAt: IsNull(),
        },
        order: { startTime: 'ASC' },
        take: 25,
      }),
      this.mmRepo.find({
        where: {
          // For now: show open money movements for decision/visibility.
          status: In([MoneyMovementStatus.REQUESTED, MoneyMovementStatus.IN_REVIEW, MoneyMovementStatus.APPROVED]),
          deletedAt: IsNull(),
        },
        order: { updatedAt: 'DESC', createdAt: 'DESC' },
        take: 25,
      }),
      this.prospectsRepo.find({
        where: {
          assignedAdvisorId: userId,
          stage: Not(In([PipelineStage.WON, PipelineStage.LOST])),
          nextFollowUpDate: Between(sod, eod),
          deletedAt: IsNull(),
        },
        order: { nextFollowUpDate: 'ASC', updatedAt: 'DESC' },
        take: 25,
      }),
    ]);

    return {
      now: now.toISOString(),
      tasks: { overdue, dueToday },
      meetings: { today: meetingsToday },
      moneyMovements: { needsAttention: mmNeedsAttention },
      prospects: { dueFollowUp: prospectsDue },
    };
  }
}
