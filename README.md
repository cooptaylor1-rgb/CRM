# Wealth Management CRM

> Enterprise-grade Customer Relationship Management system for SEC-registered investment advisers

[![CI/CD](https://github.com/cooptaylor1-rgb/CRM/actions/workflows/ci.yml/badge.svg)](https://github.com/cooptaylor1-rgb/CRM/actions/workflows/ci.yml)
[![Security Scan](https://github.com/cooptaylor1-rgb/CRM/actions/workflows/security-scan.yml/badge.svg)](https://github.com/cooptaylor1-rgb/CRM/actions/workflows/security-scan.yml)
[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Development](#development)
- [Documentation](#documentation)
- [Security](#security)
- [Compliance](#compliance)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Wealth Management CRM is a comprehensive, enterprise-grade system designed specifically for SEC-registered investment advisers. Built with compliance-first architecture, it provides complete household management, account tracking, compliance workflows, and audit capabilities required for fiduciary investment management.

### Vision

To provide investment advisers with a world-class CRM that not only manages client relationships but also ensures regulatory compliance, maintains comprehensive audit trails, and supports fiduciary duty documentation — all while delivering an exceptional user experience.

### Objectives

- **Regulatory Compliance**: Full adherence to SEC Rule 204-2 and other regulations
- **Fiduciary Support**: Tools to demonstrate and fulfill fiduciary duty
- **Audit Readiness**: Complete, immutable audit trails for regulatory examinations
- **Security First**: Enterprise-grade security with encryption and RBAC
- **Scalability**: Support firms from single adviser to multi-office RIAs

## ✨ Key Features

### Client Management
- **Household Grouping**: Organize related persons and accounts
- **Comprehensive Profiles**: Track all client information with KYC/AML
- **Entity Management**: Support for trusts, corporations, LLCs, etc.
- **Relationship Mapping**: Complex family and entity relationships

### Account Management
- **Multi-Account Support**: All major account types (Individual, IRA, Trust, etc.)
- **Real-Time Positions**: Current holdings and valuations
- **Transaction Tracking**: Complete transaction history with audit trails
- **Performance Reporting**: Portfolio performance vs benchmarks

### Compliance & Supervision
- **Pre-Trade Review**: Compliance approval workflows
- **Post-Trade Surveillance**: Automated monitoring
- **Quarterly Reviews**: Systematic household reviews
- **KYC/AML**: Comprehensive verification workflows
- **Document Retention**: Automated retention policies

### Audit & Reporting
- **Immutable Audit Trail**: Every action logged
- **Exam Preparation**: Pre-built reports for SEC exams
- **Communication Logs**: All client interactions archived
- **Retention Management**: Automated 6-7 year retention

### Security
- **Field-Level Encryption**: PII encrypted (SSN, EIN, Tax IDs)
- **Role-Based Access**: Granular permissions
- **Multi-Factor Auth**: TOTP-based MFA
- **Session Management**: Secure session handling

## 🏗 Architecture

The system follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (Next.js + React)                         │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/REST API
┌───────────────────────▼─────────────────────────────────────┐
│                         Backend                              │
│                    (NestJS + TypeScript)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Households│  │ Accounts │  │Compliance│  │   Audit  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼────┐  ┌──────▼─────┐  ┌─────▼────┐
│ PostgreSQL │  │   Redis    │  │  AWS S3  │
│  (Primary) │  │   (Cache)  │  │  (Docs)  │
└────────────┘  └────────────┘  └──────────┘
```

### Technology Stack

**Backend**:
- NestJS (Node.js framework)
- TypeScript
- TypeORM (PostgreSQL)
- JWT Authentication
- Passport.js

**Frontend**:
- Next.js 14
- React 18
- Tailwind CSS
- React Query
- Zustand

**Database**:
- PostgreSQL 15+
- Redis (caching)

**Infrastructure**:
- Docker
- Kubernetes
- Terraform
- GitHub Actions

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- Docker (optional, for containerized development)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/cooptaylor1-rgb/CRM.git
cd CRM
```

2. **Using Docker** (Recommended):
```bash
cd infrastructure/docker
docker-compose up -d
```

3. **Manual Setup**:

**Backend**:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run migration:run
npm run seed:dev
npm run start:dev
```

**Frontend**:
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with API URL
npm run dev
```

4. **Access the application**:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs

### Default Credentials

**Admin User** (development only):
- Email: `admin@crm.local`
- Password: `admin123` (change immediately)

## 💻 Development

### Project Structure

```
CRM/
├── backend/             # NestJS backend application
│   ├── src/
│   │   ├── modules/     # Feature modules
│   │   ├── common/      # Shared utilities
│   │   ├── config/      # Configuration
│   │   └── database/    # Migrations & seeds
│   └── test/            # Tests
├── frontend/            # Next.js frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Next.js pages
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   └── store/       # State management
│   └── public/          # Static assets
├── database/            # Database schemas
├── infrastructure/      # Infrastructure as Code
│   ├── docker/          # Docker configs
│   ├── terraform/       # Terraform configs
│   └── k8s/             # Kubernetes manifests
├── docs/                # Additional documentation
└── .github/             # GitHub workflows

```

### Development Workflow

1. **Create a feature branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and test**:
```bash
# Backend
cd backend
npm test
npm run lint

# Frontend
cd frontend
npm test
npm run lint
```

3. **Commit with conventional commits**:
```bash
git commit -m "feat(households): add search functionality"
```

4. **Push and create PR**:
```bash
git push origin feature/your-feature-name
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Running Tests

**Backend**:
```bash
cd backend
npm test                 # Unit tests
npm run test:e2e         # E2E tests
npm run test:cov         # Coverage report
```

**Frontend**:
```bash
cd frontend
npm test                 # Unit tests
npm run test:coverage    # Coverage report
```

### Database Migrations

```bash
cd backend
npm run migration:generate -- MigrationName
npm run migration:run
npm run migration:revert  # If needed
```

## 📚 Documentation

Comprehensive documentation is available in the following files:

### Core Documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design
- **[SECURITY.md](./SECURITY.md)** - Security policies and procedures
- **[COMPLIANCE.md](./COMPLIANCE.md)** - Regulatory compliance requirements
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development guidelines

### Extended Documentation
- **[docs/DOMAIN_MODEL.md](./docs/DOMAIN_MODEL.md)** - Entity relationships and data model
- **[docs/API_DESIGN.md](./docs/API_DESIGN.md)** - API conventions and standards
- **[docs/WORKFLOWS.md](./docs/WORKFLOWS.md)** - Business process workflows
- **[docs/TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md)** - Testing approach and standards

### Technical Documentation
- **[database/README.md](./database/README.md)** - Database schema and operations

## 🔒 Security

Security is paramount in a system handling sensitive financial data. Key security measures include:

- **Encryption**: AES-256-GCM for PII, TLS 1.3 for transport
- **Authentication**: JWT tokens with refresh rotation
- **Authorization**: Role-based access control (RBAC)
- **MFA**: TOTP-based multi-factor authentication
- **Audit Logging**: Comprehensive, immutable audit trails
- **Security Scanning**: Automated dependency and code scanning

For complete security documentation, see [SECURITY.md](./SECURITY.md).

### Reporting Security Issues

Please report security vulnerabilities to security@firm.com. Do not create public GitHub issues for security vulnerabilities.

## ⚖️ Compliance

This system is designed to meet SEC regulatory requirements for investment advisers:

- **SEC Rule 204-2**: Books and records requirements
- **SEC Rule 206(4)-7**: Compliance program requirements
- **Regulation S-P**: Privacy and safeguarding
- **Form ADV**: Advisory disclosures
- **Data Retention**: 6-7 year retention policies

For complete compliance documentation, see [COMPLIANCE.md](./COMPLIANCE.md).

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Code of conduct
- Development workflow
- Commit message conventions
- Testing requirements
- Code review process

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

Copyright © 2024 World-Class Wealth Management. All rights reserved.

## 📞 Support

- **Documentation**: See [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/cooptaylor1-rgb/CRM/issues)
- **Discussions**: [GitHub Discussions](https://github.com/cooptaylor1-rgb/CRM/discussions)

## 🙏 Acknowledgments

Built with modern technologies and best practices:
- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [TypeScript](https://www.typescriptlang.org/) - Language

---

**Status**: 🚧 In Development  
**Version**: 1.0.0-alpha  
**Last Updated**: 2024-01-15
