import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import AnalyticsProvider from "@/components/AnalyticsContext";
import { ProgressBar } from "@/components/progress-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Dhanavinya.id",
    default: "Dhanavinya.id",
  },
  description: "From success to significance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ReactQueryClientProvider>
        <AnalyticsProvider>
          <html lang="en">
            <head>
              <link rel="icon" href="/favicon.ico" sizes="any" />
            </head>
            <body
              className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
              <ProgressBar className="fixed top-0 h-1 bg-sky-500 z-51">
                {children}
              </ProgressBar>
              <Toaster position="top-center" />
              {/* Add Google Analytics */}
              {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
                <GoogleAnalytics
                  gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}
                />
              )}
            </body>
          </html>
        </AnalyticsProvider>
      </ReactQueryClientProvider>
    </ClerkProvider>
  );
}
