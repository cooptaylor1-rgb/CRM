import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceReview } from './entities/compliance-review.entity';
import { CreateComplianceReviewDto } from './dto/create-compliance-review.dto';
import { UpdateComplianceReviewDto } from './dto/update-compliance-review.dto';
import { ListComplianceReviewsDto } from './dto/list-compliance-reviews.dto';
import { Household } from '../households/entities/household.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(ComplianceReview)
    private reviewsRepository: Repository<ComplianceReview>,
  ) {}

  /**
   * Production list endpoint: supports filters + household name enrichment.
   */
  async list(filters: ListComplianceReviewsDto): Promise<Array<ComplianceReview & { householdName?: string | null }>> {
    const qb = this.reviewsRepository
      .createQueryBuilder('cr')
      .leftJoin(Household, 'h', 'h.id = cr.household_id')
      .addSelect('h.name', 'household_name')
      .orderBy('cr.review_date', 'DESC');

    if (filters.householdId) {
      qb.andWhere('cr.household_id = :householdId', { householdId: filters.householdId });
    }

    if (filters.status) {
      qb.andWhere('cr.status = :status', { status: filters.status });
    }

    if (filters.type) {
      qb.andWhere('cr.review_type = :type', { type: filters.type });
    }

    if (filters.startDate) {
      qb.andWhere('cr.review_date >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      qb.andWhere('cr.review_date <= :endDate', { endDate: filters.endDate });
    }

    const { entities, raw } = await qb.getRawAndEntities();

    return entities.map((entity, idx) => ({
      ...entity,
      householdName: (raw[idx] as any)?.household_name ?? null,
    }));
  }

  async create(createDto: CreateComplianceReviewDto): Promise<ComplianceReview> {
    const review = this.reviewsRepository.create(createDto);
    return this.reviewsRepository.save(review);
  }

  async findAll(): Promise<ComplianceReview[]> {
    return this.reviewsRepository.find({
      order: { reviewDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ComplianceReview> {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Compliance review with ID ${id} not found`);
    }
    return review;
  }

  async update(id: string, updateDto: UpdateComplianceReviewDto): Promise<ComplianceReview> {
    const review = await this.findOne(id);
    Object.assign(review, updateDto);
    return this.reviewsRepository.save(review);
  }

  async remove(id: string): Promise<void> {
    const review = await this.findOne(id);
    await this.reviewsRepository.remove(review);
  }
}
