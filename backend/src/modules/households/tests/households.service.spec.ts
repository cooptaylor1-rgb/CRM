import { Test, TestingModule } from '@nestjs/testing';
import { HouseholdsService } from '../households.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Household, HouseholdStatus } from '../entities/household.entity';
import { AuditService } from '../../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('HouseholdsService', () => {
  let service: HouseholdsService;
  let mockHouseholdRepository: any;
  let mockAuditService: any;

  const mockHousehold: Partial<Household> = {
    id: 'test-uuid-123',
    name: 'Test Household',
    status: HouseholdStatus.ACTIVE,
    totalAum: 1000000,
    createdAt: new Date(),
    updatedAt: new Date(),
    persons: [],
    accounts: [],
  };

  beforeEach(async () => {
    mockHouseholdRepository = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'test-uuid-123' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...mockHousehold, ...entity })),
      find: jest.fn().mockResolvedValue([mockHousehold]),
      findOne: jest.fn().mockResolvedValue(mockHousehold),
      softRemove: jest.fn().mockResolvedValue(mockHousehold),
    };

    mockAuditService = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdsService,
        {
          provide: getRepositoryToken(Household),
          useValue: mockHouseholdRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<HouseholdsService>(HouseholdsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a household and log audit event', async () => {
      const createDto = { name: 'New Household' };
      const userId = 'user-123';

      const result = await service.create(createDto as any, userId);

      expect(mockHouseholdRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockHouseholdRepository.save).toHaveBeenCalled();
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          eventType: 'create',
          entityType: 'Household',
          action: 'Created household',
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all households with relations', async () => {
      const result = await service.findAll();

      expect(mockHouseholdRepository.find).toHaveBeenCalledWith({
        relations: ['persons', 'accounts'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a household by ID', async () => {
      const result = await service.findOne('test-uuid-123');

      expect(mockHouseholdRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-uuid-123' },
        relations: ['persons', 'accounts'],
      });
      expect(result.id).toBe('test-uuid-123');
    });

    it('should throw NotFoundException if household not found', async () => {
      mockHouseholdRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update household and log audit event', async () => {
      const updateDto = { name: 'Updated Household' };
      const userId = 'user-123';

      const result = await service.update('test-uuid-123', updateDto as any, userId);

      expect(mockHouseholdRepository.save).toHaveBeenCalled();
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          eventType: 'update',
          entityType: 'Household',
          action: 'Updated household',
        }),
      );
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete household and log audit event', async () => {
      const userId = 'user-123';

      await service.remove('test-uuid-123', userId);

      // Verify soft delete was called (not hard remove)
      expect(mockHouseholdRepository.softRemove).toHaveBeenCalled();
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          eventType: 'delete',
          entityType: 'Household',
          action: 'Soft deleted household',
        }),
      );
    });

    it('should set deletedBy before soft delete for audit trail', async () => {
      const userId = 'user-123';

      await service.remove('test-uuid-123', userId);

      // Verify deletedBy was set before save
      expect(mockHouseholdRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ deletedBy: userId }),
      );
    });
  });
});
