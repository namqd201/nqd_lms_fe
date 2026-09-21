'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Lock, AlertCircle } from 'lucide-react';

interface LessonVideoPlayerProps {
  videoUrl: string;
  lessonTitle: string;
  videoWatched: boolean;
  onVideoComplete: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function LessonVideoPlayer({
  videoUrl,
  lessonTitle,
  videoWatched,
  onVideoComplete,
}: LessonVideoPlayerProps) {
  const [seekWarning, setSeekWarning] = useState<string | null>(null);
  const [isCompletedLocally, setIsCompletedLocally] = useState<boolean>(videoWatched);
  const [watchedTime, setWatchedTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(videoWatched ? 100 : 0);

  // References to preserve state across intervals without triggering re-renders
  const maxWatchedTimeRef = useRef<number>(0);
  const isCompletedRef = useRef<boolean>(videoWatched);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const ytVideoId = extractYouTubeId(videoUrl);
  const isYouTube = !!ytVideoId;
  const isDirectVideo = /\.(mp4|webm|ogg)($|\?)/i.test(videoUrl);

  // Synchronize prop changes
  useEffect(() => {
    setIsCompletedLocally(videoWatched);
    isCompletedRef.current = videoWatched;
    if (videoWatched) {
      setProgressPct(100);
    }
  }, [videoWatched]);

  const showWarning = (msg: string) => {
    setSeekWarning(msg);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setSeekWarning(null);
    }, 4000);
  };

  const handleComplete = () => {
    if (!isCompletedRef.current) {
      isCompletedRef.current = true;
      setIsCompletedLocally(true);
      setProgressPct(100);
      onVideoComplete();
    }
  };

  // Setup YouTube IFrame API
  useEffect(() => {
    if (!isYouTube || !ytVideoId) return;

    let isSubscribed = true;

    const createPlayer = () => {
      if (!isSubscribed || !window.YT || !window.YT.Player) return;
      const container = ytContainerRef.current;
      if (!container) return;

      // Ensure fresh slot element
      container.innerHTML = `<div id="yt-player-slot" style="width:100%;height:100%"></div>`;

      try {
        const player = new window.YT.Player('yt-player-slot', {
          videoId: ytVideoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              if (isSubscribed) {
                ytPlayerRef.current = event.target;
              }
            },
            onStateChange: (event: any) => {
              // 0 is YT.PlayerState.ENDED
              if (event.data === 0) {
                handleComplete();
              }
            },
          },
        });
        ytPlayerRef.current = player;
      } catch {
        // ignore initialization errors
      }
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
      }

      const prevHandler = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevHandler === 'function') prevHandler();
        createPlayer();
      };
    }

    return () => {
      isSubscribed = false;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }
    };
  }, [isYouTube, ytVideoId]);

  // Periodic watch progress & anti-seeking enforcement for YouTube
  useEffect(() => {
    if (!isYouTube) return;

    const timer = setInterval(() => {
      if (!ytPlayerRef.current || typeof ytPlayerRef.current.getCurrentTime !== 'function') {
        return;
      }

      try {
        const curr = ytPlayerRef.current.getCurrentTime() || 0;
        const dur = ytPlayerRef.current.getDuration() || 0;

        if (dur > 0) {
          setDuration(dur);
          const highest = Math.max(maxWatchedTimeRef.current, curr);
          setWatchedTime(highest);
          const pct = Math.min(100, Math.round((highest / dur) * 100));
          setProgressPct(pct);

          if (!isCompletedRef.current) {
            // Check seeking forward
            if (curr > maxWatchedTimeRef.current + 2.5) {
              ytPlayerRef.current.seekTo(maxWatchedTimeRef.current, true);
              showWarning('⚠️ Bạn đang xem bài giảng lần đầu và chưa được phép tua video!');
            } else if (curr > maxWatchedTimeRef.current) {
              maxWatchedTimeRef.current = curr;
            }

            // Automatic completion: reached 90% of duration or within 3 seconds of the end
            if (curr >= dur * 0.9 || curr >= dur - 3) {
              handleComplete();
            }
          }
        }
      } catch {
        // Player not ready or cross-origin safety
      }
    }, 500);

    return () => clearInterval(timer);
  }, [isYouTube]);

  // HTML5 Video event handlers
  const handleHtml5TimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime || 0;
    const dur = videoRef.current.duration || 0;

    if (dur > 0) {
      setDuration(dur);
      const highest = Math.max(maxWatchedTimeRef.current, curr);
      setWatchedTime(highest);
      const pct = Math.min(100, Math.round((highest / dur) * 100));
      setProgressPct(pct);

      if (!isCompletedRef.current) {
        if (curr > maxWatchedTimeRef.current) {
          maxWatchedTimeRef.current = curr;
        }

        // Automatic completion when >= 90% or within 2s of end
        if (curr >= dur * 0.9 || curr >= dur - 2) {
          handleComplete();
        }
      }
    }
  };

  const handleHtml5Seeking = () => {
    if (!videoRef.current || isCompletedRef.current) return;
    const curr = videoRef.current.currentTime || 0;
    if (curr > maxWatchedTimeRef.current + 1.5) {
      videoRef.current.currentTime = maxWatchedTimeRef.current;
      showWarning('⚠️ Bạn đang xem bài giảng lần đầu và chưa được phép tua video!');
    }
  };

  const handleHtml5Ended = () => {
    handleComplete();
  };

  return (
    <div className="space-y-4">
      {/* Video Progress & Anti-seek Policy Banner */}
      {isCompletedLocally ? (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-900">Đã xem đủ thời lượng video bài giảng</p>
              <p className="text-[11px] text-emerald-700">
                Hệ thống đã tự động ghi nhận hoàn thành. Bạn có thể tua tự do để ôn tập bài học.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-200/70 text-emerald-800 text-[10px] font-extrabold uppercase shrink-0">
            Mở khóa tua
          </span>
        </div>
      ) : (
        <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs animate-in fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="truncate">
                <p className="font-bold text-amber-950 truncate">Lần xem đầu tiên: Chống tua tự động</p>
                <p className="text-[11px] text-amber-700 truncate">
                  Xem đạt từ 90% thời lượng bài giảng để hệ thống tự động xác nhận hoàn thành.
                </p>
              </div>
            </div>
            {duration > 0 && (
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-amber-900 font-mono">
                  {formatTime(watchedTime)} / {formatTime(duration)}
                </span>
                <span className="text-[11px] text-amber-600 ml-1.5 font-bold">({progressPct}%)</span>
              </div>
            )}
          </div>

          {duration > 0 && (
            <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Seeking warning toast */}
      {seekWarning && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{seekWarning}</span>
        </div>
      )}

      {/* Video Container */}
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-xl border border-slate-200">
        {isYouTube ? (
          <div ref={ytContainerRef} className="w-full h-full" />
        ) : isDirectVideo ? (
          <video
            ref={videoRef}
            controls
            playsInline
            src={videoUrl}
            onTimeUpdate={handleHtml5TimeUpdate}
            onSeeking={handleHtml5Seeking}
            onEnded={handleHtml5Ended}
            className="w-full h-full object-contain"
          >
            Trình duyệt của bạn không hỗ trợ phát video này.
          </video>
        ) : (
          <iframe
            src={videoUrl}
            title={lessonTitle}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
