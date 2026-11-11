'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { AuthError, AuthField, AuthLayout, FacesCluster, fieldClass } from '../../components/ui/AuthLayout';
import { Dots } from '../../components/ui/motion';
import { ApiError } from '../../lib/api';
import { savePendingRegistration, useAuth } from '../../lib/auth';

/** One real input drawn as six boxes, so paste and SMS autofill still work. */
function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(true);
  return (
    <div className="relative" onClick={() => ref.current?.focus()}>
      <div className="grid grid-cols-6 gap-2" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => {
          const active = focused && (i === value.length || (i === 5 && value.length === 6));
          const filled = i < value.length;
          return (
            <span
              key={i}
              className={`grid h-14 place-items-center rounded-2xl border-2 bg-white/80 text-2xl font-extrabold tabular-nums transition-all duration-200 ${
                active ? 'border-coral shadow-lift' : filled ? 'border-ink/20' : 'border-line'
              } ${filled ? 'scale-100' : 'scale-[0.97]'}`}
            >
              {value[i] ?? (active ? <span className="h-6 w-0.5 animate-breathe rounded bg-coral" /> : '')}
            </span>
          );
        })}
      </div>
      <input
        ref={ref}
        aria-label="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        required
        maxLength={6}
        pattern="\d{6}"
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  );
}

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
    <div className="glass rounded-[2.25rem] p-7 shadow-glass md:p-9">
      {/* Progress: two real steps */}
      <div className="flex gap-1.5" aria-hidden>
        <span className="h-1.5 flex-1 rounded-full bg-coral" />
        <span className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step === 'code' ? 'bg-coral' : 'bg-ink/10'}`} />
      </div>

      {step === 'phone' ? (
        <form key="phone" onSubmit={sendCode} className="mt-7 animate-rise space-y-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Log in or sign up</h1>
            <p className="mt-2 text-ink-soft">We will text you a code. No password to remember.</p>
          </div>
          <AuthField label="Mobile number" hint="Indian numbers can be entered without +91.">
            <span className="flex items-center gap-2">
              <span className="grid h-12 shrink-0 place-items-center rounded-2xl border border-line bg-white/60 px-3 text-sm font-semibold text-ink-soft">
                +91
              </span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                autoFocus
                required
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${fieldClass} text-lg font-semibold tracking-wide`}
              />
            </span>
          </AuthField>
          <AuthError>{error}</AuthError>
          <Button type="submit" size="lg" disabled={busy || !phone} className="w-full">
            {busy ? <Dots /> : 'Send code'}
          </Button>
          <p className="text-center text-xs leading-relaxed text-ink-faint">
            By continuing you agree to our terms and privacy policy. Your number is never shown to other people.
          </p>
        </form>
      ) : (
        <form key="code" onSubmit={submitCode} className="mt-7 animate-rise space-y-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Enter your code</h1>
            <p className="mt-2 text-ink-soft">
              Sent to <strong className="font-semibold text-ink">{normalizedPhone}</strong>
            </p>
          </div>
          <CodeInput value={code} onChange={setCode} />
          {process.env.NODE_ENV !== 'production' && (
            <p className="text-xs text-ink-faint">Development: the code is always 123456.</p>
          )}
          <AuthError>{error}</AuthError>
          <Button type="submit" size="lg" disabled={busy || code.length !== 6} className="w-full">
            {busy ? <Dots /> : 'Verify and continue'}
          </Button>
          <div className="flex justify-between text-sm font-semibold">
            <button type="button" className="text-ink-soft hover:text-ink" onClick={() => setStep('phone')}>
              Change number
            </button>
            <button
              type="button"
              className="text-coral-deep hover:underline disabled:text-ink-faint disabled:no-underline"
              disabled={resendIn > 0 || busy}
              onClick={() => sendCode()}
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      aside={
        <div className="max-w-md">
          <FacesCluster />
          <h2 className="mt-6 text-5xl font-extrabold leading-[1.02] tracking-[-0.03em]">
            Good to see you.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            2,418 people are online in Kerala right now. Log in to meet one of them.
          </p>
        </div>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
