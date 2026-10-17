import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostPulse — Build-in-Public Content Engine for Indie Developers',
  description: 'Translate your Git commits and releases into publishable Reddit deep-dives, Indie Hackers updates, and clean changelogs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
