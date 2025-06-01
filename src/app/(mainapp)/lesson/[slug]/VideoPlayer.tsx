"use client";
// import '@vidstack/react/player/styles/base.css';
// import '@vidstack/react/player/styles/plyr/theme.css';
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import {
  type MediaCanPlayEvent,
  type MediaPlayEvent,
  type MediaPlayRequestEvent,
  type MediaStartedEvent,
  type MediaTimeUpdateEvent,
  type MediaTimeUpdateEventDetail,
} from "@vidstack/react";
// import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';
import "./video-player-styles.css";
import { useEffect, useState, useRef } from "react";
import { useAnalytics } from "@/components/AnalyticsContext";

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  lessonId?: number | string;
  courseId?: number | string;
}

export default function VideoPlayer({
  videoUrl,
  title = "Lesson Video",
  lessonId,
  courseId,
}: VideoPlayerProps) {
  // Use state to control when to render the player
  const [isMounted, setIsMounted] = useState(false);
  const { trackEvent } = useAnalytics();

  // Track video progress
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Track progress markers to avoid duplicate events
  const progressMarkers = useRef({
    started: false,
    quarter: false,
    half: false,
    threeQuarters: false,
    completed: false,
  });

  // Only render the player on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle video time updates
  const handleTimeUpdate = (
    detail: MediaTimeUpdateEventDetail,
    nativeEvent: MediaTimeUpdateEvent,
  ) => {
    const newCurrentTime = detail.currentTime;
    const newDuration = nativeEvent.target.duration;

    setCurrentTime(newCurrentTime);
    if (newDuration && newDuration !== duration) {
      setDuration(newDuration);
    }

    // Calculate progress percentage
    if (newDuration) {
      const percentage = (newCurrentTime / newDuration) * 100;

      // Track video start
      if (!progressMarkers.current.started && percentage > 1) {
        trackEvent("video_started", {
          lesson_id: lessonId,
          lesson_title: title,
          course_id: courseId,
          video_duration: newDuration,
        });
        progressMarkers.current.started = true;
        setHasStarted(true);
      }

      // Track 25% progress
      if (!progressMarkers.current.quarter && percentage >= 25) {
        trackEvent("video_progress", {
          lesson_id: lessonId,
          lesson_title: title,
          course_id: courseId,
          progress_percentage: 25,
          current_time: newCurrentTime,
        });
        progressMarkers.current.quarter = true;
      }

      // Track 50% progress
      if (!progressMarkers.current.half && percentage >= 50) {
        trackEvent("video_progress", {
          lesson_id: lessonId,
          lesson_title: title,
          course_id: courseId,
          progress_percentage: 50,
          current_time: newCurrentTime,
        });
        progressMarkers.current.half = true;
      }

      // Track 75% progress
      if (!progressMarkers.current.threeQuarters && percentage >= 75) {
        trackEvent("video_progress", {
          lesson_id: lessonId,
          lesson_title: title,
          course_id: courseId,
          progress_percentage: 75,
          current_time: newCurrentTime,
        });
        progressMarkers.current.threeQuarters = true;
      }

      // Track video completion (95% to account for buffering/ending credits)
      if (!progressMarkers.current.completed && percentage >= 95) {
        trackEvent("video_completed", {
          lesson_id: lessonId,
          lesson_title: title,
          course_id: courseId,
          watch_time: newCurrentTime,
        });
        progressMarkers.current.completed = true;
      }
    }
  };

  // Handle play/pause events
  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (hasStarted && isPlaying) {
      setIsPlaying(false);
      trackEvent("video_paused", {
        lesson_id: lessonId,
        lesson_title: title,
        course_id: courseId,
        current_time: currentTime,
      });
    }
  };

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
        style={{ aspectRatio: "16/9" }}
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
    <div
      className="w-full max-w-full mx-auto overflow-hidden"
      style={{ aspectRatio: "16/9" }}
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
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
      >
        <MediaProvider></MediaProvider>
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    </div>
  );
}
