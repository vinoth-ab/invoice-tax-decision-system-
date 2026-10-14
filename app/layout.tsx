import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BusinessProvider } from '@/lib/context/BusinessContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Integrated Invoice Analytics and Tax Optimization Decision Support System',
  description: 'Enterprise financial analytics, GST reconciliation, invoice anomaly detection, and statutory tax optimization decision support for Indian startups and MSMEs.',
};

import { Suspense } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        <BusinessProvider>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Loading workspace...</div>}>
            {children}
          </Suspense>
        </BusinessProvider>
      </body>
    </html>
  );
}
