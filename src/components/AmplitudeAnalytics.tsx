'use client';

import { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Script from 'next/script';

// Replace with your Google Analytics measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS as string;

// Create a context for tracking functions
export const AnalyticsContext = createContext({
  trackEvent: (eventName: string, eventProperties?: Record<string, any>) => {},
});

export const useAnalytics = () => useContext(AnalyticsContext);

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export default function GoogleAnalytics({ children }: { children?: React.ReactNode }) {
  const { userId, isSignedIn } = useAuth();
  
  useEffect(() => {
    // Set user ID for GA when user signs in
    if (isSignedIn && userId && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_id: userId,
      });
    }
  }, [userId, isSignedIn]);
  
  // Function to track events
  const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
    if (window.gtag) {
      window.gtag('event', eventName, {
        user_type: isSignedIn ? 'authenticated' : 'anonymous',
        ...eventProperties,
      });
    }
  };
  
  return (
    <>
      {/* Google Analytics Script */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      
      <AnalyticsContext.Provider value={{ trackEvent }}>
        {children}
      </AnalyticsContext.Provider>
    </>
  );
}