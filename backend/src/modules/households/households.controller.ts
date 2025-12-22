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
  create(@Body() createHouseholdDto: CreateHouseholdDto) {
    return this.householdsService.create(createHouseholdDto);
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

  @Patch(':id')
  @Roles('admin', 'advisor', 'operations')
  @ApiOperation({ summary: 'Update a household' })
  @ApiResponse({ status: 200, description: 'Household updated successfully' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  update(@Param('id') id: string, @Body() updateHouseholdDto: UpdateHouseholdDto) {
    return this.householdsService.update(id, updateHouseholdDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a household' })
  @ApiResponse({ status: 200, description: 'Household deleted successfully' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  remove(@Param('id') id: string) {
    return this.householdsService.remove(id);
  }
}
