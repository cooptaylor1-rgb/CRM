import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ComplianceService } from '../compliance.service';
import { ComplianceReview, ReviewStatus, ReviewType } from '../entities/compliance-review.entity';
import { CreateComplianceReviewDto } from '../dto/create-compliance-review.dto';
import { UpdateComplianceReviewDto } from '../dto/update-compliance-review.dto';

// =============================================================================
// Mock Data
// =============================================================================

const mockReview: ComplianceReview = {
  id: 'review-1',
  householdId: 'household-123',
  reviewType: ReviewType.ANNUAL,
  reviewDate: new Date('2024-01-15'),
  reviewerId: 'user-456',
  status: ReviewStatus.COMPLETED,
  findings: 'No issues found',
  notes: 'Continue current investment strategy',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockReviews: ComplianceReview[] = [
  mockReview,
  {
    ...mockReview,
    id: 'review-2',
    householdId: 'household-456',
    reviewDate: new Date('2024-02-01'),
    status: ReviewStatus.IN_PROGRESS,
  },
];

// =============================================================================
// Test Suite
// =============================================================================

describe('ComplianceService', () => {
  let service: ComplianceService;
  let repository: jest.Mocked<Repository<ComplianceReview>>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        {
          provide: getRepositoryToken(ComplianceReview),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
    repository = module.get(getRepositoryToken(ComplianceReview));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // create Tests
  // ===========================================================================

  describe('create', () => {
    it('should create a compliance review', async () => {
      const createDto: CreateComplianceReviewDto = {
        householdId: 'household-123',
        reviewType: ReviewType.ANNUAL,
        reviewDate: '2024-01-15',
        reviewerId: 'user-456',
        status: ReviewStatus.PENDING,
      };

      repository.create.mockReturnValue(mockReview);
      repository.save.mockResolvedValue(mockReview);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockReview);
    });
  });

  // ===========================================================================
  // findAll Tests
  // ===========================================================================

  describe('findAll', () => {
    it('should return all reviews ordered by date descending', async () => {
      repository.find.mockResolvedValue(mockReviews);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { reviewDate: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no reviews exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ===========================================================================
  // findOne Tests
  // ===========================================================================

  describe('findOne', () => {
    it('should return a review by ID', async () => {
      repository.findOne.mockResolvedValue(mockReview);

      const result = await service.findOne('review-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException when review does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Compliance review with ID non-existent not found'
      );
    });
  });

  // ===========================================================================
  // update Tests
  // ===========================================================================

  describe('update', () => {
    it('should update an existing review', async () => {
      const updateDto: UpdateComplianceReviewDto = {
        status: ReviewStatus.COMPLETED,
        findings: 'Updated findings',
      };

      const updatedReview: ComplianceReview = { ...mockReview, ...updateDto } as any;

      repository.findOne.mockResolvedValue(mockReview);
      repository.save.mockResolvedValue(updatedReview);

      const result = await service.update('review-1', updateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toBe(ReviewStatus.COMPLETED);
      expect(result.findings).toBe('Updated findings');
    });

    it('should throw NotFoundException when updating non-existent review', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { status: ReviewStatus.COMPLETED })
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // remove Tests
  // ===========================================================================

  describe('remove', () => {
    it('should remove an existing review', async () => {
      repository.findOne.mockResolvedValue(mockReview);
      repository.remove.mockResolvedValue(mockReview);

      await service.remove('review-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
      expect(repository.remove).toHaveBeenCalledWith(mockReview);
    });

    it('should throw NotFoundException when removing non-existent review', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
