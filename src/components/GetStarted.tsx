"use client"

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

interface GetStartedProps {
  lessonSlug?: string;
}

export function GetStarted({ lessonSlug }: GetStartedProps) {
    const { openSignIn } = useClerk();
    return (
        <Button 
            className="btn-secondary text-lg px-8 py-6"
            onClick={() => {
        if (lessonSlug) {
          sessionStorage.setItem('fromLessonSlug', lessonSlug);
        }
        openSignIn();
      }}
            >
            Get Started <ArrowRight className="ml-2" />
        </Button>
    )
}