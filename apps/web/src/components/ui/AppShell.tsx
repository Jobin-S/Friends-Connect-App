'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Avatar } from './Avatar';

const nav = [
  { href: '/home', label: 'Match', icon: 'M12 3a9 9 0 1 0 9 9M12 8a4 4 0 1 0 4 4M12 12h.01' },
  {
    href: '/celebrities',
    label: 'Stars',
    icon: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  },
  { href: '/events', label: 'Events', icon: 'M4 7h16v12H4zM4 11h16M9 3v4M15 3v4' },
  {
    href: '/wallet',
    label: 'Wallet',
    icon: 'M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H3zM3 7l12-4v4M16 13.5h.01',
  },
  { href: '/profile', label: 'You', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0' },
];

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? '';
  const { user } = useAuth();
  const me = user?.displayName || 'You';
  const active = (href: string) =>
    path === href || path.startsWith(href + '/') || (href === '/events' && path.startsWith('/tickets'));

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      {/* Desktop top bar */}
      <header className="sticky top-4 z-40 mx-auto hidden max-w-5xl px-4 md:block">
        <div className="glass flex h-16 items-center justify-between rounded-full pl-5 pr-2 shadow-glass">
          <Link href="/welcome" className="flex items-center gap-2 font-extrabold tracking-tight text-ink">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-coral text-white">
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
            Friends Connect
          </Link>
          <nav className="flex items-center gap-1" aria-label="Main">
            {nav.slice(0, 4).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active(n.href) ? 'page' : undefined}
                className={`press rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active(n.href) ? 'bg-ink text-white' : 'text-ink-soft hover:bg-white/70 hover:text-ink'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/support"
              className="press rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-white/70 hover:text-ink"
            >
              Help
            </Link>
            <Link href="/profile" aria-label="Your profile" className="press rounded-full">
              <Avatar name={me} hue="mint" size="sm" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between px-4 pt-5 md:hidden">
        <Link href="/welcome" className="flex items-center gap-2 font-extrabold tracking-tight text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-coral text-white">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
          Friends Connect
        </Link>
        <Link href="/support" className="glass rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft">
          Help
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 md:pt-10">{children}</main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="glass fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-[1.75rem] px-2 py-2 shadow-glass md:hidden"
      >
        {nav.map((n) => {
          const on = active(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={on ? 'page' : undefined}
              className={`press flex min-w-[56px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] font-semibold ${
                on ? 'bg-ink text-white' : 'text-ink-soft'
              }`}
            >
              <Icon d={n.icon} />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
