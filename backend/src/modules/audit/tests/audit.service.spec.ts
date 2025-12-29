import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditEvent, AuditEventType } from '../entities/audit-event.entity';

describe('AuditService', () => {
  let service: AuditService;
  let mockAuditRepository: any;

  const mockAuditEvent: Partial<AuditEvent> = {
    id: 'audit-uuid-123',
    userId: 'user-123',
    eventType: AuditEventType.CREATE,
    entityType: 'Household',
    entityId: 'entity-123',
    action: 'Created household',
    timestamp: new Date(),
  };

  beforeEach(async () => {
    mockAuditRepository = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'audit-uuid-123', timestamp: new Date() })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...mockAuditEvent, ...entity })),
      find: jest.fn().mockResolvedValue([mockAuditEvent]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditEvent),
          useValue: mockAuditRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logEvent', () => {
    it('should create and save an audit event', async () => {
      const eventData = {
        userId: 'user-123',
        eventType: AuditEventType.CREATE,
        entityType: 'Household',
        entityId: 'entity-123',
        action: 'Created household',
        changes: { name: 'Test Household' },
      };

      const result = await service.logEvent(eventData);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(eventData);
      expect(mockAuditRepository.save).toHaveBeenCalled();
      expect(result.userId).toBe('user-123');
    });

    it('should include IP address and user agent when provided', async () => {
      const eventData = {
        userId: 'user-123',
        eventType: AuditEventType.ACCESS,
        action: 'Viewed document',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      await service.logEvent(eventData);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return audit events ordered by timestamp descending', async () => {
      const result = await service.findAll();

      expect(mockAuditRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 100,
      });
      expect(result).toHaveLength(1);
    });

    it('should respect custom limit', async () => {
      await service.findAll(50);

      expect(mockAuditRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 50,
      });
    });
  });

  describe('findByUser', () => {
    it('should return audit events for a specific user', async () => {
      await service.findByUser('user-123');

      expect(mockAuditRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { timestamp: 'DESC' },
      });
    });
  });

  describe('findByEntity', () => {
    it('should return audit events for a specific entity', async () => {
      await service.findByEntity('Household', 'entity-123');

      expect(mockAuditRepository.find).toHaveBeenCalledWith({
        where: { entityType: 'Household', entityId: 'entity-123' },
        order: { timestamp: 'DESC' },
      });
    });
  });
});
