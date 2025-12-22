# Database

This directory contains the complete PostgreSQL database schema and migration files for the Wealth Management CRM.

## Directory Structure

```
database/
├── schemas/
│   └── schema.sql          # Complete database schema
├── migrations/             # Database migrations (created by TypeORM)
└── README.md              # This file
```

## Schema Overview

The database schema is designed to support:
- **SEC Compliance**: Full audit trails, data retention policies
- **Data Integrity**: Foreign keys, check constraints, referential integrity
- **Performance**: Strategic indexes, partitioned audit tables
- **Security**: Row-level security ready, encrypted PII fields

### Core Tables

| Table | Purpose |
|-------|---------|
| `households` | Primary grouping for related persons and accounts |
| `persons` | Individual clients and beneficiaries |
| `entities` | Legal entities (trusts, corporations, etc.) |
| `accounts` | Investment accounts |
| `securities` | Investment instruments |
| `positions` | Account holdings |
| `transactions` | All account transactions |
| `audit_events` | Immutable audit trail (partitioned) |
| `documents` | Document management with retention |
| `communications` | Client communication logs |
| `compliance_reviews` | Compliance review records |

## Setup

### Prerequisites

- PostgreSQL 15 or higher
- UUID extension
- pg_trgm extension (for text search)

### Initial Setup

1. **Create Database**:
```bash
createdb crm_wealth
```

2. **Run Schema**:
```bash
psql -U crm_user -d crm_wealth -f schemas/schema.sql
```

3. **Verify**:
```bash
psql -U crm_user -d crm_wealth -c "\dt"
```

### Using Docker

```bash
docker-compose up -d postgres
docker exec -it crm-postgres psql -U crm_user -d crm_wealth -f /docker-entrypoint-initdb.d/schema.sql
```

## Migrations

Migrations are managed by TypeORM. After initial schema setup, use migrations for all schema changes.

### Generate Migration

```bash
cd backend
npm run migration:generate -- src/database/migrations/MigrationName
```

### Run Migrations

```bash
npm run migration:run
```

### Revert Migration

```bash
npm run migration:revert
```

## Partitioning

The `audit_events` table is partitioned by month for performance. New partitions should be created monthly:

```sql
CREATE TABLE audit_events_2024_12 PARTITION OF audit_events
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
```

Automated partition creation is recommended via cron job or scheduled task.

## Backup and Restore

### Backup

```bash
pg_dump -U crm_user -d crm_wealth -F c -f crm_backup_$(date +%Y%m%d).dump
```

### Restore

```bash
pg_restore -U crm_user -d crm_wealth -c crm_backup_20240115.dump
```

### Backup Strategy

- **Daily**: Automated full backups retained for 30 days
- **Weekly**: Full backups retained for 3 months
- **Monthly**: Full backups retained for 7 years (compliance)
- **Point-in-Time Recovery**: WAL archiving enabled

## Performance Optimization

### Key Indexes

- All foreign keys indexed
- Text search indexes using pg_trgm
- Composite indexes for common queries
- Partial indexes for active records only

### Query Optimization Tips

1. Use prepared statements
2. Leverage indexes in WHERE clauses
3. Use pagination for large result sets
4. Monitor slow query log
5. Regularly run `ANALYZE` and `VACUUM`

## Security

### Row-Level Security

Row-level security policies can be enabled per table to restrict data access based on user role:

```sql
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY adviser_household_policy ON households
    FOR SELECT
    TO adviser_role
    USING (advisor_id = current_setting('app.current_user_id')::uuid);
```

### Encryption

- PII fields (`ssn_encrypted`, `ein_encrypted`, `tax_id_encrypted`) are encrypted at application level
- Database-level encryption (TDE) recommended for production
- Backups must be encrypted

### Audit Logging

All sensitive operations are logged in `audit_events` table:
- Data modifications
- PII access
- Compliance actions
- Authentication events

## Compliance

### Data Retention

Retention periods are enforced per SEC requirements:
- **Client records**: 6 years after termination
- **Transaction records**: 6 years from date
- **Communications**: 6 years from date
- **Audit logs**: 7 years minimum

### Legal Hold

Records under legal hold cannot be deleted. Check `documents` table for retention policies before deletion.

## Monitoring

### Health Checks

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('crm_wealth'));

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Connection Pooling

Recommended connection pool settings:
- Min connections: 10
- Max connections: 100
- Idle timeout: 30 seconds
- Connection timeout: 5 seconds

## Troubleshooting

### Common Issues

**Issue**: Migration fails  
**Solution**: Check for uncommitted transactions, verify schema version

**Issue**: Slow queries  
**Solution**: Run `EXPLAIN ANALYZE`, check indexes, increase `work_mem`

**Issue**: Disk space filling up  
**Solution**: Run `VACUUM FULL`, archive old audit partitions

**Issue**: Connection limit reached  
**Solution**: Increase `max_connections`, optimize connection pooling

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [TypeORM Documentation](https://typeorm.io/)
- [SEC Rule 204-2](https://www.sec.gov/rules/final/ia-2239.htm)

---

**Last Updated**: 2024-01-15  
**Schema Version**: 1.0  
**PostgreSQL Version**: 15+
