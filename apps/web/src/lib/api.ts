import type { LoggedInResponse } from '@friends-connect/contracts';

/**
 * Minimal API client.
 * - The access token lives only in memory (never localStorage), so XSS can't read a long-lived credential.
 * - The refresh token is an httpOnly cookie set by the API; `credentials: 'include'` sends it to /api/auth/*.
 * - On a 401, the client refreshes once and retries the request.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let accessToken: string | null = null;
let refreshInFlight: Promise<LoggedInResponse | null> | null = null;
const listeners = new Set<(session: LoggedInResponse | null) => void>();

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSession(session: LoggedInResponse | null): void {
  accessToken = session?.accessToken ?? null;
  listeners.forEach((l) => l(session));
}

/** AuthProvider subscribes so a refresh done by any request updates the current user. */
export function onSessionChange(listener: (session: LoggedInResponse | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function send(path: string, init: RequestInit & { json?: unknown }): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    credentials: 'include',
  });
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new ApiError(res.status, message || `Request failed (${res.status})`, body.code);
  }
  return body as T;
}

/**
 * Exchanges the refresh cookie for a new access token. Concurrent callers share one request,
 * so a page that fires several API calls at once triggers a single refresh.
 */
export function refreshSession(): Promise<LoggedInResponse | null> {
  if (!refreshInFlight) {
    refreshInFlight = send('/api/auth/refresh', { method: 'POST' })
      .then(async (res) => (res.ok ? ((await res.json()) as LoggedInResponse) : null))
      .catch(() => null)
      .then((session) => {
        setSession(session);
        return session;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; retryOnUnauthorized?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, retryOnUnauthorized = true } = options;
  let res = await send(path, { method, json: body });
  if (res.status === 401 && retryOnUnauthorized && !path.startsWith('/api/auth/')) {
    const session = await refreshSession();
    if (session) res = await send(path, { method, json: body });
  }
  return parse<T>(res);
}
