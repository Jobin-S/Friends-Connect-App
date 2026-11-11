'use client';

import type { AccountType, RegisterBody } from '@friends-connect/contracts';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Button, Card, ErrorText, Field, Input, TextArea } from '../../components/form';
import { ApiError } from '../../lib/api';
import { readPendingRegistration, useAuth } from '../../lib/auth';

const ACCOUNT_OPTIONS: { value: AccountType; label: string; description: string }[] = [
  {
    value: 'NORMAL',
    label: 'Normal user',
    description: 'Random calls, celebrity calls and events. Ready to use right away.',
  },
  {
    value: 'CELEBRITY',
    label: 'Celebrity',
    description: 'Take paid fan calls. An admin reviews your application first.',
  },
  {
    value: 'ORG',
    label: 'Event organizer',
    description: 'Publish events and sell tickets. An admin reviews your application first.',
  },
];

export default function RegisterPage() {
  const { user, register } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<{ phone: string; registrationToken: string } | null>(null);
  const [accountType, setAccountType] = useState<AccountType>('NORMAL');
  const [displayName, setDisplayName] = useState('');
  const [celeb, setCeleb] = useState({ category: '', bio: '', socialUrl: '' });
  const [org, setOrg] = useState({ companyName: '', registrationNo: '', websiteUrl: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) return router.replace('/');
    const p = readPendingRegistration();
    if (!p) router.replace('/login');
    else setPending(p);
  }, [user, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setError(null);
    setBusy(true);
    const base = { registrationToken: pending.registrationToken, displayName };
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
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!pending) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg">
        <Card title="Create your account">
          <p className="text-sm text-slate-400">Verified number: {pending.phone}</p>

          <Field label="Your name">
            <Input
              required
              minLength={2}
              maxLength={60}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-200 mb-1">Account type</legend>
            {ACCOUNT_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`flex gap-3 rounded-lg border p-3 cursor-pointer ${
                  accountType === o.value ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value={o.value}
                  checked={accountType === o.value}
                  onChange={() => setAccountType(o.value)}
                />
                <span>
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="block text-xs text-slate-400">{o.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {accountType === 'CELEBRITY' && (
            <div className="space-y-3">
              <Field label="Category" hint="For example: Cinema, Music, Comedy, Sports">
                <Input
                  required
                  minLength={2}
                  value={celeb.category}
                  onChange={(e) => setCeleb({ ...celeb, category: e.target.value })}
                />
              </Field>
              <Field label="About you" hint="At least 10 characters. Shown on your profile after approval.">
                <TextArea
                  required
                  minLength={10}
                  rows={3}
                  value={celeb.bio}
                  onChange={(e) => setCeleb({ ...celeb, bio: e.target.value })}
                />
              </Field>
              <Field label="Social profile link (optional)" hint="Helps the admin verify you.">
                <Input
                  type="url"
                  placeholder="https://instagram.com/…"
                  value={celeb.socialUrl}
                  onChange={(e) => setCeleb({ ...celeb, socialUrl: e.target.value })}
                />
              </Field>
            </div>
          )}

          {accountType === 'ORG' && (
            <div className="space-y-3">
              <Field label="Company name">
                <Input
                  required
                  minLength={2}
                  value={org.companyName}
                  onChange={(e) => setOrg({ ...org, companyName: e.target.value })}
                />
              </Field>
              <Field label="GST / registration number">
                <Input
                  required
                  minLength={3}
                  value={org.registrationNo}
                  onChange={(e) => setOrg({ ...org, registrationNo: e.target.value })}
                />
              </Field>
              <Field label="Website (optional)">
                <Input
                  type="url"
                  placeholder="https://…"
                  value={org.websiteUrl}
                  onChange={(e) => setOrg({ ...org, websiteUrl: e.target.value })}
                />
              </Field>
            </div>
          )}

          {accountType !== 'NORMAL' && (
            <p className="text-xs text-amber-300">
              Until an admin approves your application, you can use the app as a normal user.
            </p>
          )}

          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Creating account…' : 'Create account'}
          </Button>
        </Card>
      </form>
    </main>
  );
}
