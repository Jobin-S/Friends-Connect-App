import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'quiet' | 'ghost';

const base =
  'press inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const variants: Record<Variant, string> = {
  primary: 'bg-coral text-white shadow-lift hover:bg-coral-deep',
  quiet: 'glass text-ink hover:bg-white/90',
  ghost: 'text-ink-soft hover:text-ink hover:bg-white/50',
};
const sizes = { md: 'h-11 px-5 text-sm', lg: 'h-14 px-7 text-base' };

interface Common {
  variant?: Variant;
  size?: keyof typeof sizes;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: Common & ComponentProps<'button'>) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  href,
  children,
}: Common & { href: string }) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  );
}
