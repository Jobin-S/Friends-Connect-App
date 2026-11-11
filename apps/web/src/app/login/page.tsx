'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { Button, Card, ErrorText, Field, Input } from '../../components/form';
import { ApiError } from '../../lib/api';
import { savePendingRegistration, useAuth } from '../../lib/auth';

function LoginForm() {
  const { user, loading, requestOtp, verifyOtp } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await requestOtp(phone);
      setNormalizedPhone(res.phone);
      setResendIn(res.resendAfterSeconds);
      setStep('code');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Is the API running?');
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await verifyOtp(normalizedPhone, code);
      if (res.status === 'NEEDS_REGISTRATION') {
        savePendingRegistration(res.phone, res.registrationToken);
        router.push('/register');
      } else {
        router.replace(next);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Log in to Friends Connect">
      {step === 'phone' ? (
        <form onSubmit={sendCode} className="space-y-4">
          <Field label="Mobile number" hint="Indian numbers can be entered without +91.">
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              required
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={busy || !phone} className="w-full">
            {busy ? 'Sending…' : 'Send code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-4">
          <p className="text-sm text-slate-300">
            Enter the 6-digit code sent to <strong>{normalizedPhone}</strong>.
          </p>
          <Field label="Code" hint="Development: the code is always 123456.">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              maxLength={6}
              pattern="\d{6}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={busy || code.length !== 6} className="w-full">
            {busy ? 'Checking…' : 'Verify and continue'}
          </Button>
          <div className="flex justify-between text-sm">
            <button
              type="button"
              className="text-slate-400 hover:text-white"
              onClick={() => setStep('phone')}
            >
              Change number
            </button>
            <button
              type="button"
              className="text-blue-400 hover:text-blue-300 disabled:text-slate-600"
              disabled={resendIn > 0 || busy}
              onClick={() => sendCode()}
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
