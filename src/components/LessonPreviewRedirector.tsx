"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface LessonPreviewRedirectorProps {
  lessonSlug: string;
}

export function LessonPreviewRedirector({
  lessonSlug,
}: LessonPreviewRedirectorProps) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Ensure Clerk is loaded and user ID is available
    if (isLoaded && userId) {
      const targetPath = `/lesson/${lessonSlug}`;
      router.replace(targetPath); // Use replace to avoid adding preview page to history
    }
  }, [isLoaded, userId, lessonSlug, router]);

  // This component doesn't render anything itself.
  return null;
}
