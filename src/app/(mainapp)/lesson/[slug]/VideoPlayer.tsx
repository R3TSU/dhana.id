import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
}

export default function VideoPlayer({ videoUrl, title = "Lesson Video" }: VideoPlayerProps) {
    return (
        <div className="aspect-w-16 aspect-h-9">
            <MediaPlayer 
                title={title} 
                src={videoUrl}
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