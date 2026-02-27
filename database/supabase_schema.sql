-- =============================================================================
-- WEALTH MANAGEMENT CRM / PORTFOLIO MANAGEMENT TOOL
-- Supabase PostgreSQL Schema with Row-Level Security
-- Generated: 2026-02-27
-- =============================================================================
-- Run this in Supabase SQL Editor (or via psql against your Supabase project).
-- Execute as the postgres / service_role user so RLS policies can be created.
-- =============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- trigram full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";     -- GIN indexes on JSONB + composite


-- ────────────────────────────────────────────────────────────────────────────
-- 1. ENUM TYPES
-- ────────────────────────────────────────────────────────────────────────────

-- User roles within the platform
CREATE TYPE user_role AS ENUM (
    'super_admin',      -- Platform-level admin (Supabase service role only)
    'firm_admin',       -- Admin for a specific firm / RIA
    'advisor',          -- Wealth advisor / relationship manager
    'compliance',       -- Compliance officer (read-all within firm)
    'analyst',          -- Research / operations analyst
    'read_only',        -- View-only access
    'client'            -- Client portal user (future)
);

-- Household / account types
CREATE TYPE household_type AS ENUM ('individual', 'joint', 'trust', 'entity', 'other');
CREATE TYPE account_type AS ENUM (
    'individual_brokerage', 'joint_brokerage',
    'traditional_ira', 'roth_ira', 'sep_ira', 'simple_ira', 'inherited_ira',
    '401k', '403b', '457', 'defined_benefit',
    'trust', 'corporate', 'partnership', 'custodial_utma', 'custodial_ugma',
    'hsa', '529', 'other'
);
CREATE TYPE account_tax_status AS ENUM ('taxable', 'tax_deferred', 'tax_exempt');
CREATE TYPE record_status AS ENUM ('active', 'inactive', 'archived', 'pending');

-- Person / relationship types
CREATE TYPE person_type AS ENUM (
    'primary_client', 'joint_client', 'beneficiary', 'trustee',
    'guardian', 'power_of_attorney', 'executor', 'contact', 'other'
);

-- Transaction types
CREATE TYPE transaction_type AS ENUM (
    'buy', 'sell', 'dividend', 'interest', 'deposit', 'withdrawal',
    'fee', 'transfer_in', 'transfer_out', 'reinvestment', 'split',
    'spinoff', 'merger', 'corporate_action', 'other'
);

-- Asset class / security types
CREATE TYPE asset_class AS ENUM (
    'equity', 'fixed_income', 'cash', 'real_estate', 'alternative',
    'commodity', 'currency', 'cryptocurrency', 'mutual_fund', 'etf',
    'annuity', 'insurance', 'other'
);

-- Task / workflow statuses and priorities
CREATE TYPE task_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled', 'on_hold');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'completed', 'cancelled', 'archived');

-- Document types
CREATE TYPE document_type AS ENUM (
    'account_statement', 'tax_document', 'agreement', 'disclosure',
    'investment_policy', 'financial_plan', 'correspondence',
    'kyc_aml', 'compliance', 'research', 'other'
);

-- Compliance
CREATE TYPE compliance_review_status AS ENUM ('scheduled', 'in_progress', 'completed', 'failed', 'waived');

-- Custodian sync
CREATE TYPE sync_status AS ENUM ('pending', 'running', 'success', 'partial', 'failed');

-- Fee schedule types
CREATE TYPE fee_type AS ENUM ('aum_percentage', 'flat_fee', 'hourly', 'performance', 'hybrid');

-- Legal entity types
CREATE TYPE legal_entity_type AS ENUM (
    'llc', 'lp', 'lllp', 'corporation', 's_corp', 'sole_proprietor',
    'trust_revocable', 'trust_irrevocable', 'foundation', 'partnership', 'other'
);

-- Prospect status
CREATE TYPE prospect_status AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'inactive');

-- Research ingestion
CREATE TYPE research_source_type AS ENUM ('email', 'rss', 'substack', 'api', 'manual');
CREATE TYPE research_item_status AS ENUM ('pending', 'processing', 'processed', 'failed', 'archived');
CREATE TYPE research_tag_type AS ENUM ('sector', 'theme', 'security', 'custom');
CREATE TYPE research_mention_type AS ENUM ('bullish', 'bearish', 'neutral', 'mentioned');
CREATE TYPE research_action_type AS ENUM ('read', 'bookmarked', 'shared', 'acted_on', 'dismissed');

-- Notification types
CREATE TYPE notification_type AS ENUM (
    'task_assigned', 'task_due', 'meeting_reminder', 'document_uploaded',
    'compliance_alert', 'price_alert', 'sync_complete', 'sync_failed',
    'research_item', 'system', 'other'
);


-- ────────────────────────────────────────────────────────────────────────────
-- 2. HELPER FUNCTIONS FOR RLS
-- ────────────────────────────────────────────────────────────────────────────

-- Returns the firm_id of the currently authenticated user (cached via STABLE)
CREATE OR REPLACE FUNCTION get_user_firm_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT firm_id
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;
$$;

-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;
$$;

-- Returns TRUE if the current user is a firm_admin or compliance officer
CREATE OR REPLACE FUNCTION is_firm_admin_or_compliance()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role IN ('firm_admin', 'compliance', 'super_admin')
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;
$$;

-- Returns TRUE if the current user has write capability (not read_only / client)
CREATE OR REPLACE FUNCTION can_write()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role NOT IN ('read_only', 'client')
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;
$$;

-- Returns TRUE if a given household_id belongs to the current user's firm
CREATE OR REPLACE FUNCTION household_in_firm(p_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.households h
        WHERE h.id = p_household_id
          AND h.firm_id = get_user_firm_id()
    );
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. UTILITY: updated_at TRIGGER FUNCTION
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Macro to attach the trigger to any table that has updated_at
-- Usage: SELECT attach_updated_at_trigger('table_name');
CREATE OR REPLACE FUNCTION attach_updated_at_trigger(p_table TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
        p_table, p_table
    );
END;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 4. FIRMS TABLE (top-level multi-tenancy)
-- ────────────────────────────────────────────────────────────────────────────
-- Every record in the system is scoped to a firm.
CREATE TABLE public.firms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,           -- URL-safe identifier
    crd_number      TEXT,                           -- FINRA CRD number
    ein             TEXT,                           -- Tax ID
    address         JSONB,                          -- {street, city, state, zip, country}
    phone           TEXT,
    website         TEXT,
    logo_url        TEXT,
    settings        JSONB DEFAULT '{}'::JSONB,      -- Feature flags, preferences
    status          record_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.firms IS 'Top-level tenant entity. Each RIA / wealth management firm gets one row.';
COMMENT ON COLUMN public.firms.slug IS 'URL-safe unique identifier used in routing.';
COMMENT ON COLUMN public.firms.crd_number IS 'FINRA Central Registration Depository number.';

SELECT attach_updated_at_trigger('firms');


-- ────────────────────────────────────────────────────────────────────────────
-- 5. PROFILES (replaces legacy users table — linked to auth.users)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL DEFAULT '',
    last_name       TEXT NOT NULL DEFAULT '',
    email           TEXT NOT NULL,
    phone           TEXT,
    title           TEXT,                           -- e.g. "Senior Wealth Advisor"
    avatar_url      TEXT,
    role            user_role NOT NULL DEFAULT 'advisor',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    preferences     JSONB DEFAULT '{}'::JSONB,      -- UI preferences, notifications
    last_seen_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Extended user profile linked to Supabase auth.users. One row per authenticated user.';
COMMENT ON COLUMN public.profiles.id IS 'Maps directly to auth.users.id (UUID).';
COMMENT ON COLUMN public.profiles.firm_id IS 'The firm this user belongs to — primary RLS discriminator.';
COMMENT ON COLUMN public.profiles.role IS 'Authorization role governing RLS policy access.';

SELECT attach_updated_at_trigger('profiles');

-- Automatically create a profile skeleton on new user sign-up
-- (Firm assignment must be done via admin workflow after sign-up)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only insert if a firm_id is supplied in raw_user_meta_data
    IF (NEW.raw_user_meta_data->>'firm_id') IS NOT NULL THEN
        INSERT INTO public.profiles (id, firm_id, email, first_name, last_name, role)
        VALUES (
            NEW.id,
            (NEW.raw_user_meta_data->>'firm_id')::UUID,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'advisor')
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ────────────────────────────────────────────────────────────────────────────
-- 6. HOUSEHOLDS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.households (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id                 UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    name                    TEXT NOT NULL,
    type                    household_type NOT NULL DEFAULT 'individual',
    status                  record_status NOT NULL DEFAULT 'active',
    primary_advisor_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    secondary_advisor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    aum                     NUMERIC(18,2),               -- Cached AUM (updated by sync)
    risk_profile            TEXT,                        -- e.g. 'aggressive', 'moderate'
    investment_objectives   TEXT,
    notes                   TEXT,
    tags                    TEXT[] DEFAULT '{}',
    metadata                JSONB DEFAULT '{}'::JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.households IS 'A household groups one or more persons and accounts under a single advisory relationship.';
COMMENT ON COLUMN public.households.firm_id IS 'Firm ownership — used in every RLS policy on downstream tables.';

SELECT attach_updated_at_trigger('households');

CREATE INDEX idx_households_firm_id ON public.households(firm_id);
CREATE INDEX idx_households_primary_advisor ON public.households(primary_advisor_id);
CREATE INDEX idx_households_status ON public.households(status);
CREATE INDEX idx_households_name_trgm ON public.households USING GIN (name gin_trgm_ops);


-- ────────────────────────────────────────────────────────────────────────────
-- 7. PERSONS (clients, beneficiaries, trustees, etc.)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.persons (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id    UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    type            person_type NOT NULL DEFAULT 'primary_client',
    date_of_birth   DATE,
    ssn_last4       TEXT,                           -- Last 4 digits only — never store full SSN
    gender          TEXT,
    citizenship     TEXT,
    address         JSONB,
    employment      JSONB,                          -- {employer, title, income_range}
    profile_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  -- If they have a login
    notes           TEXT,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.persons IS 'Individual people associated with a household (clients, beneficiaries, trustees, etc.).';
COMMENT ON COLUMN public.persons.ssn_last4 IS 'Store last 4 digits only. Full SSN must never be persisted here.';

SELECT attach_updated_at_trigger('persons');

CREATE INDEX idx_persons_household_id ON public.persons(household_id);
CREATE INDEX idx_persons_email ON public.persons(email);
CREATE INDEX idx_persons_name_trgm ON public.persons
    USING GIN ((first_name || ' ' || last_name) gin_trgm_ops);


-- ────────────────────────────────────────────────────────────────────────────
-- 8. SECURITIES (master security list)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.securities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker          TEXT,
    cusip           TEXT UNIQUE,
    isin            TEXT,
    sedol           TEXT,
    name            TEXT NOT NULL,
    asset_class     asset_class NOT NULL DEFAULT 'equity',
    sector          TEXT,
    industry        TEXT,
    exchange        TEXT,
    currency        TEXT NOT NULL DEFAULT 'USD',
    current_price   NUMERIC(18,6),
    price_date      DATE,
    last_updated    TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    metadata        JSONB DEFAULT '{}'::JSONB,      -- Extra fields from data providers
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.securities IS 'Master reference table for all tradeable securities. Firm-agnostic (shared across all tenants).';

SELECT attach_updated_at_trigger('securities');

CREATE UNIQUE INDEX idx_securities_ticker ON public.securities(ticker) WHERE ticker IS NOT NULL;
CREATE INDEX idx_securities_asset_class ON public.securities(asset_class);
CREATE INDEX idx_securities_name_trgm ON public.securities USING GIN (name gin_trgm_ops);
CREATE INDEX idx_securities_ticker_trgm ON public.securities USING GIN (ticker gin_trgm_ops);


-- ────────────────────────────────────────────────────────────────────────────
-- 9. ACCOUNTS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.accounts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id            UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    account_number          TEXT NOT NULL,
    display_name            TEXT,
    account_type            account_type NOT NULL,
    custodian               TEXT NOT NULL,          -- 'schwab', 'fidelity', 'pershing', etc.
    status                  record_status NOT NULL DEFAULT 'active',
    tax_status              account_tax_status NOT NULL DEFAULT 'taxable',
    opened_date             DATE,
    closed_date             DATE,
    total_value             NUMERIC(18,2),          -- Cached — updated on sync
    cash_balance            NUMERIC(18,2),
    cost_basis              NUMERIC(18,2),
    unrealized_gain_loss    NUMERIC(18,2),
    management_fee_rate     NUMERIC(8,6),            -- Basis points as decimal
    notes                   TEXT,
    metadata                JSONB DEFAULT '{}'::JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.accounts IS 'Brokerage / retirement accounts belonging to a household.';

SELECT attach_updated_at_trigger('accounts');

CREATE INDEX idx_accounts_household_id ON public.accounts(household_id);
CREATE INDEX idx_accounts_custodian ON public.accounts(custodian);
CREATE INDEX idx_accounts_status ON public.accounts(status);
CREATE UNIQUE INDEX idx_accounts_number_custodian ON public.accounts(account_number, custodian);


-- ────────────────────────────────────────────────────────────────────────────
-- 10. POSITIONS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.positions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id              UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    security_id             UUID NOT NULL REFERENCES public.securities(id) ON DELETE RESTRICT,
    quantity                NUMERIC(24,8) NOT NULL DEFAULT 0,
    market_value            NUMERIC(18,2),
    cost_basis              NUMERIC(18,2),
    cost_basis_per_share    NUMERIC(18,6),
    unrealized_gain_loss    NUMERIC(18,2),
    unrealized_gain_loss_pct NUMERIC(10,6),
    as_of_date              DATE NOT NULL,
    lot_details             JSONB,                  -- Array of tax lots
    metadata                JSONB DEFAULT '{}'::JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.positions IS 'Current holdings within an account as of a given date.';

SELECT attach_updated_at_trigger('positions');

CREATE INDEX idx_positions_account_id ON public.positions(account_id);
CREATE INDEX idx_positions_security_id ON public.positions(security_id);
CREATE INDEX idx_positions_as_of_date ON public.positions(as_of_date);
CREATE UNIQUE INDEX idx_positions_account_security_date ON public.positions(account_id, security_id, as_of_date);


-- ────────────────────────────────────────────────────────────────────────────
-- 11. TRANSACTIONS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    security_id         UUID REFERENCES public.securities(id) ON DELETE SET NULL,
    type                transaction_type NOT NULL,
    trade_date          DATE NOT NULL,
    settlement_date     DATE,
    quantity            NUMERIC(24,8),
    price               NUMERIC(18,6),
    gross_amount        NUMERIC(18,2),
    net_amount          NUMERIC(18,2),
    fees                NUMERIC(18,2) DEFAULT 0,
    taxes               NUMERIC(18,2) DEFAULT 0,
    currency            TEXT NOT NULL DEFAULT 'USD',
    description         TEXT,
    custodian_ref       TEXT,                       -- Custodian transaction ID
    lot_assignments     JSONB,                      -- Which tax lots were affected
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.transactions IS 'Ledger of all investment transactions (buys, sells, dividends, fees, etc.).';

SELECT attach_updated_at_trigger('transactions');

CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_security_id ON public.transactions(security_id);
CREATE INDEX idx_transactions_trade_date ON public.transactions(trade_date);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_custodian_ref ON public.transactions(custodian_ref) WHERE custodian_ref IS NOT NULL;


-- ────────────────────────────────────────────────────────────────────────────
-- 12. LEGAL ENTITIES (LLCs, Trusts, Partnerships as account owners)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.legal_entities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id    UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    entity_type     legal_entity_type NOT NULL,
    tax_id          TEXT,                           -- EIN or SSN
    jurisdiction    TEXT,                           -- State of formation
    formation_date  DATE,
    dissolution_date DATE,
    address         JSONB,
    signatories     JSONB,                          -- [{person_id, role, authority}]
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('legal_entities');


-- ────────────────────────────────────────────────────────────────────────────
-- 13. BENEFICIARY DESIGNATIONS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.beneficiary_designations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    person_id       UUID REFERENCES public.persons(id) ON DELETE SET NULL,
    entity_id       UUID REFERENCES public.legal_entities(id) ON DELETE SET NULL,
    designation_type TEXT NOT NULL DEFAULT 'primary',  -- 'primary', 'contingent', 'final'
    percentage      NUMERIC(5,2),
    notes           TEXT,
    as_of_date      DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT beneficiary_person_or_entity CHECK (
        (person_id IS NOT NULL AND entity_id IS NULL) OR
        (person_id IS NULL AND entity_id IS NOT NULL)
    )
);

SELECT attach_updated_at_trigger('beneficiary_designations');


-- ────────────────────────────────────────────────────────────────────────────
-- 14. FEE SCHEDULES
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.fee_schedules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    fee_type        fee_type NOT NULL,
    tiers           JSONB NOT NULL DEFAULT '[]',    -- [{min_aum, max_aum, rate}]
    billing_freq    TEXT NOT NULL DEFAULT 'quarterly',  -- 'monthly', 'quarterly', 'annual'
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('fee_schedules');


-- ────────────────────────────────────────────────────────────────────────────
-- 15. ADVISORY AGREEMENTS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.advisory_agreements (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id        UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    fee_schedule_id     UUID REFERENCES public.fee_schedules(id) ON DELETE SET NULL,
    start_date          DATE NOT NULL,
    end_date            DATE,
    signed_date         DATE,
    document_url        TEXT,
    aum_basis           NUMERIC(18,2),              -- AUM at time of agreement
    custom_fee_rate     NUMERIC(8,6),               -- Override firm schedule
    status              record_status NOT NULL DEFAULT 'active',
    notes               TEXT,
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('advisory_agreements');


-- ────────────────────────────────────────────────────────────────────────────
-- 16. MEETINGS & INTERACTIONS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.meetings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id        UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    advisor_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title               TEXT NOT NULL,
    meeting_type        TEXT NOT NULL DEFAULT 'review',  -- 'review', 'onboarding', 'planning', etc.
    scheduled_at        TIMESTAMPTZ NOT NULL,
    duration_minutes    INTEGER,
    location            TEXT,
    virtual_link        TEXT,
    status              TEXT NOT NULL DEFAULT 'scheduled',  -- 'scheduled', 'completed', 'cancelled'
    agenda              TEXT,
    summary             TEXT,
    action_items        JSONB DEFAULT '[]',         -- [{text, owner, due_date, completed}]
    attendees           JSONB DEFAULT '[]',         -- [{person_id, name, attended}]
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('meetings');

CREATE INDEX idx_meetings_household_id ON public.meetings(household_id);
CREATE INDEX idx_meetings_advisor_id ON public.meetings(advisor_id);
CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at);


-- ────────────────────────────────────────────────────────────────────────────
-- 17. NOTES (client notes / CRM journal)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.notes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id    UUID REFERENCES public.households(id) ON DELETE CASCADE,
    person_id       UUID REFERENCES public.persons(id) ON DELETE CASCADE,
    account_id      UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title           TEXT,
    content         TEXT NOT NULL,
    note_type       TEXT NOT NULL DEFAULT 'general',  -- 'general', 'call', 'email', 'meeting'
    is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notes IS 'Freeform CRM notes attached to households, persons, or accounts.';

SELECT attach_updated_at_trigger('notes');

CREATE INDEX idx_notes_household_id ON public.notes(household_id);
CREATE INDEX idx_notes_person_id ON public.notes(person_id);
CREATE INDEX idx_notes_author_id ON public.notes(author_id);
CREATE INDEX idx_notes_content_fts ON public.notes USING GIN (to_tsvector('english', content));


-- ────────────────────────────────────────────────────────────────────────────
-- 18. TASKS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    household_id    UUID REFERENCES public.households(id) ON DELETE CASCADE,
    assignee_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title           TEXT NOT NULL,
    description     TEXT,
    status          task_status NOT NULL DEFAULT 'open',
    priority        task_priority NOT NULL DEFAULT 'medium',
    due_date        DATE,
    completed_at    TIMESTAMPTZ,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('tasks');

CREATE INDEX idx_tasks_firm_id ON public.tasks(firm_id);
CREATE INDEX idx_tasks_household_id ON public.tasks(household_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);


-- ────────────────────────────────────────────────────────────────────────────
-- 19. DOCUMENTS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    household_id    UUID REFERENCES public.households(id) ON DELETE CASCADE,
    account_id      UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    uploaded_by_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    document_type   document_type NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    storage_path    TEXT NOT NULL,                  -- Supabase Storage path
    storage_bucket  TEXT NOT NULL DEFAULT 'client-documents',
    file_size_bytes BIGINT,
    mime_type       TEXT,
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('documents');

CREATE INDEX idx_documents_firm_id ON public.documents(firm_id);
CREATE INDEX idx_documents_household_id ON public.documents(household_id);
CREATE INDEX idx_documents_type ON public.documents(document_type);


-- ────────────────────────────────────────────────────────────────────────────
-- 20. COMPLIANCE REVIEWS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.compliance_reviews (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id             UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    household_id        UUID REFERENCES public.households(id) ON DELETE CASCADE,
    reviewer_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_type         TEXT NOT NULL,              -- 'annual_review', 'kyc_refresh', 'aml_check'
    status              compliance_review_status NOT NULL DEFAULT 'scheduled',
    scheduled_date      DATE,
    completed_date      DATE,
    findings            TEXT,
    remediation         TEXT,
    documents           JSONB DEFAULT '[]',
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('compliance_reviews');


-- ────────────────────────────────────────────────────────────────────────────
-- 21. CUSTODIAN SYNC LOG
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.custodian_sync_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    custodian       TEXT NOT NULL,
    sync_type       TEXT NOT NULL DEFAULT 'full',   -- 'full', 'delta', 'positions', 'transactions'
    status          sync_status NOT NULL DEFAULT 'pending',
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    records_synced  INTEGER DEFAULT 0,
    errors          JSONB DEFAULT '[]',
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_log_firm_id ON public.custodian_sync_log(firm_id);
CREATE INDEX idx_sync_log_custodian ON public.custodian_sync_log(custodian);
CREATE INDEX idx_sync_log_status ON public.custodian_sync_log(status);


-- ────────────────────────────────────────────────────────────────────────────
-- 22. PRICE HISTORY
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.price_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_id     UUID NOT NULL REFERENCES public.securities(id) ON DELETE CASCADE,
    price_date      DATE NOT NULL,
    open_price      NUMERIC(18,6),
    high_price      NUMERIC(18,6),
    low_price       NUMERIC(18,6),
    close_price     NUMERIC(18,6) NOT NULL,
    adjusted_close  NUMERIC(18,6),
    volume          BIGINT,
    source          TEXT NOT NULL DEFAULT 'manual',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_price_history_security_date ON public.price_history(security_id, price_date);
CREATE INDEX idx_price_history_date ON public.price_history(price_date);


-- ────────────────────────────────────────────────────────────────────────────
-- 23. ALERTS (price, compliance, portfolio)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_type      TEXT NOT NULL,                  -- 'price', 'portfolio_drift', 'compliance', etc.
    title           TEXT NOT NULL,
    message         TEXT,
    severity        TEXT NOT NULL DEFAULT 'info',   -- 'info', 'warning', 'critical'
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    entity_type     TEXT,                           -- 'household', 'account', 'security'
    entity_id       UUID,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_firm_id ON public.alerts(firm_id);
CREATE INDEX idx_alerts_is_read ON public.alerts(is_read);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at);


-- ────────────────────────────────────────────────────────────────────────────
-- 24. NOTIFICATIONS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    action_url      TEXT,
    entity_type     TEXT,
    entity_id       UUID,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);


-- ────────────────────────────────────────────────────────────────────────────
-- 25. PROSPECTS (sales pipeline)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.prospects (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id             UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    owner_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name                TEXT NOT NULL,
    email               TEXT,
    phone               TEXT,
    status              prospect_status NOT NULL DEFAULT 'lead',
    source              TEXT,                       -- 'referral', 'website', 'event', etc.
    estimated_aum       NUMERIC(18,2),
    probability         NUMERIC(5,2),               -- 0-100
    expected_close_date DATE,
    won_date            DATE,
    lost_date           DATE,
    lost_reason         TEXT,
    notes               TEXT,
    tags                TEXT[] DEFAULT '{}',
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('prospects');

CREATE INDEX idx_prospects_firm_id ON public.prospects(firm_id);
CREATE INDEX idx_prospects_status ON public.prospects(status);
CREATE INDEX idx_prospects_owner_id ON public.prospects(owner_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 26. WORKFLOWS (task template sequences)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.workflow_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    category        TEXT,                           -- 'onboarding', 'annual_review', 'account_open'
    steps           JSONB NOT NULL DEFAULT '[]',    -- [{title, description, due_days_offset, assignee_role}]
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('workflow_templates');


CREATE TABLE public.workflow_instances (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id         UUID NOT NULL REFERENCES public.workflow_templates(id) ON DELETE RESTRICT,
    household_id        UUID REFERENCES public.households(id) ON DELETE CASCADE,
    initiated_by_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status              workflow_status NOT NULL DEFAULT 'active',
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('workflow_instances');


-- ────────────────────────────────────────────────────────────────────────────
-- 27. AUDIT LOG
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.audit_log (
    id              BIGSERIAL PRIMARY KEY,
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action          TEXT NOT NULL,                  -- 'INSERT', 'UPDATE', 'DELETE', 'VIEW'
    table_name      TEXT NOT NULL,
    record_id       UUID,
    old_data        JSONB,
    new_data        JSONB,
    ip_address      INET,
    user_agent      TEXT,
    session_id      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_firm_id ON public.audit_log(firm_id);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);


-- ────────────────────────────────────────────────────────────────────────────
-- 28. INVESTMENT POLICY STATEMENTS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.investment_policy_statements (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id            UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    version                 INTEGER NOT NULL DEFAULT 1,
    effective_date          DATE NOT NULL,
    expiry_date             DATE,
    risk_tolerance          TEXT NOT NULL,          -- 'conservative', 'moderate', 'aggressive'
    time_horizon_years      INTEGER,
    liquidity_needs         TEXT,
    target_return_pct       NUMERIC(6,2),
    target_allocations      JSONB NOT NULL DEFAULT '{}',  -- {equity: 60, fixed_income: 40, ...}
    constraints             JSONB DEFAULT '{}',     -- {excluded_sectors, max_single_position, ...}
    signed_date             DATE,
    document_url            TEXT,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('investment_policy_statements');


-- ────────────────────────────────────────────────────────────────────────────
-- 29. REBALANCING PROPOSALS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.rebalancing_proposals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id        UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    created_by_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    ips_id              UUID REFERENCES public.investment_policy_statements(id) ON DELETE SET NULL,
    status              TEXT NOT NULL DEFAULT 'draft',  -- 'draft', 'pending_approval', 'approved', 'executed', 'cancelled'
    proposed_trades     JSONB NOT NULL DEFAULT '[]',    -- [{security_id, action, quantity, estimated_value}]
    rationale           TEXT,
    approved_by_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    executed_at         TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('rebalancing_proposals');


-- ────────────────────────────────────────────────────────────────────────────
-- 30. RESEARCH SOURCES (email / RSS senders)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.research_sources (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    source_type     research_source_type NOT NULL DEFAULT 'email',
    identifier      TEXT NOT NULL,                  -- email address, RSS URL, etc.
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    auto_process    BOOLEAN NOT NULL DEFAULT TRUE,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_research_sources_firm_identifier ON public.research_sources(firm_id, identifier);


-- ────────────────────────────────────────────────────────────────────────────
-- 31. RESEARCH ITEMS (processed emails / articles)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.research_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id             UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    source_id           UUID REFERENCES public.research_sources(id) ON DELETE SET NULL,
    external_id         TEXT,                       -- Postmark message ID, RSS guid, etc.
    title               TEXT NOT NULL,
    body_text           TEXT,                       -- Cleaned plain text
    body_html           TEXT,                       -- Original HTML
    summary             TEXT,                       -- AI-generated 3-sentence summary
    key_points          JSONB DEFAULT '[]',         -- AI-extracted bullet points
    sentiment_overall   TEXT,                       -- 'bullish', 'bearish', 'neutral'
    categories          TEXT[] DEFAULT '{}',        -- ['earnings', 'macro', 'sector']
    status              research_item_status NOT NULL DEFAULT 'pending',
    published_at        TIMESTAMPTZ,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at        TIMESTAMPTZ,
    ai_model_version    TEXT,
    raw_payload         JSONB,                      -- Original Postmark/RSS payload
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('research_items');

CREATE INDEX idx_research_items_firm_id ON public.research_items(firm_id);
CREATE INDEX idx_research_items_status ON public.research_items(status);
CREATE INDEX idx_research_items_received_at ON public.research_items(received_at);
CREATE INDEX idx_research_items_fts ON public.research_items
    USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(body_text,'')));


-- ────────────────────────────────────────────────────────────────────────────
-- 32. RESEARCH MENTIONS (ticker references within research items)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.research_mentions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_item_id UUID NOT NULL REFERENCES public.research_items(id) ON DELETE CASCADE,
    security_id     UUID REFERENCES public.securities(id) ON DELETE SET NULL,
    ticker          TEXT,                           -- Denormalized for speed
    mention_type    research_mention_type NOT NULL DEFAULT 'mentioned',
    confidence      NUMERIC(4,2),                   -- 0.00-1.00 AI confidence
    context         TEXT,                           -- Surrounding sentence for context
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_research_mentions_item_id ON public.research_mentions(research_item_id);
CREATE INDEX idx_research_mentions_security_id ON public.research_mentions(security_id);
CREATE INDEX idx_research_mentions_ticker ON public.research_mentions(ticker);


-- ────────────────────────────────────────────────────────────────────────────
-- 33. RESEARCH TAGS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.research_tags (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    tag_type        research_tag_type NOT NULL DEFAULT 'custom',
    color           TEXT DEFAULT '#6366f1',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_research_tags_firm_name ON public.research_tags(firm_id, name);


CREATE TABLE public.research_item_tags (
    research_item_id UUID NOT NULL REFERENCES public.research_items(id) ON DELETE CASCADE,
    tag_id           UUID NOT NULL REFERENCES public.research_tags(id) ON DELETE CASCADE,
    tagged_by_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tagged_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (research_item_id, tag_id)
);


-- ────────────────────────────────────────────────────────────────────────────
-- 34. RESEARCH ACTIONS (read, bookmarked, shared, acted_on)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.research_actions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_item_id UUID NOT NULL REFERENCES public.research_items(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type     research_action_type NOT NULL,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(research_item_id, user_id, action_type)
);

CREATE INDEX idx_research_actions_user_id ON public.research_actions(user_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 35. SCHWAB OAUTH TOKENS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.schwab_oauth_tokens (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id             UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    access_token        TEXT NOT NULL,              -- Encrypted at rest
    refresh_token       TEXT NOT NULL,              -- Encrypted at rest
    token_type          TEXT NOT NULL DEFAULT 'Bearer',
    scope               TEXT,
    expires_at          TIMESTAMPTZ NOT NULL,
    refresh_expires_at  TIMESTAMPTZ,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(firm_id, user_id)
);

SELECT attach_updated_at_trigger('schwab_oauth_tokens');


-- ────────────────────────────────────────────────────────────────────────────
-- 36. SCHWAB ACCOUNTS (mirror of Schwab account data)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.schwab_accounts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id             UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    account_id          UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    schwab_account_id   TEXT NOT NULL,              -- Schwab's internal account ID
    account_number      TEXT NOT NULL,
    account_type        TEXT,
    status              TEXT,
    last_synced_at      TIMESTAMPTZ,
    raw_data            JSONB,                      -- Latest raw Schwab API response
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(firm_id, schwab_account_id)
);

SELECT attach_updated_at_trigger('schwab_accounts');


-- ────────────────────────────────────────────────────────────────────────────
-- 37. SCHWAB API LOGS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.schwab_api_logs (
    id              BIGSERIAL PRIMARY KEY,
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    endpoint        TEXT NOT NULL,
    method          TEXT NOT NULL,
    status_code     INTEGER,
    latency_ms      INTEGER,
    request_body    JSONB,
    response_body   JSONB,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schwab_api_logs_firm_id ON public.schwab_api_logs(firm_id);
CREATE INDEX idx_schwab_api_logs_created_at ON public.schwab_api_logs(created_at);
CREATE INDEX idx_schwab_api_logs_endpoint ON public.schwab_api_logs(endpoint);


-- ────────────────────────────────────────────────────────────────────────────
-- 38. PORTFOLIO SNAPSHOTS (time-series AUM history)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.portfolio_snapshots (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id    UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    snapshot_date   DATE NOT NULL,
    total_aum       NUMERIC(18,2) NOT NULL,
    by_account      JSONB DEFAULT '{}',             -- {account_id: value}
    by_asset_class  JSONB DEFAULT '{}',             -- {equity: value, fixed_income: value}
    by_custodian    JSONB DEFAULT '{}',             -- {schwab: value}
    benchmark_value NUMERIC(18,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_portfolio_snapshots_household_date ON public.portfolio_snapshots(household_id, snapshot_date);
CREATE INDEX idx_portfolio_snapshots_date ON public.portfolio_snapshots(snapshot_date);


-- ────────────────────────────────────────────────────────────────────────────
-- 39. PERFORMANCE METRICS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.performance_metrics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id    UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    period_type     TEXT NOT NULL,                  -- 'mtd', 'qtd', 'ytd', '1yr', '3yr', '5yr', 'since_inception'
    period_end_date DATE NOT NULL,
    twr             NUMERIC(10,6),                  -- Time-weighted return
    mwr             NUMERIC(10,6),                  -- Money-weighted return (IRR)
    benchmark_twr   NUMERIC(10,6),
    alpha           NUMERIC(10,6),
    beta            NUMERIC(10,6),
    sharpe_ratio    NUMERIC(10,6),
    max_drawdown    NUMERIC(10,6),
    volatility      NUMERIC(10,6),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_perf_household_period ON public.performance_metrics(household_id, period_type, period_end_date);


-- ────────────────────────────────────────────────────────────────────────────
-- 40. TAX LOTS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.tax_lots (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    security_id     UUID NOT NULL REFERENCES public.securities(id) ON DELETE RESTRICT,
    lot_id          TEXT,                           -- Custodian lot identifier
    acquisition_date DATE NOT NULL,
    quantity        NUMERIC(24,8) NOT NULL,
    cost_basis      NUMERIC(18,6) NOT NULL,         -- Per share
    total_cost      NUMERIC(18,2),
    is_short_term   BOOLEAN,
    is_closed       BOOLEAN NOT NULL DEFAULT FALSE,
    closed_date     DATE,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('tax_lots');

CREATE INDEX idx_tax_lots_account_security ON public.tax_lots(account_id, security_id);
CREATE INDEX idx_tax_lots_acquisition_date ON public.tax_lots(acquisition_date);


-- ────────────────────────────────────────────────────────────────────────────
-- 41. FINANCIAL PLANS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.financial_plans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id        UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    created_by_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    plan_date           DATE NOT NULL,
    retirement_age      INTEGER,
    life_expectancy     INTEGER,
    current_income      NUMERIC(18,2),
    projected_income    JSONB DEFAULT '{}',         -- {year: amount}
    expenses            JSONB DEFAULT '{}',         -- {category: amount}
    goals               JSONB DEFAULT '[]',         -- [{type, target_amount, target_date, priority}]
    assumptions         JSONB DEFAULT '{}',         -- {inflation_rate, return_rate, ss_age}
    probability_of_success NUMERIC(5,2),            -- Monte Carlo result
    document_url        TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('financial_plans');


-- ────────────────────────────────────────────────────────────────────────────
-- 42. CUSTODIAN CREDENTIALS (encrypted)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.custodian_credentials (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    custodian       TEXT NOT NULL,
    credential_type TEXT NOT NULL,                  -- 'oauth', 'api_key', 'sftp'
    encrypted_data  TEXT NOT NULL,                  -- pgcrypto-encrypted JSON blob
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(firm_id, custodian, credential_type)
);

SELECT attach_updated_at_trigger('custodian_credentials');


-- ────────────────────────────────────────────────────────────────────────────
-- 43. USER SESSIONS / ACTIVITY
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.user_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token   TEXT NOT NULL UNIQUE,
    ip_address      INET,
    user_agent      TEXT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);


-- ────────────────────────────────────────────────────────────────────────────
-- 44. API KEYS (for programmatic access)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.api_keys (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    key_hash        TEXT NOT NULL UNIQUE,           -- bcrypt hash of the key
    key_prefix      TEXT NOT NULL,                  -- First 8 chars for display
    scopes          TEXT[] DEFAULT '{}',
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_firm_id ON public.api_keys(firm_id);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 45. WEBHOOKS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.webhooks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    url             TEXT NOT NULL,
    events          TEXT[] NOT NULL DEFAULT '{}',   -- ['position.updated', 'alert.created']
    secret          TEXT NOT NULL,                  -- HMAC signing secret
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    failure_count   INTEGER NOT NULL DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('webhooks');


-- ────────────────────────────────────────────────────────────────────────────
-- 46. FEATURE FLAGS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.feature_flags (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID REFERENCES public.firms(id) ON DELETE CASCADE,  -- NULL = global
    key             TEXT NOT NULL,
    value           BOOLEAN NOT NULL DEFAULT FALSE,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(firm_id, key)
);

SELECT attach_updated_at_trigger('feature_flags');


-- ────────────────────────────────────────────────────────────────────────────
-- 47. FIRM INVITATIONS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.firm_invitations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    invited_by_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    email           TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'advisor',
    token           TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_firm_invitations_token ON public.firm_invitations(token);
CREATE INDEX idx_firm_invitations_email ON public.firm_invitations(email);


-- ────────────────────────────────────────────────────────────────────────────
-- 48. HOUSEHOLD ADVISOR ASSIGNMENTS (many-to-many)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.household_advisors (
    household_id    UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    advisor_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'primary',  -- 'primary', 'secondary', 'service'
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (household_id, advisor_id)
);

CREATE INDEX idx_household_advisors_advisor_id ON public.household_advisors(advisor_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 49. PROSPECT INTERACTIONS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.prospect_interactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id     UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
    recorded_by_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    interaction_type TEXT NOT NULL DEFAULT 'call',  -- 'call', 'email', 'meeting', 'note'
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    summary         TEXT,
    follow_up_date  DATE,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prospect_interactions_prospect_id ON public.prospect_interactions(prospect_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 50. ALERT RULES (user-defined alert conditions)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.alert_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    rule_type       TEXT NOT NULL,                  -- 'price_threshold', 'research_ticker', 'portfolio_drift'
    conditions      JSONB NOT NULL DEFAULT '{}',    -- Rule-specific conditions
    delivery        JSONB NOT NULL DEFAULT '{"in_app": true, "email": false}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('alert_rules');


-- ────────────────────────────────────────────────────────────────────────────
-- 51. SCHEDULED REPORTS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.scheduled_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    created_by_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    name            TEXT NOT NULL,
    report_type     TEXT NOT NULL,
    schedule        TEXT NOT NULL,                  -- cron expression
    recipients      JSONB NOT NULL DEFAULT '[]',    -- [{user_id, email}]
    parameters      JSONB DEFAULT '{}',
    last_run_at     TIMESTAMPTZ,
    next_run_at     TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('scheduled_reports');


-- ────────────────────────────────────────────────────────────────────────────
-- 52. MODEL PORTFOLIOS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.model_portfolios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    risk_level      TEXT NOT NULL,                  -- 'conservative', 'moderate', 'aggressive', 'custom'
    target_allocations JSONB NOT NULL DEFAULT '{}', -- {security_id: pct}
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    version         INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT attach_updated_at_trigger('model_portfolios');


-- ────────────────────────────────────────────────────────────────────────────
-- 53. HOUSEHOLD MODEL ASSIGNMENTS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.household_model_assignments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id    UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    model_id        UUID NOT NULL REFERENCES public.model_portfolios(id) ON DELETE RESTRICT,
    assigned_by_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    drift_threshold NUMERIC(5,2) DEFAULT 5.00,      -- % drift to trigger rebalance alert
    notes           TEXT,
    UNIQUE(household_id, model_id)
);


-- ────────────────────────────────────────────────────────────────────────────
-- 54. EXTERNAL INTEGRATIONS (third-party service configs)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.external_integrations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,                 -- 'postmark', 'twilio', 'docusign', 'bloomberg'
    config          JSONB NOT NULL DEFAULT '{}',    -- Non-sensitive config
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_tested_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(firm_id, integration_type)
);

SELECT attach_updated_at_trigger('external_integrations');


-- ────────────────────────────────────────────────────────────────────────────
-- 55. PLATFORM SETTINGS (global + firm-level KV store)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.platform_settings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID REFERENCES public.firms(id) ON DELETE CASCADE,  -- NULL = global
    key             TEXT NOT NULL,
    value           JSONB NOT NULL,
    description     TEXT,
    is_public       BOOLEAN NOT NULL DEFAULT FALSE, -- Can anon/service role read it?
    updated_by_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(firm_id, key)
);

SELECT attach_updated_at_trigger('platform_settings');


-- ────────────────────────────────────────────────────────────────────────────
-- 56. BACKGROUND JOBS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.background_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID REFERENCES public.firms(id) ON DELETE CASCADE,
    job_type        TEXT NOT NULL,                  -- 'portfolio_sync', 'research_process', 'report_generate'
    status          TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed'
    payload         JSONB DEFAULT '{}',
    result          JSONB,
    error_message   TEXT,
    attempts        INTEGER NOT NULL DEFAULT 0,
    max_attempts    INTEGER NOT NULL DEFAULT 3,
    scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_background_jobs_firm_id ON public.background_jobs(firm_id);
CREATE INDEX idx_background_jobs_status ON public.background_jobs(status);
CREATE INDEX idx_background_jobs_scheduled_at ON public.background_jobs(scheduled_at);


-- ────────────────────────────────────────────────────────────────────────────
-- 57. RESEARCH COMPLIANCE LOG (SEC Rule 204-2)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.research_compliance_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    research_item_id UUID NOT NULL REFERENCES public.research_items(id) ON DELETE RESTRICT,
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    action          TEXT NOT NULL,                  -- 'received', 'read', 'shared', 'acted_on'
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_research_compliance_log_firm_id ON public.research_compliance_log(firm_id);
CREATE INDEX idx_research_compliance_log_occurred_at ON public.research_compliance_log(occurred_at);


-- ────────────────────────────────────────────────────────────────────────────
-- 58. RESEARCH ALERT DELIVERIES
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.research_alert_deliveries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_rule_id   UUID NOT NULL REFERENCES public.alert_rules(id) ON DELETE CASCADE,
    research_item_id UUID NOT NULL REFERENCES public.research_items(id) ON DELETE CASCADE,
    delivered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_method TEXT NOT NULL DEFAULT 'in_app', -- 'in_app', 'email'
    status          TEXT NOT NULL DEFAULT 'delivered',
    UNIQUE(alert_rule_id, research_item_id, delivery_method)
);


-- ────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY — ENABLE ON ALL TABLES
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.securities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiary_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custodian_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_policy_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rebalancing_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schwab_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schwab_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custodian_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_model_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_compliance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_alert_deliveries ENABLE ROW LEVEL SECURITY;

-- Note: schwab_api_logs uses BIGSERIAL; RLS enabled separately
ALTER TABLE public.schwab_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ────────────────────────────────────────────────────────────────────────────

-- FIRMS: Only super_admin sees all; others see only their own firm
CREATE POLICY firms_select ON public.firms FOR SELECT
    USING (id = get_user_firm_id() OR get_user_role() = 'super_admin');
CREATE POLICY firms_insert ON public.firms FOR INSERT
    WITH CHECK (get_user_role() = 'super_admin');
CREATE POLICY firms_update ON public.firms FOR UPDATE
    USING (id = get_user_firm_id() AND get_user_role() IN ('firm_admin', 'super_admin'));

-- PROFILES: Users see their own firm's profiles
CREATE POLICY profiles_select ON public.profiles FOR SELECT
    USING (firm_id = get_user_firm_id() OR id = auth.uid());
CREATE POLICY profiles_insert ON public.profiles FOR INSERT
    WITH CHECK (firm_id = get_user_firm_id() AND get_user_role() IN ('firm_admin', 'super_admin'));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE
    USING (id = auth.uid() OR (firm_id = get_user_firm_id() AND get_user_role() IN ('firm_admin', 'super_admin')));

-- HOUSEHOLDS
CREATE POLICY households_select ON public.households FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY households_insert ON public.households FOR INSERT
    WITH CHECK (firm_id = get_user_firm_id() AND can_write());
CREATE POLICY households_update ON public.households FOR UPDATE
    USING (firm_id = get_user_firm_id() AND can_write());
CREATE POLICY households_delete ON public.households FOR DELETE
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());

-- PERSONS
CREATE POLICY persons_select ON public.persons FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY persons_insert ON public.persons FOR INSERT
    WITH CHECK (household_in_firm(household_id) AND can_write());
CREATE POLICY persons_update ON public.persons FOR UPDATE
    USING (household_in_firm(household_id) AND can_write());
CREATE POLICY persons_delete ON public.persons FOR DELETE
    USING (household_in_firm(household_id) AND is_firm_admin_or_compliance());

-- SECURITIES: Readable by all authenticated users, writable by firm_admin+
CREATE POLICY securities_select ON public.securities FOR SELECT
    USING (TRUE);
CREATE POLICY securities_insert ON public.securities FOR INSERT
    WITH CHECK (get_user_role() IN ('firm_admin', 'super_admin', 'analyst'));
CREATE POLICY securities_update ON public.securities FOR UPDATE
    USING (get_user_role() IN ('firm_admin', 'super_admin', 'analyst'));

-- ACCOUNTS
CREATE POLICY accounts_select ON public.accounts FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY accounts_insert ON public.accounts FOR INSERT
    WITH CHECK (household_in_firm(household_id) AND can_write());
CREATE POLICY accounts_update ON public.accounts FOR UPDATE
    USING (household_in_firm(household_id) AND can_write());
CREATE POLICY accounts_delete ON public.accounts FOR DELETE
    USING (household_in_firm(household_id) AND is_firm_admin_or_compliance());

-- POSITIONS
CREATE POLICY positions_select ON public.positions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)));
CREATE POLICY positions_insert ON public.positions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)) AND can_write());
CREATE POLICY positions_update ON public.positions FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)) AND can_write());
CREATE POLICY positions_delete ON public.positions FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)) AND is_firm_admin_or_compliance());

-- TRANSACTIONS
CREATE POLICY transactions_select ON public.transactions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)));
CREATE POLICY transactions_insert ON public.transactions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)) AND can_write());
CREATE POLICY transactions_update ON public.transactions FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)) AND can_write());

-- LEGAL ENTITIES
CREATE POLICY legal_entities_select ON public.legal_entities FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY legal_entities_insert ON public.legal_entities FOR INSERT
    WITH CHECK (household_in_firm(household_id) AND can_write());
CREATE POLICY legal_entities_update ON public.legal_entities FOR UPDATE
    USING (household_in_firm(household_id) AND can_write());

-- BENEFICIARY DESIGNATIONS
CREATE POLICY beneficiary_select ON public.beneficiary_designations FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)));
CREATE POLICY beneficiary_insert ON public.beneficiary_designations FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)) AND can_write());
CREATE POLICY beneficiary_update ON public.beneficiary_designations FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)) AND can_write());

-- FEE SCHEDULES
CREATE POLICY fee_schedules_select ON public.fee_schedules FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY fee_schedules_write ON public.fee_schedules FOR ALL
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());

-- ADVISORY AGREEMENTS
CREATE POLICY advisory_agreements_select ON public.advisory_agreements FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY advisory_agreements_write ON public.advisory_agreements FOR ALL
    USING (household_in_firm(household_id) AND can_write());

-- MEETINGS
CREATE POLICY meetings_select ON public.meetings FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY meetings_insert ON public.meetings FOR INSERT
    WITH CHECK (household_in_firm(household_id) AND can_write());
CREATE POLICY meetings_update ON public.meetings FOR UPDATE
    USING (household_in_firm(household_id) AND can_write());

-- NOTES
CREATE POLICY notes_select ON public.notes FOR SELECT
    USING (
        (household_id IS NOT NULL AND household_in_firm(household_id)) OR
        (account_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)))
    );
CREATE POLICY notes_insert ON public.notes FOR INSERT
    WITH CHECK (
        can_write() AND (
            (household_id IS NOT NULL AND household_in_firm(household_id)) OR
            (account_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)))
        )
    );
CREATE POLICY notes_update ON public.notes FOR UPDATE
    USING (author_id = auth.uid() OR is_firm_admin_or_compliance());
CREATE POLICY notes_delete ON public.notes FOR DELETE
    USING (author_id = auth.uid() OR is_firm_admin_or_compliance());

-- TASKS
CREATE POLICY tasks_select ON public.tasks FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY tasks_insert ON public.tasks FOR INSERT
    WITH CHECK (firm_id = get_user_firm_id() AND can_write());
CREATE POLICY tasks_update ON public.tasks FOR UPDATE
    USING (firm_id = get_user_firm_id() AND (assignee_id = auth.uid() OR created_by_id = auth.uid() OR is_firm_admin_or_compliance()));

-- DOCUMENTS
CREATE POLICY documents_select ON public.documents FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY documents_insert ON public.documents FOR INSERT
    WITH CHECK (firm_id = get_user_firm_id() AND can_write());
CREATE POLICY documents_update ON public.documents FOR UPDATE
    USING (firm_id = get_user_firm_id() AND (uploaded_by_id = auth.uid() OR is_firm_admin_or_compliance()));
CREATE POLICY documents_delete ON public.documents FOR DELETE
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());

-- COMPLIANCE REVIEWS
CREATE POLICY compliance_reviews_select ON public.compliance_reviews FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY compliance_reviews_write ON public.compliance_reviews FOR ALL
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());

-- CUSTODIAN SYNC LOG
CREATE POLICY sync_log_select ON public.custodian_sync_log FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY sync_log_insert ON public.custodian_sync_log FOR INSERT
    WITH CHECK (firm_id = get_user_firm_id());

-- PRICE HISTORY: readable by all, writable by analyst+
CREATE POLICY price_history_select ON public.price_history FOR SELECT USING (TRUE);
CREATE POLICY price_history_insert ON public.price_history FOR INSERT
    WITH CHECK (get_user_role() IN ('firm_admin', 'super_admin', 'analyst'));

-- ALERTS
CREATE POLICY alerts_select ON public.alerts FOR SELECT
    USING (firm_id = get_user_firm_id() AND (user_id = auth.uid() OR is_firm_admin_or_compliance()));
CREATE POLICY alerts_insert ON public.alerts FOR INSERT
    WITH CHECK (firm_id = get_user_firm_id());
CREATE POLICY alerts_update ON public.alerts FOR UPDATE
    USING (user_id = auth.uid());

-- NOTIFICATIONS
CREATE POLICY notifications_select ON public.notifications FOR SELECT
    USING (user_id = auth.uid());
CREATE POLICY notifications_insert ON public.notifications FOR INSERT
    WITH CHECK (TRUE);  -- Allow service role inserts
CREATE POLICY notifications_update ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

-- PROSPECTS
CREATE POLICY prospects_select ON public.prospects FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY prospects_insert ON public.prospects FOR INSERT
    WITH CHECK (firm_id = get_user_firm_id() AND can_write());
CREATE POLICY prospects_update ON public.prospects FOR UPDATE
    USING (firm_id = get_user_firm_id() AND (owner_id = auth.uid() OR is_firm_admin_or_compliance()));

-- WORKFLOW TEMPLATES
CREATE POLICY workflow_templates_select ON public.workflow_templates FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY workflow_templates_write ON public.workflow_templates FOR ALL
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());

-- WORKFLOW INSTANCES
CREATE POLICY workflow_instances_select ON public.workflow_instances FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.workflow_templates wt WHERE wt.id = template_id AND wt.firm_id = get_user_firm_id()));
CREATE POLICY workflow_instances_write ON public.workflow_instances FOR ALL
    USING (EXISTS (SELECT 1 FROM public.workflow_templates wt WHERE wt.id = template_id AND wt.firm_id = get_user_firm_id()) AND can_write());

-- AUDIT LOG: read-only for compliance, no direct writes
CREATE POLICY audit_log_select ON public.audit_log FOR SELECT
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());
-- Note: Writes to audit_log go through SECURITY DEFINER functions only

-- INVESTMENT POLICY STATEMENTS
CREATE POLICY ips_select ON public.investment_policy_statements FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY ips_write ON public.investment_policy_statements FOR ALL
    USING (household_in_firm(household_id) AND can_write());

-- REBALANCING PROPOSALS
CREATE POLICY rebalancing_select ON public.rebalancing_proposals FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY rebalancing_write ON public.rebalancing_proposals FOR ALL
    USING (household_in_firm(household_id) AND can_write());

-- RESEARCH SOURCES
CREATE POLICY research_sources_select ON public.research_sources FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY research_sources_write ON public.research_sources FOR ALL
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());

-- RESEARCH ITEMS
CREATE POLICY research_items_select ON public.research_items FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY research_items_insert ON public.research_items FOR INSERT
    WITH CHECK (firm_id = get_user_firm_id());
CREATE POLICY research_items_update ON public.research_items FOR UPDATE
    USING (firm_id = get_user_firm_id() AND can_write());

-- RESEARCH MENTIONS
CREATE POLICY research_mentions_select ON public.research_mentions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.research_items ri WHERE ri.id = research_item_id AND ri.firm_id = get_user_firm_id()));
CREATE POLICY research_mentions_write ON public.research_mentions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.research_items ri WHERE ri.id = research_item_id AND ri.firm_id = get_user_firm_id()));

-- RESEARCH TAGS
CREATE POLICY research_tags_select ON public.research_tags FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY research_tags_write ON public.research_tags FOR ALL
    USING (firm_id = get_user_firm_id() AND can_write());

-- RESEARCH ITEM TAGS
CREATE POLICY research_item_tags_select ON public.research_item_tags FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.research_items ri WHERE ri.id = research_item_id AND ri.firm_id = get_user_firm_id()));
CREATE POLICY research_item_tags_write ON public.research_item_tags FOR ALL
    USING (EXISTS (SELECT 1 FROM public.research_items ri WHERE ri.id = research_item_id AND ri.firm_id = get_user_firm_id()) AND can_write());

-- RESEARCH ACTIONS
CREATE POLICY research_actions_select ON public.research_actions FOR SELECT
    USING (user_id = auth.uid() OR is_firm_admin_or_compliance());
CREATE POLICY research_actions_insert ON public.research_actions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- SCHWAB OAUTH TOKENS (strict: only owner can see their own)
CREATE POLICY schwab_tokens_select ON public.schwab_oauth_tokens FOR SELECT
    USING (user_id = auth.uid() OR is_firm_admin_or_compliance());
CREATE POLICY schwab_tokens_write ON public.schwab_oauth_tokens FOR ALL
    USING (user_id = auth.uid() OR get_user_role() = 'super_admin');

-- SCHWAB ACCOUNTS
CREATE POLICY schwab_accounts_select ON public.schwab_accounts FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY schwab_accounts_write ON public.schwab_accounts FOR ALL
    USING (firm_id = get_user_firm_id() AND can_write());

-- SCHWAB API LOGS
CREATE POLICY schwab_api_logs_select ON public.schwab_api_logs FOR SELECT
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());
CREATE POLICY schwab_api_logs_insert ON public.schwab_api_logs FOR INSERT
    WITH CHECK (firm_id = get_user_firm_id());

-- PORTFOLIO SNAPSHOTS
CREATE POLICY portfolio_snapshots_select ON public.portfolio_snapshots FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY portfolio_snapshots_write ON public.portfolio_snapshots FOR ALL
    USING (household_in_firm(household_id));

-- PERFORMANCE METRICS
CREATE POLICY performance_metrics_select ON public.performance_metrics FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY performance_metrics_write ON public.performance_metrics FOR ALL
    USING (household_in_firm(household_id));

-- TAX LOTS
CREATE POLICY tax_lots_select ON public.tax_lots FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)));
CREATE POLICY tax_lots_write ON public.tax_lots FOR ALL
    USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND household_in_firm(a.household_id)) AND can_write());

-- FINANCIAL PLANS
CREATE POLICY financial_plans_select ON public.financial_plans FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY financial_plans_write ON public.financial_plans FOR ALL
    USING (household_in_firm(household_id) AND can_write());

-- CUSTODIAN CREDENTIALS (very restricted)
CREATE POLICY custodian_creds_select ON public.custodian_credentials FOR SELECT
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());
CREATE POLICY custodian_creds_write ON public.custodian_credentials FOR ALL
    USING (firm_id = get_user_firm_id() AND get_user_role() IN ('firm_admin', 'super_admin'));

-- USER SESSIONS
CREATE POLICY user_sessions_select ON public.user_sessions FOR SELECT
    USING (user_id = auth.uid() OR is_firm_admin_or_compliance());
CREATE POLICY user_sessions_write ON public.user_sessions FOR ALL
    USING (user_id = auth.uid());

-- API KEYS
CREATE POLICY api_keys_select ON public.api_keys FOR SELECT
    USING (firm_id = get_user_firm_id() AND (user_id = auth.uid() OR is_firm_admin_or_compliance()));
CREATE POLICY api_keys_write ON public.api_keys FOR ALL
    USING (user_id = auth.uid() AND firm_id = get_user_firm_id());

-- WEBHOOKS
CREATE POLICY webhooks_select ON public.webhooks FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY webhooks_write ON public.webhooks FOR ALL
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());

-- FEATURE FLAGS
CREATE POLICY feature_flags_select ON public.feature_flags FOR SELECT
    USING (firm_id IS NULL OR firm_id = get_user_firm_id());
CREATE POLICY feature_flags_write ON public.feature_flags FOR ALL
    USING (get_user_role() IN ('firm_admin', 'super_admin'));

-- FIRM INVITATIONS
CREATE POLICY firm_invitations_select ON public.firm_invitations FOR SELECT
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());
CREATE POLICY firm_invitations_write ON public.firm_invitations FOR ALL
    USING (firm_id = get_user_firm_id() AND get_user_role() IN ('firm_admin', 'super_admin'));

-- HOUSEHOLD ADVISORS
CREATE POLICY household_advisors_select ON public.household_advisors FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY household_advisors_write ON public.household_advisors FOR ALL
    USING (household_in_firm(household_id) AND is_firm_admin_or_compliance());

-- PROSPECT INTERACTIONS
CREATE POLICY prospect_interactions_select ON public.prospect_interactions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.prospects p WHERE p.id = prospect_id AND p.firm_id = get_user_firm_id()));
CREATE POLICY prospect_interactions_write ON public.prospect_interactions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.prospects p WHERE p.id = prospect_id AND p.firm_id = get_user_firm_id()) AND can_write());

-- ALERT RULES
CREATE POLICY alert_rules_select ON public.alert_rules FOR SELECT
    USING (firm_id = get_user_firm_id() AND (user_id = auth.uid() OR is_firm_admin_or_compliance()));
CREATE POLICY alert_rules_write ON public.alert_rules FOR ALL
    USING (firm_id = get_user_firm_id() AND user_id = auth.uid());

-- SCHEDULED REPORTS
CREATE POLICY scheduled_reports_select ON public.scheduled_reports FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY scheduled_reports_write ON public.scheduled_reports FOR ALL
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());

-- MODEL PORTFOLIOS
CREATE POLICY model_portfolios_select ON public.model_portfolios FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY model_portfolios_write ON public.model_portfolios FOR ALL
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());

-- HOUSEHOLD MODEL ASSIGNMENTS
CREATE POLICY household_model_select ON public.household_model_assignments FOR SELECT
    USING (household_in_firm(household_id));
CREATE POLICY household_model_write ON public.household_model_assignments FOR ALL
    USING (household_in_firm(household_id) AND is_firm_admin_or_compliance());

-- EXTERNAL INTEGRATIONS
CREATE POLICY external_integrations_select ON public.external_integrations FOR SELECT
    USING (firm_id = get_user_firm_id());
CREATE POLICY external_integrations_write ON public.external_integrations FOR ALL
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());

-- PLATFORM SETTINGS
CREATE POLICY platform_settings_select ON public.platform_settings FOR SELECT
    USING (firm_id IS NULL OR firm_id = get_user_firm_id());
CREATE POLICY platform_settings_write ON public.platform_settings FOR ALL
    USING (get_user_role() IN ('firm_admin', 'super_admin'));

-- BACKGROUND JOBS
CREATE POLICY background_jobs_select ON public.background_jobs FOR SELECT
    USING (firm_id IS NULL OR firm_id = get_user_firm_id());
CREATE POLICY background_jobs_write ON public.background_jobs FOR ALL
    USING (firm_id IS NULL OR firm_id = get_user_firm_id());

-- RESEARCH COMPLIANCE LOG
CREATE POLICY research_compliance_log_select ON public.research_compliance_log FOR SELECT
    USING (firm_id = get_user_firm_id() AND is_firm_admin_or_compliance());
CREATE POLICY research_compliance_log_insert ON public.research_compliance_log FOR INSERT
    WITH CHECK (firm_id = get_user_firm_id());

-- RESEARCH ALERT DELIVERIES
CREATE POLICY research_alert_deliveries_select ON public.research_alert_deliveries FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.alert_rules ar WHERE ar.id = alert_rule_id AND ar.firm_id = get_user_firm_id()));
CREATE POLICY research_alert_deliveries_write ON public.research_alert_deliveries FOR ALL
    USING (EXISTS (SELECT 1 FROM public.alert_rules ar WHERE ar.id = alert_rule_id AND ar.firm_id = get_user_firm_id()));


-- ────────────────────────────────────────────────────────────────────────────
-- UTILITY VIEWS
-- ────────────────────────────────────────────────────────────────────────────

-- View: household summary with AUM and advisor info
CREATE OR REPLACE VIEW public.v_household_summary AS
SELECT
    h.id,
    h.firm_id,
    h.name,
    h.type,
    h.status,
    h.aum,
    h.risk_profile,
    p.first_name || ' ' || p.last_name AS primary_advisor_name,
    COUNT(DISTINCT per.id) AS person_count,
    COUNT(DISTINCT acc.id) AS account_count,
    SUM(acc.total_value) AS calculated_aum
FROM public.households h
LEFT JOIN public.profiles p ON p.id = h.primary_advisor_id
LEFT JOIN public.persons per ON per.household_id = h.id
LEFT JOIN public.accounts acc ON acc.household_id = h.id AND acc.status = 'active'
GROUP BY h.id, h.firm_id, h.name, h.type, h.status, h.aum, h.risk_profile, p.first_name, p.last_name;

-- View: account positions with security details
CREATE OR REPLACE VIEW public.v_account_positions AS
SELECT
    pos.id,
    pos.account_id,
    pos.security_id,
    pos.quantity,
    pos.market_value,
    pos.cost_basis,
    pos.unrealized_gain_loss,
    pos.unrealized_gain_loss_pct,
    pos.as_of_date,
    sec.ticker,
    sec.name AS security_name,
    sec.asset_class,
    sec.sector,
    sec.current_price,
    acc.household_id
FROM public.positions pos
JOIN public.securities sec ON sec.id = pos.security_id
JOIN public.accounts acc ON acc.id = pos.account_id;

-- View: research item feed with source and mention count
CREATE OR REPLACE VIEW public.v_research_feed AS
SELECT
    ri.id,
    ri.firm_id,
    ri.title,
    ri.summary,
    ri.sentiment_overall,
    ri.categories,
    ri.status,
    ri.received_at,
    rs.name AS source_name,
    rs.source_type,
    COUNT(rm.id) AS mention_count,
    ARRAY_AGG(DISTINCT rm.ticker) FILTER (WHERE rm.ticker IS NOT NULL) AS mentioned_tickers
FROM public.research_items ri
LEFT JOIN public.research_sources rs ON rs.id = ri.source_id
LEFT JOIN public.research_mentions rm ON rm.research_item_id = ri.id
GROUP BY ri.id, ri.firm_id, ri.title, ri.summary, ri.sentiment_overall, ri.categories,
         ri.status, ri.received_at, rs.name, rs.source_type;


-- ────────────────────────────────────────────────────────────────────────────
-- REALTIME PUBLICATION
-- ────────────────────────────────────────────────────────────────────────────
BEGIN;
    -- Remove tables from default realtime publication (if it exists) then re-add specific tables
    DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;
            ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
            ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
            ALTER PUBLICATION supabase_realtime ADD TABLE public.research_items;
            ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
        END IF;
    END $$;
COMMIT;


-- ────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS (run via Supabase dashboard or management API)
-- ────────────────────────────────────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES
--   ('client-documents', 'client-documents', FALSE, 52428800, ARRAY['application/pdf','image/png','image/jpeg','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
--   ('research-documents', 'research-documents', FALSE, 26214400, ARRAY['application/pdf','text/plain','text/html']),
--   ('profile-images', 'profile-images', TRUE, 5242880, ARRAY['image/png','image/jpeg','image/webp'])
-- ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────────
-- END OF SCHEMA
-- Scoped RLS policies on every table ensure complete multi-tenant isolation.
-- =============================================================================
