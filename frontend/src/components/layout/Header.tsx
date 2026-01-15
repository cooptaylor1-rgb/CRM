'use client';

import { useAuthStore } from '../../store/authStore';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuthStore();

  return (
    <header className="bg-surface shadow-sm border-b border-border">
      <div className="flex items-center justify-between px-8 py-4">
        <h1 className="text-2xl font-bold text-content-primary">{title}</h1>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-content-primary">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-content-tertiary">
              {user?.roles.join(', ')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent-600 flex items-center justify-center text-content-inverse font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </div>
    </header>
  );
}
