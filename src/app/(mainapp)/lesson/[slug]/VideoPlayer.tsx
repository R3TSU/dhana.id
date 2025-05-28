"use client";
// import '@vidstack/react/player/styles/base.css';
// import '@vidstack/react/player/styles/plyr/theme.css';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider } from "@vidstack/react"
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
// import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';
import './video-player-styles.css';
import { useEffect, useState } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
}

export default function VideoPlayer({ videoUrl, title = "Lesson Video" }: VideoPlayerProps) {
    // Use state to control when to render the player
    const [isMounted, setIsMounted] = useState(false);
    
    // Only render the player on the client side
    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    // Handle provider change to prevent errors
    const handleProviderChange = (provider: any) => {
        // Skip processing if provider is undefined (prevents error)
        if (!provider) return;
    };
    
    // Show a placeholder while loading on the server or during hydration
    if (!isMounted) {
        return (
            <div 
                className="w-full max-w-full mx-auto overflow-hidden" 
                style={{ aspectRatio: '16/9' }}
            >
                {/* Optional loading indicator */}
                <div className="flex items-center justify-center h-full text-white">
                    <span>Loading video player...</span>
                </div>
            </div>
        );
    }
    
    // Render the actual player only on the client side
    return (
        <div className="w-full max-w-full mx-auto overflow-hidden"
        style={{ aspectRatio: '16/9' }}
        >
            <MediaPlayer 
                className="w-full"
                title={title} 
                src={videoUrl}
                aspectRatio="16/9"
                viewType="video"
                streamType="on-demand"
                logLevel="silent" // Change from warn to silent to suppress errors
                crossOrigin
                playsInline
                storage="storage-key"
                onProviderChange={handleProviderChange}
                >
                <MediaProvider>
                </MediaProvider>
                <DefaultVideoLayout icons={defaultLayoutIcons} />
            </MediaPlayer>
        </div>
    )
}