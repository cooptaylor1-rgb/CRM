'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Households', href: '/households', icon: UserGroupIcon },
  { name: 'Accounts', href: '/accounts', icon: FolderIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon, badge: 5 },
  { name: 'Meetings', href: '/meetings', icon: CalendarIcon },
  { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
  { name: 'Pipeline', href: '/pipeline', icon: ChartBarIcon },
  { name: 'Intelligence', href: '/intelligence', icon: SparklesIcon },
  { name: 'Billing', href: '/billing', icon: CurrencyDollarIcon },
  { name: 'Compliance', href: '/compliance', icon: ShieldCheckIcon },
];

const secondaryItems: MenuItem[] = [
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

interface MobileHeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  onSearchClick?: () => void;
  notificationCount?: number;
  rightActions?: React.ReactNode;
}

export function MobileHeader({
  title,
  showSearch = true,
  showNotifications = true,
  onSearchClick,
  notificationCount = 0,
  rightActions,
}: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-primary border-b border-border safe-area-top md:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary active:bg-surface-tertiary transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6 text-content-primary" />
          </button>

          {/* Center: Title */}
          {title && (
            <h1 className="text-base font-semibold text-content-primary truncate max-w-[200px]">
              {title}
            </h1>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {showSearch && (
              <button
                onClick={onSearchClick}
                className="p-2 rounded-lg hover:bg-surface-secondary active:bg-surface-tertiary transition-colors"
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="w-6 h-6 text-content-secondary" />
              </button>
            )}
            {showNotifications && (
              <Link
                href="/notifications"
                className="relative p-2 rounded-lg hover:bg-surface-secondary active:bg-surface-tertiary transition-colors"
                aria-label="Notifications"
              >
                <BellIcon className="w-6 h-6 text-content-secondary" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 text-2xs font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
            )}
            {rightActions}
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <Transition show={menuOpen} as={Fragment}>
        <Dialog onClose={() => setMenuOpen(false)} className="relative z-50 md:hidden">
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
            <div className="fixed inset-0 bg-black/40" />
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
            <Dialog.Panel className="fixed inset-y-0 left-0 w-72 bg-surface-primary shadow-xl safe-area-left">
              {/* Header */}
              <div className="flex items-center justify-between h-14 px-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">WM</span>
                  </div>
                  <span className="font-semibold text-content-primary">Wealth CRM</span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-surface-secondary"
                >
                  <XMarkIcon className="w-5 h-5 text-content-secondary" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-3 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-accent-50 text-accent-primary'
                            : 'text-content-secondary hover:bg-surface-secondary active:bg-surface-tertiary'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-5 h-5 ${isActive ? 'text-accent-primary' : ''}`} />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-2xs font-bold bg-red-100 text-red-600 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRightIcon className="w-4 h-4 text-content-tertiary" />
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-4 pt-4 border-t border-border px-3 space-y-1">
                  {secondaryItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-accent-50 text-accent-primary'
                            : 'text-content-secondary hover:bg-surface-secondary'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-content-secondary hover:bg-surface-secondary transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>

              {/* User Info */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                    <span className="text-accent-primary font-semibold">JS</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content-primary truncate">John Smith</p>
                    <p className="text-xs text-content-secondary truncate">john.smith@wealth.com</p>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>

      {/* Spacer for fixed header */}
      <div className="h-14 md:hidden" />
    </>
  );
}
