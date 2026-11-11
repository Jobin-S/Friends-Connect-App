'use client';

import {
  GENDERS,
  INTERESTS,
  MAX_BIO_LENGTH,
  MAX_INTERESTS,
  MIN_AGE_YEARS,
  type AccountType,
  type Gender,
  type Interest,
  type ProfileInput,
  type RegisterBody,
} from '@friends-connect/contracts';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Avatar, hueSurface } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { areaClass, AuthError, AuthField, AuthLayout, fieldClass } from '../../components/ui/AuthLayout';
import { Dots } from '../../components/ui/motion';
import { ApiError } from '../../lib/api';
import { readPendingRegistration, useAuth } from '../../lib/auth';

const ACCOUNT_OPTIONS: {
  value: AccountType;
  label: string;
  description: string;
  hue: 'mint' | 'peach' | 'lilac';
  icon: string;
}[] = [
  {
    value: 'NORMAL',
    label: 'Just me',
    description: 'Meet people, call stars and book events. Ready right away.',
    hue: 'mint',
    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  },
  {
    value: 'CELEBRITY',
    label: 'I am a creator',
    description: 'Take paid calls from fans. We review your application first.',
    hue: 'peach',
    icon: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  },
  {
    value: 'ORG',
    label: 'I host events',
    description: 'Publish events and sell tickets. We review your application first.',
    hue: 'lilac',
    icon: 'M4 7h16v12H4zM4 11h16M9 3v4M15 3v4',
  },
];

const GENDER_LABEL: Record<Gender, string> = {
  WOMAN: 'Woman',
  MAN: 'Man',
  NON_BINARY: 'Non-binary',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

const CITIES = [
  'Kochi',
  'Thiruvananthapuram',
  'Kozhikode',
  'Thrissur',
  'Kollam',
  'Kannur',
  'Kottayam',
  'Alappuzha',
  'Palakkad',
  'Malappuram',
  'Bengaluru',
  'Chennai',
  'Mumbai',
  'Delhi',
];

const STEPS = ['About you', 'Interests', 'Account'] as const;

/** Latest date of birth that is still MIN_AGE_YEARS old today, as YYYY-MM-DD. */
function latestAllowedBirthDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE_YEARS);
  return d.toISOString().slice(0, 10);
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`press rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        on ? 'border-ink bg-ink text-white' : 'border-line bg-white/60 text-ink-soft hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

export default function RegisterPage() {
  const { user, register } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<{ phone: string; registrationToken: string } | null>(null);
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<AccountType>('NORMAL');
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [bio, setBio] = useState('');
  const [celeb, setCeleb] = useState({ category: '', bio: '', socialUrl: '' });
  const [org, setOrg] = useState({ companyName: '', registrationNo: '', websiteUrl: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) return router.replace('/');
    const p = readPendingRegistration();
    if (!p) return router.replace('/login');
    setPending(p);
    // Arriving from "Apply as a creator" or "Start hosting" preselects that account type.
    const intent = new URLSearchParams(window.location.search).get('intent');
    if (intent === 'creator') setAccountType('CELEBRITY');
    else if (intent === 'host') setAccountType('ORG');
  }, [user, router]);

  const maxDob = latestAllowedBirthDate();

  function next(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (step === 0 && dateOfBirth > maxDob) {
      setError(`You need to be ${MIN_AGE_YEARS} or older to use Friends Connect.`);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setError(null);
    setBusy(true);
    const profile: ProfileInput = {
      city: city.trim(),
      dateOfBirth,
      ...(gender ? { gender } : {}),
      interests,
      ...(bio.trim() ? { bio: bio.trim() } : {}),
    };
    const base = { registrationToken: pending.registrationToken, displayName, profile };
    const body: RegisterBody =
      accountType === 'CELEBRITY'
        ? { ...base, accountType, application: celeb }
        : accountType === 'ORG'
          ? { ...base, accountType, application: org }
          : { ...base, accountType: 'NORMAL' };
    try {
      await register(body);
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'REGISTRATION_TOKEN_INVALID') {
        router.replace('/login');
        return;
      }
      if (err instanceof ApiError && err.code === 'UNDERAGE') {
        setStep(0);
        setError(`You need to be ${MIN_AGE_YEARS} or older to use Friends Connect.`);
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!pending) return null;

  const chosen = ACCOUNT_OPTIONS.find((o) => o.value === accountType)!;
  const age = dateOfBirth
    ? Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <AuthLayout
      aside={
        <div className="max-w-md">
          {/* Live preview of the profile being created */}
          <div
            className={`w-80 rounded-[2rem] p-6 shadow-glass transition-colors duration-500 ${hueSurface[chosen.hue]}`}
          >
            <Avatar name={displayName.trim() || 'You'} hue={chosen.hue} size="lg" status="online" />
            <p className="mt-5 text-xl font-extrabold tracking-tight">
              {displayName.trim() || 'Your name'}
              {age !== null && age >= MIN_AGE_YEARS && (
                <span className="font-semibold text-ink-soft">, {age}</span>
              )}
            </p>
            <p className="text-sm text-ink-soft">
              {[
                city.trim(),
                accountType === 'CELEBRITY'
                  ? celeb.category || 'Creator'
                  : accountType === 'ORG'
                    ? org.companyName || 'Event host'
                    : null,
              ]
                .filter(Boolean)
                .join(', ') || 'New on Friends Connect'}
            </p>
            {interests.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {interests.map((i) => (
                  <span key={i} className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold">
                    {i}
                  </span>
                ))}
              </div>
            )}
            {bio.trim() && <p className="mt-3 text-sm leading-relaxed">{bio.trim()}</p>}
          </div>
          <h2 className="mt-8 text-5xl font-extrabold leading-[1.02] tracking-[-0.03em]">Almost there.</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            This is how other people will see you. You can change most of it later.
          </p>
        </div>
      }
    >
      <form
        onSubmit={step < STEPS.length - 1 ? next : submit}
        className="glass rounded-[2.25rem] p-7 shadow-glass md:p-9"
      >
        {/* Progress: three real steps */}
        <ol className="flex gap-1.5" aria-label="Sign-up progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <span
                className={`block h-1.5 rounded-full transition-colors duration-500 ${i <= step ? 'bg-coral' : 'bg-ink/10'}`}
              />
              <span
                className={`mt-2 block text-xs font-semibold ${i === step ? 'text-ink' : 'text-ink-faint'}`}
              >
                {s}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-mint text-ink">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              aria-hidden
            >
              <path d="M5 12l5 5L20 7" />
            </svg>
          </span>
          {pending.phone} verified
        </p>

        {step === 0 && (
          <div key="s0" className="mt-4 animate-rise space-y-5">
            <h1 className="text-3xl font-extrabold tracking-tight">Tell us about you</h1>
            <AuthField label="Your name">
              <input
                required
                minLength={2}
                maxLength={60}
                autoFocus
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={fieldClass}
              />
            </AuthField>
            <div className="grid gap-5 sm:grid-cols-2">
              <AuthField label="Date of birth" hint={`You must be ${MIN_AGE_YEARS} or older.`}>
                <input
                  type="date"
                  required
                  min="1900-01-01"
                  max={maxDob}
                  autoComplete="bday"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={fieldClass}
                />
              </AuthField>
              <AuthField label="City">
                <input
                  required
                  minLength={2}
                  maxLength={60}
                  list="fc-cities"
                  autoComplete="address-level2"
                  placeholder="Kochi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={fieldClass}
                />
                <datalist id="fc-cities">
                  {CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </AuthField>
            </div>
            <fieldset>
              <legend className="text-sm font-semibold text-ink-soft">Gender (optional)</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {GENDERS.map((g) => (
                  <Chip key={g} on={gender === g} onClick={() => setGender(gender === g ? null : g)}>
                    {GENDER_LABEL[g]}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 1 && (
          <div key="s1" className="mt-4 animate-rise space-y-5">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">What are you into?</h1>
              <p className="mt-2 text-ink-soft">
                Pick up to {MAX_INTERESTS}. We use them to match you with people.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => {
                const on = interests.includes(i);
                return (
                  <Chip
                    key={i}
                    on={on}
                    onClick={() =>
                      setInterests((cur) =>
                        on ? cur.filter((x) => x !== i) : cur.length < MAX_INTERESTS ? [...cur, i] : cur,
                      )
                    }
                  >
                    {i}
                  </Chip>
                );
              })}
            </div>
            <p className="text-xs text-ink-faint" aria-live="polite">
              {interests.length} of {MAX_INTERESTS} picked
            </p>
            <AuthField label="A line about you (optional)" hint={`${bio.length}/${MAX_BIO_LENGTH}`}>
              <textarea
                rows={3}
                maxLength={MAX_BIO_LENGTH}
                placeholder="Weekend trekker, weekday coder. Always up for filter coffee."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={areaClass}
              />
            </AuthField>
          </div>
        )}

        {step === 2 && (
          <div key="s2" className="mt-4 animate-rise space-y-5">
            <h1 className="text-3xl font-extrabold tracking-tight">How will you use it?</h1>
            <fieldset>
              <legend className="sr-only">Account type</legend>
              <div className="grid gap-2">
                {ACCOUNT_OPTIONS.map((o) => {
                  const on = accountType === o.value;
                  return (
                    <label
                      key={o.value}
                      className={`press flex cursor-pointer items-center gap-4 rounded-[1.4rem] border-2 p-3.5 transition-colors ${
                        on ? 'border-coral bg-white' : 'border-transparent bg-white/55 hover:bg-white/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="accountType"
                        value={o.value}
                        checked={on}
                        onChange={() => setAccountType(o.value)}
                        className="sr-only"
                      />
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${hueSurface[o.hue]}`}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d={o.icon} />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{o.label}</span>
                        <span className="block text-sm leading-snug text-ink-soft">{o.description}</span>
                      </span>
                      <span
                        aria-hidden
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                          on ? 'border-coral bg-coral' : 'border-ink/20'
                        }`}
                      >
                        {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {accountType === 'CELEBRITY' && (
              <div key="celeb" className="animate-rise space-y-4">
                <AuthField label="What do you do?" hint="For example: Cinema, Music, Comedy, Sports">
                  <input
                    required
                    minLength={2}
                    value={celeb.category}
                    onChange={(e) => setCeleb({ ...celeb, category: e.target.value })}
                    className={fieldClass}
                  />
                </AuthField>
                <AuthField
                  label="About your work"
                  hint="At least 10 characters. Shown on your profile after approval."
                >
                  <textarea
                    required
                    minLength={10}
                    rows={3}
                    value={celeb.bio}
                    onChange={(e) => setCeleb({ ...celeb, bio: e.target.value })}
                    className={areaClass}
                  />
                </AuthField>
                <AuthField label="Social profile link (optional)" hint="Helps us confirm it is really you.">
                  <input
                    type="url"
                    placeholder="https://instagram.com/…"
                    value={celeb.socialUrl}
                    onChange={(e) => setCeleb({ ...celeb, socialUrl: e.target.value })}
                    className={fieldClass}
                  />
                </AuthField>
              </div>
            )}

            {accountType === 'ORG' && (
              <div key="org" className="animate-rise space-y-4">
                <AuthField label="Company name">
                  <input
                    required
                    minLength={2}
                    value={org.companyName}
                    onChange={(e) => setOrg({ ...org, companyName: e.target.value })}
                    className={fieldClass}
                  />
                </AuthField>
                <AuthField label="GST or registration number">
                  <input
                    required
                    minLength={3}
                    value={org.registrationNo}
                    onChange={(e) => setOrg({ ...org, registrationNo: e.target.value })}
                    className={fieldClass}
                  />
                </AuthField>
                <AuthField label="Website (optional)">
                  <input
                    type="url"
                    placeholder="https://…"
                    value={org.websiteUrl}
                    onChange={(e) => setOrg({ ...org, websiteUrl: e.target.value })}
                    className={fieldClass}
                  />
                </AuthField>
              </div>
            )}

            {accountType !== 'NORMAL' && (
              <p className="rounded-2xl bg-lilac/50 px-4 py-3 text-sm text-ink">
                You can use the app straight away. Your {accountType === 'ORG' ? 'host' : 'creator'} tools
                switch on once we approve your application.
              </p>
            )}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <AuthError>{error}</AuthError>
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                type="button"
                variant="quiet"
                size="lg"
                onClick={() => {
                  setError(null);
                  setStep((s) => s - 1);
                }}
              >
                Back
              </Button>
            )}
            <Button type="submit" size="lg" disabled={busy} className="flex-1">
              {busy ? <Dots /> : step < STEPS.length - 1 ? 'Continue' : 'Create account'}
            </Button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
