import MobileMenu from '@/components/MobileMenu';
import React from 'react';
import GoogleAnalytics from '@/components/AmplitudeAnalytics';

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <GoogleAnalytics>
        {children}
        <MobileMenu />
      </GoogleAnalytics>
    </>  
  );
}
