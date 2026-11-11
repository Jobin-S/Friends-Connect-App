import Link from 'next/link';
import type { Hue } from '@/data/aurora-mock';
import { hueSurface } from './Avatar';
import { Reveal } from './motion';
import { AuthAwareLink, HeaderAuthAction } from './SignedInGate';

export interface JoinPageContent {
  intent: 'creator' | 'host';
  role: 'CELEBRITY' | 'ORG';
  hue: Hue;
  title: string;
  lede: string;
  cta: string;
  perks: Array<{ title: string; body: string }>;
  steps: Array<{ title: string; body: string }>;
  faq: Array<{ q: string; a: string }>;
}

/** Shared layout for the public "For creators" and "For hosts" pages. */
export function JoinPage({ c }: { c: JoinPageContent }) {
  const next = `/apply?role=${c.role}`;
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6">
        <Link href="/welcome" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-coral text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          Friends Connect
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold" aria-label="Site">
          <Link
            href={c.intent === 'creator' ? '/hosts' : '/creators'}
            className="hidden rounded-full px-4 py-2 text-ink-soft hover:text-ink sm:block"
          >
            {c.intent === 'creator' ? 'For hosts' : 'For creators'}
          </Link>
          <HeaderAuthAction />
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 md:pt-20">
        <div
          className={`relative overflow-hidden rounded-[2.75rem] px-7 py-14 md:px-14 ${hueSurface[c.hue]}`}
        >
          <div
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/40 animate-drift"
            aria-hidden
          />
          <div
            className="absolute -bottom-28 right-24 h-64 w-64 rounded-full bg-white/30 animate-drift-slow"
            aria-hidden
          />
          <h1 className="relative max-w-2xl animate-rise text-[clamp(2.4rem,5.5vw,4.25rem)] font-extrabold leading-[1] tracking-[-0.035em]">
            {c.title}
          </h1>
          <p
            className="relative mt-5 max-w-lg animate-rise text-lg leading-relaxed text-ink/75"
            style={{ animationDelay: '120ms' }}
          >
            {c.lede}
          </p>
          <div className="relative mt-8 animate-rise" style={{ animationDelay: '220ms' }}>
            <AuthAwareLink next={next} intent={c.intent}>
              {c.cta}
            </AuthAwareLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {c.perks.map((p, i) => (
            <Reveal key={p.title} delay={i * 80} className="glass rounded-[1.75rem] p-6 shadow-glass">
              <h2 className="text-lg font-bold">{p.title}</h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">How it works</h2>
        </Reveal>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {c.steps.map((s, i) => (
            <Reveal
              as="li"
              key={s.title}
              delay={i * 90}
              className="rounded-[1.75rem] bg-white/70 p-6 ring-1 ring-white"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <Reveal>
          <h2 className="text-3xl font-extrabold tracking-tight">Questions</h2>
        </Reveal>
        <div className="mt-6 divide-y divide-line rounded-[1.75rem] bg-white/70 ring-1 ring-white">
          {c.faq.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span
                  className="text-xl text-ink-faint transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <AuthAwareLink next={next} intent={c.intent}>
            {c.cta}
          </AuthAwareLink>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-5 py-8 text-sm text-ink-soft">
          <span>© 2026 Friends Connect</span>
          <Link href="/welcome" className="hover:text-ink">
            Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
