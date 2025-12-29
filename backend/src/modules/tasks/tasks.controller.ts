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
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto/task.dto';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req: RequestWithUser) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with optional filters' })
  async findAll(@Query() filter: TaskFilterDto) {
    return this.tasksService.findAll(filter);
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Get tasks assigned to current user' })
  async getMyTasks(@Request() req: RequestWithUser) {
    return this.tasksService.findByUser(req.user.id);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get all overdue tasks' })
  async getOverdueTasks() {
    return this.tasksService.getOverdueTasks();
  }

  @Get('due-soon')
  @ApiOperation({ summary: 'Get tasks due within specified days' })
  async getTasksDueSoon(@Query('days') days: number = 7) {
    return this.tasksService.getTasksDueSoon(days);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  async getTaskStats(@Query('userId') userId?: string) {
    return this.tasksService.getTaskStats(userId);
  }

  @Get('household/:householdId')
  @ApiOperation({ summary: 'Get tasks for a specific household' })
  async getByHousehold(@Param('householdId', ParseUUIDPipe) householdId: string) {
    return this.tasksService.findByHousehold(householdId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Get(':id/subtasks')
  @ApiOperation({ summary: 'Get subtasks of a task' })
  async getSubtasks(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findSubtasks(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: RequestWithUser,
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user.id);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Mark a task as complete' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('actualMinutes') actualMinutes: number,
    @Request() req: RequestWithUser,
  ) {
    return this.tasksService.complete(id, req.user.id, actualMinutes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @Roles('admin', 'advisor')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple tasks at once' })
  @Roles('admin', 'advisor')
  async createBulk(@Body() tasks: CreateTaskDto[], @Request() req: RequestWithUser) {
    return this.tasksService.createBulk(tasks, req.user.id);
  }
}
