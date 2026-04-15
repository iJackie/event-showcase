import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Event Showcase — Jacqueline Mach',
  description: 'Global events portfolio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
