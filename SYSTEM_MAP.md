# Wealth Management CRM - System Map

## Overview
A comprehensive CRM system for wealth management firms, featuring household/account/person management, document workflows, compliance tracking, analytics, and integrations with custodians and calendar systems.

---

## Tech Stack

### Backend
| Component | Version | Purpose |
|-----------|---------|---------|
| NestJS | 10.x | Application framework |
| TypeORM | 0.3.x | Database ORM |
| PostgreSQL | 15 | Primary database |
| Redis | 7 | Caching & sessions |
| JWT | - | Authentication |
| bcrypt | - | Password hashing |

### Frontend
| Component | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.2 | React framework |
| React | 18 | UI library |
| TanStack Query | 5.x | Server state management |
| Zustand | 4.x | Client state management |
| Tailwind CSS | 3.x | Styling |
| Framer Motion | 11.x | Animations |
| Lucide React | - | Icons |

### Infrastructure
| Service | Port | Purpose |
|---------|------|---------|
| Backend API | 3001 | NestJS REST API |
| Frontend | 3000 | Next.js application |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Caching |

---

## Database Schema (58 tables)

### Core Entities
- `households` - Client household units (primary entity)
- `accounts` - Investment accounts linked to households
- `persons` - Individual contacts (clients, beneficiaries, etc.)
- `users` - System users (advisors, compliance, operations)
- `roles` - RBAC role definitions

### Documents & Compliance
- `documents` - Document storage with versioning
- `compliance_reviews` - Compliance review records
- `audit_events` - Full audit trail

### Tasks & Workflows
- `tasks` - Task management with categories, priorities
- `workflow_templates` - Reusable workflow definitions
- `workflow_instances` - Active workflow instances
- `prospects` - Sales pipeline prospects
- `prospect_activities` - Prospect interaction history

### Meetings & Communications
- `meetings` - Client meeting records
- `meeting_notes` - Meeting notes with AI summary support
- `outlook_emails` - Synced Outlook emails
- `outlook_events` - Synced calendar events
- `outlook_connections` - OAuth connections

### Integrations
- `custodian_connections` - Custodian API connections (Schwab)
- `custodian_account_links` - Account-to-custodian mappings
- `custodian_sync_logs` - Sync history

### Customization
- `custom_field_definitions` - Custom field schemas
- `custom_field_values` - Custom field data
- `tags` - Tagging system
- `entity_tags` - Tag-to-entity mappings
- `saved_views` - User-defined views/filters

### Analytics
- `client_profitability` - Client profitability metrics
- `advisor_metrics` - Advisor performance
- `firm_metrics` - Firm-wide analytics
- `activity_snapshots` - Activity tracking

### Allocations & Fees
- `target_asset_allocations` - Target allocation models
- `allocation_line_items` - Asset class targets
- `fee_schedules` - Fee structure definitions
- `fee_tiers` - Tiered fee rates
- `fee_history` - Fee calculation history

### Legal Entities
- `legal_entities` - Trusts, LLCs, etc.
- `entity_relationships` - Entity-to-person relationships
- `entity_distributions` - Distribution records
- `entity_documents` - Entity-linked documents

---

## API Routes (100+ endpoints)

### Authentication
```
POST /api/auth/login          # Login with email/password
POST /api/auth/refresh        # Refresh JWT token
GET  /api/auth/me             # Get current user
POST /api/auth/logout         # Logout
```

### Core CRUD
```
/api/households     # Household management
/api/accounts       # Account management
/api/persons        # Person/contact management
/api/documents      # Document management
/api/compliance     # Compliance reviews
```

### Features
```
/api/api/tasks         # Task management
/api/api/pipeline      # Sales pipeline
/api/api/meetings      # Meeting scheduling
/api/api/preferences   # Client preferences
/api/api/security      # KYC, SAR, incidents
```

### Integrations
```
/api/integrations/outlook/*   # Outlook email/calendar
/api/custodian/*              # Custodian sync (Schwab)
```

### Analytics
```
/api/analytics/dashboard      # Dashboard metrics
/api/analytics/profitability  # Client profitability
/api/analytics/firm/*         # Firm-wide metrics
```

### Customization
```
/api/customization/fields     # Custom fields
/api/customization/tags       # Tags
/api/customization/views      # Saved views
```

### Workflows
```
/api/workflows/templates      # Workflow templates
/api/workflows/instances      # Active workflows
```

### Collaboration
```
/api/notifications            # Notification center
/api/comments                 # Commenting system
/api/activity                 # Activity feed
```

### Asset Allocations
```
/api/allocations/target       # Target allocations
/api/allocations/fees         # Fee schedules
```

---

## Frontend Routes

### Protected Routes (require auth)
```
/dashboard          # Main dashboard
/households         # Household list
/households/:id     # Household detail
/accounts           # Account list
/accounts/:id       # Account detail
/clients            # Client/person list
/pipeline           # Sales pipeline
/tasks              # Task management
/meetings           # Meeting calendar
/documents          # Document library
/analytics          # Analytics dashboard
/compliance         # Compliance dashboard
/settings           # User settings
```

### Public Routes
```
/login              # Login page
```

---

## Authentication & Authorization

### RBAC Roles
1. **admin** - Full system access
2. **advisor** - Client management, limited compliance
3. **compliance_officer** - Compliance and audit focus
4. **operations** - Operational tasks
5. **read_only** - View-only access

### JWT Configuration
- Access Token: 15 minutes
- Refresh Token: 7 days
- Encryption: bcrypt (10 rounds)

---

## Key Frontend Components

### Layout
- `SidebarNav` - Main navigation
- `TopBar` - Search, notifications, user menu
- `PageHeader` - Page titles and actions

### Data Display
- `DataTable` - Sortable, filterable tables
- `MetricCard` - KPI displays
- `StatusBadge` - Status indicators
- `TrendIndicator` - Trend arrows

### Forms
- `Input`, `Select`, `Textarea` - Form controls
- `DatePicker` - Date selection
- `CommandPalette` - Global search (Ctrl+K)

### Features
- `NotificationCenter` - In-app notifications
- `ActivityFeed` - Recent activity
- `Comments` - Entity commenting
- `AssetAllocationManager` - Allocation editing
- `FeeScheduleManager` - Fee configuration

---

## Services Layer

### Backend Services
```typescript
AuthService           // Authentication
HouseholdsService     // Household CRUD
AccountsService       // Account CRUD
PersonsService        // Person CRUD
DocumentsService      // Document management
TasksService          // Task management
PipelineService       // Sales pipeline
MeetingsService       // Meeting scheduling
WorkflowsService      // Workflow engine
AnalyticsService      // Analytics/reporting
ComplianceService     // Compliance tracking
CollaborationService  // Activity, comments, notifications
CustomizationService  // Custom fields, tags, views
CustodianService      // Custodian integrations
OutlookService        // Outlook integration
AllocationsService    // Asset allocation
AuditService          // Audit logging
```

### Frontend Services
```typescript
api.ts                    // Base API client (Axios)
auth.service.ts           // Authentication
accounts.service.ts       // Accounts API
households.service.ts     // Households API
clients.service.ts        // Clients/persons API
documents.service.ts      // Documents API
tasks.service.ts          // Tasks API
pipeline.service.ts       // Pipeline API
meetings.service.ts       // Meetings API
workflows.service.ts      // Workflows API
analytics.service.ts      // Analytics API
collaboration.service.ts  // Collaboration API
customization.service.ts  // Customization API
outlook.service.ts        // Outlook integration
custodian.service.ts      // Custodian integration
allocations.service.ts    // Allocations API
notifications.service.ts  // Notifications API
search.service.ts         // Search API
```

---

## State Management

### Server State (TanStack Query) ✅ IMPLEMENTED
- QueryClientProvider wraps entire app
- Automatic caching (30s stale time, 5min gc time)
- Background refetching on window focus

#### Custom Hooks
| Hook | Purpose |
|------|---------|
| `useHouseholds` | List all households with caching |
| `useHousehold` | Single household with initial data from list |
| `useCreateHousehold` | Optimistic create with rollback |
| `useUpdateHousehold` | Optimistic update with rollback |
| `useDeleteHousehold` | Optimistic delete with rollback |
| `usePrefetchHousehold` | Prefetch on hover |
| `useTasks` | List tasks with filters |
| `useMyTasks` | Current user's tasks |
| `useOverdueTasks` | Overdue tasks (auto-refetch every 60s) |
| `useTasksDueSoon` | Tasks due within N days |
| `useCompleteTask` | Complete with celebration toast |

### Client State (Zustand)
- `authStore` - Auth state, current user
- UI state (modals, sidebars)
- Form state

---

## Magic Layer Features ✨

### 1. Smart Command Palette (`SmartCommandPalette.tsx`) ✅
Location: `/frontend/src/components/features/SmartCommandPalette.tsx`

**Features:**
- Natural language commands ("schedule meeting with John", "call Sarah")
- Context-aware suggestions based on current page
- Smart time-based suggestions (morning task review, etc.)
- Overdue task alerts shown proactively
- Command preview before execution
- Beautiful animations with Framer Motion

**Commands Supported:**
- `call/phone [name]` - Initiate phone call
- `email/mail [name]` - Open email composer
- `schedule meeting with [name]` - Create meeting
- `add task [description]` - Quick task creation
- `go to [page]` - Navigate to page
- `find/search [query]` - Search entities

### 2. Activity Timeline (`ActivityTimeline.tsx`) ✅
Location: `/frontend/src/components/features/ActivityTimeline.tsx`

**Features:**
- Beautiful timeline visualization of all client touchpoints
- Grouped by time period (Today, This Week, This Month, etc.)
- Filterable by activity type (email, call, meeting, document, etc.)
- Expandable activity details
- Color-coded activity types
- Animated transitions

**Activity Types:**
- Email, Call, Meeting, Document
- Task, Note, Transaction
- Onboarding, Review

### 3. React Query Integration ✅
Location: `/frontend/src/providers/QueryProvider.tsx`

**Configuration:**
- 30 second stale time
- 5 minute garbage collection
- Automatic refetch on window focus
- Single retry on failure

---

## Default Credentials

```
Email: admin@example.com
Password: Admin123!
Role: admin
```

---

## Known Issues / Technical Debt

1. **Double API prefix** - Some routes use `/api/api/` (tasks, pipeline, meetings, preferences, security)
2. **No pagination** - Most list endpoints lack pagination
3. **No real-time updates** - WebSocket support not implemented
4. **Mock integrations** - Outlook and Schwab integrations use mocked responses
5. **No test coverage** - Unit/integration tests need implementation

---

## Future Magic Layer Opportunities

### High Impact (Next Pass)
1. **Meeting Prep** - Auto-generated meeting briefs from activity history
2. **Client Insights** - AI-powered relationship health scores
3. **Smart Notifications** - Context-aware notification timing

### Medium Impact
4. **Inline Editing** - Edit-in-place for common fields
5. **Keyboard Shortcuts** - Power user shortcuts (vim-style navigation)
6. **Bulk Actions** - Select and operate on multiple items

### Polish
7. **Micro-animations** - Feedback animations on all interactions
8. **Empty States** - Helpful empty state designs with actions
9. **Undo/Redo** - Action reversibility with toast notifications

---

*Generated: January 2026*
*Branch: magic-crm-pass-1*
*Magic Layer: v1.0 - Query caching, Smart Command Palette, Activity Timeline*

