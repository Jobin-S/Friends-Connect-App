/** The slow-moving pastel aurora behind every Soft Aurora screen. */
export function Backdrop({ intensity = 'soft' }: { intensity?: 'soft' | 'full' }) {
  const o = intensity === 'full' ? 'opacity-90' : 'opacity-60';
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className={`absolute -left-[12%] -top-[18%] h-[60vmax] w-[60vmax] rounded-full bg-peach blur-[90px] animate-drift ${o}`}
      />
      <div
        className={`absolute -right-[15%] top-[8%] h-[52vmax] w-[52vmax] rounded-full bg-lilac blur-[100px] animate-drift-slow ${o}`}
      />
      <div
        className={`absolute -bottom-[25%] left-[25%] h-[48vmax] w-[48vmax] rounded-full bg-mint blur-[110px] animate-drift ${o}`}
        style={{ animationDelay: '-9s' }}
      />
      {/* Paper grain keeps the gradients from looking plastic */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-multiply">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
