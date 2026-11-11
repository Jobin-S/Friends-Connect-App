'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Dots } from './motion';

/**
 * Status of a pending or rejected creator/host application, for users who are still NORMAL.
 * "Check status" re-reads the user; once approved, the account moves to its own dashboard at /.
 */
export function ApplicationNotice({ className = '' }: { className?: string }) {
  const { user, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const app = user?.latestApplication;
  if (!user || !app || user.role !== 'NORMAL' || app.status === 'APPROVED') return null;

  const what = app.requestedRole === 'CELEBRITY' ? 'creator' : 'event host';
  const pending = app.status === 'PENDING';

  const check = async () => {
    setChecking(true);
    try {
      const me = await refreshUser();
      if (me && me.role !== 'NORMAL') {
        // Approved: their role dashboard lives at /.
        window.location.replace('/');
        return;
      }
      setCheckedAt(new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      role="status"
      className={`flex animate-rise flex-wrap items-center gap-x-4 gap-y-2 rounded-[1.5rem] px-5 py-4 ${
        pending ? 'bg-lilac/60' : 'bg-coral-wash'
      } ${className}`}
    >
      <span
        aria-hidden
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${pending ? 'bg-white/70' : 'bg-white'}`}
      >
        {pending ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-coral-deep"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
        )}
      </span>
      <p className="min-w-0 flex-1 text-sm leading-relaxed">
        {pending ? (
          <>
            <strong className="font-semibold">Your {what} application is being reviewed.</strong> You can use
            the app as usual until it is approved.
          </>
        ) : (
          <>
            <strong className="font-semibold">Your {what} application was not approved</strong>
            {app.reviewNote ? `: ${app.reviewNote}` : '.'} You can apply again later.
          </>
        )}
        {checkedAt && pending && (
          <span className="block text-xs text-ink-soft">Still in review as of {checkedAt}.</span>
        )}
      </p>
      {pending && (
        <button
          onClick={check}
          disabled={checking}
          className="press rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-white/80 disabled:opacity-60"
        >
          {checking ? <Dots /> : 'Check status'}
        </button>
      )}
    </div>
  );
}
