"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Share2, Link as LinkIcon, Copy, Check } from "lucide-react";
import { FacebookShare, WhatsappShare } from "react-share-lite";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ShareButton({
  lessonSlug,
  lessonTitle,
}: {
  lessonSlug: string;
  lessonTitle?: string;
}) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [webShareApiAvailable, setWebShareApiAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && lessonSlug) {
      setShareUrl(`${window.location.origin}/lesson-previews/${lessonSlug}`);
    }
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setWebShareApiAvailable(true);
    }
  }, [lessonSlug]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast.error("Failed to copy link.");
    }
  };

  const shareQuote = lessonTitle
    ? `Check out this lesson: ${lessonTitle}`
    : "Check out this lesson!";

  const handleNativeShare = async () => {
    if (navigator.share && shareUrl) {
      try {
        await navigator.share({
          title: lessonTitle || "Dhanavinya.id Audio Program",
          text: shareQuote,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        // Handle errors (e.g., user cancelled share dialog)
        // Don't show an error toast if it's just AbortError
        if (error instanceof Error && error.name !== "AbortError") {
          toast.error("Could not share: " + error.message);
        }
      }
    }
  };

  if (webShareApiAvailable) {
    return (
      <Button
        variant="outline"
        className="mt-4 bg-purple-500 text-white"
        onClick={handleNativeShare}
      >
        <Share2 size={18} className="mr-2" /> Share Lesson
      </Button>
    );
  }

  // Fallback to Popover if Web Share API is not available
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="mt-4 bg-purple-500 text-white">
          <Share2 size={18} className="mr-2" /> Share Lesson
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex flex-col space-y-2">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="justify-start"
          >
            {copied ? (
              <Check size={16} className="mr-2 text-green-500" />
            ) : (
              <LinkIcon size={16} className="mr-2" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <FacebookShare
            url={shareUrl}
            quote={shareQuote}
            size={32}
            className="mr-2"
          >
            Facebook
          </FacebookShare>
          <WhatsappShare
            url={shareUrl}
            title={shareQuote}
            size={32}
            separator=":: "
          >
            WhatsApp
          </WhatsappShare>
        </div>
      </PopoverContent>
    </Popover>
  );
}
