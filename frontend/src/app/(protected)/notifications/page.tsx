'use client';

import { PageHeader, PageContent } from '@/components/layout/AppShell';
import { NotificationCenter } from '@/components/notifications';
import Link from 'next/link';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Stay updated on tasks, meetings, compliance, and more"
        actions={
          <Link href="/settings/notifications">
            <Button variant="secondary" leftIcon={<Cog6ToothIcon className="w-4 h-4" />}>
              Settings
            </Button>
          </Link>
        }
      />
      <PageContent>
        <NotificationCenter />
      </PageContent>
    </>
  );
}
