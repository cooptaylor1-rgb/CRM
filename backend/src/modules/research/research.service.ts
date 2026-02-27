import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

import { ResearchItem } from './entities/research-item.entity';
import { ResearchAnnotation } from './entities/research-annotation.entity';
import {
  ResearchFilters,
  CreateAnnotationDto,
  TrackActionDto,
  UpdateTagsDto,
  ResearchItemResponse,
  ResearchFeedItem,
  ResearchStats,
  PaginatedResponse,
} from './dto/research.dto';

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);
  private readonly supabase: SupabaseClient;

  constructor(
    @InjectRepository(ResearchItem)
    private readonly researchItemRepo: Repository<ResearchItem>,
    @InjectRepository(ResearchAnnotation)
    private readonly annotationRepo: Repository<ResearchAnnotation>,
    private readonly configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
  }

  // ---------------------------------------------------------------------------
  // findAll – paginated list with optional full-text and facet filters
  // ---------------------------------------------------------------------------
  async findAll(
    filters: ResearchFilters,
  ): Promise<PaginatedResponse<ResearchItemResponse>> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const qb: SelectQueryBuilder<ResearchItem> = this.researchItemRepo
      .createQueryBuilder('ri')
      .leftJoinAndSelect('ri.source', 'source')
      .leftJoinAndSelect('ri.tags', 'tags')
      .leftJoinAndSelect('ri.attachments', 'attachments')
      .leftJoinAndSelect('ri.securities', 'securities');

    // Full-text search using PostgreSQL ts_vector
    if (filters.search) {
      qb.andWhere(
        `to_tsvector('english', coalesce(ri.title,'') || ' ' || coalesce(ri.content_text,'') || ' ' || coalesce(ri.ai_summary,'')) @@ plainto_tsquery('english', :search)`,
        { search: filters.search },
      );
    }

    if (filters.sourceType) {
      qb.andWhere('source.source_type = :sourceType', {
        sourceType: filters.sourceType,
      });
    }

    if (filters.status) {
      qb.andWhere('ri.status = :status', { status: filters.status });
    }

    if (filters.dateFrom) {
      qb.andWhere('ri.published_at >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      qb.andWhere('ri.published_at <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.securityId) {
      qb.andWhere('securities.id = :securityId', {
        securityId: filters.securityId,
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      qb.andWhere('tags.id IN (:...tagIds)', { tagIds: filters.tags });
    }

    qb.orderBy('ri.published_at', 'DESC').skip(offset).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((item) => this.toResponse(item)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // findOne – single item with all relations
  // ---------------------------------------------------------------------------
  async findOne(id: string): Promise<ResearchItemResponse> {
    const item = await this.researchItemRepo.findOne({
      where: { id },
      relations: [
        'source',
        'tags',
        'attachments',
        'securities',
        'annotations',
        'annotations.author',
        'actions',
      ],
    });

    if (!item) {
      throw new NotFoundException(`Research item ${id} not found`);
    }

    return this.toResponse(item);
  }

  // ---------------------------------------------------------------------------
  // search – full-text search using Supabase RPC (search_research pg function)
  // ---------------------------------------------------------------------------
  async search(
    query: string,
    filters: Omit<ResearchFilters, 'search'>,
  ): Promise<PaginatedResponse<ResearchItemResponse>> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const { data, error } = await this.supabase.rpc('search_research', {
      p_query: query.trim(),
      p_source_type: filters.sourceType ?? null,
      p_status: filters.status ?? null,
      p_date_from: filters.dateFrom ?? null,
      p_date_to: filters.dateTo ?? null,
      p_security_id: filters.securityId ?? null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      this.logger.error('Supabase search_research RPC error', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    const results = (data as ResearchItemResponse[]) ?? [];
    return {
      data: results,
      meta: {
        total: results.length > 0 ? (results[0] as any).total_count ?? results.length : 0,
        page,
        limit,
        totalPages: Math.ceil((results[0] as any)?.total_count ?? results.length / limit),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // updateTags – replace tag associations for a research item
  // ---------------------------------------------------------------------------
  async updateTags(id: string, dto: UpdateTagsDto): Promise<ResearchItemResponse> {
    const item = await this.researchItemRepo.findOne({
      where: { id },
      relations: ['tags'],
    });

    if (!item) {
      throw new NotFoundException(`Research item ${id} not found`);
    }

    // Replace tag associations via junction table
    await this.supabase.from('research_item_tags').delete().eq('research_item_id', id);

    if (dto.tagIds.length > 0) {
      const rows = dto.tagIds.map((tagId) => ({
        research_item_id: id,
        tag_id: tagId,
      }));
      const { error } = await this.supabase.from('research_item_tags').insert(rows);
      if (error) {
        throw new Error(`Failed to update tags: ${error.message}`);
      }
    }

    return this.findOne(id);
  }

  // ---------------------------------------------------------------------------
  // addAnnotation – create annotation on a research item
  // ---------------------------------------------------------------------------
  async addAnnotation(
    itemId: string,
    userId: string,
    dto: CreateAnnotationDto,
  ): Promise<ResearchAnnotation> {
    const item = await this.researchItemRepo.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`Research item ${itemId} not found`);
    }

    const annotation = this.annotationRepo.create({
      researchItemId: itemId,
      authorId: userId,
      content: dto.content,
      highlightedText: dto.highlightedText,
    });

    return this.annotationRepo.save(annotation);
  }

  // ---------------------------------------------------------------------------
  // trackAction – record user interaction (read, bookmark, share, etc.)
  // ---------------------------------------------------------------------------
  async trackAction(
    itemId: string,
    userId: string,
    dto: TrackActionDto,
  ): Promise<void> {
    const { error } = await this.supabase.from('research_user_actions').upsert(
      {
        research_item_id: itemId,
        user_id: userId,
        action_type: dto.actionType,
        metadata: dto.metadata ?? {},
        acted_at: new Date().toISOString(),
      },
      {
        onConflict: 'research_item_id,user_id,action_type',
        ignoreDuplicates: false,
      },
    );

    if (error) {
      this.logger.error(`Failed to track action ${dto.actionType} on ${itemId}`, error);
      throw new Error(`Failed to track action: ${error.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // getResearchFeed – personalized feed based on user’s securities/households
  // ---------------------------------------------------------------------------
  async getResearchFeed(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<ResearchFeedItem>> {
    const offset = (page - 1) * Math.min(limit, 100);

    const { data, error } = await this.supabase.rpc('get_research_feed', {
      p_user_id: userId,
      p_limit: Math.min(limit, 100),
      p_offset: offset,
    });

    if (error) {
      this.logger.error('Failed to fetch research feed', error);
      throw new Error(`Feed fetch failed: ${error.message}`);
    }

    const items = (data as ResearchFeedItem[]) ?? [];
    const totalCount = items.length > 0 ? (items[0] as any).total_count ?? items.length : 0;

    return {
      data: items,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // getResearchStats – dashboard statistics
  // ---------------------------------------------------------------------------
  async getResearchStats(): Promise<ResearchStats> {
    const { data, error } = await this.supabase.rpc('get_research_stats');

    if (error) {
      this.logger.error('Failed to fetch research stats', error);
      throw new Error(`Stats fetch failed: ${error.message}`);
    }

    return data as ResearchStats;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------
  private toResponse(item: ResearchItem): ResearchItemResponse {
    return {
      id: item.id,
      title: item.title,
      author: item.author,
      summary: item.aiSummary ?? item.summary,
      contentText: item.contentText,
      contentHtml: item.contentHtml,
      originalUrl: item.originalUrl,
      publishedAt: item.publishedAt,
      ingestedAt: item.ingestedAt,
      processedAt: item.processedAt,
      status: item.status,
      source: item.source
        ? {
            id: item.source.id,
            name: item.source.name,
            sourceType: item.source.sourceType,
          }
        : undefined,
      tags: (item.tags ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color })),
      securities: (item.securities ?? []).map((s) => ({
        id: s.id,
        ticker: s.ticker,
        name: s.name,
        sentiment: (item.sentimentScores as Record<string, number>)?.[s.ticker] ?? null,
      })),
      attachments: (item.attachments ?? []).map((a) => ({
        id: a.id,
        filename: a.filename,
        contentType: a.contentType,
        fileSize: a.fileSize,
      })),
      annotations: (item.annotations ?? []).map((ann) => ({
        id: ann.id,
        content: ann.content,
        highlightedText: ann.highlightedText,
        createdAt: ann.createdAt,
      })),
      extractedTickers: (item.extractedTickers as string[]) ?? [],
      sentimentScores: (item.sentimentScores as Record<string, number>) ?? {},
    };
  }
}
