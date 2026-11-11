'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { interests, recentChats } from '@/data/aurora-mock';
import { useCoins, useTickets } from '@/data/aurora-store';

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="text-sm text-ink-soft">{hint}</span>
      </span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-coral ${
          on ? 'bg-coral' : 'bg-ink/15'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${
            on ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </label>
  );
}

export default function ProfilePage() {
  const toast = useToast();
  const [coins] = useCoins();
  const [tickets] = useTickets();
  const [name, setName] = useState('Jo S');
  const [mine, setMine] = useState(['Music', 'Films', 'Startups']);
  const [prefs, setPrefs] = useState({ showCity: true, videoOff: true, callAlerts: true, eventAlerts: false });
  const set = (k: keyof typeof prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="grid h-fit gap-4">
        <section className="glass rounded-[2rem] p-6 text-center shadow-glass">
          <div className="flex justify-center">
            <Avatar name={name} hue="mint" size="xl" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{name}</h1>
          <p className="text-sm text-ink-soft">Kochi, member since November 2026</p>
          <dl className="mt-6 grid grid-cols-3 gap-2 text-center">
            {[
              ['Calls', recentChats.length + 21],
              ['Coins', coins.toLocaleString('en-IN')],
              ['Tickets', tickets.length],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/70 py-3">
                <dd className="text-lg font-extrabold tabular-nums">{v}</dd>
                <dt className="text-xs text-ink-soft">{k}</dt>
              </div>
            ))}
          </dl>
        </section>
        <nav className="glass grid rounded-[2rem] p-2 shadow-glass" aria-label="Account">
          {[
            ['/wallet', 'Wallet and payments'],
            ['/tickets', 'My tickets'],
            ['/support', 'Help and support'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="flex items-center justify-between rounded-2xl px-4 py-3 font-semibold hover:bg-white/70">
              {label}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-faint" aria-hidden>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="grid gap-6">
        <section className="glass rounded-[2rem] p-6 shadow-glass">
          <h2 className="text-xl font-bold">About you</h2>
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-ink-soft">Display name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              className="mt-1.5 h-12 w-full rounded-2xl border border-line bg-white/80 px-4 font-semibold outline-none focus:border-coral"
            />
          </label>
          <p className="mt-5 text-sm font-semibold text-ink-soft">Interests, up to five</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {interests.map((i) => {
              const on = mine.includes(i);
              return (
                <button
                  key={i}
                  aria-pressed={on}
                  onClick={() => setMine((m) => (on ? m.filter((x) => x !== i) : m.length < 5 ? [...m, i] : m))}
                  className={`press rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    on ? 'border-ink bg-ink text-white' : 'border-line bg-white/50 text-ink-soft hover:text-ink'
                  }`}
                >
                  {i}
                </button>
              );
            })}
          </div>
          {/* TODO(api): PATCH the profile through the auth session's user endpoint. */}
          <Button className="mt-6" onClick={() => toast('Profile saved')}>
            Save profile
          </Button>
        </section>

        <section className="glass rounded-[2rem] px-6 py-2 shadow-glass">
          <h2 className="pt-4 text-xl font-bold">Privacy</h2>
          <div className="divide-y divide-line">
            <Toggle label="Show my city" hint="Matches see the city you are in, never your exact location." on={prefs.showCity} onChange={set('showCity')} />
            <Toggle label="Start calls with video off" hint="Turn your camera on when you are ready." on={prefs.videoOff} onChange={set('videoOff')} />
          </div>
        </section>

        <section className="glass rounded-[2rem] px-6 py-2 shadow-glass">
          <h2 className="pt-4 text-xl font-bold">Notifications</h2>
          <div className="divide-y divide-line">
            <Toggle label="Incoming calls" hint="Ring this device when someone calls you." on={prefs.callAlerts} onChange={set('callAlerts')} />
            <Toggle label="Events near me" hint="One message a week about what is on nearby." on={prefs.eventAlerts} onChange={set('eventAlerts')} />
          </div>
        </section>

        {/* TODO(auth merge): call useAuth().logout() here. */}
        <Button variant="ghost" className="w-fit text-coral-deep" onClick={() => toast('Logged out')}>
          Log out
        </Button>
      </div>
    </div>
  );
}
