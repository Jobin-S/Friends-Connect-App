'use client';

import type { AdminApplicationDto, ApplicationStatus } from '@friends-connect/contracts';
import { useCallback, useEffect, useState } from 'react';
import { Button, ErrorText, Input } from '../../../components/form';
import { api, ApiError } from '../../../lib/api';

const TABS: ApplicationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const ROLE_LABEL = { CELEBRITY: 'Celebrity', ORG: 'Event organizer' } as const;

function Details({ app }: { app: AdminApplicationDto }) {
  const entries = Object.entries(app.details).filter(([, v]) => v);
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-slate-400">{k}</dt>
          <dd className="break-words">
            {/^https?:\/\//.test(String(v)) ? (
              <a href={String(v)} target="_blank" rel="noreferrer" className="text-blue-400 underline">
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
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Celebrity & organizer applications</h1>
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setStatus(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              status === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      <ErrorText>{error}</ErrorText>

      {apps === null ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : apps.length === 0 ? (
        <p className="text-sm text-slate-400">No {status.toLowerCase()} applications.</p>
      ) : (
        <ul className="space-y-3">
          {apps.map((a) => (
            <li key={a.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-semibold">{a.user.displayName}</span>
                <span className="text-sm text-slate-400">{a.user.phoneNumber}</span>
                <span className="text-xs rounded bg-slate-800 px-2 py-0.5">
                  {ROLE_LABEL[a.requestedRole]}
                </span>
                <span className="ml-auto text-xs text-slate-500">
                  Applied {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
              <Details app={a} />
              {a.status === 'PENDING' ? (
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    placeholder="Note to applicant (optional, shown if rejected)"
                    className="flex-1 min-w-[220px]"
                    value={notes[a.id] ?? ''}
                    onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                  />
                  <Button disabled={busyId === a.id} onClick={() => review(a.id, 'approve')}>
                    Approve
                  </Button>
                  <Button variant="danger" disabled={busyId === a.id} onClick={() => review(a.id, 'reject')}>
                    Reject
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  {a.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                  {a.reviewedAt && ` on ${new Date(a.reviewedAt).toLocaleString()}`}
                  {a.reviewNote && ` — “${a.reviewNote}”`}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
