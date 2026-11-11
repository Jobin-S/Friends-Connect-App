import type { ReactNode } from 'react';
import { AppShell } from '@/components/ui/AppShell';

// TODO(auth merge): wrap in <RequireAuth> from '@/lib/auth' once phase-1-auth lands.
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
