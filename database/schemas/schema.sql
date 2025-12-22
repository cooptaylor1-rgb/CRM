-- Database: Wealth Management CRM
-- PostgreSQL 15+
-- This schema implements the complete domain model for SEC-registered investment advisers

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Enable Row Level Security
ALTER DATABASE crm_wealth SET row_security = on;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret TEXT,
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(resource, action)
);

-- Households
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    primary_contact_person_id UUID,
    advisor_id UUID NOT NULL,
    risk_tolerance VARCHAR(20) CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    investment_objective TEXT NOT NULL,
    total_aum DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'inactive', 'closed')),
    onboarding_date DATE,
    last_review_date DATE,
    next_review_date DATE,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (advisor_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_households_advisor ON households(advisor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_households_status ON households(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_households_next_review ON households(next_review_date) WHERE status = 'active';
CREATE INDEX idx_households_name_trgm ON households USING gin(name gin_trgm_ops);

-- Persons
CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    preferred_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    ssn_encrypted TEXT,
    citizenship VARCHAR(2),
    marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'separated')),
    employment_status VARCHAR(50),
    employer VARCHAR(200),
    occupation VARCHAR(100),
    annual_income DECIMAL(15,2),
    net_worth DECIMAL(15,2),
    email VARCHAR(255),
    phone_primary VARCHAR(20),
    phone_mobile VARCHAR(20),
    address_street VARCHAR(200),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip VARCHAR(20),
    address_country VARCHAR(2) DEFAULT 'US',
    is_primary_contact BOOLEAN DEFAULT FALSE,
    relationship_to_primary VARCHAR(50),
    accredited_investor BOOLEAN DEFAULT FALSE,
    qualified_purchaser BOOLEAN DEFAULT FALSE,
    pep_status BOOLEAN DEFAULT FALSE,
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'failed')),
    kyc_verified_date DATE,
    kyc_verified_by UUID,
    kyc_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (kyc_verified_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_persons_household ON persons(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_persons_email ON persons(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_persons_kyc_status ON persons(kyc_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_persons_name ON persons(last_name, first_name);

-- Entities (Legal Entities)
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('trust', 'corporation', 'llc', 'partnership', 'foundation', 'estate')),
    legal_name VARCHAR(300) NOT NULL,
    doing_business_as VARCHAR(300),
    ein_encrypted TEXT,
    state_of_formation VARCHAR(2),
    formation_date DATE,
    registered_agent VARCHAR(200),
    address_street VARCHAR(200),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip VARCHAR(20),
    address_country VARCHAR(2) DEFAULT 'US',
    purpose TEXT,
    trustees JSONB,
    beneficiaries JSONB,
    authorized_signers JSONB,
    tax_status VARCHAR(50),
    fiscal_year_end VARCHAR(5),
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'failed')),
    kyc_verified_date DATE,
    kyc_verified_by UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (household_id) REFERENCES households(id),
    FOREIGN KEY (kyc_verified_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_entities_household ON entities(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_entities_type ON entities(entity_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_entities_kyc_status ON entities(kyc_status) WHERE deleted_at IS NULL;

-- Fee Schedules
CREATE TABLE fee_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('tiered', 'flat', 'performance')),
    tiers JSONB NOT NULL,
    minimum_fee DECIMAL(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Investment Strategies
CREATE TABLE investment_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    asset_allocation JSONB NOT NULL,
    risk_level VARCHAR(20) CHECK (risk_level IN ('conservative', 'moderate', 'aggressive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accounts
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(50) NOT NULL UNIQUE,
    account_name VARCHAR(200) NOT NULL,
    household_id UUID NOT NULL,
    owner_person_id UUID,
    owner_entity_id UUID,
    account_type VARCHAR(50) NOT NULL,
    custodian VARCHAR(100) NOT NULL,
    custodian_account_number VARCHAR(100),
    registration TEXT NOT NULL,
    tax_id_encrypted TEXT,
    inception_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
    closed_date DATE,
    closure_reason TEXT,
    billing_method VARCHAR(20) NOT NULL DEFAULT 'arrears' CHECK (billing_method IN ('arrears', 'advance')),
    fee_schedule_id UUID,
    management_style VARCHAR(30) NOT NULL CHECK (management_style IN ('discretionary', 'non_discretionary', 'advisory_only')),
    investment_strategy_id UUID,
    restrictions TEXT,
    current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    cost_basis DECIMAL(15,2) NOT NULL DEFAULT 0,
    unrealized_gain_loss DECIMAL(15,2) NOT NULL DEFAULT 0,
    last_statement_date DATE,
    last_reconciliation_date DATE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (household_id) REFERENCES households(id),
    FOREIGN KEY (owner_person_id) REFERENCES persons(id),
    FOREIGN KEY (owner_entity_id) REFERENCES entities(id),
    FOREIGN KEY (fee_schedule_id) REFERENCES fee_schedules(id),
    FOREIGN KEY (investment_strategy_id) REFERENCES investment_strategies(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    CHECK (owner_person_id IS NOT NULL OR owner_entity_id IS NOT NULL)
);

CREATE UNIQUE INDEX idx_accounts_number ON accounts(account_number);
CREATE INDEX idx_accounts_household ON accounts(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_status ON accounts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_owner_person ON accounts(owner_person_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_owner_entity ON accounts(owner_entity_id) WHERE deleted_at IS NULL;

-- Securities
CREATE TABLE securities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    cusip VARCHAR(9),
    isin VARCHAR(12),
    security_type VARCHAR(50) NOT NULL,
    name VARCHAR(300) NOT NULL,
    description TEXT,
    exchange VARCHAR(50),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    country VARCHAR(2),
    sector VARCHAR(100),
    industry VARCHAR(100),
    issuer VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    delisted_date DATE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_securities_symbol ON securities(symbol) WHERE is_active = TRUE;
CREATE INDEX idx_securities_cusip ON securities(cusip) WHERE cusip IS NOT NULL;
CREATE INDEX idx_securities_type ON securities(security_type);
CREATE INDEX idx_securities_name_trgm ON securities USING gin(name gin_trgm_ops);

-- Positions
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    security_id UUID NOT NULL,
    quantity DECIMAL(20,6) NOT NULL,
    cost_basis DECIMAL(15,2) NOT NULL,
    cost_basis_per_share DECIMAL(15,6),
    current_price DECIMAL(15,6),
    current_value DECIMAL(15,2) NOT NULL,
    unrealized_gain_loss DECIMAL(15,2) NOT NULL,
    unrealized_gain_loss_pct DECIMAL(10,4),
    as_of_date DATE NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (security_id) REFERENCES securities(id)
);

CREATE INDEX idx_positions_account ON positions(account_id);
CREATE INDEX idx_positions_security ON positions(security_id);
CREATE INDEX idx_positions_as_of_date ON positions(as_of_date);
CREATE UNIQUE INDEX idx_positions_unique ON positions(account_id, security_id, as_of_date);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    security_id UUID,
    trade_date DATE NOT NULL,
    settlement_date DATE,
    quantity DECIMAL(20,6),
    price DECIMAL(15,6),
    amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    confirmation_number VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'settled', 'cancelled')),
    cancelled_date DATE,
    cancellation_reason TEXT,
    related_transaction_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (security_id) REFERENCES securities(id),
    FOREIGN KEY (related_transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_security ON transactions(security_id) WHERE security_id IS NOT NULL;
CREATE INDEX idx_transactions_trade_date ON transactions(trade_date);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);

-- =============================================================================
-- COMPLIANCE TABLES
-- =============================================================================

-- Compliance Reviews
CREATE TABLE compliance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_type VARCHAR(50) NOT NULL,
    household_id UUID,
    account_id UUID,
    reviewer_id UUID NOT NULL,
    review_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'requires_action')),
    findings JSONB,
    action_items JSONB,
    completed_date DATE,
    next_review_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (household_id) REFERENCES households(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE INDEX idx_compliance_reviews_household ON compliance_reviews(household_id);
CREATE INDEX idx_compliance_reviews_account ON compliance_reviews(account_id);
CREATE INDEX idx_compliance_reviews_status ON compliance_reviews(status);
CREATE INDEX idx_compliance_reviews_next_date ON compliance_reviews(next_review_date) WHERE status = 'completed';

-- Trade Reviews
CREATE TABLE trade_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL,
    review_type VARCHAR(20) NOT NULL CHECK (review_type IN ('pre_trade', 'post_trade')),
    reviewer_id UUID NOT NULL,
    approved BOOLEAN,
    rejection_reason TEXT,
    review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE INDEX idx_trade_reviews_transaction ON trade_reviews(transaction_id);
CREATE INDEX idx_trade_reviews_type ON trade_reviews(review_type);

-- =============================================================================
-- DOCUMENT MANAGEMENT
-- =============================================================================

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    retention_years INTEGER NOT NULL,
    retention_end_date DATE,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tags TEXT[],
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_documents_entity ON documents(related_entity_type, related_entity_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_retention ON documents(retention_end_date) WHERE retention_end_date IS NOT NULL;

-- =============================================================================
-- COMMUNICATION TRACKING
-- =============================================================================

-- Communications
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    communication_type VARCHAR(20) NOT NULL CHECK (communication_type IN ('email', 'phone', 'meeting', 'mail')),
    household_id UUID NOT NULL,
    person_id UUID,
    subject VARCHAR(500),
    summary TEXT NOT NULL,
    full_content TEXT,
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    advisor_id UUID NOT NULL,
    communication_date TIMESTAMPTZ NOT NULL,
    attachments JSONB,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    retention_end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (household_id) REFERENCES households(id),
    FOREIGN KEY (person_id) REFERENCES persons(id),
    FOREIGN KEY (advisor_id) REFERENCES users(id)
);

CREATE INDEX idx_communications_household ON communications(household_id);
CREATE INDEX idx_communications_person ON communications(person_id);
CREATE INDEX idx_communications_date ON communications(communication_date);
CREATE INDEX idx_communications_type ON communications(communication_type);

-- =============================================================================
-- AUDIT LOGGING
-- =============================================================================

-- Audit Events (Partitioned by month)
CREATE TABLE audit_events (
    id UUID DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL,
    user_id UUID,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'approve', 'reject')),
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    result VARCHAR(10) CHECK (result IN ('success', 'failure')),
    error_message TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
) PARTITION BY RANGE (timestamp);

CREATE INDEX idx_audit_events_user ON audit_events(user_id);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);

-- Create partitions for next 12 months (run monthly)
-- Example: CREATE TABLE audit_events_2024_01 PARTITION OF audit_events FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_securities_updated_at BEFORE UPDATE ON securities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_reviews_updated_at BEFORE UPDATE ON compliance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate household total AUM
CREATE OR REPLACE FUNCTION calculate_household_aum(household_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(current_value), 0)
    INTO total
    FROM accounts
    WHERE household_id = household_uuid
    AND status = 'active'
    AND deleted_at IS NULL;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_event_type VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_action VARCHAR,
    p_changes JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO audit_events (
        user_id,
        timestamp,
        event_type,
        entity_type,
        entity_id,
        action,
        changes,
        ip_address,
        result
    ) VALUES (
        p_user_id,
        NOW(),
        p_event_type,
        p_entity_type,
        p_entity_id,
        p_action,
        p_changes,
        p_ip_address,
        'success'
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'System Administrator', '["*:*"]'::jsonb),
('compliance_officer', 'Compliance Officer', '["household:read:all", "account:read:all", "compliance:*", "audit:read:all"]'::jsonb),
('adviser', 'Investment Adviser', '["household:*:assigned", "account:*:assigned"]'::jsonb),
('operations', 'Operations Specialist', '["household:read:assigned", "account:write:assigned"]'::jsonb),
('read_only', 'Read-Only User', '["household:read:assigned", "account:read:assigned"]'::jsonb);

-- Insert default fee schedules
INSERT INTO fee_schedules (name, description, schedule_type, tiers) VALUES
('Standard Tiered', 'Standard tiered fee schedule', 'tiered', '[
    {"min": 0, "max": 500000, "rate": 0.01},
    {"min": 500000, "max": 1000000, "rate": 0.0075},
    {"min": 1000000, "max": null, "rate": 0.005}
]'::jsonb);

-- Insert default investment strategies
INSERT INTO investment_strategies (name, description, asset_allocation, risk_level) VALUES
('Conservative Growth', 'Conservative portfolio for capital preservation', '{
    "stocks": 40,
    "bonds": 50,
    "cash": 10
}'::jsonb, 'conservative'),
('Balanced', 'Balanced portfolio for growth and income', '{
    "stocks": 60,
    "bonds": 35,
    "cash": 5
}'::jsonb, 'moderate'),
('Aggressive Growth', 'Aggressive portfolio for maximum growth', '{
    "stocks": 85,
    "bonds": 10,
    "cash": 5
}'::jsonb, 'aggressive');

-- Create initial audit event partitions for current and next month
DO $$
DECLARE
    current_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
    next_month_start DATE := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
    current_table_name TEXT;
    next_table_name TEXT;
BEGIN
    current_table_name := 'audit_events_' || TO_CHAR(current_month_start, 'YYYY_MM');
    next_table_name := 'audit_events_' || TO_CHAR(next_month_start, 'YYYY_MM');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_events FOR VALUES FROM (%L) TO (%L)',
        current_table_name, current_month_start, next_month_start);
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_events FOR VALUES FROM (%L) TO (%L)',
        next_table_name, next_month_start, next_month_start + INTERVAL '1 month');
END $$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE households IS 'Primary grouping entity for related persons and accounts';
COMMENT ON TABLE persons IS 'Individual human entities (clients, beneficiaries, etc.)';
COMMENT ON TABLE entities IS 'Non-human legal entities (trusts, corporations, etc.)';
COMMENT ON TABLE accounts IS 'Investment accounts';
COMMENT ON TABLE securities IS 'Investment securities';
COMMENT ON TABLE positions IS 'Account holdings';
COMMENT ON TABLE transactions IS 'Account transactions';
COMMENT ON TABLE audit_events IS 'Immutable audit trail for regulatory examinations';
COMMENT ON TABLE documents IS 'Document management with retention policies';
COMMENT ON TABLE communications IS 'Client communication tracking';
COMMENT ON TABLE compliance_reviews IS 'Compliance review records';
COMMENT ON TABLE trade_reviews IS 'Pre and post-trade compliance reviews';
