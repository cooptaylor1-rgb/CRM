# Wealth Management CRM — Master Implementation Roadmap

> **Repository:** [cooptaylor1-rgb/CRM](https://github.com/cooptaylor1-rgb/CRM)
> **Created:** 2026-02-27 | **Target Completion:** 12 weeks (Week of May 22, 2026)
> **Team:** 2–5 advisors/analysts | **Custodian:** Charles Schwab

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Workstream 1 — Supabase Migration](#3-workstream-1--supabase-migration)
4. [Workstream 2 — Schwab API Integration](#4-workstream-2--schwab-api-integration)
5. [Workstream 3 — Research Ingestion Engine](#5-workstream-3--research-ingestion-engine)
6. [Cross-Cutting Concerns](#6-cross-cutting-concerns)
7. [Technical Debt Resolution](#7-technical-debt-resolution)
8. [Implementation Timeline](#8-implementation-timeline)
9. [Risk Register](#9-risk-register)
10. [API & Service Inventory](#10-api--service-inventory)

---

## 1. Executive Summary

This roadmap upgrades the existing Wealth Management CRM / Portfolio Management Tool from a functional prototype to a production-grade platform through **three parallel workstreams executed over 12 weeks**:

| # | Workstream | Goal | Key Outcome |
|---|-----------|------|-------------|
| 1 | **Supabase Migration** | Replace self-hosted PostgreSQL + NestJS JWT auth with Supabase | Managed auth, RLS-enforced multi-tenant security, real-time subscriptions, document storage |
| 2 | **Schwab API Integration** | Replace mocked Schwab adapter with live API | Real OAuth 2.0 flow, live account/position sync, order placement, real-time streaming quotes |
| 3 | **Research Ingestion Engine** | Build an AI-powered research pipeline | Email-forwarded research parsed, summarized, tagged, and linked to securities/accounts |

**Current State:** 58-table schema, NestJS 10 + Next.js 14 + PostgreSQL 15 + Redis 7 + TypeORM. Has RBAC (5 roles), compliance/audit trail, mocked Outlook integration, mocked Schwab adapter. No tests, no pagination, no WebSocket support, double API prefix bug.

**End State:** Supabase-backed infrastructure with real-time capabilities, live Schwab account/trading integration, and an intelligent research feed — all secured by database-level RLS policies with full test coverage.

---

## 2. Architecture Overview

### 2.1 Current Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CURRENT STATE                              │
│                                                                    │
│  ┌──────────┐     ┌───────────────────┐     ┌──────────────────┐ │
│  │ Next.js  │────▶│    NestJS API     │────▶│  PostgreSQL 15   │ │
│  │ 14 (FE)  │     │  (JWT Auth/RBAC)  │     │  (58 tables)     │ │
│  └──────────┘     │  TypeORM          │     └──────────────────┘ │
│                   │  ┌──────────────┐ │     ┌──────────────────┐ │
│                   │  │ Schwab Mock  │ │────▶│    Redis 7       │ │
│                   │  │ Outlook Mock │ │     │  (cache/session)  │ │
│                   │  └──────────────┘ │     └──────────────────┘ │
│                   └───────────────────┘                           │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TARGET STATE                                        │
│                                                                                   │
│  ┌──────────────┐      ┌─────────────────────┐      ┌────────────────────────┐  │
│  │  Next.js 14   │─────▶│   Supabase Client   │─────▶│     SUPABASE           │  │
│  │  (Frontend)   │      │   (Auth + Realtime)  │      │  ┌──────────────────┐ │  │
│  │               │      └─────────────────────┘      │  │  Auth (GoTrue)   │ │  │
│  │  • Auth UI    │                                    │  │  JWT + RBAC      │ │  │
│  │  • Realtime   │      ┌─────────────────────┐      │  ├──────────────────┤ │  │
│  │    Subs       │─────▶│    NestJS API        │─────▶│  │  PostgreSQL 15   │ │  │
│  │  • Research   │      │  (Business Logic)    │      │  │  RLS Policies    │ │  │
│  │    Feed       │      │                      │      │  │  58+ tables      │ │  │
│  └──────────────┘      │  • Schwab Service    │      │  ├──────────────────┤ │  │
│                         │  • Order Engine      │      │  │  Realtime        │ │  │
│                         │  • Compliance        │      │  │  (WebSocket)     │ │  │
│                         └─────────┬────────────┘      │  ├──────────────────┤ │  │
│                                   │                    │  │  Storage         │ │  │
│                                   ▼                    │  │  (Documents)     │ │  │
│                         ┌─────────────────────┐      │  ├──────────────────┤ │  │
│                         │  Schwab Trader API   │      │  │  Edge Functions  │ │  │
│                         │  ┌───────────────┐  │      │  │  (Webhooks)      │ │  │
│                         │  │ REST (OAuth2) │  │      │  └──────────────────┘ │  │
│                         │  │ Streaming WS  │  │      └────────────────────────┘  │
│                         │  └───────────────┘  │                                   │
│                         └─────────────────────┘      ┌────────────────────────┐  │
│                                                       │  Research Pipeline     │  │
│  ┌──────────────┐      ┌─────────────────────┐      │  ┌──────────────────┐ │  │
│  │  Email        │─────▶│  Postmark Inbound   │─────▶│  │  Edge Function   │ │  │
│  │  Forwarding   │      │  Webhook            │      │  │  (Parse + Store) │ │  │
│  └──────────────┘      └─────────────────────┘      │  ├──────────────────┤ │  │
│                                                       │  │  AI Processing   │ │  │
│                                                       │  │  (OpenAI / etc)  │ │  │
│                                                       │  │  Summarize/Tag   │ │  │
│                                                       │  └──────────────────┘ │  │
│                                                       └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Data Flow Summary

| Flow | Path |
|------|------|
| **User Auth** | Browser → Supabase Auth (GoTrue) → JWT → NestJS validates via Supabase client |
| **Read Data** | Browser → Supabase Client → PostgreSQL (RLS-filtered) |
| **Write Data** | Browser → NestJS API → Supabase DB (service role, bypasses RLS for validated ops) |
| **Realtime** | PostgreSQL change → Supabase Realtime → Browser subscription (RLS-filtered) |
| **Schwab Sync** | NestJS cron → Schwab REST API → PostgreSQL (positions, balances, transactions) |
| **Schwab Stream** | NestJS WebSocket client → Schwab Streaming → Redis pub/sub → Supabase Realtime |
| **Research** | Email → Postmark → Supabase Edge Function → AI → PostgreSQL → Realtime → UI |
| **Documents** | Upload → Supabase Storage (RLS-scoped buckets) |

---

## 3. Workstream 1 — Supabase Migration

### 3.1 Overview

Migrate from self-hosted PostgreSQL + NestJS JWT authentication to Supabase's managed platform. NestJS remains the API layer for business logic, but Supabase handles auth, real-time subscriptions, document storage, and edge processing.

### 3.2 Phase 1: Foundation & Schema Adaptation (Weeks 1–2)

#### 3.2.1 Create Supabase Project

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Create Supabase project | Select region closest to team (likely `us-central1`). Choose Pro plan for higher connection limits and daily backups. | ✅ Project accessible at `<project-ref>.supabase.co` |
| Configure database settings | Set statement timeout, connection pooling mode (transaction for API, session for migrations). | ✅ Supavisor configured, connection strings documented |
| Set up Supabase CLI locally | `npm install supabase --save-dev && npx supabase init && npx supabase link --project-ref <ref>` | ✅ `npx supabase status` shows linked project |

#### 3.2.2 Schema Migration

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Export current schema | `pg_dump --schema-only --no-owner --no-privileges -f schema.sql` from existing PostgreSQL 15 | ✅ Clean SQL file of all 58 tables, indexes, constraints |
| Audit TypeORM entities vs. schema | Compare TypeORM entity definitions against live schema. Document discrepancies. | ✅ Discrepancy report generated |
| Add `team_id` column | Add `team_id UUID NOT NULL` to every tenant-scoped table (`households`, `accounts`, `persons`, `securities`, `positions`, `transactions`, etc.). This is the RLS anchor. | ✅ All tenant tables have `team_id` with FK to `teams` table |
| Create `teams` table | `CREATE TABLE teams (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());` | ✅ Teams table exists, seed team created |
| Create `team_members` table | Links Supabase `auth.users` to teams with role. Columns: `id`, `user_id` (FK → `auth.users`), `team_id` (FK → `teams`), `role` (enum: `owner`, `admin`, `advisor`, `analyst`, `viewer`), `created_at`. | ✅ Table created with proper FKs |
| Restore schema to Supabase | Use `pg_restore` with `--no-owner --no-privileges` via Supavisor session mode. | ✅ All 58 tables exist in Supabase with correct types and constraints |
| Migrate seed/reference data | Export reference data (security types, transaction types, compliance templates, etc.) and import. | ✅ Reference tables populated, row counts match |

**Schema adaptation SQL pattern:**

```sql
-- Add team_id to existing tables (repeat for each tenant-scoped table)
ALTER TABLE households ADD COLUMN team_id UUID NOT NULL
  REFERENCES teams(id) ON DELETE CASCADE;

CREATE INDEX idx_households_team_id ON households(team_id);

-- Create team_members junction table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','advisor','analyst','viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, team_id)
);
```

#### 3.2.3 Helper Functions for RLS

```sql
-- Get the current user's team_id from their JWT or team_members lookup
CREATE OR REPLACE FUNCTION public.get_user_team_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM team_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Get the current user's role within their team
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM team_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;
```

### 3.3 Phase 2: RLS Policy Design & Implementation (Weeks 2–3)

#### 3.3.1 RLS Strategy

The RLS model enforces team-level isolation: every row in a tenant-scoped table belongs to a `team_id`, and users can only access rows for teams they belong to via `team_members`.

**Policy hierarchy by role:**

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| `owner` | All team data | Yes | Yes | Yes |
| `admin` | All team data | Yes | Yes | Yes (soft-delete only) |
| `advisor` | All team data | Yes | Own records only | No |
| `analyst` | Assigned accounts | Yes (research only) | Own records only | No |
| `viewer` | Assigned accounts | No | No | No |

#### 3.3.2 Core RLS Policies

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Enable RLS on all tenant tables | `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;` for every tenant-scoped table. | ✅ `SELECT tablename FROM pg_tables WHERE rowsecurity = false AND schemaname = 'public'` returns zero tenant tables |
| Create SELECT policies | Team-level read policy: `USING (team_id = get_user_team_id())` | ✅ Users see only their team's data via Supabase client |
| Create INSERT policies | `WITH CHECK (team_id = get_user_team_id() AND get_user_role() IN ('owner','admin','advisor','analyst'))` | ✅ Viewers cannot insert; team_id is auto-enforced |
| Create UPDATE policies | Owner/Admin: all team rows. Advisor: own created rows. Analyst: research records only. | ✅ Role-based update restrictions verified |
| Create DELETE policies | Owner only (or soft-delete pattern). | ✅ Only owners can delete; audit trail preserved |
| Force RLS on all future tables | Run force-RLS script and add migration hook. | ✅ Automated check in CI |

**Example RLS policy for `households`:**

```sql
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- SELECT: team members can see their team's households
CREATE POLICY "Team members can view households"
  ON households FOR SELECT
  USING (team_id = get_user_team_id());

-- INSERT: advisors+ can create households for their team
CREATE POLICY "Advisors can create households"
  ON households FOR INSERT
  WITH CHECK (
    team_id = get_user_team_id()
    AND get_user_role() IN ('owner', 'admin', 'advisor')
  );

-- UPDATE: advisors+ can update their team's households
CREATE POLICY "Advisors can update households"
  ON households FOR UPDATE
  USING (team_id = get_user_team_id())
  WITH CHECK (
    team_id = get_user_team_id()
    AND get_user_role() IN ('owner', 'admin', 'advisor')
  );

-- DELETE: owners only
CREATE POLICY "Owners can delete households"
  ON households FOR DELETE
  USING (
    team_id = get_user_team_id()
    AND get_user_role() = 'owner'
  );
```

#### 3.3.3 RLS Testing Matrix

| Test Case | Expected Result |
|-----------|----------------|
| User A (Team 1, advisor) queries `households` | Sees only Team 1 households |
| User B (Team 2, advisor) queries `households` | Sees only Team 2 households |
| User A inserts household with `team_id` = Team 2 | **Rejected** by RLS |
| User C (Team 1, viewer) attempts INSERT | **Rejected** by RLS |
| User D (Team 1, analyst) attempts DELETE | **Rejected** by RLS |
| Service role (NestJS) queries any table | **Bypasses** RLS (expected for system operations) |

### 3.4 Phase 3: Auth Migration (Weeks 3–4)

#### 3.4.1 Supabase Auth Setup

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Configure Supabase Auth providers | Enable Email/Password. Optionally enable Google OAuth for team convenience. | ✅ Auth settings configured in Supabase dashboard |
| Configure JWT settings | Set custom JWT claims hook to include `team_id` and `role` in tokens. | ✅ JWT tokens contain `team_id` and `role` claims |
| Set up auth email templates | Customize confirmation, password reset, and magic link email templates with firm branding. | ✅ Branded emails sending correctly |
| Create user migration script | Map existing `users` table to Supabase `auth.users`. Use `supabase.auth.admin.createUser()` for each user. | ✅ All existing users can log in via Supabase Auth |
| Populate `team_members` | Insert team membership records for all migrated users with their current RBAC roles. | ✅ `SELECT count(*) FROM team_members` matches user count |

**Custom access token hook (for embedding team context in JWT):**

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims JSONB;
  user_team_id UUID;
  user_role TEXT;
BEGIN
  claims := event->'claims';

  SELECT tm.team_id, tm.role INTO user_team_id, user_role
  FROM team_members tm
  WHERE tm.user_id = (event->>'user_id')::UUID
  LIMIT 1;

  IF user_team_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{team_id}', to_jsonb(user_team_id));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;
```

#### 3.4.2 NestJS Auth Refactor

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Install Supabase server client | `npm install @supabase/supabase-js` in NestJS. Create `SupabaseService` singleton. | ✅ `SupabaseService` injectable, configured with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |
| Replace JWT guard | Replace custom `JwtAuthGuard` with `SupabaseAuthGuard` that validates tokens via `supabase.auth.getUser(token)`. | ✅ All protected endpoints validate Supabase JWTs |
| Refactor RBAC decorators | Update `@Roles()` decorator to read from Supabase JWT claims (`request.user.user_role`). | ✅ Existing RBAC behavior preserved |
| Remove old auth module | Delete NestJS Passport/JWT module, token generation, refresh logic. | ✅ No references to old JWT signing/verification |
| Update `.env` | Replace `JWT_SECRET` with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. | ✅ All env vars documented in `.env.example` |

**NestJS SupabaseAuthGuard pattern:**

```typescript
// src/auth/supabase-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException();

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await this.supabase.client.auth.getUser(token);

    if (error || !user) throw new UnauthorizedException();
    request.user = user;
    return true;
  }
}
```

#### 3.4.3 Frontend Auth Swap

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Install Supabase client | `npm install @supabase/supabase-js @supabase/ssr` in Next.js frontend. | ✅ Supabase client initialized in `lib/supabase.ts` |
| Create auth context/provider | Build `SupabaseAuthProvider` using `@supabase/ssr` for cookie-based session management in Next.js. | ✅ Auth state accessible via `useSession()` hook |
| Replace login page | Swap custom JWT login for `supabase.auth.signInWithPassword()` or Supabase Auth UI component. | ✅ Login works with Supabase Auth |
| Replace token refresh logic | Remove manual refresh; Supabase client handles token refresh automatically. | ✅ Sessions persist across page reloads |
| Update API calls | Include Supabase session token in `Authorization: Bearer` header for NestJS calls. | ✅ All API calls authenticated |
| Add direct Supabase queries | For read-heavy pages, query Supabase directly (bypassing NestJS) for RLS-filtered reads. | ✅ Dashboard loads data via Supabase client |

### 3.5 Phase 4: Realtime & Storage (Weeks 4–5)

#### 3.5.1 Supabase Realtime Setup

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Enable Realtime on key tables | Add tables to `supabase_realtime` publication: `positions`, `transactions`, `accounts`, `research_items`, `compliance_alerts`. | ✅ `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime'` shows target tables |
| Configure broadcast authorization | Set up `realtime.broadcast_changes()` triggers with RLS-respecting channels. | ✅ Only team-authorized users receive broadcasts |
| Build position update subscription | Subscribe to `positions` INSERT/UPDATE for live portfolio dashboard. | ✅ Position changes appear in UI within 1s |
| Build compliance alert subscription | Subscribe to `compliance_alerts` INSERT for real-time notifications. | ✅ Toast/notification appears on new compliance alert |
| Build research feed subscription | Subscribe to `research_items` INSERT for live research feed updates. | ✅ New research items stream into feed UI |

**Frontend subscription pattern:**

```typescript
// Subscribe to position updates for the user's team
const channel = supabase
  .channel('positions-realtime')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'positions',
      filter: `team_id=eq.${teamId}`,
    },
    (payload) => {
      if (payload.eventType === 'INSERT') addPosition(payload.new);
      if (payload.eventType === 'UPDATE') updatePosition(payload.new);
      if (payload.eventType === 'DELETE') removePosition(payload.old);
    }
  )
  .subscribe();
```

#### 3.5.2 Supabase Storage Setup

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Create storage buckets | `documents` (private, team-scoped), `research-attachments` (private), `profile-photos` (public). | ✅ Buckets listed in Supabase dashboard |
| Configure bucket RLS | Policy: users can only access files in `{team_id}/` path prefix. | ✅ User in Team A cannot read Team B files |
| Build document upload API | NestJS endpoint accepts file → stores in Supabase Storage → saves metadata to `documents` table. | ✅ File uploads and downloads work end-to-end |
| Migrate existing documents | If any documents exist in local filesystem, migrate to Supabase Storage. | ✅ All documents accessible in new system |

**Storage RLS policy:**

```sql
-- Storage policy: team members can access their team's files
CREATE POLICY "Team file access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = get_user_team_id()::TEXT
);
```

### 3.6 Phase 5: Edge Functions (Week 5)

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Set up Edge Functions project | `npx supabase functions new <name>` for each function. Configure secrets via `npx supabase secrets set`. | ✅ Functions deploy and execute |
| `email-ingest` function | Receives Postmark inbound webhook, parses email, stores in `research_emails` table. (See Workstream 3.) | ✅ Forwarded emails create `research_emails` rows |
| `schwab-webhook` function | Receives Schwab account activity notifications (future). | ✅ Function deployed and reachable |
| `scheduled-sync` function | Triggers Schwab position/balance sync via NestJS API call. Invoked by Supabase cron (pg_cron). | ✅ Sync runs on schedule |

---

## 4. Workstream 2 — Schwab API Integration

### 4.1 Overview

Replace the mocked `schwab.adapter.ts` with a live integration against the Charles Schwab Trader API. This covers OAuth 2.0 authentication, REST API calls for accounts/trading/market data, and WebSocket streaming for real-time quotes and account activity.

### 4.2 Schwab API Reference

#### 4.2.1 Authentication

| Detail | Value |
|--------|-------|
| Auth URL | `https://api.schwabapi.com/v1/oauth/authorize` |
| Token URL | `https://api.schwabapi.com/v1/oauth/token` |
| Grant Type (initial) | `authorization_code` |
| Grant Type (refresh) | `refresh_token` |
| Access Token TTL | **30 minutes** |
| Refresh Token TTL | **7 days** |
| Auth Header (token exchange) | `Basic {Base64(client_id:client_secret)}` |
| API Auth Header | `Bearer {access_token}` |
| Callback URL | Must be HTTPS |
| Note | Authorization code is **single-use** and must be **URL-decoded** before exchange |

#### 4.2.2 REST Endpoints

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Accounts** | GET | `/trader/v1/accounts/accountNumbers` | Returns account number → encrypted hash value mapping |
| | GET | `/trader/v1/accounts/{hashValue}` | Account details, balances, positions |
| | GET | `/trader/v1/accounts` | All linked accounts |
| **Orders** | POST | `/trader/v1/accounts/{hashValue}/orders` | Place order (EQUITY/OPTION only) |
| | GET | `/trader/v1/accounts/{hashValue}/orders` | Get orders for account |
| | GET | `/trader/v1/accounts/{hashValue}/orders/{orderId}` | Get specific order |
| | PUT | `/trader/v1/accounts/{hashValue}/orders/{orderId}` | Replace/modify order |
| | DELETE | `/trader/v1/accounts/{hashValue}/orders/{orderId}` | Cancel order |
| | GET | `/trader/v1/orders` | All orders across linked accounts |
| | POST | `/trader/v1/accounts/{hashValue}/previewOrder` | Preview order before placement |
| **Transactions** | GET | `/trader/v1/accounts/{hashValue}/transactions` | Transaction history |
| | GET | `/trader/v1/accounts/{hashValue}/transactions/{transactionId}` | Specific transaction |
| **Quotes** | GET | `/marketdata/v1/quotes` | Batch quotes (multiple symbols) |
| | GET | `/marketdata/v1/{symbol}/quotes` | Single symbol quote |
| **Price History** | GET | `/marketdata/v1/pricehistory` | Historical OHLCV data |
| **Option Chains** | GET | `/marketdata/v1/chains` | Option chain data |
| **Movers** | GET | `/marketdata/v1/movers/{index}` | Top 10 movers by index |
| **Market Hours** | GET | `/marketdata/v1/markets` | Market hours for all markets |
| | GET | `/marketdata/v1/markets/{market}` | Hours for specific market |
| **Instruments** | GET | `/marketdata/v1/instruments` | Search instruments |
| | GET | `/marketdata/v1/instruments/{cusip}` | Instrument by CUSIP |
| **User** | GET | `/trader/v1/userPreference` | User preferences (streamer info) |

#### 4.2.3 Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| Order POST/PUT/DELETE | 0–120 requests/minute/account (configurable) |
| Order GET | Unthrottled |
| Market Data | Standard rate limiting (respect HTTP 429) |

#### 4.2.4 Streaming Services

| Service | Description |
|---------|-------------|
| `LEVELONE_EQUITIES` | Real-time Level 1 equity quotes (bid, ask, last, volume) |
| `LEVELONE_OPTIONS` | Real-time option quotes with Greeks (delta, gamma, theta, vega, rho) |
| `LEVELONE_FUTURES` | Real-time futures quotes |
| `NYSE_BOOK` / `NASDAQ_BOOK` | Level 2 order book depth |
| `CHART_EQUITY` | Minute-by-minute OHLCV bars |
| `CHART_FUTURES` | Futures chart data |
| `NEWS_HEADLINE` | Real-time news headlines |
| `ACCT_ACTIVITY` | Real-time account updates (orders, fills, cancellations) |
| `TIMESALE_EQUITY` | Time and sales (tick-by-tick) |

### 4.3 Phase 1: OAuth 2.0 Flow & Token Management (Weeks 1–3)

#### 4.3.1 App Registration

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Register on developer.schwab.com | Create developer account, register app under company. Request "Accounts and Trading Production" + "Market Data Production" API products. | ✅ App Key (Client ID) and Client Secret issued |
| Configure callback URL | Set callback URL to `https://<your-domain>/api/schwab/callback`. Must be HTTPS in production. For local dev: `https://127.0.0.1:5555/callback`. | ✅ Callback URL registered and approved |
| Wait for approval | Schwab reviews app. Typical turnaround: 1–3 business days for individual accounts. | ✅ App status shows "Ready" on dev portal |

#### 4.3.2 Token Service Implementation

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Create `SchwabAuthService` | NestJS injectable service managing the full OAuth lifecycle. | ✅ Service injectable in NestJS |
| Implement authorization URL generation | Generate redirect URL: `https://api.schwabapi.com/v1/oauth/authorize?client_id={CONSUMER_KEY}&redirect_uri={CALLBACK_URL}` | ✅ Redirect URL opens Schwab Login Micro Site |
| Implement callback handler | `GET /api/schwab/callback` receives `?code={AUTH_CODE}&session={SESSION_ID}`. URL-decode the code. | ✅ Auth code extracted from callback |
| Implement token exchange | POST to `https://api.schwabapi.com/v1/oauth/token` with `grant_type=authorization_code&code={DECODED_CODE}&redirect_uri={CALLBACK_URL}`. Header: `Authorization: Basic {Base64(client_id:client_secret)}`. | ✅ Access token and refresh token stored |
| Implement token refresh | POST to same token URL with `grant_type=refresh_token&refresh_token={REFRESH_TOKEN}`. Schedule at 25-min intervals (access token valid for 30 min). | ✅ Tokens auto-refresh before expiry |
| Implement token storage | Store tokens encrypted in database (`schwab_tokens` table). Columns: `id`, `team_id`, `access_token`, `refresh_token`, `expires_at`, `refresh_expires_at`, `account_hashes JSONB`, `updated_at`. | ✅ Tokens persist across server restarts |
| Implement 7-day refresh monitoring | Track refresh token expiry. Send notification to team 24h before expiry. If expired, redirect user through CAG flow. | ✅ Team notified before token expiry |
| Add rate limiter | Implement token-bucket rate limiter: 120 req/min for order endpoints, exponential backoff on 429 responses. | ✅ Rate limiter prevents 429 errors |

**Token service implementation:**

```typescript
// src/schwab/schwab-auth.service.ts
@Injectable()
export class SchwabAuthService {
  private readonly BASE_URL = 'https://api.schwabapi.com/v1/oauth';
  private readonly clientId = process.env.SCHWAB_CLIENT_ID;
  private readonly clientSecret = process.env.SCHWAB_CLIENT_SECRET;
  private readonly callbackUrl = process.env.SCHWAB_CALLBACK_URL;

  getAuthorizationUrl(): string {
    return `${this.BASE_URL}/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.callbackUrl)}`;
  }

  async exchangeCode(authCode: string): Promise<TokenResponse> {
    const decoded = decodeURIComponent(authCode);
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${this.BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: decoded,
        redirect_uri: this.callbackUrl,
      }),
    });
    return response.json();
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${this.BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    return response.json();
  }
}
```

#### 4.3.3 Account Hash Mapping

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Fetch account numbers | GET `/trader/v1/accounts/accountNumbers` after initial auth. Returns array of `{ accountNumber, hashValue }`. | ✅ Hash values stored in `schwab_tokens.account_hashes` |
| Map hashes to CRM accounts | Match Schwab `accountNumber` to existing `accounts.account_number` in CRM. Store `hash_value` on the CRM account record. | ✅ CRM accounts linked to Schwab hash values |
| Handle multi-account | Support multiple Schwab accounts per team (user authorizes multiple accounts during CAG). | ✅ All authorized accounts mapped |

### 4.4 Phase 2: Account & Position Sync (Weeks 3–5)

#### 4.4.1 Sync Service

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Create `SchwabSyncService` | NestJS service for scheduled + on-demand sync of accounts, positions, balances, and transactions. | ✅ Service injectable with sync methods |
| Implement account sync | GET `/trader/v1/accounts/{hashValue}?fields=positions` → Update `accounts` table (balances) and `positions` table. | ✅ CRM account balances match Schwab |
| Implement position sync | Parse position data: symbol, quantity, market value, cost basis, day P&L, unrealized P&L. Map to `positions` table. | ✅ All positions reflected in CRM |
| Implement transaction sync | GET `/trader/v1/accounts/{hashValue}/transactions` with date range. Map to `transactions` table. Deduplicate by `transactionId`. | ✅ Transactions synced without duplicates |
| Implement security master sync | For each unique symbol in positions, GET `/marketdata/v1/instruments` to fetch CUSIP, description, asset type. Update `securities` table. | ✅ Securities table enriched with Schwab data |
| Schedule sync via pg_cron | Run full position sync every 15 min during market hours (9:30 AM – 4:00 PM ET, M–F). Run transaction sync daily at 6:00 PM ET. | ✅ Cron jobs executing on schedule |
| Build manual sync endpoint | `POST /api/schwab/sync` triggers immediate full sync for the requesting team. | ✅ Manual sync completes within 30s |

**Sync flow:**

```
┌────────────┐   every 15min   ┌──────────────┐   GET /accounts   ┌─────────────┐
│  pg_cron   │────────────────▶│ NestJS Sync  │─────────────────▶│ Schwab API  │
│  trigger   │                 │  Service     │◀─────────────────│             │
└────────────┘                 │              │  JSON response    └─────────────┘
                               │  ┌────────┐  │
                               │  │ Diff   │  │   Upsert changed rows
                               │  │ Engine │──┼──────────────────▶ PostgreSQL
                               │  └────────┘  │
                               └──────────────┘
```

#### 4.4.2 Diff Engine

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Implement position diffing | Compare incoming Schwab positions to stored positions. Detect additions, removals, quantity changes, price changes. | ✅ Only changed positions trigger DB writes |
| Log sync results | Store sync metadata in `sync_log` table: `timestamp`, `team_id`, `sync_type`, `records_added`, `records_updated`, `records_removed`, `errors`, `duration_ms`. | ✅ Sync log queryable for debugging |
| Emit Realtime events | Position changes flow through Supabase Realtime to update frontend dashboards live. | ✅ UI updates within 2s of sync completion |

### 4.5 Phase 3: Order Management (Weeks 5–7)

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Implement order preview | POST `/trader/v1/accounts/{hashValue}/previewOrder` before submission. Show estimated execution details. | ✅ Preview returns estimated cost/proceeds |
| Implement order placement | POST `/trader/v1/accounts/{hashValue}/orders` with order spec JSON. Support: Market, Limit, Stop, Stop-Limit. | ✅ Orders successfully placed via CRM |
| Implement order modification | PUT `/trader/v1/accounts/{hashValue}/orders/{orderId}` to replace order. | ✅ Working orders modifiable |
| Implement order cancellation | DELETE `/trader/v1/accounts/{hashValue}/orders/{orderId}`. | ✅ Orders cancelable from CRM |
| Implement order status tracking | GET orders endpoint polled or streamed via `ACCT_ACTIVITY`. Map statuses to CRM `orders` table. | ✅ Order statuses update in real-time |
| Build compliance pre-check | Before order placement: check against compliance rules (concentration limits, restricted securities, trade authorization). | ✅ Non-compliant orders blocked with reason |
| Build order entry UI | Form: symbol, side (buy/sell), quantity, order type, price (for limit), duration (Day/GTC). Shows preview before submit. | ✅ Full order workflow functional in UI |
| Audit trail | Every order action (place, modify, cancel) logged to `audit_trail` table with user, timestamp, and full request/response. | ✅ Audit records queryable |

**Order placement payload example:**

```json
{
  "orderType": "LIMIT",
  "session": "NORMAL",
  "duration": "DAY",
  "orderStrategyType": "SINGLE",
  "orderLegCollection": [
    {
      "instruction": "BUY",
      "quantity": 100,
      "instrument": {
        "symbol": "AAPL",
        "assetType": "EQUITY"
      }
    }
  ],
  "price": "150.00"
}
```

### 4.6 Phase 4: Market Data & Streaming (Weeks 6–8)

#### 4.6.1 REST Market Data

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Implement quote service | GET `/marketdata/v1/quotes` with comma-separated symbols. Cache in Redis with 5s TTL. | ✅ Quotes returned within 200ms (cache hit) |
| Implement price history | GET `/marketdata/v1/pricehistory` for charting. Support: 1m, 5m, 15m, 30m, daily, weekly frequencies. | ✅ Charts render historical data correctly |
| Implement option chains | GET `/marketdata/v1/chains` with configurable strike range, expiration, strategy. | ✅ Option chain data displayed |
| Implement movers | GET `/marketdata/v1/movers/{index}` for market overview widget. | ✅ Top movers displayed on dashboard |
| Implement market hours | GET `/marketdata/v1/markets` to show open/close times and determine sync scheduling. | ✅ System knows when markets are open |

#### 4.6.2 WebSocket Streaming

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Get streamer info | GET `/trader/v1/userPreference` returns `streamerInfo` with `streamerSocketUrl`, `token`, `appId`, etc. | ✅ Streamer credentials retrieved |
| Implement streaming client | NestJS service connects to Schwab WebSocket. Use `ws` library. Handle login, subscriptions, heartbeat. | ✅ WebSocket connection established and stable |
| Subscribe to `LEVELONE_EQUITIES` | Stream real-time quotes for portfolio symbols. Parse fields: bid, ask, last, volume, change. | ✅ Live quotes updating |
| Subscribe to `ACCT_ACTIVITY` | Stream order fills, cancellations, and account updates. Fields: `0` (subscription key), `1` (account), `2` (message type), `3` (message data). | ✅ Order events received in real-time |
| Subscribe to `CHART_EQUITY` | Stream minute-by-minute OHLCV for actively viewed symbols. | ✅ Live chart updating |
| Bridge to Supabase Realtime | Streaming data → Redis pub/sub → NestJS handler → Supabase `realtime.broadcast()` or direct table update. | ✅ Frontend receives live price updates |
| Handle reconnection | Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 60s. Re-subscribe on reconnect. | ✅ Stream recovers from disconnections |
| Handle market hours | Only connect during market hours. Grace period: 15 min before open, 15 min after close. | ✅ No unnecessary connections outside market hours |

**Streaming client skeleton:**

```typescript
// src/schwab/schwab-stream.service.ts
@Injectable()
export class SchwabStreamService implements OnModuleInit, OnModuleDestroy {
  private ws: WebSocket;
  private subscriptions: Map<string, string[]> = new Map();

  async connect(streamerInfo: StreamerInfo) {
    this.ws = new WebSocket(`wss://${streamerInfo.streamerSocketUrl}/ws`);

    this.ws.on('open', () => this.login(streamerInfo));
    this.ws.on('message', (data) => this.handleMessage(JSON.parse(data)));
    this.ws.on('close', () => this.scheduleReconnect());
    this.ws.on('error', (err) => this.logger.error('Stream error', err));
  }

  private login(info: StreamerInfo) {
    this.ws.send(JSON.stringify({
      requests: [{
        service: 'ADMIN',
        requestid: '0',
        command: 'LOGIN',
        SchwabClientCustomerId: info.schwabClientCustomerId,
        SchwabClientCorrelId: info.schwabClientCorrelId,
        parameters: {
          Authorization: info.token,
          SchwabClientChannel: 'client',
          SchwabClientFunctionId: 'trader',
        },
      }],
    }));
  }

  subscribeEquityQuotes(symbols: string[]) {
    this.ws.send(JSON.stringify({
      requests: [{
        service: 'LEVELONE_EQUITIES',
        requestid: this.nextRequestId(),
        command: 'SUBS',
        SchwabClientCustomerId: this.customerId,
        SchwabClientCorrelId: this.correlId,
        parameters: {
          keys: symbols.join(','),
          fields: '0,1,2,3,4,5,6,7,8,9,10,11,12,13',
        },
      }],
    }));
  }
}
```

### 4.7 Phase 5: Quote & Portfolio Dashboard (Weeks 7–9)

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Build real-time portfolio view | Table of positions with live bid/ask/last/change streamed from Schwab. | ✅ Prices update without page refresh |
| Build account summary cards | Total value, day P&L, cash balance, margin — updated in real-time. | ✅ Values match Schwab website |
| Build intraday chart widget | TradingView-style chart fed by `CHART_EQUITY` stream + `pricehistory` for historical. | ✅ Chart shows live intraday data |
| Build watchlist | Custom watchlist with streaming quotes. Add/remove symbols. | ✅ Watchlist persists and streams |
| Build order blotter | Active orders, filled orders, cancelled orders with real-time status from `ACCT_ACTIVITY`. | ✅ Orders show correct status |

---

## 5. Workstream 3 — Research Ingestion Engine

### 5.1 Overview

Build a pipeline that allows team members to forward research emails to a dedicated address, which are then parsed, AI-processed (summarized, tagged, sentiment-scored), stored, and linked to securities/accounts. Provide a searchable research feed UI.

### 5.2 Phase 1: Email Ingestion (Weeks 2–4)

#### 5.2.1 Inbound Email Setup

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Choose inbound email provider | **Recommended: Postmark** — reliable inbound parsing, JSON webhook format, attachment handling, spam scoring. Alternative: SendGrid Inbound Parse. | ✅ Provider account created |
| Configure inbound domain | Set up `research.yourfirm.com` subdomain. Point MX record to provider (e.g., `mx.postmarkapp.com`). | ✅ MX records propagated, test email received |
| Configure webhook URL | Point inbound webhook to Supabase Edge Function: `https://<project-ref>.supabase.co/functions/v1/email-ingest`. Deploy with `--no-verify-jwt` (public endpoint). | ✅ Webhook URL configured in provider dashboard |
| Set up forwarding address | Team members forward research to `research@research.yourfirm.com` or `team+research@yourfirm.com` (plus-addressing). | ✅ Forwarding instructions documented for team |

#### 5.2.2 Database Schema for Research

```sql
-- Research emails (raw ingest)
CREATE TABLE research_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  message_id TEXT UNIQUE,              -- provider message ID for dedup
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT,
  subject TEXT,
  text_body TEXT,
  html_body TEXT,
  stripped_reply TEXT,                  -- reply text only (if forwarded)
  headers JSONB,
  spam_score NUMERIC,
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed BOOLEAN DEFAULT FALSE,
  processing_error TEXT
);

-- Parsed research items (AI-processed)
CREATE TABLE research_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  email_id UUID REFERENCES research_emails(id),
  title TEXT NOT NULL,
  summary TEXT,                        -- AI-generated summary
  body_text TEXT,                      -- cleaned full text
  source_type TEXT DEFAULT 'email',    -- 'email', 'rss', 'api', 'manual'
  source_name TEXT,                    -- sender name or publication
  source_url TEXT,                     -- original URL if available
  sentiment TEXT CHECK (sentiment IN ('bullish','bearish','neutral','mixed')),
  sentiment_score NUMERIC,             -- -1.0 to 1.0
  themes TEXT[],                       -- ['tech','macro','earnings',...]
  sectors TEXT[],                      -- ['Technology','Healthcare',...]
  tickers TEXT[],                      -- ['AAPL','GOOGL',...]
  published_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_actionable BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),

  -- Full-text search
  search_vector TSVECTOR
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(body_text, '')), 'C')
    ) STORED
);

CREATE INDEX idx_research_items_search ON research_items USING GIN(search_vector);
CREATE INDEX idx_research_items_tickers ON research_items USING GIN(tickers);
CREATE INDEX idx_research_items_team_date ON research_items(team_id, ingested_at DESC);

-- Research attachments
CREATE TABLE research_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES research_emails(id) ON DELETE CASCADE,
  research_item_id UUID REFERENCES research_items(id),
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER,
  storage_path TEXT NOT NULL,          -- Supabase Storage path
  extracted_text TEXT,                 -- OCR/parsed text from PDFs
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link research to securities
CREATE TABLE research_security_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_item_id UUID NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
  security_id UUID NOT NULL REFERENCES securities(id),
  relevance_score NUMERIC DEFAULT 1.0, -- 0-1, how relevant the research is to this security
  mention_context TEXT,                -- excerpt where security was mentioned
  UNIQUE(research_item_id, security_id)
);

-- Research annotations (team commentary)
CREATE TABLE research_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_item_id UUID NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  note TEXT NOT NULL,
  is_action_taken BOOLEAN DEFAULT FALSE, -- "we acted on this research"
  action_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all research tables
ALTER TABLE research_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_security_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_annotations ENABLE ROW LEVEL SECURITY;

-- RLS policies (team-scoped)
CREATE POLICY "Team research access" ON research_items
  FOR ALL USING (team_id = get_user_team_id());

CREATE POLICY "Team email access" ON research_emails
  FOR ALL USING (team_id = get_user_team_id());

CREATE POLICY "Team annotation access" ON research_annotations
  FOR ALL USING (team_id = get_user_team_id());
```

#### 5.2.3 Edge Function: Email Ingest

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Create `email-ingest` Edge Function | Deno function that receives Postmark inbound webhook JSON. | ✅ Function deployed |
| Validate webhook signature | Verify Postmark webhook signature using shared secret. Return 400 on invalid signature. | ✅ Invalid signatures rejected |
| Parse email metadata | Extract `From`, `To`, `Subject`, `Date`, `TextBody`, `HtmlBody`, `StrippedTextReply`, `Headers`, `SpamScore`. | ✅ All fields correctly parsed |
| Identify team from recipient | Use plus-addressing (`research+{team_slug}@...`) or lookup `from_email` against `team_members`. | ✅ Emails routed to correct team |
| Store raw email | Insert into `research_emails` table via Supabase client (service role). | ✅ Row created with all fields |
| Handle attachments | For each attachment: decode Base64 content, upload to Supabase Storage (`research-attachments/{team_id}/{email_id}/{filename}`), create `research_attachments` row. | ✅ Attachments stored and linked |
| Deduplicate | Check `message_id` uniqueness. Return 200 (but skip processing) if duplicate. | ✅ No duplicate rows created |
| Trigger AI processing | After storing raw email, invoke AI processing (either inline or via queue). Use `EdgeRuntime.waitUntil()` to process after responding 200. | ✅ AI processing triggered |

**Edge Function implementation:**

```typescript
// supabase/functions/email-ingest/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();

  // Validate webhook (Postmark format)
  const messageId = body.MessageID;
  const fromEmail = body.From || body.FromFull?.Email;
  const subject = body.Subject;
  const textBody = body.TextBody;
  const htmlBody = body.HtmlBody;
  const strippedReply = body.StrippedTextReply;
  const spamScore = parseFloat(body.Headers?.find(
    (h: any) => h.Name === 'X-Spam-Score'
  )?.Value || '0');

  // Identify team from sender email
  const { data: member } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', (
      await supabase.from('profiles').select('id').eq('email', fromEmail).single()
    ).data?.id)
    .single();

  const teamId = member?.team_id;
  if (!teamId) {
    console.log(`Unknown sender: ${fromEmail}`);
    return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
  }

  // Deduplicate
  const { data: existing } = await supabase
    .from('research_emails')
    .select('id')
    .eq('message_id', messageId)
    .single();

  if (existing) {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200 });
  }

  // Insert raw email
  const { data: email, error } = await supabase
    .from('research_emails')
    .insert({
      team_id: teamId,
      message_id: messageId,
      from_email: fromEmail,
      from_name: body.FromName || body.FromFull?.Name,
      to_email: body.To,
      subject,
      text_body: textBody,
      html_body: htmlBody,
      stripped_reply: strippedReply,
      headers: body.Headers,
      spam_score: spamScore,
      received_at: body.Date || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Handle attachments
  if (body.Attachments?.length > 0) {
    for (const att of body.Attachments) {
      const bytes = Uint8Array.from(atob(att.Content), c => c.charCodeAt(0));
      const storagePath = `${teamId}/${email.id}/${att.Name}`;

      await supabase.storage
        .from('research-attachments')
        .upload(storagePath, bytes, { contentType: att.ContentType });

      await supabase.from('research_attachments').insert({
        email_id: email.id,
        filename: att.Name,
        content_type: att.ContentType,
        size_bytes: att.ContentLength,
        storage_path: storagePath,
      });
    }
  }

  // Trigger AI processing in background
  EdgeRuntime.waitUntil(processResearch(email.id, teamId, subject, textBody, htmlBody));

  return new Response(JSON.stringify({ ok: true, emailId: email.id }), { status: 200 });
});
```

### 5.3 Phase 2: AI Processing Pipeline (Weeks 4–6)

#### 5.3.1 AI Service

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Choose AI provider | **OpenAI GPT-4o-mini** for cost-efficient summarization and extraction. Budget: ~$0.15/1M input tokens. | ✅ API key configured in Edge Function secrets |
| Implement text extraction | For PDFs: use `pdf-parse` or Supabase Edge Function with `pdf.js`. For DOCX: use `mammoth`. For images: send to GPT-4o with vision. | ✅ Text extracted from all attachment types |
| Implement summarization | Prompt: summarize research in 2-3 paragraphs. Extract: key thesis, bull/bear case, price targets, timeframe. | ✅ Summary generated for each research item |
| Implement ticker extraction | Prompt: extract all stock tickers mentioned. Cross-reference against `securities` table. | ✅ Tickers extracted and linked to securities |
| Implement sentiment analysis | Prompt: classify as bullish/bearish/neutral/mixed with confidence score (-1.0 to 1.0). | ✅ Sentiment assigned to each item |
| Implement theme/sector tagging | Prompt: tag with themes (e.g., "AI", "interest rates", "earnings") and GICS sectors. | ✅ Tags assigned and filterable |
| Create `research_items` row | Combine all AI outputs into structured `research_items` insert. | ✅ Fully enriched row created |
| Link to securities | For each extracted ticker, create `research_security_links` row with relevance score. | ✅ Research viewable from security detail page |
| Mark email as processed | Set `research_emails.processed = true`. On error, set `processing_error`. | ✅ Processing status tracked |

**AI processing function:**

```typescript
async function processResearch(
  emailId: string,
  teamId: string,
  subject: string,
  textBody: string,
  htmlBody: string
) {
  const content = textBody || htmlBody?.replace(/<[^>]*>/g, '') || '';
  if (content.length < 50) return; // Skip very short emails

  const prompt = `Analyze this research email and return a JSON object with:
- title: a concise title (max 100 chars)
- summary: 2-3 paragraph summary of key insights
- tickers: array of stock ticker symbols mentioned (e.g., ["AAPL", "GOOGL"])
- sentiment: "bullish", "bearish", "neutral", or "mixed"
- sentiment_score: number from -1.0 (very bearish) to 1.0 (very bullish)
- themes: array of themes (e.g., ["AI", "cloud computing", "earnings"])
- sectors: array of GICS sectors mentioned
- is_actionable: boolean, true if the research contains a clear trade recommendation
- priority: "low", "normal", "high", or "urgent"

Subject: ${subject}
Body:
${content.slice(0, 8000)}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  const result = await response.json();
  const analysis = JSON.parse(result.choices[0].message.content);

  // Insert research item
  const { data: item } = await supabase
    .from('research_items')
    .insert({
      team_id: teamId,
      email_id: emailId,
      title: analysis.title || subject,
      summary: analysis.summary,
      body_text: content,
      source_type: 'email',
      source_name: 'Email Forward',
      sentiment: analysis.sentiment,
      sentiment_score: analysis.sentiment_score,
      themes: analysis.themes || [],
      sectors: analysis.sectors || [],
      tickers: analysis.tickers || [],
      is_actionable: analysis.is_actionable,
      priority: analysis.priority || 'normal',
    })
    .select()
    .single();

  // Link to securities
  if (analysis.tickers?.length > 0 && item) {
    for (const ticker of analysis.tickers) {
      const { data: security } = await supabase
        .from('securities')
        .select('id')
        .eq('ticker', ticker)
        .single();

      if (security) {
        await supabase.from('research_security_links').insert({
          research_item_id: item.id,
          security_id: security.id,
          relevance_score: 0.8,
        });
      }
    }
  }

  // Mark email as processed
  await supabase
    .from('research_emails')
    .update({ processed: true })
    .eq('id', emailId);
}
```

### 5.4 Phase 3: Research Feed UI (Weeks 6–8)

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Build research feed page | `/research` — infinite-scroll list of `research_items` ordered by `ingested_at DESC`. | ✅ Research items display with title, summary, tickers, sentiment badge |
| Implement full-text search | Search bar using PostgreSQL full-text search: `WHERE search_vector @@ plainto_tsquery('english', $query)`. | ✅ Search returns relevant results in <500ms |
| Build filter sidebar | Filter by: sentiment, sector, theme, ticker, date range, priority, actionable flag. | ✅ Filters narrow results correctly |
| Build research detail view | Click to expand: full summary, body text, attachments (downloadable from Supabase Storage), linked securities, annotations. | ✅ Detail view renders all fields |
| Build annotation panel | Team members can add notes, mark "action taken", describe action. | ✅ Annotations saved and visible to team |
| Build ticker linking UI | Show research items on security detail page. "Related Research" section. | ✅ Security page shows linked research |
| Build research dashboard widgets | Cards: total research this week, top mentioned tickers, sentiment distribution, actionable items count. | ✅ Dashboard widgets render with real data |
| Realtime research feed | Subscribe to `research_items` INSERT via Supabase Realtime. New items appear at top without refresh. | ✅ New research appears within 3s of processing |

### 5.5 Phase 4: Learning & Future Sources (Weeks 9–12)

| Task | Details | Acceptance Criteria |
|------|---------|-------------------|
| Track research outcomes | When annotation has `is_action_taken = true`, link to subsequent trade/order. Calculate if the research thesis played out. | ✅ "Hit rate" metric available |
| Build team preference model | Track which research gets read, annotated, acted on. Weight future AI priority scoring based on patterns. | ✅ Priority scoring improves over time |
| RSS/Substack feed ingestion | Add `research_sources` table. NestJS cron fetches RSS feeds → creates `research_items` via same AI pipeline. | ✅ RSS feeds auto-ingesting |
| Manual research upload | Upload PDF/DOCX directly via UI → same AI processing pipeline. | ✅ Manual upload creates processed research item |

---

## 6. Cross-Cutting Concerns

### 6.1 Testing Strategy

| Layer | Tool | Coverage Target | Details |
|-------|------|----------------|---------|
| **Unit Tests** | Jest | 80%+ | Test services, utilities, transformations. Mock external APIs (Schwab, Supabase, OpenAI). |
| **Integration Tests** | Jest + Supertest | Key flows | Test NestJS endpoints with test Supabase instance. Verify RLS policies with different user contexts. |
| **RLS Policy Tests** | pgTAP or SQL scripts | All policies | Test each policy with each role. Verify positive and negative cases. |
| **E2E Tests** | Playwright | Critical paths | Login → view portfolio → place order → view research. |
| **API Contract Tests** | Jest | All Schwab endpoints | Mock Schwab API responses. Test parsing and error handling. |

**RLS test pattern:**

```sql
-- Test: Advisor in Team A cannot see Team B data
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims TO '{"sub":"user-a-uuid","team_id":"team-a-uuid","user_role":"advisor"}';

-- Should return 0 rows (Team B data)
SELECT count(*) FROM households WHERE team_id = 'team-b-uuid';
-- Expected: 0

-- Should return Team A rows
SELECT count(*) FROM households WHERE team_id = 'team-a-uuid';
-- Expected: > 0
```

### 6.2 CI/CD Pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  Push /   │───▶│  Lint &  │───▶│  Unit &  │───▶│  Build &  │───▶│  Deploy  │
│  PR       │    │  Type    │    │  Integ.  │    │  Preview  │    │  Prod    │
│           │    │  Check   │    │  Tests   │    │  (Vercel) │    │ (manual) │
└──────────┘    └──────────┘    └──────────┘    └───────────┘    └──────────┘
                                      │
                                      ▼
                                ┌──────────┐
                                │ Supabase │
                                │ Migration│
                                │ Check    │
                                └──────────┘
```

| Step | Tool | Details |
|------|------|---------|
| Lint | ESLint + Prettier | Enforce code style |
| Type Check | `tsc --noEmit` | Catch type errors |
| Unit Tests | Jest | Run all `*.spec.ts` |
| Integration Tests | Jest + Supertest | Requires Supabase local (`npx supabase start`) |
| Migration Check | `npx supabase db diff` | Ensure no unapplied schema changes |
| Build | Next.js build + NestJS build | Verify successful compilation |
| Preview Deploy | Vercel preview | Automatic on PR |
| Supabase Edge Functions | `npx supabase functions deploy` | On merge to main |
| Production Deploy | Manual trigger | Requires approval |

### 6.3 Monitoring & Observability

| What | Tool | Details |
|------|------|---------|
| API errors | Sentry | Capture NestJS + Next.js exceptions |
| Supabase metrics | Supabase Dashboard | Database size, API requests, auth events, realtime connections |
| Schwab sync health | Custom `sync_log` table + dashboard widget | Track sync success rate, duration, record counts |
| Edge Function logs | Supabase Dashboard → Edge Functions → Logs | Monitor email ingestion, AI processing |
| Uptime | Supabase built-in (Pro plan) | Database and API uptime monitoring |
| Token expiry | pg_cron + Slack/email alert | Alert 24h before Schwab refresh token expires |

### 6.4 Security

| Concern | Mitigation |
|---------|-----------|
| Schwab credentials | Store `SCHWAB_CLIENT_ID` and `SCHWAB_CLIENT_SECRET` in environment variables, never in code. Tokens stored AES-256 encrypted in database. |
| Supabase service role key | Only used server-side (NestJS). Never exposed to frontend. |
| RLS bypass | Only NestJS (service role) can bypass RLS. Frontend uses anon key (RLS-enforced). |
| Webhook security | Validate Postmark webhook signatures. Rate-limit Edge Function invocations. |
| API rate limiting | NestJS rate limiter (nestjs/throttler): 100 requests/min per user. Schwab-specific rate limiter: 120 orders/min. |
| Data at rest | Supabase encrypts data at rest (AES-256). Backups encrypted. |
| Data in transit | All connections over TLS 1.2+. |
| Audit trail | Every write operation logged to `audit_trail` table with user, action, timestamp, before/after. |

---

## 7. Technical Debt Resolution

### 7.1 Priority Debt Items

| # | Issue | Impact | Fix | Week |
|---|-------|--------|-----|------|
| 1 | **Double API prefix** | Routes like `/api/api/v1/...` | Audit all `@Controller()` decorators and NestJS `setGlobalPrefix()`. Standardize to `/api/v1/...`. | 1 |
| 2 | **No pagination** | All list endpoints return entire tables | Implement cursor-based pagination utility. Add `?cursor=&limit=` to all list endpoints. Default limit: 50. Max: 200. | 2 |
| 3 | **No WebSocket support** | No real-time updates | Replaced by Supabase Realtime (Workstream 1). Remove any WS stubs. | 4 |
| 4 | **Mock integrations** | Schwab adapter is mocked | Replaced by live integration (Workstream 2). Delete mock files. | 3 |
| 5 | **No test coverage** | Zero tests | Add tests incrementally with each workstream phase. Target 80% by week 12. | 1–12 |
| 6 | **No error handling standards** | Inconsistent API error responses | Create `HttpExceptionFilter` returning `{ statusCode, message, error, timestamp }`. Apply globally. | 1 |
| 7 | **Outlook mock integration** | Not functional | Phase 2 priority (post-12-week scope). Document as deferred. | — |
| 8 | **No database migrations** | Schema changes applied manually | Adopt Supabase migrations (`npx supabase migration new`). All schema changes via migration files. | 1 |
| 9 | **No input validation** | Endpoints accept malformed data | Add `class-validator` DTOs with `ValidationPipe` globally. | 2 |
| 10 | **No API documentation** | No Swagger/OpenAPI | Add `@nestjs/swagger` with decorators on all endpoints. Serve at `/api/docs`. | 3 |

### 7.2 Double API Prefix Fix

```typescript
// BEFORE (main.ts)
app.setGlobalPrefix('api'); // This adds /api

// Controller has:
@Controller('api/v1/households') // This adds /api/v1/households
// Result: /api/api/v1/households ❌

// AFTER (main.ts)
app.setGlobalPrefix('api/v1'); // Sets /api/v1

// Controller becomes:
@Controller('households') // Just the resource name
// Result: /api/v1/households ✅
```

### 7.3 Pagination Implementation

```typescript
// src/common/dto/pagination.dto.ts
export class PaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string; // Last item ID from previous page

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}

// src/common/interfaces/paginated-response.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    cursor: string | null; // Next cursor (null if last page)
    hasMore: boolean;
    count: number;
  };
}

// Usage in service:
async findAll(teamId: string, pagination: PaginationDto): Promise<PaginatedResponse<Household>> {
  const { cursor, limit } = pagination;
  const query = this.repo.createQueryBuilder('h')
    .where('h.team_id = :teamId', { teamId })
    .orderBy('h.created_at', 'DESC')
    .take(limit + 1); // Fetch one extra to determine hasMore

  if (cursor) {
    query.andWhere('h.id < :cursor', { cursor });
  }

  const results = await query.getMany();
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;

  return {
    data,
    meta: {
      cursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
      count: data.length,
    },
  };
}
```

---

## 8. Implementation Timeline

### 8.1 12-Week Gantt Overview

```
Week    1    2    3    4    5    6    7    8    9    10   11   12
────────────────────────────────────────────────────────────────
WS1: Supabase Migration
Schema  ████████
RLS          ████████
Auth              ████████
Realtime               ████████
Storage                ████████
Edge Fn                     ████

WS2: Schwab Integration
OAuth   ████████████
Acct Sync        ████████████
Orders                ████████████
Market Data                ████████████
Streaming                       ████████████
Dashboard                            ████████████

WS3: Research Engine
Email Setup  ████████████
AI Pipeline           ████████████
Feed UI                    ████████████
Learning                              ████████████

Cross-Cutting
Tech Debt ████████████
Testing   ████████████████████████████████████████████████
CI/CD     ████████
Monitoring                                    ████████████
────────────────────────────────────────────────────────────────
```

### 8.2 Week-by-Week Detail

#### Week 1 (Mar 2–6)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 1.1 | Create Supabase project, configure settings | WS1 | Lead | Supabase project live |
| 1.2 | Export current schema, audit TypeORM entities | WS1 | Lead | Schema export + audit report |
| 1.3 | Register Schwab developer app | WS2 | Lead | App registration submitted |
| 1.4 | Fix double API prefix | Debt | Dev | All routes corrected |
| 1.5 | Set up error handling filter | Debt | Dev | Global exception filter |
| 1.6 | Set up Jest + first test file | Testing | Dev | Test runner configured |
| 1.7 | Set up CI pipeline (lint + type check + test) | CI/CD | Lead | GitHub Actions workflow |

#### Week 2 (Mar 9–13)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 2.1 | Add `team_id` columns, create `teams`/`team_members` tables | WS1 | Lead | Schema migration applied |
| 2.2 | Restore schema to Supabase, migrate reference data | WS1 | Lead | All tables in Supabase |
| 2.3 | Create RLS helper functions | WS1 | Lead | `get_user_team_id()`, `get_user_role()` |
| 2.4 | Begin RLS policy implementation (core tables) | WS1 | Dev | RLS on households, accounts, persons |
| 2.5 | Set up Postmark inbound domain | WS3 | Lead | MX records configured |
| 2.6 | Implement pagination utility | Debt | Dev | Pagination DTO + utility |
| 2.7 | Add input validation (class-validator) | Debt | Dev | ValidationPipe global |

#### Week 3 (Mar 16–20)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 3.1 | Complete RLS policies for all tenant tables | WS1 | Lead | All 58+ tables have RLS |
| 3.2 | RLS testing matrix (all roles × all tables) | WS1 | Dev | Test report |
| 3.3 | Schwab OAuth: implement auth URL + callback + token exchange | WS2 | Lead | OAuth flow working |
| 3.4 | Schwab token storage + refresh scheduler | WS2 | Lead | Tokens auto-refreshing |
| 3.5 | Create research database schema | WS3 | Dev | Migration applied |
| 3.6 | Add Swagger/OpenAPI docs | Debt | Dev | `/api/docs` live |

#### Week 4 (Mar 23–27)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 4.1 | Configure Supabase Auth providers | WS1 | Lead | Auth settings configured |
| 4.2 | Custom access token hook (team_id, role in JWT) | WS1 | Lead | JWT contains team context |
| 4.3 | Create user migration script | WS1 | Dev | All users migrated |
| 4.4 | Schwab account hash mapping | WS2 | Lead | Account hashes stored |
| 4.5 | Begin account/position sync service | WS2 | Lead | Sync service scaffolded |
| 4.6 | Deploy `email-ingest` Edge Function | WS3 | Dev | Emails received and stored |
| 4.7 | Test email → Edge Function → database flow | WS3 | Dev | End-to-end email ingest working |

#### Week 5 (Mar 30–Apr 3)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 5.1 | NestJS `SupabaseAuthGuard` + RBAC refactor | WS1 | Lead | Auth guard replaced |
| 5.2 | Frontend auth swap (Supabase client + provider) | WS1 | Dev | Login/logout working with Supabase |
| 5.3 | Enable Supabase Realtime on key tables | WS1 | Lead | Realtime configured |
| 5.4 | Set up Supabase Storage buckets + policies | WS1 | Dev | Storage operational |
| 5.5 | Complete position sync with diff engine | WS2 | Lead | Positions syncing every 15 min |
| 5.6 | Transaction sync (daily) | WS2 | Lead | Transactions syncing |
| 5.7 | Implement AI processing pipeline | WS3 | Dev | Emails processed with summaries, tickers, sentiment |

#### Week 6 (Apr 6–10)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 6.1 | Remove old JWT auth module | WS1 | Lead | Dead code removed |
| 6.2 | Frontend direct Supabase queries for reads | WS1 | Dev | Dashboard loads via Supabase client |
| 6.3 | Realtime subscriptions in frontend (positions, alerts) | WS1 | Dev | Live updates in UI |
| 6.4 | Implement order preview + placement | WS2 | Lead | Orders placeable via CRM |
| 6.5 | Implement order modification + cancellation | WS2 | Lead | Full order lifecycle |
| 6.6 | Complete AI processing (attachments, linking) | WS3 | Dev | PDFs parsed, tickers linked |
| 6.7 | Begin research feed UI | WS3 | Dev | `/research` page scaffolded |

#### Week 7 (Apr 13–17)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 7.1 | Compliance pre-check for orders | WS2 | Lead | Non-compliant orders blocked |
| 7.2 | Order entry UI with preview | WS2 | Dev | Order form functional |
| 7.3 | Schwab streaming client (login, connection) | WS2 | Lead | WebSocket connected to Schwab |
| 7.4 | Subscribe to LEVELONE_EQUITIES + ACCT_ACTIVITY | WS2 | Lead | Streaming data received |
| 7.5 | Research feed: search + filters | WS3 | Dev | Full-text search working |
| 7.6 | Research detail view + annotations | WS3 | Dev | Detail page complete |
| 7.7 | Integration tests for Schwab sync | Testing | Dev | Sync tests passing |

#### Week 8 (Apr 20–24)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 8.1 | Quote service with Redis caching | WS2 | Lead | Quotes <200ms |
| 8.2 | Price history for charts | WS2 | Lead | Chart data loading |
| 8.3 | Option chain + movers | WS2 | Dev | Market data endpoints live |
| 8.4 | Bridge streaming → Supabase Realtime | WS2 | Lead | Frontend receives live quotes |
| 8.5 | Real-time portfolio view with streaming prices | WS2 | Dev | Positions update live |
| 8.6 | Research feed: ticker linking + security page integration | WS3 | Dev | Research visible from security pages |
| 8.7 | E2E tests: login → portfolio → order flow | Testing | Dev | Critical path tested |

#### Week 9 (Apr 27–May 1)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 9.1 | Account summary cards (total value, day P&L) | WS2 | Dev | Summary cards on dashboard |
| 9.2 | Watchlist with streaming quotes | WS2 | Dev | Watchlist functional |
| 9.3 | Order blotter with live status | WS2 | Dev | Blotter shows real-time status |
| 9.4 | Stream reconnection + market hours handling | WS2 | Lead | Robust stream management |
| 9.5 | Research dashboard widgets | WS3 | Dev | Widgets rendering |
| 9.6 | Research outcome tracking setup | WS3 | Dev | Action tracking schema + UI |
| 9.7 | Set up Sentry error monitoring | Monitoring | Lead | Errors captured |

#### Week 10 (May 4–8)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 10.1 | Intraday chart widget | WS2 | Dev | Live chart component |
| 10.2 | Sync health dashboard | WS2 | Lead | Monitoring widget |
| 10.3 | Token expiry alerting | WS2 | Lead | Alerts firing correctly |
| 10.4 | RSS feed ingestion prototype | WS3 | Dev | RSS sources auto-ingesting |
| 10.5 | Manual research upload | WS3 | Dev | PDF/DOCX upload + AI processing |
| 10.6 | Load testing (50 concurrent users) | Testing | Lead | Performance baseline established |
| 10.7 | Security audit (RLS, tokens, secrets) | Security | Lead | Audit report |

#### Week 11 (May 11–15)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 11.1 | Bug fixes from testing | All | Team | Issues resolved |
| 11.2 | Performance optimization (query analysis, indexing) | All | Lead | Slow queries identified and fixed |
| 11.3 | Documentation: Runbook + architecture doc | All | Lead | Ops documentation |
| 11.4 | Documentation: User guide for research workflow | WS3 | Dev | User-facing documentation |
| 11.5 | Staging environment deployment | All | Lead | Full staging environment operational |
| 11.6 | UAT with team (2-5 advisors) | All | Team | Feedback collected |

#### Week 12 (May 18–22)
| ID | Task | Workstream | Owner | Deliverable |
|----|------|-----------|-------|-------------|
| 12.1 | Address UAT feedback | All | Team | Critical feedback resolved |
| 12.2 | Production deployment | All | Lead | Production environment live |
| 12.3 | DNS cutover + SSL | All | Lead | Domain pointing to new system |
| 12.4 | Data migration from old system | All | Lead | All production data migrated |
| 12.5 | Team training session | All | Lead | Team trained on new features |
| 12.6 | Monitoring verification | All | Lead | All alerts and dashboards confirmed |
| 12.7 | Retrospective + v2 planning | All | Team | Retro doc + next roadmap |

---

## 9. Risk Register

| # | Risk | Likelihood | Impact | Mitigation | Contingency |
|---|------|-----------|--------|-----------|-------------|
| R1 | Schwab app approval delayed beyond 3 days | Medium | High | Submit app registration Day 1. Follow up proactively. | Build against mock API while waiting; swap to live when approved. |
| R2 | Schwab refresh token expires (7-day limit) | High | High | Implement 24h-advance alerting. Schedule automatic re-auth reminders. | Manual re-auth flow takes <2 min. Document procedure for all team members. |
| R3 | Schwab streaming message format issues | Medium | Medium | Known issue with WebSocket "Bad command formatting." Use `schwab-py` docs as reference for correct format. | Fall back to REST polling (15s interval) for quotes during debugging. |
| R4 | RLS policies block legitimate access | Medium | High | Comprehensive test matrix (Phase 2). Test every role × table combination. | Service role fallback in NestJS for emergency reads. Quick policy patch process. |
| R5 | Supabase Realtime connection limits | Low | Medium | Pro plan supports 500 concurrent connections (sufficient for 2-5 users). | Degrade gracefully to polling if limits hit. |
| R6 | AI processing costs exceed budget | Low | Low | GPT-4o-mini is $0.15/1M input tokens. At 50 emails/day × 2K tokens = ~$0.45/month. | Cap at 100 emails/day. Switch to local model (Llama) if costs rise. |
| R7 | Email ingest spam/abuse | Medium | Medium | Validate sender against `team_members`. Check spam score. Rate limit per sender. | Disable public ingest endpoint; switch to sender whitelist. |
| R8 | Schema migration data loss | Low | Critical | Full backup before migration. Use logical replication for zero-downtime migration. Verify row counts post-migration. | Restore from backup. Keep old system running in read-only mode for 2 weeks post-migration. |
| R9 | Team bandwidth (2-5 people, 12-week timeline) | High | High | Prioritize ruthlessly. Workstream 1 (Supabase) is prerequisite for 2 and 3. Parallelize where possible. | Extend timeline to 16 weeks. Defer RSS ingestion and advanced streaming to v2. |
| R10 | Schwab API rate limiting on order endpoints | Medium | Medium | Implement token-bucket rate limiter. Queue orders if rate exceeded. | Batch operations where possible. Add user-facing "order queued" status. |
| R11 | TypeORM ↔ Supabase schema drift | Medium | Medium | Use Supabase migrations as source of truth. Generate TypeORM entities from schema (not reverse). | `typeorm-model-generator` to regenerate entities from live schema. |
| R12 | Schwab API breaking changes | Low | High | Pin to known API version. Monitor Schwab developer changelog. | Community libraries (schwab-py, schwab-td-ameritrade-api) often have quick patches. |

---

## 10. API & Service Inventory

### 10.1 External APIs

| Service | Purpose | Auth | Cost | Docs |
|---------|---------|------|------|------|
| **Schwab Trader API** | Accounts, positions, orders, transactions | OAuth 2.0 (30-min access / 7-day refresh) | Free (requires Schwab account) | [developer.schwab.com](https://developer.schwab.com) |
| **Schwab Market Data API** | Quotes, price history, option chains, movers, instruments | Same OAuth 2.0 token | Free | [developer.schwab.com](https://developer.schwab.com) |
| **Schwab Streaming** | Real-time quotes, Level 2, account activity | WebSocket + streamer credentials from `/userPreference` | Free | [schwab-py docs](https://schwab-py.readthedocs.io/en/latest/streaming.html) |
| **OpenAI API** | Research summarization, ticker extraction, sentiment analysis | API key (Bearer token) | ~$0.15/1M input tokens (GPT-4o-mini) | [platform.openai.com](https://platform.openai.com/docs) |
| **Postmark** | Inbound email parsing | Webhook + signature verification | Free tier: 100 emails/month. Paid: $15/month for 10K | [postmarkapp.com/developer](https://postmarkapp.com/developer/webhooks/inbound-webhook) |

### 10.2 Infrastructure Services

| Service | Purpose | Plan | Cost |
|---------|---------|------|------|
| **Supabase** | Database, Auth, Realtime, Storage, Edge Functions | Pro | $25/month + usage |
| **Vercel** | Next.js frontend hosting | Pro | $20/month |
| **GitHub Actions** | CI/CD | Free tier | $0 (for private repos: 2,000 min/month) |
| **Sentry** | Error monitoring | Team | $26/month |
| **Redis** (Supabase or Upstash) | Caching for quotes, rate limiting | Upstash Free or Supabase Redis | $0–$10/month |

### 10.3 NPM Packages

| Package | Purpose | Workstream |
|---------|---------|-----------|
| `@supabase/supabase-js` | Supabase client for both NestJS and Next.js | WS1 |
| `@supabase/ssr` | Supabase server-side rendering helpers for Next.js | WS1 |
| `@nestjs/swagger` | OpenAPI documentation | Debt |
| `class-validator` + `class-transformer` | DTO validation | Debt |
| `@nestjs/throttler` | Rate limiting | Debt |
| `ws` | WebSocket client for Schwab streaming | WS2 |
| `node-cron` or `pg_cron` | Scheduled sync jobs | WS2 |
| `pdf-parse` | PDF text extraction for research | WS3 |
| `mammoth` | DOCX text extraction for research | WS3 |
| `@sentry/nestjs` + `@sentry/nextjs` | Error monitoring | Cross-cutting |

### 10.4 Schwab API Product Requirements

| Product | Capabilities Needed |
|---------|-------------------|
| **Accounts and Trading Production** | `GET /accounts/accountNumbers`, `GET /accounts/{hash}`, `GET/POST/PUT/DELETE /orders`, `GET /transactions`, `GET /userPreference` |
| **Market Data Production** | `GET /quotes`, `GET /pricehistory`, `GET /chains`, `GET /movers`, `GET /markets`, `GET /instruments` |

### 10.5 Environment Variables

```bash
# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres

# Schwab
SCHWAB_CLIENT_ID=<app-key>
SCHWAB_CLIENT_SECRET=<app-secret>
SCHWAB_CALLBACK_URL=https://<domain>/api/schwab/callback

# OpenAI (for research AI processing)
OPENAI_API_KEY=sk-...

# Postmark (for email ingest)
POSTMARK_WEBHOOK_SECRET=<secret>

# Sentry
SENTRY_DSN=https://<key>@sentry.io/<project>

# Redis (if using external)
REDIS_URL=redis://...
```

---

## Appendix A: Migration Checklist

- [ ] Supabase project created and configured
- [ ] Schema exported from current PostgreSQL
- [ ] `team_id` added to all tenant tables
- [ ] `teams` and `team_members` tables created
- [ ] Schema restored to Supabase
- [ ] Reference data migrated
- [ ] RLS helper functions created
- [ ] RLS policies on all tables
- [ ] RLS test matrix passed
- [ ] Supabase Auth configured
- [ ] Custom access token hook deployed
- [ ] User migration script executed
- [ ] NestJS auth guard replaced
- [ ] Frontend auth swapped to Supabase
- [ ] Old JWT module removed
- [ ] Supabase Realtime enabled on key tables
- [ ] Storage buckets created with policies
- [ ] Edge Functions deployed
- [ ] Schwab OAuth flow working
- [ ] Schwab token refresh automated
- [ ] Account hashes mapped
- [ ] Position sync operational
- [ ] Transaction sync operational
- [ ] Order placement tested (paper trading)
- [ ] Streaming client connected
- [ ] Email ingest pipeline working
- [ ] AI processing generating summaries
- [ ] Research feed UI functional
- [ ] All critical tests passing
- [ ] Production deployed
- [ ] Team trained

---

## Appendix B: Schwab Order Types Reference

| Order Type | JSON `orderType` | Required Fields |
|-----------|-----------------|-----------------|
| Market | `MARKET` | symbol, instruction, quantity |
| Limit | `LIMIT` | symbol, instruction, quantity, price |
| Stop | `STOP` | symbol, instruction, quantity, stopPrice |
| Stop-Limit | `STOP_LIMIT` | symbol, instruction, quantity, price, stopPrice |
| Trailing Stop | `TRAILING_STOP` | symbol, instruction, quantity, stopPriceLinkBasis, stopPriceLinkType, stopPriceOffset |
| Market on Close | `MARKET_ON_CLOSE` | symbol, instruction, quantity |
| Limit on Close | `LIMIT_ON_CLOSE` | symbol, instruction, quantity, price |

| Duration | JSON `duration` | Description |
|---------|----------------|-------------|
| Day | `DAY` | Expires end of trading day |
| GTC | `GOOD_TILL_CANCEL` | Good until cancelled (90 calendar days max) |
| Fill or Kill | `FILL_OR_KILL` | Must fill entirely or cancel immediately |

| Instruction | JSON `instruction` | Description |
|------------|-------------------|-------------|
| Buy | `BUY` | Open long position |
| Sell | `SELL` | Close long position |
| Buy to Cover | `BUY_TO_COVER` | Close short position |
| Sell Short | `SELL_SHORT` | Open short position |

---

*This roadmap is a living document. Update weekly during standup. Track progress against the week-by-week timeline in Section 8.2.*
