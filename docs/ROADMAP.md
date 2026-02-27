# Wealth Management CRM — Master Implementation Roadmap

> **Repository:** [cooptaylor1-rgb/CRM](https://github.com/cooptaylor1-rgb/CRM)
> **Created:** 2026-02-27 | **Target Completion:** 12 weeks (Week of May 22, 2026)
> **Team:** 2–5 advisors/analysts | **Custodian:** Charles Schwab
---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State vs Target State](#2-current-state-vs-target-state)
3. [Three Workstreams](#3-three-workstreams)
4. [Task Breakdown](#4-task-breakdown)
   - [Workstream 1: Supabase Migration](#workstream-1-supabase-migration)
   - [Workstream 2: Schwab API Integration](#workstream-2-schwab-api-integration)
   - [Workstream 3: Research Ingestion Engine](#workstream-3-research-ingestion-engine)
5. [Cross-Cutting Concerns](#5-cross-cutting-concerns)
6. [Dependencies and Risk Register](#6-dependencies-and-risk-register)
7. [Acceptance Criteria Master List](#7-acceptance-criteria-master-list)
8. [Gantt Chart](#8-gantt-chart)
9. [API Inventory](#9-api-inventory)
10. [Tech Debt Resolution Plan](#10-tech-debt-resolution-plan)

---

## 1. Executive Summary

This roadmap covers a 12-week implementation to upgrade the Wealth Management CRM from its current state to a world-class portfolio management, investment research, and client collaboration platform.

**The three workstreams run in parallel:**

| # | Workstream | Weeks | Scope |
|---|-----------|-------|-----------|
| 1 | **Supabase Migration** | 1–6 | Replace custom auth + self-hosted PostgreSQL with Supabase Auth + hosted PostgreSQL + Realtime |
| 2 | **Schwab API Live Integration** | 2–8 | Replace mock data with live Charles Schwab brokerage data via OAuth 2.0 |
| 3 | **Research Ingestion Engine** | 3–10 | Email → AI processing → semantic search for investment research |

**Success = production-ready system at end of Week 12 with:**
- All clients authenticated via Supabase (no custom session handling)
- Live portfolio data from Schwab (accounts, positions, orders, quotes)
- Research ingestion processing 50+ emails/day with AI summarization + full-text search

---

## 2. Current State vs Target State

### Current State

```
Auth:      Custom JWT → passport-jwt → NestJS guards
Database:  Self-hosted PostgreSQL (no RLS, manual migrations)
Portfolio: Mock data (hardcoded JSON fixtures)
Research:  None (manual PDF uploads only)
Realtime:  None (polling every 30s)
```

### Target State

```
Auth:      Supabase Auth (magic link + OAuth) → JWT → NestJS RLS-aware service layer
Database:  Supabase PostgreSQL (58 tables, 145 RLS policies, 120+ indexes)
Portfolio: Live Schwab API (OAuth 2.0, accounts, positions, orders, streaming quotes)
Research:  Email → Postmark Inbound → NestJS webhook → AI pipeline → pgvector search
Realtime:  Supabase Realtime channels (portfolio changes, alerts, collaboration)
```

---

## 3. Three Workstreams

### Workstream 1: Supabase Migration (Weeks 1–6)

**Goal:** Migrate authentication, database, and real-time to Supabase.

**Phases:**
- **Phase 1 (Weeks 1–2):** Supabase project setup, schema migration, RLS policies
- **Phase 2 (Weeks 3–4):** Auth migration (custom JWT → Supabase Auth), guard refactor
- **Phase 3 (Weeks 5–6):** Realtime subscriptions, storage buckets, Edge Functions

**Key Deliverables:**
1. Supabase project provisioned with all 58 tables + 145 RLS policies
2. All NestJS guards updated to use Supabase JWT
3. All frontend auth flows updated (login, signup, magic link, OAuth)
4. Realtime channels for portfolio updates, alerts, and collaboration
5. Storage buckets for document uploads with scoped access

---

### Workstream 2: Schwab API Live Integration (Weeks 2–8)

**Goal:** Replace all mock/fixture data with live Charles Schwab brokerage data.

**Phases:**
- **Phase 1 (Weeks 2–3):** OAuth 2.0 flow, token management, base API client
- **Phase 2 (Weeks 4–5):** Account data (accounts, positions, balances)
- **Phase 3 (Weeks 6–7):** Order management (place, modify, cancel, history)
- **Phase 4 (Week 8):** Market data streaming (WebSocket quotes, option chains)

**Key Deliverables:**
1. Schwab OAuth 2.0 flow (authorize → callback → token store)
2. Token refresh daemon (auto-refresh 30min before expiry)
3. AccountService: accounts, positions, balances (live)
4. OrderService: full order lifecycle
5. MarketDataService: quotes, option chains, fundamentals
6. StreamingService: WebSocket for real-time quotes
7. SyncService: background job to keep portfolio table in sync

---

### Workstream 3: Research Ingestion Engine (Weeks 3–10)

**Goal:** Build an automated pipeline from email → AI processing → semantic search.

**Phases:**
- **Phase 1 (Weeks 3–4):** Email ingestion via Postmark, webhook receiver, storage
- **Phase 2 (Weeks 5–6):** AI processing (summarization, ticker extraction, sentiment)
- **Phase 3 (Weeks 7–8):** Full-text + vector search, tagging UI
- **Phase 4 (Weeks 9–10):** Compliance features (retention, audit log), alerting

**Key Deliverables:**
1. Postmark inbound webhook (receives forwarded research emails)
2. ResearchEmail storage model (raw email + attachments)
3. AI processing pipeline (6 stages)
4. Full-text search (PostgreSQL tsvector with weighted columns)
5. pgvector semantic search
6. Research tagging and linking to positions/clients
7. 5-year retention + SEC Rule 204-2 audit log

---

## 4. Task Breakdown

### Workstream 1: Supabase Migration

#### WS1-T1: Supabase Project Setup

**Week:** 1 | **Effort:** 1 day | **Owner:** Backend Lead

**Tasks:**
- [ ] Create Supabase project (prod + staging environments)
- [ ] Configure custom domain (e.g., `db.yourdomain.com`)
- [ ] Set environment variables in NestJS (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`)
- [ ] Install `@supabase/supabase-js` v2 in NestJS and Next.js
- [ ] Create Supabase client module in NestJS (singleton with service role key)
- [ ] Create Supabase browser client in Next.js (with anon key)
- [ ] Enable Supabase Auth (email/password, magic link, Google OAuth)
- [ ] Configure Auth email templates (confirm, magic link, reset)

**Acceptance Criteria:**
- [ ] `supabase.auth.signInWithOtp()` returns session in staging
- [ ] `supabase.from('test').select()` returns data in staging
- [ ] NestJS SupabaseModule bootstraps without errors

---

#### WS1-T2: Database Schema Migration

**Week:** 1–2 | **Effort:** 2 days | **Owner:** Backend Lead + DBA

**Tasks:**
- [ ] Run `supabase_schema.sql` against new Supabase project
- [ ] Verify all 58 tables created successfully
- [ ] Verify all 145 RLS policies active
- [ ] Verify all 120+ indexes created
- [ ] Run data migration script (existing PostgreSQL → Supabase)
- [ ] Validate data integrity (row counts, foreign keys, constraints)
- [ ] Set up Supabase migrations directory (`/supabase/migrations/`)
- [ ] Configure `supabase db push` in CI/CD pipeline

**Acceptance Criteria:**
- [ ] All 58 tables exist in Supabase
- [ ] `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'` returns 58
- [ ] Row counts match between legacy PostgreSQL and Supabase for all tables
- [ ] All foreign key constraints pass `pg_constraint` check

---

#### WS1-T3: RLS Policy Verification

**Week:** 2 | **Effort:** 1 day | **Owner:** Backend Lead

**Tasks:**
- [ ] Test each RLS policy with `set role authenticated; set local "request.jwt.claims" to '<jwt>';`
- [ ] Verify multi-tenant isolation: User A cannot see User B's data
- [ ] Verify firm-level isolation: Advisor can only see their firm's data
- [ ] Test service role bypass (admin operations)
- [ ] Document any RLS policy failures and fixes

**Acceptance Criteria:**
- [ ] 0 cross-tenant data leaks in RLS test suite
- [ ] Service role can bypass RLS (admin access works)
- [ ] All 145 policies tested with passing/failing JWT scenarios

---

#### WS1-T4: NestJS Auth Guard Refactor

**Week:** 3 | **Effort:** 2 days | **Owner:** Backend Lead

**Tasks:**
- [ ] Replace `passport-jwt` with Supabase JWT verification
- [ ] Update `AuthGuard` to call `supabase.auth.getUser(token)` for JWT validation
- [ ] Update `CurrentUser` decorator to extract user from Supabase session
- [ ] Update all NestJS controllers that use `@UseGuards(AuthGuard)`
- [ ] Update RLS context: set `request.jwt.claims` before each DB query
- [ ] Remove `passport`, `passport-jwt`, `@nestjs/passport` dependencies

**Acceptance Criteria:**
- [ ] All protected endpoints return 401 for expired/invalid JWTs
- [ ] `@CurrentUser()` returns correct user ID from Supabase session
- [ ] RLS policies are correctly applied for all authenticated requests
- [ ] No remaining `passport-jwt` imports in codebase

---

#### WS1-T5: Next.js Auth Flow Migration

**Week:** 3–4 | **Effort:** 2 days | **Owner:** Frontend Lead

**Tasks:**
- [ ] Replace custom login page with Supabase Auth UI (or custom with `supabase.auth` calls)
- [ ] Implement magic link flow (`supabase.auth.signInWithOtp`)
- [ ] Implement Google OAuth flow (`supabase.auth.signInWithOAuth`)
- [ ] Update session management (use `@supabase/ssr` for server-side session)
- [ ] Update middleware to check Supabase session for protected routes
- [ ] Update `useUser()` hook to use Supabase session
- [ ] Handle auth state changes (`supabase.auth.onAuthStateChange`)
- [ ] Update logout flow (`supabase.auth.signOut` + clear cookies)

**Acceptance Criteria:**
- [ ] Magic link email received and working end-to-end
- [ ] Google OAuth flow completes and returns session
- [ ] Protected pages redirect to login if no Supabase session
- [ ] Session persists across page refreshes (cookie-based)
- [ ] Logout clears session on both client and server

---

#### WS1-T6: Supabase Realtime Integration

**Week:** 5 | **Effort:** 2 days | **Owner:** Full-Stack Lead

**Tasks:**
- [ ] Replace polling-based portfolio updates with Supabase Realtime
- [ ] Subscribe to `portfolio_positions` changes (INSERT, UPDATE, DELETE)
- [ ] Subscribe to `alerts` table for new alert notifications
- [ ] Subscribe to `client_notes` for collaboration (multi-advisor editing)
- [ ] Implement presence tracking for "who's viewing this client" feature
- [ ] Configure Realtime RLS (use `private` channel mode)
- [ ] Add reconnection logic for dropped connections

**Acceptance Criteria:**
- [ ] Position changes reflect in UI within 500ms (no polling)
- [ ] Alert badge updates in real-time without page refresh
- [ ] Two advisors editing the same note see each other's cursor (presence)
- [ ] Realtime channels respect RLS (User A cannot subscribe to User B's data)

---

#### WS1-T7: Supabase Storage Integration

**Week:** 5–6 | **Effort:** 1 day | **Owner:** Backend Lead

**Tasks:**
- [ ] Create storage buckets: `research-documents`, `client-documents`, `profile-images`
- [ ] Configure bucket RLS policies (user can only access their bucket paths)
- [ ] Update document upload flow to use `supabase.storage.from('research-documents').upload()`
- [ ] Update document download/preview to use signed URLs
- [ ] Migrate existing documents from legacy storage to Supabase Storage

**Acceptance Criteria:**
- [ ] File upload returns a Supabase Storage URL
- [ ] Signed URLs expire after 1 hour
- [ ] Cross-tenant file access returns 403
- [ ] Existing documents accessible via new Supabase URLs

---

#### WS1-T8: Supabase Edge Functions

**Week:** 6 | **Effort:** 1 day | **Owner:** Backend Lead

**Tasks:**
- [ ] Create Edge Function: `schwab-token-refresh` (triggered by cron)
- [ ] Create Edge Function: `research-email-webhook` (receives Postmark webhook)
- [ ] Create Edge Function: `alert-processor` (triggered by DB INSERT on alerts table)
- [ ] Deploy Edge Functions to Supabase project
- [ ] Configure Edge Function secrets (API keys, tokens)

**Acceptance Criteria:**
- [ ] `schwab-token-refresh` runs on schedule without errors
- [ ] `research-email-webhook` receives and stores Postmark payloads
- [ ] `alert-processor` triggers within 1s of new alert INSERT

---

### Workstream 2: Schwab API Integration

#### WS2-T1: Schwab OAuth 2.0 Setup

**Week:** 2 | **Effort:** 1 day | **Owner:** Backend Lead

**Tasks:**
- [ ] Register application at [Schwab Developer Portal](https://developer.schwab.com)
- [ ] Configure OAuth redirect URI (`/api/schwab/oauth/callback`)
- [ ] Store `SCHWAB_CLIENT_ID`, `SCHWAB_CLIENT_SECRET` in environment
- [ ] Implement `GET /api/schwab/oauth/authorize` — redirect to Schwab OAuth
- [ ] Implement `GET /api/schwab/oauth/callback` — exchange code for tokens
- [ ] Store tokens in `schwab_oauth_tokens` table (encrypted)
- [ ] Implement token refresh logic (auto-refresh 30min before expiry)

**Acceptance Criteria:**
- [ ] OAuth flow completes end-to-end in staging
- [ ] Access token stored and retrievable from DB
- [ ] Token refresh runs automatically without manual intervention
- [ ] Token decryption works correctly for API calls

---

#### WS2-T2: Schwab Base HTTP Client

**Week:** 2–3 | **Effort:** 1 day | **Owner:** Backend Lead

**Tasks:**
- [ ] Create `SchwabApiClient` with axios instance (base URL, interceptors)
- [ ] Add request interceptor to inject `Authorization: Bearer <token>`
- [ ] Add response interceptor for 401 (token expired → refresh → retry)
- [ ] Add rate limiting middleware (150 req/min Schwab limit)
- [ ] Add circuit breaker (open after 5 failures, half-open after 60s)
- [ ] Add request logging (log all Schwab API calls to `schwab_api_logs`)

**Acceptance Criteria:**
- [ ] 401 responses automatically trigger token refresh and request retry
- [ ] Rate limiter rejects requests above 150/min with 429
- [ ] Circuit breaker opens after 5 consecutive failures
- [ ] All API calls logged with response time and status code

---

#### WS2-T3: Account Data Integration

**Week:** 4 | **Effort:** 2 days | **Owner:** Backend Lead

**Tasks:**
- [ ] Implement `GET /api/schwab/accounts` — list all linked accounts
- [ ] Implement `GET /api/schwab/accounts/:accountId` — single account detail
- [ ] Implement `GET /api/schwab/accounts/:accountId/positions` — positions list
- [ ] Store accounts in `schwab_accounts` table
- [ ] Store positions in `portfolio_positions` table (upsert on each sync)
- [ ] Map Schwab position fields to internal schema
- [ ] Implement SyncService: run full sync every 5 minutes via cron

**Acceptance Criteria:**
- [ ] Accounts endpoint returns live data from Schwab (not fixtures)
- [ ] Positions endpoint returns live positions with market values
- [ ] Sync service runs every 5 minutes without errors
- [ ] Portfolio table matches Schwab account data within 5 minutes

---

#### WS2-T4: Order Management

**Week:** 5–6 | **Effort:** 3 days | **Owner:** Backend Lead + Frontend

**Tasks:**
- [ ] Implement `POST /api/orders` — place new order
- [ ] Implement `GET /api/orders` — list orders (with filters)
- [ ] Implement `GET /api/orders/:orderId` — order detail
- [ ] Implement `PUT /api/orders/:orderId` — modify order
- [ ] Implement `DELETE /api/orders/:orderId` — cancel order
- [ ] Map all Schwab order types (Market, Limit, Stop, StopLimit, etc.)
- [ ] Store order history in `orders` table
- [ ] Add order compliance check (pre-trade compliance rules)

**Acceptance Criteria:**
- [ ] Market order placed and confirmed via Schwab API
- [ ] Limit order placed, modified, and cancelled via Schwab API
- [ ] Order history synced from Schwab to orders table
- [ ] Pre-trade compliance check blocks restricted securities

---

#### WS2-T5: Market Data & Quotes

**Week:** 6–7 | **Effort:** 2 days | **Owner:** Backend Lead

**Tasks:**
- [ ] Implement `GET /api/quotes?symbols=AAPL,MSFT` — real-time quotes
- [ ] Implement `GET /api/options/:symbol` — option chain
- [ ] Implement `GET /api/fundamentals/:symbol` — company fundamentals
- [ ] Cache quotes in Redis (TTL: 15 seconds for live, 5min for delayed)
- [ ] Implement quote history (OHLCV for charts)

**Acceptance Criteria:**
- [ ] Quote endpoint returns live market data (bid/ask/last/volume)
- [ ] Option chain returns all strikes and expiries for a symbol
- [ ] Cache hit rate > 80% for quote requests
- [ ] Chart data returns correct OHLCV for requested date range

---

#### WS2-T6: WebSocket Streaming

**Week:** 7–8 | **Effort:** 3 days | **Owner:** Full-Stack Lead

**Tasks:**
- [ ] Implement Schwab streaming WebSocket client (NestJS)
- [ ] Subscribe to `QUOTE` service for real-time price updates
- [ ] Subscribe to `ACCT_ACTIVITY` for account/order events
- [ ] Bridge Schwab WebSocket → Supabase Realtime (forward events to subscribed clients)
- [ ] Implement reconnection with exponential backoff
- [ ] Handle heartbeat messages

**Acceptance Criteria:**
- [ ] Price updates arrive in browser within 1s of Schwab WebSocket message
- [ ] Account activity events (order fills) appear in UI in real-time
- [ ] WebSocket reconnects automatically after disconnect
- [ ] Streaming handles 100+ simultaneous symbol subscriptions

---

### Workstream 3: Research Ingestion Engine

#### WS3-T1: Postmark Inbound Webhook

**Week:** 3 | **Effort:** 1 day | **Owner:** Backend Lead

**Tasks:**
- [ ] Set up Postmark account and inbound domain (`research@yourcrm.com`)
- [ ] Implement `POST /api/research/inbound` — Postmark webhook receiver
- [ ] Validate Postmark webhook signature
- [ ] Parse email: from, to, subject, body (text + HTML), attachments
- [ ] Store raw email in `research_emails` table
- [ ] Store attachments in Supabase Storage (`research-documents` bucket)
- [ ] Queue AI processing job (BullMQ)

**Acceptance Criteria:**
- [ ] Forwarded email received and stored in `research_emails` within 30s
- [ ] Attachment stored in Supabase Storage with correct MIME type
- [ ] AI processing job queued immediately after email storage
- [ ] Webhook signature validation rejects unauthorized requests

---

#### WS3-T2: AI Processing Pipeline

**Week:** 5–6 | **Effort:** 3 days | **Owner:** Backend Lead + AI Engineer

**Tasks:**
- [ ] Stage 1: Clean email body (strip HTML, remove footers, normalize whitespace)
- [ ] Stage 2: OpenAI GPT-4o summarization (3-sentence summary + key points)
- [ ] Stage 3: Ticker extraction (regex + GPT cross-validation)
- [ ] Stage 4: Sentiment analysis (Bullish/Neutral/Bearish per ticker)
- [ ] Stage 5: Category classification (Earnings, M&A, Macro, Technical, etc.)
- [ ] Stage 6: Embedding generation (OpenAI `text-embedding-3-small` → store in pgvector)
- [ ] Implement BullMQ queue with retry (3 attempts, exponential backoff)
- [ ] Store results in `research_emails.ai_*` columns

**Acceptance Criteria:**
- [ ] Summary generated for 95%+ of emails (excluding blank/spam)
- [ ] Ticker extraction accuracy > 90% vs manual check of 50 emails
- [ ] Sentiment classification accuracy > 85% vs manual check
- [ ] pgvector embedding stored for every processed email
- [ ] Failed jobs retried 3 times before moving to dead-letter queue

---

#### WS3-T3: Search Implementation

**Week:** 7 | **Effort:** 2 days | **Owner:** Backend Lead + Frontend

**Tasks:**
- [ ] Implement full-text search (`GET /api/research/search?q=earnings`)
- [ ] Use PostgreSQL `tsvector` with weights: title A, summary B, body C
- [ ] Implement semantic search (pgvector cosine similarity)
- [ ] Combine FTS + semantic search with RRF (Reciprocal Rank Fusion)
- [ ] Add search filters: date range, tickers, category, sentiment, source
- [ ] Implement search result highlighting (ts_headline)
- [ ] Add search suggestions (autocomplete)

**Acceptance Criteria:**
- [ ] Full-text search returns results in < 200ms for 10K+ emails
- [ ] Semantic search finds conceptually related emails even without keyword match
- [ ] Filters correctly narrow results
- [ ] Search highlighting shows matched terms in context

---

#### WS3-T4: Research UI

**Week:** 7–8 | **Effort:** 3 days | **Owner:** Frontend Lead

**Tasks:**
- [ ] Build research inbox (list view with filters, pagination)
- [ ] Build research detail page (full email, AI summary, tickers, sentiment)
- [ ] Build tagging interface (manually tag research with tickers/clients/categories)
- [ ] Build research-to-position linking ("link this note to AAPL position")
- [ ] Add research search bar with instant results
- [ ] Add research source management (manage which email senders are "research sources")

**Acceptance Criteria:**
- [ ] Research inbox loads in < 500ms
- [ ] Tagging saves immediately without page reload
- [ ] Position linking appears in position detail page
- [ ] Search results update as user types (debounced 300ms)

---

#### WS3-T5: Compliance & Retention

**Week:** 9 | **Effort:** 2 days | **Owner:** Backend Lead + Compliance

**Tasks:**
- [ ] Implement 5-year retention policy (auto-archive after 5 years)
- [ ] Create audit log for all research access (who viewed what when)
- [ ] Implement SEC Rule 204-2 export (generate compliance report)
- [ ] Add "do not delete" flag for compliance holds
- [ ] Implement WORM-like behavior for compliance records

**Acceptance Criteria:**
- [ ] Archived emails inaccessible to normal users but readable by compliance role
- [ ] Audit log captures every view event with user ID, timestamp, email ID
- [ ] Compliance report export generates CSV/PDF with all required fields
- [ ] Compliance holds prevent deletion

---

#### WS3-T6: Alert Engine

**Week:** 10 | **Effort:** 2 days | **Owner:** Full-Stack Lead

**Tasks:**
- [ ] Implement alert rules: "notify me when research on AAPL arrives"
- [ ] Implement alert delivery: in-app (Supabase Realtime) + email (Postmark)
- [ ] Build alert management UI (create, edit, delete alerts)
- [ ] Add digest mode (daily summary of new research)

**Acceptance Criteria:**
- [ ] Alert fires within 60s of matching email ingestion
- [ ] In-app notification delivered via Supabase Realtime
- [ ] Email alert delivered via Postmark within 5 minutes
- [ ] Digest email sent at configured time (default: 8am)

---

## 5. Cross-Cutting Concerns

### 5.1 Testing Strategy

| Layer | Framework | Coverage Target |
|-------|-----------|----------------|
| Unit (NestJS services) | Jest | 80% |
| Integration (API endpoints) | Jest + supertest | All endpoints |
| E2E (critical flows) | Playwright | Auth, order flow, research search |
| RLS (database policies) | pgTAP | All 145 policies |

### 5.2 Observability

- **Application logs:** Winston → structured JSON → Datadog/CloudWatch
- **API metrics:** Custom NestJS interceptor → Prometheus → Grafana
- **Schwab API:** Log all calls to `schwab_api_logs` table (latency, status, errors)
- **Error tracking:** Sentry (both NestJS and Next.js)
- **Uptime monitoring:** BetterUptime (ping every 60s)

### 5.3 Security

- All secrets in environment variables (never committed to repo)
- Schwab tokens encrypted at rest (AES-256)
- All PII access logged in audit log
- Rate limiting on all public endpoints (NestJS throttle guard)
- CSP headers on Next.js (prevent XSS)
- Supabase RLS as primary authorization layer

### 5.4 Performance Targets

| Metric | Target |
|--------|--------|
| API p95 response time | < 200ms |
| Portfolio page load (LCP) | < 1.5s |
| Research search response | < 200ms |
| Realtime update latency | < 500ms |
| Schwab data freshness | < 5 minutes |

---

## 6. Dependencies and Risk Register

### 6.1 External Dependencies

| Dependency | Risk Level | Mitigation |
|-----------|-----------|------------|
| Schwab API approval | HIGH | Apply immediately; build with mock data in parallel |
| OpenAI API availability | MEDIUM | Add fallback to rule-based extraction |
| Postmark inbound setup | LOW | Use ngrok for local testing |
| Supabase Pro tier limits | LOW | Monitor usage; upgrade if needed |

### 6.2 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Schwab OAuth complexity | MEDIUM | HIGH | Allocate extra week; use Schwab sandbox |
| RLS performance at scale | LOW | HIGH | Test with 10K rows; add indexes proactively |
| AI processing cost overrun | MEDIUM | MEDIUM | Batch processing + caching; set monthly budget cap |
| Data migration data loss | LOW | CRITICAL | Full backup + validation scripts before migration |

---

## 7. Acceptance Criteria Master List

> **Total: 129 acceptance criteria across all tasks**

### Workstream 1: Supabase Migration (43 criteria)
- WS1-T1: 3 criteria (Supabase project setup)
- WS1-T2: 4 criteria (Schema migration)
- WS1-T3: 3 criteria (RLS verification)
- WS1-T4: 4 criteria (Auth guard refactor)
- WS1-T5: 5 criteria (Next.js auth migration)
- WS1-T6: 4 criteria (Realtime)
- WS1-T7: 4 criteria (Storage)
- WS1-T8: 3 criteria (Edge Functions)
- WS1-T9: 13 criteria (Integration testing)

### Workstream 2: Schwab API (43 criteria)
- WS2-T1: 4 criteria (OAuth setup)
- WS2-T2: 4 criteria (Base HTTP client)
- WS2-T3: 4 criteria (Account data)
- WS2-T4: 4 criteria (Order management)
- WS2-T5: 4 criteria (Market data)
- WS2-T6: 4 criteria (Streaming)
- WS2-T7: 19 criteria (Integration testing)

### Workstream 3: Research Engine (43 criteria)
- WS3-T1: 4 criteria (Postmark webhook)
- WS3-T2: 5 criteria (AI pipeline)
- WS3-T3: 4 criteria (Search)
- WS3-T4: 4 criteria (Research UI)
- WS3-T5: 4 criteria (Compliance)
- WS3-T6: 4 criteria (Alert engine)
- WS3-T7: 18 criteria (Integration testing)

---

## 8. Gantt Chart

### 8.1 High-Level Timeline

```
Week:     1    2    3    4    5    6    7    8    9    10   11   12
          |----+----+----+----+----+----+----+----+----+----+----|
WS1:      [====Supabase Migration (Weeks 1-6)==========]
WS2:           [========Schwab API (Weeks 2-8)==================]
WS3:                [=======Research Engine (Weeks 3-10)=========]
Hardening:                                         [====Weeks 11-12====]
```

### 8.2 Week-by-Week Breakdown

**Week 1:**
- WS1-T1: Supabase project setup
- WS1-T2 (start): Schema migration

**Week 2:**
- WS1-T2 (finish): Schema migration complete
- WS1-T3: RLS policy verification
- WS2-T1: Schwab OAuth setup

**Week 3:**
- WS1-T4: NestJS auth guard refactor
- WS2-T2: Schwab base HTTP client
- WS3-T1: Postmark inbound webhook

**Week 4:**
- WS1-T5: Next.js auth flow migration
- WS2-T3: Schwab account data integration
- WS3-T2 (start): AI processing pipeline

**Week 5:**
- WS1-T6: Supabase Realtime integration
- WS2-T4 (start): Order management
- WS3-T2 (finish): AI pipeline complete

**Week 6:**
- WS1-T7: Storage integration
- WS1-T8: Edge Functions
- WS2-T4 (finish): Order management complete
- WS2-T5 (start): Market data & quotes

**Week 7:**
- WS1 Integration Testing
- WS2-T5 (finish): Market data complete
- WS2-T6 (start): WebSocket streaming
- WS3-T3: Search implementation

**Week 8:**
- WS2-T6 (finish): Streaming complete
- WS2 Integration Testing
- WS3-T4: Research UI

**Week 9:**
- WS3-T5: Compliance & retention
- WS2 final hardening

**Week 10:**
- WS3-T6: Alert engine
- WS3 Integration Testing

**Week 11:**
- Full system integration testing
- Performance testing (load test all endpoints)
- Security audit

**Week 12:**
- Production deployment
- Monitoring & alerting setup
- Runbook documentation
- Stakeholder demo

---

## 9. API Inventory

### 9.1 New Endpoints (Schwab Integration)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/schwab/oauth/authorize` | Redirect to Schwab OAuth |
| GET | `/api/schwab/oauth/callback` | Handle OAuth callback |
| GET | `/api/schwab/accounts` | List all accounts |
| GET | `/api/schwab/accounts/:id` | Account detail |
| GET | `/api/schwab/accounts/:id/positions` | Account positions |
| GET | `/api/schwab/accounts/:id/balances` | Account balances |
| GET | `/api/schwab/orders` | List orders |
| POST | `/api/schwab/orders` | Place order |
| GET | `/api/schwab/orders/:id` | Order detail |
| PUT | `/api/schwab/orders/:id` | Modify order |
| DELETE | `/api/schwab/orders/:id` | Cancel order |
| GET | `/api/schwab/quotes` | Get quotes (multi-symbol) |
| GET | `/api/schwab/options/:symbol` | Option chain |
| GET | `/api/schwab/fundamentals/:symbol` | Fundamentals |
| GET | `/api/schwab/history/:symbol` | Price history |
| WS | `/api/schwab/stream` | WebSocket streaming |

### 9.2 New Endpoints (Research Engine)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/research/inbound` | Postmark webhook receiver |
| GET | `/api/research` | List research emails |
| GET | `/api/research/:id` | Research email detail |
| GET | `/api/research/search` | Search research |
| POST | `/api/research/:id/tags` | Add tags |
| DELETE | `/api/research/:id/tags/:tag` | Remove tag |
| POST | `/api/research/:id/link` | Link to position/client |
| GET | `/api/research/sources` | Manage sources |
| POST | `/api/research/sources` | Add source |
| GET | `/api/research/alerts` | List alert rules |
| POST | `/api/research/alerts` | Create alert rule |
| DELETE | `/api/research/alerts/:id` | Delete alert rule |
| GET | `/api/research/compliance/export` | SEC compliance export |

### 9.3 Updated Endpoints (Supabase Migration)

| Method | Path | Change |
|--------|------|--------|
| POST | `/api/auth/login` | Now proxies to Supabase Auth |
| POST | `/api/auth/logout` | Now calls `supabase.auth.signOut()` |
| GET | `/api/auth/me` | Returns Supabase user object |
| POST | `/api/auth/magic-link` | New: magic link flow |
| GET | `/api/portfolio` | Now reads from Supabase (RLS applied) |
| GET | `/api/clients` | Now reads from Supabase (RLS applied) |

---

## 10. Tech Debt Resolution Plan

### 10.1 Items Being Resolved in This Roadmap

| Item | Current State | Resolution | Week |
|------|--------------|------------|------|
| Custom auth | `passport-jwt` with custom session store | Replace with Supabase Auth | 3 |
| Self-hosted PostgreSQL | Manual schema, no RLS | Migrate to Supabase with full RLS | 1–2 |
| Mock portfolio data | Hardcoded JSON fixtures | Replace with live Schwab API | 4 |
| No research system | Manual PDF uploads only | Build full ingestion pipeline | 3–10 |
| Polling for updates | 30s interval polling | Replace with Supabase Realtime | 5 |
| No audit logging | None | Full audit trail for PII access | 9 |

### 10.2 Known Items Not in Scope

| Item | Reason for Deferral | Future Quarter |
|------|--------------------|---------|
| Multi-custodian support (Fidelity, TD) | Schwab first, then expand | Q3 2026 |
| Mobile app (React Native) | Web-first approach | Q4 2026 |
| AI-powered trade recommendations | Compliance review needed | Q3 2026 |
| Client portal (client-facing app) | Advisor tool first | Q3 2026 |
| Tax lot optimization | Requires custodian API support | Q4 2026 |

---

*This roadmap is a living document. Update weekly during standup. Track progress against the week-by-week timeline in Section 8.2.*
