'use client';

import * as React from 'react';
import { cn } from '../ui/utils';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Menu, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  DocumentPlusIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { NotificationCenter } from './NotificationCenter';

export interface TopBarProps {
  className?: string;
  onSearchClick?: () => void;
}

export function TopBar({ className, onSearchClick }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const { resolvedTheme, toggleTheme, setTheme, theme } = useThemeStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header
      className={cn(
        'h-topbar bg-surface border-b border-border flex items-center justify-between px-6',
        className
      )}
    >
      {/* Search */}
      <button
        onClick={onSearchClick}
        className={cn(
          'flex items-center gap-3 flex-1 max-w-md h-9 px-3 rounded-md text-sm',
          'bg-surface-secondary border border-transparent',
          'text-content-tertiary',
          'hover:border-border transition-colors',
          'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus',
        )}
      >
        <MagnifyingGlassIcon className="w-4 h-4" />
        <span className="flex-1 text-left">Search anything...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-content-tertiary bg-surface rounded px-1.5 py-0.5 border border-border">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Create Menu */}
        <Menu as="div" className="relative">
          <Menu.Button
            className={cn(
              'inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm font-medium',
              'bg-interactive-primary text-content-inverse',
              'hover:bg-interactive-primary-hover transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2'
            )}
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create</span>
          </Menu.Button>
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-surface rounded-lg border border-border shadow-lg py-1 focus:outline-none z-50">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => router.push('/households?action=new')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                      active ? 'bg-surface-secondary' : ''
                    )}
                  >
                    <BuildingOffice2Icon className="w-4 h-4 text-content-tertiary" />
                    <span>Add Household</span>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => router.push('/meetings?action=new')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                      active ? 'bg-surface-secondary' : ''
                    )}
                  >
                    <CalendarDaysIcon className="w-4 h-4 text-content-tertiary" />
                    <span>Schedule Meeting</span>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => router.push('/tasks?action=new')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                      active ? 'bg-surface-secondary' : ''
                    )}
                  >
                    <ClipboardDocumentCheckIcon className="w-4 h-4 text-content-tertiary" />
                    <span>Create Task</span>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => router.push('/pipeline?action=new')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                      active ? 'bg-surface-secondary' : ''
                    )}
                  >
                    <DocumentPlusIcon className="w-4 h-4 text-content-tertiary" />
                    <span>Log Activity</span>
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* Theme Toggle */}
        <Menu as="div" className="relative">
          <Menu.Button
            className={cn(
              'w-9 h-9 rounded-md flex items-center justify-center',
              'text-content-secondary hover:text-content-primary hover:bg-surface-secondary',
              'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus'
            )}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <MoonIcon className="w-5 h-5" />
            ) : (
              <SunIcon className="w-5 h-5" />
            )}
          </Menu.Button>
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right bg-surface rounded-lg border border-border shadow-lg py-1 focus:outline-none z-50">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm',
                      active ? 'bg-surface-secondary' : '',
                      theme === 'light' ? 'text-accent-600' : 'text-content-secondary'
                    )}
                  >
                    <SunIcon className="w-4 h-4" />
                    <span>Light</span>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm',
                      active ? 'bg-surface-secondary' : '',
                      theme === 'dark' ? 'text-accent-600' : 'text-content-secondary'
                    )}
                  >
                    <MoonIcon className="w-4 h-4" />
                    <span>Dark</span>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setTheme('system')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm',
                      active ? 'bg-surface-secondary' : '',
                      theme === 'system' ? 'text-accent-600' : 'text-content-secondary'
                    )}
                  >
                    <ComputerDesktopIcon className="w-4 h-4" />
                    <span>System</span>
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* Notifications */}
        <NotificationCenter />

        {/* User Menu */}
        <Menu as="div" className="relative">
          <Menu.Button
            className={cn(
              'flex items-center gap-2 h-9 pl-2 pr-3 rounded-md',
              'hover:bg-surface-secondary transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-accent-600 flex items-center justify-center text-content-inverse text-xs font-semibold">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <span className="text-sm font-medium text-content-primary hidden sm:block">
              {user?.firstName}
            </span>
          </Menu.Button>
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-surface rounded-lg border border-border shadow-lg py-1 focus:outline-none z-50">
              <div className="px-4 py-3 border-b border-border-secondary">
                <p className="text-sm font-medium text-content-primary">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-content-tertiary truncate">{user?.email}</p>
              </div>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                      active ? 'bg-surface-secondary' : ''
                    )}
                  >
                    <UserCircleIcon className="w-4 h-4 text-content-tertiary" />
                    <span>Your Profile</span>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                      active ? 'bg-surface-secondary' : ''
                    )}
                  >
                    <Cog6ToothIcon className="w-4 h-4 text-content-tertiary" />
                    <span>Settings</span>
                  </button>
                )}
              </Menu.Item>
              <div className="border-t border-border-secondary mt-1 pt-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-status-error-text',
                        active ? 'bg-surface-secondary' : ''
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
