import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkService } from '../work.service';
import { Task } from '../../tasks/entities/task.entity';
import { Meeting } from '../../meetings/entities/meeting.entity';
import { Prospect } from '../../pipeline/entities/prospect.entity';
import { MoneyMovementRequest } from '../../money-movements/entities/money-movement.entity';

describe('WorkService', () => {
  let service: WorkService;
  let tasksRepo: jest.Mocked<Repository<Task>>;
  let meetingsRepo: jest.Mocked<Repository<Meeting>>;
  let prospectsRepo: jest.Mocked<Repository<Prospect>>;
  let mmRepo: jest.Mocked<Repository<MoneyMovementRequest>>;

  beforeEach(async () => {
    tasksRepo = { find: jest.fn() } as any;
    meetingsRepo = { find: jest.fn() } as any;
    prospectsRepo = { find: jest.fn() } as any;
    mmRepo = { find: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkService,
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        { provide: getRepositoryToken(Meeting), useValue: meetingsRepo },
        { provide: getRepositoryToken(Prospect), useValue: prospectsRepo },
        { provide: getRepositoryToken(MoneyMovementRequest), useValue: mmRepo },
      ],
    }).compile();

    service = module.get(WorkService);
  });

  it('returns a summary object with expected keys', async () => {
    tasksRepo.find.mockResolvedValue([]);
    meetingsRepo.find.mockResolvedValue([]);
    prospectsRepo.find.mockResolvedValue([]);
    mmRepo.find.mockResolvedValue([]);

    const out = await service.getSummary('user-1');
    expect(out).toHaveProperty('now');
    expect(out).toHaveProperty('tasks.overdue');
    expect(out).toHaveProperty('tasks.dueToday');
    expect(out).toHaveProperty('meetings.today');
    expect(out).toHaveProperty('moneyMovements.needsAttention');
    expect(out).toHaveProperty('prospects.dueFollowUp');
  });
});
