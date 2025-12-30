'use client';

import * as React from 'react';
import { cn } from '../ui/utils';
import { useAuthStore } from '@/store/authStore';
import { Menu, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement global search
    console.log('Search:', searchQuery);
  };

  return (
    <header
      className={cn(
        'h-topbar bg-surface border-b border-border flex items-center justify-between px-6',
        className
      )}
    >
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
          <input
            type="search"
            placeholder="Search households, accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full h-9 pl-9 pr-4 rounded-md text-sm',
              'bg-surface-secondary border border-transparent',
              'text-content-primary placeholder:text-content-tertiary',
              'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus',
              'transition-colors'
            )}
          />
        </div>
      </form>

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

        {/* Notifications */}
        <button
          className={cn(
            'relative w-9 h-9 rounded-md flex items-center justify-center',
            'text-content-secondary hover:text-content-primary hover:bg-surface-secondary',
            'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus'
          )}
          aria-label="Notifications"
        >
          <BellIcon className="w-5 h-5" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-status-error-text rounded-full" />
        </button>

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
