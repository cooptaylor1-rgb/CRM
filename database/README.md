# Database Documentation

## Overview

This directory contains the PostgreSQL database schema and migration scripts for the Wealth Management CRM.

## Schema Design

The database is designed to support:
- Complex household and entity relationships
- Multi-custodian account management
- Comprehensive audit trails for compliance
- PII encryption for sensitive data
- 6+ year data retention requirements

## Core Tables

### Client Management
- **households** - Primary organizational unit (families, trusts, etc.)
- **persons** - Individual clients with encrypted PII
- **household_members** - Junction table linking persons to households
- **entities** - Legal entities (trusts, LLCs, foundations)

### Account Management
- **accounts** - Financial accounts at custodians
- **account_owners** - Joint account ownership
- **positions** - Current holdings
- **transactions** - Historical transaction records
- **securities** - Investment securities master data

### Compliance
- **audit_events** - Comprehensive audit trail (partitioned by month)
- **documents** - Document storage with retention policies
- **communications** - Client communication archive

### System
- **users** - System users with RBAC

## Running Migrations

### Initial Setup

```bash
# Create database
createdb crm_wealth

# Run schema
psql -d crm_wealth -f database/schemas/schema.sql
```

### Using TypeORM Migrations

```bash
# Generate migration from entity changes
npm run migration:generate MigrationName

# Create blank migration
npm run migration:create MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## Data Encryption

### Encrypted Fields

The following fields are encrypted at rest using PostgreSQL pgcrypto:

**Persons:**
- first_name, last_name, middle_name
- date_of_birth
- ssn
- email
- phone_primary, phone_secondary
- address fields

**Accounts:**
- account_number (stored with last 4 digits separately for display)

**Entities:**
- tax_id

**Documents:**
- file_path (S3 path)

**Communications:**
- body (message content)

### Encryption Implementation

```sql
-- Example encryption (in application layer)
INSERT INTO persons (
    first_name,
    last_name,
    ssn,
    ...
) VALUES (
    pgp_sym_encrypt('John', :encryption_key),
    pgp_sym_encrypt('Smith', :encryption_key),
    pgp_sym_encrypt('123-45-6789', :encryption_key),
    ...
);

-- Example decryption
SELECT
    pgp_sym_decrypt(first_name, :encryption_key) as first_name,
    pgp_sym_decrypt(last_name, :encryption_key) as last_name,
    'XXX-XX-' || RIGHT(pgp_sym_decrypt(ssn, :encryption_key), 4) as ssn_masked
FROM persons
WHERE id = :id;
```

## Indexing Strategy

### Performance Indexes
- Primary keys (UUID) on all tables
- Foreign key columns
- Status and type enum columns
- Date columns used in queries

### Search Indexes
- GIN indexes for JSONB columns
- GIN trigram indexes for text search (household names, person names)

### Compliance Indexes
- Audit events partitioned by timestamp
- Document retention_until for automated archival

## Partitioning

### Audit Events

The `audit_events` table is partitioned by month to maintain query performance:

```sql
-- Create new partition (automation recommended)
CREATE TABLE audit_events_2025_01 PARTITION OF audit_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

**Partition Management:**
- Create new partitions monthly (automated via cron or application)
- Old partitions (> 2 years) can be detached and archived to S3
- Maintain active partitions for 7 years minimum

## Data Retention

### Retention Policies

| Table | Retention Period | Policy |
|-------|------------------|--------|
| households | Indefinite | Closed households retain data |
| accounts | Indefinite | Closed accounts retain transactions |
| transactions | 6 years minimum | From transaction date |
| audit_events | 7 years minimum | From event timestamp |
| documents | 6+ years | Based on document type |
| communications | 6 years | From communication date |

### Archival Process

**Documents:**
1. Active (0-2 years): Hot storage (S3 Standard)
2. Archive (2-6 years): Warm storage (S3 Infrequent Access)
3. Long-term (6+ years): Cold storage (S3 Glacier)

**Audit Events:**
1. Active (0-2 years): PostgreSQL partitions
2. Archive (2-7 years): Detached partitions on S3
3. Retention check: Automated deletion after 7 years (with litigation hold checks)

## Backup Strategy

### Automated Backups

**Daily Snapshots:**
```bash
pg_dump -h localhost -U crm_user -d crm_wealth \
    -F c -b -v -f /backups/crm_wealth_$(date +%Y%m%d).dump
```

**Transaction Log Shipping:**
- WAL (Write-Ahead Log) archiving every 15 minutes
- 15-minute Recovery Point Objective (RPO)

**Cross-Region Replication:**
- Daily full backups replicated to DR region
- Transaction logs replicated continuously

### Restore Testing

**Monthly:**
- Test restore from previous day's backup
- Verify data integrity
- Document restore time (RTO)

**Quarterly:**
- Full disaster recovery drill
- Restore to separate environment
- Application-level testing

## Performance Tuning

### Key Settings (postgresql.conf)

```ini
# Memory
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 32MB
maintenance_work_mem = 1GB

# Connections
max_connections = 200

# WAL
wal_level = replica
checkpoint_timeout = 10min
max_wal_size = 2GB

# Query Planning
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200

# Monitoring
log_min_duration_statement = 1000  # Log queries > 1s
```

### Query Optimization

**Common Slow Queries:**
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Missing indexes
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
    AND n_distinct > 100
    AND correlation < 0.1;
```

## Security

### Row-Level Security (RLS)

Advisors can only access their assigned households:

```sql
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY advisor_household_access ON households
    FOR ALL
    TO advisor_role
    USING (
        primary_advisor_id = current_user_id()
        OR secondary_advisor_id = current_user_id()
    );
```

### Connection Security

**Required:**
- SSL/TLS for all connections
- No direct public internet access to database
- Access via VPN or bastion host only
- Separate read replicas for reporting

**Connection String Example:**
```
postgresql://username:password@host:5432/crm_wealth?sslmode=require
```

## Monitoring

### Key Metrics

**Performance:**
- Query duration (p50, p95, p99)
- Connection pool utilization
- Cache hit ratio
- Index usage

**Capacity:**
- Database size
- Table sizes (especially audit_events)
- Transaction rate
- Replication lag

**Alerts:**
- Replication lag > 5 minutes
- Disk space < 20%
- Connection pool exhaustion
- Long-running queries (> 5 minutes)
- Failed login attempts

### Monitoring Queries

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('crm_wealth'));

-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Cache hit ratio (should be > 99%)
SELECT
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;

-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

## Maintenance

### Regular Tasks

**Daily:**
- Automated vacuum (handled by autovacuum)
- Backup verification

**Weekly:**
- ANALYZE for updated statistics
- Check for bloat
- Review slow query log

**Monthly:**
- VACUUM FULL on heavily updated tables (maintenance window)
- Create new audit_events partition
- Archive old audit_events partitions
- Review and optimize indexes

**Quarterly:**
- Major version upgrade planning
- Capacity planning review
- Performance benchmarking

### Vacuum Strategy

```sql
-- Manual vacuum analyze
VACUUM ANALYZE households;
VACUUM ANALYZE accounts;
VACUUM ANALYZE positions;

-- Check bloat
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    n_live_tup,
    n_dead_tup,
    round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

## Troubleshooting

### Common Issues

**Slow Queries:**
1. Check EXPLAIN ANALYZE output
2. Verify indexes exist and are being used
3. Update table statistics with ANALYZE
4. Consider query rewrite

**Connection Pool Exhausted:**
1. Check for connection leaks in application
2. Increase pool size (with caution)
3. Reduce connection timeout
4. Use connection pooler (PgBouncer)

**Replication Lag:**
1. Check network between primary and replica
2. Verify replica has adequate resources
3. Consider increasing wal_sender_timeout
4. Check for long-running transactions blocking replication

**Disk Space:**
1. Identify large tables
2. Archive old audit_events partitions
3. Run VACUUM FULL (requires maintenance window)
4. Increase disk capacity

## Support

For database-related questions:
- DBA Team: dba@yourcompany.com
- Slack: #database-support
- On-call: PagerDuty (for production issues)

---

**Last Updated:** 2024-12-22  
**Owner:** Database Team  
**Review Cycle:** Quarterly
