'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export interface SidebarNavProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarSquareIcon },
  { name: 'Households', href: '/households', icon: BuildingOffice2Icon },
  { name: 'Accounts', href: '/accounts', icon: BriefcaseIcon },
  { name: 'Pipeline', href: '/pipeline', icon: FunnelIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentCheckIcon },
  { name: 'Meetings', href: '/meetings', icon: CalendarDaysIcon },
  { name: 'Workflows', href: '/workflows', icon: BoltIcon },
  { name: 'Compliance', href: '/compliance', icon: ShieldCheckIcon },
  { name: 'Audit Log', href: '/audit', icon: DocumentTextIcon },
];

export function SidebarNav({ collapsed = false, onCollapsedChange }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-neutral-800 transition-all duration-base',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-topbar px-4 border-b border-neutral-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">W</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-content-inverse tracking-tight">
              Wealth CRM
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-neutral-800 text-content-inverse'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-content-inverse'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0',
                  isActive ? 'text-accent-400' : 'text-neutral-500 group-hover:text-neutral-400'
                )}
              />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-neutral-800">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-neutral-500 truncate">Signed in as</p>
            <p className="text-sm text-neutral-300 truncate font-medium">
              {user.firstName} {user.lastName}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium',
            'text-neutral-400 hover:bg-neutral-800/50 hover:text-content-inverse transition-colors'
          )}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      {onCollapsedChange && (
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-content-tertiary hover:text-content-primary transition-colors shadow-sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRightIcon className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeftIcon className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </aside>
  );
}
