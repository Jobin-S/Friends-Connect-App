import { Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { Backdrop } from './Backdrop';
import { ToastProvider } from './Toast';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

/** Soft Aurora theme root: font, scoped colors, drifting backdrop and toasts. */
export function AuroraFrame({ children }: { children: ReactNode }) {
  return (
    <div className={`aurora relative isolate min-h-screen ${jakarta.variable}`}>
      <Backdrop />
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
