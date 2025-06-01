import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import AnalyticsProvider from "@/components/AnalyticsContext";

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
  description: "Building a better live one at a time",
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
            <body
              className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
              {children}
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
