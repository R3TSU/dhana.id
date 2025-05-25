"use client"

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Share2, Link as LinkIcon, Copy, Check } from "lucide-react";
import { FacebookShare, WhatsappShare } from 'react-share-lite';
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ShareButton({ lessonId, lessonTitle }: { lessonId: string, lessonTitle?: string }) {
    const [currentUrl, setCurrentUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        setCurrentUrl(window.location.href);
      }
    }, []);

    const handleCopyLink = async () => {
      if (!currentUrl) return;
      try {
        await navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
      } catch (err) {
        console.error('Failed to copy: ', err);
        toast.error("Failed to copy link.");
      }
    };

    const shareQuote = lessonTitle ? `Check out this lesson: ${lessonTitle}` : 'Check out this lesson!';
      
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="mt-4 bg-purple-500 text-white">
            <Share2 size={18} className="mr-2" /> Share Lesson
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex flex-col space-y-2">
            <Button variant="outline" onClick={handleCopyLink} className="justify-start">
              {copied ? <Check size={16} className="mr-2 text-green-500" /> : <LinkIcon size={16} className="mr-2" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <FacebookShare url={currentUrl} quote={shareQuote} size={32} className="mr-2">
              {/* This child is necessary for react-share-lite to render the button correctly */}
              {/* We style it to look like our other buttons */} 
                Facebook
            </FacebookShare>
            <WhatsappShare url={currentUrl} title={shareQuote} size={32} separator=":: ">
              WhatsApp
            </WhatsappShare>
          </div>
        </PopoverContent>
      </Popover>
    )
}