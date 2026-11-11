import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth';

export const metadata: Metadata = {
  title: 'Friends Connect — Random Audio & Video Calls, Celebrities & Events',
  description:
    'Multi-platform social discovery with 1-tap Random Friend Audio & Video calls, Celebrity Audio & Video calling, Location-based Event Ticketing, Customer Care Support, and Super Admin Control.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased selection:bg-blue-600 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
