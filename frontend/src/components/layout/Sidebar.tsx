'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
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
} from '@heroicons/react/24/outline';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const navigation = [
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

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="flex flex-col h-full w-64 bg-sidebar text-content-inverse">
      <div className="flex items-center justify-center h-16 bg-neutral-800">
        <span className="text-xl font-bold">Wealth CRM</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-base ${
                isActive
                  ? 'bg-neutral-800 text-content-inverse'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-content-inverse'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-accent-400' : 'text-neutral-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-700">
        <div className="mb-3">
          <p className="text-sm text-neutral-400">Logged in as</p>
          <p className="text-sm font-medium truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-sm font-medium text-content-inverse bg-status-error-text rounded-lg hover:opacity-90 transition-opacity duration-base"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
