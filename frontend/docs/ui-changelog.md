# UI/UX Redesign Changelog

## Overview

This document tracks all changes made as part of the "quiet luxury" institutional wealth management UI redesign. The goal was to create a calm, minimal, confident, and information-dense interface inspired by tools like Palantir, Carta, and Brex.

---

## Version 1.0.0 — Foundation Release

**Date:** June 2025

### Design System

#### 1. Design Tokens (`/src/styles/tokens.css`)

Created a comprehensive CSS custom properties system:

- **Color Palette**
  - Neutral: Slate-based scale (25-950) with sophisticated undertones
  - Accent: Desaturated teal/blue for primary actions
  - Semantic: Muted success, warning, error, info colors
  
- **Semantic Tokens**
  - Surface backgrounds (`--bg-app`, `--bg-surface`, `--bg-surface-secondary`)
  - Text colors (`--text-primary`, `--text-secondary`, `--text-tertiary`)
  - Borders (`--border-primary`, `--border-secondary`, `--border-focus`)
  - Interactive states (`--interactive-primary`, `--interactive-primary-hover`)
  - Status colors for alerts and badges

- **Typography**
  - Font sizes: xs (11px) through 3xl (30px)
  - Line heights: tight, snug, normal, relaxed
  - Default font size: 14px (professional density)

- **Spacing** (4px base unit)
  - Scale from 0-16 in consistent increments

- **Radii**
  - sm (4px), md (6px), lg (8px), xl (12px)

- **Shadows**
  - Subtle, low-contrast shadows for depth without drama

- **Dark Mode**
  - Full dark theme support via `.dark` class

---

#### 2. Tailwind Configuration (`/tailwind.config.js`)

Completely rewrote to use semantic token system:

```js
colors: {
  surface: 'hsl(var(--bg-surface))',
  'surface-secondary': 'hsl(var(--bg-surface-secondary))',
  content: {
    primary: 'hsl(var(--text-primary))',
    secondary: 'hsl(var(--text-secondary))',
    tertiary: 'hsl(var(--text-tertiary))',
    link: 'hsl(var(--text-link))',
  },
  // ... etc
}
```

Added custom utilities:
- `.text-display`, `.text-subtitle`, `.text-caption`, `.text-overline`
- `.container-page` for max-width constraints
- Custom scrollbar styling
- Skeleton animation keyframes

---

### UI Components

#### 3. Utility Functions (`/src/components/ui/utils.ts`)

- `cn()` — Tailwind class merging with clsx
- `formatCurrency()` — Abbreviated currency display ($1.2M)
- `formatDate()` — Localized date formatting
- `formatDateTime()` — Date with time
- `formatRelativeTime()` — "2 hours ago" style

---

#### 4. Button (`/src/components/ui/Button.tsx`)

Variants:
- `primary` — Accent color, solid
- `secondary` — Neutral border, subtle
- `ghost` — No background
- `danger` — Error state

Sizes: `sm`, `md`, `lg`

Features:
- Loading spinner state
- Icon support (left/right)
- `IconButton` variant for icon-only buttons

---

#### 5. Card (`/src/components/ui/Card.tsx`)

Features:
- Subtle border, white background
- `noPadding` prop for tables
- `CardHeader` with title, subtitle, action slot
- `CardContent` and `CardFooter` subcomponents

---

#### 6. Badge (`/src/components/ui/Badge.tsx`)

Variants: `default`, `success`, `warning`, `error`, `info`

Sizes: `sm`, `md`

Related:
- `StatusBadge` — Dot + label combination
- `CountBadge` — Circular number indicator

---

#### 7. MetricCard (`/src/components/ui/MetricCard.tsx`)

Purpose: Display KPIs in a clean, scannable format

Features:
- Icon options: `households`, `currency`, `revenue`, `pipeline`
- Optional change indicator with up/down trend
- Currency formatting option
- Subtext for context

`MetricGrid` — Responsive grid wrapper (1-5 columns)

---

#### 8. Progress (`/src/components/ui/Progress.tsx`)

Features:
- Animated fill bar
- `GoalProgress` variant showing actual vs target
- Progress percentage display
- Success variant when goal exceeded

---

#### 9. Callout (`/src/components/ui/Callout.tsx`)

Variants: `info`, `warning`, `success`, `error`

Related:
- `ActionItem` — Line item with severity indicator
- `ActionCenter` — Card wrapper for action items list

---

#### 10. Table (`/src/components/ui/Table.tsx`)

Semantic table components:
- `Table`, `TableHeader`, `TableBody`, `TableFooter`
- `TableRow`, `TableHead`, `TableCell`
- `TableCaption`

`EmptyState` — Placeholder for empty tables

---

#### 11. Skeleton (`/src/components/ui/Skeleton.tsx`)

Loading placeholders:
- `Skeleton` — Base animated placeholder
- `SkeletonText` — Multiple lines
- `SkeletonCard` — Card-shaped placeholder
- `SkeletonTable` — Table with row placeholders
- `SkeletonDashboard` — Full dashboard loading state

---

### Layout Components

#### 12. SidebarNav (`/src/components/layout/SidebarNav.tsx`)

Features:
- Dark background (bg-sidebar)
- Heroicon integration (replaced emoji icons)
- Active state highlighting
- Collapsible support (width toggle)
- Logout button with auth store integration

Navigation Items:
- Dashboard, Households, Pipeline, Tasks, Meetings
- Accounts, Workflows, Compliance, Audit Log

---

#### 13. TopBar (`/src/components/layout/TopBar.tsx`)

Features:
- Global search input (UI only)
- "Create" dropdown menu (Headless UI)
- Notifications bell with badge
- User menu dropdown

---

#### 14. AppShell (`/src/components/layout/AppShell.tsx`)

Main layout wrapper combining:
- SidebarNav (left)
- TopBar (top)
- Main content area

Exports:
- `PageHeader` — Title, subtitle, actions slot
- `PageContent` — Padded content wrapper
- `ContentGrid` — Two-column layouts (primary-secondary, secondary-primary, equal)

---

### Page Redesigns

#### 15. Dashboard (`/src/app/(protected)/dashboard/page.tsx`)

**Before:**
- Stacked alert banners at top
- Quick action buttons row
- Basic metric cards with emoji icons
- Scattered layout

**After:**
- Clean `PageHeader` with timestamp
- `MetricGrid` with 4 `MetricCard` components
- Two-column `ContentGrid` layout:
  - Left: Goals progress, Top clients table, Activity summary
  - Right: Action center, Quick stats, Upcoming meetings
- `GoalProgress` bars for revenue/meetings/clients
- `ActionCenter` with severity-sorted items
- Proper loading skeleton

---

#### 16. Protected Layout (`/src/app/(protected)/layout.tsx`)

Updated to use new `AppShell` component, removing inline header/sidebar.

---

### Files Created

```
/frontend/src/styles/tokens.css
/frontend/src/components/ui/utils.ts
/frontend/src/components/ui/Button.tsx
/frontend/src/components/ui/Card.tsx
/frontend/src/components/ui/Badge.tsx
/frontend/src/components/ui/MetricCard.tsx
/frontend/src/components/ui/Progress.tsx
/frontend/src/components/ui/Callout.tsx
/frontend/src/components/ui/Table.tsx
/frontend/src/components/ui/Skeleton.tsx
/frontend/src/components/ui/index.ts
/frontend/src/components/layout/SidebarNav.tsx
/frontend/src/components/layout/TopBar.tsx
/frontend/src/components/layout/AppShell.tsx
/frontend/docs/ui-audit.md
/frontend/docs/ui-changelog.md (this file)
```

### Files Modified

```
/frontend/tailwind.config.js
/frontend/src/app/globals.css
/frontend/src/app/(protected)/layout.tsx
/frontend/src/app/(protected)/dashboard/page.tsx
```

---

## Version 2.0.0 — Palantir-Level Polish

**Date:** June 2025

### Enhanced Design Tokens

#### Data Visualization Palette
Added 7-color chart palette for consistent data visualization:
```css
--chart-1: 220 70% 50%    /* Blue */
--chart-2: 160 60% 45%    /* Teal */
--chart-3: 30 80% 55%     /* Orange */
--chart-4: 280 65% 60%    /* Purple */
--chart-5: 340 75% 55%    /* Rose */
--chart-6: 200 70% 50%    /* Cyan */
--chart-7: 45 90% 55%     /* Yellow */
```

#### Z-Index Scale
Proper layering system:
- `--z-base`: 0
- `--z-dropdown`: 10
- `--z-sticky`: 20
- `--z-modal`: 50
- `--z-popover`: 40
- `--z-tooltip`: 60
- `--z-max`: 9999

#### Animation Tokens
Professional easing functions:
- `--ease-default`, `--ease-linear`, `--ease-in`, `--ease-out`, `--ease-in-out`
- `--ease-bounce`, `--ease-spring` for micro-interactions
- Duration tokens: `--duration-instant`, `--duration-fast`, `--duration-default`, `--duration-slow`

#### Input System Tokens
Form control sizes:
- `--input-height-sm`: 28px
- `--input-height-md`: 32px
- `--input-height-lg`: 40px

#### High Contrast Mode
Full support for `prefers-contrast: more` media query.

#### Print Styles
Optimized print output with disabled backgrounds and forced black text.

---

### New Form Components

#### Input (`/src/components/ui/Input.tsx`)
- Size variants: `sm`, `md`, `lg`
- Left/right icon support
- Addon slots for prefix/suffix
- Validation states (error, success)
- Loading state with spinner
- Full label/description/error system

#### Textarea (`/src/components/ui/Input.tsx`)
- Auto-resize option
- Error state styling
- Consistent API with Input

#### FormGroup & FormRow
Layout utilities for form organization:
- `FormGroup`: Vertical spacing
- `FormRow`: Responsive grid layout

---

#### Select (`/src/components/ui/Select.tsx`)

Custom accessible dropdown using Headless UI:
- Keyboard navigation
- Option descriptions
- Error state support
- Size variants matching Input

`NativeSelect` variant for simpler use cases.

---

#### Checkbox, Radio, Switch (`/src/components/ui/Checkbox.tsx`)

Form controls with consistent styling:
- `Checkbox`: Standard checkbox with indeterminate support
- `Radio`: Radio button with RadioGroup container
- `Switch`: Toggle switch with proper ARIA attributes
- `CheckboxGroup`, `RadioGroup`: Grouping containers

Features:
- Size variants (sm, md, lg)
- Label and description support
- Error states

---

### Interactive Components

#### Avatar (`/src/components/ui/Avatar.tsx`)

User display component:
- Size variants: xs, sm, md, lg, xl, 2xl
- Circle or square shape
- Status indicators (online, offline, busy, away)
- Automatic initials fallback
- Consistent color generation from name

Related:
- `AvatarGroup`: Stacked avatar display with overflow
- `AvatarWithName`: Avatar with name and subtitle

---

#### Tooltip (`/src/components/ui/Tooltip.tsx`)

Lightweight tooltip for contextual help:
- Four positioning options: top, bottom, left, right
- Alignment control
- Configurable delay
- Pure CSS implementation (no heavy dependencies)

`TooltipInfo` — Info icon with tooltip for inline help.

---

#### Modal (`/src/components/ui/Modal.tsx`)

Accessible dialog using Headless UI:
- Multiple sizes: sm, md, lg, xl, full
- Backdrop blur effect
- Close button option
- Keyboard dismissal (Escape)
- Focus trapping

Related:
- `ModalFooter`: Action button area
- `ConfirmModal`: Pre-styled confirmation dialog
- `SlideOver`: Slide-out panel for detailed views

---

#### Command Palette (`/src/components/ui/CommandPalette.tsx`)

Global command palette (⌘K):
- Fuzzy search filtering
- Grouped results
- Keyboard shortcuts display
- Recent items section
- Full keyboard navigation

`useCommandPalette` hook for state management.

---

### Data Visualization

#### Sparkline (`/src/components/ui/DataViz.tsx`)
SVG-based inline micro chart for trends.

#### TrendIndicator
Direction arrow with percentage change.

#### MiniBarChart
Horizontal progress bar with optional target line.

#### DonutChart
Simple ring chart for percentages.

#### ComparisonBar
Side-by-side comparison visualization.

---

### DataTable (`/src/components/ui/DataTable.tsx`)

Full-featured data table:
- Column sorting (asc/desc/none)
- Row selection (single, multi, all)
- Search/filtering
- Pagination with page size control
- Loading skeleton state
- Empty state
- Striped rows option
- Sticky header
- Compact mode

---

### Keyboard Navigation Hooks (`/src/hooks/useKeyboard.ts`)

#### useKeyboardNavigation
Manage arrow key navigation in lists.

#### useFocusTrap
Trap focus within modal/dialog containers.

#### useRovingTabIndex
Roving tabindex pattern for widget navigation.

#### useHotkey
Register global keyboard shortcuts.

#### useEscapeKey
Handle escape key dismissal.

#### useClickOutside
Detect clicks outside an element.

---

### Animation System (`/src/hooks/useAnimation.ts`)

#### useReducedMotion
Respect user's motion preferences.

#### useAnimatedNumber
Smooth number counter animations.

#### useStaggeredAnimation
Create staggered reveal effects for lists.

#### useTransition
Manage enter/exit animation states.

#### useScrollAnimation
Intersection observer-based scroll animations.

#### useSpring
Physics-based spring animations.

---

## Design Principles Applied

1. **Information Density** — Smaller base font (14px), compact spacing
2. **Visual Hierarchy** — Clear headings, muted secondary text
3. **Quiet Luxury** — Slate neutrals, desaturated accent, subtle shadows
4. **Consistency** — Token-based system ensures uniform styling
5. **Accessibility** — Focus rings, reduced motion support, proper contrast
6. **Scalability** — Component-based architecture for easy extension
7. **Performance** — Pure CSS animations, minimal JS dependencies
8. **Keyboard-First** — Full keyboard navigation support

---

## Component Summary

| Category | Components |
|----------|------------|
| **Foundation** | tokens.css, utils.ts, cn() |
| **Buttons** | Button, IconButton |
| **Cards** | Card, CardHeader, CardContent, CardFooter |
| **Feedback** | Badge, StatusBadge, CountBadge, Callout |
| **Metrics** | MetricCard, MetricGrid, Progress, GoalProgress |
| **Tables** | Table, TableRow, TableHead, TableCell, DataTable |
| **Forms** | Input, Textarea, Select, NativeSelect, Checkbox, Radio, Switch |
| **Overlays** | Modal, ConfirmModal, SlideOver, Tooltip, CommandPalette |
| **Data Viz** | Sparkline, TrendIndicator, MiniBarChart, DonutChart |
| **Layout** | AppShell, SidebarNav, TopBar, PageHeader, PageContent |
| **Loading** | Skeleton, SkeletonText, SkeletonCard, SkeletonTable |
| **User** | Avatar, AvatarGroup, AvatarWithName |

---

## Migration Notes

To migrate existing pages to the new component system:

1. Replace `Header` with `AppShell` + `PageHeader`
2. Use semantic color classes (`text-content-primary`) instead of hardcoded grays
3. Replace inline styles with token-based utilities
4. Use `Card` component for content sections
5. Use `DataTable` for data-heavy listings
6. Add `CommandPalette` to AppShell for global search

---

## File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── index.ts           # Barrel export
│   │   ├── utils.ts           # Utilities
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── MetricCard.tsx
│   │   ├── Progress.tsx
│   │   ├── Callout.tsx
│   │   ├── Table.tsx
│   │   ├── DataTable.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Avatar.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Modal.tsx
│   │   ├── CommandPalette.tsx
│   │   └── DataViz.tsx
│   └── layout/
│       ├── SidebarNav.tsx
│       ├── TopBar.tsx
│       └── AppShell.tsx
├── hooks/
│   ├── index.ts
│   ├── useKeyboard.ts
│   └── useAnimation.ts
└── styles/
    └── tokens.css
```

