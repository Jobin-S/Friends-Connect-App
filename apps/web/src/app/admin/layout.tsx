'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { AuroraFrame } from '../../components/ui/AuroraFrame';
import { Avatar } from '../../components/ui/Avatar';
import { RequireAuth, useAuth } from '../../lib/auth';

const LINKS = [
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/support-agents', label: 'Support agents' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  return (
    <AuroraFrame>
      <RequireAuth roles={['SUPER_ADMIN']}>
        <div className="min-h-screen pb-12">
          <header className="sticky top-4 z-40 mx-auto max-w-5xl px-4">
            <div className="glass flex h-16 items-center gap-3 rounded-full pl-5 pr-2 shadow-glass">
              <span className="flex items-center gap-2 font-extrabold tracking-tight">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-white">
                  <span className="h-2 w-2 rounded-full bg-coral" />
                </span>
                <span className="hidden sm:inline">Admin</span>
              </span>
              <nav className="flex items-center gap-1" aria-label="Admin">
                {LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={pathname === l.href ? 'page' : undefined}
                    className={`press rounded-full px-3 py-2 text-sm font-semibold transition-colors sm:px-4 ${
                      pathname === l.href
                        ? 'bg-ink text-white'
                        : 'text-ink-soft hover:bg-white/70 hover:text-ink'
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <span className="ml-auto flex items-center gap-2">
                <Avatar name={user?.displayName || 'Admin'} hue="lilac" size="sm" />
                <button
                  onClick={async () => {
                    await logout();
                    window.location.replace('/welcome');
                  }}
                  className="press rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-white/70 hover:text-ink"
                >
                  Log out
                </button>
              </span>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 pt-10">{children}</main>
        </div>
      </RequireAuth>
    </AuroraFrame>
  );
}
