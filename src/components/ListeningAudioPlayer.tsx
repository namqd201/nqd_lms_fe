'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  User,
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

export interface ParsedDialogueTurn {
  speaker: string | null;
  text: string;
  isFemale: boolean;
}

const FEMALE_NAMES_REGEX = /\b(female|woman|girl|lady|mother|mom|sister|daughter|mrs|ms|miss|mai|mary|anna|linda|sarah|emma|jane|hoa|lan|nga|huong|alice|lucy|daisy|jennifer|elizabeth|kate|helen|amy|chloe|zoe|emily|sally|lily|grace)\b/i;
const MALE_NAMES_REGEX = /\b(male|man|boy|guy|gentleman|father|dad|brother|son|mr|peter|john|david|tom|bob|nam|minh|quan|huy|alex|mike|james|george|paul|jack|mark|ben|dan|sam|tim|tony|nick|bill|steve)\b/i;

export function parseDialogueScript(script?: string | null): ParsedDialogueTurn[] {
  if (!script || !script.trim()) return [];
  const lines = script.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const turns: ParsedDialogueTurn[] = [];
  const pattern = /^(?:[-*•]\s*)?\[?([A-Za-z0-9\s._'-]+?)\]?\s*:\s*(.+)$/;

  const speakerGenders = new Map<string, boolean>();
  let unknownCount = 0;

  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      const speaker = match[1].trim();
      const text = match[2].trim();
      const lower = speaker.toLowerCase();

      let isFemale = false;
      if (speakerGenders.has(lower)) {
        isFemale = speakerGenders.get(lower)!;
      } else {
        if (FEMALE_NAMES_REGEX.test(lower)) {
          isFemale = true;
        } else if (MALE_NAMES_REGEX.test(lower)) {
          isFemale = false;
        } else {
          isFemale = (unknownCount++ % 2 === 1);
        }
        speakerGenders.set(lower, isFemale);
      }

      turns.push({ speaker, text, isFemale });
    } else {
      if (turns.length > 0) {
        turns[turns.length - 1].text += ' ' + line;
      } else {
        turns.push({ speaker: null, text: line, isFemale: false });
      }
    }
  }
  return turns;
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
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const [activeTurnIndex, setActiveTurnIndex] = useState<number | null>(null);

  // Parse structured dialogue turns
  const parsedTurns = useMemo(() => parseDialogueScript(audioScript), [audioScript]);
  const isDialogue = useMemo(() => parsedTurns.length >= 2 && parsedTurns.some((t) => t.speaker), [parsedTurns]);

  // Resolve absolute audio URL
  const resolvedAudioUrl = useMemo(() => {
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
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const togglePlay = () => {
    // If no audio URL or error, fallback to multi-speaker Web Speech API
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

  // Helper to pick voices from browser
  const getBrowserVoices = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return { maleVoice: null, femaleVoice: null, defaultVoice: null };
    }
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
    const femaleVoice =
      voices.find((v) => /female|zira|samantha|karen|susan|victoria|jenny|catherine/i.test(v.name)) ||
      voices.find((v) => !/male|david|george|mark|guy/i.test(v.name)) ||
      null;

    const maleVoice =
      voices.find((v) => /male|david|george|mark|guy|james|richard/i.test(v.name)) ||
      voices.find((v) => v !== femaleVoice) ||
      null;

    const defaultVoice = voices[0] || null;

    return { maleVoice, femaleVoice, defaultVoice };
  };

  // Speaks dialogue turns sequentially with separate voices and NO character label reading
  const speakDialogueTurn = (turns: ParsedDialogueTurn[], index: number) => {
    if (index >= turns.length) {
      setIsSpeechSpeaking(false);
      setIsPlaying(false);
      setActiveTurnIndex(null);
      setHasStartedCurrentPlay(false);
      return;
    }

    const turn = turns[index];
    setActiveTurnIndex(index);

    // Speak strictly turn.text, NEVER reading "Peter:" or "Mai:"
    const utterance = new SpeechSynthesisUtterance(turn.text);
    utterance.lang = 'en-US';
    utterance.rate = playbackRate;

    const { maleVoice, femaleVoice, defaultVoice } = getBrowserVoices();

    if (turn.isFemale) {
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.pitch = 1.15; // Higher pitch for female / girl
    } else {
      if (maleVoice) utterance.voice = maleVoice;
      utterance.pitch = 0.9; // Lower pitch for male / boy
    }
    if (!utterance.voice && defaultVoice) {
      utterance.voice = defaultVoice;
    }

    utterance.onend = () => {
      // 550ms natural pause between character turns
      speechTimeoutRef.current = setTimeout(() => {
        speakDialogueTurn(turns, index + 1);
      }, 550);
    };

    utterance.onerror = () => {
      setIsSpeechSpeaking(false);
      setIsPlaying(false);
      setActiveTurnIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Browser Web Speech API fallback & manual "Đọc transcript" handler
  const handleWebSpeechToggle = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ phát âm thanh trực tiếp.');
      return;
    }

    if (isSpeechSpeaking) {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      window.speechSynthesis.cancel();
      setIsSpeechSpeaking(false);
      setIsPlaying(false);
      setActiveTurnIndex(null);
      return;
    }

    if (!audioScript && (!parsedTurns || parsedTurns.length === 0)) {
      alert('Không tìm thấy nội dung bài nghe để đọc.');
      return;
    }

    if (isPlayLimitReached && !hasStartedCurrentPlay) return;

    if (!hasStartedCurrentPlay) {
      setPlaysCount((prev) => prev + 1);
      setHasStartedCurrentPlay(true);
    }

    window.speechSynthesis.cancel();
    setIsSpeechSpeaking(true);
    setIsPlaying(true);

    if (parsedTurns.length > 0) {
      speakDialogueTurn(parsedTurns, 0);
    } else {
      // Fallback single monologue without character prefix
      const cleanText = (audioScript || '').replace(/^(?:[-*•]\s*)?\[?[A-Za-z0-9\s._'-]+?\]?\s*:\s*/gm, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = playbackRate;
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
    }
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
            <h4 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-purple-200 flex items-center gap-2">
              <span>{title}</span>
              {isDialogue && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-semibold lowercase">
                  hội thoại 2 vai (nam/nữ)
                </span>
              )}
            </h4>
            <p className="text-[11px] text-purple-300/70">
              Lắng nghe kỹ đoạn hội thoại / bài đọc tiếng Anh để trả lời câu hỏi
            </p>
          </div>
        </div>

        {maxPlays && maxPlays > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-700/50 text-[11px] font-medium text-purple-200">
            <span>Số lần nghe:</span>
            <span className="font-bold text-white">
              {playsCount} / {maxPlays}
            </span>
            {isPlayLimitReached && (
              <span className="text-rose-400 font-bold ml-1">(Đã hết lượt)</span>
            )}
          </div>
        )}
      </div>

      {/* Progress & Duration Bar */}
      <div className="space-y-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!duration || isPlayLimitReached}
            className="w-full h-1.5 bg-purple-950/80 rounded-lg appearance-none cursor-pointer accent-purple-400 disabled:opacity-50"
          />
        </div>
        <div className="flex justify-between text-[10px] text-purple-300 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : isSpeechSpeaking ? 'Đang đọc theo nhân vật' : '00:00'}</span>
        </div>
      </div>

      {/* Controls Bar: Play / Pause, Speed, Replay, Volume, Transcript Toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
        <div className="flex items-center gap-2">
          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isPlayLimitReached && !hasStartedCurrentPlay && !isPlaying}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{hasStartedCurrentPlay ? 'Tiếp tục nghe' : 'Bắt đầu nghe'}</span>
              </>
            )}
          </button>

          {/* Replay Button */}
          {resolvedAudioUrl && !audioError && (
            <button
              type="button"
              onClick={handleReplay}
              disabled={isPlayLimitReached && !hasStartedCurrentPlay}
              title="Nghe lại từ đầu"
              className="p-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/40 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Speed Presets */}
          <div className="flex items-center bg-purple-950/60 p-0.5 rounded-xl border border-purple-800/50 text-[11px] font-bold text-purple-200">
            {[0.75, 1.0, 1.25].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleRateChange(rate)}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-purple-500 text-white shadow-xs'
                    : 'hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Right side: Volume & Transcript */}
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
              <span>{showTranscript ? 'Ẩn kịch bản' : 'Xem kịch bản'}</span>
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
              <span>📜 Kịch bản lời thoại hội thoại (Transcript):</span>
            </span>
            <button
              type="button"
              onClick={handleWebSpeechToggle}
              className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                isSpeechSpeaking
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-purple-700/60 hover:bg-purple-600 text-purple-100 border border-purple-500/30'
              }`}
              title="Đọc từng lời thoại theo nhân vật (giọng nam/nữ riêng biệt, không đọc tên nhân vật)"
            >
              <Radio className="w-3 h-3" />
              <span>{isSpeechSpeaking ? '⏹ Dừng đọc nhân vật' : '🗣️ Đọc theo vai nhân vật'}</span>
            </button>
          </div>

          {/* Formatted dialogue turns list */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-purple-900/50 max-h-56 overflow-y-auto space-y-2 select-text">
            {parsedTurns.length > 0 && isDialogue ? (
              parsedTurns.map((turn, i) => {
                const isActive = activeTurnIndex === i;
                return (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? 'bg-purple-900/60 border-purple-400 ring-2 ring-purple-400/50 shadow-md'
                        : 'bg-slate-900/50 border-slate-800/60 text-purple-100'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          turn.isFemale
                            ? 'bg-pink-950/80 text-pink-300 border border-pink-700/50'
                            : 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/50'
                        }`}
                      >
                        <span>{turn.isFemale ? '👩' : '👨'}</span>
                        <span>{turn.speaker}</span>
                      </span>
                      <p className="text-xs font-medium text-slate-100 leading-relaxed flex-1">
                        {turn.text}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-purple-100 whitespace-pre-wrap leading-relaxed">
                {audioScript}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
