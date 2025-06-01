"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface PreviewPageClientWrapperProps {
  lessonSlug: string;
  children: React.ReactNode;
}

export function PreviewPageClientWrapper({
  lessonSlug,
  children,
}: PreviewPageClientWrapperProps) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Ensure Clerk is loaded and user ID is available
    if (isLoaded && userId) {
      const targetPath = `/lesson/${lessonSlug}`;
      router.replace(targetPath); // Use replace to avoid adding preview page to history
    }
  }, [isLoaded, userId, lessonSlug, router]);

  // This component renders its children while potentially redirecting logged-in users
  return <>{children}</>;
}
