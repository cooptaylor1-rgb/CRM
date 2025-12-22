import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceReview } from './entities/compliance-review.entity';
import { CreateComplianceReviewDto } from './dto/create-compliance-review.dto';
import { UpdateComplianceReviewDto } from './dto/update-compliance-review.dto';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(ComplianceReview)
    private reviewsRepository: Repository<ComplianceReview>,
  ) {}

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
