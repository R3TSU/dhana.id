'use client';

import { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { sendGTMEvent } from '@next/third-parties/google';

// Create a context for tracking functions
export const AnalyticsContext = createContext({
  trackEvent: (eventName: string, eventProperties?: Record<string, any>) => {},
});

export const useAnalytics = () => useContext(AnalyticsContext);

export default function AnalyticsProvider({ children }: { children?: React.ReactNode }) {
  const { userId, isSignedIn } = useAuth();
  
  useEffect(() => {
    // Set user ID for GA when user signs in
    if (isSignedIn && userId) {
      sendGTMEvent({
        event: 'config',
        config: {
          user_id: userId,
        },
      });
    }
  }, [userId, isSignedIn]);
  
  // Function to track events
  const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
    sendGTMEvent({
      event: eventName,
      user_type: isSignedIn ? 'authenticated' : 'anonymous',
      ...eventProperties,
    });
  };
  
  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
}
