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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MeetingsService } from './meetings.service';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  CreateMeetingNotesDto,
  UpdateMeetingNotesDto,
  GenerateAiSummaryDto,
  MeetingFilterDto,
} from './dto/meeting.dto';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

@ApiTags('Meetings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  // ==================== Meetings ====================

  @Post()
  @ApiOperation({ summary: 'Create a new meeting' })
  async createMeeting(@Body() dto: CreateMeetingDto, @Request() req: RequestWithUser) {
    return this.meetingsService.createMeeting(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all meetings with filters' })
  async getAllMeetings(@Query() filter: MeetingFilterDto) {
    return this.meetingsService.findAllMeetings(filter);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s meetings for current user' })
  async getTodaysMeetings(@Request() req: RequestWithUser) {
    return this.meetingsService.getTodaysMeetings(req.user.id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming meetings for current user' })
  async getUpcomingMeetings(@Request() req: RequestWithUser, @Query('days') days: number = 7) {
    return this.meetingsService.getUpcomingMeetings(req.user.id, days);
  }

  @Get('household/:householdId')
  @ApiOperation({ summary: 'Get meetings for a household' })
  async getMeetingsByHousehold(@Param('householdId', ParseUUIDPipe) householdId: string) {
    return this.meetingsService.getMeetingsByHousehold(householdId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get meeting statistics' })
  async getMeetingStats(
    @Request() req: RequestWithUser,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.meetingsService.getMeetingStats(
      req.user.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific meeting' })
  async getMeeting(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.getMeeting(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a meeting' })
  async updateMeeting(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.meetingsService.updateMeeting(id, dto);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a meeting' })
  async cancelMeeting(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.meetingsService.cancelMeeting(id, reason);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Mark meeting as completed' })
  async completeMeeting(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.completeMeeting(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a meeting' })
  async deleteMeeting(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.deleteMeeting(id);
  }

  // ==================== Meeting Notes ====================

  @Post(':id/notes')
  @ApiOperation({ summary: 'Create notes for a meeting' })
  async createNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMeetingNotesDto,
    @Request() req: RequestWithUser,
  ) {
    dto.meetingId = id;
    return this.meetingsService.createNotes(dto, req.user.id);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get notes for a meeting' })
  async getNotes(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.getNotesByMeeting(id);
  }

  @Put(':id/notes')
  @ApiOperation({ summary: 'Update notes for a meeting' })
  async updateNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeetingNotesDto,
    @Request() req: RequestWithUser,
  ) {
    return this.meetingsService.updateNotes(id, dto, req.user.id);
  }

  // ==================== AI Features ====================

  @Post(':id/notes/ai-summary')
  @ApiOperation({ summary: 'Generate AI summary from meeting notes' })
  async generateAiSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateAiSummaryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.meetingsService.generateAiSummary(id, dto, req.user.id);
  }

  @Post(':id/notes/convert-to-tasks')
  @ApiOperation({ summary: 'Convert action items to tasks' })
  async convertActionItemsToTasks(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.convertActionItemsToTasks(id);
  }
}
