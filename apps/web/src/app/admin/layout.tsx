'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { RequireAuth, useAuth } from '../../lib/auth';

const LINKS = [
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/support-agents', label: 'Customer Care agents' },
  { href: '/', label: 'Back to app' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  return (
    <RequireAuth roles={['SUPER_ADMIN']}>
      <div className="min-h-screen">
        <header className="border-b border-slate-800 px-6 py-3 flex items-center gap-6">
          <span className="font-bold">Admin</span>
          <nav className="flex gap-4 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  pathname === l.href ? 'text-white font-semibold' : 'text-slate-400 hover:text-white'
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <span className="ml-auto text-xs text-slate-400">{user?.displayName}</span>
          <button onClick={logout} className="text-xs text-slate-400 hover:text-white">
            Log out
          </button>
        </header>
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </div>
    </RequireAuth>
  );
}
