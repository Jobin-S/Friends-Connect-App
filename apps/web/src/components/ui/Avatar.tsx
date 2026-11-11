import type { Hue } from '@/data/aurora-mock';

const hues: Record<Hue, string> = {
  peach: 'from-[#FFC9AE] to-[#FF9C7A]',
  lilac: 'from-[#E4DBFF] to-[#B3A2FF]',
  mint: 'from-[#D8F7E8] to-[#8EDBB8]',
  coral: 'from-[#FFB49F] to-[#FF7A59]',
};

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-28 w-28 text-3xl',
};

export function Avatar({
  name,
  hue = 'peach',
  size = 'md',
  status,
  className = '',
}: {
  name: string;
  hue?: Hue;
  size?: keyof typeof sizes;
  status?: 'online' | 'busy' | 'away';
  className?: string;
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  const dot = status === 'online' ? 'bg-emerald-400' : status === 'busy' ? 'bg-amber-400' : 'bg-ink-faint';
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <span
        className={`grid place-items-center rounded-full bg-gradient-to-br font-bold text-ink/80 ring-2 ring-white ${hues[hue]} ${sizes[size]}`}
        aria-hidden
      >
        {initials}
      </span>
      {status && (
        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${dot}`}>
          <span className="sr-only">{status}</span>
        </span>
      )}
    </span>
  );
}

export const hueSurface: Record<Hue, string> = {
  peach: 'bg-gradient-to-br from-[#FFE3D4] to-[#FFC7AE]',
  lilac: 'bg-gradient-to-br from-[#EEE8FF] to-[#CFC2FF]',
  mint: 'bg-gradient-to-br from-[#E3FAEF] to-[#B4EBD2]',
  coral: 'bg-gradient-to-br from-[#FFD9CC] to-[#FF9F85]',
};
