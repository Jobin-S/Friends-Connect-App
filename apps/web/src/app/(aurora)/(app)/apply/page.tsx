'use client';

import type { ApplyBody } from '@friends-connect/contracts';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { ApplicationNotice } from '@/components/ui/ApplicationNotice';
import { hueSurface } from '@/components/ui/Avatar';
import { areaClass, AuthError, AuthField, fieldClass } from '@/components/ui/AuthLayout';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Dots } from '@/components/ui/motion';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Role = 'CELEBRITY' | 'ORG';

const COPY: Record<Role, { title: string; lede: string; hue: 'peach' | 'lilac'; other: string }> = {
  CELEBRITY: {
    title: 'Apply as a creator',
    lede: 'Tell us what you do. We check every application and usually reply within two working days.',
    hue: 'peach',
    other: 'Apply to host events instead',
  },
  ORG: {
    title: 'Apply to host events',
    lede: 'Add your business details. We verify them and usually reply within two working days.',
    hue: 'lilac',
    other: 'Apply as a creator instead',
  },
};

function ApplyForm() {
  const { user, refreshUser } = useAuth();
  const role: Role = useSearchParams().get('role') === 'ORG' ? 'ORG' : 'CELEBRITY';
  const copy = COPY[role];
  const [celeb, setCeleb] = useState({ category: '', bio: '', socialUrl: '' });
  const [org, setOrg] = useState({ companyName: '', registrationNo: '', websiteUrl: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user) return null;

  if (user.role !== 'NORMAL') {
    return (
      <div className="glass mx-auto max-w-xl rounded-[2rem] p-8 text-center shadow-glass">
        <h1 className="text-2xl font-extrabold tracking-tight">Your account is already approved.</h1>
        <p className="mt-2 text-ink-soft">Your tools are on your dashboard.</p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/">Open my dashboard</ButtonLink>
        </div>
      </div>
    );
  }

  const pending = user.latestApplication?.status === 'PENDING';
  if (pending || sent) {
    return (
      <div className="mx-auto grid max-w-xl gap-5">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {sent ? 'Application sent' : 'Already applied'}
        </h1>
        <ApplicationNotice />
        <ButtonLink href="/home" variant="quiet" className="w-fit">
          Back to Match
        </ButtonLink>
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const body: ApplyBody =
      role === 'CELEBRITY'
        ? { requestedRole: 'CELEBRITY', details: celeb }
        : { requestedRole: 'ORG', details: org };
    try {
      await api('/api/me/applications', { method: 'POST', body });
      await refreshUser();
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send your application. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_minmax(0,460px)]">
      <section className={`h-fit rounded-[2.25rem] p-8 ${hueSurface[copy.hue]}`}>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{copy.title}</h1>
        <p className="mt-3 max-w-sm leading-relaxed text-ink/75">{copy.lede}</p>
        <p className="mt-6 text-sm text-ink/70">
          You can keep using Friends Connect as usual while we review it.
        </p>
        <Link
          href={`/apply?role=${role === 'CELEBRITY' ? 'ORG' : 'CELEBRITY'}`}
          className="mt-6 inline-block text-sm font-semibold underline-offset-4 hover:underline"
        >
          {copy.other}
        </Link>
      </section>

      <form onSubmit={submit} className="glass grid gap-4 rounded-[2.25rem] p-7 shadow-glass">
        {role === 'CELEBRITY' ? (
          <>
            <AuthField label="What do you do?" hint="For example: Cinema, Music, Comedy, Sports">
              <input
                required
                minLength={2}
                maxLength={80}
                value={celeb.category}
                onChange={(e) => setCeleb({ ...celeb, category: e.target.value })}
                className={fieldClass}
              />
            </AuthField>
            <AuthField label="About you" hint="At least 10 characters. Shown on your profile after approval.">
              <textarea
                required
                minLength={10}
                maxLength={1000}
                rows={4}
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
          </>
        ) : (
          <>
            <AuthField label="Company name">
              <input
                required
                minLength={2}
                maxLength={120}
                value={org.companyName}
                onChange={(e) => setOrg({ ...org, companyName: e.target.value })}
                className={fieldClass}
              />
            </AuthField>
            <AuthField label="GST or registration number">
              <input
                required
                minLength={3}
                maxLength={40}
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
          </>
        )}
        <AuthError>{error}</AuthError>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? <Dots /> : 'Send application'}
        </Button>
      </form>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense>
      <ApplyForm />
    </Suspense>
  );
}
