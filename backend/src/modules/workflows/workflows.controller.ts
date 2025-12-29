import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkflowsService } from './workflows.service';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  StartWorkflowDto,
  CompleteStepDto,
  WorkflowFilterDto,
} from './dto/workflow.dto';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

@ApiTags('Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  // ==================== Templates ====================

  @Post('templates')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Create a new workflow template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  createTemplate(@Body() dto: CreateWorkflowTemplateDto, @Request() req: RequestWithUser) {
    return this.workflowsService.createTemplate(dto, req.user.id);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all workflow templates' })
  @ApiResponse({ status: 200, description: 'List of workflow templates' })
  getAllTemplates(@Query() filter: WorkflowFilterDto) {
    return this.workflowsService.getAllTemplates(filter);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a workflow template by ID' })
  @ApiResponse({ status: 200, description: 'The workflow template' })
  getTemplate(@Param('id') id: string) {
    return this.workflowsService.getTemplate(id);
  }

  @Patch('templates/:id')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Update a workflow template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateWorkflowTemplateDto) {
    return this.workflowsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a workflow template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  deleteTemplate(@Param('id') id: string) {
    return this.workflowsService.deleteTemplate(id);
  }

  @Post('templates/:id/activate')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Activate a workflow template' })
  @ApiResponse({ status: 200, description: 'Template activated' })
  activateTemplate(@Param('id') id: string) {
    return this.workflowsService.activateTemplate(id);
  }

  @Post('templates/:id/deactivate')
  @Roles('admin', 'advisor')
  @ApiOperation({ summary: 'Deactivate a workflow template' })
  @ApiResponse({ status: 200, description: 'Template deactivated' })
  deactivateTemplate(@Param('id') id: string) {
    return this.workflowsService.deactivateTemplate(id);
  }

  @Post('templates/seed-defaults')
  @Roles('admin')
  @ApiOperation({ summary: 'Seed default workflow templates' })
  @ApiResponse({ status: 201, description: 'Default templates created' })
  seedDefaults(@Request() req: RequestWithUser) {
    return this.workflowsService.seedDefaultTemplates(req.user.id);
  }

  // ==================== Instances ====================

  @Post('instances')
  @ApiOperation({ summary: 'Start a new workflow instance' })
  @ApiResponse({ status: 201, description: 'Workflow started successfully' })
  startWorkflow(@Body() dto: StartWorkflowDto, @Request() req: RequestWithUser) {
    return this.workflowsService.startWorkflow(dto, req.user.id);
  }

  @Get('instances/active')
  @ApiOperation({ summary: 'Get all active workflow instances' })
  @ApiResponse({ status: 200, description: 'List of active workflow instances' })
  getActiveInstances() {
    return this.workflowsService.getActiveInstances();
  }

  @Get('instances/household/:householdId')
  @ApiOperation({ summary: 'Get workflow instances for a household' })
  @ApiResponse({ status: 200, description: 'List of workflow instances' })
  getByHousehold(@Param('householdId') householdId: string) {
    return this.workflowsService.getInstancesByHousehold(householdId);
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get a workflow instance by ID' })
  @ApiResponse({ status: 200, description: 'The workflow instance' })
  getInstance(@Param('id') id: string) {
    return this.workflowsService.getInstance(id);
  }

  @Post('instances/:id/complete-step')
  @ApiOperation({ summary: 'Complete a step in a workflow instance' })
  @ApiResponse({ status: 200, description: 'Step completed successfully' })
  completeStep(@Param('id') id: string, @Body() dto: CompleteStepDto, @Request() req: RequestWithUser) {
    return this.workflowsService.completeStep(id, dto, req.user.id);
  }

  @Post('instances/:id/cancel')
  @ApiOperation({ summary: 'Cancel a workflow instance' })
  @ApiResponse({ status: 200, description: 'Workflow cancelled' })
  cancelWorkflow(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.workflowsService.cancelWorkflow(id, reason);
  }

  // ==================== Analytics ====================

  @Get('stats')
  @ApiOperation({ summary: 'Get workflow statistics' })
  @ApiResponse({ status: 200, description: 'Workflow statistics' })
  getStats() {
    return this.workflowsService.getWorkflowStats();
  }
}
