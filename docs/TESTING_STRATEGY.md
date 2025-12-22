# Testing Strategy - Wealth Management CRM

## Table of Contents
1. [Overview](#overview)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)
7. [Compliance Testing](#compliance-testing)

## Overview

### Testing Pyramid

```
          /\
         /  \
        / E2E \
       /--------\
      /          \
     / Integration \
    /--------------\
   /                \
  /   Unit Tests     \
 /--------------------\
```

**Distribution**:
- **Unit Tests**: 70% - Fast, isolated, many
- **Integration Tests**: 20% - Medium speed, component interaction
- **E2E Tests**: 10% - Slow, full workflow, few

### Coverage Goals

| Test Type | Coverage Target | Execution Time |
|-----------|----------------|----------------|
| Unit | 80% minimum | <5 minutes |
| Integration | Critical paths | <15 minutes |
| E2E | Key workflows | <30 minutes |
| **Total** | **80%+ overall** | **<50 minutes** |

### Testing Principles

1. **Fast Feedback**: Unit tests run on every commit
2. **Reliable**: Tests are deterministic, no flakiness
3. **Maintainable**: Clear test names, DRY principles
4. **Comprehensive**: Cover happy paths and edge cases
5. **Isolated**: Tests don't depend on each other
6. **Automated**: CI/CD integration

## Unit Testing

### Scope

Test individual functions and methods in isolation.

### Framework

- **Backend**: Jest
- **Frontend**: Jest + React Testing Library

### Best Practices

#### 1. Test Structure

```typescript
describe('Component/Service Name', () => {
  describe('methodName', () => {
    it('should do expected behavior when condition', () => {
      // Arrange
      const input = createTestInput();
      
      // Act
      const result = methodUnderTest(input);
      
      // Assert
      expect(result).toBe(expectedOutput);
    });
    
    it('should throw error when invalid input', () => {
      expect(() => methodUnderTest(invalid)).toThrow(ErrorType);
    });
  });
});
```

#### 2. Test Naming

**Format**: `should [expected behavior] when [condition]`

**Examples**:
```typescript
it('should calculate fee correctly when balance is positive')
it('should throw error when balance is negative')
it('should return empty array when no results found')
it('should call audit log when household created')
```

#### 3. Mocking Dependencies

```typescript
// Mock repository
const mockHouseholdRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
};

// Mock service
jest.mock('./audit.service');
const mockAuditService = mocked(AuditService);

// Use in test
describe('HouseholdService', () => {
  let service: HouseholdService;
  
  beforeEach(() => {
    service = new HouseholdService(mockHouseholdRepo, mockAuditService);
    jest.clearAllMocks();
  });
  
  it('should create household and log audit event', async () => {
    const createDto = { name: 'Test Family' };
    const created = { id: '123', ...createDto };
    
    mockHouseholdRepo.save.mockResolvedValue(created);
    
    const result = await service.create(createDto, user);
    
    expect(mockHouseholdRepo.save).toHaveBeenCalledWith(createDto);
    expect(mockAuditService.log).toHaveBeenCalledWith({
      action: 'create',
      entityType: 'household',
      entityId: '123'
    });
    expect(result).toEqual(created);
  });
});
```

### Coverage Requirements

#### Critical Components (100% coverage)

- **Financial calculations**
  - Fee calculations
  - Cost basis calculations
  - Performance calculations
  - Tax lot accounting
  
- **Security functions**
  - Authentication
  - Authorization
  - Encryption/Decryption
  - Input validation

- **Compliance logic**
  - KYC verification
  - Trade approval logic
  - Restriction checking
  - Audit logging

#### Standard Components (80% coverage)

- Business logic services
- Controllers
- DTOs validation
- Utilities

#### Lower Priority (<80% acceptable)

- Simple getters/setters
- Configuration files
- Type definitions
- Decorators

### Example Unit Tests

#### Service Test

```typescript
// household.service.spec.ts
describe('HouseholdService', () => {
  let service: HouseholdService;
  let repository: MockType<Repository<Household>>;
  let auditService: MockType<AuditService>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        HouseholdService,
        { provide: getRepositoryToken(Household), useFactory: mockRepository },
        { provide: AuditService, useFactory: mockAuditService }
      ]
    }).compile();
    
    service = module.get(HouseholdService);
    repository = module.get(getRepositoryToken(Household));
    auditService = module.get(AuditService);
  });
  
  describe('create', () => {
    it('should create household with valid data', async () => {
      const dto = new CreateHouseholdDto();
      dto.name = 'Smith Family';
      dto.advisorId = 'adv-123';
      
      const expected = { id: 'hh-123', ...dto };
      repository.save.mockResolvedValue(expected);
      
      const result = await service.create(dto, mockUser);
      
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(expected);
      expect(auditService.log).toHaveBeenCalled();
    });
    
    it('should throw error when name is too short', async () => {
      const dto = new CreateHouseholdDto();
      dto.name = 'A';
      
      await expect(service.create(dto, mockUser))
        .rejects
        .toThrow(ValidationException);
    });
    
    it('should throw error when adviser not found', async () => {
      const dto = new CreateHouseholdDto();
      dto.name = 'Smith Family';
      dto.advisorId = 'invalid';
      
      repository.findOne.mockResolvedValue(null);
      
      await expect(service.create(dto, mockUser))
        .rejects
        .toThrow(NotFoundException);
    });
  });
  
  describe('calculateTotalAum', () => {
    it('should sum all account values', () => {
      const household = {
        id: 'hh-123',
        accounts: [
          { currentValue: 100000 },
          { currentValue: 50000 },
          { currentValue: 25000 }
        ]
      };
      
      const result = service.calculateTotalAum(household);
      
      expect(result).toBe(175000);
    });
    
    it('should return 0 when no accounts', () => {
      const household = { id: 'hh-123', accounts: [] };
      
      const result = service.calculateTotalAum(household);
      
      expect(result).toBe(0);
    });
  });
});
```

#### Utility Function Test

```typescript
// fee-calculator.spec.ts
describe('FeeCalculator', () => {
  describe('calculateQuarterlyFee', () => {
    it.each([
      [100000, 0.01, 250.00],
      [250000, 0.01, 625.00],
      [1000000, 0.01, 2500.00],
      [100001, 0.01, 250.00],  // Rounding
    ])('should calculate %d * %d = %d', (balance, rate, expected) => {
      expect(calculateQuarterlyFee(balance, rate)).toBe(expected);
    });
    
    it('should throw error for negative balance', () => {
      expect(() => calculateQuarterlyFee(-1000, 0.01))
        .toThrow('Balance cannot be negative');
    });
    
    it('should throw error for invalid rate', () => {
      expect(() => calculateQuarterlyFee(100000, -0.01))
        .toThrow('Rate must be between 0 and 1');
      expect(() => calculateQuarterlyFee(100000, 1.5))
        .toThrow('Rate must be between 0 and 1');
    });
  });
});
```

#### Frontend Component Test

```typescript
// HouseholdList.test.tsx
describe('HouseholdList', () => {
  it('should render list of households', () => {
    const households = [
      { id: '1', name: 'Smith Family', totalAum: 100000 },
      { id: '2', name: 'Johnson Family', totalAum: 200000 }
    ];
    
    render(<HouseholdList households={households} />);
    
    expect(screen.getByText('Smith Family')).toBeInTheDocument();
    expect(screen.getByText('Johnson Family')).toBeInTheDocument();
  });
  
  it('should display empty state when no households', () => {
    render(<HouseholdList households={[]} />);
    
    expect(screen.getByText('No households found')).toBeInTheDocument();
  });
  
  it('should call onSelect when household clicked', () => {
    const onSelect = jest.fn();
    const households = [{ id: '1', name: 'Smith Family' }];
    
    render(<HouseholdList households={households} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('Smith Family'));
    
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

## Integration Testing

### Scope

Test interactions between components, modules, and external systems.

### Test Scenarios

#### 1. API Integration Tests

Test complete request/response cycle including:
- Routing
- Authentication
- Authorization
- Business logic
- Database operations
- Response formatting

```typescript
// household.integration.spec.ts
describe('Household API (Integration)', () => {
  let app: INestApplication;
  let accessToken: string;
  
  beforeAll(async () => {
    app = await createTestApp();
    await app.init();
    accessToken = await getTestAccessToken(app);
  });
  
  afterAll(async () => {
    await cleanupDatabase();
    await app.close();
  });
  
  describe('POST /households', () => {
    it('should create household with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/households')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Integration Test Family',
          advisorId: testAdviserId,
          riskTolerance: 'moderate'
        })
        .expect(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'Integration Test Family',
        status: 'prospect'
      });
      
      // Verify in database
      const household = await householdRepo.findOne(response.body.id);
      expect(household).toBeDefined();
      
      // Verify audit log
      const auditLog = await auditRepo.findOne({
        where: {
          entityType: 'household',
          entityId: response.body.id,
          action: 'create'
        }
      });
      expect(auditLog).toBeDefined();
    });
    
    it('should return 403 when unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/households')
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({ name: 'Test' })
        .expect(403);
    });
    
    it('should return 422 when validation fails', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/households')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'A' })  // Too short
        .expect(422);
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveLength(1);
    });
  });
  
  describe('GET /households/:id', () => {
    let householdId: string;
    
    beforeEach(async () => {
      const household = await createTestHousehold();
      householdId = household.id;
    });
    
    it('should return household with persons and accounts', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/households/${householdId}?include=persons,accounts`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: householdId,
        persons: expect.any(Array),
        accounts: expect.any(Array)
      });
    });
    
    it('should return 404 when household not found', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/households/non-existent')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
```

#### 2. Database Integration Tests

Test database operations, constraints, and transactions.

```typescript
describe('Account Repository Integration', () => {
  let repository: Repository<Account>;
  
  beforeAll(async () => {
    await setupTestDatabase();
    repository = getRepository(Account);
  });
  
  it('should enforce unique account number constraint', async () => {
    const account1 = repository.create({
      accountNumber: 'ACC001',
      householdId: 'hh-123'
    });
    await repository.save(account1);
    
    const account2 = repository.create({
      accountNumber: 'ACC001',  // Duplicate
      householdId: 'hh-456'
    });
    
    await expect(repository.save(account2))
      .rejects
      .toThrow(/unique constraint/);
  });
  
  it('should cascade delete positions when account deleted', async () => {
    const account = await createTestAccount();
    await createTestPosition({ accountId: account.id });
    
    const positionsBefore = await positionRepo.find({ where: { accountId: account.id } });
    expect(positionsBefore).toHaveLength(1);
    
    await repository.delete(account.id);
    
    const positionsAfter = await positionRepo.find({ where: { accountId: account.id } });
    expect(positionsAfter).toHaveLength(0);
  });
  
  it('should maintain referential integrity', async () => {
    const account = repository.create({
      accountNumber: 'ACC002',
      householdId: 'non-existent'  // Invalid FK
    });
    
    await expect(repository.save(account))
      .rejects
      .toThrow(/foreign key constraint/);
  });
});
```

#### 3. Service Integration Tests

Test interactions between services.

```typescript
describe('Client Onboarding Integration', () => {
  let householdService: HouseholdService;
  let personService: PersonService;
  let accountService: AccountService;
  let kycService: KYCService;
  
  beforeAll(async () => {
    // Initialize services with real dependencies
  });
  
  it('should complete full onboarding workflow', async () => {
    // Create household
    const household = await householdService.create({
      name: 'Test Family',
      advisorId: testAdviserId
    }, testUser);
    
    // Add person
    const person = await personService.create({
      householdId: household.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    }, testUser);
    
    // Verify KYC
    await kycService.verify(person.id, {
      idDocument: 'document-id',
      verification: 'passed'
    }, complianceUser);
    
    // Open account
    const account = await accountService.create({
      householdId: household.id,
      ownerPersonId: person.id,
      accountType: 'individual'
    }, testUser);
    
    // Verify final state
    const refreshedHousehold = await householdService.findOne(household.id);
    expect(refreshedHousehold.persons).toHaveLength(1);
    expect(refreshedHousehold.accounts).toHaveLength(1);
    expect(refreshedHousehold.accounts[0].status).toBe('pending');
    
    const refreshedPerson = await personService.findOne(person.id);
    expect(refreshedPerson.kycStatus).toBe('verified');
  });
});
```

## End-to-End Testing

### Scope

Test complete user workflows from UI through backend to database.

### Framework

- **Playwright** for browser automation
- **Cypress** (alternative)

### Test Scenarios

#### 1. Client Onboarding E2E

```typescript
// client-onboarding.e2e.ts
describe('Client Onboarding E2E', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:3001');
    await login('adviser@firm.com', 'password');
  });
  
  it('should complete full client onboarding', async () => {
    // Navigate to households
    await page.click('text=Households');
    
    // Create household
    await page.click('text=New Household');
    await page.fill('[name=name]', 'E2E Test Family');
    await page.selectOption('[name=riskTolerance]', 'moderate');
    await page.click('button:text("Save")');
    
    // Verify household created
    await expect(page.locator('h1')).toContainText('E2E Test Family');
    
    // Add person
    await page.click('text=Add Person');
    await page.fill('[name=firstName]', 'John');
    await page.fill('[name=lastName]', 'Doe');
    await page.fill('[name=email]', 'john@example.com');
    await page.fill('[name=dateOfBirth]', '1980-01-01');
    await page.fill('[name=ssn]', '123-45-6789');
    await page.click('button:text("Save")');
    
    // Verify person added
    await expect(page.locator('.person-list')).toContainText('John Doe');
    
    // Open account
    await page.click('text=Add Account');
    await page.fill('[name=accountName]', 'Individual Account');
    await page.selectOption('[name=accountType]', 'individual');
    await page.selectOption('[name=ownerPersonId]', 'John Doe');
    await page.click('button:text("Save")');
    
    // Verify account created
    await expect(page.locator('.account-list')).toContainText('Individual Account');
    await expect(page.locator('.account-status')).toContainText('Pending');
  });
});
```

#### 2. Trade Execution E2E

```typescript
describe('Trade Execution E2E', () => {
  it('should create and approve trade', async () => {
    await login('adviser@firm.com', 'password');
    
    // Navigate to account
    await page.click('text=Accounts');
    await page.click('text=Test Account');
    
    // Create trade
    await page.click('text=New Trade');
    await page.selectOption('[name=transactionType]', 'buy');
    await page.fill('[name=symbol]', 'AAPL');
    await page.fill('[name=quantity]', '100');
    await page.selectOption('[name=orderType]', 'market');
    await page.fill('[name=rationale]', 'Portfolio rebalancing');
    await page.click('button:text("Submit for Approval")');
    
    // Verify trade submitted
    await expect(page.locator('.alert-success')).toContainText('Trade submitted');
    
    // Login as compliance
    await logout();
    await login('compliance@firm.com', 'password');
    
    // Approve trade
    await page.click('text=Compliance Queue');
    await page.click('text=AAPL Buy');
    await page.click('button:text("Approve")');
    
    // Verify trade approved
    await expect(page.locator('.trade-status')).toContainText('Approved');
  });
});
```

### E2E Best Practices

1. **Use Data Attributes**: `data-testid` for stable selectors
2. **Wait for Elements**: Use `waitFor` instead of fixed delays
3. **Clean State**: Reset database before each test
4. **Independent Tests**: Each test should be runnable independently
5. **Visual Regression**: Screenshot comparison for UI changes

## Performance Testing

### Scope

Test system performance under load to identify bottlenecks.

### Tools

- **Artillery**: Load testing
- **k6**: Load testing
- **Apache JMeter**: Complex scenarios

### Test Scenarios

#### 1. API Load Test

```yaml
# artillery-config.yml
config:
  target: 'https://api.crm.example.com'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 requests/second
    - duration: 120
      arrivalRate: 50  # Ramp to 50/sec
    - duration: 60
      arrivalRate: 100 # Peak load
  defaults:
    headers:
      Authorization: 'Bearer {{authToken}}'

scenarios:
  - name: 'List households'
    flow:
      - get:
          url: '/api/v1/households'
  
  - name: 'Create household'
    flow:
      - post:
          url: '/api/v1/households'
          json:
            name: 'Load Test Family {{ $randomString() }}'
            advisorId: '{{ advisorId }}'
```

#### 2. Database Query Performance

```typescript
describe('Performance: Household Queries', () => {
  beforeAll(async () => {
    // Create 10,000 test households
    await seedLargeDataset(10000);
  });
  
  it('should list households in under 500ms', async () => {
    const start = Date.now();
    
    const result = await householdService.findAll({
      page: 1,
      limit: 50
    });
    
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(500);
    expect(result).toHaveLength(50);
  });
  
  it('should handle complex filters efficiently', async () => {
    const start = Date.now();
    
    const result = await householdService.findAll({
      status: 'active',
      advisorId: testAdviserId,
      minAum: 100000,
      sort: '-totalAum'
    });
    
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000);
  });
});
```

### Performance Benchmarks

| Operation | Target Response Time | Max Response Time |
|-----------|---------------------|-------------------|
| List (paginated) | <200ms | <500ms |
| Get single resource | <100ms | <300ms |
| Create resource | <300ms | <1000ms |
| Update resource | <300ms | <1000ms |
| Complex query | <500ms | <2000ms |
| Report generation | <3000ms | <10000ms |

## Security Testing

### Scope

Test security controls and identify vulnerabilities.

### Test Types

#### 1. Authentication Testing

```typescript
describe('Security: Authentication', () => {
  it('should reject requests without token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/households')
      .expect(401);
  });
  
  it('should reject expired tokens', async () => {
    const expiredToken = generateExpiredToken();
    
    await request(app.getHttpServer())
      .get('/api/v1/households')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });
  
  it('should reject tampered tokens', async () => {
    const validToken = await generateToken();
    const tamperedToken = validToken.slice(0, -5) + 'xxxxx';
    
    await request(app.getHttpServer())
      .get('/api/v1/households')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .expect(401);
  });
  
  it('should lockout after failed login attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com', password: 'wrong' })
        .expect(401);
    }
    
    // 6th attempt should be locked
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'correct' })
      .expect(423);  // Locked
  });
});
```

#### 2. Authorization Testing

```typescript
describe('Security: Authorization', () => {
  it('should prevent access to unassigned households', async () => {
    const adviser1Token = await getAdviserToken(adviser1);
    const adviser2Household = await createHousehold(adviser2);
    
    await request(app.getHttpServer())
      .get(`/api/v1/households/${adviser2Household.id}`)
      .set('Authorization', `Bearer ${adviser1Token}`)
      .expect(403);
  });
  
  it('should enforce role-based permissions', async () => {
    const readOnlyToken = await getReadOnlyToken();
    
    await request(app.getHttpServer())
      .post('/api/v1/households')
      .set('Authorization', `Bearer ${readOnlyToken}`)
      .send({ name: 'Test' })
      .expect(403);
  });
});
```

#### 3. Input Validation Testing

```typescript
describe('Security: Input Validation', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE households; --";
    
    const response = await request(app.getHttpServer())
      .get(`/api/v1/households?name=${maliciousInput}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    // Should return empty results, not execute SQL
    expect(response.body.data).toEqual([]);
    
    // Verify table still exists
    const count = await householdRepo.count();
    expect(count).toBeGreaterThan(0);
  });
  
  it('should prevent XSS attacks', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await request(app.getHttpServer())
      .post('/api/v1/households')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: xssPayload })
      .expect(201);
    
    // Should be HTML-encoded in response
    expect(response.body.name).not.toContain('<script>');
    expect(response.body.name).toContain('&lt;script&gt;');
  });
  
  it('should validate file uploads', async () => {
    const executableFile = createExecutableFile();
    
    await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', executableFile)
      .expect(400);
  });
});
```

#### 4. Encryption Testing

```typescript
describe('Security: Encryption', () => {
  it('should encrypt SSN in database', async () => {
    const person = await personService.create({
      firstName: 'John',
      lastName: 'Doe',
      ssn: '123-45-6789'
    }, user);
    
    // Check database directly
    const dbRecord = await personRepo.findOne(person.id);
    expect(dbRecord.ssnEncrypted).not.toContain('123-45-6789');
    expect(dbRecord.ssnEncrypted).toMatch(/^aes256\$/);
  });
  
  it('should decrypt SSN for authorized users', async () => {
    const person = await personService.findOne(personId, authorizedUser);
    
    expect(person.ssn).toBe('123-45-6789');
  });
  
  it('should mask SSN for display', async () => {
    const person = await personService.findOne(personId, user);
    
    expect(person.ssnMasked).toBe('***-**-6789');
  });
});
```

### Automated Security Scanning

**Tools**:
- **Snyk**: Dependency vulnerabilities
- **OWASP ZAP**: Web application scanning
- **SonarQube**: Code security issues
- **npm audit**: Node.js vulnerabilities

**CI/CD Integration**:
```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run Snyk
        run: npx snyk test
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Run OWASP ZAP
        run: docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000
```

## Compliance Testing

### Scope

Verify regulatory compliance requirements.

### Test Scenarios

#### 1. Audit Trail Testing

```typescript
describe('Compliance: Audit Trail', () => {
  it('should log all household modifications', async () => {
    const household = await createTestHousehold();
    
    await householdService.update(household.id, {
      riskTolerance: 'aggressive'
    }, user);
    
    const auditLogs = await auditService.findByEntity('household', household.id);
    
    expect(auditLogs).toHaveLength(2);  // Create + Update
    expect(auditLogs[1]).toMatchObject({
      action: 'update',
      changes: {
        before: { riskTolerance: 'moderate' },
        after: { riskTolerance: 'aggressive' }
      }
    });
  });
  
  it('should log PII access', async () => {
    const person = await createTestPerson();
    
    await personService.unmaskSSN(person.id, user, 'Client verification');
    
    const auditLog = await auditService.findLatest();
    expect(auditLog).toMatchObject({
      eventType: 'pii.unmask',
      entityType: 'person',
      entityId: person.id,
      userId: user.id,
      metadata: { field: 'ssn', reason: 'Client verification' }
    });
  });
});
```

#### 2. Data Retention Testing

```typescript
describe('Compliance: Data Retention', () => {
  it('should retain records for required period', async () => {
    const closedDate = new Date('2018-01-01');
    const account = await createClosedAccount(closedDate);
    
    // Should still exist after 5 years
    const after5Years = new Date('2023-01-01');
    mockDate(after5Years);
    await retentionService.processRetention();
    
    const exists = await accountRepo.exists(account.id);
    expect(exists).toBe(true);
  });
  
  it('should delete records after retention period', async () => {
    const closedDate = new Date('2016-01-01');
    const account = await createClosedAccount(closedDate);
    
    // Should be deleted after 6+ years
    const after7Years = new Date('2024-01-01');
    mockDate(after7Years);
    await retentionService.processRetention();
    
    const exists = await accountRepo.exists(account.id);
    expect(exists).toBe(false);
  });
  
  it('should not delete records under legal hold', async () => {
    const account = await createClosedAccount(new Date('2016-01-01'));
    await legalHoldService.createHold({
      matterName: 'Litigation',
      accountIds: [account.id]
    });
    
    mockDate(new Date('2024-01-01'));
    await retentionService.processRetention();
    
    const exists = await accountRepo.exists(account.id);
    expect(exists).toBe(true);
  });
});
```

#### 3. KYC Compliance Testing

```typescript
describe('Compliance: KYC', () => {
  it('should prevent account opening without KYC', async () => {
    const person = await createTestPerson({ kycStatus: 'pending' });
    
    await expect(
      accountService.create({
        ownerPersonId: person.id,
        accountType: 'individual'
      }, user)
    ).rejects.toThrow('KYC verification required');
  });
  
  it('should require re-verification after time period', async () => {
    const person = await createTestPerson({
      kycStatus: 'verified',
      kycVerifiedDate: new Date('2020-01-01')
    });
    
    mockDate(new Date('2023-01-01'));  // 3 years later
    
    const needsReverification = await kycService.needsReverification(person.id);
    expect(needsReverification).toBe(true);
  });
});
```

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Owner**: QA & Engineering Team  
**Classification**: Internal Use Only
