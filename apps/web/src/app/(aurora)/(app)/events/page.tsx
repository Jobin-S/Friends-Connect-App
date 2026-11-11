'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { hueSurface } from '@/components/ui/Avatar';
import { events, formatRupees } from '@/data/aurora-mock';
import { useTickets } from '@/data/aurora-store';

const cities = ['All cities', 'Kochi', 'Kozhikode', 'Trivandrum'] as const;

export default function EventsPage() {
  const [city, setCity] = useState<(typeof cities)[number]>('All cities');
  const [radius, setRadius] = useState(250);
  const [tickets] = useTickets();

  const list = useMemo(
    () => events.filter((e) => (city === 'All cities' || e.city === city) && e.distanceKm <= radius),
    [city, radius],
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Events near you</h1>
          <p className="mt-2 text-ink-soft">Book a seat and your ticket shows up in the app.</p>
        </div>
        <Link href="/tickets" className="glass press flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-glass">
          My tickets
          {tickets.length > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1.5 text-xs text-white">
              {tickets.length}
            </span>
          )}
        </Link>
      </div>

      <div className="glass mt-6 grid gap-4 rounded-[2rem] p-4 shadow-glass md:grid-cols-[auto_1fr] md:items-center md:p-5">
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setCity(c)}
              aria-pressed={city === c}
              className={`press rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                city === c ? 'bg-ink text-white' : 'bg-white/60 text-ink-soft hover:text-ink'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold md:justify-end">
          <span className="shrink-0 text-ink-soft">Within</span>
          <input
            type="range"
            min={5}
            max={250}
            step={5}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-coral md:w-56"
          />
          <span className="w-16 shrink-0 text-right">{radius} km</span>
        </label>
      </div>

      {list.length === 0 ? (
        <div className="glass mt-8 rounded-[2rem] p-10 text-center shadow-glass">
          <p className="font-bold">Nothing on within {radius} km.</p>
          <p className="mt-1 text-sm text-ink-soft">Widen the distance or pick another city.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {list.map((e, i) => {
            const d = new Date(e.date);
            const from = Math.min(...e.tiers.map((t) => t.price));
            const low = e.tiers.reduce((a, t) => a + t.left, 0) < 20;
            return (
              <li key={e.id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <Link href={`/events/${e.id}`} className="press group block overflow-hidden rounded-[2rem] bg-white/70 shadow-glass ring-1 ring-white hover:bg-white">
                  <div className={`relative h-40 ${hueSurface[e.hue]}`}>
                    <div className="absolute left-5 top-5 rounded-2xl bg-white/80 px-3 py-2 text-center backdrop-blur">
                      <p className="text-2xl font-extrabold leading-none">{d.getDate()}</p>
                      <p className="text-xs font-semibold text-ink-soft">{d.toLocaleString('en-IN', { month: 'short' })}</p>
                    </div>
                    {low && (
                      <span className="absolute right-5 top-5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                        Few seats left
                      </span>
                    )}
                    <div className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-white/40 transition-transform duration-500 group-hover:scale-110" aria-hidden />
                  </div>
                  <div className="p-5">
                    <p className="text-lg font-bold">{e.title}</p>
                    <p className="text-sm text-ink-soft">
                      {e.venue}, {e.city}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-ink-soft">
                        {d.toLocaleString('en-IN', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}, {e.distanceKm} km
                      </span>
                      <span className="font-bold">From {formatRupees(from)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
