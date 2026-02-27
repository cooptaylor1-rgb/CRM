# Research Ingestion Engine — Architecture Document

**Project:** Wealth Management CRM / Portfolio Management Tool  
**Component:** Research Ingestion Engine  
**Stack:** NestJS 10 · Next.js 14 · Supabase (PostgreSQL + Auth + Edge Functions + Storage + Realtime)  
**Custodian:** Charles Schwab  
**Team Size:** 2–5 advisors / analysts  
**Firm Type:** SEC-Registered Investment Adviser (RIA)  
**Document Version:** 1.0  
**Last Updated:** 2026-02-27

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Email Forwarding Ingestion Pipeline](#2-email-forwarding-ingestion-pipeline)
3. [AI Processing Pipeline](#3-ai-processing-pipeline)
4. [Database Schema Design](#4-database-schema-design)
5. [Research Feed UI Design](#5-research-feed-ui-design)
6. [Future Phases](#6-future-phases)
7. [API Endpoints](#7-api-endpoints)
8. [Security & Compliance](#8-security--compliance)

---

## 1. System Overview

### Purpose

The Research Ingestion Engine provides a zero-friction pipeline for capturing, processing, and actioning investment research. Team members forward emails from brokers, sell-side analysts, third-party services (e.g., Fundstrat, BCA Research, Morgan Stanley Research), and internal notes to a single dedicated address. The system handles everything from there: parsing, storage, AI enrichment, entity extraction, and surfacing the research in a searchable, annotatable feed tied directly to portfolio positions.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INGESTION LAYER                              │
│                                                                     │
│   Advisor/Analyst                                                   │
│   ──────────────                                                    │
│   Forwards email ──► research@yourdomain.com                       │
│                            │                                        │
│                     [Email Service]                                 │
│                  (Postmark Inbound)                                 │
│                            │ JSON Webhook POST                      │
│                            ▼                                        │
│              Supabase Edge Function                                 │
│           (ingest-research-email)                                   │
│                            │                                        │
│           ┌────────────────┼────────────────┐                      │
│           │                │                │                       │
│    Parse Email       Store Raw Email   Create DB Record             │
│    (metadata,        (Supabase         (research_items)             │
│     body, atts)       Storage)                                      │
│                            │                                        │
│                   Enqueue AI Processing Job                        │
│                  (Supabase pg_net → NestJS)                        │
└─────────────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────────────┐
│                      AI PROCESSING LAYER                            │
│                                                                     │
│   NestJS Bull/Redis Queue (research-processing queue)               │
│                                                                     │
│   Job 1: Text Extraction   (PDF/DOCX → plain text)                 │
│   Job 2: Summarization     (OpenAI GPT-4o)                         │
│   Job 3: Ticker Extraction (regex + NLP)                           │
│   Job 4: Sentiment Analysis (bullish / bearish / neutral)          │
│   Job 5: Auto-tagging      (sector, theme, asset class)            │
│   Job 6: Entity Linking    (→ securities table)                    │
│                                                                     │
│   Results written back to Supabase → Realtime event fired          │
└─────────────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────────────┐
│                       STORAGE LAYER                                 │
│                                                                     │
│   Supabase PostgreSQL                                               │
│   ├── research_items          (core record)                        │
│   ├── research_attachments    (file metadata)                      │
│   ├── research_sources        (sender/source catalog)              │
│   ├── research_tags           (taxonomy)                           │
│   ├── research_item_tags      (M:M join)                           │
│   ├── research_securities     (extracted tickers)                  │
│   ├── research_annotations    (team notes)                         │
│   ├── research_actions        (acted-on tracking)                  │
│   ├── email_ingestion_config  (allowlist, routing rules)           │
│   └── email_ingestion_log     (audit trail)                        │
│                                                                     │
│   Supabase Storage                                                  │
│   └── research-attachments/   (raw PDFs, images, DOCX)            │
└─────────────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                           │
│                                                                     │
│   Next.js 14 App Router                                             │
│   ├── /research               (Research Feed)                      │
│   ├── /research/[id]          (Research Detail)                    │
│   ├── /research/search        (Full-text search)                   │
│   └── /research/settings      (Ingestion config)                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Email Forwarding Ingestion Pipeline

### 2.1 End-to-End Data Flow

```
Team Member
    │
    │  Fwd: "GS Research Note — NVDA price target $200"
    │  + PDF attachment
    ▼
research@yourdomain.com
    │
    │  MX record → mail.postmarkapp.com
    ▼
Postmark Inbound Processing
    │
    │  Parses MIME, extracts fields, base64-encodes attachments
    │  POST /api/research/ingest/email  (JSON, ~2ms)
    ▼
Supabase Edge Function: ingest-research-email
    │
    ├── 1. Verify Postmark webhook signature (X-Postmark-Signature)
    ├── 2. Validate sender against email_ingestion_config allowlist
    ├── 3. Parse email fields (from, subject, html/text body, attachments)
    ├── 4. Store raw email JSON → Supabase Storage
    │         research-raw/{year}/{month}/{message-id}.json
    ├── 5. Decode & upload each attachment → Supabase Storage
    │         research-attachments/{item-id}/{filename}
    ├── 6. INSERT research_items record (status: 'pending')
    ├── 7. INSERT research_attachments records
    ├── 8. INSERT email_ingestion_log record
    └── 9. HTTP POST → NestJS /api/research/processing/enqueue
              (or call pg_net to trigger background job)
    │
    │  Return 200 immediately (Postmark requires < 2min response)
    ▼
NestJS Bull Queue: research-processing
    │
    └── [See Section 3: AI Processing Pipeline]
```

### 2.2 Email Service Selection

#### Comparison Matrix

| Feature | Postmark Inbound | SendGrid Inbound Parse | Mailgun Routes |
|---|---|---|---|
| **Webhook format** | Clean JSON, well-documented | multipart/form-data OR JSON | JSON (UTF-8) |
| **Parsed fields** | from, to, cc, bcc, subject, textBody, htmlBody, strippedReply, headers, attachments | from, to, subject, text, html, attachments, headers, envelope | from, to, subject, body-plain, body-html, attachments, message-headers |
| **Attachment handling** | Base64-encoded inline in JSON payload, no separate fetch needed | Base64-encoded inline (up to 30MB total) | Base64-encoded inline OR separate URL (up to ~25MB) |
| **Max message size** | 10MB default (contact support for more) | 30MB | ~25MB |
| **Webhook retries** | 10 retries (1 min → 6 hours); stops on 403 | 3 days of retries on 5xx; no retry on 4xx | Configurable; stores in queue if endpoint down |
| **Spam filtering** | X-Spam-Score, X-Spam-Status headers included | Spam score via SpamAssassin | Spam filter available |
| **Reply stripping** | ✅ `StrippedTextReply` field built-in | ❌ Manual | ❌ Manual |
| **Inbound domain** | yourhash@inbound.postmarkapp.com + custom domain forwarding | MX → mx.sendgrid.net on subdomain | MX → mxa.mailgun.org on domain |
| **Custom domain routing** | ✅ Inbound domain forwarding | ✅ MX record on subdomain | ✅ Full domain routing |
| **Plus-addressing routing** | ✅ `MailboxHash` field (research+clientA@domain.com) | ❌ | ❌ |
| **Pricing (inbound)** | Included in all plans; $15/mo starter (1k emails) | Free tier: 100 inbound/day; paid plans from $19.95/mo | Foundation plan from $35/mo (Routes feature required) |
| **Documentation quality** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Good |
| **Developer experience** | ⭐⭐⭐⭐⭐ Best-in-class | ⭐⭐⭐⭐ Good | ⭐⭐⭐ Adequate |
| **Ideal for** | Small team, dev-friendly, high reliability | High-volume SaaS | Complex routing rules |

#### Recommendation: **Postmark Inbound**

For a 2–5 person RIA team, Postmark is the clear choice:

1. **Cleanest JSON payload** — Attachments arrive base64-encoded in the webhook body; no secondary fetch required. This simplifies Edge Function code significantly.
2. **StrippedTextReply** — When advisors reply to forwarded research with notes, Postmark auto-strips the original thread. This is valuable for capturing inline annotations.
3. **MailboxHash (plus-addressing)** — `research+NVDA@yourdomain.com` auto-routes to the NVDA security context. Enables smart routing without additional configuration.
4. **10 retries with exponential backoff** — Guarantees delivery even if the Edge Function is briefly unavailable.
5. **Pricing** — At 2–5 users forwarding research, volume will be well under any paid tier threshold for months.

**Setup steps:**
```bash
# 1. Create a Postmark account and server named "research-inbound"
# 2. In DNS, add an MX record:
#    research.yourdomain.com  MX  10  inbound.postmarkapp.com
# 3. In Postmark → Server → Inbound → Settings:
#    Webhook URL: https://<project-ref>.supabase.co/functions/v1/ingest-research-email
# 4. Set inbound domain: research.yourdomain.com
# 5. Team members forward to: research@yourdomain.com
```

### 2.3 Supabase Edge Function Design

#### File: `supabase/functions/ingest-research-email/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts'
import { encodeHex } from 'https://deno.land/std@0.208.0/encoding/hex.ts'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PostmarkAttachment {
  Name: string
  Content: string      // base64-encoded
  ContentType: string
  ContentLength: number
  ContentID?: string
}

interface PostmarkWebhookPayload {
  MessageID: string
  Date: string
  From: string
  FromName: string
  FromFull: { Email: string; Name: string; MailboxHash: string }
  To: string
  ToFull: Array<{ Email: string; Name: string; MailboxHash: string }>
  Cc?: string
  Subject: string
  TextBody: string
  HtmlBody: string
  StrippedTextReply?: string
  MailboxHash?: string
  ReplyTo?: string
  Headers: Array<{ Name: string; Value: string }>
  Attachments: PostmarkAttachment[]
  Tag?: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/html',
  'image/png',
  'image/jpeg',
  'image/gif',
])

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024 // 10MB per attachment

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let payload: PostmarkWebhookPayload

  try {
    // ── Step 1: Verify Postmark webhook signature ─────────────────────────
    const rawBody = await req.text()
    const signature = req.headers.get('X-Postmark-Signature') ?? ''
    const webhookToken = Deno.env.get('POSTMARK_WEBHOOK_TOKEN')!

    const isValid = await verifyPostmarkSignature(rawBody, signature, webhookToken)
    if (!isValid) {
      await logIngestionEvent(supabase, null, 'rejected', 'Invalid webhook signature')
      return new Response('Unauthorized', { status: 401 })
    }

    payload = JSON.parse(rawBody)

    // ── Step 2: Validate sender against allowlist ─────────────────────────
    const senderEmail = payload.FromFull.Email.toLowerCase()
    const { data: config } = await supabase
      .from('email_ingestion_config')
      .select('allowed_domains, allowed_emails, is_active')
      .single()

    if (!config?.is_active) {
      return new Response('Ingestion disabled', { status: 503 })
    }

    const isAllowed = isSenderAllowed(senderEmail, config.allowed_domains, config.allowed_emails)
    if (!isAllowed) {
      await logIngestionEvent(supabase, payload.MessageID, 'rejected', `Sender not in allowlist: ${senderEmail}`)
      // Return 200 to prevent Postmark retries for blocked senders
      return new Response('OK', { status: 200 })
    }

    // ── Step 3: Store raw email JSON ───────────────────────────────────────
    const now = new Date()
    const rawStoragePath = `research-raw/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${payload.MessageID}.json`

    await supabase.storage
      .from('research-emails')
      .upload(rawStoragePath, JSON.stringify(payload), {
        contentType: 'application/json',
        upsert: false,
      })

    // ── Step 4: Create research_items record ──────────────────────────────
    const researchItemId = crypto.randomUUID()

    // Determine or create source
    const source = await upsertSource(supabase, payload.FromFull)

    const { error: insertError } = await supabase
      .from('research_items')
      .insert({
        id: researchItemId,
        source_id: source.id,
        title: cleanSubject(payload.Subject),
        sender_email: senderEmail,
        sender_name: payload.FromName,
        received_at: new Date(payload.Date).toISOString(),
        content_html: payload.HtmlBody,
        content_text: payload.TextBody,
        stripped_reply: payload.StrippedTextReply ?? null,
        mailbox_hash: payload.MailboxHash ?? null,
        raw_storage_path: rawStoragePath,
        postmark_message_id: payload.MessageID,
        processing_status: 'pending',
        ingested_at: new Date().toISOString(),
      })

    if (insertError) throw insertError

    // ── Step 5: Process and store attachments ─────────────────────────────
    const attachmentRecords = []

    for (const att of payload.Attachments ?? []) {
      if (!ALLOWED_CONTENT_TYPES.has(att.ContentType)) {
        console.warn(`Skipping disallowed attachment type: ${att.ContentType}`)
        continue
      }

      const attBytes = base64Decode(att.Content)
      if (attBytes.byteLength > MAX_ATTACHMENT_SIZE_BYTES) {
        console.warn(`Attachment too large: ${att.Name} (${attBytes.byteLength} bytes)`)
        continue
      }

      const safeName = sanitizeFilename(att.Name)
      const storagePath = `research-attachments/${researchItemId}/${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('research-files')
        .upload(storagePath, attBytes, {
          contentType: att.ContentType,
          upsert: false,
        })

      if (uploadError) {
        console.error(`Failed to upload attachment ${att.Name}:`, uploadError)
        continue
      }

      attachmentRecords.push({
        research_item_id: researchItemId,
        filename: att.Name,
        safe_filename: safeName,
        content_type: att.ContentType,
        size_bytes: att.ContentLength,
        storage_path: storagePath,
        extraction_status: att.ContentType === 'application/pdf' ? 'pending' : 'not_applicable',
      })
    }

    if (attachmentRecords.length > 0) {
      await supabase.from('research_attachments').insert(attachmentRecords)
    }

    // ── Step 6: Write ingestion log ───────────────────────────────────────
    await logIngestionEvent(supabase, payload.MessageID, 'success', null, researchItemId)

    // ── Step 7: Trigger async AI processing ───────────────────────────────
    // Option A: Call NestJS queue endpoint directly
    await triggerProcessing(researchItemId)

    return new Response(JSON.stringify({ id: researchItemId, status: 'queued' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Ingestion error:', err)
    await logIngestionEvent(supabase, payload?.MessageID ?? null, 'error', String(err))
    // Return 200 to avoid infinite Postmark retries on application errors
    // Use error monitoring (Sentry) to catch these
    return new Response('OK', { status: 200 })
  }
})

// ─── Helper Functions ─────────────────────────────────────────────────────────

async function verifyPostmarkSignature(
  body: string,
  signature: string,
  token: string
): Promise<boolean> {
  // Postmark uses HMAC-SHA256 over the raw request body
  const encoder = new TextEncoder()
  const keyData = encoder.encode(token)
  const messageData = encoder.encode(body)

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const computedHex = encodeHex(new Uint8Array(signatureBytes))

  return computedHex === signature.toLowerCase()
}

function isSenderAllowed(
  email: string,
  allowedDomains: string[],
  allowedEmails: string[]
): boolean {
  if (allowedEmails.includes(email)) return true
  const domain = email.split('@')[1]
  return allowedDomains.some(d => domain === d || domain.endsWith(`.${d}`))
}

function cleanSubject(subject: string): string {
  // Strip "Fwd:", "Re:", "FW:", "RE:" prefixes
  return subject
    .replace(/^(fwd?:|re:|fw:)\s*/gi, '')
    .trim()
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255)
}

function base64Decode(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function upsertSource(supabase: any, fromFull: PostmarkWebhookPayload['FromFull']) {
  const domain = fromFull.Email.split('@')[1]
  const { data, error } = await supabase
    .from('research_sources')
    .upsert({
      email: fromFull.Email.toLowerCase(),
      display_name: fromFull.Name || fromFull.Email,
      domain,
      source_type: 'email',
    }, { onConflict: 'email' })
    .select('id')
    .single()

  if (error) throw error
  return data
}

async function logIngestionEvent(
  supabase: any,
  messageId: string | null,
  status: 'success' | 'rejected' | 'error',
  errorMessage: string | null = null,
  researchItemId?: string
) {
  await supabase.from('email_ingestion_log').insert({
    postmark_message_id: messageId,
    research_item_id: researchItemId ?? null,
    status,
    error_message: errorMessage,
    logged_at: new Date().toISOString(),
  })
}

async function triggerProcessing(researchItemId: string) {
  const nestjsUrl = Deno.env.get('NESTJS_INTERNAL_URL')!
  const internalSecret = Deno.env.get('INTERNAL_API_SECRET')!

  await fetch(`${nestjsUrl}/api/research/processing/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': internalSecret,
    },
    body: JSON.stringify({ researchItemId }),
  })
}
```

#### Environment Variables (Edge Function Secrets)

```bash
# Set via Supabase CLI
supabase secrets set POSTMARK_WEBHOOK_TOKEN=your-postmark-webhook-token
supabase secrets set NESTJS_INTERNAL_URL=https://api.yourdomain.com
supabase secrets set INTERNAL_API_SECRET=your-256-bit-random-secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...  # auto-set by Supabase
```

#### Deploy the Edge Function

```bash
supabase functions deploy ingest-research-email --no-verify-jwt
# --no-verify-jwt: Postmark doesn't send a Supabase JWT; we use our own HMAC verification
```

---

## 3. AI Processing Pipeline

### 3.1 Processing Architecture

The AI pipeline runs as a **NestJS Bull/BullMQ queue** backed by Redis. This keeps heavy AI work out of the Edge Function timeout window (150ms–2min) and provides retry semantics, progress tracking, and backpressure management.

```
Supabase Edge Function
        │
        │  POST /api/research/processing/enqueue
        │  { researchItemId: "uuid" }
        ▼
NestJS ResearchModule
  ResearchProcessingController
        │
        │  queue.add('process-research-item', { researchItemId }, options)
        ▼
Bull Queue: "research-processing"  (Redis-backed)
        │
        ▼
ResearchProcessingWorker (NestJS Processor)
        │
        ├── Job 1: extractText()          → research_attachments.extracted_text
        ├── Job 2: summarize()            → research_items.summary
        ├── Job 3: extractSecurities()    → research_securities[]
        ├── Job 4: analyzeSentiment()     → research_securities[].sentiment
        ├── Job 5: autoTag()              → research_item_tags[]
        └── Job 6: linkEntities()         → research_securities.security_id (FK)
                │
                ▼
        UPDATE research_items SET processing_status = 'complete'
                │
                ▼
        Supabase Realtime broadcast → Frontend
```

### 3.2 NestJS Queue Module Setup

```typescript
// research-processing.module.ts
import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ResearchProcessingWorker } from './research-processing.worker'
import { ResearchProcessingController } from './research-processing.controller'
import { ResearchProcessingService } from './research-processing.service'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'research-processing',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,  // 5s, 10s, 20s
        },
        removeOnComplete: { count: 100 },  // keep last 100 completed
        removeOnFail: { count: 500 },
      },
    }),
  ],
  controllers: [ResearchProcessingController],
  providers: [ResearchProcessingWorker, ResearchProcessingService],
})
export class ResearchProcessingModule {}
```

### 3.3 Processing Worker

```typescript
// research-processing.worker.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { TextExtractionService } from './services/text-extraction.service'
import { SummarizationService } from './services/summarization.service'
import { SecurityExtractionService } from './services/security-extraction.service'
import { AutoTaggingService } from './services/auto-tagging.service'

export interface ResearchProcessingJob {
  researchItemId: string
}

@Processor('research-processing', { concurrency: 3 })
@Injectable()
export class ResearchProcessingWorker extends WorkerHost {
  private readonly logger = new Logger(ResearchProcessingWorker.name)

  constructor(
    private supabase: SupabaseService,
    private textExtraction: TextExtractionService,
    private summarization: SummarizationService,
    private securityExtraction: SecurityExtractionService,
    private autoTagging: AutoTaggingService,
  ) {
    super()
  }

  async process(job: Job<ResearchProcessingJob>): Promise<void> {
    const { researchItemId } = job.data
    this.logger.log(`Processing research item: ${researchItemId}`)

    // Update status to 'processing'
    await this.supabase.client
      .from('research_items')
      .update({ processing_status: 'processing' })
      .eq('id', researchItemId)

    try {
      // ── Step 1: Fetch research item + attachments ────────────────────────
      await job.updateProgress(10)
      const { data: item } = await this.supabase.client
        .from('research_items')
        .select('*, research_attachments(*)')
        .eq('id', researchItemId)
        .single()

      // ── Step 2: Extract text from PDF attachments ────────────────────────
      await job.updateProgress(20)
      let attachmentTexts: string[] = []
      for (const att of item.research_attachments ?? []) {
        if (att.content_type === 'application/pdf') {
          const text = await this.textExtraction.extractPDF(att.storage_path)
          await this.supabase.client
            .from('research_attachments')
            .update({ extracted_text: text, extraction_status: 'complete' })
            .eq('id', att.id)
          attachmentTexts.push(text)
        }
      }

      // ── Step 3: Build full content for AI ────────────────────────────────
      await job.updateProgress(30)
      const fullContent = [
        item.content_text,
        ...attachmentTexts,
      ].filter(Boolean).join('\n\n---\n\n')

      // ── Step 4: Summarize ─────────────────────────────────────────────────
      await job.updateProgress(40)
      const { summary, keyPoints, tokenUsage: summaryTokens } = 
        await this.summarization.summarize(item.title, fullContent)

      // ── Step 5: Extract securities / tickers ─────────────────────────────
      await job.updateProgress(55)
      const { securities, tokenUsage: secTokens } = 
        await this.securityExtraction.extract(fullContent, item.title)

      // ── Step 6: Sentiment analysis ────────────────────────────────────────
      await job.updateProgress(70)
      // Sentiment returned per-security from extraction step above

      // ── Step 7: Auto-tag ──────────────────────────────────────────────────
      await job.updateProgress(80)
      const { tags, tokenUsage: tagTokens } = 
        await this.autoTagging.tag(fullContent, securities)

      // ── Step 8: Persist all results ───────────────────────────────────────
      await job.updateProgress(90)
      const totalTokens = summaryTokens + secTokens + tagTokens
      const estimatedCost = (totalTokens / 1_000_000) * 2.50 // GPT-4o input rate

      await this.supabase.client
        .from('research_items')
        .update({
          summary,
          key_points: keyPoints,
          processing_status: 'complete',
          processed_at: new Date().toISOString(),
          ai_tokens_used: totalTokens,
          ai_cost_usd: estimatedCost,
        })
        .eq('id', researchItemId)

      // Insert securities
      if (securities.length > 0) {
        await this.supabase.client.from('research_securities').insert(
          securities.map(s => ({
            research_item_id: researchItemId,
            ticker: s.ticker,
            security_name: s.name,
            sentiment: s.sentiment,       // 'bullish' | 'bearish' | 'neutral'
            sentiment_score: s.score,     // -1.0 to 1.0
            price_target: s.priceTarget ?? null,
            mentions: s.mentions,
            security_id: s.linkedSecurityId ?? null,  // FK to securities table
          }))
        )
      }

      // Upsert tags and create join records
      for (const tag of tags) {
        const { data: tagRecord } = await this.supabase.client
          .from('research_tags')
          .upsert({ name: tag.name, category: tag.category }, { onConflict: 'name' })
          .select('id')
          .single()

        await this.supabase.client
          .from('research_item_tags')
          .insert({ research_item_id: researchItemId, tag_id: tagRecord.id })
      }

      await job.updateProgress(100)
      this.logger.log(`Completed processing: ${researchItemId} | tokens: ${totalTokens} | cost: $${estimatedCost.toFixed(4)}`)

    } catch (err) {
      await this.supabase.client
        .from('research_items')
        .update({ processing_status: 'error', processing_error: String(err) })
        .eq('id', researchItemId)
      throw err  // BullMQ will handle retry
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ResearchProcessingJob>, error: Error) {
    this.logger.error(`Job ${job.id} failed (attempt ${job.attemptsMade}): ${error.message}`)
  }
}
```

### 3.4 Text Extraction Service (PDF)

```typescript
// services/text-extraction.service.ts
import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../../supabase/supabase.service'
import * as pdfParse from 'pdf-parse'

@Injectable()
export class TextExtractionService {
  constructor(private supabase: SupabaseService) {}

  async extractPDF(storagePath: string): Promise<string> {
    // Download from Supabase Storage
    const { data, error } = await this.supabase.client.storage
      .from('research-files')
      .download(storagePath)

    if (error) throw new Error(`Storage download failed: ${error.message}`)

    const buffer = Buffer.from(await (data as Blob).arrayBuffer())
    const result = await pdfParse(buffer, {
      max: 50,  // parse max 50 pages to cap processing time
    })

    return result.text
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100_000)  // cap at 100k chars (~25k tokens)
  }
}
```

### 3.5 Summarization Service

```typescript
// services/summarization.service.ts
import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'

interface SummarizationResult {
  summary: string
  keyPoints: string[]
  tokenUsage: number
}

const SUMMARIZATION_SYSTEM_PROMPT = `You are a senior investment analyst. 
Summarize the following research document for use in a CRM by an SEC-registered 
investment adviser. Be concise, factual, and focus on:
1. Investment thesis or key message
2. Securities mentioned and directional view
3. Key risks or catalysts
4. Time horizon if stated
Return JSON: { "summary": "string (2-4 sentences)", "keyPoints": ["string", ...] (max 5) }`

@Injectable()
export class SummarizationService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  async summarize(title: string, content: string): Promise<SummarizationResult> {
    // Truncate content to stay within context window
    const truncatedContent = content.substring(0, 60_000)

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SUMMARIZATION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Title: ${title}\n\nContent:\n${truncatedContent}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    })

    const parsed = JSON.parse(response.choices[0].message.content!)
    const tokenUsage = response.usage?.total_tokens ?? 0

    return {
      summary: parsed.summary,
      keyPoints: parsed.keyPoints ?? [],
      tokenUsage,
    }
  }
}
```

### 3.6 Security / Ticker Extraction Service

```typescript
// services/security-extraction.service.ts
import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'

// Pre-compiled regex for fast ticker candidate detection
// Matches: $NVDA, NVDA, (NVDA), "NVDA", NVDA:US
const TICKER_REGEX = /(?:\$|^|\s|\(|"')([A-Z]{1,5}(?:\.[A-Z]{1,2})?)(?::(?:US|NYSE|NQ|OTC))?(?=\s|\)|"|'|,|;|\.|\n|$)/gm

const EXTRACTION_SYSTEM_PROMPT = `Extract all financial securities mentioned in this research document.
For each security, identify:
- ticker (e.g., NVDA, BRK.B)
- company/fund name
- sentiment: "bullish", "bearish", or "neutral"
- sentiment_score: -1.0 (very bearish) to 1.0 (very bullish)
- price_target: numeric if explicitly stated, otherwise null
- mentions: count of how many times the security is mentioned
Return JSON array: [{ "ticker": "", "name": "", "sentiment": "", "sentiment_score": 0, "price_target": null, "mentions": 0 }]
Only include actual investable securities (stocks, ETFs, funds, bonds). Exclude index mentions like "S&P 500" unless as SPY/IVV etc.`

@Injectable()
export class SecurityExtractionService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  async extract(content: string, title: string): Promise<{ securities: any[]; tokenUsage: number }> {
    // Use regex to pre-screen content — reduces AI tokens needed
    const tickerCandidates = this.findTickerCandidates(content)
    const hint = tickerCandidates.length > 0
      ? `\n\nPre-detected ticker candidates (validate these): ${tickerCandidates.join(', ')}`
      : ''

    const truncated = content.substring(0, 30_000)

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Title: ${title}\n\nContent:\n${truncated}${hint}`,
        },
      ],
      temperature: 0,
      max_tokens: 800,
    })

    const parsed = JSON.parse(response.choices[0].message.content!)
    const securities = Array.isArray(parsed) ? parsed : (parsed.securities ?? [])
    const tokenUsage = response.usage?.total_tokens ?? 0

    return { securities, tokenUsage }
  }

  private findTickerCandidates(text: string): string[] {
    const matches = new Set<string>()
    const filteredWords = new Set([
      'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN',
      'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM',
      'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS',
      'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'CEO', 'CFO', 'CTO',
      'PDF', 'USD', 'EUR', 'GBP', 'YTD', 'YOY', 'QOQ', 'SEC', 'FED',
      'GDP', 'CPI', 'PPI', 'ISM', 'PMI', 'ECB', 'IMF',
    ])

    let match
    TICKER_REGEX.lastIndex = 0
    while ((match = TICKER_REGEX.exec(text)) !== null) {
      const ticker = match[1].toUpperCase()
      if (ticker.length >= 2 && ticker.length <= 5 && !filteredWords.has(ticker)) {
        matches.add(ticker)
      }
    }

    return Array.from(matches)
  }
}
```

### 3.7 Auto-Tagging Service

```typescript
// services/auto-tagging.service.ts
import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'

const TAGGING_SYSTEM_PROMPT = `Tag the following investment research document.
Apply tags from these categories:

SECTOR: Technology, Healthcare, Financials, Energy, Consumer Discretionary, 
        Consumer Staples, Industrials, Materials, Real Estate, Utilities, 
        Communication Services, Crypto/Digital Assets, Commodities

THEME: AI/Machine Learning, Rates/Fixed Income, Geopolitics, ESG/Sustainability,
       M&A Activity, Earnings Season, Macro/Economic, Inflation, China/EM,
       Semiconductors, Biotech/Pharma, Defense, Energy Transition, Fintech

ASSET_CLASS: Equities, Fixed Income, Options, Commodities, Crypto, 
             Multi-Asset, Alternatives, Real Estate

RESEARCH_TYPE: Earnings Note, Initiation, Price Target Change, 
               Macro Commentary, Sector Outlook, Company Update,
               Thematic Report, Risk Alert

Return JSON: { "tags": [{ "name": "string", "category": "SECTOR|THEME|ASSET_CLASS|RESEARCH_TYPE" }] }
Apply 2-5 tags. Only use tags from the lists above.`

@Injectable()
export class AutoTaggingService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  async tag(content: string, securities: any[]): Promise<{ tags: any[]; tokenUsage: number }> {
    const securityContext = securities.length > 0
      ? `\nKey securities: ${securities.map(s => `${s.ticker} (${s.sentiment})`).join(', ')}`
      : ''

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: TAGGING_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${content.substring(0, 20_000)}${securityContext}`,
        },
      ],
      temperature: 0,
      max_tokens: 300,
    })

    const parsed = JSON.parse(response.choices[0].message.content!)
    const tokenUsage = response.usage?.total_tokens ?? 0

    return {
      tags: parsed.tags ?? [],
      tokenUsage,
    }
  }
}
```

### 3.8 AI Cost Management

| Processing Step | Model | Avg. Tokens | Cost/Item (GPT-4o $2.50/1M input, $10/1M output) |
|---|---|---|---|
| Summarization | GPT-4o | ~3,000 in / 200 out | ~$0.009 |
| Security Extraction | GPT-4o | ~2,000 in / 300 out | ~$0.008 |
| Auto-Tagging | GPT-4o | ~1,500 in / 100 out | ~$0.005 |
| **Total per item** | — | ~6,800 tokens | **~$0.022** |

For a team receiving 20 research items/day: **~$0.44/day → ~$13/month**.

**Cost controls:**
- Cache summaries by `postmark_message_id` — deduplicate forwarded copies
- Use `gpt-4o-mini` for tagging (90% cheaper, sufficient for classification)
- Set `max_tokens` guards on all completions
- Store `ai_cost_usd` per item; alert if monthly spend exceeds configurable threshold

---

## 4. Database Schema Design

### 4.1 Complete Schema (PostgreSQL / Supabase)

```sql
-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- trigram full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- accent-insensitive search

-- ─── research_sources ────────────────────────────────────────────────────────
-- Catalog of known research senders (Goldman Sachs Research, individual analysts, etc.)
CREATE TABLE research_sources (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    domain          TEXT NOT NULL,
    source_type     TEXT NOT NULL DEFAULT 'email'  -- 'email' | 'rss' | 'api' | 'manual'
                    CHECK (source_type IN ('email', 'rss', 'api', 'manual')),
    institution     TEXT,           -- "Goldman Sachs", "Morgan Stanley", etc.
    is_trusted      BOOLEAN NOT NULL DEFAULT false,
    logo_url        TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── research_items ──────────────────────────────────────────────────────────
-- Core research record, one row per email / document ingested
CREATE TABLE research_items (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id               UUID REFERENCES research_sources(id) ON DELETE SET NULL,
    title                   TEXT NOT NULL,
    sender_email            TEXT,
    sender_name             TEXT,
    received_at             TIMESTAMPTZ NOT NULL,
    ingested_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    content_html            TEXT,
    content_text            TEXT,
    stripped_reply          TEXT,           -- Postmark StrippedTextReply
    mailbox_hash            TEXT,           -- for plus-address routing
    summary                 TEXT,           -- AI-generated summary
    key_points              TEXT[],         -- AI-extracted key points (array)
    processing_status       TEXT NOT NULL DEFAULT 'pending'
                            CHECK (processing_status IN ('pending','processing','complete','error','skipped')),
    processing_error        TEXT,
    processed_at            TIMESTAMPTZ,
    raw_storage_path        TEXT,           -- path in Supabase Storage
    postmark_message_id     TEXT UNIQUE,    -- for deduplication
    ai_tokens_used          INTEGER,
    ai_cost_usd             NUMERIC(10, 6),
    is_archived             BOOLEAN NOT NULL DEFAULT false,
    is_bookmarked           BOOLEAN NOT NULL DEFAULT false,  -- team-level bookmark
    read_count              INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full-text search index — searches title + content_text + summary simultaneously
CREATE INDEX idx_research_items_fts ON research_items
    USING GIN (
        to_tsvector('english',
            coalesce(title, '') || ' ' ||
            coalesce(content_text, '') || ' ' ||
            coalesce(summary, '')
        )
    );

-- Trigram index for ILIKE / partial-match search
CREATE INDEX idx_research_items_title_trgm ON research_items USING GIN (title gin_trgm_ops);

-- Standard performance indexes
CREATE INDEX idx_research_items_received_at ON research_items (received_at DESC);
CREATE INDEX idx_research_items_source_id ON research_items (source_id);
CREATE INDEX idx_research_items_status ON research_items (processing_status);
CREATE INDEX idx_research_items_archived ON research_items (is_archived) WHERE is_archived = false;

-- ─── research_attachments ─────────────────────────────────────────────────────
CREATE TABLE research_attachments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_item_id    UUID NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    filename            TEXT NOT NULL,
    safe_filename       TEXT NOT NULL,
    content_type        TEXT NOT NULL,
    size_bytes          INTEGER,
    storage_path        TEXT NOT NULL,      -- Supabase Storage path
    extracted_text      TEXT,               -- PDF text extraction result
    extraction_status   TEXT NOT NULL DEFAULT 'pending'
                        CHECK (extraction_status IN ('pending','processing','complete','error','not_applicable')),
    extraction_error    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_attachments_item ON research_attachments (research_item_id);

-- ─── research_tags ────────────────────────────────────────────────────────────
CREATE TABLE research_tags (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL UNIQUE,
    category    TEXT NOT NULL                    -- 'SECTOR' | 'THEME' | 'ASSET_CLASS' | 'RESEARCH_TYPE' | 'CUSTOM'
                CHECK (category IN ('SECTOR','THEME','ASSET_CLASS','RESEARCH_TYPE','CUSTOM')),
    color       TEXT,                            -- hex color for UI badges
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── research_item_tags ───────────────────────────────────────────────────────
CREATE TABLE research_item_tags (
    research_item_id    UUID NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    tag_id              UUID NOT NULL REFERENCES research_tags(id) ON DELETE CASCADE,
    applied_by          TEXT NOT NULL DEFAULT 'ai'  -- 'ai' | 'user'
                        CHECK (applied_by IN ('ai', 'user')),
    applied_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (research_item_id, tag_id)
);

CREATE INDEX idx_research_item_tags_tag ON research_item_tags (tag_id);

-- ─── research_securities ──────────────────────────────────────────────────────
-- Securities mentioned in a research item (AI-extracted)
CREATE TABLE research_securities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_item_id    UUID NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    security_id         UUID REFERENCES securities(id) ON DELETE SET NULL,  -- FK to your securities master
    ticker              TEXT NOT NULL,
    security_name       TEXT,
    sentiment           TEXT NOT NULL DEFAULT 'neutral'
                        CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
    sentiment_score     NUMERIC(4, 3),          -- -1.000 to 1.000
    price_target        NUMERIC(12, 4),
    mentions            INTEGER NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_securities_item ON research_securities (research_item_id);
CREATE INDEX idx_research_securities_ticker ON research_securities (ticker);
CREATE INDEX idx_research_securities_security_id ON research_securities (security_id) WHERE security_id IS NOT NULL;

-- ─── research_annotations ─────────────────────────────────────────────────────
-- Team member notes attached to a research item
CREATE TABLE research_annotations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_item_id    UUID NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body                TEXT NOT NULL,
    is_private          BOOLEAN NOT NULL DEFAULT false,  -- private to author vs. team-visible
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_annotations_item ON research_annotations (research_item_id);
CREATE INDEX idx_research_annotations_user ON research_annotations (user_id);

-- ─── research_actions ─────────────────────────────────────────────────────────
-- Tracks what team members did with research (acted on, shared, linked to account)
CREATE TABLE research_actions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_item_id    UUID NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type         TEXT NOT NULL
                        CHECK (action_type IN (
                            'viewed',
                            'bookmarked',
                            'shared',
                            'acted_on',         -- traded on or incorporated into advice
                            'linked_household', -- linked to a CRM household
                            'linked_account',   -- linked to a specific account
                            'dismissed',
                            'printed'
                        )),
    metadata            JSONB,                  -- { household_id, account_id, trade_id, shared_with_user_id, ... }
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_actions_item ON research_actions (research_item_id);
CREATE INDEX idx_research_actions_user ON research_actions (user_id);
CREATE INDEX idx_research_actions_type ON research_actions (action_type);

-- ─── email_ingestion_config ───────────────────────────────────────────────────
CREATE TABLE email_ingestion_config (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    is_active           BOOLEAN NOT NULL DEFAULT true,
    allowed_domains     TEXT[] NOT NULL DEFAULT '{}',       -- e.g. ['gs.com', 'morganstanley.com', 'yourfirm.com']
    allowed_emails      TEXT[] NOT NULL DEFAULT '{}',       -- specific allowed addresses
    max_attachment_mb   INTEGER NOT NULL DEFAULT 10,
    auto_tag_enabled    BOOLEAN NOT NULL DEFAULT true,
    auto_summarize_enabled BOOLEAN NOT NULL DEFAULT true,
    notify_on_ingest    BOOLEAN NOT NULL DEFAULT true,      -- Realtime push to UI
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID REFERENCES auth.users(id)
);

-- Seed with one config row
INSERT INTO email_ingestion_config (allowed_domains, allowed_emails)
VALUES ('{}', '{}');

-- ─── email_ingestion_log ──────────────────────────────────────────────────────
CREATE TABLE email_ingestion_log (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    postmark_message_id     TEXT,
    research_item_id        UUID REFERENCES research_items(id) ON DELETE SET NULL,
    status                  TEXT NOT NULL CHECK (status IN ('success', 'rejected', 'error')),
    error_message           TEXT,
    logged_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_log_status ON email_ingestion_log (status);
CREATE INDEX idx_email_log_logged_at ON email_ingestion_log (logged_at DESC);

-- ─── Row-Level Security (RLS) ─────────────────────────────────────────────────
-- All team members of the firm can read all research (no per-user data isolation)
ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_actions ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users of this Supabase project can read all research
CREATE POLICY "Authenticated team can read research"
    ON research_items FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated team can insert annotations"
    ON research_annotations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own annotations"
    ON research_annotations FOR UPDATE
    USING (auth.uid() = user_id);

-- Annotations: team can see non-private; private only visible to author
CREATE POLICY "View team annotations"
    ON research_annotations FOR SELECT
    USING (
        is_private = false OR user_id = auth.uid()
    );

-- ─── Updated_at Trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_research_items_updated_at
    BEFORE UPDATE ON research_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_research_sources_updated_at
    BEFORE UPDATE ON research_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Full-text Search Function ─────────────────────────────────────────────────
-- Callable via Supabase RPC for weighted relevance search
CREATE OR REPLACE FUNCTION search_research(
    query_text TEXT,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    summary TEXT,
    received_at TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ri.id,
        ri.title,
        ri.summary,
        ri.received_at,
        ts_rank_cd(
            setweight(to_tsvector('english', coalesce(ri.title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(ri.summary, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(ri.content_text, '')), 'C'),
            plainto_tsquery('english', query_text)
        ) AS rank
    FROM research_items ri
    WHERE
        ri.is_archived = false
        AND (
            setweight(to_tsvector('english', coalesce(ri.title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(ri.summary, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(ri.content_text, '')), 'C')
        ) @@ plainto_tsquery('english', query_text)
    ORDER BY rank DESC, ri.received_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 4.2 Entity Relationship Diagram

```
research_sources ──┐
                   │ (1:N)
                   ├──► research_items ──┬──► research_attachments
                                         ├──► research_securities ──► securities (FK)
                                         ├──► research_item_tags ──► research_tags
                                         ├──► research_annotations ◄── auth.users
                                         └──► research_actions ◄── auth.users

email_ingestion_config   (singleton config row)
email_ingestion_log ──► research_items (nullable FK)
```

---

## 5. Research Feed UI Design

### 5.1 Page Structure (Next.js 14 App Router)

```
app/
└── (dashboard)/
    └── research/
        ├── page.tsx                  ← Research Feed (list)
        ├── [id]/
        │   └── page.tsx              ← Research Detail
        ├── search/
        │   └── page.tsx              ← Full-text search results
        └── settings/
            └── page.tsx              ← Ingestion config
```

### 5.2 Research Feed Page (`/research`)

#### Component Hierarchy

```
<ResearchFeedPage>
  ├── <ResearchFeedHeader>
  │     ├── <SearchBar />                  Full-text search input (debounced 300ms)
  │     └── <FilterBar>
  │           ├── <DateRangePicker />       "Last 7d / 30d / 90d / Custom"
  │           ├── <TickerFilter />          Typeahead: filter by mentioned security
  │           ├── <TagFilter />             Multi-select tag chips
  │           ├── <SentimentFilter />       "Bullish / Bearish / Neutral" toggles
  │           ├── <SourceFilter />          Filter by sender/institution
  │           └── <StatusFilter />         "Unread / Bookmarked / Acted On"
  │
  ├── <ResearchFeedToolbar>
  │     ├── Sort: "Newest / Most Relevant / Most Active"
  │     └── View: "List / Compact / Card"
  │
  ├── <ResearchFeedList>
  │     └── <ResearchFeedItem> (repeating)
  │           ├── Source logo + sender name
  │           ├── Title (bold, truncated 2 lines)
  │           ├── Received timestamp (relative: "2h ago")
  │           ├── AI summary (1-2 lines, italic)
  │           ├── SecurityChips: [NVDA ↑] [AMD ↓] [INTC →]   (colored by sentiment)
  │           ├── TagChips: [Technology] [AI/ML] [Earnings Note]
  │           ├── <QuickActions>
  │           │     ├── 🔖 Bookmark
  │           │     ├── 📤 Share with team
  │           │     ├── ✅ Mark as acted on
  │           │     └── 🔗 Link to household
  │           └── Read indicator (blue dot if unread)
  │
  └── <InfiniteScrollTrigger />            Loads next page at scroll bottom
```

#### Feed Page Data Fetching (Next.js Server Component + Client Filters)

```typescript
// app/(dashboard)/research/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ResearchFeedClient } from './ResearchFeedClient'

export default async function ResearchFeedPage({
  searchParams,
}: {
  searchParams: { q?: string; tags?: string; ticker?: string; from?: string; to?: string; sentiment?: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  // Initial server-side fetch for SSR/SEO
  let query = supabase
    .from('research_items')
    .select(`
      id, title, summary, received_at, key_points,
      sender_name, sender_email, processing_status, is_bookmarked, read_count,
      research_sources(display_name, institution, logo_url),
      research_securities(ticker, sentiment),
      research_item_tags(research_tags(name, category, color))
    `)
    .eq('is_archived', false)
    .order('received_at', { ascending: false })
    .limit(25)

  if (searchParams.ticker) {
    query = query.contains('research_securities.ticker', [searchParams.ticker.toUpperCase()])
  }

  const { data: initialItems } = await query

  return (
    <ResearchFeedClient
      initialItems={initialItems ?? []}
      searchParams={searchParams}
    />
  )
}
```

#### Realtime New-Item Notifications

```typescript
// hooks/useResearchRealtime.ts
'use client'
import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useResearchStore } from '@/store/research'

export function useResearchRealtime() {
  const supabase = createClientComponentClient()
  const { prependItem } = useResearchStore()

  useEffect(() => {
    const channel = supabase
      .channel('research-feed')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'research_items',
          filter: 'processing_status=eq.complete',
        },
        (payload) => {
          // New research item finished processing — show toast + prepend to feed
          prependItem(payload.new)
          toast(`New research: ${payload.new.title}`)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])
}
```

### 5.3 Research Detail View (`/research/[id]`)

```
<ResearchDetailPage>
  ├── <DetailHeader>
  │     ├── Back to feed
  │     ├── Title (H1)
  │     ├── Source: "[Goldman Sachs Research]" + logo
  │     ├── Received: "Feb 27, 2026 at 10:43 AM"
  │     └── <ActionBar>
  │           ├── 🔖 Bookmark toggle
  │           ├── 📤 Share dropdown (share with team members)
  │           ├── ✅ Mark as acted on → opens trade link modal
  │           └── 🔗 Link to household → opens household search modal
  │
  ├── <AISummaryCard>
  │     ├── "AI Summary" badge
  │     ├── summary paragraph
  │     └── Key Points bulleted list
  │
  ├── <SecuritiesCard>
  │     └── Table:
  │           Ticker | Company | Sentiment | Price Target | Mentions
  │           NVDA   | NVIDIA  | ↑ Bullish | $200         | 14
  │           AMD    | AMD     | → Neutral | —            | 3
  │
  ├── <TagsCard>
  │     └── Tag chips: [Technology] [AI/ML] [Earnings Note]  + "Add tag" button
  │
  ├── <ContentCard>          (tab: "Email Body" | "Attachment")
  │     ├── Tab: Email Body  → rendered HTML or plain text
  │     └── Tab: Attachment  → PDF viewer (react-pdf) or download link
  │
  ├── <AnnotationsCard>
  │     ├── Existing annotations (avatar + name + timestamp + body)
  │     └── <AnnotationComposer>   "Add a note..." textarea → POST /annotations
  │
  └── <TeamActivityCard>
        └── Activity feed:
              [avatar] Alex viewed this  — 2h ago
              [avatar] Sam bookmarked this  — 1h ago
              [avatar] Alex marked as acted on  — 45min ago
```

### 5.4 Search Page (`/research/search?q=...`)

```
<ResearchSearchPage>
  ├── <SearchInput value={q} autoFocus />
  │
  ├── <SearchResults>          (if q.length >= 2)
  │     ├── "23 results for 'NVDA earnings'"
  │     └── <ResearchSearchResult> (repeating)
  │           ├── Title with highlighted matches
  │           ├── Summary snippet with highlighted matches
  │           ├── Matched securities chips
  │           └── Date + source
  │
  └── <SearchFilters>  (right sidebar)
        ├── Date range
        ├── Securities
        ├── Tags
        └── Source/Sender
```

**Full-text search implementation:**

```typescript
// In NestJS ResearchController
@Get('search')
async searchResearch(
  @Query('q') q: string,
  @Query('limit') limit = 20,
  @Query('offset') offset = 0,
) {
  if (!q || q.length < 2) return { data: [], count: 0 }

  // Use Supabase RPC (calls the search_research PostgreSQL function defined above)
  const { data, error } = await this.supabase.client
    .rpc('search_research', {
      query_text: q,
      limit_count: Number(limit),
      offset_count: Number(offset),
    })

  if (error) throw new InternalServerErrorException(error.message)
  return { data }
}
```

### 5.5 Quick Actions Implementation

```typescript
// components/ResearchQuickActions.tsx
'use client'

export function QuickActions({ item }: { item: ResearchItem }) {
  const { mutate: bookmark } = useBookmarkMutation()
  const { mutate: markActedOn } = useActedOnMutation()
  const { open: openShareModal } = useShareModal()
  const { open: openLinkModal } = useLinkHouseholdModal()

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => bookmark({ itemId: item.id, bookmarked: !item.is_bookmarked })}
        aria-label={item.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
      >
        <BookmarkIcon filled={item.is_bookmarked} />
      </Button>

      <Button variant="ghost" size="sm" onClick={() => openShareModal(item.id)}>
        <ShareIcon /> Share
      </Button>

      <Button variant="ghost" size="sm" onClick={() => markActedOn({ itemId: item.id })}>
        <CheckCircleIcon /> Acted On
      </Button>

      <Button variant="ghost" size="sm" onClick={() => openLinkModal(item.id)}>
        <LinkIcon /> Link
      </Button>
    </div>
  )
}
```

---

## 6. Future Phases

### Phase 2: RSS / Substack Auto-Ingestion

**Goal:** Automatically ingest content from RSS feeds (Bloomberg, Seeking Alpha, Substack newsletters, firm subscriptions) without requiring a manual forward.

**Architecture:**
```
NestJS Cron Job (every 15 minutes)
    │
    ▼
RSSPollingService.pollAll()
    │
    ├── Fetch each registered feed URL
    ├── Parse RSS/Atom XML (rss-parser library)
    ├── Check against ingested_external_ids for deduplication
    ├── For new items: fetch full HTML content (Readability.js / @mozilla/readability)
    └── Insert research_items with source_type = 'rss'
```

**New DB table:**
```sql
CREATE TABLE rss_feeds (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    url         TEXT NOT NULL UNIQUE,
    source_id   UUID REFERENCES research_sources(id),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    last_polled TIMESTAMPTZ,
    poll_interval_minutes INTEGER NOT NULL DEFAULT 60,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Phase 3: Market Data API Feeds

**Goal:** Enrich research items with live market data and ingest news from structured APIs.

**Providers:**
- **Polygon.io** — Real-time and historical equity data, news, financials. Best for tick-level data and SEC filings.
- **Alpha Vantage** — Fundamentals, earnings calendars, economic indicators. Generous free tier for small teams.
- **Schwab Developer API** — Account data, order management (already integrated as custodian). Research enrichment from Schwab Market Edge.

**Enrichment flow:**
```
research_securities.ticker
    │
    └── Polygon.io /v2/reference/news?ticker=NVDA
    └── Alpha Vantage OVERVIEW?symbol=NVDA
    └── Write to securities_enrichment table
```

### Phase 4: Research Scoring and Recommendations

**Goal:** ML-based relevance scoring that surfaces research most likely to be actionable for the team's current portfolio.

**Scoring signals:**
- Portfolio overlap: research mentions holdings in client portfolios (via Schwab positions)
- Historical action rate: team historically acted on similar research from this source
- Sentiment alignment: research sentiment vs. current portfolio position direction
- Recency decay: exponential decay on relevance score over 7 days
- Team engagement: read/bookmark/act rates on prior items from same source

**Implementation:**
```
Daily batch job (NestJS Cron, 6 AM)
    │
    ├── Pull portfolio positions from Schwab API
    ├── Fetch last 30 days of research_items
    ├── Calculate relevance scores per item per advisor
    ├── Store in research_relevance_scores table
    └── Power "Recommended for You" feed section
```

### Phase 5: Research-to-Trade Pipeline

**Goal:** Create a structured workflow from reading research → forming a thesis → creating a trade idea → generating an order.

**Workflow:**
```
Research Item
    │
    └── "Create Trade Idea" action
            │
            ▼
    trade_ideas table
    ├── linked_research_item_ids[]
    ├── thesis (text)
    ├── ticker
    ├── direction (long/short)
    ├── target_weight or target_notional
    ├── time_horizon
    ├── risk_level
    └── status: draft → approved → ordered → filled
            │
            ▼ (on approval)
    Schwab API Order Generation
    (using existing order management module)
```

---

## 7. API Endpoints

### 7.1 NestJS Controller: `ResearchController`

```typescript
// research.controller.ts
import {
  Controller, Get, Post, Put, Param, Query, Body,
  UseGuards, Request, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { InternalSecretGuard } from '../auth/internal-secret.guard'
import { ResearchService } from './research.service'

@Controller('api/research')
@UseGuards(JwtAuthGuard)
export class ResearchController {
  constructor(private researchService: ResearchService) {}

  // ──────────────────────────────────────────────────────────────────────
  // WEBHOOK — called by Supabase Edge Function after email ingestion
  // This endpoint is internal-only (no JWT; uses HMAC secret guard)
  // ──────────────────────────────────────────────────────────────────────

  @Post('processing/enqueue')
  @UseGuards(InternalSecretGuard)
  async enqueueProcessing(@Body() body: { researchItemId: string }) {
    return this.researchService.enqueueProcessing(body.researchItemId)
  }

  // ──────────────────────────────────────────────────────────────────────
  // LIST — paginated, filterable research feed
  // GET /api/research?page=1&limit=25&tags=AI/ML&ticker=NVDA&sentiment=bullish
  //                  &from=2026-01-01&to=2026-02-27&source=gs.com&bookmarked=true
  // ──────────────────────────────────────────────────────────────────────

  @Get()
  async listResearch(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Query('q') q?: string,
    @Query('tags') tags?: string,             // comma-separated
    @Query('ticker') ticker?: string,
    @Query('sentiment') sentiment?: 'bullish' | 'bearish' | 'neutral',
    @Query('from') from?: string,             // ISO date
    @Query('to') to?: string,
    @Query('source') source?: string,         // domain or source_id
    @Query('bookmarked') bookmarked?: string,
    @Query('sort') sort: 'newest' | 'oldest' | 'relevant' = 'newest',
  ) {
    return this.researchService.listResearch({
      page, limit, q, tags: tags?.split(','),
      ticker, sentiment, from, to, source,
      bookmarked: bookmarked === 'true',
      sort,
    })
  }

  // ──────────────────────────────────────────────────────────────────────
  // DETAIL
  // GET /api/research/:id
  // ──────────────────────────────────────────────────────────────────────

  @Get(':id')
  async getResearch(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    // Side effect: log 'viewed' action for this user
    await this.researchService.logAction(id, req.user.id, 'viewed')
    return this.researchService.getResearchDetail(id)
  }

  // ──────────────────────────────────────────────────────────────────────
  // ANNOTATIONS
  // POST /api/research/:id/annotations
  // ──────────────────────────────────────────────────────────────────────

  @Post(':id/annotations')
  async addAnnotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { body: string; isPrivate?: boolean },
    @Request() req,
  ) {
    return this.researchService.addAnnotation(id, req.user.id, body.body, body.isPrivate ?? false)
  }

  // ──────────────────────────────────────────────────────────────────────
  // ACTIONS (bookmark, share, acted on, link to household/account)
  // POST /api/research/:id/actions
  // ──────────────────────────────────────────────────────────────────────

  @Post(':id/actions')
  async trackAction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      actionType: 'bookmarked' | 'shared' | 'acted_on' | 'linked_household' | 'linked_account' | 'dismissed'
      metadata?: Record<string, unknown>
    },
    @Request() req,
  ) {
    return this.researchService.logAction(id, req.user.id, body.actionType, body.metadata)
  }

  // ──────────────────────────────────────────────────────────────────────
  // TAGS — replace the tag set for a research item
  // PUT /api/research/:id/tags
  // Body: { tagIds: string[] }
  // ──────────────────────────────────────────────────────────────────────

  @Put(':id/tags')
  async updateTags(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { tagIds: string[] },
  ) {
    return this.researchService.updateTags(id, body.tagIds)
  }

  // ──────────────────────────────────────────────────────────────────────
  // FULL-TEXT SEARCH
  // GET /api/research/search?q=NVDA+price+target&limit=20&offset=0
  // ──────────────────────────────────────────────────────────────────────

  @Get('search')
  async searchResearch(
    @Query('q') q: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.researchService.searchResearch(q, limit, offset)
  }

  // ──────────────────────────────────────────────────────────────────────
  // PERSONALIZED FEED
  // GET /api/research/feed?limit=25
  // Returns research items ranked by relevance to current user's portfolio
  // (Phase 4 feature — initially returns same as list sorted by newest)
  // ──────────────────────────────────────────────────────────────────────

  @Get('feed')
  async getPersonalizedFeed(
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Request() req,
  ) {
    return this.researchService.getPersonalizedFeed(req.user.id, limit)
  }
}
```

### 7.2 Endpoint Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/research/processing/enqueue` | Internal secret | Enqueue AI processing for a research item (called by Edge Function) |
| `GET` | `/api/research` | JWT | List research items with filters, pagination, and optional full-text search |
| `GET` | `/api/research/search?q=...` | JWT | Full-text search with PostgreSQL `ts_rank_cd` weighted scoring |
| `GET` | `/api/research/feed` | JWT | Personalized relevance-ranked feed (Phase 4+) |
| `GET` | `/api/research/:id` | JWT | Research item detail with all relations; side-effects `viewed` action |
| `POST` | `/api/research/:id/annotations` | JWT | Add a team annotation (note) to a research item |
| `PUT` | `/api/research/:id/annotations/:annotId` | JWT (owner) | Edit an annotation |
| `DELETE` | `/api/research/:id/annotations/:annotId` | JWT (owner) | Delete an annotation |
| `POST` | `/api/research/:id/actions` | JWT | Log an action (bookmark, share, acted_on, link, dismiss) |
| `PUT` | `/api/research/:id/tags` | JWT | Replace tag set on a research item |
| `GET` | `/api/research/tags` | JWT | List all available tags for filter UI |
| `GET` | `/api/research/sources` | JWT | List all ingestion sources |
| `GET` | `/api/research/config` | JWT (admin) | Get ingestion configuration |
| `PUT` | `/api/research/config` | JWT (admin) | Update ingestion configuration (allowlist, toggles) |
| `GET` | `/api/research/log` | JWT (admin) | Ingestion audit log with status and errors |

---

## 8. Security & Compliance

### 8.1 Email Forwarding Security

#### Sender Allowlisting

The `email_ingestion_config.allowed_domains` array is the first line of defense. Any email from an unlisted domain is silently discarded with a 200 response (to avoid Postmark retries revealing which senders are blocked).

**Recommended initial allowlist:**
```sql
UPDATE email_ingestion_config SET
    allowed_domains = ARRAY[
        'youradvisoryfirm.com',       -- internal team
        'gs.com',                     -- Goldman Sachs Research
        'morganstanley.com',          -- Morgan Stanley
        'jpmorgan.com',               -- JP Morgan
        'ml.com',                     -- Merrill Lynch
        'bcaresearch.com',            -- BCA Research
        'factset.com',                -- FactSet
        'schwab.com'                  -- Charles Schwab
    ],
    allowed_emails = ARRAY[
        'advisor1@youradvisoryfirm.com',
        'analyst1@youradvisoryfirm.com'
    ];
```

#### DKIM / SPF Validation

Postmark provides `X-Spam-Status` and `X-Spam-Score` headers and validates DKIM/SPF automatically. The Edge Function should reject emails where `X-Spam-Status = Yes` or score > 5.0.

```typescript
// In Edge Function: check spam headers
const spamHeader = payload.Headers.find(h => h.Name === 'X-Spam-Status')
const spamScore = parseFloat(
  payload.Headers.find(h => h.Name === 'X-Spam-Score')?.Value ?? '0'
)
if (spamHeader?.Value === 'Yes' || spamScore > 5.0) {
  await logIngestionEvent(supabase, payload.MessageID, 'rejected', `Spam detected: score ${spamScore}`)
  return new Response('OK', { status: 200 })
}
```

#### Rate Limiting

```typescript
// Supabase Edge Function rate limiting via a simple Redis-backed counter
// (or use Supabase's built-in function rate limiting in project settings)

// Edge Function settings → Rate limits:
// Max requests per second: 10
// Max burst: 20

// Additionally, in the Edge Function logic:
const RATE_LIMIT_PER_SENDER = 50 // max 50 emails per sender per hour
```

#### Webhook Signature Verification

Postmark signs each webhook POST with HMAC-SHA256 using your `POSTMARK_WEBHOOK_TOKEN`. The Edge Function verifies this before processing any payload (see implementation in Section 2.3 above). **Never skip this verification.**

### 8.2 SEC Rule 204-2 Compliance

Rule 204-2 of the Investment Advisers Act of 1940 requires SEC-registered investment advisers to maintain records of communications relating to recommendations, advice, and securities transactions for a minimum of **5 years** (first 2 years in principal office or immediately accessible, remaining 3 years in an accessible location).

#### Retention Policy Implementation

```sql
-- research_items are never hard-deleted; they are soft-archived
-- A background job flags items for deletion review after 5 years + 6 months buffer
-- Deletion requires explicit compliance officer approval

-- Retention policy flag
ALTER TABLE research_items ADD COLUMN
    retention_expires_at TIMESTAMPTZ
    GENERATED ALWAYS AS (received_at + INTERVAL '5 years 6 months') STORED;

ALTER TABLE research_items ADD COLUMN
    retention_review_required BOOLEAN NOT NULL DEFAULT false;

-- Nightly job: flag items approaching expiration for compliance review
CREATE OR REPLACE FUNCTION flag_retention_review()
RETURNS void AS $$
BEGIN
    UPDATE research_items SET retention_review_required = true
    WHERE retention_expires_at <= now() + INTERVAL '30 days'
    AND retention_review_required = false;
END;
$$ LANGUAGE plpgsql;
```

#### WORM-Compliant Storage

The raw email JSON and attachments stored in Supabase Storage must be treated as write-once. Implement bucket policies:

```typescript
// In Supabase Storage bucket config (set via Dashboard or API):
// Bucket: "research-emails"   → public: false, file size limit: 50MB
// Bucket: "research-files"    → public: false, file size limit: 25MB

// RLS policy: authenticated users can READ but NOT DELETE from these buckets
// Deletion should only be possible via service role key + compliance workflow

// Storage bucket policy (via Supabase SQL Editor):
CREATE POLICY "Team can read research emails"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'research-emails' AND auth.role() = 'authenticated');

-- No DELETE policy granted to authenticated users; only service role can delete
-- This provides pseudo-WORM compliance; for full WORM compliance, consider
-- Supabase + Wasabi WORM-enabled object storage (future Phase)
```

#### Immutable Audit Trail

```sql
-- email_ingestion_log and research_actions are append-only
-- No UPDATE or DELETE policies granted on these tables

-- Additional audit: track all read access
CREATE POLICY "Insert-only audit log"
    ON research_actions FOR INSERT
    WITH CHECK (true);  -- anyone can insert actions

-- Explicitly no UPDATE or DELETE policies on research_actions
-- This ensures the audit trail cannot be modified
```

#### Compliance Checklist

| Requirement | Implementation | Status |
|---|---|---|
| Retain records ≥ 5 years | `retention_expires_at` column; soft-delete only | ✅ Implemented |
| First 2 years immediately accessible | Supabase hot storage (default); no archival tier for 24 months | ✅ Implemented |
| Communications re: recommendations | All forwarded research emails captured via ingestion pipeline | ✅ Implemented |
| Original format preservation | Raw email JSON + attachments stored in Supabase Storage | ✅ Implemented |
| Prevent unauthorized alteration | No UPDATE/DELETE on storage buckets or audit tables for non-service-role | ✅ Implemented |
| Readily available for SEC examination | Full-text search + filter by date range + export | ✅ Implemented |
| Duplicate copy of records | Supabase automatically replicates across availability zones | ✅ (Supabase managed) |

### 8.3 Audit Trail for Research Access

Every view, bookmark, annotation, share, and "acted on" event is written to `research_actions`. This creates a complete audit trail for SEC examination that demonstrates:

- Which team members read which research
- What research influenced trading decisions (`acted_on` action type)
- When research was accessed relative to trades executed

**Exportable audit report query:**
```sql
SELECT
    ri.title,
    ri.sender_email,
    ri.received_at,
    u.email AS team_member,
    ra.action_type,
    ra.metadata,
    ra.created_at AS action_timestamp
FROM research_actions ra
JOIN research_items ri ON ri.id = ra.research_item_id
JOIN auth.users u ON u.id = ra.user_id
WHERE ra.created_at BETWEEN :start_date AND :end_date
ORDER BY ra.created_at DESC;
```

### 8.4 Encryption at Rest

Supabase PostgreSQL and Storage are encrypted at rest using AES-256 by default (managed by Supabase / AWS). For additional protection of especially sensitive research (e.g., material non-public information flags):

```typescript
// For MNPI-flagged items, encrypt the content_text and summary
// using a per-tenant key stored in Supabase Vault

// In NestJS ResearchService, before INSERT:
import { createCipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = Buffer.from(process.env.RESEARCH_ENCRYPTION_KEY!, 'hex') // 32-byte key

function encryptSensitiveField(plaintext: string): { ciphertext: string; iv: string } {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    ciphertext: Buffer.concat([encrypted, tag]).toString('base64'),
    iv: iv.toString('hex'),
  }
}
```

### 8.5 Access Control

```
Role: advisor (default)
  - READ: all research_items, research_sources, research_tags, research_securities
  - READ: team annotations (non-private)
  - READ/WRITE: own annotations
  - WRITE: research_actions (own actions only)
  - WRITE: tags on research items

Role: admin (firm admin / compliance officer)
  - All advisor permissions
  - READ/WRITE: email_ingestion_config
  - READ: email_ingestion_log (full audit log)
  - WRITE: soft-delete (is_archived = true) on research_items
  - READ: retention review queue
  - EXECUTE: retention_review workflow
```

### 8.6 Environment Variable Reference

```bash
# Supabase (set in NestJS .env)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-side only, never expose to client
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Email
POSTMARK_SERVER_API_TOKEN=<postmark-server-token>
POSTMARK_WEBHOOK_TOKEN=<postmark-webhook-hmac-token>

# AI
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...   # alternative provider

# Queue (Redis for Bull)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>   # required in production

# Internal
INTERNAL_API_SECRET=<256-bit-random-hex>   # shared between Edge Function and NestJS
RESEARCH_ENCRYPTION_KEY=<64-char-hex>       # for MNPI field encryption

# Charles Schwab API (existing integration)
SCHWAB_CLIENT_ID=...
SCHWAB_CLIENT_SECRET=...
```

---

## Appendix A: Key Dependencies

```json
{
  "nestjs-backend": {
    "@nestjs/bullmq": "^10.x",
    "bullmq": "^5.x",
    "ioredis": "^5.x",
    "pdf-parse": "^1.1.1",
    "openai": "^4.x",
    "@supabase/supabase-js": "^2.x"
  },
  "supabase-edge-functions": {
    "deno_std": "0.208.0",
    "@supabase/supabase-js": "esm.sh version"
  },
  "nextjs-frontend": {
    "@supabase/auth-helpers-nextjs": "^0.x",
    "react-pdf": "^7.x",
    "react-query": "^5.x (TanStack Query)"
  }
}
```

## Appendix B: Local Development Setup

```bash
# 1. Start Supabase locally
supabase start

# 2. Run Edge Function locally (points to local Supabase)
supabase functions serve ingest-research-email --env-file .env.local

# 3. Use ngrok or smee.io to expose localhost to Postmark
ngrok http 54321

# 4. Update Postmark webhook URL to ngrok URL:
# https://abc123.ngrok.io/functions/v1/ingest-research-email

# 5. Test with a forwarded email:
curl -X POST http://localhost:54321/functions/v1/ingest-research-email \
  -H "Content-Type: application/json" \
  -H "X-Postmark-Signature: <computed-hmac>" \
  -d @test/fixtures/sample-postmark-payload.json

# 6. Start Redis (for Bull queue)
docker run -d -p 6379:6379 redis:alpine

# 7. Start NestJS
npm run start:dev
```

---

*This document is implementation-ready. All code snippets are TypeScript-first, Supabase-native, and designed for the stated NestJS 10 + Next.js 14 stack. Refer to inline TODO comments in code for items requiring environment-specific configuration.*
