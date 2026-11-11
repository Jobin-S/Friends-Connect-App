'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Avatar, hueSurface } from '@/components/ui/Avatar';
import { celebrities, formatCount } from '@/data/aurora-mock';

const filters = ['Everyone', 'Online now', 'Music', 'Sport', 'Food', 'Film', 'Comedy'] as const;
const craftMatch: Record<string, string[]> = {
  Music: ['Playback singer', 'Dancer'],
  Sport: ['Cricketer'],
  Food: ['Chef and food writer'],
  Film: ['Film director'],
  Comedy: ['Stand-up comic'],
};

const statusLabel = { online: 'Online', busy: 'On a call', away: 'Away' } as const;

export default function CelebritiesPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('Everyone');
  const [q, setQ] = useState('');

  const list = useMemo(
    () =>
      celebrities.filter((c) => {
        if (filter === 'Online now' && c.status !== 'online') return false;
        if (craftMatch[filter] && !craftMatch[filter].includes(c.craft)) return false;
        if (q && !`${c.name} ${c.craft} ${c.city}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [filter, q],
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Stars</h1>
          <p className="mt-2 text-ink-soft">
            Verified people who take calls. Rates are per minute, in coins.
          </p>
        </div>
        <label className="glass flex h-11 w-full items-center gap-2 rounded-full px-4 shadow-glass sm:w-72">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-ink-faint"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <span className="sr-only">Search stars</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or city"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
        </label>
      </div>

      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`press shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              filter === f
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-white/50 text-ink-soft hover:text-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="glass mt-10 rounded-[2rem] p-10 text-center shadow-glass">
          <p className="font-bold">No stars match that search.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Try a different name, or clear the filter to see everyone.
          </p>
          <button
            onClick={() => {
              setQ('');
              setFilter('Everyone');
            }}
            className="mt-4 font-semibold text-coral-deep hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c, i) => (
            <li key={c.id} className="animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
              <Link
                href={`/celebrities/${c.id}`}
                className="press group flex h-full flex-col rounded-[2rem] bg-white/70 p-2 shadow-glass ring-1 ring-white transition-colors hover:bg-white"
              >
                <div className={`relative flex items-end gap-4 rounded-[1.6rem] p-5 ${hueSurface[c.hue]}`}>
                  <Avatar name={c.name} hue={c.hue} size="lg" status={c.status} />
                  <div className="min-w-0 pb-1">
                    <p className="flex items-center gap-1.5 font-bold leading-tight">
                      {c.name}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        className="text-coral-deep"
                        aria-label="Verified"
                      >
                        <path
                          fill="currentColor"
                          d="M12 2l2.4 2.1 3.2-.3.9 3.1 2.8 1.6-1.2 3 1.2 3-2.8 1.6-.9 3.1-3.2-.3L12 22l-2.4-2.1-3.2.3-.9-3.1-2.8-1.6 1.2-3-1.2-3 2.8-1.6.9-3.1 3.2.3z"
                        />
                        <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" fill="none" />
                      </svg>
                    </p>
                    <p className="text-sm text-ink-soft">
                      {c.craft}, {c.city}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold">{statusLabel[c.status]}</p>
                    <p className="text-xs text-ink-faint">{formatCount(c.followers)} followers</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{c.audioRate} coins</p>
                    <p className="text-xs text-ink-faint">a minute, audio</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
