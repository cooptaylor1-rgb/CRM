import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AllocationsService } from './allocations.service';
import {
  CreateTargetAllocationDto,
  UpdateTargetAllocationDto,
  GetAllocationsQueryDto,
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
  GetFeeSchedulesQueryDto,
  CalculateFeeDto,
  RecordFeeHistoryDto,
} from './allocations.dto';
import { AllocationEntityType } from './entities/allocation.entity';

interface JwtUser {
  id: string;
  email: string;
  firmId: string;
  role: string;
}

@Controller('allocations')
@UseGuards(JwtAuthGuard)
export class AllocationsController {
  constructor(private readonly allocationsService: AllocationsService) {}

  // ==================== Target Asset Allocations ====================

  @Post('target')
  async createAllocation(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateTargetAllocationDto
  ) {
    const allocation = await this.allocationsService.createAllocation(
      user.firmId,
      user.id,
      dto
    );
    return { success: true, allocation };
  }

  @Get('target')
  async getAllocations(
    @CurrentUser() user: JwtUser,
    @Query() query: GetAllocationsQueryDto
  ) {
    return this.allocationsService.getAllocations(user.firmId, query);
  }

  @Get('target/:id')
  async getAllocation(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string
  ) {
    const allocation = await this.allocationsService.getAllocation(
      id,
      user.firmId
    );
    return allocation;
  }

  @Put('target/:id')
  async updateAllocation(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateTargetAllocationDto
  ) {
    const allocation = await this.allocationsService.updateAllocation(
      id,
      user.firmId,
      dto
    );
    return { success: true, allocation };
  }

  @Delete('target/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllocation(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string
  ) {
    await this.allocationsService.deleteAllocation(id, user.firmId);
  }

  // Entity-specific allocation endpoints
  @Get('households/:householdId/target')
  async getHouseholdAllocation(
    @CurrentUser() user: JwtUser,
    @Param('householdId') householdId: string
  ) {
    const allocation = await this.allocationsService.getEntityAllocation(
      AllocationEntityType.HOUSEHOLD,
      householdId,
      user.firmId
    );
    return allocation || { allocation: null };
  }

  @Get('accounts/:accountId/target')
  async getAccountAllocation(
    @CurrentUser() user: JwtUser,
    @Param('accountId') accountId: string
  ) {
    const allocation = await this.allocationsService.getEntityAllocation(
      AllocationEntityType.ACCOUNT,
      accountId,
      user.firmId
    );
    return allocation || { allocation: null };
  }

  @Get('persons/:personId/target')
  async getPersonAllocation(
    @CurrentUser() user: JwtUser,
    @Param('personId') personId: string
  ) {
    const allocation = await this.allocationsService.getEntityAllocation(
      AllocationEntityType.PERSON,
      personId,
      user.firmId
    );
    return allocation || { allocation: null };
  }

  // ==================== Fee Schedules ====================

  @Post('fees')
  async createFeeSchedule(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateFeeScheduleDto
  ) {
    const feeSchedule = await this.allocationsService.createFeeSchedule(
      user.firmId,
      user.id,
      dto
    );
    return { success: true, feeSchedule };
  }

  @Get('fees')
  async getFeeSchedules(
    @CurrentUser() user: JwtUser,
    @Query() query: GetFeeSchedulesQueryDto
  ) {
    return this.allocationsService.getFeeSchedules(user.firmId, query);
  }

  @Get('fees/:id')
  async getFeeSchedule(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string
  ) {
    const feeSchedule = await this.allocationsService.getFeeSchedule(
      id,
      user.firmId
    );
    return feeSchedule;
  }

  @Put('fees/:id')
  async updateFeeSchedule(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateFeeScheduleDto
  ) {
    const feeSchedule = await this.allocationsService.updateFeeSchedule(
      id,
      user.firmId,
      dto
    );
    return { success: true, feeSchedule };
  }

  @Delete('fees/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFeeSchedule(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string
  ) {
    await this.allocationsService.deleteFeeSchedule(id, user.firmId);
  }

  // Entity-specific fee schedule endpoints
  @Get('households/:householdId/fees')
  async getHouseholdFeeSchedule(
    @CurrentUser() user: JwtUser,
    @Param('householdId') householdId: string
  ) {
    const feeSchedule = await this.allocationsService.getEntityFeeSchedule(
      AllocationEntityType.HOUSEHOLD,
      householdId,
      user.firmId
    );
    return feeSchedule || { feeSchedule: null };
  }

  @Get('accounts/:accountId/fees')
  async getAccountFeeSchedule(
    @CurrentUser() user: JwtUser,
    @Param('accountId') accountId: string
  ) {
    const feeSchedule = await this.allocationsService.getEntityFeeSchedule(
      AllocationEntityType.ACCOUNT,
      accountId,
      user.firmId
    );
    return feeSchedule || { feeSchedule: null };
  }

  @Get('persons/:personId/fees')
  async getPersonFeeSchedule(
    @CurrentUser() user: JwtUser,
    @Param('personId') personId: string
  ) {
    const feeSchedule = await this.allocationsService.getEntityFeeSchedule(
      AllocationEntityType.PERSON,
      personId,
      user.firmId
    );
    return feeSchedule || { feeSchedule: null };
  }

  // ==================== Fee Calculation ====================

  @Post('fees/calculate')
  async calculateFee(
    @CurrentUser() user: JwtUser,
    @Body() dto: CalculateFeeDto
  ) {
    const result = await this.allocationsService.calculateFee(dto, user.firmId);
    return result;
  }

  // ==================== Fee History ====================

  @Post('fees/history')
  async recordFeeHistory(
    @CurrentUser() user: JwtUser,
    @Body() dto: RecordFeeHistoryDto
  ) {
    const history = await this.allocationsService.recordFeeHistory(
      user.firmId,
      user.id,
      dto
    );
    return { success: true, history };
  }

  @Get('households/:householdId/fees/history')
  async getHouseholdFeeHistory(
    @CurrentUser() user: JwtUser,
    @Param('householdId') householdId: string,
    @Query('limit') limit?: number
  ) {
    const history = await this.allocationsService.getFeeHistory(
      AllocationEntityType.HOUSEHOLD,
      householdId,
      user.firmId,
      limit
    );
    return { history };
  }

  @Get('accounts/:accountId/fees/history')
  async getAccountFeeHistory(
    @CurrentUser() user: JwtUser,
    @Param('accountId') accountId: string,
    @Query('limit') limit?: number
  ) {
    const history = await this.allocationsService.getFeeHistory(
      AllocationEntityType.ACCOUNT,
      accountId,
      user.firmId,
      limit
    );
    return { history };
  }

  @Get('persons/:personId/fees/history')
  async getPersonFeeHistory(
    @CurrentUser() user: JwtUser,
    @Param('personId') personId: string,
    @Query('limit') limit?: number
  ) {
    const history = await this.allocationsService.getFeeHistory(
      AllocationEntityType.PERSON,
      personId,
      user.firmId,
      limit
    );
    return { history };
  }

  @Patch('fees/history/:id/billed')
  async markFeeAsBilled(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body('invoiceNumber') invoiceNumber: string
  ) {
    const history = await this.allocationsService.markFeeAsBilled(
      id,
      invoiceNumber
    );
    return { success: true, history };
  }
}
