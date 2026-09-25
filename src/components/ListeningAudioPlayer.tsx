'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Headphones,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

interface ListeningAudioPlayerProps {
  audioUrl?: string | null;
  audioScript?: string | null;
  maxPlays?: number | null; // e.g. 2 for exams
  allowTranscript?: boolean; // false during active exam, true for teacher preview & student review
  title?: string;
  autoPlay?: boolean;
  className?: string;
}

export const ListeningAudioPlayer: React.FC<ListeningAudioPlayerProps> = ({
  audioUrl,
  audioScript,
  maxPlays,
  allowTranscript = false,
  title = 'Bài nghe tiếng Anh',
  autoPlay = false,
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playsCount, setPlaysCount] = useState<number>(0);
  const [hasStartedCurrentPlay, setHasStartedCurrentPlay] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<boolean>(false);
  const [isSpeechSpeaking, setIsSpeechSpeaking] = useState<boolean>(false);

  // Resolve absolute audio URL
  const resolvedAudioUrl = React.useMemo(() => {
    if (!audioUrl) return null;
    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://') || audioUrl.startsWith('blob:')) {
      return audioUrl;
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return `${apiBase}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
  }, [audioUrl]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  const isPlayLimitReached = Boolean(maxPlays && maxPlays > 0 && playsCount >= maxPlays);

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setAudioError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setHasStartedCurrentPlay(false);
    };

    const handleError = () => {
      setAudioError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [resolvedAudioUrl]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const togglePlay = () => {
    // If no audio URL or error, fallback to Web Speech API
    if (!resolvedAudioUrl || audioError) {
      handleWebSpeechToggle();
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (isPlayLimitReached && !hasStartedCurrentPlay) {
        return;
      }

      if (!hasStartedCurrentPlay) {
        setPlaysCount((prev) => prev + 1);
        setHasStartedCurrentPlay(true);
      }

      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play error, falling back to Web Speech:', err);
        setAudioError(true);
        handleWebSpeechToggle();
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleReplay = () => {
    if (isPlayLimitReached && !hasStartedCurrentPlay) return;

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (!hasStartedCurrentPlay) {
        setPlaysCount((prev) => prev + 1);
        setHasStartedCurrentPlay(true);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    audioRef.current.muted = newMute;
  };

  // Browser Web Speech API fallback
  const handleWebSpeechToggle = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ phát âm thanh trực tiếp.');
      return;
    }

    if (isSpeechSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeechSpeaking(false);
      setIsPlaying(false);
      return;
    }

    if (!audioScript) {
      alert('Không tìm thấy nội dung bài nghe để đọc.');
      return;
    }

    if (isPlayLimitReached && !hasStartedCurrentPlay) return;

    if (!hasStartedCurrentPlay) {
      setPlaysCount((prev) => prev + 1);
      setHasStartedCurrentPlay(true);
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(audioScript);
    utterance.lang = 'en-US';
    utterance.rate = playbackRate;

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    if (engVoice) {
      utterance.voice = engVoice;
    }

    utterance.onstart = () => {
      setIsSpeechSpeaking(true);
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsSpeechSpeaking(false);
      setIsPlaying(false);
      setHasStartedCurrentPlay(false);
    };

    utterance.onerror = () => {
      setIsSpeechSpeaking(false);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-slate-900 text-white shadow-xl border border-indigo-500/20 backdrop-blur-md space-y-3 ${className}`}>
      {/* Hidden native audio element */}
      {resolvedAudioUrl && !audioError && (
        <audio
          ref={audioRef}
          src={resolvedAudioUrl}
          preload="metadata"
        />
      )}

      {/* Top Bar: Title & Max Plays Counter */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/30 flex items-center justify-center text-purple-200 shadow-inner">
            <Headphones className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-200">
                {title}
              </span>
              {isPlaying && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 animate-pulse">
                  <Radio className="w-3 h-3" />
                  Đang phát
                </span>
              )}
            </div>
            <p className="text-[11px] text-purple-300/80">
              Lắng nghe kỹ đoạn hội thoại / bài đọc tiếng Anh để trả lời câu hỏi
            </p>
          </div>
        </div>

        {/* Max Plays Counter Badge */}
        {maxPlays && maxPlays > 0 && (
          <div
            className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              isPlayLimitReached
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30'
            }`}
          >
            <span>Lượt nghe:</span>
            <span className="font-mono text-sm font-black">
              {playsCount} / {maxPlays}
            </span>
            {isPlayLimitReached && (
              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded font-black">
                HẾT LƯỢT
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress Slider & Time */}
      <div className="space-y-1.5 pt-1">
        <div className="relative flex items-center group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            disabled={!resolvedAudioUrl || audioError || isSpeechSpeaking}
            className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-purple-400 focus:outline-none transition-all hover:h-2"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-purple-200/70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <div className="flex items-center gap-2">
          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isPlayLimitReached && !isPlaying}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              isPlayLimitReached && !isPlaying
                ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/30'
                : isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400/40'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-purple-500/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>{playsCount === 0 ? 'Phát bài nghe' : 'Tiếp tục nghe'}</span>
              </>
            )}
          </button>

          {/* Replay Button */}
          <button
            type="button"
            onClick={handleReplay}
            disabled={isPlayLimitReached}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-purple-200 border border-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Nghe lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed options */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/70 text-[11px] font-bold">
            {[0.8, 1.0, 1.25].map((speed) => (
              <button
                type="button"
                key={speed}
                onClick={() => handleRateChange(speed)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  playbackRate === speed
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-300/70 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Volume & Audio Source Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-purple-200">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-purple-300" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>

          {/* Transcript Toggle Button (if allowed) */}
          {allowTranscript && audioScript && (
            <button
              type="button"
              onClick={() => setShowTranscript((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showTranscript
                  ? 'bg-purple-600/40 border-purple-400 text-white'
                  : 'bg-slate-800/70 border-slate-700 text-purple-200 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showTranscript ? 'Ẩn kịch bản' : 'Xem transcript'}</span>
              {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Transcript Accordion */}
      {allowTranscript && showTranscript && audioScript && (
        <div className="pt-3 border-t border-purple-800/40 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-purple-300 font-bold">
            <span className="flex items-center gap-1.5">
              <span>📜 Kịch bản bài nghe tiếng Anh (Transcript):</span>
            </span>
            <button
              type="button"
              onClick={handleWebSpeechToggle}
              className="text-[11px] px-2 py-0.5 rounded-md bg-purple-700/50 hover:bg-purple-600 text-purple-100 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Radio className="w-3 h-3" />
              <span>{isSpeechSpeaking ? 'Dừng đọc' : 'Đọc transcript'}</span>
            </button>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-purple-900/50 text-purple-100 leading-relaxed font-sans max-h-48 overflow-y-auto whitespace-pre-wrap select-text">
            {audioScript}
          </div>
        </div>
      )}
    </div>
  );
};
