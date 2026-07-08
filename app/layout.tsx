import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JAS — Deterministic AI',
  description: 'Ask JAS anything. Deterministic reasoning over 5M+ facts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
