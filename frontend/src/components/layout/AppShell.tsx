'use client';

import * as React from 'react';
import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../ui/utils';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';
import { GlobalSearch, useGlobalSearch } from '../ui/GlobalSearch';
import { useAuthStore } from '@/store/authStore';
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  ChartBarSquareIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  FunnelIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  BoltIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  ChartPieIcon,
  EnvelopeIcon,
  CubeTransparentIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  Cog6ToothIcon,
  PresentationChartLineIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ClipboardDocumentCheckIcon as TasksIconSolid,
  UserGroupIcon as ClientsIconSolid,
  CalendarDaysIcon as CalendarIconSolid,
  Cog6ToothIcon as SettingsIconSolid,
} from '@heroicons/react/24/solid';

// ============================================================================
// Types
// ============================================================================

export interface AppShellProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number;
}

interface NavGroup {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items: NavItem[];
  defaultOpen?: boolean;
}

// ============================================================================
// Navigation Configuration (matches SidebarNav)
// ============================================================================

const navigationGroups: NavGroup[] = [
  {
    id: 'overview',
    name: 'Overview',
    icon: PresentationChartLineIcon,
    defaultOpen: true,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: ChartBarSquareIcon },
      { name: 'Analytics', href: '/analytics', icon: ChartPieIcon },
      { name: 'Intelligence', href: '/intelligence', icon: SparklesIcon },
    ],
  },
  {
    id: 'relationships',
    name: 'Relationships',
    icon: UsersIcon,
    defaultOpen: true,
    items: [
      { name: 'Households', href: '/households', icon: BuildingOffice2Icon },
      { name: 'Clients', href: '/clients', icon: UserGroupIcon },
      { name: 'Accounts', href: '/accounts', icon: BriefcaseIcon },
      { name: 'Pipeline', href: '/pipeline', icon: FunnelIcon },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: ClipboardDocumentListIcon,
    defaultOpen: true,
    items: [
      { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentCheckIcon, badge: 5 },
      { name: 'Meetings', href: '/meetings', icon: CalendarDaysIcon },
      { name: 'Documents', href: '/documents', icon: DocumentDuplicateIcon },
      { name: 'Money Movements', href: '/money-movements', icon: BanknotesIcon },
      { name: 'Workflows', href: '/workflows', icon: BoltIcon },
      { name: 'Email Templates', href: '/email-templates', icon: EnvelopeIcon },
    ],
  },
  {
    id: 'admin',
    name: 'Administration',
    icon: WrenchScrewdriverIcon,
    defaultOpen: false,
    items: [
      { name: 'Billing', href: '/billing', icon: CurrencyDollarIcon },
      { name: 'Compliance', href: '/compliance', icon: ShieldCheckIcon },
      { name: 'Audit Log', href: '/audit', icon: DocumentTextIcon },
      { name: 'Integrations', href: '/integrations/custodian', icon: CubeTransparentIcon },
    ],
  },
];

// Bottom navigation for mobile
const mobileBottomNav = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon, iconActive: HomeIconSolid },
  { name: 'Clients', href: '/households', icon: UserGroupIcon, iconActive: ClientsIconSolid },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentCheckIcon, iconActive: TasksIconSolid },
  { name: 'Calendar', href: '/meetings', icon: CalendarDaysIcon, iconActive: CalendarIconSolid },
  { name: 'More', href: '#menu', icon: Cog6ToothIcon, iconActive: SettingsIconSolid },
];

// ============================================================================
// Hooks
// ============================================================================

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 768px)');
}

// ============================================================================
// Mobile Header Component
// ============================================================================

interface MobileHeaderProps {
  onMenuOpen: () => void;
  onSearchOpen: () => void;
  notificationCount?: number;
}

function MobileHeader({ onMenuOpen, onSearchOpen, notificationCount = 0 }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface border-b border-neutral-800 md:hidden">
      <div className="flex items-center justify-between h-14 px-4 safe-area-top">
        {/* Menu button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onMenuOpen}
          className="p-2 -ml-2 rounded-xl hover:bg-neutral-800 active:bg-neutral-700 transition-colors"
          aria-label="Open menu"
        >
          <Bars3Icon className="w-6 h-6 text-white" />
        </motion.button>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/20">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-semibold text-white">Wealth CRM</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onSearchOpen}
            className="p-2 rounded-xl hover:bg-neutral-800 active:bg-neutral-700 transition-colors"
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="w-6 h-6 text-neutral-400" />
          </motion.button>
          <Link
            href="/notifications"
            className="relative p-2 rounded-xl hover:bg-neutral-800 active:bg-neutral-700 transition-colors"
            aria-label="Notifications"
          >
            <BellIcon className="w-6 h-6 text-neutral-400" />
            {notificationCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white bg-status-error-text rounded-full flex items-center justify-center"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </motion.span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// Mobile Bottom Navigation
// ============================================================================

interface MobileBottomNavProps {
  onMoreClick: () => void;
}

function MobileBottomNav({ onMoreClick }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === '#menu') return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-neutral-800 md:hidden">
      <div className="flex items-center justify-around h-16 safe-area-bottom">
        {mobileBottomNav.map((item) => {
          const isActive = isItemActive(item.href);
          const Icon = isActive ? item.iconActive : item.icon;
          const isMore = item.href === '#menu';

          if (isMore) {
            return (
              <motion.button
                key={item.name}
                whileTap={{ scale: 0.95 }}
                onClick={onMoreClick}
                className="relative flex flex-col items-center justify-center w-full h-full"
              >
                <Icon className="w-6 h-6 text-neutral-500" />
                <span className="text-[10px] mt-1 font-medium text-neutral-500">
                  {item.name}
                </span>
              </motion.button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon
                  className={cn(
                    'w-6 h-6 transition-colors',
                    isActive ? 'text-accent-400' : 'text-neutral-500'
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  'text-[10px] mt-1 font-medium transition-colors',
                  isActive ? 'text-accent-400' : 'text-neutral-500'
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================================
// Mobile Drawer Menu
// ============================================================================

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(navigationGroups.filter(g => g.defaultOpen).map(g => g.id))
  );

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    router.push('/');
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50 md:hidden">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        {/* Drawer */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in duration-200"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <Dialog.Panel className="fixed inset-y-0 left-0 w-[300px] bg-sidebar shadow-lg safe-area-left flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/20">
                  <span className="text-white font-bold text-base">W</span>
                </div>
                <span className="font-semibold text-white tracking-tight">Wealth CRM</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-neutral-800"
              >
                <XMarkIcon className="w-5 h-5 text-neutral-400" />
              </motion.button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-2">
                {navigationGroups.map((group) => {
                  const isExpanded = expandedGroups.has(group.id);
                  const GroupIcon = group.icon;
                  const hasActiveItem = group.items.some(item => isItemActive(item.href));

                  return (
                    <div key={group.id}>
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                          hasActiveItem
                            ? 'text-white bg-neutral-800/50'
                            : 'text-neutral-400 hover:bg-neutral-800/30'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <GroupIcon
                            className={cn(
                              'w-5 h-5',
                              hasActiveItem ? 'text-accent-400' : 'text-neutral-500'
                            )}
                          />
                          <span className="uppercase text-xs tracking-wider font-semibold">
                            {group.name}
                          </span>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 0 : -90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDownIcon className="w-4 h-4 text-neutral-500" />
                        </motion.div>
                      </button>

                      {/* Group Items */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-1 ml-2 space-y-0.5">
                              {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = isItemActive(item.href);

                                return (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                      'group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all relative',
                                      isActive
                                        ? 'bg-neutral-800 text-white font-medium'
                                        : 'text-neutral-400 hover:bg-neutral-800/50 active:bg-neutral-800'
                                    )}
                                  >
                                    {/* Active indicator */}
                                    {isActive && (
                                      <motion.div
                                        layoutId="mobile-drawer-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-accent-400 rounded-r-full"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                      />
                                    )}
                                    <div className="flex items-center gap-3">
                                      <Icon
                                        className={cn(
                                          'w-[18px] h-[18px]',
                                          isActive ? 'text-accent-400' : 'text-neutral-500'
                                        )}
                                      />
                                      <span>{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {item.badge && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-accent-500/20 text-accent-300 rounded-full">
                                          {item.badge}
                                        </span>
                                      )}
                                      <ChevronRightIcon className="w-4 h-4 text-neutral-600" />
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Settings */}
              <div className="mt-4 pt-4 border-t border-neutral-800">
                <Link
                  href="/settings"
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                    pathname === '/settings'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800/50'
                  )}
                >
                  <Cog6ToothIcon className="w-5 h-5 text-neutral-500" />
                  <span className="font-medium">Settings</span>
                </Link>
              </div>
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-neutral-800">
              {user && (
                <div className="flex items-center gap-3 px-3 py-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Sign out</span>
              </motion.button>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}

// ============================================================================
// Main AppShell Component
// ============================================================================

/**
 * AppShell Component
 *
 * Responsive layout wrapper providing:
 * - Desktop: Sidebar navigation + TopBar
 * - Mobile: Header + Bottom navigation + Drawer menu
 * - Global search (⌘K)
 * - Smooth transitions between layouts
 */
export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const globalSearch = useGlobalSearch();
  const isMobile = useIsMobile();

  // Close mobile menu on route change
  const pathname = usePathname();
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-app overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SidebarNav
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          onMenuOpen={() => setMobileMenuOpen(true)}
          onSearchOpen={globalSearch.open}
          notificationCount={0}
        />
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top bar */}
        <div className="hidden md:block">
          <TopBar onSearchClick={globalSearch.open} />
        </div>

        {/* Content */}
        <main className={cn(
          'flex-1 overflow-y-auto',
          isMobile && 'pt-14 pb-16' // Account for fixed header and bottom nav
        )}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav onMoreClick={() => setMobileMenuOpen(true)} />
      )}

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Global Search Modal */}
      <GlobalSearch isOpen={globalSearch.isOpen} onClose={globalSearch.close} />
    </div>
  );
}

// ============================================================================
// Page Layout Components
// ============================================================================

/**
 * PageHeader Component
 *
 * Consistent page header with title, subtitle, and optional actions.
 * Responsive design with stacking on mobile.
 */
export interface PageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
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
    <div className={cn('border-b border-border bg-surface', className)} data-testid="page-header">
      <div className="container-page py-4 md:py-5">
        {breadcrumb && <div className="mb-2" data-testid="breadcrumb">{breadcrumb}</div>}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-display text-content-primary font-semibold truncate" data-testid="page-title">
              {title}
            </h1>
            {subtitle && (
              <div className="text-sm text-content-secondary mt-1 line-clamp-2" data-testid="page-subtitle">
                {subtitle}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0" data-testid="page-actions">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * PageContent Component
 *
 * Main content area with consistent padding.
 * Adjusts for mobile bottom navigation.
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
        'py-4 md:py-6',
        !fullWidth && 'container-page',
        fullWidth && 'px-4 md:px-6 lg:px-8',
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
 * Responsive grid for dashboard layouts.
 * Single column on mobile, configurable on desktop.
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
        'grid grid-cols-1 gap-4 md:gap-6',
        layoutStyles[layout],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * MobilePageActions Component
 *
 * Floating action button for mobile primary actions.
 */
export interface MobilePageActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function MobilePageActions({ children, className }: MobilePageActionsProps) {
  return (
    <div className={cn(
      'fixed right-4 bottom-20 z-30 md:hidden',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * FloatingActionButton Component
 *
 * Primary floating action button for mobile.
 */
export interface FloatingActionButtonProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
}

export function FloatingActionButton({
  icon: Icon,
  onClick,
  label,
  variant = 'primary',
}: FloatingActionButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center',
        variant === 'primary'
          ? 'bg-accent-500 text-white shadow-accent-500/30'
          : 'bg-neutral-800 text-white shadow-black/20'
      )}
      aria-label={label}
    >
      <Icon className="w-6 h-6" />
    </motion.button>
  );
}
