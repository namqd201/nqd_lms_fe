'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

interface VoiceInputButtonProps {
  /** Callback when voice text is recognized */
  onTranscript: (text: string) => void;
  /** Current value of the input or textarea (for clean appending) */
  value?: string;
  /** Mode: 'append' to append recognized speech to existing value, or 'replace' */
  mode?: 'append' | 'replace';
  /** Language code (defaults to 'vi-VN') */
  lang?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Extra CSS classes */
  className?: string;
  /** Custom tooltip title */
  title?: string;
  /** Disable the button */
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  value = '',
  mode = 'append',
  lang = 'vi-VN',
  size = 'md',
  className = '',
  title = 'Nhập bằng giọng nói (Micro)',
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const baseValueRef = useRef<string>(value);
  const isListeningRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  // Update baseValueRef when user edits manually while NOT listening
  useEffect(() => {
    if (!isListeningRef.current) {
      baseValueRef.current = value;
    }
  }, [value]);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    isListeningRef.current = false;
    setIsListening(false);
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech API.\nVui lòng sử dụng Google Chrome hoặc Microsoft Edge để trải nghiệm tính năng này.'
      );
      return;
    }

    try {
      // Abort any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      baseValueRef.current = value || '';
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      let finalTranscript = '';

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0].transcript;
          if (item.isFinal) {
            finalTranscript += (finalTranscript ? ' ' : '') + text.trim();
          } else {
            interimTranscript += text;
          }
        }

        const currentSpoken = (finalTranscript + (interimTranscript ? ' ' + interimTranscript : '')).trim();

        if (mode === 'replace') {
          onTranscript(currentSpoken);
        } else {
          const base = baseValueRef.current.trim();
          const combined = base ? `${base} ${currentSpoken}` : currentSpoken;
          onTranscript(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Vui lòng cho phép quyền truy cập Micro trên trình duyệt để nói.');
        }
        stopListening();
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Size styling variants
  const sizeClasses = {
    sm: 'w-7 h-7 p-1 text-xs',
    md: 'w-9 h-9 p-2 text-sm',
    lg: 'w-10 h-10 p-2.5 text-base',
  }[size];

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="Trình duyệt không hỗ trợ Web Speech API"
        className={`inline-flex items-center justify-center rounded-xl text-slate-300 cursor-not-allowed opacity-50 ${sizeClasses} ${className}`}
      >
        <MicOff className={iconSizeClasses} />
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        title={isListening ? 'Đang lắng nghe... Bấm để dừng' : title}
        className={`relative inline-flex items-center justify-center rounded-xl font-medium transition-all cursor-pointer ${sizeClasses} ${
          isListening
            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 ring-4 ring-rose-500/25 animate-pulse scale-105'
            : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 bg-slate-100/80 border border-slate-200/80'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {isListening ? (
          <>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <Square className={`${iconSizeClasses} fill-current`} />
          </>
        ) : (
          <Mic className={iconSizeClasses} />
        )}
      </button>

      {/* Floating listening indicator pill */}
      {isListening && (
        <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150 z-50">
          Đang nghe...
        </span>
      )}
    </div>
  );
};
