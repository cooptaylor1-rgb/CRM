import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between, IsNull, Not } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      createdBy: userId,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      reminderAt: createTaskDto.reminderAt ? new Date(createTaskDto.reminderAt) : undefined,
    });
    return this.taskRepository.save(task);
  }

  async findAll(filter: TaskFilterDto): Promise<Task[]> {
    const where: any = {};

    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.category) where.category = filter.category;
    if (filter.assignedTo) where.assignedTo = filter.assignedTo;
    if (filter.householdId) where.householdId = filter.householdId;

    if (filter.dueBefore && filter.dueAfter) {
      where.dueDate = Between(new Date(filter.dueAfter), new Date(filter.dueBefore));
    } else if (filter.dueBefore) {
      where.dueDate = LessThan(new Date(filter.dueBefore));
    } else if (filter.dueAfter) {
      where.dueDate = MoreThan(new Date(filter.dueAfter));
    }

    if (filter.overdue) {
      where.dueDate = LessThan(new Date());
      where.status = Not(TaskStatus.COMPLETED);
    }

    return this.taskRepository.find({
      where,
      order: { dueDate: 'ASC', priority: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async findByUser(userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { assignedTo: userId },
      order: { dueDate: 'ASC', priority: 'DESC' },
    });
  }

  async findByHousehold(householdId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { householdId },
      order: { dueDate: 'ASC', priority: 'DESC' },
    });
  }

  async findSubtasks(parentTaskId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { parentTaskId },
      order: { order: 'ASC' },
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.findOne(id);
    
    Object.assign(task, {
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : task.dueDate,
      reminderAt: updateTaskDto.reminderAt ? new Date(updateTaskDto.reminderAt) : task.reminderAt,
    });

    // If completing task, record completion info
    if (updateTaskDto.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      task.completedAt = new Date();
      task.completedBy = userId;
    }

    return this.taskRepository.save(task);
  }

  async complete(id: string, userId: string, actualMinutes?: number): Promise<Task> {
    const task = await this.findOne(id);
    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    task.completedBy = userId;
    if (actualMinutes) task.actualMinutes = actualMinutes;
    return this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.softRemove(task);
  }

  async getOverdueTasks(): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        dueDate: LessThan(new Date()),
        status: Not(TaskStatus.COMPLETED),
        deletedAt: IsNull(),
      },
      order: { dueDate: 'ASC' },
    });
  }

  async getTasksDueSoon(days: number = 7): Promise<Task[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.taskRepository.find({
      where: {
        dueDate: Between(new Date(), futureDate),
        status: Not(TaskStatus.COMPLETED),
        deletedAt: IsNull(),
      },
      order: { dueDate: 'ASC' },
    });
  }

  async getTaskStats(userId?: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }> {
    const where: any = userId ? { assignedTo: userId } : {};

    const [total, pending, inProgress, completed] = await Promise.all([
      this.taskRepository.count({ where }),
      this.taskRepository.count({ where: { ...where, status: TaskStatus.PENDING } }),
      this.taskRepository.count({ where: { ...where, status: TaskStatus.IN_PROGRESS } }),
      this.taskRepository.count({ where: { ...where, status: TaskStatus.COMPLETED } }),
    ]);

    const overdue = await this.taskRepository.count({
      where: {
        ...where,
        dueDate: LessThan(new Date()),
        status: Not(TaskStatus.COMPLETED),
      },
    });

    return { total, pending, inProgress, completed, overdue };
  }

  // Bulk operations for workflow automation
  async createBulk(tasks: CreateTaskDto[], userId: string): Promise<Task[]> {
    const taskEntities = tasks.map((dto) =>
      this.taskRepository.create({
        ...dto,
        createdBy: userId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      }),
    );
    return this.taskRepository.save(taskEntities);
  }
}
