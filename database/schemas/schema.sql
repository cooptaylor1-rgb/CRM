-- Wealth Management CRM - PostgreSQL Database Schema
-- Version: 1.0.0
-- Description: Complete database schema for SEC-compliant wealth management CRM

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create custom types
CREATE TYPE household_type AS ENUM ('FAMILY', 'INDIVIDUAL', 'TRUST', 'FOUNDATION', 'CORPORATION');
CREATE TYPE household_status AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE', 'CLOSED');
CREATE TYPE service_model AS ENUM ('WEALTH_MANAGEMENT', 'FINANCIAL_PLANNING', 'INVESTMENT_ONLY', 'CONSULTING');
CREATE TYPE billing_frequency AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');
CREATE TYPE billing_method AS ENUM ('ARREARS', 'ADVANCE');
CREATE TYPE risk_tolerance AS ENUM ('CONSERVATIVE', 'MODERATE', 'GROWTH', 'AGGRESSIVE');
CREATE TYPE investment_objective AS ENUM ('PRESERVATION', 'INCOME', 'GROWTH', 'SPECULATION');

CREATE TYPE account_type AS ENUM ('BROKERAGE', 'IRA_TRADITIONAL', 'IRA_ROTH', '401K', '403B', 'SEP_IRA', 'SIMPLE_IRA', '529', 'TRUST', 'JOINT', 'INDIVIDUAL', 'BANKING');
CREATE TYPE account_status AS ENUM ('PENDING', 'OPEN', 'CLOSED', 'RESTRICTED', 'FROZEN');
CREATE TYPE custodian AS ENUM ('SCHWAB', 'FIDELITY', 'PERSHING', 'INTERACTIVEBROKERS', 'VANGUARD', 'TDAMERITRADE', 'OTHER');

CREATE TYPE member_role AS ENUM ('CLIENT', 'SPOUSE', 'PARTNER', 'DEPENDENT', 'BENEFICIARY', 'TRUSTEE', 'POWER_OF_ATTORNEY', 'OTHER');
CREATE TYPE marital_status AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'PARTNERED');
CREATE TYPE tax_filing_status AS ENUM ('SINGLE', 'MARRIED_JOINT', 'MARRIED_SEPARATE', 'HEAD_OF_HOUSEHOLD');
CREATE TYPE kyc_status AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED');

CREATE TYPE entity_type AS ENUM ('TRUST', 'LLC', 'CORPORATION', 'PARTNERSHIP', 'FOUNDATION', 'ESTATE', 'FAMILY_LIMITED_PARTNERSHIP');
CREATE TYPE entity_status AS ENUM ('ACTIVE', 'DISSOLVED', 'PENDING', 'SUSPENDED');

CREATE TYPE security_type AS ENUM ('EQUITY', 'FIXED_INCOME', 'MUTUAL_FUND', 'ETF', 'OPTION', 'FUTURE', 'CASH', 'ALTERNATIVE', 'REAL_ESTATE', 'COMMODITY');
CREATE TYPE asset_class AS ENUM ('US_EQUITY', 'INTL_EQUITY', 'BONDS', 'CASH', 'ALTERNATIVES', 'REAL_ESTATE', 'COMMODITIES');

CREATE TYPE transaction_type AS ENUM ('BUY', 'SELL', 'DIVIDEND', 'INTEREST', 'DEPOSIT', 'WITHDRAWAL', 'FEE', 'TRANSFER_IN', 'TRANSFER_OUT', 'STOCK_SPLIT', 'DIVIDEND_REINVEST');
CREATE TYPE transaction_source AS ENUM ('MANUAL', 'CUSTODIAN_FEED', 'API');

CREATE TYPE document_type AS ENUM ('IPS', 'CLIENT_AGREEMENT', 'FORM_ADV', 'TAX_RETURN', 'ACCOUNT_STATEMENT', 'PERFORMANCE_REPORT', 'MEETING_NOTES', 'CORRESPONDENCE', 'OTHER');
CREATE TYPE document_category AS ENUM ('LEGAL', 'COMPLIANCE', 'FINANCIAL', 'CORRESPONDENCE', 'OTHER');

CREATE TYPE communication_type AS ENUM ('EMAIL', 'PHONE', 'MEETING', 'LETTER', 'TEXT_MESSAGE', 'VIDEO_CALL');
CREATE TYPE communication_direction AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');

CREATE TYPE audit_event_type AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ACCESS', 'LOGIN', 'LOGOUT', 'EXPORT', 'APPROVAL', 'REJECTION');
CREATE TYPE audit_result AS ENUM ('SUCCESS', 'FAILURE', 'PARTIAL');
CREATE TYPE audit_severity AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- =============================================
-- USERS AND AUTHENTICATION
-- =============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- HOUSEHOLDS
-- =============================================

CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type household_type NOT NULL,
    status household_status NOT NULL DEFAULT 'PROSPECT',
    primary_advisor_id UUID NOT NULL REFERENCES users(id),
    secondary_advisor_id UUID REFERENCES users(id),
    service_model service_model NOT NULL DEFAULT 'WEALTH_MANAGEMENT',
    fee_schedule JSONB,
    aum DECIMAL(15,2) DEFAULT 0 CHECK (aum >= 0),
    aum_as_of DATE,
    billing_frequency billing_frequency DEFAULT 'QUARTERLY',
    billing_method billing_method DEFAULT 'ARREARS',
    onboarding_date DATE,
    termination_date DATE,
    termination_reason TEXT,
    risk_tolerance risk_tolerance,
    investment_objective investment_objective,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    CONSTRAINT chk_onboarding_date CHECK (onboarding_date <= CURRENT_DATE),
    CONSTRAINT chk_termination_date CHECK (termination_date IS NULL OR termination_date >= onboarding_date),
    CONSTRAINT chk_closed_status CHECK (status != 'CLOSED' OR termination_date IS NOT NULL)
);

CREATE INDEX idx_households_status ON households(status);
CREATE INDEX idx_households_primary_advisor ON households(primary_advisor_id);
CREATE INDEX idx_households_name ON households USING gin (name gin_trgm_ops);
CREATE INDEX idx_households_created_at ON households(created_at);

-- =============================================
-- PERSONS
-- =============================================

CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    suffix VARCHAR(20),
    preferred_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    ssn VARCHAR(11), -- Encrypted
    citizenship VARCHAR(2),
    country_of_birth VARCHAR(2),
    marital_status marital_status,
    employment_status VARCHAR(100),
    employer VARCHAR(200),
    occupation VARCHAR(100),
    tax_filing_status tax_filing_status,
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    kyc_status kyc_status NOT NULL DEFAULT 'PENDING',
    kyc_verified_date DATE,
    kyc_verified_by UUID REFERENCES users(id),
    kyc_expiration_date DATE,
    accredited_investor BOOLEAN DEFAULT false,
    qualified_client BOOLEAN DEFAULT false,
    qualified_purchaser BOOLEAN DEFAULT false,
    pep_status BOOLEAN DEFAULT false,
    ofac_checked BOOLEAN DEFAULT false,
    ofac_checked_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    CONSTRAINT chk_age CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years'),
    CONSTRAINT chk_kyc_expiration CHECK (kyc_expiration_date IS NULL OR kyc_expiration_date > kyc_verified_date)
);

CREATE UNIQUE INDEX idx_persons_ssn ON persons(ssn) WHERE ssn IS NOT NULL;
CREATE INDEX idx_persons_email ON persons(email);
CREATE INDEX idx_persons_kyc_status ON persons(kyc_status);
CREATE INDEX idx_persons_last_name ON persons(last_name);

-- =============================================
-- HOUSEHOLD MEMBERS (Junction Table)
-- =============================================

CREATE TABLE household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    role member_role NOT NULL,
    primary_contact BOOLEAN NOT NULL DEFAULT false,
    ownership_percentage DECIMAL(5,2) CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
    relationship_to_primary VARCHAR(100),
    can_trade BOOLEAN DEFAULT false,
    can_withdraw BOOLEAN DEFAULT false,
    receives_statements BOOLEAN DEFAULT true,
    receives_tax_docs BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_end_date CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE UNIQUE INDEX idx_household_person_active ON household_members(household_id, person_id) WHERE active = true;
CREATE INDEX idx_household_members_household ON household_members(household_id);
CREATE INDEX idx_household_members_person ON household_members(person_id);

-- =============================================
-- ENTITIES (Trusts, LLCs, etc.)
-- =============================================

CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    type entity_type NOT NULL,
    sub_type VARCHAR(100),
    tax_id VARCHAR(20), -- Encrypted
    state_of_formation VARCHAR(2),
    country_of_formation VARCHAR(2) NOT NULL DEFAULT 'US',
    formation_date DATE,
    dissolution_date DATE,
    status entity_status NOT NULL DEFAULT 'ACTIVE',
    trustees JSONB,
    beneficiaries JSONB,
    members JSONB,
    officers JSONB,
    registered_agent VARCHAR(255),
    registered_agent_address JSONB,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    CONSTRAINT chk_dissolution_date CHECK (dissolution_date IS NULL OR dissolution_date >= formation_date),
    CONSTRAINT chk_dissolved_status CHECK (status != 'DISSOLVED' OR dissolution_date IS NOT NULL)
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_status ON entities(status);
CREATE INDEX idx_entities_name ON entities USING gin (name gin_trgm_ops);

-- =============================================
-- ACCOUNTS
-- =============================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
    entity_id UUID REFERENCES entities(id),
    account_number VARCHAR(50) NOT NULL, -- Encrypted
    account_number_last_four VARCHAR(4) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type account_type NOT NULL,
    registration TEXT NOT NULL,
    custodian custodian NOT NULL,
    custodian_account_id VARCHAR(100),
    status account_status NOT NULL DEFAULT 'PENDING',
    opened_date DATE NOT NULL,
    closed_date DATE,
    closure_reason TEXT,
    managed BOOLEAN NOT NULL DEFAULT false,
    discretionary BOOLEAN NOT NULL DEFAULT false,
    billing_eligible BOOLEAN NOT NULL DEFAULT true,
    fee_percentage DECIMAL(6,4) CHECK (fee_percentage IS NULL OR (fee_percentage >= 0 AND fee_percentage <= 1)),
    fee_schedule JSONB,
    market_value DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (market_value >= 0),
    cash_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    market_value_as_of DATE NOT NULL DEFAULT CURRENT_DATE,
    benchmark VARCHAR(50),
    model_portfolio VARCHAR(100),
    rebalance_threshold DECIMAL(5,2),
    last_rebalanced_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    CONSTRAINT chk_closed_date CHECK (closed_date IS NULL OR closed_date >= opened_date),
    CONSTRAINT chk_account_closed CHECK (status != 'CLOSED' OR closed_date IS NOT NULL)
);

CREATE UNIQUE INDEX idx_account_number ON accounts(custodian, account_number);
CREATE INDEX idx_accounts_household ON accounts(household_id);
CREATE INDEX idx_accounts_entity ON accounts(entity_id);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_custodian ON accounts(custodian);

-- =============================================
-- ACCOUNT OWNERS (for joint accounts)
-- =============================================

CREATE TABLE account_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE RESTRICT,
    ownership_type VARCHAR(50) NOT NULL,
    ownership_percentage DECIMAL(5,2) NOT NULL CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
    can_trade BOOLEAN DEFAULT false,
    can_withdraw BOOLEAN DEFAULT false,
    receives_statements BOOLEAN DEFAULT true,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_owner_end_date CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_account_owners_account ON account_owners(account_id);
CREATE INDEX idx_account_owners_person ON account_owners(person_id);

-- =============================================
-- SECURITIES
-- =============================================

CREATE TABLE securities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20),
    cusip VARCHAR(9),
    isin VARCHAR(12),
    name VARCHAR(255) NOT NULL,
    security_type security_type NOT NULL,
    asset_class asset_class NOT NULL,
    sub_asset_class VARCHAR(100),
    sector VARCHAR(100),
    country VARCHAR(2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    exchange VARCHAR(50),
    price DECIMAL(12,6),
    price_updated_at TIMESTAMP,
    dividend_yield DECIMAL(6,4),
    expense_ratio DECIMAL(6,4),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_securities_cusip ON securities(cusip) WHERE cusip IS NOT NULL;
CREATE UNIQUE INDEX idx_securities_symbol ON securities(symbol) WHERE symbol IS NOT NULL;
CREATE INDEX idx_securities_type ON securities(security_type);
CREATE INDEX idx_securities_asset_class ON securities(asset_class);

-- =============================================
-- POSITIONS
-- =============================================

CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    security_id UUID NOT NULL REFERENCES securities(id),
    quantity DECIMAL(18,6) NOT NULL CHECK (quantity >= 0),
    cost_basis DECIMAL(15,2) NOT NULL,
    average_cost DECIMAL(12,6) NOT NULL,
    market_value DECIMAL(15,2) NOT NULL,
    price DECIMAL(12,6) NOT NULL,
    price_as_of TIMESTAMP NOT NULL,
    unrealized_gain_loss DECIMAL(15,2) NOT NULL,
    unrealized_gain_loss_percent DECIMAL(8,4) NOT NULL,
    lot_details JSONB,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_account_security ON positions(account_id, security_id);
CREATE INDEX idx_positions_account ON positions(account_id);
CREATE INDEX idx_positions_security ON positions(security_id);

-- =============================================
-- TRANSACTIONS
-- =============================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    security_id UUID REFERENCES securities(id),
    transaction_date DATE NOT NULL,
    settlement_date DATE NOT NULL,
    type transaction_type NOT NULL,
    quantity DECIMAL(18,6),
    price DECIMAL(12,6),
    amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    source transaction_source NOT NULL DEFAULT 'MANUAL',
    external_id VARCHAR(100),
    imported_at TIMESTAMP,
    reconciled BOOLEAN DEFAULT false,
    reconciled_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    CONSTRAINT chk_settlement_date CHECK (settlement_date >= transaction_date)
);

CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_security ON transactions(security_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_external_id ON transactions(external_id);

-- =============================================
-- DOCUMENTS
-- =============================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    person_id UUID REFERENCES persons(id),
    account_id UUID REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    document_type document_type NOT NULL,
    category document_category NOT NULL,
    file_path TEXT NOT NULL, -- Encrypted S3 path
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(100) NOT NULL,
    extension VARCHAR(10) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    retention_period_years INTEGER NOT NULL CHECK (retention_period_years > 0),
    retention_until DATE NOT NULL,
    retention_basis VARCHAR(100) NOT NULL,
    encrypted BOOLEAN NOT NULL DEFAULT true,
    encryption_key_id VARCHAR(100),
    checksum VARCHAR(64) NOT NULL,
    virus_scanned BOOLEAN NOT NULL DEFAULT false,
    virus_scan_date TIMESTAMP,
    tags JSONB,
    metadata JSONB,
    notes TEXT,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_household ON documents(household_id);
CREATE INDEX idx_documents_person ON documents(person_id);
CREATE INDEX idx_documents_account ON documents(account_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_uploaded ON documents(uploaded_at);
CREATE INDEX idx_documents_retention ON documents(retention_until);
CREATE INDEX idx_documents_tags ON documents USING gin (tags);

-- =============================================
-- COMMUNICATIONS
-- =============================================

CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    person_id UUID REFERENCES persons(id),
    type communication_type NOT NULL,
    direction communication_direction NOT NULL,
    subject VARCHAR(500),
    body TEXT, -- Encrypted
    participants JSONB NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    location VARCHAR(255),
    method VARCHAR(100),
    attachments JSONB,
    tags JSONB,
    requires_follow_up BOOLEAN DEFAULT false,
    follow_up_date DATE,
    archived_email_id VARCHAR(255),
    external_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_communications_household ON communications(household_id);
CREATE INDEX idx_communications_person ON communications(person_id);
CREATE INDEX idx_communications_timestamp ON communications(timestamp);
CREATE INDEX idx_communications_type ON communications(type);
CREATE INDEX idx_communications_tags ON communications USING gin (tags);

-- =============================================
-- AUDIT EVENTS
-- =============================================

CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type audit_event_type NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    user_id UUID NOT NULL REFERENCES users(id),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET NOT NULL,
    user_agent TEXT,
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    result audit_result NOT NULL,
    severity audit_severity NOT NULL,
    changes JSONB,
    metadata JSONB,
    error_message TEXT,
    retention_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 years')
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions (manually or via automation)
CREATE TABLE audit_events_2024_12 PARTITION OF audit_events
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE INDEX idx_audit_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_user ON audit_events(user_id);
CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_event_type ON audit_events(event_type);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE households IS 'Primary organizational unit for client families and entities';
COMMENT ON TABLE persons IS 'Individual persons with PII encryption';
COMMENT ON TABLE accounts IS 'Financial accounts at various custodians';
COMMENT ON TABLE positions IS 'Current holdings in accounts';
COMMENT ON TABLE transactions IS 'Historical transaction records';
COMMENT ON TABLE audit_events IS 'Comprehensive audit trail for compliance';
COMMENT ON TABLE documents IS 'Document management with retention policies';

-- =============================================
-- END OF SCHEMA
-- =============================================
