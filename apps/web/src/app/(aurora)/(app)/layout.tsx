import type { ReactNode } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { RequireAuth } from '@/lib/auth';

/** Every app screen needs a signed-in user; logged-out visitors go to /login and come back here. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
