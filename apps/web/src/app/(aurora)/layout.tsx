import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { Backdrop } from '@/components/ui/Backdrop';
import { ToastProvider } from '@/components/ui/Toast';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Friends Connect',
  description: 'Talk to someone new, call the people you follow, and find events near you.',
};

/** Soft Aurora shell. Scoped with .aurora so the legacy screens keep their own styles. */
export default function AuroraLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`aurora relative isolate min-h-screen ${jakarta.variable}`}>
      <Backdrop />
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
