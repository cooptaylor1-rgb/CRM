import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, In } from 'typeorm';
import { Meeting, MeetingNotes, MeetingStatus, MeetingType } from './entities/meeting.entity';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  CreateMeetingNotesDto,
  UpdateMeetingNotesDto,
  GenerateAiSummaryDto,
  MeetingFilterDto,
} from './dto/meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
    @InjectRepository(MeetingNotes)
    private notesRepository: Repository<MeetingNotes>,
  ) {}

  // ==================== Meetings ====================

  async createMeeting(dto: CreateMeetingDto, userId: string): Promise<Meeting> {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    const meeting = this.meetingRepository.create({
      ...dto,
      startTime,
      endTime,
      durationMinutes,
      createdBy: userId,
    });

    return this.meetingRepository.save(meeting);
  }

  async findAllMeetings(filter: MeetingFilterDto): Promise<Meeting[]> {
    const where: any = {};

    if (filter.householdId) where.householdId = filter.householdId;
    if (filter.advisorId) where.advisorId = filter.advisorId;
    if (filter.status) where.status = filter.status;
    if (filter.meetingType) where.meetingType = filter.meetingType;

    if (filter.startDate && filter.endDate) {
      where.startTime = Between(new Date(filter.startDate), new Date(filter.endDate));
    } else if (filter.startDate) {
      where.startTime = MoreThan(new Date(filter.startDate));
    } else if (filter.endDate) {
      where.startTime = LessThan(new Date(filter.endDate));
    }

    return this.meetingRepository.find({
      where,
      order: { startTime: 'ASC' },
    });
  }

  async getMeeting(id: string): Promise<Meeting> {
    const meeting = await this.meetingRepository.findOne({ where: { id } });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }
    return meeting;
  }

  async updateMeeting(id: string, dto: UpdateMeetingDto): Promise<Meeting> {
    const meeting = await this.getMeeting(id);
    
    Object.assign(meeting, dto);
    
    if (dto.startTime) meeting.startTime = new Date(dto.startTime);
    if (dto.endTime) meeting.endTime = new Date(dto.endTime);
    
    if (dto.startTime || dto.endTime) {
      meeting.durationMinutes = Math.round(
        (meeting.endTime.getTime() - meeting.startTime.getTime()) / (1000 * 60)
      );
    }

    return this.meetingRepository.save(meeting);
  }

  async cancelMeeting(id: string, reason?: string): Promise<Meeting> {
    const meeting = await this.getMeeting(id);
    meeting.status = MeetingStatus.CANCELLED;
    if (reason) {
      meeting.metadata = { ...meeting.metadata, cancellationReason: reason };
    }
    return this.meetingRepository.save(meeting);
  }

  async completeMeeting(id: string): Promise<Meeting> {
    const meeting = await this.getMeeting(id);
    meeting.status = MeetingStatus.COMPLETED;
    return this.meetingRepository.save(meeting);
  }

  async deleteMeeting(id: string): Promise<void> {
    const meeting = await this.getMeeting(id);
    await this.meetingRepository.softRemove(meeting);
  }

  async getUpcomingMeetings(advisorId: string, days: number = 7): Promise<Meeting[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.meetingRepository.find({
      where: {
        advisorId,
        startTime: Between(new Date(), futureDate),
        status: In([MeetingStatus.SCHEDULED, MeetingStatus.CONFIRMED]),
      },
      order: { startTime: 'ASC' },
    });
  }

  async getTodaysMeetings(advisorId: string): Promise<Meeting[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.meetingRepository.find({
      where: {
        advisorId,
        startTime: Between(today, tomorrow),
      },
      order: { startTime: 'ASC' },
    });
  }

  async getMeetingsByHousehold(householdId: string): Promise<Meeting[]> {
    return this.meetingRepository.find({
      where: { householdId },
      order: { startTime: 'DESC' },
    });
  }

  // ==================== Meeting Notes ====================

  async createNotes(dto: CreateMeetingNotesDto, userId: string): Promise<MeetingNotes> {
    const notes = this.notesRepository.create({
      ...dto,
      nextMeetingDate: dto.nextMeetingDate ? new Date(dto.nextMeetingDate) : undefined,
      createdBy: userId,
    });

    return this.notesRepository.save(notes);
  }

  async getNotesByMeeting(meetingId: string): Promise<MeetingNotes> {
    const notes = await this.notesRepository.findOne({ where: { meetingId } });
    if (!notes) {
      throw new NotFoundException(`Notes for meeting ${meetingId} not found`);
    }
    return notes;
  }

  async updateNotes(meetingId: string, dto: UpdateMeetingNotesDto, userId: string): Promise<MeetingNotes> {
    let notes = await this.notesRepository.findOne({ where: { meetingId } });
    
    if (!notes) {
      notes = this.notesRepository.create({ meetingId, createdBy: userId });
    }

    Object.assign(notes, {
      ...dto,
      nextMeetingDate: dto.nextMeetingDate ? new Date(dto.nextMeetingDate) : notes.nextMeetingDate,
      manuallyEdited: true,
      updatedBy: userId,
    });

    return this.notesRepository.save(notes);
  }

  // ==================== AI Integration ====================

  async generateAiSummary(meetingId: string, dto: GenerateAiSummaryDto, userId: string): Promise<MeetingNotes> {
    let notes = await this.notesRepository.findOne({ where: { meetingId } });
    
    if (!notes) {
      notes = this.notesRepository.create({ meetingId, createdBy: userId });
    }

    notes.rawNotes = dto.rawNotes;
    if (dto.transcript) notes.transcript = dto.transcript;

    // AI-generated content simulation
    // In production, this would integrate with OpenAI, Claude, or similar
    const aiSummary = this.simulateAiSummary(dto);

    notes.aiSummary = aiSummary.summary;
    notes.keyPoints = aiSummary.keyPoints;
    notes.actionItems = aiSummary.actionItems;
    notes.decisionsMade = aiSummary.decisions;
    notes.followUpTopics = aiSummary.followUpTopics;
    notes.clientConcerns = aiSummary.clientConcerns;
    notes.clientSentiment = aiSummary.sentiment;
    notes.complianceItems = aiSummary.complianceItems;
    notes.requiresDocumentation = aiSummary.requiresDocumentation;
    notes.aiGeneratedAt = new Date();
    notes.updatedBy = userId;

    return this.notesRepository.save(notes);
  }

  private simulateAiSummary(dto: GenerateAiSummaryDto): {
    summary: string;
    keyPoints: string[];
    actionItems: any[];
    decisions: any[];
    followUpTopics: string[];
    clientConcerns: string[];
    sentiment: string;
    complianceItems: any[];
    requiresDocumentation: boolean;
  } {
    // This is a simulation - in production, integrate with an AI provider
    const notes = dto.rawNotes.toLowerCase();
    
    const keyPoints: string[] = [];
    const actionItems: any[] = [];
    const decisions: any[] = [];
    const followUpTopics: string[] = [];
    const clientConcerns: string[] = [];
    const complianceItems: any[] = [];

    // Simple keyword extraction simulation
    if (notes.includes('portfolio') || notes.includes('investment')) {
      keyPoints.push('Discussed portfolio performance and investment strategy');
    }
    if (notes.includes('retire') || notes.includes('retirement')) {
      keyPoints.push('Reviewed retirement planning progress');
    }
    if (notes.includes('tax')) {
      keyPoints.push('Discussed tax planning strategies');
      complianceItems.push({ item: 'Tax planning discussion documented', action: 'Review with tax advisor' });
    }
    if (notes.includes('estate') || notes.includes('trust')) {
      keyPoints.push('Discussed estate planning considerations');
    }
    if (notes.includes('concern') || notes.includes('worried')) {
      clientConcerns.push('Client expressed concerns - review and address');
    }
    if (notes.includes('rebalance')) {
      actionItems.push({
        description: 'Review portfolio for rebalancing',
        priority: 'high',
      });
    }
    if (notes.includes('follow up') || notes.includes('next step')) {
      followUpTopics.push('Schedule follow-up meeting to review progress');
    }

    // Default items if nothing extracted
    if (keyPoints.length === 0) {
      keyPoints.push('General client review meeting conducted');
    }

    return {
      summary: `Meeting notes summarized. ${keyPoints.length} key points identified, ${actionItems.length} action items created.`,
      keyPoints,
      actionItems,
      decisions,
      followUpTopics,
      clientConcerns,
      sentiment: clientConcerns.length > 0 ? 'concerned' : 'positive',
      complianceItems,
      requiresDocumentation: complianceItems.length > 0,
    };
  }

  async convertActionItemsToTasks(meetingId: string): Promise<{ created: number; taskIds: string[] }> {
    const notes = await this.getNotesByMeeting(meetingId);
    
    if (!notes.actionItems || notes.actionItems.length === 0) {
      return { created: 0, taskIds: [] };
    }

    // This would integrate with the TasksService to create actual tasks
    // For now, just return a simulation
    const taskIds = notes.actionItems.map(() => 
      `task-${Math.random().toString(36).substring(7)}`
    );

    // Update notes with task IDs
    notes.actionItems = notes.actionItems.map((item, index) => ({
      ...item,
      taskId: taskIds[index],
    }));

    await this.notesRepository.save(notes);

    return { created: notes.actionItems.length, taskIds };
  }

  // ==================== Statistics ====================

  async getMeetingStats(advisorId: string, startDate: Date, endDate: Date): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    byType: Record<string, number>;
    averageDuration: number;
    totalMinutes: number;
  }> {
    const meetings = await this.meetingRepository.find({
      where: {
        advisorId,
        startTime: Between(startDate, endDate),
      },
    });

    const byType: Record<string, number> = {};
    let totalMinutes = 0;
    let completedCount = 0;

    for (const meeting of meetings) {
      byType[meeting.meetingType] = (byType[meeting.meetingType] || 0) + 1;
      if (meeting.status === MeetingStatus.COMPLETED) {
        totalMinutes += meeting.durationMinutes;
        completedCount++;
      }
    }

    return {
      total: meetings.length,
      completed: meetings.filter(m => m.status === MeetingStatus.COMPLETED).length,
      cancelled: meetings.filter(m => m.status === MeetingStatus.CANCELLED).length,
      byType,
      averageDuration: completedCount > 0 ? Math.round(totalMinutes / completedCount) : 0,
      totalMinutes,
    };
  }
}
