import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AllocationsService } from '../allocations.service';
import {
  TargetAssetAllocation,
  AllocationLineItem,
  FeeSchedule,
  FeeTier,
  FeeHistory,
  AllocationEntityType,
  AssetClass,
} from '../entities/allocation.entity';
import {
  CreateTargetAllocationDto,
  CreateFeeScheduleDto,
  CalculateFeeDto,
} from '../allocations.dto';

// =============================================================================
// Mock Data
// =============================================================================

const mockFirmId = 'firm-123';
const mockUserId = 'user-456';
const mockEntityId = 'household-789';

const mockAllocation: TargetAssetAllocation = {
  id: 'allocation-1',
  firmId: mockFirmId,
  entityType: AllocationEntityType.HOUSEHOLD,
  entityId: mockEntityId,
  name: 'Growth Portfolio',
  description: 'Aggressive growth allocation',
  isActive: true,
  createdBy: mockUserId,
  createdAt: new Date(),
  updatedAt: new Date(),
  lineItems: [],
};

const mockLineItems: AllocationLineItem[] = [
  {
    id: 'line-1',
    allocationId: 'allocation-1',
    assetClass: AssetClass.US_EQUITY,
    targetPercentage: 60,
    minPercentage: 55,
    maxPercentage: 65,
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'line-2',
    allocationId: 'allocation-1',
    assetClass: AssetClass.FIXED_INCOME,
    targetPercentage: 30,
    minPercentage: 25,
    maxPercentage: 35,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'line-3',
    allocationId: 'allocation-1',
    assetClass: AssetClass.CASH,
    targetPercentage: 10,
    minPercentage: 5,
    maxPercentage: 15,
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockFeeSchedule: FeeSchedule = {
  id: 'fee-schedule-1',
  firmId: mockFirmId,
  entityType: AllocationEntityType.HOUSEHOLD,
  entityId: mockEntityId,
  name: 'Standard Fee',
  isActive: true,
  createdBy: mockUserId,
  createdAt: new Date(),
  updatedAt: new Date(),
  tiers: [],
};

const mockFeeTiers: FeeTier[] = [
  {
    id: 'tier-1',
    feeScheduleId: 'fee-schedule-1',
    tierName: 'First $1M',
    minAmount: 0,
    maxAmount: 1000000,
    rate: 1.0,
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tier-2',
    feeScheduleId: 'fee-schedule-1',
    tierName: 'Next $4M',
    minAmount: 1000000,
    maxAmount: 5000000,
    rate: 0.75,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tier-3',
    feeScheduleId: 'fee-schedule-1',
    tierName: 'Over $5M',
    minAmount: 5000000,
    rate: 0.5,
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// =============================================================================
// Mock Repositories
// =============================================================================

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  })),
});

const createMockDataSource = () => ({
  transaction: jest.fn((callback) => callback({
    getRepository: jest.fn().mockReturnValue(createMockRepository()),
  })),
});

// =============================================================================
// Test Suite
// =============================================================================

describe('AllocationsService', () => {
  let service: AllocationsService;
  let allocationRepo: jest.Mocked<Repository<TargetAssetAllocation>>;
  let lineItemRepo: jest.Mocked<Repository<AllocationLineItem>>;
  let feeScheduleRepo: jest.Mocked<Repository<FeeSchedule>>;
  let feeTierRepo: jest.Mocked<Repository<FeeTier>>;
  let feeHistoryRepo: jest.Mocked<Repository<FeeHistory>>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const mockAllocationRepo = createMockRepository();
    const mockLineItemRepo = createMockRepository();
    const mockFeeScheduleRepo = createMockRepository();
    const mockFeeTierRepo = createMockRepository();
    const mockFeeHistoryRepo = createMockRepository();
    const mockDataSource = createMockDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllocationsService,
        {
          provide: getRepositoryToken(TargetAssetAllocation),
          useValue: mockAllocationRepo,
        },
        {
          provide: getRepositoryToken(AllocationLineItem),
          useValue: mockLineItemRepo,
        },
        {
          provide: getRepositoryToken(FeeSchedule),
          useValue: mockFeeScheduleRepo,
        },
        {
          provide: getRepositoryToken(FeeTier),
          useValue: mockFeeTierRepo,
        },
        {
          provide: getRepositoryToken(FeeHistory),
          useValue: mockFeeHistoryRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AllocationsService>(AllocationsService);
    allocationRepo = module.get(getRepositoryToken(TargetAssetAllocation));
    lineItemRepo = module.get(getRepositoryToken(AllocationLineItem));
    feeScheduleRepo = module.get(getRepositoryToken(FeeSchedule));
    feeTierRepo = module.get(getRepositoryToken(FeeTier));
    feeHistoryRepo = module.get(getRepositoryToken(FeeHistory));
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // createAllocation Tests
  // ===========================================================================

  describe('createAllocation', () => {
    const validDto: CreateTargetAllocationDto = {
      entityType: AllocationEntityType.HOUSEHOLD,
      entityId: mockEntityId,
      name: 'Test Allocation',
      lineItems: [
        { assetClass: AssetClass.US_EQUITY, targetPercentage: 60 },
        { assetClass: AssetClass.FIXED_INCOME, targetPercentage: 30 },
        { assetClass: AssetClass.CASH, targetPercentage: 10 },
      ],
    };

    it('should create an allocation with valid data', async () => {
      // Setup mock transaction
      const mockManager = {
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === TargetAssetAllocation) {
            return {
              create: jest.fn().mockReturnValue(mockAllocation),
              save: jest.fn().mockResolvedValue(mockAllocation),
              update: jest.fn().mockResolvedValue({ affected: 1 }),
            };
          }
          if (entity === AllocationLineItem) {
            return {
              create: jest.fn().mockImplementation((data) => data),
              save: jest.fn().mockResolvedValue(mockLineItems),
            };
          }
          return createMockRepository();
        }),
      };

      (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
        callback(mockManager)
      );

      const result = await service.createAllocation(mockFirmId, mockUserId, validDto);

      expect(result).toBeDefined();
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should reject if percentages do not sum to 100', async () => {
      const invalidDto: CreateTargetAllocationDto = {
        ...validDto,
        lineItems: [
          { assetClass: AssetClass.US_EQUITY, targetPercentage: 50 },
          { assetClass: AssetClass.FIXED_INCOME, targetPercentage: 30 },
          // Missing 20%
        ],
      };

      await expect(
        service.createAllocation(mockFirmId, mockUserId, invalidDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept percentages that sum to approximately 100', async () => {
      // Allow for floating point tolerance
      const dtoWithFloatingPoint: CreateTargetAllocationDto = {
        ...validDto,
        lineItems: [
          { assetClass: AssetClass.US_EQUITY, targetPercentage: 33.33 },
          { assetClass: AssetClass.FIXED_INCOME, targetPercentage: 33.33 },
          { assetClass: AssetClass.CASH, targetPercentage: 33.34 },
        ],
      };

      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          create: jest.fn().mockReturnValue(mockAllocation),
          save: jest.fn().mockResolvedValue(mockAllocation),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
        }),
      };

      (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
        callback(mockManager)
      );

      // Should not throw
      await expect(
        service.createAllocation(mockFirmId, mockUserId, dtoWithFloatingPoint)
      ).resolves.toBeDefined();
    });
  });

  // ===========================================================================
  // getAllocations Tests
  // ===========================================================================

  describe('getAllocations', () => {
    it('should return allocations with line items', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [{ ...mockAllocation, lineItems: mockLineItems }],
          1,
        ]),
      };

      (allocationRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await service.getAllocations(mockFirmId, {});

      expect(result.total).toBe(1);
      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].lineItems).toBeDefined();
    });

    it('should filter by entityType when provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      (allocationRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      await service.getAllocations(mockFirmId, {
        entityType: AllocationEntityType.ACCOUNT,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'allocation.entityType = :entityType',
        { entityType: AllocationEntityType.ACCOUNT }
      );
    });

    it('should filter by activeOnly when provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      (allocationRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      await service.getAllocations(mockFirmId, { activeOnly: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('allocation.isActive = true');
    });
  });

  // ===========================================================================
  // getAllocation Tests
  // ===========================================================================

  describe('getAllocation', () => {
    it('should return allocation with line items', async () => {
      allocationRepo.findOne.mockResolvedValue(mockAllocation);
      lineItemRepo.find.mockResolvedValue(mockLineItems);

      const result = await service.getAllocation('allocation-1', mockFirmId);

      expect(result.id).toBe('allocation-1');
      expect(result.lineItems).toEqual(mockLineItems);
    });

    it('should throw NotFoundException for non-existent allocation', async () => {
      allocationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getAllocation('non-existent', mockFirmId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // calculateFee Tests
  // ===========================================================================

  describe('calculateFee', () => {
    beforeEach(() => {
      feeScheduleRepo.findOne.mockResolvedValue({
        ...mockFeeSchedule,
        minimumFee: null,
        maximumFee: null,
      });
      feeTierRepo.find.mockResolvedValue(mockFeeTiers);
    });

    it('should calculate fee correctly for tiered structure', async () => {
      const dto: CalculateFeeDto = {
        feeScheduleId: 'fee-schedule-1',
        billableAmount: 2000000, // $2M
      };

      const result = await service.calculateFee(dto, mockFirmId);

      // First $1M at 1% = $10,000
      // Next $1M at 0.75% = $7,500
      // Total = $17,500
      expect(result.feeAmount).toBe(17500);
      expect(result.breakdown).toHaveLength(2);
    });

    it('should apply minimum fee when calculated fee is lower', async () => {
      feeScheduleRepo.findOne.mockResolvedValue({
        ...mockFeeSchedule,
        minimumFee: 5000,
        maximumFee: null,
      });

      const dto: CalculateFeeDto = {
        feeScheduleId: 'fee-schedule-1',
        billableAmount: 100000, // $100k at 1% = $1000, below $5000 minimum
      };

      const result = await service.calculateFee(dto, mockFirmId);

      expect(result.feeAmount).toBe(5000); // Should be minimum fee
    });

    it('should apply maximum fee when calculated fee exceeds', async () => {
      feeScheduleRepo.findOne.mockResolvedValue({
        ...mockFeeSchedule,
        minimumFee: null,
        maximumFee: 50000,
      });

      const dto: CalculateFeeDto = {
        feeScheduleId: 'fee-schedule-1',
        billableAmount: 10000000, // $10M would normally be high fee
      };

      const result = await service.calculateFee(dto, mockFirmId);

      expect(result.feeAmount).toBe(50000); // Should be capped at maximum
    });

    it('should throw NotFoundException for non-existent fee schedule', async () => {
      feeScheduleRepo.findOne.mockResolvedValue(null);

      const dto: CalculateFeeDto = {
        feeScheduleId: 'non-existent',
        billableAmount: 1000000,
      };

      await expect(service.calculateFee(dto, mockFirmId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ===========================================================================
  // getFeeHistory Tests (Authorization)
  // ===========================================================================

  describe('getFeeHistory', () => {
    it('should return fee history when entity access is verified', async () => {
      // Mock that allocation exists for this firm
      allocationRepo.findOne.mockResolvedValue(mockAllocation);

      const mockHistory = [
        {
          id: 'history-1',
          entityType: AllocationEntityType.HOUSEHOLD,
          entityId: mockEntityId,
          feeAmount: 10000,
        },
      ];
      feeHistoryRepo.find.mockResolvedValue(mockHistory as FeeHistory[]);

      const result = await service.getFeeHistory(
        AllocationEntityType.HOUSEHOLD,
        mockEntityId,
        mockFirmId
      );

      expect(result).toHaveLength(1);
    });

    it('should throw ForbiddenException when entity access is not verified', async () => {
      // Mock that no allocation or fee schedule exists for this firm
      allocationRepo.findOne.mockResolvedValue(null);
      feeScheduleRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getFeeHistory(
          AllocationEntityType.HOUSEHOLD,
          'unauthorized-entity',
          mockFirmId
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ===========================================================================
  // deleteAllocation Tests
  // ===========================================================================

  describe('deleteAllocation', () => {
    it('should delete allocation and its line items in transaction', async () => {
      allocationRepo.findOne.mockResolvedValue(mockAllocation);

      const mockManager = {
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === TargetAssetAllocation) {
            return {
              remove: jest.fn().mockResolvedValue(undefined),
            };
          }
          if (entity === AllocationLineItem) {
            return {
              delete: jest.fn().mockResolvedValue({ affected: 3 }),
            };
          }
          return createMockRepository();
        }),
      };

      (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
        callback(mockManager)
      );

      await service.deleteAllocation('allocation-1', mockFirmId);

      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent allocation', async () => {
      allocationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteAllocation('non-existent', mockFirmId)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
