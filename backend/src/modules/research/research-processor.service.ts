import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

import { ResearchItem } from './entities/research-item.entity';
import { ResearchAttachment } from './entities/research-attachment.entity';
import { RESEARCH_QUEUE } from './research.module';

// ---------------------------------------------------------------------------
// AI Response Types
// ---------------------------------------------------------------------------

interface AISummaryResponse {
  summary: string;
  key_points: string[];
  investment_implications: string;
}

interface SecurityExtractionResponse {
  securities: {
    ticker: string;
    name: string;
    exchange?: string;
    mentioned_context: string;
  }[];
}

interface SentimentAnalysisResponse {
  sentiments: {
    ticker: string;
    score: number; // -1.0 to 1.0
    reasoning: string;
  }[];
}

interface AutoTagResponse {
  tags: {
    name: string;
    category: 'sector' | 'theme' | 'asset_class' | 'geography' | 'style';
    confidence: number; // 0.0 to 1.0
  }[];
}

// Common ticker pattern (handles US, EU, international formats)
const TICKER_REGEX =
  /\b([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\b(?=\s+(?:stock|shares|NYSE|NASDAQ|equity|ETF|options))/g;

// ---------------------------------------------------------------------------
// Processor
// ---------------------------------------------------------------------------

@Processor(RESEARCH_QUEUE)
@Injectable()
export class ResearchProcessorService {
  private readonly logger = new Logger(ResearchProcessorService.name);
  private readonly openai: OpenAI;
  private readonly supabase: SupabaseClient;

  constructor(
    @InjectRepository(ResearchItem)
    private readonly researchItemRepo: Repository<ResearchItem>,
    @InjectRepository(ResearchAttachment)
    private readonly attachmentRepo: Repository<ResearchAttachment>,
    @InjectQueue(RESEARCH_QUEUE)
    private readonly researchQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });

    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
  }

  // ---------------------------------------------------------------------------
  // Bull job consumer – main entry point
  // ---------------------------------------------------------------------------
  @Process('process-item')
  async handleProcessItem(job: Job<{ researchItemId: string }>): Promise<void> {
    const { researchItemId } = job.data;
    this.logger.log(`Processing research item: ${researchItemId}`);
    await this.processResearchItem(researchItemId);
  }

  @Process('ingest-email')
  async handleIngestEmail(job: Job<{ payload: Record<string, unknown> }>): Promise<void> {
    this.logger.log(`Processing email ingest job ${job.id}`);
    // The ingest logic is handled upstream; this just logs receipt
    this.logger.debug('Email ingested via NestJS queue', JSON.stringify(job.data.payload).slice(0, 200));
  }

  // ---------------------------------------------------------------------------
  // processResearchItem – orchestrates the full AI pipeline
  // ---------------------------------------------------------------------------
  async processResearchItem(itemId: string): Promise<void> {
    const item = await this.researchItemRepo.findOne({
      where: { id: itemId },
      relations: ['attachments'],
    });

    if (!item) {
      this.logger.error(`Research item not found: ${itemId}`);
      return;
    }

    // Mark as processing
    await this.researchItemRepo.update(itemId, { status: 'processing' });

    try {
      // 1. Extract text from attachments (PDF/DOCX)
      let fullText = item.contentText ?? '';
      for (const attachment of item.attachments ?? []) {
        if (this.isExtractableAttachment(attachment.contentType)) {
          const extractedText = await this.extractText(attachment.id);
          if (extractedText) {
            fullText += `\n\n--- Attachment: ${attachment.filename} ---\n${extractedText}`;
          }
        }
      }

      // Truncate to prevent token overflow (~100k chars ≈ 25k tokens)
      const truncatedText = fullText.slice(0, 100_000);

      // 2. Generate AI summary
      const summaryResult = await this.summarizeContent(truncatedText, item.title);

      // 3. Extract securities / tickers
      const securitiesResult = await this.extractSecurities(truncatedText);
      const extractedTickers = securitiesResult.securities.map((s) => s.ticker);

      // 4. Sentiment analysis per security
      const sentimentResult =
        extractedTickers.length > 0
          ? await this.analyzeSentiment(truncatedText, extractedTickers)
          : { sentiments: [] };

      const sentimentScores: Record<string, number> = {};
      for (const s of sentimentResult.sentiments) {
        sentimentScores[s.ticker] = s.score;
      }

      // 5. Auto-tag by sector, theme, asset class
      const tagsResult = await this.autoTag(truncatedText, summaryResult.summary);

      // 6. Persist auto-tags (upsert into tags table, then link)
      await this.persistAutoTags(itemId, tagsResult.tags);

      // 7. Link extracted securities
      await this.persistSecurities(itemId, securitiesResult.securities);

      // 8. Update research_item with AI results
      await this.researchItemRepo.update(itemId, {
        aiSummary: summaryResult.summary,
        summary: summaryResult.summary,
        extractedTickers: extractedTickers as any,
        sentimentScores: sentimentScores as any,
        processedAt: new Date(),
        status: 'processed',
      });

      this.logger.log(
        `Successfully processed ${itemId}: ${extractedTickers.length} tickers, ${tagsResult.tags.length} tags`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to process research item ${itemId}: ${message}`, err);

      await this.researchItemRepo.update(itemId, { status: 'failed' });
      throw err; // Let Bull handle retry logic
    }
  }

  // ---------------------------------------------------------------------------
  // extractText – download attachment from Supabase Storage and extract text
  // ---------------------------------------------------------------------------
  async extractText(attachmentId: string): Promise<string | null> {
    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId },
    });

    if (!attachment) return null;

    try {
      await this.attachmentRepo.update(attachmentId, {
        processingStatus: 'processing',
      });

      const { data: fileData, error } = await this.supabase.storage
        .from('research-attachments')
        .download(attachment.storagePath);

      if (error || !fileData) {
        this.logger.error(`Failed to download attachment ${attachmentId}`, error);
        return null;
      }

      // For PDF/DOCX, we send to OpenAI via assistants or use a text extraction service.
      // Here we use a simplified approach: read as text for .txt, otherwise use
      // the file as base64 and rely on OpenAI’s vision/file API in production.
      if (
        attachment.contentType === 'application/pdf' ||
        attachment.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        // Production: use pdfjs-dist / mammoth via a separate microservice or
        // Supabase Edge Function. For now, record that extraction was attempted.
        this.logger.warn(
          `Binary extraction for ${attachment.filename} requires dedicated parser — skipping text extraction`,
        );
        await this.attachmentRepo.update(attachmentId, {
          processingStatus: 'skipped',
        });
        return null;
      }

      const text = await fileData.text();
      await this.attachmentRepo.update(attachmentId, {
        extractedText: text,
        processingStatus: 'processed',
      });

      return text;
    } catch (err) {
      this.logger.error(`Error extracting text from attachment ${attachmentId}`, err);
      await this.attachmentRepo.update(attachmentId, { processingStatus: 'failed' });
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // summarizeContent – GPT-4o-mini summary with structured JSON output
  // ---------------------------------------------------------------------------
  async summarizeContent(text: string, title = ''): Promise<AISummaryResponse> {
    const prompt = [
      `You are a financial research analyst assistant. Summarize the following research document.`,
      `Title: ${title || 'Untitled'}`,
      ``,
      `Return a JSON object with exactly these fields:`,
      `- summary: A concise 2-4 sentence summary`,
      `- key_points: Array of 3-5 key takeaways as short strings`,
      `- investment_implications: 1-2 sentences on investment relevance`,
      ``,
      `Document:`,
      text.slice(0, 12_000), // stay within context
    ].join('\n');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 600,
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<AISummaryResponse>;

    return {
      summary: parsed.summary ?? '',
      key_points: parsed.key_points ?? [],
      investment_implications: parsed.investment_implications ?? '',
    };
  }

  // ---------------------------------------------------------------------------
  // extractSecurities – regex pre-filter + AI extraction
  // ---------------------------------------------------------------------------
  async extractSecurities(text: string): Promise<SecurityExtractionResponse> {
    // Quick regex pre-filter to find candidate tickers
    const regexMatches = [...new Set([...text.matchAll(TICKER_REGEX)].map((m) => m[1]))];

    const prompt = [
      `You are a financial data specialist. Identify all publicly traded securities (stocks, ETFs, bonds) mentioned in the text.`,
      ``,
      `Candidate tickers found by regex: ${regexMatches.join(', ') || 'none'}`,
      ``,
      `Return a JSON object with field "securities" — an array of objects with:`,
      `- ticker: uppercase ticker symbol`,
      `- name: full company/security name if identifiable`,
      `- exchange: exchange abbreviation (NYSE, NASDAQ, etc.) if known`,
      `- mentioned_context: short quote showing where it was mentioned (max 100 chars)`,
      ``,
      `Only include tickers that are clearly about real publicly traded securities. Exclude common words that look like tickers.`,
      ``,
      `Text:`,
      text.slice(0, 12_000),
    ].join('\n');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 800,
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<SecurityExtractionResponse>;

    return { securities: parsed.securities ?? [] };
  }

  // ---------------------------------------------------------------------------
  // analyzeSentiment – per-security sentiment scoring (-1 to 1)
  // ---------------------------------------------------------------------------
  async analyzeSentiment(
    text: string,
    tickers: string[],
  ): Promise<SentimentAnalysisResponse> {
    if (tickers.length === 0) return { sentiments: [] };

    const prompt = [
      `You are a financial sentiment analyst. Analyze the sentiment expressed toward each of the following securities in the text.`,
      ``,
      `Securities to analyze: ${tickers.join(', ')}`,
      ``,
      `Return a JSON object with field "sentiments" — an array of objects with:`,
      `- ticker: the ticker symbol`,
      `- score: a float from -1.0 (very bearish) to 1.0 (very bullish), 0.0 is neutral`,
      `- reasoning: 1 sentence explaining the score`,
      ``,
      `Text:`,
      text.slice(0, 12_000),
    ].join('\n');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 600,
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<SentimentAnalysisResponse>;

    return { sentiments: parsed.sentiments ?? [] };
  }

  // ---------------------------------------------------------------------------
  // autoTag – classify into sector, theme, asset class tags
  // ---------------------------------------------------------------------------
  async autoTag(text: string, summary: string): Promise<AutoTagResponse> {
    const prompt = [
      `You are a financial research classifier. Classify this research document into tags.`,
      ``,
      `Summary: ${summary}`,
      ``,
      `Return a JSON object with field "tags" — an array of objects with:`,
      `- name: tag name (e.g., "Technology", "Value Investing", "Fixed Income", "Emerging Markets")`,
      `- category: one of "sector" | "theme" | "asset_class" | "geography" | "style"`,
      `- confidence: float 0.0-1.0`,
      ``,
      `Select 3-7 relevant tags. Only include tags with confidence >= 0.5.`,
      ``,
      `Text excerpt:`,
      text.slice(0, 8_000),
    ].join('\n');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 400,
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<AutoTagResponse>;

    return { tags: parsed.tags ?? [] };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private isExtractableAttachment(contentType: string): boolean {
    return [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/html',
      'text/csv',
    ].includes(contentType);
  }

  private async persistAutoTags(
    itemId: string,
    tags: AutoTagResponse['tags'],
  ): Promise<void> {
    for (const tag of tags) {
      if (tag.confidence < 0.5) continue;

      // Upsert tag
      const { data: tagRecord, error: tagError } = await this.supabase
        .from('tags')
        .upsert(
          { name: tag.name, category: tag.category, auto_generated: true },
          { onConflict: 'name', ignoreDuplicates: false },
        )
        .select('id')
        .single();

      if (tagError || !tagRecord) {
        this.logger.warn(`Failed to upsert tag "${tag.name}"`, tagError);
        continue;
      }

      // Link to research item
      await this.supabase
        .from('research_item_tags')
        .upsert(
          { research_item_id: itemId, tag_id: tagRecord.id },
          { onConflict: 'research_item_id,tag_id', ignoreDuplicates: true },
        );
    }
  }

  private async persistSecurities(
    itemId: string,
    securities: SecurityExtractionResponse['securities'],
  ): Promise<void> {
    for (const sec of securities) {
      // Upsert security record
      const { data: secRecord, error: secError } = await this.supabase
        .from('securities')
        .upsert(
          { ticker: sec.ticker, name: sec.name || sec.ticker },
          { onConflict: 'ticker', ignoreDuplicates: false },
        )
        .select('id')
        .single();

      if (secError || !secRecord) {
        this.logger.warn(`Failed to upsert security "${sec.ticker}"`, secError);
        continue;
      }

      // Link to research item
      await this.supabase
        .from('research_item_securities')
        .upsert(
          { research_item_id: itemId, security_id: secRecord.id, mentioned_context: sec.mentioned_context },
          { onConflict: 'research_item_id,security_id', ignoreDuplicates: true },
        );
    }
  }
}
