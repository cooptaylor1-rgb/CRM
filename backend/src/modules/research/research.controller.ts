import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { ResearchService } from './research.service';
import { ResearchProcessorService } from './research-processor.service';
import {
  ResearchFilters,
  CreateAnnotationDto,
  TrackActionDto,
  UpdateTagsDto,
} from './dto/research.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RESEARCH_QUEUE } from './research.module';

// Minimal request shape carrying user context from JWT
interface AuthenticatedRequest {
  user: { sub: string; email: string };
}

@ApiTags('Research')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('api/research')
export class ResearchController {
  private readonly logger = new Logger(ResearchController.name);

  constructor(
    private readonly researchService: ResearchService,
    private readonly processorService: ResearchProcessorService,
    @InjectQueue(RESEARCH_QUEUE) private readonly researchQueue: Queue,
  ) {}

  // ---------------------------------------------------------------------------
  // GET /api/research
  // List research items with filters, pagination, and optional full-text search
  // ---------------------------------------------------------------------------
  @Get()
  @ApiOperation({ summary: 'List research items with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sourceType', required: false })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'securityId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query() filters: ResearchFilters) {
    return this.researchService.findAll(filters);
  }

  // ---------------------------------------------------------------------------
  // GET /api/research/search?q=...
  // Dedicated full-text search endpoint via Supabase RPC
  // ---------------------------------------------------------------------------
  @Get('search')
  @ApiOperation({ summary: 'Full-text search across research items' })
  async search(
    @Query('q') query: string,
    @Query() filters: ResearchFilters,
  ) {
    return this.researchService.search(query, filters);
  }

  // ---------------------------------------------------------------------------
  // GET /api/research/feed
  // Personalized feed based on user’s assigned securities and households
  // ---------------------------------------------------------------------------
  @Get('feed')
  @ApiOperation({ summary: 'Personalized research feed for the authenticated user' })
  async getFeed(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.researchService.getResearchFeed(req.user.sub, Number(page), Number(limit));
  }

  // ---------------------------------------------------------------------------
  // GET /api/research/stats
  // Dashboard statistics
  // ---------------------------------------------------------------------------
  @Get('stats')
  @ApiOperation({ summary: 'Research dashboard statistics' })
  async getStats() {
    return this.researchService.getResearchStats();
  }

  // ---------------------------------------------------------------------------
  // GET /api/research/:id
  // Single research item detail with all relations
  // ---------------------------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get a single research item by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.researchService.findOne(id);
  }

  // ---------------------------------------------------------------------------
  // POST /api/research/:id/annotations
  // Add an annotation / comment on a research item
  // ---------------------------------------------------------------------------
  @Post(':id/annotations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an annotation to a research item' })
  async addAnnotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAnnotationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.researchService.addAnnotation(id, req.user.sub, dto);
  }

  // ---------------------------------------------------------------------------
  // POST /api/research/:id/actions
  // Track user interaction (read, bookmark, share, acted_on, dismissed)
  // ---------------------------------------------------------------------------
  @Post(':id/actions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track a user action on a research item' })
  async trackAction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TrackActionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.researchService.trackAction(id, req.user.sub, dto);
  }

  // ---------------------------------------------------------------------------
  // PUT /api/research/:id/tags
  // Replace all tags on a research item
  // ---------------------------------------------------------------------------
  @Put(':id/tags')
  @ApiOperation({ summary: 'Update tags for a research item' })
  async updateTags(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagsDto,
  ) {
    return this.researchService.updateTags(id, dto);
  }

  // ---------------------------------------------------------------------------
  // POST /api/research/ingest/email
  // NestJS-hosted alternative webhook endpoint for Postmark inbound emails
  // Accepts the same Postmark payload format as the Edge Function
  // ---------------------------------------------------------------------------
  @Post('ingest/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Postmark inbound email webhook (NestJS-hosted alternative)',
  })
  async ingestEmail(
    @Body() payload: Record<string, unknown>,
    @Request() req: { headers: Record<string, string> },
  ) {
    this.logger.log(`Received Postmark inbound webhook: ${payload['MessageID'] ?? 'unknown'}`);

    // Enqueue for async processing — return quickly to Postmark
    const job = await this.researchQueue.add(
      'ingest-email',
      { payload },
      { priority: 1 },
    );

    return { queued: true, jobId: job.id };
  }
}
