'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check auth status from localStorage
    checkAuth();
    setIsChecking(false);
  }, [checkAuth]);

  useEffect(() => {
    // Only redirect after we've checked auth status
    if (!isChecking && !isAuthenticated) {
      router.push('/');
    }
  }, [isChecking, isAuthenticated, router]);

  // Show loading while checking auth
  if (isChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-semibold text-sm">W</span>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 border-t-accent-600 mx-auto"></div>
          <p className="mt-4 text-sm text-content-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
