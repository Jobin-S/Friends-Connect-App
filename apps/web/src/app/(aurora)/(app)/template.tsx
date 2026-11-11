import type { ReactNode } from 'react';

/** Re-mounts on every navigation, so each page eases in. */
export default function PageTransition({ children }: { children: ReactNode }) {
  return <div className="animate-rise">{children}</div>;
}
