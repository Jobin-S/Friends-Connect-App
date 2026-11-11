'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Avatar, hueSurface } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Confetti, Dots } from '@/components/ui/motion';
import { recentChats, interests, type Hue } from '@/data/aurora-mock';

type Phase = 'idle' | 'searching' | 'found';
type Mode = 'audio' | 'video';

const candidates: Array<{ name: string; age: number; city: string; hue: Hue; shared: string[] }> = [
  { name: 'Anaya', age: 24, city: 'Kochi', hue: 'lilac', shared: ['Music', 'Films'] },
  { name: 'Kiran', age: 27, city: 'Thrissur', hue: 'mint', shared: ['Cricket', 'Startups'] },
  { name: 'Fathima', age: 22, city: 'Kozhikode', hue: 'peach', shared: ['Food', 'Travel'] },
];

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<Mode>('video');
  const [picked, setPicked] = useState<string[]>(['Music', 'Films']);
  const [match, setMatch] = useState(candidates[0]);
  const [burst, setBurst] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // TODO(api): replace the timeout with the matchmaking socket once it is wired to auth.
  const connect = () => {
    setPhase('searching');
    timer.current = setTimeout(() => {
      setMatch(candidates[Math.floor(Math.random() * candidates.length)]);
      setPhase('found');
      setBurst((b) => b + 1);
    }, 2600);
  };
  const cancel = () => {
    clearTimeout(timer.current);
    setPhase('idle');
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const toggle = (i: string) =>
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length < 3 ? [...p, i] : p));

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
      {/* Match stage */}
      <section className="glass relative overflow-hidden rounded-[2.5rem] px-6 pb-8 pt-7 shadow-glass md:px-10">
        <Confetti fire={burst} />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {phase === 'found' ? `Say hi to ${match.name}` : phase === 'searching' ? 'Finding someone' : 'Who will you meet?'}
          </h1>
          <div role="radiogroup" aria-label="Call type" className="flex rounded-full bg-ink/5 p-1">
            {(['audio', 'video'] as const).map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={mode === m}
                disabled={phase === 'searching'}
                onClick={() => setMode(m)}
                className={`press rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  mode === m ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mx-auto mt-6 grid aspect-square w-full max-w-[340px] place-items-center">
          {/* Radar rings */}
          {[1, 0.74, 0.48].map((s) => (
            <span
              key={s}
              className="absolute rounded-full border border-ink/[0.07]"
              style={{ width: `${s * 100}%`, height: `${s * 100}%` }}
            />
          ))}
          {phase === 'searching' && (
            <>
              <span
                className="absolute inset-0 rounded-full animate-sweep"
                style={{ background: 'conic-gradient(from 0deg, rgba(255,122,89,0.28), rgba(255,122,89,0) 28%)' }}
              />
              {[0, 0.8, 1.6].map((d) => (
                <span
                  key={d}
                  className="absolute h-1/3 w-1/3 rounded-full bg-coral/25 animate-ripple"
                  style={{ animationDelay: `${d}s` }}
                />
              ))}
              {/* Faint blips of people being considered */}
              {[
                ['18%', '30%'],
                ['70%', '22%'],
                ['62%', '74%'],
                ['26%', '68%'],
              ].map(([l, t], i) => (
                <span
                  key={i}
                  className="absolute h-2.5 w-2.5 rounded-full bg-coral animate-breathe"
                  style={{ left: l, top: t, animationDelay: `${i * 0.4}s` }}
                />
              ))}
            </>
          )}

          {phase === 'found' ? (
            <div className="relative flex animate-rise flex-col items-center text-center">
              <Avatar name={match.name} hue={match.hue} size="xl" status="online" />
              <p className="mt-4 text-xl font-bold">
                {match.name}, {match.age}
              </p>
              <p className="text-sm text-ink-soft">{match.city}</p>
              <div className="mt-3 flex gap-2">
                {match.shared.map((s) => (
                  <span key={s} className={`rounded-full px-3 py-1 text-xs font-semibold ${hueSurface[match.hue]}`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={phase === 'idle' ? connect : cancel}
              aria-label={phase === 'idle' ? `Connect by ${mode}` : 'Stop searching'}
              className="press relative grid h-36 w-36 place-items-center rounded-full bg-gradient-to-br from-[#FF9C7A] to-coral-deep text-white shadow-lift"
            >
              {phase === 'idle' && <span className="absolute inset-0 rounded-full bg-coral/40 animate-ripple" />}
              <span className="relative flex flex-col items-center">
                <span className="text-lg font-extrabold">{phase === 'idle' ? 'Connect' : 'Stop'}</span>
                {phase === 'searching' ? (
                  <Dots className="mt-1" />
                ) : (
                  <span className="text-xs font-medium text-white/80">{mode} call</span>
                )}
              </span>
            </button>
          )}
        </div>

        {phase === 'found' ? (
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="quiet" size="lg" onClick={connect}>
              Skip
            </Button>
            <ButtonLink href={`/call?with=${match.name}&type=${mode}&hue=${match.hue}`} size="lg">
              Start {mode} call
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-center text-sm text-ink-soft">
              {phase === 'searching'
                ? 'Looking for someone who shares your interests'
                : 'Pick up to three interests to meet people like you'}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {interests.map((i) => {
                const on = picked.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    aria-pressed={on}
                    disabled={phase === 'searching'}
                    className={`press rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                      on ? 'border-ink bg-ink text-white' : 'border-line bg-white/50 text-ink-soft hover:text-ink'
                    }`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Side column */}
      <aside className="grid content-start gap-6">
        <div className="glass rounded-[2rem] p-6 shadow-glass">
          <h2 className="font-bold">Recent conversations</h2>
          <ul className="mt-4 grid gap-1">
            {recentChats.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-white/60">
                <Avatar name={c.name} hue={c.hue} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-ink-soft">
                    {c.kind} call, {c.duration}
                  </p>
                </div>
                <span className="text-xs text-ink-faint">{c.when}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/celebrities" className={`press block rounded-[2rem] p-6 ${hueSurface.peach}`}>
          <p className="text-sm font-semibold text-ink-soft">4 stars are online</p>
          <p className="mt-1 text-xl font-extrabold tracking-tight">Call Meera Varma tonight</p>
          <div className="mt-4 flex -space-x-2">
            {(['peach', 'mint', 'lilac', 'coral'] as const).map((h, i) => (
              <Avatar key={h} name={['Meera Varma', 'Arjun Das', 'Sana Ali', 'Dev Menon'][i]} hue={h} size="sm" />
            ))}
          </div>
        </Link>

        <Link href="/events" className={`press block rounded-[2rem] p-6 ${hueSurface.mint}`}>
          <p className="text-sm font-semibold text-ink-soft">Saturday, 6:30 pm</p>
          <p className="mt-1 text-xl font-extrabold tracking-tight">Backwater Sessions, 4 km away</p>
        </Link>
      </aside>
    </div>
  );
}
