'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  Cog6ToothIcon,
  BellIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CalendarIcon as CalendarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  iconActive: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon, iconActive: HomeIconSolid },
  { name: 'Clients', href: '/households', icon: UserGroupIcon, iconActive: UserGroupIconSolid },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon, iconActive: ClipboardDocumentListIcon },
  { name: 'Calendar', href: '/meetings', icon: CalendarIcon, iconActive: CalendarIconSolid },
  { name: 'More', href: '/settings', icon: Cog6ToothIcon, iconActive: Cog6ToothIconSolid },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-primary border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = isActive ? item.iconActive : item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full group"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-accent-primary' : 'text-content-tertiary group-active:text-content-secondary'
                  }`}
                />
              </motion.div>
              <span
                className={`text-2xs mt-1 font-medium ${
                  isActive ? 'text-accent-primary' : 'text-content-tertiary'
                }`}
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

interface MobileTabBarProps {
  tabs: { name: string; value: string; icon?: React.ElementType }[];
  activeTab: string;
  onChange: (value: string) => void;
}

export function MobileTabBar({ tabs, activeTab, onChange }: MobileTabBarProps) {
  return (
    <div className="flex items-center bg-surface-secondary rounded-lg p-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`relative flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === tab.value
              ? 'text-content-primary'
              : 'text-content-secondary'
          }`}
        >
          {activeTab === tab.value && (
            <motion.div
              layoutId="mobile-tab-bg"
              className="absolute inset-0 bg-surface-primary rounded-md shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.name}
          </span>
        </button>
      ))}
    </div>
  );
}
