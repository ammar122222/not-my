import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Access Portal',
  description: 'Secure admin gallery portal',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Diagonal blue/purple glow panels — shared across every page */}
        <div className="bg-glow" aria-hidden="true" />
        <div className="bg-glow-2" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
