-- Initialization script for Wealth Management CRM Database
-- This script runs before schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- This file is intentionally minimal as schema.sql contains the full schema
-- The schema.sql file will be executed after this init.sql file

-- Create a function to insert seed data after schema is created
CREATE OR REPLACE FUNCTION insert_seed_data() RETURNS void AS $$
BEGIN
    -- Insert default roles (will be created after schema is loaded)
    -- This will be called from a separate seed file if needed
    RAISE NOTICE 'Database initialized. Seed data will be inserted after schema creation.';
END;
$$ LANGUAGE plpgsql;

-- The actual seed data will be inserted after the schema is created
-- We'll add seed users in the application startup or migration
