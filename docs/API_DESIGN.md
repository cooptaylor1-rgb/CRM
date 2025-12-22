# API Design Standards - Wealth Management CRM

## Table of Contents
1. [REST

ful Conventions](#restful-conventions)
2. [Resource Naming](#resource-naming)
3. [Error Handling](#error-handling)
4. [Versioning Strategy](#versioning-strategy)
5. [Rate Limiting](#rate-limiting)
6. [Authentication Flows](#authentication-flows)
7. [Webhook Design](#webhook-design)
8. [API Documentation](#api-documentation)

## RESTful Conventions

### HTTP Methods

| Method | Purpose | Idempotent | Safe | Request Body | Response Body |
|--------|---------|------------|------|--------------|---------------|
| GET | Retrieve resource(s) | Yes | Yes | No | Yes |
| POST | Create resource | No | No | Yes | Yes |
| PUT | Replace resource | Yes | No | Yes | Yes |
| PATCH | Update resource | No | No | Yes | Yes |
| DELETE | Delete resource | Yes | No | No | Optional |

### Standard Endpoints

```
# Collection operations
GET    /api/v1/households          # List households
POST   /api/v1/households          # Create household

# Resource operations
GET    /api/v1/households/:id      # Get household
PUT    /api/v1/households/:id      # Replace household
PATCH  /api/v1/households/:id      # Update household
DELETE /api/v1/households/:id      # Delete household

# Sub-resource operations
GET    /api/v1/households/:id/accounts        # List household accounts
POST   /api/v1/households/:id/accounts        # Create account
GET    /api/v1/households/:id/persons         # List household persons
GET    /api/v1/accounts/:id/transactions      # List account transactions
```

### Query Parameters

**Filtering**:
```
GET /api/v1/households?status=active
GET /api/v1/accounts?householdId=123&status=active
GET /api/v1/transactions?startDate=2024-01-01&endDate=2024-12-31
```

**Sorting**:
```
GET /api/v1/households?sort=name
GET /api/v1/accounts?sort=-createdAt         # Descending
GET /api/v1/transactions?sort=tradeDate,amount
```

**Pagination**:
```
GET /api/v1/households?page=1&limit=50
GET /api/v1/accounts?offset=0&limit=100
```

**Field Selection**:
```
GET /api/v1/households?fields=id,name,totalAum
GET /api/v1/accounts?exclude=metadata
```

**Including Relations**:
```
GET /api/v1/households/:id?include=persons,accounts
GET /api/v1/accounts/:id?include=positions.security
```

### Response Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Authenticated but unauthorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (duplicate) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

## Resource Naming

### Naming Conventions

**Collections**: Plural nouns
```
/households
/accounts
/transactions
/documents
```

**Resources**: Plural noun + ID
```
/households/123
/accounts/abc-def-456
/persons/xyz-789
```

**Actions**: Verb after resource
```
POST /accounts/:id/close
POST /transactions/:id/cancel
POST /households/:id/assign-adviser
```

**Nested Resources**: Maximum 2 levels
```
✓ /households/:id/accounts
✓ /accounts/:id/transactions
✗ /households/:id/accounts/:id/transactions  # Too deep
```

### Resource Examples

```typescript
// Households
GET    /api/v1/households
POST   /api/v1/households
GET    /api/v1/households/:id
PATCH  /api/v1/households/:id
DELETE /api/v1/households/:id
GET    /api/v1/households/:id/accounts
GET    /api/v1/households/:id/persons
POST   /api/v1/households/:id/assign-adviser

// Accounts
GET    /api/v1/accounts
POST   /api/v1/accounts
GET    /api/v1/accounts/:id
PATCH  /api/v1/accounts/:id
DELETE /api/v1/accounts/:id
POST   /api/v1/accounts/:id/close
GET    /api/v1/accounts/:id/positions
GET    /api/v1/accounts/:id/transactions
POST   /api/v1/accounts/:id/rebalance

// Transactions
GET    /api/v1/transactions
POST   /api/v1/transactions
GET    /api/v1/transactions/:id
POST   /api/v1/transactions/:id/cancel

// Compliance
GET    /api/v1/compliance/reviews
POST   /api/v1/compliance/reviews
GET    /api/v1/compliance/reviews/:id
POST   /api/v1/compliance/reviews/:id/approve
POST   /api/v1/compliance/reviews/:id/reject

// Documents
GET    /api/v1/documents
POST   /api/v1/documents
GET    /api/v1/documents/:id
GET    /api/v1/documents/:id/download
DELETE /api/v1/documents/:id
```

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;              // Machine-readable error code
    message: string;           // Human-readable message
    details?: ErrorDetail[];   // Additional error details
    requestId: string;         // Request correlation ID
    timestamp: string;         // ISO 8601 timestamp
  };
}

interface ErrorDetail {
  field?: string;              // Field name (for validation)
  message: string;             // Specific error message
  code?: string;               // Specific error code
  value?: any;                 // Invalid value (sanitized)
}
```

### Error Examples

**Validation Error (422)**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT",
        "value": "not-an-email"
      },
      {
        "field": "dateOfBirth",
        "message": "Must be at least 18 years old",
        "code": "AGE_REQUIREMENT"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Authorization Error (403)**:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions to access this resource",
    "details": [
      {
        "message": "Requires 'household:read:all' permission"
      }
    ],
    "requestId": "req_def456",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Not Found Error (404)**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Household not found",
    "requestId": "req_ghi789",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Server Error (500)**:
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Our team has been notified.",
    "requestId": "req_jkl012",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Standard Error Codes

```typescript
enum ErrorCode {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  GONE = 'GONE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Business Logic Errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  KYC_NOT_VERIFIED = 'KYC_NOT_VERIFIED',
  ACCOUNT_CLOSED = 'ACCOUNT_CLOSED',
  DUPLICATE_ACCOUNT_NUMBER = 'DUPLICATE_ACCOUNT_NUMBER',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  
  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

## Versioning Strategy

### URL Versioning

**Format**: `/api/v{version}/{resource}`

```
/api/v1/households
/api/v2/households
```

**Rules**:
- Major version in URL
- Increment when breaking changes
- Support previous version for 12 months minimum
- Deprecation warnings in headers

### Version Deprecation

**Response Headers**:
```
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Link: </api/v2/households>; rel="alternate"
```

**Deprecation Timeline**:
1. **Announcement** (6 months before): Notify clients
2. **Deprecation** (3 months before): Add deprecation headers
3. **Sunset Date**: Version no longer available

### Backwards Compatibility

**Non-Breaking Changes** (no version bump):
- Adding new endpoints
- Adding new optional fields
- Adding new response fields
- Making required fields optional

**Breaking Changes** (version bump required):
- Removing endpoints
- Removing request/response fields
- Changing field types
- Changing authentication
- Changing URL structure

## Rate Limiting

### Rate Limit Tiers

| Tier | Requests/Hour | Burst | Use Case |
|------|---------------|-------|----------|
| Default | 1,000 | 50 | Standard API usage |
| Authenticated | 5,000 | 100 | Logged-in users |
| Premium | 10,000 | 200 | High-volume clients |
| Internal | Unlimited | N/A | Internal services |

### Rate Limit Headers

**Request**:
```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4995
X-RateLimit-Reset: 1705320000
X-RateLimit-Reset-After: 3600
```

**When Exceeded (429)**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Retry after 3600 seconds.",
    "requestId": "req_xyz123",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

Headers:
```
Retry-After: 3600
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705320000
```

### Rate Limit Implementation

```typescript
// Rate limit by user ID
const userRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5000,
  keyGenerator: (req) => req.user.id,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
        requestId: req.id,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Rate limit by IP (unauthenticated)
const ipRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.ip,
});

// Endpoint-specific limits
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
});
```

## Authentication Flows

### JWT Bearer Token

**Request**:
```http
GET /api/v1/households HTTP/1.1
Host: api.crm.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Payload**:
```json
{
  "sub": "user-uuid-123",
  "email": "adviser@firm.com",
  "role": "adviser",
  "permissions": ["household:read:assigned", "account:write:assigned"],
  "iat": 1705320000,
  "exp": 1705323600,
  "jti": "token-unique-id"
}
```

### OAuth 2.0 Flow

**1. Authorization Request**:
```http
GET /oauth/authorize?
  response_type=code&
  client_id=CLIENT_ID&
  redirect_uri=https://app.example.com/callback&
  scope=households:read%20accounts:read&
  state=RANDOM_STATE
```

**2. Authorization Code**:
```http
HTTP/1.1 302 Found
Location: https://app.example.com/callback?
  code=AUTHORIZATION_CODE&
  state=RANDOM_STATE
```

**3. Token Exchange**:
```http
POST /oauth/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
redirect_uri=https://app.example.com/callback&
client_id=CLIENT_ID&
client_secret=CLIENT_SECRET
```

**4. Token Response**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh-token-abc123",
  "scope": "households:read accounts:read"
}
```

### API Key Authentication

**Request**:
```http
GET /api/v1/households HTTP/1.1
Host: api.crm.example.com
X-API-Key: api_key_abc123def456
```

**Use Cases**:
- Server-to-server integration
- Third-party integrations
- Webhooks

**Security**:
- Rotate every 90 days
- Scope limited permissions
- IP whitelist when possible
- Monitor usage

## Webhook Design

### Webhook Events

```typescript
enum WebhookEvent {
  // Household events
  HOUSEHOLD_CREATED = 'household.created',
  HOUSEHOLD_UPDATED = 'household.updated',
  HOUSEHOLD_DELETED = 'household.deleted',
  
  // Account events
  ACCOUNT_CREATED = 'account.created',
  ACCOUNT_UPDATED = 'account.updated',
  ACCOUNT_CLOSED = 'account.closed',
  
  // Transaction events
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_SETTLED = 'transaction.settled',
  TRANSACTION_CANCELLED = 'transaction.cancelled',
  
  // Compliance events
  COMPLIANCE_REVIEW_REQUIRED = 'compliance.review_required',
  COMPLIANCE_REVIEW_COMPLETED = 'compliance.review_completed',
  
  // Document events
  DOCUMENT_UPLOADED = 'document.uploaded',
}
```

### Webhook Payload

```typescript
interface WebhookPayload {
  id: string;                    // Unique event ID
  event: WebhookEvent;           // Event type
  timestamp: string;             // ISO 8601 timestamp
  data: {
    object: any;                 // The affected resource
    previous?: any;              // Previous state (for updates)
  };
  metadata: {
    userId: string;              // User who triggered
    requestId: string;           // Original request ID
    environment: string;         // production/staging
  };
}
```

### Webhook Example

```json
{
  "id": "evt_abc123def456",
  "event": "account.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "object": {
      "id": "acc_xyz789",
      "accountNumber": "ACC001234",
      "householdId": "hh_123",
      "status": "pending",
      "accountType": "individual",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "metadata": {
    "userId": "usr_456",
    "requestId": "req_789",
    "environment": "production"
  }
}
```

### Webhook Delivery

**Request**:
```http
POST /webhook-endpoint HTTP/1.1
Host: client.example.com
Content-Type: application/json
X-Webhook-Signature: sha256=abc123...
X-Webhook-ID: evt_abc123def456
X-Webhook-Timestamp: 1705320000

{webhook payload}
```

**Signature Verification**:
```typescript
const signature = req.headers['x-webhook-signature'];
const timestamp = req.headers['x-webhook-timestamp'];
const payload = req.body;

const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${JSON.stringify(payload)}`)
  .digest('hex');

if (signature !== `sha256=${expectedSignature}`) {
  throw new Error('Invalid signature');
}

// Check timestamp to prevent replay attacks
const now = Math.floor(Date.now() / 1000);
if (now - parseInt(timestamp) > 300) { // 5 minutes
  throw new Error('Webhook timestamp too old');
}
```

### Webhook Retry Logic

**Retry Schedule**:
- Immediate
- 5 seconds
- 30 seconds
- 2 minutes
- 10 minutes
- 30 minutes
- 1 hour
- 2 hours (final attempt)

**Failure Handling**:
- HTTP 2xx: Success
- HTTP 4xx: Client error, do not retry
- HTTP 5xx: Server error, retry
- Timeout (30s): Retry
- Network error: Retry

**Dead Letter Queue**:
- Failed webhooks after all retries
- Manual investigation required
- Client notification

## API Documentation

### OpenAPI/Swagger

**Endpoint Documentation**:
```typescript
@ApiTags('households')
@Controller('households')
export class HouseholdController {
  @Post()
  @ApiOperation({
    summary: 'Create a new household',
    description: 'Creates a new household entity with the provided information.'
  })
  @ApiBody({
    type: CreateHouseholdDto,
    description: 'Household creation data',
    examples: {
      example1: {
        value: {
          name: 'Smith Family',
          advisorId: 'adv_123',
          riskTolerance: 'moderate'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Household created successfully',
    type: Household
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    type: ErrorResponse
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

**DTO Documentation**:
```typescript
export class CreateHouseholdDto {
  @ApiProperty({
    description: 'Household display name',
    example: 'Smith Family',
    minLength: 2,
    maxLength: 200
  })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiProperty({
    description: 'Assigned adviser user ID',
    example: 'adv_123abc'
  })
  @IsUUID()
  advisorId: string;

  @ApiProperty({
    description: 'Risk tolerance level',
    enum: ['conservative', 'moderate', 'aggressive'],
    example: 'moderate'
  })
  @IsEnum(['conservative', 'moderate', 'aggressive'])
  riskTolerance: string;
}
```

### Interactive Documentation

**Swagger UI**: Available at `/api/docs`

Features:
- Try-it-out functionality
- Request/response examples
- Authentication configuration
- Model schemas
- Error responses

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Owner**: API Team  
**Classification**: Internal Use Only
