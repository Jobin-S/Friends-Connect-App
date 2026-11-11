import Link from 'next/link';
import { Avatar, hueSurface } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/motion';
import { OrbitHero } from '@/components/ui/Orbit';
import { celebrities, events, formatCount, formatRupees } from '@/data/aurora-mock';

const steps = [
  { title: 'Tap Connect', body: 'Pick audio or video. We find someone who is online and looking to talk.' },
  { title: 'Say hello', body: 'You both see a first name and shared interests. Nothing else until you share it.' },
  { title: 'Stay or skip', body: 'Keep the conversation going, or skip to the next person. No awkward goodbyes.' },
];

export default function WelcomePage() {
  const stars = celebrities.slice(0, 4);
  const upcoming = events.slice(0, 3);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6">
        <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-coral text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          Friends Connect
        </span>
        <nav className="flex items-center gap-1 text-sm font-semibold" aria-label="Site">
          <Link href="/celebrities" className="hidden rounded-full px-4 py-2 text-ink-soft hover:text-ink sm:block">
            Stars
          </Link>
          <Link href="/events" className="hidden rounded-full px-4 py-2 text-ink-soft hover:text-ink sm:block">
            Events
          </Link>
          <ButtonLink href="/login" variant="quiet">
            Log in
          </ButtonLink>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-12 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div>
          <h1 className="animate-rise text-[clamp(2.6rem,6.5vw,4.75rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
            Say hello to someone new in one tap.
          </h1>
          <p
            className="animate-rise mt-6 max-w-md text-lg leading-relaxed text-ink-soft"
            style={{ animationDelay: '120ms' }}
          >
            Random audio and video calls with people nearby, direct calls with the creators you follow, and
            tickets to what is on this weekend.
          </p>
          <div className="animate-rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: '220ms' }}>
            <ButtonLink href="/login" size="lg">
              Start talking
            </ButtonLink>
            <ButtonLink href="/celebrities" size="lg" variant="quiet">
              Browse stars
            </ButtonLink>
          </div>
          <div className="animate-rise mt-10 flex items-center gap-3" style={{ animationDelay: '320ms' }}>
            <div className="flex -space-x-3">
              {(['peach', 'lilac', 'mint', 'coral'] as const).map((h, i) => (
                <Avatar key={h} name={['Anaya R', 'Joel M', 'Riya K', 'Kiran P'][i]} hue={h} size="sm" />
              ))}
            </div>
            <p className="text-sm text-ink-soft">
              <strong className="font-bold text-ink">2,418 people</strong> are online in Kerala right now
            </p>
          </div>
        </div>
        <OrbitHero />
      </section>

      {/* How a match works: a real sequence, so it is numbered */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <h2 className="max-w-xl text-3xl font-extrabold tracking-tight md:text-4xl">
            Meeting someone takes about four seconds.
          </h2>
        </Reveal>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 90} className="glass rounded-[1.75rem] p-6 shadow-glass">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Stars */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Call the people you follow.</h2>
            <p className="mt-3 max-w-md text-ink-soft">
              Verified singers, athletes, chefs and comics take calls by the minute, paid with coins.
            </p>
          </div>
          <Link href="/celebrities" className="font-semibold text-coral-deep hover:underline">
            See all stars
          </Link>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stars.map((c, i) => (
            <Reveal key={c.id} delay={i * 70}>
              <Link
                href={`/celebrities/${c.id}`}
                className={`press group block rounded-[2rem] p-5 ${hueSurface[c.hue]}`}
              >
                <Avatar name={c.name} hue={c.hue} size="lg" status={c.status} />
                <p className="mt-6 font-bold leading-tight">{c.name}</p>
                <p className="text-sm text-ink-soft">{c.craft}</p>
                <p className="mt-4 text-sm font-semibold">
                  {c.audioRate} coins a minute
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Events */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Then meet in person.</h2>
          <p className="mt-3 max-w-md text-ink-soft">Gigs, food walks and screenings near you, booked in the app.</p>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {upcoming.map((e, i) => {
            const d = new Date(e.date);
            return (
              <Reveal key={e.id} delay={i * 80}>
                <Link href={`/events/${e.id}`} className="press glass flex gap-4 rounded-[1.75rem] p-4 shadow-glass">
                  <div className={`grid w-16 shrink-0 place-items-center rounded-2xl py-3 text-center ${hueSurface[e.hue]}`}>
                    <span className="text-2xl font-extrabold leading-none">{d.getDate()}</span>
                    <span className="text-xs font-semibold text-ink-soft">
                      {d.toLocaleString('en-IN', { month: 'short' })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{e.title}</p>
                    <p className="truncate text-sm text-ink-soft">{e.venue}</p>
                    <p className="mt-2 text-sm font-semibold">From {formatRupees(Math.min(...e.tiers.map((t) => t.price)))}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Safety */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal className="grid gap-8 rounded-[2.5rem] bg-ink px-8 py-12 text-white md:grid-cols-2 md:px-14">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">You decide what people see.</h2>
            <p className="mt-4 max-w-md leading-relaxed text-white/70">
              Your phone number stays private. Report or block anyone in one tap, and a real person on our support
              team reviews every report.
            </p>
          </div>
          <ul className="grid gap-3 self-center text-white/90">
            {['Phone number never shown to others', 'Video stays off until you turn it on', 'Support by chat or voice, 7 days a week'].map(
              (t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-mint text-ink">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                  {t}
                </li>
              ),
            )}
          </ul>
        </Reveal>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-10 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Someone nearby is waiting to talk.
          </h2>
          <p className="mt-4 text-ink-soft">
            {formatCount(celebrities.reduce((a, c) => a + c.followers, 0))} people follow our stars. Join with your phone number.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/login" size="lg">
              Start talking
            </ButtonLink>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-5 py-8 text-sm text-ink-soft">
          <span>© 2026 Friends Connect</span>
          <span className="flex gap-5">
            <Link href="/support" className="hover:text-ink">Help</Link>
            <Link href="/events" className="hover:text-ink">Events</Link>
            <Link href="/celebrities" className="hover:text-ink">Stars</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
