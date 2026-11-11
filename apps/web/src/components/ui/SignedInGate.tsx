'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { ButtonLink } from './Button';

/** Sends signed-in visitors from public marketing pages into the app (/ picks the right screen per role). */
export function RedirectIfSignedIn() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);
  return null;
}

/** The header action on public pages: Log in when signed out, Open app when signed in, nothing while checking. */
export function HeaderAuthAction() {
  const { user, loading } = useAuth();
  if (loading) return <span className="h-11 w-24" aria-hidden />;
  return user ? (
    <ButtonLink href="/" variant="quiet">
      Open app
    </ButtonLink>
  ) : (
    <ButtonLink href="/login" variant="quiet">
      Log in
    </ButtonLink>
  );
}

/**
 * A call to action whose destination depends on sign-in state.
 * Signed out: log in first, then continue to `next`. Signed in: go straight to `next`.
 */
export function AuthAwareLink({
  next,
  intent,
  children,
  size = 'lg',
  variant = 'primary',
}: {
  next: string;
  intent?: 'creator' | 'host';
  children: ReactNode;
  size?: 'md' | 'lg';
  variant?: 'primary' | 'quiet';
}) {
  const { user } = useAuth();
  const params = new URLSearchParams({ next });
  if (intent) params.set('intent', intent);
  return (
    <ButtonLink href={user ? next : `/login?${params}`} size={size} variant={variant}>
      {children}
    </ButtonLink>
  );
}
