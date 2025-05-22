"use client"

import { Button } from "@/components/ui/button";
import { Share2, Link } from "lucide-react";
import { FacebookShare, WhatsappShare } from 'react-share-lite'
import { useEffect, useState } from "react";

export default function ShareButton({ lessonId }: { lessonId: string }) {
    const [currentUrl, setCurrentUrl] = useState('');

    useEffect(() => {
      // Check if the code is running on the client side
      if (process) {
        // Access the current page URL using window.location
        setCurrentUrl(window.location.href);
      }
    }, []);
      
    return (
        <div className="mt-8">
            <h3 className="text-lg font-medium text-indigo mb-3 flex items-center">
                <Share2 size={18} className="mr-2" /> Share this video
            </h3>
            <div className="flex space-x-3">
                <FacebookShare url={currentUrl} quote={lessonId} />
                <WhatsappShare url={currentUrl} title={lessonId} separator=":: " />
                <Link size={24} className="mt-1" />
            </div>
        </div>
    )
}