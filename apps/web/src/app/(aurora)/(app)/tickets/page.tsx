'use client';

import Link from 'next/link';
import { hueSurface } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { events, formatRupees } from '@/data/aurora-mock';
import { codeGrid, useTickets } from '@/data/aurora-store';

function CodeMark({ code }: { code: string }) {
  const size = 21;
  const cells = codeGrid(code, size);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-28 w-28 rounded-lg bg-white p-1.5"
      role="img"
      aria-label={`Entry code ${code}`}
    >
      {cells.map((on, i) =>
        on ? (
          <rect key={i} x={i % size} y={Math.floor(i / size)} width="1" height="1" fill="#231C33" />
        ) : null,
      )}
    </svg>
  );
}

export default function TicketsPage() {
  const [tickets] = useTickets();

  return (
    <div>
      <Link href="/events" className="text-sm font-semibold text-ink-soft hover:text-ink">
        Back to events
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">My tickets</h1>
      <p className="mt-2 text-ink-soft">Show the code at the door. It works offline.</p>

      {tickets.length === 0 ? (
        <div className="glass mt-8 rounded-[2rem] p-10 text-center shadow-glass">
          <p className="font-bold">No tickets yet.</p>
          <p className="mt-1 text-sm text-ink-soft">Book an event and your ticket appears here.</p>
          <div className="mt-5 flex justify-center">
            <ButtonLink href="/events">Find an event</ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {tickets.map((t, i) => {
            const e = events.find((x) => x.id === t.eventId);
            if (!e) return null;
            const d = new Date(e.date);
            return (
              <li key={t.code} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <article className="flex overflow-hidden rounded-[2rem] bg-white/80 shadow-glass ring-1 ring-white">
                  <div className={`flex flex-1 flex-col justify-between p-5 ${hueSurface[e.hue]}`}>
                    <div>
                      <p className="text-lg font-bold leading-tight">{e.title}</p>
                      <p className="mt-1 text-sm text-ink-soft">{e.venue}</p>
                    </div>
                    <div className="mt-6 text-sm">
                      <p className="font-semibold">
                        {d.toLocaleString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-ink-soft">
                        {t.qty} × {t.tierName}, {formatRupees(t.total)}
                      </p>
                    </div>
                  </div>
                  {/* Perforation */}
                  <div className="relative w-0 border-l-2 border-dashed border-ink/15">
                    <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-paper" />
                    <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-paper" />
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2 p-4">
                    <CodeMark code={t.code} />
                    <span className="font-mono text-xs font-semibold tracking-wider">{t.code}</span>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
