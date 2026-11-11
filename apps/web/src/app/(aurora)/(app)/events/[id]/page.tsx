'use client';

import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { hueSurface } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { events, formatRupees } from '@/data/aurora-mock';
import { useTickets } from '@/data/aurora-store';

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const e = events.find((x) => x.id === id);
  const router = useRouter();
  const toast = useToast();
  const [, setTickets] = useTickets();
  const [tierId, setTierId] = useState(e?.tiers[0].id);
  const [qty, setQty] = useState(1);
  const [booking, setBooking] = useState(false);
  if (!e) notFound();

  const tier = e.tiers.find((t) => t.id === tierId) ?? e.tiers[0];
  const d = new Date(e.date);
  const total = tier.price * qty;

  const book = () => {
    setBooking(true);
    // TODO(api): POST the booking and use the returned ticket code.
    setTimeout(() => {
      const code = `FC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      setTickets((t) => [
        { code, eventId: e.id, tierName: tier.name, qty, total, bookedAt: new Date().toISOString() },
        ...t,
      ]);
      toast(`Booked ${qty} ${tier.name} ${qty > 1 ? 'tickets' : 'ticket'} for ${e.title}`);
      router.push('/tickets');
    }, 900);
  };

  return (
    <div>
      <Link href="/events" className="text-sm font-semibold text-ink-soft hover:text-ink">
        Back to events
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <div className={`relative h-56 overflow-hidden rounded-[2.5rem] md:h-72 ${hueSurface[e.hue]}`}>
            <div
              className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/40 animate-drift"
              aria-hidden
            />
            <div
              className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/30 animate-drift-slow"
              aria-hidden
            />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight md:text-4xl">{e.title}</h1>
          <p className="mt-1 text-ink-soft">Hosted by {e.host}</p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed">{e.blurb}</p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="glass rounded-2xl p-4 shadow-glass">
              <dt className="text-xs font-semibold text-ink-soft">When</dt>
              <dd className="mt-1 font-bold">
                {d.toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </dd>
              <dd className="text-sm text-ink-soft">
                {d.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit' })}
              </dd>
            </div>
            <div className="glass rounded-2xl p-4 shadow-glass">
              <dt className="text-xs font-semibold text-ink-soft">Where</dt>
              <dd className="mt-1 font-bold">{e.venue}</dd>
              <dd className="text-sm text-ink-soft">
                {e.city}, {e.distanceKm} km from you
              </dd>
            </div>
          </dl>
        </section>

        <aside className="glass h-fit rounded-[2rem] p-6 shadow-glass lg:sticky lg:top-28">
          <h2 className="text-xl font-bold">Choose tickets</h2>
          <fieldset className="mt-4 grid gap-2">
            <legend className="sr-only">Ticket type</legend>
            {e.tiers.map((t) => {
              const on = t.id === tier.id;
              return (
                <label
                  key={t.id}
                  className={`press flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 transition-colors ${
                    on ? 'border-coral bg-coral-wash' : 'border-transparent bg-white/70 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="tier"
                    className="sr-only"
                    checked={on}
                    onChange={() => setTierId(t.id)}
                  />
                  <span>
                    <span className="block font-bold">{t.name}</span>
                    <span className="text-xs text-ink-soft">{t.left} left</span>
                  </span>
                  <span className="font-bold">{formatRupees(t.price)}</span>
                </label>
              );
            })}
          </fieldset>

          <div className="mt-5 flex items-center justify-between">
            <span className="font-semibold">Quantity</span>
            <div className="flex items-center gap-1 rounded-full bg-white/80 p-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="press grid h-9 w-9 place-items-center rounded-full text-lg font-bold hover:bg-ink/5"
                aria-label="One fewer ticket"
              >
                −
              </button>
              <span className="w-8 text-center font-bold" aria-live="polite">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(Math.min(6, tier.left), q + 1))}
                className="press grid h-9 w-9 place-items-center rounded-full text-lg font-bold hover:bg-ink/5"
                aria-label="One more ticket"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="text-ink-soft">Total</span>
            <span className="text-2xl font-extrabold">{formatRupees(total)}</span>
          </div>
          <Button size="lg" className="mt-5 w-full" onClick={book} disabled={booking}>
            {booking ? 'Booking…' : `Book for ${formatRupees(total)}`}
          </Button>
          <p className="mt-3 text-center text-xs text-ink-faint">Free cancellation up to 24 hours before.</p>
        </aside>
      </div>
    </div>
  );
}
