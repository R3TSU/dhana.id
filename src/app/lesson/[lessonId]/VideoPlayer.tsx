"use client";

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';

export default function VideoPlayer() {
    return (
        <div className="aspect-w-16 aspect-h-9">
            <MediaPlayer 
                title="Sprite Fight" 
                src="https://www.youtube.com/watch?v=NLjnOsP_q1U"
                aspectRatio="16/9"
                viewType="video"
                streamType="on-demand"
                logLevel="warn"
                crossOrigin
                // playsInline
                storage="storage-key"
                >
                <MediaProvider />
                <DefaultVideoLayout icons={defaultLayoutIcons} />
            </MediaPlayer>
        </div>
    )
}