import Link from 'next/link';
import type { ReactNode } from 'react';
import { Avatar } from './Avatar';
import { AuroraFrame } from './AuroraFrame';

/** Two-column frame for login and sign-up: a quiet welcome on the left, the form card on the right. */
export function AuthLayout({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <AuroraFrame>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6">
        <Link href="/welcome" className="flex w-fit items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-coral text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          Friends Connect
        </Link>
        <div className="grid flex-1 items-center gap-10 py-10 md:grid-cols-[1fr_minmax(0,440px)]">
          <div className="hidden md:block">{aside}</div>
          <div className="animate-rise">{children}</div>
        </div>
      </div>
    </AuroraFrame>
  );
}

/** The small cluster of faces used beside the auth forms. */
export function FacesCluster() {
  const faces = [
    { n: 'Anaya R', h: 'lilac', x: '8%', y: '10%', s: 'lg' },
    { n: 'Kiran P', h: 'mint', x: '52%', y: '0%', s: 'md' },
    { n: 'Meera Varma', h: 'peach', x: '70%', y: '38%', s: 'lg' },
    { n: 'Joel M', h: 'coral', x: '24%', y: '58%', s: 'md' },
    { n: 'Sana Ali', h: 'lilac', x: '58%', y: '78%', s: 'sm' },
  ] as const;
  return (
    <div className="relative h-64 w-full max-w-sm" aria-hidden>
      {faces.map((f, i) => (
        <div
          key={f.n}
          className={`absolute ${i % 2 ? 'animate-drift-slow' : 'animate-drift'}`}
          style={{ left: f.x, top: f.y, animationDelay: `${-i * 3}s` }}
        >
          <Avatar name={f.n} hue={f.h} size={f.s} />
        </div>
      ))}
    </div>
  );
}

const field =
  'h-12 w-full rounded-2xl border border-line bg-white/80 px-4 text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coral focus:bg-white';
export const fieldClass = field;
export const areaClass = field.replace('h-12', 'min-h-[96px] py-3');

export function AuthField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1.5 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function AuthError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="animate-rise rounded-2xl bg-coral-wash px-4 py-3 text-sm font-medium text-coral-deep">
      {children}
    </p>
  );
}
