'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../ui/utils';
import { useAuthStore } from '@/store/authStore';
import {
  ChartBarSquareIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  FunnelIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  BoltIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  ChartPieIcon,
  EnvelopeIcon,
  CubeTransparentIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  Cog6ToothIcon,
  StarIcon,
  PresentationChartLineIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export interface SidebarNavProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
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

// Organized navigation structure
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

// Quick access / favorites (could be user-configurable)
const quickAccess: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarSquareIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentCheckIcon },
  { name: 'Households', href: '/households', icon: BuildingOffice2Icon },
];

// Storage key for expanded state
const EXPANDED_GROUPS_KEY = 'sidebar-expanded-groups';
const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export function SidebarNav({ collapsed = false, onCollapsedChange }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Initialize expanded groups from localStorage or defaults
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(EXPANDED_GROUPS_KEY);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    }
    return new Set(navigationGroups.filter(g => g.defaultOpen).map(g => g.id));
  });

  // Persist expanded state
  useEffect(() => {
    localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify([...expandedGroups]));
  }, [expandedGroups]);

  // Persist collapsed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(collapsed));
    }
  }, [collapsed]);

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

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Find which group contains the active route
  const activeGroupId = navigationGroups.find(group =>
    group.items.some(item => isItemActive(item.href))
  )?.id;

  // Auto-expand group containing active route
  useEffect(() => {
    if (activeGroupId && !expandedGroups.has(activeGroupId)) {
      setExpandedGroups(prev => new Set([...prev, activeGroupId]));
    }
  }, [activeGroupId]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-neutral-800 transition-all duration-300 ease-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-neutral-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <motion.div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white font-bold text-base">W</span>
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-semibold text-white tracking-tight text-lg"
              >
                Wealth CRM
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Quick Access (when not collapsed) */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-3 border-b border-neutral-800/50"
          >
            <div className="flex items-center gap-2 px-3 mb-2">
              <StarIconSolid className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Quick Access
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickAccess.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                      isActive
                        ? 'bg-accent-500/20 text-accent-300 ring-1 ring-accent-500/30'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        <div className="space-y-1">
          {navigationGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const GroupIcon = group.icon;
            const hasActiveItem = group.items.some(item => isItemActive(item.href));

            return (
              <div key={group.id} className="mb-1">
                {/* Group Header */}
                <button
                  onClick={() => !collapsed && toggleGroup(group.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    hasActiveItem
                      ? 'text-white'
                      : 'text-neutral-400 hover:text-neutral-200',
                    collapsed ? 'justify-center' : 'justify-between'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon
                      className={cn(
                        'w-5 h-5 shrink-0 transition-colors',
                        hasActiveItem ? 'text-accent-400' : 'text-neutral-500'
                      )}
                    />
                    {!collapsed && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        {group.name}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 0 : -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDownIcon className="w-4 h-4 text-neutral-500" />
                    </motion.div>
                  )}
                </button>

                {/* Group Items */}
                <AnimatePresence initial={false}>
                  {(isExpanded || collapsed) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className={cn('mt-1 space-y-0.5', !collapsed && 'ml-2')}>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = isItemActive(item.href);

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all relative',
                                isActive
                                  ? 'bg-neutral-800 text-white font-medium'
                                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200',
                                collapsed && 'justify-center'
                              )}
                              aria-current={isActive ? 'page' : undefined}
                            >
                              {/* Active indicator */}
                              {isActive && (
                                <motion.div
                                  layoutId="sidebar-active-indicator"
                                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-accent-400 rounded-r-full"
                                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                              )}
                              <Icon
                                className={cn(
                                  'w-[18px] h-[18px] shrink-0 transition-colors',
                                  isActive
                                    ? 'text-accent-400'
                                    : 'text-neutral-500 group-hover:text-neutral-400'
                                )}
                              />
                              {!collapsed && (
                                <>
                                  <span className="truncate flex-1">{item.name}</span>
                                  {item.badge && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-accent-500/20 text-accent-300 rounded-full">
                                      {item.badge}
                                    </span>
                                  )}
                                </>
                              )}
                              {/* Tooltip for collapsed state */}
                              {collapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                  {item.name}
                                  {item.badge && (
                                    <span className="ml-1.5 px-1 py-0.5 text-[10px] bg-accent-500/30 rounded">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                              )}
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
      </nav>

      {/* Settings Link */}
      <div className="px-3 py-2 border-t border-neutral-800/50">
        <Link
          href="/settings"
          className={cn(
            'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
            pathname === '/settings'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200',
            collapsed && 'justify-center'
          )}
        >
          <Cog6ToothIcon className="w-5 h-5 shrink-0 text-neutral-500 group-hover:text-neutral-400" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-neutral-800">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-medium">
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
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
            'text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-all',
            collapsed && 'justify-center'
          )}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      {onCollapsedChange && (
        <motion.button
          onClick={() => onCollapsedChange(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all shadow-lg z-10"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
          </motion.div>
        </motion.button>
      )}
    </aside>
  );
}
