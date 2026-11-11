import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuroraFrame } from '@/components/ui/AuroraFrame';

export const metadata: Metadata = {
  title: 'Friends Connect',
  description: 'Talk to someone new, call the people you follow, and find events near you.',
};

/** Soft Aurora shell. Scoped with .aurora so the legacy screens keep their own styles. */
export default function AuroraLayout({ children }: { children: ReactNode }) {
  return <AuroraFrame>{children}</AuroraFrame>;
}
