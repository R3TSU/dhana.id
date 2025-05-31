import MobileMenu from '@/components/MobileMenu';
import { Analytics } from '@vercel/analytics/next';
import React from 'react';

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <MobileMenu />
      <Analytics />
    </>
  );
}
