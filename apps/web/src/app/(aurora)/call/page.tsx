'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Dots } from '@/components/ui/motion';
import type { Hue } from '@/data/aurora-mock';
import { useCoins } from '@/data/aurora-store';

type Phase = 'ringing' | 'live' | 'ended';

function CtrlButton({
  label,
  on,
  onClick,
  danger,
  children,
}: {
  label: string;
  on?: boolean;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      className={`press grid h-16 w-16 place-items-center rounded-full transition-colors ${
        danger ? 'bg-[#E5484D] text-white hover:bg-[#d13f44]' : on ? 'bg-white text-ink' : 'bg-white/15 text-white hover:bg-white/25'
      }`}
    >
      {children}
    </button>
  );
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function CallScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const peer = params.get('with') ?? 'Someone new';
  const hue = (params.get('hue') as Hue) ?? 'lilac';
  const rate = Number(params.get('rate') ?? 0);
  const support = params.get('support') === '1';
  // Support calls are audio only.
  const videoAllowed = !support && params.get('type') === 'video';

  const [phase, setPhase] = useState<Phase>('ringing');
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(videoAllowed);
  const [camError, setCamError] = useState<string | null>(null);
  const [, setCoins] = useCoins();
  const selfVideo = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  // TODO(rtc): replace the simulated answer with WebRtcCallClient once auth tokens are available.
  useEffect(() => {
    const t = setTimeout(() => setPhase('live'), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (!camOn) {
      stream.current?.getVideoTracks().forEach((t) => t.stop());
      stream.current = null;
      return;
    }
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream.current = s;
        if (selfVideo.current) selfVideo.current.srcObject = s;
        setCamError(null);
      })
      .catch(() => {
        setCamError('Camera is blocked. Allow it in your browser settings to show your video.');
        setCamOn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [camOn]);

  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  const cost = rate ? Math.ceil(secs / 60) * rate : 0;
  const hangUp = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    if (cost) setCoins((c) => Math.max(0, c - cost));
    setPhase('ended');
  };

  const glow: Record<Hue, string> = {
    peach: 'from-[#FF9C7A]/50',
    lilac: 'from-[#B3A2FF]/50',
    mint: 'from-[#8EDBB8]/50',
    coral: 'from-[#FF7A59]/50',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink text-white">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${glow[hue]} to-transparent`} aria-hidden />

      <header className="relative flex items-center justify-between px-5 pt-6">
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold tabular-nums">
          {phase === 'live' ? fmt(secs) : phase === 'ringing' ? 'Calling' : 'Call ended'}
        </span>
        {rate > 0 && phase !== 'ringing' && (
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold tabular-nums">
            {cost} coins used
          </span>
        )}
        {support && <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">Support, audio only</span>}
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="relative">
          {phase === 'ringing' && (
            <>
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ripple" />
              <span className="absolute inset-0 rounded-full bg-white/15 animate-ripple" style={{ animationDelay: '1.2s' }} />
            </>
          )}
          {phase === 'live' && !muted && (
            <span className="absolute -inset-3 rounded-full border-2 border-white/30 animate-breathe" aria-hidden />
          )}
          <Avatar name={peer} hue={hue} size="xl" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">{peer}</h1>
        <p className="mt-2 flex items-center gap-2 text-white/70">
          {phase === 'ringing' && (
            <>
              Ringing <Dots />
            </>
          )}
          {phase === 'live' && (videoAllowed ? 'Video call' : 'Audio call')}
          {phase === 'ended' && `You talked for ${fmt(secs)}${cost ? `, ${cost} coins` : ''}`}
        </p>
        {camError && <p className="mt-4 max-w-xs text-sm text-[#FFB49F]">{camError}</p>}

        {phase === 'ended' && (
          <div className="mt-8 flex gap-3">
            <button onClick={() => router.back()} className="press h-12 rounded-full bg-white/15 px-6 font-semibold hover:bg-white/25">
              Back
            </button>
            <button onClick={() => router.push('/home')} className="press h-12 rounded-full bg-coral px-6 font-semibold shadow-lift">
              Meet someone new
            </button>
          </div>
        )}
      </main>

      {/* Self view */}
      {camOn && phase !== 'ended' && (
        <video
          ref={selfVideo}
          autoPlay
          playsInline
          muted
          className="absolute bottom-36 right-4 aspect-[3/4] w-28 animate-rise rounded-3xl object-cover ring-2 ring-white/40 [transform:scaleX(-1)] md:w-40"
        />
      )}

      {phase !== 'ended' && (
        <footer className="relative flex justify-center gap-4 pb-10">
          <CtrlButton label={muted ? 'Unmute' : 'Mute'} on={muted} onClick={() => setMuted((m) => !m)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              {muted && <path d="M4 4l16 16" />}
            </svg>
          </CtrlButton>
          {videoAllowed && (
            <CtrlButton label={camOn ? 'Turn camera off' : 'Turn camera on'} on={!camOn} onClick={() => setCamOn((c) => !c)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="6" width="13" height="12" rx="2" />
                <path d="M16 10l5-3v10l-5-3" />
                {!camOn && <path d="M3 3l18 18" />}
              </svg>
            </CtrlButton>
          )}
          <CtrlButton label="End call" danger onClick={hangUp}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 9c-3.3 0-6.3.9-8.6 2.5-.6.4-.8 1.2-.4 1.8l1.3 2c.4.6 1.1.8 1.7.5l2.5-1.2c.5-.2.8-.8.7-1.3l-.3-1.6c1-.3 2-.4 3.1-.4s2.1.1 3.1.4l-.3 1.6c-.1.5.2 1.1.7 1.3l2.5 1.2c.6.3 1.3.1 1.7-.5l1.3-2c.4-.6.2-1.4-.4-1.8C18.3 9.9 15.3 9 12 9z" />
            </svg>
          </CtrlButton>
        </footer>
      )}
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-ink" />}>
      <CallScreen />
    </Suspense>
  );
}
