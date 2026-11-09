"use client";

import "@videojs/react/video/skin.css";
import { resolveAdapterType } from "@videojs/react";
import {
  Video,
  VideoPlayer as BaseVideoPlayer,
  VideoSkin,
  usePlayer,
} from "@videojs/react/video";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useAnalytics } from "@/components/AnalyticsContext";

const HlsJsVideo = lazy(() =>
  import("@videojs/react/media/hlsjs-video").then((m) => ({
    default: m.HlsJsVideo,
  })),
);
const DashVideo = lazy(() =>
  import("@videojs/react/media/dash-video").then((m) => ({
    default: m.DashVideo,
  })),
);
const YouTubeVideo = lazy(() =>
  import("@videojs/react/media/youtube-video").then((m) => ({
    default: m.YouTubeVideo,
  })),
);
const VimeoVideo = lazy(() =>
  import("@videojs/react/media/vimeo-video").then((m) => ({
    default: m.VimeoVideo,
  })),
);

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  lessonId?: number | string;
  courseId?: number | string;
}

function Media({ src }: { src: string }) {
  switch (resolveAdapterType(src)) {
    case "youtube":
      return <YouTubeVideo src={src} />;
    case "vimeo":
      return <VimeoVideo src={src} />;
    case "hls":
      return (
        <HlsJsVideo src={src} playsInline crossOrigin="anonymous" />
      );
    case "dash":
      return <DashVideo src={src} playsInline crossOrigin="anonymous" />;
    default:
      return <Video src={src} playsInline crossOrigin="anonymous" />;
  }
}

function AnalyticsTracker({
  lessonId,
  title,
  courseId,
}: {
  lessonId?: number | string;
  title: string;
  courseId?: number | string;
}) {
  const { trackEvent } = useAnalytics();
  const currentTime = usePlayer((state) => state.currentTime);
  const duration = usePlayer((state) => state.duration);
  const paused = usePlayer((state) => state.paused);

  const progressMarkers = useRef({
    started: false,
    quarter: false,
    half: false,
    threeQuarters: false,
    completed: false,
  });
  const hasStarted = useRef(false);
  const prevPaused = useRef<boolean | null>(null);

  useEffect(() => {
    if (!duration) return;

    const percentage = (currentTime / duration) * 100;

    if (!progressMarkers.current.started && percentage > 1) {
      trackEvent("video_started", {
        lesson_id: lessonId,
        lesson_title: title,
        course_id: courseId,
        video_duration: duration,
      });
      progressMarkers.current.started = true;
      hasStarted.current = true;
    }

    if (!progressMarkers.current.quarter && percentage >= 25) {
      trackEvent("video_progress", {
        lesson_id: lessonId,
        lesson_title: title,
        course_id: courseId,
        progress_percentage: 25,
        current_time: currentTime,
      });
      progressMarkers.current.quarter = true;
    }

    if (!progressMarkers.current.half && percentage >= 50) {
      trackEvent("video_progress", {
        lesson_id: lessonId,
        lesson_title: title,
        course_id: courseId,
        progress_percentage: 50,
        current_time: currentTime,
      });
      progressMarkers.current.half = true;
    }

    if (!progressMarkers.current.threeQuarters && percentage >= 75) {
      trackEvent("video_progress", {
        lesson_id: lessonId,
        lesson_title: title,
        course_id: courseId,
        progress_percentage: 75,
        current_time: currentTime,
      });
      progressMarkers.current.threeQuarters = true;
    }

    if (!progressMarkers.current.completed && percentage >= 95) {
      trackEvent("video_completed", {
        lesson_id: lessonId,
        lesson_title: title,
        course_id: courseId,
        watch_time: currentTime,
      });
      progressMarkers.current.completed = true;
    }
  }, [currentTime, duration, lessonId, title, courseId, trackEvent]);

  useEffect(() => {
    if (prevPaused.current === null) {
      prevPaused.current = paused;
      return;
    }
    if (prevPaused.current === paused) return;
    prevPaused.current = paused;

    if (!paused) {
      if (currentTime < 1) {
        progressMarkers.current = {
          started: false,
          quarter: false,
          half: false,
          threeQuarters: false,
          completed: false,
        };
        hasStarted.current = false;
      }
    } else if (hasStarted.current) {
      trackEvent("video_paused", {
        lesson_id: lessonId,
        lesson_title: title,
        course_id: courseId,
        current_time: currentTime,
      });
    }
  }, [paused, currentTime, lessonId, title, courseId, trackEvent]);

  return null;
}

export default function VideoPlayer({
  videoUrl,
  title = "Lesson Video",
  lessonId,
  courseId,
}: VideoPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className="w-full max-w-full mx-auto overflow-hidden"
        style={{ aspectRatio: "16/9" }}
      >
        <div className="flex items-center justify-center h-full text-white">
          <span>Loading video player...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="video-player"
      className="w-full max-w-full mx-auto overflow-hidden"
    >
      <BaseVideoPlayer title={title}>
        <VideoSkin className="w-full" style={{ aspectRatio: "16 / 9" }}>
          <Suspense fallback={null}>
            <Media key={videoUrl} src={videoUrl} />
          </Suspense>
          <AnalyticsTracker
            lessonId={lessonId}
            title={title}
            courseId={courseId}
          />
        </VideoSkin>
      </BaseVideoPlayer>
    </div>
  );
}
