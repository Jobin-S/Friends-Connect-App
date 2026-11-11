'use client';

import type {
  LoggedInResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  RegisterBody,
  UserDto,
  UserRole,
} from '@friends-connect/contracts';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getAccessToken, onSessionChange, refreshSession, setSession } from './api';

interface AuthContextValue {
  user: UserDto | null;
  /** True until the first refresh attempt on page load has finished. */
  loading: boolean;
  accessToken: string | null;
  requestOtp(phone: string): Promise<OtpRequestResponse>;
  /** Logs in an existing user, or returns NEEDS_REGISTRATION with a token for /register. */
  verifyOtp(phone: string, code: string): Promise<OtpVerifyResponse>;
  register(body: RegisterBody): Promise<UserDto>;
  logout(): Promise<void>;
  /** Re-reads the user from the API (e.g. to pick up an approved application). */
  refreshUser(): Promise<UserDto | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Hand-off from /login to /register: the verified phone and its short-lived registration token. */
const REGISTRATION_KEY = 'fc_registration';
export function savePendingRegistration(phone: string, registrationToken: string) {
  sessionStorage.setItem(REGISTRATION_KEY, JSON.stringify({ phone, registrationToken }));
}
export function readPendingRegistration(): { phone: string; registrationToken: string } | null {
  try {
    return JSON.parse(sessionStorage.getItem(REGISTRATION_KEY) ?? 'null');
  } catch {
    return null;
  }
}
export function clearPendingRegistration() {
  sessionStorage.removeItem(REGISTRATION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSessionChange((session) => {
      setUser(session?.user ?? null);
      setAccessTokenState(session?.accessToken ?? null);
    });
    // Restore the session from the refresh cookie on page load.
    refreshSession().finally(() => setLoading(false));
    return () => {
      unsubscribe();
    };
  }, []);

  const requestOtp = useCallback(
    (phone: string) => api<OtpRequestResponse>('/api/auth/otp/request', { method: 'POST', body: { phone } }),
    [],
  );

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const res = await api<OtpVerifyResponse>('/api/auth/otp/verify', {
      method: 'POST',
      body: { phone, code },
    });
    if (res.status === 'LOGGED_IN') setSession(res);
    return res;
  }, []);

  const register = useCallback(async (body: RegisterBody) => {
    const res = await api<LoggedInResponse>('/api/auth/register', { method: 'POST', body });
    setSession(res);
    clearPendingRegistration();
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setSession(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return null;
    const me = await api<UserDto>('/api/auth/me');
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({ user, loading, accessToken, requestOtp, verifyOtp, register, logout, refreshUser }),
    [user, loading, accessToken, requestOtp, verifyOtp, register, logout, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/**
 * Client-side route protection. Redirects to /login when logged out, and to / when the user's role
 * isn't allowed. (Server-side protection is the API itself: every endpoint checks the token and role.)
 */
export function RequireAuth({ roles, children }: { roles?: UserRole[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!user && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace('/');
  }, [loading, user, allowed, router, pathname]);

  if (loading || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading…</div>
    );
  }
  return <>{children}</>;
}
