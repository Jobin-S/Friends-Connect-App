import { Avatar } from './Avatar';
import type { Hue } from '@/data/aurora-mock';

const inner: Array<{ name: string; hue: Hue }> = [
  { name: 'Anaya R', hue: 'lilac' },
  { name: 'Kiran P', hue: 'mint' },
  { name: 'Fathima S', hue: 'peach' },
];
const outer: Array<{ name: string; hue: Hue }> = [
  { name: 'Meera Varma', hue: 'peach' },
  { name: 'Joel M', hue: 'mint' },
  { name: 'Arjun Das', hue: 'coral' },
  { name: 'Riya K', hue: 'lilac' },
  { name: 'Sana Ali', hue: 'lilac' },
];

function Ring({
  people,
  radius,
  reverse,
}: {
  people: Array<{ name: string; hue: Hue }>;
  radius: number;
  reverse?: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 ${reverse ? 'animate-counter' : 'animate-orbit'}`}
      style={reverse ? { animationDuration: '64s' } : undefined}
    >
      <div
        className="absolute left-1/2 top-1/2 rounded-full border border-dashed border-ink/10"
        style={{ width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius }}
      />
      {people.map((p, i) => {
        const angle = (i / people.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <div
            key={p.name}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))` }}
          >
            {/* counter-rotate so faces stay upright */}
            <div
              className={reverse ? 'animate-orbit' : 'animate-counter'}
              style={reverse ? { animationDuration: '64s' } : undefined}
            >
              <Avatar name={p.name} hue={p.hue} size={i % 2 ? 'sm' : 'md'} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Landing hero: people orbiting a central connect orb. */
export function OrbitHero() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]" aria-hidden>
      <div className="absolute inset-[6%] rounded-full bg-white/30 backdrop-blur-sm" />
      <Ring people={outer} radius={200} reverse />
      <Ring people={inner} radius={120} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 rounded-full bg-coral/40 animate-ripple" />
        <span
          className="absolute inset-0 rounded-full bg-coral/30 animate-ripple"
          style={{ animationDelay: '1.2s' }}
        />
        <div className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#FF9C7A] to-coral-deep text-white shadow-lift animate-breathe">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12a8 8 0 0 1 16 0" strokeLinecap="round" />
            <path d="M8 12a4 4 0 0 1 8 0" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          </svg>
        </div>
      </div>
      {/* Floating call bubbles */}
      <div className="glass absolute right-[2%] top-[14%] rounded-2xl px-3 py-2 text-xs font-semibold text-ink shadow-glass animate-drift">
        On a video call, 12:04
      </div>
      <div className="glass absolute bottom-[12%] left-0 rounded-2xl px-3 py-2 text-xs font-semibold text-ink shadow-glass animate-drift-slow">
        Matched with Kiran
      </div>
    </div>
  );
}
