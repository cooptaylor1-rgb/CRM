import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { MoneyMovementsService } from '../money-movements.service';
import {
  MoneyMovementRequest,
  MoneyMovementStatus,
  MoneyMovementType,
} from '../entities/money-movement.entity';
import { AuditService } from '../../audit/audit.service';

describe('MoneyMovementsService (lifecycle + idempotency)', () => {
  let service: MoneyMovementsService;
  let repo: jest.Mocked<Repository<MoneyMovementRequest>>;
  let audit: jest.Mocked<AuditService>;

  const userId = 'user-1';

  const base: MoneyMovementRequest = {
    id: 'mm-1',
    type: MoneyMovementType.WIRE,
    status: MoneyMovementStatus.REQUESTED,
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
    } as any;

    audit = {
      logEvent: jest.fn(),
      findAll: jest.fn(),
      findByUser: jest.fn(),
      findByEntity: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoneyMovementsService,
        { provide: getRepositoryToken(MoneyMovementRequest), useValue: repo },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(MoneyMovementsService);
  });

  it('approve: allowed from requested', async () => {
    repo.findOne.mockResolvedValue({ ...base, status: MoneyMovementStatus.REQUESTED } as any);
    repo.save.mockImplementation(async (x: any) => x);

    const out = await service.approve(base.id, userId);
    expect(out.status).toBe(MoneyMovementStatus.APPROVED);
    expect(audit.logEvent).toHaveBeenCalledTimes(1);
  });

  it('approve: rejects from initiated', async () => {
    repo.findOne.mockResolvedValue({ ...base, status: MoneyMovementStatus.INITIATED } as any);
    await expect(service.approve(base.id, userId)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('initiate: rejects unless approved', async () => {
    repo.findOne.mockResolvedValue({ ...base, status: MoneyMovementStatus.REQUESTED } as any);
    await expect(service.initiate(base.id, {}, userId, 'k1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('initiate: transitions approved -> initiated and stores idempotency key', async () => {
    repo.findOne.mockResolvedValue({ ...base, status: MoneyMovementStatus.APPROVED } as any);
    repo.save.mockImplementation(async (x: any) => x);

    const out = await service.initiate(base.id, { initiationArtifacts: { package: { v: 1 } } }, userId, 'k1');
    expect(out.status).toBe(MoneyMovementStatus.INITIATED);
    expect(out.initiationIdempotencyKey).toBe('k1');
    expect(audit.logEvent).toHaveBeenCalledTimes(1);
  });

  it('initiate: idempotent replay returns existing record without new audit event', async () => {
    const existing = {
      ...base,
      status: MoneyMovementStatus.INITIATED,
      initiationIdempotencyKey: 'k1',
      initiationArtifacts: { package: { v: 1 } },
    } as any;

    repo.findOne.mockResolvedValue(existing);

    const out = await service.initiate(base.id, { initiationArtifacts: { package: { v: 2 } } }, userId, 'k1');
    expect(out).toBe(existing);
    expect(audit.logEvent).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('initiate: different key after initiation is rejected', async () => {
    const existing = {
      ...base,
      status: MoneyMovementStatus.INITIATED,
      initiationIdempotencyKey: 'k1',
    } as any;

    repo.findOne.mockResolvedValue(existing);

    await expect(service.initiate(base.id, {}, userId, 'k2')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('close: only allowed from confirmed', async () => {
    repo.findOne.mockResolvedValue({ ...base, status: MoneyMovementStatus.INITIATED } as any);
    await expect(service.close(base.id, userId)).rejects.toBeInstanceOf(BadRequestException);

    repo.findOne.mockResolvedValue({ ...base, status: MoneyMovementStatus.CONFIRMED } as any);
    repo.save.mockImplementation(async (x: any) => x);
    const out = await service.close(base.id, userId);
    expect(out.status).toBe(MoneyMovementStatus.CLOSED);
  });
});
