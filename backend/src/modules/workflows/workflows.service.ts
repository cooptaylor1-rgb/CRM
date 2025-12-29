import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { WorkflowTemplate, WorkflowInstance, WorkflowTrigger, WorkflowStatus, WorkflowStep } from './entities/workflow.entity';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  StartWorkflowDto,
  CompleteStepDto,
  WorkflowFilterDto,
} from './dto/workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(WorkflowTemplate)
    private templateRepository: Repository<WorkflowTemplate>,
    @InjectRepository(WorkflowInstance)
    private instanceRepository: Repository<WorkflowInstance>,
  ) {}

  // ==================== Templates ====================

  async createTemplate(dto: CreateWorkflowTemplateDto, userId: string): Promise<WorkflowTemplate> {
    // Validate steps have unique IDs
    const stepIds = dto.steps.map(s => s.id);
    if (new Set(stepIds).size !== stepIds.length) {
      throw new BadRequestException('Step IDs must be unique');
    }

    const template = this.templateRepository.create({
      ...dto,
      createdBy: userId,
    });

    return this.templateRepository.save(template);
  }

  async getAllTemplates(filter: WorkflowFilterDto): Promise<WorkflowTemplate[]> {
    const where: any = {};

    if (filter.trigger) where.trigger = filter.trigger;
    if (filter.status) where.status = filter.status;
    if (filter.search) where.name = Like(`%${filter.search}%`);

    return this.templateRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async getTemplate(id: string): Promise<WorkflowTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Workflow template with ID ${id} not found`);
    }
    return template;
  }

  async updateTemplate(id: string, dto: UpdateWorkflowTemplateDto): Promise<WorkflowTemplate> {
    const template = await this.getTemplate(id);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.getTemplate(id);
    await this.templateRepository.softRemove(template);
  }

  async activateTemplate(id: string): Promise<WorkflowTemplate> {
    const template = await this.getTemplate(id);
    template.status = WorkflowStatus.ACTIVE;
    return this.templateRepository.save(template);
  }

  async deactivateTemplate(id: string): Promise<WorkflowTemplate> {
    const template = await this.getTemplate(id);
    template.status = WorkflowStatus.INACTIVE;
    return this.templateRepository.save(template);
  }

  // ==================== Built-in Templates ====================

  async seedDefaultTemplates(userId: string): Promise<WorkflowTemplate[]> {
    const defaultTemplates: CreateWorkflowTemplateDto[] = [
      {
        name: 'New Client Onboarding',
        description: 'Standard workflow for onboarding new wealth management clients',
        trigger: WorkflowTrigger.NEW_CLIENT_ONBOARDING,
        estimatedDurationDays: 30,
        tags: ['onboarding', 'new-client'],
        isDefault: true,
        steps: [
          {
            id: 'welcome-call',
            name: 'Schedule Welcome Call',
            type: 'task',
            order: 1,
            config: {
              taskTitle: 'Schedule welcome call with new client',
              taskCategory: 'client_onboarding',
              taskPriority: 'high',
              assignTo: 'advisor',
              dueDaysFromStart: 1,
            },
          },
          {
            id: 'collect-docs',
            name: 'Collect Required Documents',
            type: 'task',
            order: 2,
            config: {
              taskTitle: 'Request and collect onboarding documents',
              taskDescription: 'ID verification, account applications, IPS signature',
              taskCategory: 'document_request',
              taskPriority: 'high',
              assignTo: 'operations',
              dueDaysFromStart: 3,
            },
            dependsOn: ['welcome-call'],
          },
          {
            id: 'kyc-verification',
            name: 'Complete KYC Verification',
            type: 'task',
            order: 3,
            config: {
              taskTitle: 'Complete KYC/AML verification',
              taskCategory: 'kyc_verification',
              taskPriority: 'high',
              assignTo: 'compliance',
              dueDaysFromStart: 7,
            },
            dependsOn: ['collect-docs'],
          },
          {
            id: 'open-accounts',
            name: 'Open Investment Accounts',
            type: 'task',
            order: 4,
            config: {
              taskTitle: 'Submit account opening paperwork to custodian',
              taskCategory: 'client_onboarding',
              taskPriority: 'medium',
              assignTo: 'operations',
              dueDaysFromStart: 10,
            },
            dependsOn: ['kyc-verification'],
          },
          {
            id: 'fund-accounts',
            name: 'Initiate Asset Transfer',
            type: 'task',
            order: 5,
            config: {
              taskTitle: 'Initiate ACAT transfer or wire instructions',
              taskCategory: 'client_onboarding',
              taskPriority: 'medium',
              assignTo: 'operations',
              dueDaysFromStart: 14,
            },
            dependsOn: ['open-accounts'],
          },
          {
            id: 'initial-investment',
            name: 'Implement Investment Strategy',
            type: 'task',
            order: 6,
            config: {
              taskTitle: 'Execute initial portfolio investment per IPS',
              taskCategory: 'trading',
              taskPriority: 'high',
              assignTo: 'advisor',
              dueDaysFromStart: 21,
            },
            dependsOn: ['fund-accounts'],
          },
          {
            id: 'welcome-meeting',
            name: 'Schedule 30-Day Check-In',
            type: 'meeting',
            order: 7,
            config: {
              meetingType: 'initial_consultation',
              meetingTitle: '30-Day Onboarding Review',
              meetingDuration: 60,
            },
            dependsOn: ['initial-investment'],
          },
        ],
      },
      {
        name: 'Annual Review Preparation',
        description: 'Workflow to prepare for annual client review meetings',
        trigger: WorkflowTrigger.ANNUAL_REVIEW_DUE,
        estimatedDurationDays: 14,
        tags: ['review', 'annual'],
        isDefault: true,
        steps: [
          {
            id: 'gather-data',
            name: 'Gather Performance Data',
            type: 'task',
            order: 1,
            config: {
              taskTitle: 'Compile annual performance report',
              taskCategory: 'annual_review',
              taskPriority: 'medium',
              assignTo: 'operations',
              dueDaysFromStart: 1,
            },
          },
          {
            id: 'update-planning',
            name: 'Update Financial Plan',
            type: 'task',
            order: 2,
            config: {
              taskTitle: 'Update financial planning projections',
              taskCategory: 'annual_review',
              taskPriority: 'medium',
              assignTo: 'advisor',
              dueDaysFromStart: 5,
            },
            dependsOn: ['gather-data'],
          },
          {
            id: 'review-ips',
            name: 'Review IPS',
            type: 'task',
            order: 3,
            config: {
              taskTitle: 'Review Investment Policy Statement for updates',
              taskCategory: 'annual_review',
              taskPriority: 'medium',
              assignTo: 'advisor',
              dueDaysFromStart: 7,
            },
            dependsOn: ['gather-data'],
          },
          {
            id: 'prepare-presentation',
            name: 'Prepare Meeting Materials',
            type: 'task',
            order: 4,
            config: {
              taskTitle: 'Prepare annual review presentation',
              taskCategory: 'meeting_prep',
              taskPriority: 'high',
              assignTo: 'advisor',
              dueDaysFromStart: 10,
            },
            dependsOn: ['update-planning', 'review-ips'],
          },
          {
            id: 'schedule-meeting',
            name: 'Schedule Annual Review Meeting',
            type: 'meeting',
            order: 5,
            config: {
              meetingType: 'annual_review',
              meetingTitle: 'Annual Portfolio Review',
              meetingDuration: 90,
            },
            dependsOn: ['prepare-presentation'],
          },
        ],
      },
      {
        name: 'KYC Renewal',
        description: 'Workflow for renewing client KYC verification',
        trigger: WorkflowTrigger.KYC_EXPIRING,
        estimatedDurationDays: 21,
        tags: ['compliance', 'kyc'],
        isDefault: true,
        steps: [
          {
            id: 'notify-client',
            name: 'Notify Client',
            type: 'email',
            order: 1,
            config: {
              emailTemplate: 'kyc_renewal_request',
              emailRecipient: 'client',
            },
          },
          {
            id: 'collect-updated-docs',
            name: 'Collect Updated Documents',
            type: 'task',
            order: 2,
            config: {
              taskTitle: 'Collect updated KYC documentation',
              taskCategory: 'kyc_verification',
              taskPriority: 'high',
              assignTo: 'operations',
              dueDaysFromStart: 7,
            },
            dependsOn: ['notify-client'],
          },
          {
            id: 'run-screening',
            name: 'Run AML Screening',
            type: 'task',
            order: 3,
            config: {
              taskTitle: 'Run updated sanctions and PEP screening',
              taskCategory: 'compliance',
              taskPriority: 'high',
              assignTo: 'compliance',
              dueDaysFromStart: 14,
            },
            dependsOn: ['collect-updated-docs'],
          },
          {
            id: 'compliance-review',
            name: 'Compliance Review',
            type: 'task',
            order: 4,
            config: {
              taskTitle: 'Review and approve KYC renewal',
              taskCategory: 'compliance',
              taskPriority: 'high',
              assignTo: 'compliance',
              dueDaysFromStart: 18,
            },
            dependsOn: ['run-screening'],
          },
        ],
      },
    ];

    const created: WorkflowTemplate[] = [];
    for (const dto of defaultTemplates) {
      const existing = await this.templateRepository.findOne({
        where: { name: dto.name, isDefault: true },
      });
      if (!existing) {
        const template = await this.createTemplate(dto, userId);
        template.status = WorkflowStatus.ACTIVE;
        created.push(await this.templateRepository.save(template));
      }
    }

    return created;
  }

  // ==================== Instances ====================

  async startWorkflow(dto: StartWorkflowDto, userId: string): Promise<WorkflowInstance> {
    const template = await this.getTemplate(dto.templateId);

    if (template.status !== WorkflowStatus.ACTIVE) {
      throw new BadRequestException('Cannot start workflow from inactive template');
    }

    const stepStatuses: Record<string, any> = {};
    for (const step of template.steps) {
      stepStatuses[step.id] = { status: 'pending' };
    }

    const instance = this.instanceRepository.create({
      templateId: dto.templateId,
      householdId: dto.householdId,
      personId: dto.personId,
      prospectId: dto.prospectId,
      accountId: dto.accountId,
      status: 'running',
      startedAt: new Date(),
      currentStep: 0,
      stepStatuses,
      triggeredBy: userId,
      triggerData: dto.triggerData,
    });

    const saved = await this.instanceRepository.save(instance);

    // Start first step(s) that have no dependencies
    await this.advanceWorkflow(saved.id);

    return this.getInstance(saved.id);
  }

  async getInstance(id: string): Promise<WorkflowInstance> {
    const instance = await this.instanceRepository.findOne({ where: { id } });
    if (!instance) {
      throw new NotFoundException(`Workflow instance with ID ${id} not found`);
    }
    return instance;
  }

  async getInstancesByHousehold(householdId: string): Promise<WorkflowInstance[]> {
    return this.instanceRepository.find({
      where: { householdId },
      order: { startedAt: 'DESC' },
    });
  }

  async getActiveInstances(): Promise<WorkflowInstance[]> {
    return this.instanceRepository.find({
      where: { status: 'running' },
      order: { startedAt: 'DESC' },
    });
  }

  async completeStep(instanceId: string, dto: CompleteStepDto, userId: string): Promise<WorkflowInstance> {
    const instance = await this.getInstance(instanceId);
    
    if (instance.status !== 'running') {
      throw new BadRequestException('Workflow is not running');
    }

    if (!instance.stepStatuses[dto.stepId]) {
      throw new BadRequestException(`Step ${dto.stepId} not found in workflow`);
    }

    instance.stepStatuses[dto.stepId] = {
      ...instance.stepStatuses[dto.stepId],
      status: 'completed',
      completedAt: new Date().toISOString(),
      notes: dto.notes,
    };

    await this.instanceRepository.save(instance);

    // Advance workflow to next steps
    await this.advanceWorkflow(instanceId);

    return this.getInstance(instanceId);
  }

  async advanceWorkflow(instanceId: string): Promise<void> {
    const instance = await this.getInstance(instanceId);
    const template = await this.getTemplate(instance.templateId);

    // Find steps that can be started
    for (const step of template.steps) {
      const stepStatus = instance.stepStatuses[step.id];
      
      if (stepStatus.status !== 'pending') continue;

      // Check if dependencies are met
      const dependenciesMet = !step.dependsOn || 
        step.dependsOn.every(depId => 
          instance.stepStatuses[depId]?.status === 'completed'
        );

      if (dependenciesMet) {
        instance.stepStatuses[step.id] = {
          status: 'in_progress',
          startedAt: new Date().toISOString(),
        };

        // Here you would create the actual task/meeting/notification
        // This would integrate with TasksService, MeetingsService, etc.
      }
    }

    // Check if all steps are completed
    const allCompleted = Object.values(instance.stepStatuses)
      .every((s: any) => s.status === 'completed' || s.status === 'skipped');

    if (allCompleted) {
      instance.status = 'completed';
      instance.completedAt = new Date();
    }

    await this.instanceRepository.save(instance);
  }

  async cancelWorkflow(instanceId: string, reason?: string): Promise<WorkflowInstance> {
    const instance = await this.getInstance(instanceId);
    instance.status = 'cancelled';
    instance.metadata = { ...instance.metadata, cancellationReason: reason };
    return this.instanceRepository.save(instance);
  }

  async getWorkflowStats(): Promise<{
    totalActive: number;
    byTemplate: Record<string, number>;
    completedThisMonth: number;
    averageCompletionDays: number;
  }> {
    const active = await this.instanceRepository.count({ where: { status: 'running' } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const completed = await this.instanceRepository.find({
      where: { status: 'completed' },
    });

    const completedThisMonth = completed.filter(
      w => w.completedAt && w.completedAt >= startOfMonth
    ).length;

    let totalDays = 0;
    let completedWithDuration = 0;
    for (const workflow of completed) {
      if (workflow.completedAt && workflow.startedAt) {
        const days = Math.ceil(
          (workflow.completedAt.getTime() - workflow.startedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += days;
        completedWithDuration++;
      }
    }

    const byTemplate: Record<string, number> = {};
    const activeInstances = await this.instanceRepository.find({ where: { status: 'running' } });
    for (const instance of activeInstances) {
      byTemplate[instance.templateId] = (byTemplate[instance.templateId] || 0) + 1;
    }

    return {
      totalActive: active,
      byTemplate,
      completedThisMonth,
      averageCompletionDays: completedWithDuration > 0 ? Math.round(totalDays / completedWithDuration) : 0,
    };
  }
}
