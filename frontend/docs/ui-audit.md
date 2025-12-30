# UI/UX Audit: Wealth Management CRM

## Executive Summary

The current UI is functional but presents as a generic SaaS template rather than a premium wealth management platform. This audit identifies key issues and maps them to specific improvements.

---

## Architecture Overview

| Aspect | Current State |
|--------|---------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS 3.3 |
| Icon Library | @heroicons/react (available but unused - using emoji) |
| UI Components | @headlessui/react (available) |
| State | Zustand |
| Utilities | clsx, tailwind-merge |

---

## Current Issues by Category

### 1. Visual Identity (Severity: High)

| Issue | Location | Impact |
|-------|----------|--------|
| Emoji icons in production UI | Sidebar, Dashboard cards | Unprofessional, inconsistent sizing |
| Saturated primary colors | Tailwind config (blue-600, red-600) | "Template-y" appearance |
| Inconsistent color semantics | Alert banners, status pills | Visual noise, unclear hierarchy |
| Generic typography | Headers, metrics | Lacks institutional feel |
| bg-gray-50/gray-100 surfaces | Dashboard background | Too light, lacks depth |

### 2. Information Architecture (Severity: High)

| Issue | Location | Impact |
|-------|----------|--------|
| Stacked alert banners | Dashboard top | Visual chaos, banner blindness |
| No severity prioritization | Alerts array | Critical items not surfaced |
| Quick actions as inline buttons | Below alerts | Scattered, not grouped |
| Flat content hierarchy | Dashboard grid | Everything looks equally important |

### 3. Layout & Spacing (Severity: Medium)

| Issue | Location | Impact |
|-------|----------|--------|
| Inconsistent padding | Cards (p-6), sections (p-8) | Jarring rhythm |
| No max-width constraint | Content area | Too wide on large screens |
| Missing responsive breakpoints | Metric cards | 4-col cramped on 1280px |
| Header duplicates page context | Header.tsx | Wasted vertical space |

### 4. Component Quality (Severity: Medium)

| Issue | Location | Impact |
|-------|----------|--------|
| No reusable Button component | Inline styles everywhere | Inconsistent CTAs |
| No standardized Card component | Dashboard | Varied border/shadow/radius |
| Inline loading spinner | Dashboard | No skeleton states |
| No empty states | Tables, lists | Unclear when data is missing |
| Missing focus states | Links, buttons | A11y failure |

### 5. User Efficiency (Severity: Medium)

| Issue | Location | Impact |
|-------|----------|--------|
| No global search | TopBar | Forces navigation to find entities |
| No keyboard shortcuts | Sidebar, actions | Mouse-dependent |
| No "Create" menu | Actions | Actions scattered |
| No breadcrumbs | Protected pages | Lost context in deep pages |

---

## Recommended Changes

### Phase 1: Design Tokens (Foundation)

```
tokens/
├── colors (quiet luxury palette)
│   ├── slate/stone surfaces (not pure gray)
│   ├── desaturated blue accent
│   └── muted semantic colors
├── typography (system stack, clear hierarchy)
├── spacing (4px base, 8pt grid)
├── radii (subtle: 4/6/8px, not 12px+)
└── shadows (minimal, soft)
```

### Phase 2: UI Primitives

| Component | Purpose | Priority |
|-----------|---------|----------|
| `Button` | Primary/secondary/ghost/destructive variants | P0 |
| `Card` | Consistent container with optional header | P0 |
| `MetricCard` | Standardized KPI display | P0 |
| `Badge` | Status pills (severity-based) | P0 |
| `Table` | Sortable, hover states, empty state | P1 |
| `Callout` | Replaces stacked banners | P1 |
| `Skeleton` | Loading states for all data | P1 |
| `EmptyState` | Professional "no data" display | P1 |

### Phase 3: Layout System

| Component | Purpose |
|-----------|---------|
| `AppShell` | Sidebar + TopBar + Content wrapper |
| `SidebarNav` | Collapsible, icon-only mode, keyboard nav |
| `TopBar` | Search, Create menu, notifications, user |
| `PageHeader` | Title + subtitle + actions (replaces Header.tsx) |
| `ContentGrid` | Two-column responsive layout |

### Phase 4: Dashboard Redesign

**New Layout:**
```
┌────────────────────────────────────────────────────────┐
│ TopBar: [Search] [+ Create ▼] [🔔] [User]              │
├──────────┬─────────────────────────────────────────────┤
│          │ Page Header: Advisor Dashboard              │
│ Sidebar  │ Last sync: 2 min ago                        │
│          ├──────────────────────┬──────────────────────┤
│          │ Metrics Grid (2x2)   │ Action Center        │
│          │ • Households         │ • 3 Reviews Due      │
│          │ • AUM                │ • 2 KYC Expiring     │
│          │ • Revenue            │ • 1 Approval Needed  │
│          │ • Pipeline           │ [Review All →]       │
│          ├──────────────────────┼──────────────────────┤
│          │ Pipeline Snapshot    │ Upcoming Meetings    │
│          │ [Top 5 deals table]  │ [Next 3 meetings]    │
│          ├──────────────────────┴──────────────────────┤
│          │ Goals Progress (inline, compact)            │
└──────────┴─────────────────────────────────────────────┘
```

**Key Changes:**
1. Alerts → Consolidated "Action Center" module
2. Quick actions → "Create" dropdown in TopBar
3. KPI cards → Cleaner typography, no emoji, subtle icons
4. Activity stats → Moved to secondary position or removed
5. Goals → Compact inline progress bars

---

## Color Palette (Quiet Luxury)

```css
/* Surfaces */
--surface-primary: hsl(220, 16%, 8%);      /* Charcoal sidebar */
--surface-secondary: hsl(220, 14%, 12%);   /* Dark panels */
--surface-tertiary: hsl(220, 13%, 96%);    /* Light content bg */
--surface-card: hsl(0, 0%, 100%);          /* Cards */

/* Text */
--text-primary: hsl(220, 14%, 10%);
--text-secondary: hsl(220, 10%, 46%);
--text-tertiary: hsl(220, 8%, 64%);
--text-inverse: hsl(0, 0%, 98%);

/* Accent (desaturated blue-teal) */
--accent: hsl(200, 45%, 42%);
--accent-soft: hsl(200, 40%, 94%);

/* Semantic (muted) */
--semantic-success: hsl(152, 38%, 40%);
--semantic-warning: hsl(38, 60%, 50%);
--semantic-error: hsl(0, 50%, 50%);
--semantic-info: hsl(200, 45%, 42%);
```

---

## Typography Scale

| Token | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| `display` | 30px | 600 | 1.2 | Page titles |
| `title` | 20px | 600 | 1.3 | Section headers |
| `subtitle` | 16px | 500 | 1.4 | Card headers |
| `body` | 14px | 400 | 1.5 | Default text |
| `caption` | 12px | 400 | 1.4 | Secondary info |
| `overline` | 11px | 600 | 1.2 | Labels, uppercase |

---

## Accessibility Checklist

- [ ] All interactive elements have visible focus rings
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Sidebar items have aria-current="page"
- [ ] Form inputs have associated labels
- [ ] Loading states announced to screen readers
- [ ] Reduced motion support via prefers-reduced-motion

---

## Implementation Priority

| Phase | Components | Effort | Impact |
|-------|------------|--------|--------|
| 1 | Tokens + Button + Card + Badge | 2h | Foundation |
| 2 | AppShell + Sidebar + TopBar | 3h | Structural |
| 3 | Dashboard redesign | 4h | High visibility |
| 4 | Table + EmptyState + Skeleton | 2h | Polish |

**Total estimated: ~11 hours**

---

## Files to Modify

### Create New
- `src/components/ui/` - All primitives
- `src/styles/tokens.css` - CSS custom properties
- `docs/ui-changelog.md` - Documentation

### Modify
- `tailwind.config.js` - Extended tokens
- `src/app/globals.css` - Import tokens
- `src/app/(protected)/layout.tsx` - New AppShell
- `src/app/(protected)/dashboard/page.tsx` - Redesigned
- `src/components/layout/Sidebar.tsx` - Refactored
- `src/components/layout/Header.tsx` - Replaced by TopBar

---

## Follow-up Screens (Post-Dashboard)

1. **Households** - Apply Table component, add filters UI
2. **Accounts** - Same table treatment, status badges
3. **Pipeline** - Kanban or table view, deal cards
4. **Tasks** - Priority-sorted list, inline completion
5. **Meetings** - Calendar integration, agenda view
