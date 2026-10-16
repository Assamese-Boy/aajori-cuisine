import React from 'react';
import type { Metadata } from 'next';
import '../index.css';
import { ToastProvider } from '../context/ToastContext';

export const metadata: Metadata = {
  title: 'Aajori Cuisine - Operations Control Center & Super Admin',
  description: 'Enterprise hyperlocal operations, GIS fleet telemetry, order dispatch & AI platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
