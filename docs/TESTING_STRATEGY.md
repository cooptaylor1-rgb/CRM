# Testing Strategy - Wealth Management CRM

## Table of Contents
- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Compliance Testing](#compliance-testing)
- [Test Data Management](#test-data-management)
- [CI/CD Integration](#cicd-integration)

## Overview

This document outlines the comprehensive testing strategy for the Wealth Management CRM. Our testing approach ensures code quality, security, compliance, and reliability.

### Testing Goals

1. **Quality**: Catch bugs before production
2. **Confidence**: Deploy with confidence
3. **Documentation**: Tests serve as living documentation
4. **Regression Prevention**: Prevent reintroduction of bugs
5. **Compliance**: Verify regulatory requirements
6. **Security**: Identify vulnerabilities
7. **Performance**: Ensure acceptable response times

### Testing Principles

1. **Test Early, Test Often**: Shift left in development cycle
2. **Automate Everything**: Manual testing only for exploratory
3. **Test Pyramid**: More unit tests, fewer E2E tests
4. **Test in Production-Like Environment**: Staging mirrors production
5. **Fail Fast**: Quick feedback on test failures
6. **Maintainable Tests**: Keep tests simple and readable

## Testing Philosophy

### Testing Pyramid

```
        /\
       /  \
      / E2E \          ~10 tests
     /--------\        (Critical user journeys)
    /          \
   / Integration \     ~100 tests
  /--------------\     (API endpoints, DB operations)
 /                \
/   Unit Tests     \   ~1000 tests
--------------------   (Business logic, utilities)
```

### Test Coverage Goals

| Layer | Coverage Target | Current |
|-------|----------------|---------|
| Overall | 80% | - |
| Business Logic | 90% | - |
| Controllers | 80% | - |
| Services | 95% | - |
| Utilities | 100% | - |
| Critical Paths | 100% | - |

**Critical Paths:**
- Authentication and authorization
- Fee calculation
- Trade execution
- Account reconciliation
- Audit logging
- PII encryption/decryption

### Test Naming Convention

**Pattern:** `describe_what_scenario_expectedResult`

**Examples:**
```typescript
// Good
test('calculateQuarterlyFee_withFullQuarter_returnsCorrectAmount')
test('createHousehold_withDuplicateName_throwsConflictError')
test('authenticateUser_withExpiredToken_returns401')

// Bad
test('test1')
test('fee calculation')
test('it works')
```

## Unit Testing

### Scope
Test individual functions, methods, and classes in isolation.

### Framework
- **Backend**: Jest (with ts-jest)
- **Frontend**: Jest + React Testing Library

### What to Test

**Business Logic:**
```typescript
describe('FeeCalculationService', () => {
  describe('calculateQuarterlyFee', () => {
    it('should calculate correct fee for full quarter', () => {
      const service = new FeeCalculationService();
      const result = service.calculateQuarterlyFee(1000000, 0.01, 90);
      expect(result).toBeCloseTo(2500, 2);
    });

    it('should calculate prorated fee for partial quarter', () => {
      const service = new FeeCalculationService();
      const result = service.calculateQuarterlyFee(1000000, 0.01, 45);
      expect(result).toBeCloseTo(1250, 2);
    });

    it('should throw error for negative AUM', () => {
      const service = new FeeCalculationService();
      expect(() => {
        service.calculateQuarterlyFee(-1000, 0.01, 90);
      }).toThrow('AUM must be positive');
    });

    it('should handle zero AUM', () => {
      const service = new FeeCalculationService();
      const result = service.calculateQuarterlyFee(0, 0.01, 90);
      expect(result).toBe(0);
    });

    it('should apply tiered fee schedule correctly', () => {
      const service = new FeeCalculationService();
      const tiers = [
        { min: 0, max: 1000000, rate: 0.01 },
        { min: 1000000, max: Infinity, rate: 0.0075 }
      ];
      const result = service.calculateTieredFee(1500000, tiers, 90);
      expect(result).toBeCloseTo(3125, 2); // (1M * 0.01 / 4) + (500k * 0.0075 / 4)
    });
  });
});
```

**Validation Logic:**
```typescript
describe('PersonValidator', () => {
  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(PersonValidator.validateEmail('user@example.com')).toBe(true);
    });

    it('should reject email without @', () => {
      expect(PersonValidator.validateEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(PersonValidator.validateEmail('user@')).toBe(false);
    });

    it('should handle null', () => {
      expect(PersonValidator.validateEmail(null)).toBe(false);
    });
  });

  describe('validateSSN', () => {
    it('should accept valid SSN format', () => {
      expect(PersonValidator.validateSSN('123-45-6789')).toBe(true);
    });

    it('should reject invalid format', () => {
      expect(PersonValidator.validateSSN('123456789')).toBe(false);
      expect(PersonValidator.validateSSN('12-345-6789')).toBe(false);
    });

    it('should reject all zeros', () => {
      expect(PersonValidator.validateSSN('000-00-0000')).toBe(false);
    });
  });
});
```

**Data Transformations:**
```typescript
describe('CurrencyFormatter', () => {
  it('should format USD currency', () => {
    expect(CurrencyFormatter.format(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('should handle negative amounts', () => {
    expect(CurrencyFormatter.format(-1234.56, 'USD')).toBe('-$1,234.56');
  });

  it('should handle zero', () => {
    expect(CurrencyFormatter.format(0, 'USD')).toBe('$0.00');
  });

  it('should round to 2 decimal places', () => {
    expect(CurrencyFormatter.format(1234.567, 'USD')).toBe('$1,234.57');
  });
});
```

### Mocking

**Mock External Dependencies:**
```typescript
describe('HouseholdService', () => {
  let service: HouseholdService;
  let mockRepository: jest.Mocked<HouseholdRepository>;
  let mockAuditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockAuditService = {
      logEvent: jest.fn(),
    } as any;

    service = new HouseholdService(mockRepository, mockAuditService);
  });

  describe('updateStatus', () => {
    it('should update household status and log audit event', async () => {
      const household = { id: '123', status: 'PROSPECT' };
      mockRepository.findById.mockResolvedValue(household);
      mockRepository.save.mockResolvedValue({ ...household, status: 'ACTIVE' });

      const result = await service.updateStatus('123', 'ACTIVE', 'user-456');

      expect(result.status).toBe('ACTIVE');
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE' })
      );
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        entityType: 'household',
        entityId: '123',
        eventType: 'UPDATE',
        changes: { status: { old: 'PROSPECT', new: 'ACTIVE' } },
        userId: 'user-456'
      });
    });
  });
});
```

### Test Utilities

**Test Factories:**
```typescript
// test/factories/household.factory.ts
export class HouseholdFactory {
  static create(overrides?: Partial<Household>): Household {
    return {
      id: faker.datatype.uuid(),
      name: faker.company.name(),
      type: 'FAMILY',
      status: 'ACTIVE',
      primary_advisor_id: faker.datatype.uuid(),
      aum: 1000000,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  static createMany(count: number, overrides?: Partial<Household>): Household[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

// Usage
const household = HouseholdFactory.create({ status: 'PROSPECT' });
const households = HouseholdFactory.createMany(5);
```

## Integration Testing

### Scope
Test interactions between components, particularly API endpoints and database operations.

### Framework
- **Backend**: Jest + Supertest + Test Database
- **Frontend**: Jest + MSW (Mock Service Worker)

### API Endpoint Testing

```typescript
describe('Households API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testHousehold: Household;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup test user and get auth token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'Test123!@#' });
    authToken = response.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /households', () => {
    it('should create household with valid data', async () => {
      const createDto = {
        name: 'Test Family',
        type: 'FAMILY',
        status: 'PROSPECT',
        primary_advisor_id: 'user-123'
      };

      const response = await request(app.getHttpServer())
        .post('/households')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'Test Family',
        type: 'FAMILY',
        status: 'PROSPECT'
      });

      testHousehold = response.body;
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/households')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Family' }) // Missing type and status
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveLength(2);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/households')
        .send({ name: 'Test Family', type: 'FAMILY', status: 'PROSPECT' })
        .expect(401);
    });
  });

  describe('GET /households/:id', () => {
    it('should get household by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/households/${testHousehold.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testHousehold.id,
        name: testHousehold.name
      });
    });

    it('should return 404 for non-existent household', async () => {
      await request(app.getHttpServer())
        .get('/households/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /households/:id', () => {
    it('should update household status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/households/${testHousehold.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');

      // Verify audit log created
      const auditResponse = await request(app.getHttpServer())
        .get(`/audit-events?entity_id=${testHousehold.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(auditResponse.body.data).toContainEqual(
        expect.objectContaining({
          entity_type: 'household',
          event_type: 'UPDATE',
          changes: expect.objectContaining({
            status: { old: 'PROSPECT', new: 'ACTIVE' }
          })
        })
      );
    });
  });
});
```

### Database Integration Testing

```typescript
describe('HouseholdRepository', () => {
  let repository: HouseholdRepository;
  let connection: Connection;

  beforeAll(async () => {
    connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5433, // Test database
      database: 'crm_test',
      entities: [Household],
      synchronize: true,
    });
    repository = connection.getRepository(Household);
  });

  afterAll(async () => {
    await connection.close();
  });

  afterEach(async () => {
    await repository.clear(); // Clean up after each test
  });

  it('should save and retrieve household', async () => {
    const household = repository.create({
      name: 'Test Family',
      type: 'FAMILY',
      status: 'PROSPECT',
      primary_advisor_id: 'user-123'
    });

    const saved = await repository.save(household);
    expect(saved.id).toBeDefined();

    const retrieved = await repository.findOne(saved.id);
    expect(retrieved).toMatchObject({
      name: 'Test Family',
      type: 'FAMILY',
      status: 'PROSPECT'
    });
  });

  it('should enforce unique constraint on name', async () => {
    await repository.save({
      name: 'Duplicate Family',
      type: 'FAMILY',
      status: 'PROSPECT'
    });

    await expect(
      repository.save({
        name: 'Duplicate Family',
        type: 'FAMILY',
        status: 'PROSPECT'
      })
    ).rejects.toThrow();
  });

  it('should cascade delete related entities', async () => {
    const household = await repository.save({
      name: 'Test Family',
      type: 'FAMILY',
      status: 'PROSPECT'
    });

    // Add related account
    await connection.getRepository(Account).save({
      household_id: household.id,
      account_name: 'Test Account',
      account_type: 'BROKERAGE',
      custodian: 'SCHWAB'
    });

    await repository.delete(household.id);

    // Verify related account also deleted
    const accounts = await connection
      .getRepository(Account)
      .find({ household_id: household.id });
    expect(accounts).toHaveLength(0);
  });
});
```

## End-to-End Testing

### Scope
Test complete user workflows from UI through backend to database.

### Framework
- **Tool**: Playwright or Cypress
- **Browser**: Chromium, Firefox, Safari (cross-browser)

### Critical User Journeys

**Client Onboarding:**
```typescript
describe('Client Onboarding Flow', () => {
  test('should complete full onboarding process', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'advisor@firm.com');
    await page.fill('[data-testid="password"]', 'Test123!@#');
    await page.click('[data-testid="login-button"]');

    // Navigate to households
    await page.waitForNavigation();
    await page.click('[data-testid="nav-households"]');

    // Create new household
    await page.click('[data-testid="create-household-button"]');
    await page.fill('[data-testid="household-name"]', 'E2E Test Family');
    await page.selectOption('[data-testid="household-type"]', 'FAMILY');
    await page.selectOption('[data-testid="household-status"]', 'PROSPECT');
    await page.click('[data-testid="submit-button"]');

    // Verify household created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=E2E Test Family')).toBeVisible();

    // Add person to household
    const householdId = await page.getAttribute('[data-testid="household-id"]', 'value');
    await page.click('[data-testid="add-member-button"]');
    await page.fill('[data-testid="first-name"]', 'John');
    await page.fill('[data-testid="last-name"]', 'Smith');
    await page.fill('[data-testid="email"]', 'john@example.com');
    await page.selectOption('[data-testid="role"]', 'CLIENT');
    await page.check('[data-testid="primary-contact"]');
    await page.click('[data-testid="submit-button"]');

    // Verify person added
    await expect(page.locator('text=John Smith')).toBeVisible();

    // Create IPS
    await page.click('[data-testid="create-ips-button"]');
    await page.selectOption('[data-testid="risk-tolerance"]', 'MODERATE');
    await page.selectOption('[data-testid="investment-objective"]', 'GROWTH');
    await page.fill('[data-testid="time-horizon"]', '10');
    await page.click('[data-testid="submit-button"]');

    // Verify IPS created
    await expect(page.locator('[data-testid="ips-status"]')).toHaveText('Signed');

    // Open account
    await page.click('[data-testid="open-account-button"]');
    await page.fill('[data-testid="account-name"]', 'Joint Brokerage');
    await page.selectOption('[data-testid="account-type"]', 'JOINT');
    await page.selectOption('[data-testid="custodian"]', 'SCHWAB');
    await page.click('[data-testid="submit-button"]');

    // Verify account created
    await expect(page.locator('text=Joint Brokerage')).toBeVisible();
    await expect(page.locator('[data-testid="account-status"]')).toHaveText('PENDING');

    // Update household status to ACTIVE
    await page.click('[data-testid="edit-household-button"]');
    await page.selectOption('[data-testid="household-status"]', 'ACTIVE');
    await page.click('[data-testid="submit-button"]');

    // Verify status updated
    await expect(page.locator('[data-testid="household-status"]')).toHaveText('ACTIVE');
  });
});
```

**Investment Proposal and Trade Execution:**
```typescript
describe('Investment Proposal Flow', () => {
  test('should create proposal, get approval, and execute trades', async ({ page }) => {
    await loginAsAdvisor(page);
    await navigateToHousehold(page, ACTIVE_HOUSEHOLD_ID);

    // Create investment proposal
    await page.click('[data-testid="create-proposal-button"]');
    
    // Set target allocation
    await page.fill('[data-testid="us-equity"]', '60');
    await page.fill('[data-testid="intl-equity"]', '20');
    await page.fill('[data-testid="bonds"]', '15');
    await page.fill('[data-testid="cash"]', '5');

    // Add specific securities
    await page.click('[data-testid="add-security-button"]');
    await page.fill('[data-testid="symbol-search"]', 'VTI');
    await page.click('text=Vanguard Total Stock Market ETF');
    await page.fill('[data-testid="allocation"]', '40');

    // Submit proposal
    await page.click('[data-testid="submit-proposal-button"]');

    // Request approval
    await page.click('[data-testid="request-approval-button"]');

    // Login as supervisor and approve
    await logoutAndLoginAsSupervisor(page);
    await navigateToApprovalQueue(page);
    await page.click(`[data-testid="proposal-${proposalId}"]`);
    await page.click('[data-testid="approve-button"]');
    await page.fill('[data-testid="approval-notes"]', 'Approved - suitable for client');
    await page.click('[data-testid="confirm-approval-button"]');

    // Login back as advisor and execute
    await logoutAndLoginAsAdvisor(page);
    await navigateToProposal(page, proposalId);
    await page.click('[data-testid="execute-button"]');

    // Verify trades created
    await navigateToTrades(page);
    await expect(page.locator(`[data-testid="trade-proposal-${proposalId}"]`)).toBeVisible();

    // Verify positions updated (after trade settlement simulation)
    await simulateTradeSettlement(page, proposalId);
    await navigateToAccount(page, accountId);
    await expect(page.locator('text=VTI')).toBeVisible();
    await expect(page.locator('[data-testid="vti-allocation"]')).toHaveText('40%');
  });
});
```

## Performance Testing

### Scope
Ensure system meets performance requirements under various load conditions.

### Framework
- **Tool**: k6 or Artillery
- **Metrics**: Response time, throughput, error rate

### Performance Requirements

| Endpoint | Target Response Time (p95) | Target Throughput |
|----------|----------------------------|-------------------|
| GET /households | < 200ms | 100 req/sec |
| POST /households | < 500ms | 20 req/sec |
| GET /accounts/:id/positions | < 300ms | 50 req/sec |
| POST /trades | < 1000ms | 10 req/sec |

### Load Test Scenarios

**Baseline Load Test:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  const token = login();
  
  // Get households list
  let res = http.get('https://api.wealth-crm.com/v1/households', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  check(res, {
    'households status is 200': (r) => r.status === 200,
    'households response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);

  // Get specific household
  const householdId = res.json('data.0.id');
  res = http.get(`https://api.wealth-crm.com/v1/households/${householdId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  check(res, {
    'household detail status is 200': (r) => r.status === 200,
    'household detail response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(2);
}

function login() {
  const res = http.post('https://api.wealth-crm.com/v1/auth/login', {
    email: 'test@example.com',
    password: 'Test123!@#'
  });
  return res.json('accessToken');
}
```

**Stress Test:**
```javascript
export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 300 },
    { duration: '2m', target: 0 },
  ],
};
```

**Spike Test:**
```javascript
export let options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '30s', target: 500 }, // Sudden spike
    { duration: '1m', target: 500 },
    { duration: '10s', target: 50 },
  ],
};
```

### Database Performance Testing

**Query Performance:**
```sql
-- Households list query must complete < 50ms
EXPLAIN ANALYZE
SELECT h.id, h.name, h.status, h.aum, u.name as advisor_name
FROM households h
JOIN users u ON h.primary_advisor_id = u.id
WHERE h.status = 'ACTIVE'
ORDER BY h.aum DESC
LIMIT 20;

-- Account positions query must complete < 100ms
EXPLAIN ANALYZE
SELECT p.*, s.symbol, s.name, s.security_type
FROM positions p
JOIN securities s ON p.security_id = s.id
WHERE p.account_id = 'account-123';

-- Transaction history query must complete < 200ms
EXPLAIN ANALYZE
SELECT t.*, s.symbol
FROM transactions t
LEFT JOIN securities s ON t.security_id = s.id
WHERE t.account_id = 'account-123'
  AND t.transaction_date >= '2024-01-01'
ORDER BY t.transaction_date DESC;
```

## Security Testing

### Scope
Identify security vulnerabilities and ensure secure coding practices.

### Testing Types

#### 1. Static Application Security Testing (SAST)

**Tools:**
- SonarQube
- ESLint Security Plugin
- Semgrep

**Coverage:**
- SQL injection vulnerabilities
- XSS vulnerabilities
- Hardcoded secrets
- Insecure dependencies
- Authentication/authorization issues

#### 2. Dynamic Application Security Testing (DAST)

**Tools:**
- OWASP ZAP
- Burp Suite

**Tests:**
- Authentication bypass attempts
- Authorization checks
- Input validation
- Error handling
- Rate limiting

#### 3. Dependency Scanning

**Tools:**
- npm audit
- Snyk
- Dependabot

**Schedule:**
- Before each deployment
- Weekly automated scans
- Immediate scan on new dependency

#### 4. Penetration Testing

**Frequency:** Annual (minimum)

**Scope:**
- External penetration test (public-facing systems)
- Internal penetration test (internal network)
- Web application testing
- API security testing
- Social engineering assessment

### Security Test Cases

**Authentication Tests:**
```typescript
describe('Authentication Security', () => {
  test('should reject weak passwords', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: '12345' // Weak password
      });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('WEAK_PASSWORD');
  });

  test('should enforce rate limiting on login', async () => {
    // Attempt 6 logins in rapid succession
    for (let i = 0; i < 6; i++) {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'user@example.com', password: 'wrong' });
      
      if (i < 5) {
        expect(response.status).toBe(401);
      } else {
        expect(response.status).toBe(429); // Rate limit
      }
    }
  });

  test('should not leak user existence in forgot password', async () => {
    const validResponse = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'exists@example.com' });
    
    const invalidResponse = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'notexists@example.com' });
    
    // Both should return same response to prevent user enumeration
    expect(validResponse.status).toBe(200);
    expect(invalidResponse.status).toBe(200);
    expect(validResponse.body.message).toBe(invalidResponse.body.message);
  });
});
```

**Authorization Tests:**
```typescript
describe('Authorization Security', () => {
  test('should prevent horizontal privilege escalation', async () => {
    const user1Token = await getAuthToken('user1@example.com');
    const user2HouseholdId = await createHouseholdForUser2();

    // User 1 tries to access User 2's household
    const response = await request(app)
      .get(`/households/${user2HouseholdId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    
    expect(response.status).toBe(403);
  });

  test('should prevent vertical privilege escalation', async () => {
    const clientServiceToken = await getAuthToken('cs@example.com'); // Low privilege

    // Try to access admin endpoint
    const response = await request(app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${clientServiceToken}`);
    
    expect(response.status).toBe(403);
  });
});
```

**Input Validation Tests:**
```typescript
describe('Input Validation Security', () => {
  test('should prevent SQL injection', async () => {
    const response = await request(app)
      .get('/households')
      .query({ name: "'; DROP TABLE households; --" })
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(response.status).not.toBe(500);
    // Verify households table still exists
    const verifyResponse = await request(app)
      .get('/households')
      .set('Authorization', `Bearer ${validToken}`);
    expect(verifyResponse.status).toBe(200);
  });

  test('should prevent XSS in output', async () => {
    const maliciousName = '<script>alert("XSS")</script>';
    const household = await createHousehold({ name: maliciousName });

    const response = await request(app)
      .get(`/households/${household.id}`)
      .set('Authorization', `Bearer ${validToken}`);
    
    // Output should be HTML encoded
    expect(response.body.name).not.toContain('<script>');
    expect(response.body.name).toContain('&lt;script&gt;');
  });
});
```

## Compliance Testing

### Scope
Verify regulatory requirements are met.

### Compliance Test Checklist

#### Audit Trail Tests
```typescript
describe('Audit Trail Compliance', () => {
  test('should log all PII access', async () => {
    const personId = 'person-123';
    
    // Access SSN
    await request(app)
      .get(`/persons/${personId}/ssn`)
      .set('Authorization', `Bearer ${validToken}`);
    
    // Verify audit log
    const auditLogs = await AuditEvent.find({
      entity_type: 'person',
      entity_id: personId,
      action: 'VIEW_SSN'
    });
    
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].user_id).toBe(currentUserId);
  });

  test('should log all data modifications with before/after', async () => {
    const household = await createTestHousehold({ status: 'PROSPECT' });
    
    await request(app)
      .patch(`/households/${household.id}`)
      .send({ status: 'ACTIVE' })
      .set('Authorization', `Bearer ${validToken}`);
    
    const auditLog = await AuditEvent.findOne({
      entity_type: 'household',
      entity_id: household.id,
      event_type: 'UPDATE'
    });
    
    expect(auditLog.changes).toEqual({
      status: { old: 'PROSPECT', new: 'ACTIVE' }
    });
  });
});
```

#### Document Retention Tests
```typescript
describe('Document Retention Compliance', () => {
  test('should calculate retention correctly for advisory agreement', () => {
    const uploadDate = new Date('2024-01-01');
    const terminationDate = new Date('2025-01-01');
    
    const doc = new Document({
      document_type: 'CLIENT_AGREEMENT',
      uploaded_at: uploadDate,
      household: { termination_date: terminationDate }
    });
    
    const retentionUntil = doc.calculateRetentionDate();
    const expected = new Date('2031-01-01'); // 6 years after termination
    
    expect(retentionUntil).toEqual(expected);
  });

  test('should prevent deletion of documents in retention period', async () => {
    const doc = await createDocument({
      document_type: 'CLIENT_AGREEMENT',
      retention_until: addYears(new Date(), 5) // 5 years from now
    });
    
    const response = await request(app)
      .delete(`/documents/${doc.id}`)
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('RETENTION_PERIOD_ACTIVE');
  });
});
```

#### Fee Calculation Tests
```typescript
describe('Fee Calculation Compliance', () => {
  test('should calculate fees accurately per agreement', () => {
    const account = {
      market_value: 1000000,
      fee_percentage: 0.01, // 1%
      billing_frequency: 'QUARTERLY'
    };
    
    const fee = calculateFee(account);
    expect(fee).toBeCloseTo(2500, 2); // 1% / 4 quarters
  });

  test('should apply tiered fees correctly', () => {
    const account = {
      market_value: 5000000,
      fee_schedule: [
        { min: 0, max: 1000000, rate: 0.01 },
        { min: 1000000, max: 5000000, rate: 0.0075 },
        { min: 5000000, max: Infinity, rate: 0.005 }
      ]
    };
    
    const fee = calculateTieredFee(account);
    // (1M * 1%) + (4M * 0.75%) = $10k + $30k = $40k annual / 4 = $10k quarterly
    expect(fee).toBeCloseTo(10000, 2);
  });

  test('should never overbill client', () => {
    // Test various scenarios
    const scenarios = generateFeeTestScenarios();
    
    scenarios.forEach(scenario => {
      const calculatedFee = calculateFee(scenario.account);
      const expectedFee = scenario.expectedFee;
      
      expect(calculatedFee).toBeLessThanOrEqual(expectedFee);
    });
  });
});
```

## Test Data Management

### Test Data Strategy

**Isolation:**
- Each test creates its own data
- Tests clean up after themselves
- No shared state between tests

**Realistic Data:**
- Use factories with realistic values
- Mirror production data structure
- Include edge cases

**PII in Tests:**
- No real PII in test data
- Use faker.js for generated data
- Obvious test data (e.g., "Test Family")

### Test Database

**Separate Database:**
```
crm_development  # Local development
crm_test        # Automated tests
crm_staging     # Integration testing
crm_production  # Production
```

**Setup:**
```bash
# Before tests
npm run db:test:setup    # Create test database
npm run db:test:migrate  # Run migrations
npm run db:test:seed     # Seed test data

# After tests
npm run db:test:teardown # Drop test database
```

### Test Fixtures

```typescript
// test/fixtures/households.ts
export const TEST_HOUSEHOLDS = {
  prospectFamily: {
    name: 'Test Prospect Family',
    type: 'FAMILY',
    status: 'PROSPECT',
    primary_advisor_id: 'test-advisor-1'
  },
  activeFamily: {
    name: 'Test Active Family',
    type: 'FAMILY',
    status: 'ACTIVE',
    primary_advisor_id: 'test-advisor-1',
    aum: 1000000
  },
  trust: {
    name: 'Test Family Trust',
    type: 'TRUST',
    status: 'ACTIVE',
    primary_advisor_id: 'test-advisor-1',
    aum: 5000000
  }
};
```

## CI/CD Integration

### Pipeline Stages

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run lint

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:cov
      - uses: codecov/codecov-action@v2

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:integration

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm audit
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:e2e

  deploy-staging:
    needs: [lint, unit-tests, integration-tests, security-scan]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm run deploy:staging

  deploy-production:
    needs: [lint, unit-tests, integration-tests, security-scan, e2e-tests]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm run deploy:production
```

### Test Reporting

**Coverage Reports:**
- Codecov integration
- Coverage badge in README
- Fail build if coverage drops below 80%

**Test Results:**
- JUnit XML format
- Uploaded to CI/CD platform
- Historical tracking

**Performance Tracking:**
- Track test execution time
- Alert on slow tests (> 1s for unit tests)
- Optimize or split slow tests

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-22  
**Owner**: Engineering Team  
**Review Cycle**: Quarterly
