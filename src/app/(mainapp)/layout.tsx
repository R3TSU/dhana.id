import MobileMenu from '@/components/MobileMenu';
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
    </>
  );
}
