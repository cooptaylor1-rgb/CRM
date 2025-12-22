# Contributing to Wealth Management CRM

Thank you for your interest in contributing to the Wealth Management CRM! This document provides guidelines and standards for contributing to this project.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Branch Strategy](#branch-strategy)
5. [Commit Message Conventions](#commit-message-conventions)
6. [Code Review Standards](#code-review-standards)
7. [Testing Requirements](#testing-requirements)
8. [Documentation Standards](#documentation-standards)
9. [Pull Request Process](#pull-request-process)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Be respectful and professional
- Accept constructive criticism gracefully
- Focus on what's best for the project and clients
- Show empathy towards other community members
- Maintain confidentiality of sensitive information

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks or trolling
- Public or private harassment
- Publishing private information without permission
- Other conduct inappropriate in a professional setting

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **PostgreSQL**: v15 or higher
- **Git**: v2.40 or higher
- **Docker**: Latest stable version (for local development)
- **Code Editor**: VS Code recommended (with ESLint and Prettier extensions)

### Initial Setup

1. **Fork the Repository**:
   ```bash
   # Fork via GitHub UI, then clone your fork
   git clone https://github.com/YOUR_USERNAME/CRM.git
   cd CRM
   ```

2. **Add Upstream Remote**:
   ```bash
   git remote add upstream https://github.com/cooptaylor1-rgb/CRM.git
   ```

3. **Install Dependencies**:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

4. **Set Up Environment**:
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your local configuration
   
   # Frontend
   cd ../frontend
   cp .env.example .env.local
   # Edit .env.local with your local configuration
   ```

5. **Start Database**:
   ```bash
   docker-compose up -d postgres redis
   ```

6. **Run Migrations**:
   ```bash
   cd backend
   npm run migration:run
   npm run seed:dev
   ```

7. **Start Development Servers**:
   ```bash
   # Backend (in one terminal)
   cd backend
   npm run start:dev
   
   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

8. **Verify Setup**:
   - Backend: http://localhost:3000
   - Frontend: http://localhost:3001
   - API Docs: http://localhost:3000/api/docs

## Development Workflow

### GitFlow Workflow

We use GitFlow as our branching strategy:

```
main (production-ready code)
  ↑
develop (integration branch)
  ↑
feature/* (new features)
hotfix/* (urgent production fixes)
release/* (release preparation)
```

### Working on a Feature

1. **Sync with Upstream**:
   ```bash
   git checkout develop
   git fetch upstream
   git merge upstream/develop
   git push origin develop
   ```

2. **Create Feature Branch**:
   ```bash
   git checkout -b feature/short-description
   # Example: feature/household-search
   ```

3. **Make Changes**:
   - Write code following our standards
   - Write tests for new functionality
   - Update documentation as needed
   - Commit regularly with meaningful messages

4. **Keep Branch Updated**:
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

5. **Push Changes**:
   ```bash
   git push origin feature/short-description
   ```

6. **Create Pull Request**:
   - Use PR template (auto-populated)
   - Fill in all sections
   - Link related issues
   - Request reviewers

## Branch Strategy

### Branch Types

#### Main Branches

**`main`**:
- Production-ready code only
- Tagged with version numbers
- Protected branch (no direct commits)
- Requires PR approval and passing CI

**`develop`**:
- Integration branch for features
- Should always be in deployable state
- Protected branch (no direct commits)
- All features merge here first

#### Supporting Branches

**`feature/*`**:
- New features or enhancements
- Branch from: `develop`
- Merge back to: `develop`
- Naming: `feature/issue-number-short-description`
- Example: `feature/123-account-filtering`

**`bugfix/*`**:
- Bug fixes for develop branch
- Branch from: `develop`
- Merge back to: `develop`
- Naming: `bugfix/issue-number-short-description`
- Example: `bugfix/456-household-validation`

**`hotfix/*`**:
- Urgent production fixes
- Branch from: `main`
- Merge back to: `main` AND `develop`
- Naming: `hotfix/issue-number-short-description`
- Example: `hotfix/789-security-vulnerability`

**`release/*`**:
- Release preparation
- Branch from: `develop`
- Merge back to: `main` AND `develop`
- Naming: `release/version-number`
- Example: `release/1.2.0`

### Branch Naming Conventions

```
Type        Format                           Example
────────────────────────────────────────────────────────────────
Feature     feature/[issue]-[description]    feature/123-client-search
Bugfix      bugfix/[issue]-[description]     bugfix/456-date-validation
Hotfix      hotfix/[issue]-[description]     hotfix/789-auth-bypass
Release     release/[version]                release/1.2.0
Docs        docs/[description]               docs/api-documentation
```

## Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of:

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes
- **ci**: CI/CD configuration changes
- **revert**: Revert a previous commit

### Scope

The scope should specify the area of change:

- **households**: Household module
- **accounts**: Account module
- **auth**: Authentication/Authorization
- **compliance**: Compliance module
- **audit**: Audit module
- **api**: API changes
- **ui**: UI/Frontend changes
- **db**: Database changes
- **deps**: Dependency updates

### Subject

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Maximum 50 characters

### Body (Optional)

- Explain what and why, not how
- Wrap at 72 characters
- Separate from subject with blank line

### Footer (Optional)

- Reference issues: `Closes #123` or `Refs #456`
- Note breaking changes: `BREAKING CHANGE: description`

### Examples

**Simple commit**:
```
feat(households): add search by tax ID

Implements encrypted search capability for household tax IDs
with proper audit logging.

Closes #123
```

**Breaking change**:
```
refactor(api)!: change authentication endpoint structure

BREAKING CHANGE: /auth/login endpoint now returns different
response structure with separate access and refresh tokens.

Migration guide available in docs/migrations/auth-v2.md

Refs #456
```

**Bug fix**:
```
fix(accounts): correct fee calculation rounding

Fixed issue where fee calculations could be off by 1 cent
due to improper rounding. Now uses banker's rounding per
accounting standards.

Fixes #789
```

**Documentation**:
```
docs(api): update authentication flow diagram

Added sequence diagram for OAuth2 flow and clarified
token refresh process.
```

## Code Review Standards

### Review Process

1. **Self-Review First**:
   - Review your own PR before requesting reviewers
   - Check diff for unintended changes
   - Verify tests pass locally
   - Run linter and fix issues

2. **Assign Reviewers**:
   - Minimum 2 reviewers required
   - At least 1 senior developer
   - Compliance review for sensitive changes

3. **Review Timeline**:
   - First review within 1 business day
   - Address feedback within 1 business day
   - Follow-up reviews within 4 hours

4. **Approval Requirements**:
   - 2 approvals minimum
   - All conversations resolved
   - All CI checks passing
   - No merge conflicts

### What Reviewers Check

#### Code Quality

- [ ] Follows TypeScript best practices
- [ ] Proper error handling
- [ ] No hardcoded values (use config)
- [ ] No commented-out code
- [ ] No console.log statements (use logger)
- [ ] Proper type safety (no `any` types)
- [ ] DRY principle followed
- [ ] SOLID principles applied

#### Security

- [ ] Input validation implemented
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] Authentication required where needed
- [ ] Authorization checks in place
- [ ] No sensitive data in logs
- [ ] Secrets not in code
- [ ] PII properly encrypted

#### Performance

- [ ] No N+1 query problems
- [ ] Proper indexing considered
- [ ] Caching used where appropriate
- [ ] No unnecessary database queries
- [ ] Pagination implemented for lists
- [ ] Memory leaks prevented

#### Testing

- [ ] Unit tests for new functions
- [ ] Integration tests for API endpoints
- [ ] Edge cases covered
- [ ] Error cases tested
- [ ] Test coverage maintained (>80%)
- [ ] Tests are deterministic (no flakiness)

#### Documentation

- [ ] JSDoc comments for public functions
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Migration guide for breaking changes
- [ ] Inline comments for complex logic

#### Compliance

- [ ] Audit logging for sensitive operations
- [ ] Retention policies followed
- [ ] PII handling per standards
- [ ] Regulatory requirements met
- [ ] No compliance violations introduced

### Review Comments

**Types of Comments**:

- **MUST FIX**: Blocking issues (security, bugs, violations)
- **SHOULD FIX**: Important improvements (performance, maintainability)
- **CONSIDER**: Suggestions (style, alternative approaches)
- **NIT**: Minor nitpicks (formatting, naming)
- **QUESTION**: Clarification needed
- **PRAISE**: Positive feedback

**Comment Format**:
```
[TYPE] Description

Reasoning and details...

Suggestion or example code if applicable
```

**Example**:
```
[MUST FIX] Missing authorization check

This endpoint allows any authenticated user to access any household.
Need to verify user has permission to access this specific household.

Suggested fix:
```typescript
if (!user.canAccessHousehold(householdId)) {
  throw new ForbiddenException();
}
```
```

### Addressing Feedback

**Do**:
- Respond to all comments
- Ask for clarification if unclear
- Explain your reasoning if disagreeing
- Thank reviewers for feedback
- Mark conversations as resolved when addressed

**Don't**:
- Take feedback personally
- Argue defensively
- Ignore feedback
- Make unrelated changes in feedback commits

## Testing Requirements

### Test Coverage Goals

- **Overall Coverage**: Minimum 80%
- **Critical Paths**: 100% coverage required
  - Authentication flows
  - Authorization checks
  - Financial calculations
  - Compliance workflows
  - Audit logging

### Test Types

#### Unit Tests

**Purpose**: Test individual functions in isolation

**Location**: `*.spec.ts` files next to source

**Framework**: Jest

**Requirements**:
- Test pure functions thoroughly
- Mock external dependencies
- Test edge cases and error conditions
- Fast execution (<100ms per test)

**Example**:
```typescript
// fee-calculator.spec.ts
describe('FeeCalculator', () => {
  describe('calculateQuarterlyFee', () => {
    it('should calculate correct fee for standard account', () => {
      const calculator = new FeeCalculator();
      const fee = calculator.calculateQuarterlyFee(100000, 0.01);
      expect(fee).toBe(250); // $100k * 1% / 4
    });
    
    it('should throw error for negative balance', () => {
      const calculator = new FeeCalculator();
      expect(() => calculator.calculateQuarterlyFee(-1000, 0.01))
        .toThrow('Balance cannot be negative');
    });
    
    it('should round to 2 decimal places', () => {
      const calculator = new FeeCalculator();
      const fee = calculator.calculateQuarterlyFee(100001, 0.01);
      expect(fee).toBe(250.00);
    });
  });
});
```

#### Integration Tests

**Purpose**: Test interactions between components

**Location**: `test/integration/*.spec.ts`

**Framework**: Jest + Supertest

**Requirements**:
- Test complete workflows
- Use test database
- Clean up after each test
- Test realistic scenarios

**Example**:
```typescript
// household-api.integration.spec.ts
describe('Household API (Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  
  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getAuthToken(app);
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('POST /households', () => {
    it('should create household with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/households')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Smith Family',
          advisorId: 'adviser-123'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Smith Family');
      
      // Verify audit log created
      const auditLog = await getAuditLog('household.create', response.body.id);
      expect(auditLog).toBeDefined();
    });
  });
});
```

#### E2E Tests

**Purpose**: Test complete user workflows

**Location**: `test/e2e/*.spec.ts`

**Framework**: Jest + Playwright

**Requirements**:
- Test from UI through to database
- Use realistic user flows
- Test critical business processes
- Can be slower (minutes acceptable)

**Example**:
```typescript
// client-onboarding.e2e.spec.ts
describe('Client Onboarding (E2E)', () => {
  it('should complete full onboarding workflow', async () => {
    // Login
    await page.goto('http://localhost:3001');
    await page.fill('[name=email]', 'adviser@firm.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');
    
    // Create household
    await page.click('text=New Household');
    await page.fill('[name=name]', 'Johnson Family');
    await page.click('text=Save');
    
    // Add client
    await page.click('text=Add Person');
    await page.fill('[name=firstName]', 'John');
    await page.fill('[name=lastName]', 'Johnson');
    await page.fill('[name=email]', 'john@example.com');
    await page.click('text=Save');
    
    // Verify created
    expect(await page.textContent('h1')).toContain('Johnson Family');
  });
});
```

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

### Test Data

**Use Test Fixtures**:
```typescript
// fixtures/household.fixture.ts
export const mockHousehold = {
  id: 'hh-test-123',
  name: 'Test Household',
  advisorId: 'adv-test-456',
  riskTolerance: 'moderate',
  status: 'active'
};

export function createTestHousehold(overrides = {}) {
  return {
    ...mockHousehold,
    ...overrides,
    id: `hh-test-${Date.now()}`
  };
}
```

**Use Test Builders**:
```typescript
// builders/household.builder.ts
export class HouseholdBuilder {
  private household: Partial<Household> = {
    status: 'active',
    riskTolerance: 'moderate'
  };
  
  withName(name: string): this {
    this.household.name = name;
    return this;
  }
  
  withAdvisor(advisorId: string): this {
    this.household.advisorId = advisorId;
    return this;
  }
  
  build(): Household {
    return this.household as Household;
  }
}

// Usage
const household = new HouseholdBuilder()
  .withName('Test Family')
  .withAdvisor('adv-123')
  .build();
```

## Documentation Standards

### Code Documentation

#### TypeScript Interfaces

```typescript
/**
 * Represents a household entity in the CRM system.
 * A household groups related persons and accounts for management purposes.
 */
export interface Household {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Display name for the household */
  name: string;
  
  /** Reference to the primary adviser */
  advisorId: string;
  
  /** Client's risk tolerance level */
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  
  /** Current status of the household */
  status: 'prospect' | 'active' | 'inactive' | 'closed';
  
  /** Total assets under management (calculated field) */
  totalAum: number;
}
```

#### Function Documentation

```typescript
/**
 * Calculates the quarterly advisory fee for an account.
 * 
 * Fee is calculated as: (accountValue * annualRate) / 4
 * Result is rounded to 2 decimal places using banker's rounding.
 * 
 * @param accountValue - The current account value in dollars
 * @param annualRate - The annual fee rate as a decimal (e.g., 0.01 for 1%)
 * @returns The quarterly fee amount
 * 
 * @throws {ValidationError} If accountValue is negative
 * @throws {ValidationError} If annualRate is not between 0 and 1
 * 
 * @example
 * ```typescript
 * const fee = calculateQuarterlyFee(100000, 0.01);
 * // Returns: 250.00
 * ```
 */
export function calculateQuarterlyFee(
  accountValue: number,
  annualRate: number
): number {
  // Implementation...
}
```

#### Class Documentation

```typescript
/**
 * Service for managing household entities.
 * 
 * Provides CRUD operations, relationship management, and business logic
 * for household entities. All operations are audited and require proper
 * authorization.
 * 
 * @remarks
 * This service enforces data-level security ensuring users can only
 * access households they are authorized to view.
 */
@Injectable()
export class HouseholdService {
  /**
   * Creates a new household.
   * 
   * @param createDto - Household creation data
   * @param user - The user creating the household
   * @returns The created household entity
   * 
   * @throws {ForbiddenException} If user lacks permission
   * @throws {ValidationException} If data is invalid
   */
  async create(
    createDto: CreateHouseholdDto,
    user: User
  ): Promise<Household> {
    // Implementation...
  }
}
```

### API Documentation

Use OpenAPI/Swagger decorators:

```typescript
@ApiTags('households')
@Controller('households')
export class HouseholdController {
  @Post()
  @ApiOperation({ summary: 'Create a new household' })
  @ApiResponse({ 
    status: 201, 
    description: 'Household created successfully',
    type: Household 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Insufficient permissions' 
  })
  @ApiBearerAuth()
  async create(
    @Body() createDto: CreateHouseholdDto,
    @CurrentUser() user: User
  ): Promise<Household> {
    return this.householdService.create(createDto, user);
  }
}
```

### README Files

Each module should have a README:

```markdown
# Household Module

## Overview
Brief description of what the module does.

## Features
- Feature 1
- Feature 2

## Architecture
Description of module structure.

## API Endpoints
List of available endpoints.

## Database Schema
Tables and relationships.

## Business Rules
Important business logic.

## Testing
How to test this module.

## Dependencies
Other modules this depends on.
```

## Pull Request Process

### PR Template

When creating a PR, fill out the template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Changes Made
- Change 1
- Change 2

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
- [ ] Coverage maintained

## Screenshots (if applicable)
[Add screenshots here]

## Additional Notes
Any additional context
```

### PR Size Guidelines

- **Small**: <200 lines changed (preferred)
- **Medium**: 200-500 lines changed
- **Large**: >500 lines changed (should be split if possible)

**Tips**:
- Break large features into smaller PRs
- Submit refactoring separately from features
- Update documentation in separate PRs

### Merge Strategy

We use **Squash and Merge**:
- All commits squashed into single commit
- Commit message = PR title
- Keeps main/develop history clean
- Preserves full history in PR

## Questions or Issues?

- **Technical Questions**: Ask in #engineering Slack channel
- **Process Questions**: Ask your team lead
- **Security Concerns**: Email security@firm.com
- **Compliance Questions**: Ask CCO or compliance team

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Owner**: Engineering Team  
**Classification**: Internal Use Only
