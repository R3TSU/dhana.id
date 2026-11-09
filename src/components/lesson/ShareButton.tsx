"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Share2, Link as LinkIcon, Copy, Check, Facebook } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
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
          <ShareLinkButton
            icon={<Facebook size={16} className="mr-2" />}
            label="Facebook"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareQuote)}`}
          />
          <ShareLinkButton
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mr-2"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            }
            label="WhatsApp"
            href={`https://wa.me/?text=${encodeURIComponent(`${shareQuote} ${shareUrl}`)}`}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ShareLinkButton({
  icon,
  label,
  href,
}: {
  icon: ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Button variant="outline" asChild className="justify-start">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {icon}
        {label}
      </a>
    </Button>
  );
}
