# Wealth Management CRM

> Enterprise-grade Customer Relationship Management system for SEC-registered investment advisors

[![Build Status](https://img.shields.io/github/workflow/status/your-org/crm-wealth/CI)](https://github.com/your-org/crm-wealth/actions)
[![Coverage](https://img.shields.io/codecov/c/github/your-org/crm-wealth)](https://codecov.io/gh/your-org/crm-wealth)
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)

## Overview

The Wealth Management CRM is a comprehensive, enterprise-grade system designed specifically for SEC-registered Registered Investment Advisors (RIAs). Built with compliance, security, and scalability at its core, this platform supports complex household structures, multi-custodian account management, investment tracking, and complete regulatory compliance.

### Key Features

**Client Management:**
- 🏠 **Household Management** - Support for families, trusts, foundations, and corporate entities
- 👥 **Complex Relationships** - Multi-generational families, joint ownership, power of attorney
- 📊 **360° Client View** - Complete client profile with all accounts, positions, and documents

**Investment Management:**
- 💰 **Multi-Custodian Support** - Schwab, Fidelity, Pershing, Interactive Brokers, and more
- 📈 **Portfolio Management** - Model portfolios, rebalancing, trade execution
- 📊 **Performance Reporting** - Time-weighted returns, attribution analysis, benchmark comparison
- 🎯 **Tax Optimization** - Tax-loss harvesting, lot selection, capital gains management

**Compliance & Audit:**
- ✅ **SEC Compliance** - Rule 204-2 books and records, Form ADV management
- 🔍 **Complete Audit Trail** - Every action logged for regulatory examination
- 📄 **Document Management** - 6+ year retention, automatic archival, compliance workflows
- 🔒 **KYC/AML** - Identity verification, OFAC screening, PEP checks

**Security:**
- 🔐 **Encryption Everywhere** - PII encrypted at rest and in transit
- 🛡️ **RBAC** - Fine-grained role-based access control
- 📝 **Audit Logging** - Comprehensive activity logging
- 🔒 **MFA** - Multi-factor authentication required

**Enterprise Ready:**
- ⚡ **High Performance** - Sub-second response times, optimized queries
- 📈 **Scalable** - Support for 10,000+ households, millions of transactions
- 🔄 **99.9% Uptime** - Multi-AZ deployment, automatic failover
- 🌍 **API First** - Complete REST API, webhook support

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended for local development)

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/crm-wealth.git
   cd crm-wealth
   ```

2. **Start infrastructure services:**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Setup backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run migration:run
   npm run seed:dev
   npm run start:dev
   ```

4. **Setup frontend:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local with your configuration
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api/docs

### Docker Setup (Alternative)

```bash
docker-compose up
```

This will start all services (backend, frontend, PostgreSQL, Redis) in containers.

## Architecture

### System Architecture

The system follows a modern, layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                   │
│  Components, Pages, State Management, API Client            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST
┌────────────────────────▼────────────────────────────────────┐
│                    API Gateway / Load Balancer              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Backend (NestJS)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Households   │  │  Accounts    │  │  Compliance  │     │
│  │   Module     │  │   Module     │  │    Module    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Persons    │  │ Investments  │  │    Audit     │     │
│  │   Module     │  │   Module     │  │    Module    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬───────────────┐
        │                │                │               │
┌───────▼─────┐  ┌───────▼─────┐  ┌──────▼──────┐ ┌─────▼─────┐
│ PostgreSQL  │  │    Redis    │  │     S3      │ │  Custodian│
│  (Primary)  │  │   (Cache)   │  │ (Documents) │ │    APIs   │
└─────────────┘  └─────────────┘  └─────────────┘ └───────────┘
```

### Technology Stack

**Backend:**
- **Framework:** NestJS (TypeScript)
- **ORM:** TypeORM
- **Database:** PostgreSQL 15
- **Cache:** Redis
- **Queue:** Bull (Redis-based)
- **Validation:** class-validator, class-transformer
- **Security:** Helmet, bcrypt, JWT

**Frontend:**
- **Framework:** Next.js 14 (React 18)
- **State:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Styling:** Tailwind CSS
- **UI Components:** Headless UI

**Infrastructure:**
- **Cloud:** AWS (EC2, RDS, ElastiCache, S3, CloudFront)
- **Container Orchestration:** Kubernetes (EKS)
- **IaC:** Terraform
- **CI/CD:** GitHub Actions
- **Monitoring:** DataDog / New Relic
- **Logging:** ELK Stack

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Project Structure

```
crm-wealth/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   │   ├── households/
│   │   │   ├── accounts/
│   │   │   ├── persons/
│   │   │   ├── investments/
│   │   │   ├── compliance/
│   │   │   ├── audit/
│   │   │   └── auth/
│   │   ├── common/          # Shared code
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── pipes/
│   │   │   └── types/
│   │   ├── config/          # Configuration
│   │   └── database/        # Database migrations and seeds
│   └── test/                # E2E tests
├── frontend/                # Next.js frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Next.js pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── database/                # Database schemas and documentation
│   ├── schemas/
│   └── migrations/
├── infrastructure/          # Infrastructure as Code
│   ├── terraform/           # Terraform configurations
│   ├── docker/              # Docker configurations
│   └── k8s/                 # Kubernetes manifests
├── docs/                    # Documentation
│   ├── DOMAIN_MODEL.md      # Entity relationships and business rules
│   ├── API_DESIGN.md        # API design standards
│   ├── WORKFLOWS.md         # Business workflows
│   └── TESTING_STRATEGY.md  # Testing approach
├── .github/                 # GitHub configuration
│   ├── workflows/           # CI/CD pipelines
│   └── ISSUE_TEMPLATE/      # Issue templates
├── ARCHITECTURE.md          # System architecture
├── SECURITY.md              # Security architecture
├── COMPLIANCE.md            # Compliance framework
├── CONTRIBUTING.md          # Contribution guidelines
└── README.md                # This file
```

## Core Concepts

### Households

A **household** is the primary organizational unit, representing a family, individual, trust, foundation, or corporate entity. Each household contains:
- Members (persons with specific roles)
- Accounts (financial accounts at various custodians)
- Documents (agreements, statements, tax documents)
- Communications (emails, meetings, phone calls)
- Relationship with a primary advisor

### Accounts

**Accounts** are financial accounts held at custodians (Schwab, Fidelity, etc.). Each account:
- Belongs to a household or entity
- Has one or more owners (for joint accounts)
- Contains positions (current holdings)
- Tracks transactions (trades, cash flows)
- Has an assigned fee schedule
- May be managed (discretionary) or advisory-only

### Investment Management

The system supports sophisticated investment management:
- **Model Portfolios:** Pre-defined asset allocations
- **Custom Strategies:** Client-specific allocations
- **Rebalancing:** Automatic drift detection and rebalancing recommendations
- **Tax Optimization:** Tax-loss harvesting, wash sale prevention
- **Performance Tracking:** Daily position updates, time-weighted returns

### Compliance

Built-in compliance features ensure regulatory adherence:
- **Audit Trail:** Every action logged with user, timestamp, before/after values
- **Document Retention:** Automatic 6-year retention with archival
- **Form ADV Management:** Track filings and client delivery
- **KYC/AML:** Identity verification, OFAC screening, ongoing monitoring
- **Fee Billing:** Accurate fee calculation with audit trail

## Development

### Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:cov

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run type-check

# All quality checks
npm run quality
```

### Database

```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration
npm run migration:generate MigrationName

# Seed database
npm run seed
```

## API Documentation

Interactive API documentation is available at:
- Development: http://localhost:3000/api/docs
- Staging: https://api-staging.wealth-crm.com/docs
- Production: https://api.wealth-crm.com/docs

See [API Design Standards](./docs/API_DESIGN.md) for detailed API documentation.

## Security

Security is paramount in this system:

**Authentication:**
- JWT-based authentication
- Multi-factor authentication (TOTP/SMS)
- Short-lived access tokens (1 hour)
- Refresh token rotation

**Authorization:**
- Role-based access control (RBAC)
- Row-level security in database
- API-level authorization checks
- Principle of least privilege

**Data Protection:**
- PII encrypted at rest (AES-256-GCM)
- TLS 1.3 for data in transit
- Secrets managed via AWS Secrets Manager
- Regular security audits

See [SECURITY.md](./SECURITY.md) for comprehensive security documentation.

## Compliance

The system is designed to meet SEC regulatory requirements:

**SEC Rule 204-2 (Books & Records):**
- 6-year retention of all advisory records
- Client agreements, IPS, Form ADV
- Complete transaction history
- Communication archives

**SEC Rule 206(4)-7 (Compliance Program):**
- Written policies and procedures
- Annual compliance review
- Chief Compliance Officer oversight

**Form ADV:**
- Annual filing support
- Client delivery tracking
- Material change detection

See [COMPLIANCE.md](./COMPLIANCE.md) for full compliance documentation.

## Deployment

### Staging

Merging to `develop` branch automatically deploys to staging:

```bash
git checkout develop
git merge feature/your-feature
git push origin develop
```

### Production

Merging to `main` branch triggers production deployment:

```bash
git checkout main
git merge develop
git push origin main
```

Production deployments require:
- All tests passing
- Security scan passing
- Two code reviews
- QA sign-off

## Monitoring & Logging

**Application Monitoring:**
- DataDog for APM
- Real-time performance metrics
- Error tracking with Sentry
- Uptime monitoring

**Logging:**
- Structured logging (JSON)
- ELK stack for log aggregation
- Log retention: 90 days in Elasticsearch, 1 year in S3

**Alerts:**
- PagerDuty for critical alerts
- Slack for non-critical notifications
- Email for compliance notifications

## Support

**For Development Questions:**
- Check existing documentation
- Ask in #engineering Slack channel
- Schedule office hours with tech lead

**For Production Issues:**
- Critical (P0): Page on-call engineer via PagerDuty
- High (P1): Create incident in Jira and notify #incidents
- Medium/Low: Create ticket in Jira

**For Security Issues:**
- Email: security@yourcompany.com
- Do NOT create public GitHub issues
- See [SECURITY.md](./SECURITY.md) for full process

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development workflow
- Code review standards
- Branch strategy (GitFlow)
- Commit message conventions
- Testing requirements
- Documentation standards

## License

Copyright © 2024 Your Company Name. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited.

## Team

**Product Owner:** [Name]  
**Technical Lead:** [Name]  
**Engineering Manager:** [Name]  
**Compliance Officer:** [Name]

## Roadmap

**Phase 1 - Foundation (Q1 2025):**
- ✅ Core household and account management
- ✅ User authentication and RBAC
- ✅ Basic compliance features
- 🔄 Document management

**Phase 2 - Investment Management (Q2 2025):**
- 📅 Portfolio construction
- 📅 Rebalancing engine
- 📅 Performance reporting
- 📅 Trade execution

**Phase 3 - Advanced Features (Q3 2025):**
- 📅 Tax optimization
- 📅 Client portal
- 📅 Mobile app
- 📅 Reporting dashboards

**Phase 4 - Integrations (Q4 2025):**
- 📅 Custodian data feeds
- 📅 CRM integrations (Salesforce, Redtail)
- 📅 Financial planning software
- 📅 Tax software integration

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

---

**Built with ❤️ by a team committed to excellence in wealth management technology.**
