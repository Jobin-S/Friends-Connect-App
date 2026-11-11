'use client';

import type { AdminApplicationDto, ApplicationStatus } from '@friends-connect/contracts';
import { useCallback, useEffect, useState } from 'react';
import { AuthError, fieldClass } from '../../../components/ui/AuthLayout';
import { Avatar, hueSurface } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { api, ApiError } from '../../../lib/api';

const TABS: ApplicationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const TAB_LABEL: Record<ApplicationStatus, string> = {
  PENDING: 'Waiting',
  APPROVED: 'Approved',
  REJECTED: 'Not approved',
};
const ROLE_LABEL = { CELEBRITY: 'Creator', ORG: 'Event host' } as const;
const FIELD_LABEL: Record<string, string> = {
  category: 'Works in',
  bio: 'About',
  socialUrl: 'Social profile',
  companyName: 'Company',
  registrationNo: 'GST / registration',
  websiteUrl: 'Website',
};

function Details({ app }: { app: AdminApplicationDto }) {
  const entries = Object.entries(app.details).filter(([, v]) => v);
  return (
    <dl className="grid gap-3 sm:grid-cols-[max-content_1fr] sm:gap-x-6">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-sm font-semibold text-ink-soft">{FIELD_LABEL[k] ?? k}</dt>
          <dd className="-mt-2 break-words leading-relaxed sm:mt-0">
            {/^https?:\/\//.test(String(v)) ? (
              <a
                href={String(v)}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-coral-deep underline-offset-4 hover:underline"
              >
                {String(v)}
              </a>
            ) : (
              String(v)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function ApplicationsPage() {
  const toast = useToast();
  const [status, setStatus] = useState<ApplicationStatus>('PENDING');
  const [apps, setApps] = useState<AdminApplicationDto[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setApps(await api<AdminApplicationDto[]>(`/api/admin/applications?status=${status}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load applications.');
    }
  }, [status]);

  useEffect(() => {
    setApps(null);
    load();
  }, [load]);

  async function review(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    setError(null);
    try {
      await api(`/api/admin/applications/${id}/${action}`, {
        method: 'POST',
        body: { note: notes[id] || undefined },
      });
      const who = apps?.find((a) => a.id === id)?.user.displayName ?? 'Applicant';
      toast(action === 'approve' ? `${who} approved` : `${who} not approved`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Applications</h1>
          <p className="mt-2 text-ink-soft">Creators and event hosts waiting for a decision.</p>
        </div>
        <div role="tablist" aria-label="Status" className="glass flex rounded-full p-1 shadow-glass">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={status === t}
              onClick={() => setStatus(t)}
              className={`press rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                status === t ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <AuthError>{error}</AuthError>
      </div>

      {apps === null ? (
        <div className="mt-6 grid gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-48 animate-shimmer rounded-[2rem]" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="glass mt-6 rounded-[2rem] p-10 text-center shadow-glass">
          <p className="font-bold">
            {status === 'PENDING'
              ? 'Nothing waiting. You are all caught up.'
              : `No ${TAB_LABEL[status].toLowerCase()} applications yet.`}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {apps.map((a, i) => {
            const hue = a.requestedRole === 'CELEBRITY' ? 'peach' : 'lilac';
            return (
              <li
                key={a.id}
                className="glass animate-rise overflow-hidden rounded-[2rem] shadow-glass"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`flex flex-wrap items-center gap-4 px-6 py-5 ${hueSurface[hue]}`}>
                  <Avatar name={a.user.displayName} hue={hue} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold leading-tight">{a.user.displayName}</p>
                    <p className="text-sm text-ink-soft">{a.user.phoneNumber}</p>
                  </div>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold">
                    {ROLE_LABEL[a.requestedRole]}
                  </span>
                  <span className="w-full text-xs text-ink-soft sm:w-auto">
                    Applied{' '}
                    {new Date(a.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="grid gap-5 px-6 py-5">
                  <Details app={a} />
                  {a.status === 'PENDING' ? (
                    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
                      <label className="min-w-[220px] flex-1">
                        <span className="sr-only">Note to applicant</span>
                        <input
                          placeholder="Note to the applicant (shown if not approved)"
                          className={fieldClass}
                          value={notes[a.id] ?? ''}
                          onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                        />
                      </label>
                      <Button
                        variant="quiet"
                        disabled={busyId === a.id}
                        onClick={() => review(a.id, 'reject')}
                      >
                        Decline
                      </Button>
                      <Button disabled={busyId === a.id} onClick={() => review(a.id, 'approve')}>
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <p className="border-t border-line pt-4 text-sm text-ink-soft">
                      {a.status === 'APPROVED' ? 'Approved' : 'Not approved'}
                      {a.reviewedAt &&
                        ` on ${new Date(a.reviewedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`}
                      {a.reviewNote && `. Note: ${a.reviewNote}`}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
