'use client';

import {
  GENDERS,
  INTERESTS,
  MAX_BIO_LENGTH,
  MAX_INTERESTS,
  type Gender,
  type Interest,
  type UpdateProfileBody,
  type UserDto,
} from '@friends-connect/contracts';
import Link from 'next/link';
import { FormEvent, useState, type ReactNode } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ApplicationNotice } from '@/components/ui/ApplicationNotice';
import { areaClass, AuthError, AuthField, fieldClass } from '@/components/ui/AuthLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dots } from '@/components/ui/motion';
import { useToast } from '@/components/ui/Toast';
import { recentChats } from '@/data/aurora-mock';
import { useCoins, useTickets } from '@/data/aurora-store';

const GENDER_LABEL: Record<Gender, string> = {
  WOMAN: 'Woman',
  MAN: 'Man',
  NON_BINARY: 'Non-binary',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

function ChipToggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`press rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        on ? 'border-ink bg-ink text-white' : 'border-line bg-white/50 text-ink-soft hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="text-sm text-ink-soft">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
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
  const { user, logout, refreshUser } = useAuth();
  const [coins] = useCoins();
  const [tickets] = useTickets();
  const [name, setName] = useState(user?.displayName ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [mine, setMine] = useState<Interest[]>((user?.interests ?? []) as Interest[]);
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const dobLabel = user?.dateOfBirth
    ? new Date(`${user.dateOfBirth}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'long' })
    : 'Not set';

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const body: UpdateProfileBody = {
      displayName: name.trim(),
      city: city.trim(),
      gender,
      interests: mine,
      bio: bio.trim() || null,
    };
    try {
      await api<UserDto>('/api/users/me', { method: 'PATCH', body });
      await refreshUser();
      toast('Profile saved');
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }
  const [prefs, setPrefs] = useState({
    showCity: true,
    videoOff: true,
    callAlerts: true,
    eventAlerts: false,
  });
  const set = (k: keyof typeof prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="grid h-fit gap-4">
        <section className="glass rounded-[2rem] p-6 text-center shadow-glass">
          <div className="flex justify-center">
            <Avatar name={name || 'You'} hue="mint" size="xl" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{name || 'You'}</h1>
          <p className="text-sm text-ink-soft">
            {[user?.city, user?.phoneNumber].filter(Boolean).join(', ')}
          </p>
          <ApplicationNotice className="mt-4 text-left" />
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
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between rounded-2xl px-4 py-3 font-semibold hover:bg-white/70"
            >
              {label}
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
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="grid gap-6">
        <form onSubmit={save} className="glass rounded-[2rem] p-6 shadow-glass">
          <h2 className="text-xl font-bold">About you</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <AuthField label="Display name">
              <input
                required
                minLength={2}
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </AuthField>
            <AuthField label="City">
              <input
                required
                minLength={2}
                maxLength={60}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={fieldClass}
              />
            </AuthField>
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            Date of birth: <strong className="font-semibold text-ink">{dobLabel}</strong>. This cannot be
            changed.
          </p>

          <p className="mt-5 text-sm font-semibold text-ink-soft">Gender</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {GENDERS.map((g) => (
              <ChipToggle key={g} on={gender === g} onClick={() => setGender(gender === g ? null : g)}>
                {GENDER_LABEL[g]}
              </ChipToggle>
            ))}
          </div>

          <p className="mt-5 text-sm font-semibold text-ink-soft">Interests, up to {MAX_INTERESTS}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((i) => {
              const on = mine.includes(i);
              return (
                <ChipToggle
                  key={i}
                  on={on}
                  onClick={() =>
                    setMine((m) => (on ? m.filter((x) => x !== i) : m.length < MAX_INTERESTS ? [...m, i] : m))
                  }
                >
                  {i}
                </ChipToggle>
              );
            })}
          </div>

          <div className="mt-5">
            <AuthField label="A line about you" hint={`${bio.length}/${MAX_BIO_LENGTH}`}>
              <textarea
                rows={2}
                maxLength={MAX_BIO_LENGTH}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={areaClass}
              />
            </AuthField>
          </div>

          <div className="mt-4">
            <AuthError>{saveError}</AuthError>
          </div>
          <Button type="submit" className="mt-4" disabled={saving}>
            {saving ? <Dots /> : 'Save profile'}
          </Button>
        </form>

        <section className="glass rounded-[2rem] px-6 py-2 shadow-glass">
          <h2 className="pt-4 text-xl font-bold">Privacy</h2>
          <div className="divide-y divide-line">
            <Toggle
              label="Show my city"
              hint="Matches see the city you are in, never your exact location."
              on={prefs.showCity}
              onChange={set('showCity')}
            />
            <Toggle
              label="Start calls with video off"
              hint="Turn your camera on when you are ready."
              on={prefs.videoOff}
              onChange={set('videoOff')}
            />
          </div>
        </section>

        <section className="glass rounded-[2rem] px-6 py-2 shadow-glass">
          <h2 className="pt-4 text-xl font-bold">Notifications</h2>
          <div className="divide-y divide-line">
            <Toggle
              label="Incoming calls"
              hint="Ring this device when someone calls you."
              on={prefs.callAlerts}
              onChange={set('callAlerts')}
            />
            <Toggle
              label="Events near me"
              hint="One message a week about what is on nearby."
              on={prefs.eventAlerts}
              onChange={set('eventAlerts')}
            />
          </div>
        </section>

        <Button
          variant="ghost"
          className="w-fit text-coral-deep"
          disabled={leaving}
          onClick={async () => {
            setLeaving(true);
            await logout();
            // Hard navigation, so it wins over RequireAuth's redirect to /login.
            window.location.replace('/welcome');
          }}
        >
          {leaving ? 'Logging out…' : 'Log out'}
        </Button>
      </div>
    </div>
  );
}
