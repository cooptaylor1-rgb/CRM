import { PartialType } from '@nestjs/swagger';
import { CreateComplianceReviewDto } from './create-compliance-review.dto';

export class UpdateComplianceReviewDto extends PartialType(CreateComplianceReviewDto) {}
