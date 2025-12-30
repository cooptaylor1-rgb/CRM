'use client';

import * as React from 'react';
import { cn } from '../ui/utils';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';

export interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell Component
 * 
 * Main layout wrapper providing:
 * - Sidebar navigation
 * - Top bar with search, create, notifications, user
 * - Main content area with proper scrolling
 */
export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen bg-app overflow-hidden">
      {/* Sidebar */}
      <SidebarNav
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <TopBar />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * PageHeader Component
 * 
 * Consistent page header with title, subtitle, and optional actions.
 */
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned actions */
  actions?: React.ReactNode;
  /** Breadcrumb or back link */
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('border-b border-border bg-surface', className)}>
      <div className="container-page py-5">
        {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-display text-content-primary">{title}</h1>
            {subtitle && (
              <p className="text-sm text-content-secondary mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

/**
 * PageContent Component
 * 
 * Main content area with consistent padding.
 */
export interface PageContentProps {
  children: React.ReactNode;
  className?: string;
  /** Full width (no max-width constraint) */
  fullWidth?: boolean;
}

export function PageContent({ children, className, fullWidth = false }: PageContentProps) {
  return (
    <div
      className={cn(
        'py-6',
        !fullWidth && 'container-page',
        fullWidth && 'px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * ContentGrid Component
 * 
 * Two-column responsive grid for dashboard layouts.
 */
export interface ContentGridProps {
  children: React.ReactNode;
  /** Layout mode */
  layout?: 'equal' | 'primary-secondary' | 'secondary-primary';
  className?: string;
}

export function ContentGrid({
  children,
  layout = 'equal',
  className,
}: ContentGridProps) {
  const layoutStyles = {
    equal: 'lg:grid-cols-2',
    'primary-secondary': 'lg:grid-cols-[1fr,380px]',
    'secondary-primary': 'lg:grid-cols-[380px,1fr]',
  };

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6',
        layoutStyles[layout],
        className
      )}
    >
      {children}
    </div>
  );
}
