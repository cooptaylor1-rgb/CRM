import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PipelineService } from './pipeline.service';
import {
  CreateProspectDto,
  UpdateProspectDto,
  ChangeStageDto,
  MarkLostDto,
  LogActivityDto,
  ProspectFilterDto,
} from './dto/prospect.dto';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

@ApiTags('Pipeline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post('prospects')
  @ApiOperation({ summary: 'Create a new prospect' })
  async createProspect(@Body() dto: CreateProspectDto, @Request() req: RequestWithUser) {
    return this.pipelineService.create(dto, req.user.id);
  }

  @Get('prospects')
  @ApiOperation({ summary: 'Get all prospects with filters' })
  async getAllProspects(@Query() filter: ProspectFilterDto) {
    return this.pipelineService.findAll(filter);
  }

  @Get('prospects/follow-ups-due')
  @ApiOperation({ summary: 'Get prospects with overdue follow-ups' })
  async getFollowUpsDue() {
    return this.pipelineService.getFollowUpsDue();
  }

  @Get('prospects/:id')
  @ApiOperation({ summary: 'Get a specific prospect' })
  async getProspect(@Param('id', ParseUUIDPipe) id: string) {
    return this.pipelineService.findOne(id);
  }

  @Put('prospects/:id')
  @ApiOperation({ summary: 'Update a prospect' })
  async updateProspect(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProspectDto,
  ) {
    return this.pipelineService.update(id, dto);
  }

  @Put('prospects/:id/stage')
  @ApiOperation({ summary: 'Change prospect stage' })
  async changeStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStageDto,
    @Request() req: RequestWithUser,
  ) {
    return this.pipelineService.changeStage(id, dto, req.user.id);
  }

  @Put('prospects/:id/lost')
  @ApiOperation({ summary: 'Mark prospect as lost' })
  async markLost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkLostDto,
    @Request() req: RequestWithUser,
  ) {
    return this.pipelineService.markLost(id, dto, req.user.id);
  }

  @Post('prospects/:id/convert')
  @ApiOperation({ summary: 'Convert prospect to client' })
  async convertToClient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('householdId') householdId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.pipelineService.convertToClient(id, householdId, req.user.id);
  }

  @Post('prospects/:id/activities')
  @ApiOperation({ summary: 'Log an activity for a prospect' })
  async logActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LogActivityDto,
    @Request() req: RequestWithUser,
  ) {
    return this.pipelineService.logActivity(id, dto, req.user.id);
  }

  @Get('prospects/:id/activities')
  @ApiOperation({ summary: 'Get all activities for a prospect' })
  async getActivities(@Param('id', ParseUUIDPipe) id: string) {
    return this.pipelineService.getActivities(id);
  }

  @Delete('prospects/:id')
  @ApiOperation({ summary: 'Delete a prospect' })
  @Roles('admin', 'advisor')
  async deleteProspect(@Param('id', ParseUUIDPipe) id: string) {
    return this.pipelineService.remove(id);
  }

  // Analytics endpoints
  @Get('stats')
  @ApiOperation({ summary: 'Get pipeline statistics' })
  async getPipelineStats() {
    return this.pipelineService.getPipelineStats();
  }

  @Get('conversion-metrics')
  @ApiOperation({ summary: 'Get conversion metrics for a date range' })
  async getConversionMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.pipelineService.getConversionMetrics(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
