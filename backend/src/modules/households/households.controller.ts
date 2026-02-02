import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { HouseholdsService } from './households.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('households')
@Controller('households')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  @Roles('admin', 'advisor', 'operations')
  @ApiOperation({ summary: 'Create a new household' })
  @ApiResponse({ status: 201, description: 'Household created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() createHouseholdDto: CreateHouseholdDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.householdsService.create(createHouseholdDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all households' })
  @ApiResponse({ status: 200, description: 'Households retrieved successfully' })
  findAll() {
    return this.householdsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a household by ID' })
  @ApiResponse({ status: 200, description: 'Household retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  findOne(@Param('id') id: string) {
    return this.householdsService.findOne(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get unified household timeline (tasks, meetings, money movements, compliance)' })
  @ApiResponse({ status: 200, description: 'Timeline retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  getTimeline(@Param('id') id: string) {
    return this.householdsService.getTimeline(id);
  }

  @Patch(':id')
  @Roles('admin', 'advisor', 'operations')
  @ApiOperation({ summary: 'Update a household' })
  @ApiResponse({ status: 200, description: 'Household updated successfully' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  update(
    @Param('id') id: string,
    @Body() updateHouseholdDto: UpdateHouseholdDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.householdsService.update(id, updateHouseholdDto, userId);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Soft delete a household (SEC compliance)' })
  @ApiResponse({ status: 200, description: 'Household soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.householdsService.remove(id, userId);
  }
}
