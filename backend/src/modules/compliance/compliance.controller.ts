import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { CreateComplianceReviewDto } from './dto/create-compliance-review.dto';
import { UpdateComplianceReviewDto } from './dto/update-compliance-review.dto';
import { ListComplianceReviewsDto } from './dto/list-compliance-reviews.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('compliance')
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post()
  @Roles('admin', 'compliance_officer')
  @ApiOperation({ summary: 'Create a compliance review' })
  create(@Body() createDto: CreateComplianceReviewDto) {
    return this.complianceService.create(createDto);
  }

  @Get('reviews')
  @Roles('admin', 'compliance_officer', 'advisor')
  @ApiOperation({ summary: 'List compliance reviews with filters (householdId, status, type, date range)' })
  list(@Query() query: ListComplianceReviewsDto) {
    return this.complianceService.list(query);
  }

  @Get()
  @Roles('admin', 'compliance_officer', 'advisor')
  @ApiOperation({ summary: 'Get all compliance reviews' })
  findAll() {
    return this.complianceService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'compliance_officer', 'advisor')
  @ApiOperation({ summary: 'Get a compliance review by ID' })
  findOne(@Param('id') id: string) {
    return this.complianceService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'compliance_officer')
  @ApiOperation({ summary: 'Update a compliance review' })
  update(@Param('id') id: string, @Body() updateDto: UpdateComplianceReviewDto) {
    return this.complianceService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a compliance review' })
  remove(@Param('id') id: string) {
    return this.complianceService.remove(id);
  }
}
