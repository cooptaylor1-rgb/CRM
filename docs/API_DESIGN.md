# API Design Standards - Wealth Management CRM

## Table of Contents
- [Overview](#overview)
- [RESTful API Conventions](#restful-api-conventions)
- [Resource Naming Standards](#resource-naming-standards)
- [HTTP Methods and Status Codes](#http-methods-and-status-codes)
- [Error Handling Patterns](#error-handling-patterns)
- [Versioning Strategy](#versioning-strategy)
- [Rate Limiting](#rate-limiting)
- [Authentication Flows](#authentication-flows)
- [Request/Response Formats](#requestresponse-formats)
- [Pagination](#pagination)
- [Filtering and Sorting](#filtering-and-sorting)
- [Webhook Design](#webhook-design)
- [API Documentation](#api-documentation)

## Overview

This document defines the API design standards for the Wealth Management CRM. Our API follows REST principles, prioritizes developer experience, and maintains strict security and compliance requirements.

### Design Principles

1. **RESTful**: Resource-oriented URLs, HTTP verbs, standard status codes
2. **Consistent**: Predictable patterns across all endpoints
3. **Secure**: Authentication required, authorization enforced, audit logging
4. **Versioned**: Backward compatibility maintained
5. **Well-Documented**: OpenAPI/Swagger specification
6. **Performance**: Caching, pagination, field selection
7. **Developer-Friendly**: Clear error messages, examples, SDKs

## RESTful API Conventions

### Base URL Structure

```
https://api.wealth-crm.com/v1/{resource}
```

**Environments:**
- Development: `https://api-dev.wealth-crm.com`
- Staging: `https://api-staging.wealth-crm.com`
- Production: `https://api.wealth-crm.com`

### REST Principles

1. **Resources are nouns**, not verbs
2. **Use HTTP methods** for operations (GET, POST, PUT, PATCH, DELETE)
3. **Stateless** - each request contains all necessary information
4. **Cacheable** - responses indicate cacheability
5. **Layered** - client doesn't know if connected directly or through intermediary

## Resource Naming Standards

### General Rules

1. **Use plural nouns** for collection resources: `/households`, `/accounts`, `/persons`
2. **Use lowercase** with hyphens for multi-word resources: `/account-statements`
3. **Hierarchical relationships** via nested paths: `/households/{id}/accounts`
4. **No trailing slashes**: `/households` not `/households/`
5. **No file extensions**: `/accounts/123` not `/accounts/123.json`

### Resource Hierarchy

```
/households
  /{householdId}
    /members
    /accounts
      /{accountId}
        /positions
        /transactions
    /documents
    /communications
    
/persons
  /{personId}
    /households
    /accounts
    /documents
    
/accounts
  /{accountId}
    /positions
    /transactions
    /performance
    
/securities
  /{securityId}
    /price-history
```

### Examples

**Good:**
```
GET /households
GET /households/123
GET /households/123/accounts
POST /households
PUT /households/123
DELETE /households/123
GET /accounts/456/positions
```

**Bad:**
```
GET /getHouseholds          # Not RESTful (verb in URL)
GET /household              # Should be plural
GET /Households             # Should be lowercase
GET /households/123/        # No trailing slash
GET /households/123.json    # No file extension
```

## HTTP Methods and Status Codes

### HTTP Methods

| Method | Description | Idempotent | Safe |
|--------|-------------|------------|------|
| GET | Retrieve resource(s) | Yes | Yes |
| POST | Create new resource | No | No |
| PUT | Replace entire resource | Yes | No |
| PATCH | Partially update resource | No | No |
| DELETE | Remove resource | Yes | No |

### Method Usage

**GET** - Retrieve resources
```
GET /households              # List all households
GET /households/123          # Get specific household
GET /households/123/accounts # List household's accounts
```

**POST** - Create new resource
```
POST /households
Content-Type: application/json

{
  "name": "Smith Family",
  "type": "FAMILY",
  "status": "PROSPECT"
}
```

**PUT** - Replace entire resource
```
PUT /households/123
Content-Type: application/json

{
  "name": "Smith Family Trust",
  "type": "TRUST",
  "status": "ACTIVE",
  "primary_advisor_id": "user-456"
  // All fields required
}
```

**PATCH** - Partial update
```
PATCH /households/123
Content-Type: application/json

{
  "status": "ACTIVE"
  // Only changed fields
}
```

**DELETE** - Remove resource
```
DELETE /households/123
```

### HTTP Status Codes

#### Success Codes (2xx)

| Code | Meaning | Usage |
|------|---------|-------|
| 200 OK | Success | GET, PUT, PATCH successful |
| 201 Created | Resource created | POST successful, includes Location header |
| 202 Accepted | Accepted for processing | Async operation started |
| 204 No Content | Success, no response body | DELETE successful |

#### Client Error Codes (4xx)

| Code | Meaning | Usage |
|------|---------|-------|
| 400 Bad Request | Invalid request | Validation errors, malformed JSON |
| 401 Unauthorized | Not authenticated | Missing or invalid auth token |
| 403 Forbidden | Not authorized | Valid auth, insufficient permissions |
| 404 Not Found | Resource doesn't exist | Invalid resource ID |
| 409 Conflict | Resource conflict | Duplicate resource, version conflict |
| 422 Unprocessable Entity | Semantic errors | Business rule violation |
| 429 Too Many Requests | Rate limit exceeded | Too many requests |

#### Server Error Codes (5xx)

| Code | Meaning | Usage |
|------|---------|-------|
| 500 Internal Server Error | Server error | Unexpected error |
| 502 Bad Gateway | Upstream error | Custodian API failure |
| 503 Service Unavailable | Temporary unavailable | Maintenance mode |
| 504 Gateway Timeout | Upstream timeout | Slow custodian response |

### Status Code Examples

```typescript
// 200 OK - Successful GET
{
  "id": "household-123",
  "name": "Smith Family",
  "status": "ACTIVE"
}

// 201 Created - Successful POST
HTTP/1.1 201 Created
Location: /households/household-123
{
  "id": "household-123",
  "name": "Smith Family",
  "status": "PROSPECT",
  "created_at": "2024-12-22T10:30:00Z"
}

// 204 No Content - Successful DELETE
HTTP/1.1 204 No Content

// 400 Bad Request - Validation error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required",
        "code": "REQUIRED"
      }
    ]
  }
}

// 401 Unauthorized - Missing auth
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

// 403 Forbidden - Insufficient permissions
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this household"
  }
}

// 404 Not Found - Resource doesn't exist
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Household not found",
    "resource_type": "household",
    "resource_id": "household-123"
  }
}

// 409 Conflict - Duplicate resource
{
  "error": {
    "code": "CONFLICT",
    "message": "Account number already exists",
    "conflicting_field": "account_number"
  }
}

// 422 Unprocessable Entity - Business rule violation
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Cannot close household with open accounts",
    "rule": "HOUSEHOLD_CLOSURE_CHECK",
    "details": {
      "open_accounts": 3
    }
  }
}

// 429 Too Many Requests - Rate limit
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after": 60
  }
}
```

## Error Handling Patterns

### Error Response Format

All errors follow consistent structure:

```typescript
interface ErrorResponse {
  error: {
    code: string;              // Machine-readable error code
    message: string;           // Human-readable message
    details?: any[];           // Validation errors or additional context
    request_id?: string;       // For support/debugging
    timestamp?: string;        // ISO 8601 timestamp
    documentation_url?: string; // Link to error docs
  }
}
```

### Error Codes

**Authentication/Authorization:**
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `TOKEN_EXPIRED` - JWT token expired
- `INVALID_TOKEN` - Malformed JWT token

**Validation:**
- `VALIDATION_ERROR` - Request validation failed
- `REQUIRED_FIELD` - Required field missing
- `INVALID_FORMAT` - Field format invalid
- `OUT_OF_RANGE` - Value outside allowed range

**Business Logic:**
- `BUSINESS_RULE_VIOLATION` - Business constraint violated
- `DUPLICATE_RESOURCE` - Resource already exists
- `RESOURCE_LOCKED` - Resource locked by another process
- `INSUFFICIENT_BALANCE` - Insufficient funds

**Resource:**
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `GONE` - Resource permanently deleted

**Rate Limiting:**
- `RATE_LIMIT_EXCEEDED` - Too many requests

**Server:**
- `INTERNAL_ERROR` - Unexpected server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `UPSTREAM_ERROR` - External service error

### Validation Errors

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT",
        "value": "not-an-email"
      },
      {
        "field": "date_of_birth",
        "message": "Client must be at least 18 years old",
        "code": "AGE_REQUIREMENT",
        "constraint": {
          "min_age": 18
        }
      }
    ],
    "request_id": "req_abc123"
  }
}
```

### Business Rule Violations

```typescript
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Cannot execute trade: insufficient cash balance",
    "rule": "SUFFICIENT_CASH_CHECK",
    "details": {
      "required_cash": 10000.00,
      "available_cash": 5000.00,
      "shortfall": 5000.00
    },
    "request_id": "req_xyz789"
  }
}
```

## Versioning Strategy

### URI Versioning

Version included in URL path:

```
https://api.wealth-crm.com/v1/households
https://api.wealth-crm.com/v2/households
```

**Advantages:**
- Clear and explicit
- Easy to test different versions
- Cache-friendly

### Version Lifecycle

1. **v1** - Current stable version
2. **v2** - New version introduced (v1 still supported)
3. **v1 deprecated** - Announced 6 months before removal
4. **v1 sunset** - Version removed after deprecation period

### Deprecation Process

1. **Announce deprecation** in release notes and via email
2. **Add deprecation header** to v1 responses:
   ```
   Deprecation: true
   Sunset: Sat, 31 Dec 2024 23:59:59 GMT
   Link: <https://api.wealth-crm.com/v2/households>; rel="alternate"
   ```
3. **Monitor usage** of deprecated version
4. **Contact remaining users** 30 days before sunset
5. **Remove version** on sunset date

### Breaking vs Non-Breaking Changes

**Non-Breaking (patch/minor):**
- Adding new endpoints
- Adding new optional fields
- Adding new enum values (at end)
- Adding new response fields
- Relaxing validation constraints

**Breaking (major version):**
- Removing endpoints
- Removing or renaming fields
- Changing field types
- Adding required fields
- Tightening validation constraints
- Changing authentication method
- Changing error response format

## Rate Limiting

### Rate Limit Rules

**Default Limits:**
- 100 requests per minute per user
- 1000 requests per hour per user
- 10000 requests per day per user

**Endpoint-Specific:**
- Authentication: 5 attempts per minute
- Password reset: 3 attempts per hour
- Bulk exports: 10 per hour

### Rate Limit Headers

Included in every response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

When limit exceeded:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640000060

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retry_after": 60
  }
}
```

### Rate Limit Strategies

1. **Token Bucket** - Default for most endpoints
2. **Fixed Window** - Per-minute counts
3. **Sliding Window** - More precise tracking
4. **Adaptive** - Adjusts based on system load

## Authentication Flows

### JWT Authentication

**Login Flow:**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant MFA
    
    Client->>API: POST /auth/login<br/>{email, password}
    API->>Auth: Verify credentials
    Auth->>MFA: Send OTP
    MFA-->>Client: OTP via SMS/email
    Client->>API: POST /auth/verify-mfa<br/>{session_id, otp}
    API->>Auth: Verify OTP
    Auth-->>API: Generate tokens
    API-->>Client: {access_token, refresh_token}
```

**Request with Auth:**

```
GET /households
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Refresh:**

```
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### API Keys (for integrations)

```
GET /households
X-API-Key: crm_live_abc123def456
```

**API Key Properties:**
- Long-lived (1 year expiration)
- Scoped to specific permissions
- Can be revoked immediately
- Usage tracked and logged

## Request/Response Formats

### Request Format

**Headers:**
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
X-Request-ID: {unique-id}
```

**Body:**
```json
{
  "name": "Smith Family",
  "type": "FAMILY",
  "status": "PROSPECT",
  "primary_advisor_id": "user-123"
}
```

### Response Format

**Success Response:**
```json
{
  "id": "household-456",
  "name": "Smith Family",
  "type": "FAMILY",
  "status": "PROSPECT",
  "primary_advisor_id": "user-123",
  "aum": 0,
  "created_at": "2024-12-22T10:30:00Z",
  "updated_at": "2024-12-22T10:30:00Z"
}
```

**Collection Response:**
```json
{
  "data": [
    {
      "id": "household-123",
      "name": "Smith Family",
      "type": "FAMILY"
    },
    {
      "id": "household-456",
      "name": "Johnson Trust",
      "type": "TRUST"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  },
  "links": {
    "self": "/households?page=1",
    "first": "/households?page=1",
    "next": "/households?page=2",
    "last": "/households?page=8"
  }
}
```

### Field Selection (Sparse Fields)

Request specific fields only:

```
GET /households?fields=id,name,status
```

Response:
```json
{
  "data": [
    {
      "id": "household-123",
      "name": "Smith Family",
      "status": "ACTIVE"
    }
  ]
}
```

### Field Expansion

Include related resources:

```
GET /households/123?expand=primary_advisor,accounts
```

Response:
```json
{
  "id": "household-123",
  "name": "Smith Family",
  "primary_advisor": {
    "id": "user-456",
    "name": "John Advisor",
    "email": "john@firm.com"
  },
  "accounts": [
    {
      "id": "account-789",
      "account_name": "Joint Brokerage",
      "market_value": 500000
    }
  ]
}
```

## Pagination

### Offset-Based Pagination

**Request:**
```
GET /households?page=2&per_page=20
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "per_page": 20,
    "total_pages": 8
  },
  "links": {
    "self": "/households?page=2&per_page=20",
    "first": "/households?page=1&per_page=20",
    "prev": "/households?page=1&per_page=20",
    "next": "/households?page=3&per_page=20",
    "last": "/households?page=8&per_page=20"
  }
}
```

### Cursor-Based Pagination

For real-time data (transactions, audit logs):

**Request:**
```
GET /transactions?cursor=eyJpZCI6MTIzfQ&limit=50
```

**Response:**
```json
{
  "data": [...],
  "paging": {
    "cursors": {
      "before": "eyJpZCI6MTAwfQ",
      "after": "eyJpZCI6MTUwfQ"
    },
    "next": "/transactions?cursor=eyJpZCI6MTUwfQ&limit=50"
  }
}
```

## Filtering and Sorting

### Filtering

**Simple filters:**
```
GET /households?status=ACTIVE
GET /accounts?managed=true
GET /accounts?custodian=SCHWAB
```

**Multiple values (OR):**
```
GET /households?status=ACTIVE,INACTIVE
```

**Range filters:**
```
GET /households?aum_min=1000000&aum_max=5000000
GET /transactions?date_from=2024-01-01&date_to=2024-12-31
```

**Search:**
```
GET /households?search=smith
GET /persons?search=john@example.com
```

### Sorting

```
GET /households?sort=name
GET /households?sort=-aum          # Descending
GET /households?sort=status,name   # Multiple fields
```

### Combined Example

```
GET /accounts?
  household_id=household-123&
  status=OPEN&
  managed=true&
  market_value_min=100000&
  sort=-market_value&
  page=1&
  per_page=20
```

## Webhook Design

### Webhook Events

Subscribe to events for real-time notifications:

**Event Types:**
- `household.created`
- `household.updated`
- `household.deleted`
- `account.created`
- `account.updated`
- `position.updated`
- `transaction.created`
- `document.uploaded`

### Webhook Payload

```json
{
  "id": "evt_abc123",
  "type": "household.updated",
  "created": "2024-12-22T10:30:00Z",
  "data": {
    "object": {
      "id": "household-123",
      "name": "Smith Family",
      "status": "ACTIVE"
    },
    "previous": {
      "status": "PROSPECT"
    }
  },
  "webhook_id": "webhook-456"
}
```

### Webhook Signing

Verify webhook authenticity using HMAC signature:

```
X-Webhook-Signature: t=1640000000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
```

**Verification:**
```typescript
const signature = `${timestamp}.${JSON.stringify(payload)}`;
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(signature)
  .digest('hex');
```

### Webhook Retry Logic

- Retry failed webhooks up to 3 times
- Exponential backoff: 1m, 5m, 30m
- Mark webhook as failed after 3 attempts
- Notify customer of webhook failures

## API Documentation

### OpenAPI/Swagger Specification

Complete API documented using OpenAPI 3.0:

```yaml
openapi: 3.0.0
info:
  title: Wealth Management CRM API
  version: 1.0.0
  description: API for managing households, accounts, and investments

servers:
  - url: https://api.wealth-crm.com/v1
    description: Production
  - url: https://api-staging.wealth-crm.com/v1
    description: Staging

paths:
  /households:
    get:
      summary: List households
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [PROSPECT, ACTIVE, INACTIVE, CLOSED]
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HouseholdList'
```

### Interactive Documentation

- **Swagger UI**: https://api.wealth-crm.com/docs
- **ReDoc**: https://api.wealth-crm.com/redoc
- **Postman Collection**: Available for download

### Code Examples

Provide examples in multiple languages:

**JavaScript:**
```javascript
const response = await fetch('https://api.wealth-crm.com/v1/households', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const households = await response.json();
```

**Python:**
```python
import requests

response = requests.get(
    'https://api.wealth-crm.com/v1/households',
    headers={'Authorization': f'Bearer {token}'}
)
households = response.json()
```

**cURL:**
```bash
curl -X GET https://api.wealth-crm.com/v1/households \
  -H "Authorization: Bearer $TOKEN"
```

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-22  
**Owner**: Engineering Team  
**Review Cycle**: Quarterly
