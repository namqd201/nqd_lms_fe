'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ThumbsUp } from 'lucide-react';
import { ReactionType } from '@/types/discussion';

/* =========================================================================
   1. Authentic High-Fidelity Facebook SVGs
   ========================================================================= */

export const FacebookLikeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
    <circle cx="18" cy="18" r="18" fill="#1877F2" />
    <path
      d="M10.5 16.5C10.5 15.67 11.17 15 12 15H14.5V25.5H12C11.17 25.5 10.5 24.83 10.5 24V16.5Z"
      fill="white"
    />
    <path
      d="M15.5 25.5H23.2C24.08 25.5 24.83 24.88 25 24.02L26.3 17.52C26.5 16.5 25.72 15.5 24.68 15.5H21V12.2C21 11 20 10 18.8 10C18.25 10 17.8 10.45 17.8 11V12.7C17.8 14.1 16.9 15.35 15.5 15.8V25.5Z"
      fill="white"
    />
  </svg>
);

export const FacebookLoveIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
    <circle cx="18" cy="18" r="18" fill="url(#nqdLoveGradient)" />
    <defs>
      <linearGradient id="nqdLoveGradient" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF4B2B" />
        <stop offset="1" stopColor="#E0245E" />
      </linearGradient>
    </defs>
    <path
      d="M18 26.5C18 26.5 10.5 21.5 10.5 16C10.5 13.2 12.7 11 15.5 11C16.8 11 17.6 11.6 18 12.3C18.4 11.6 19.2 11 20.5 11C23.3 11 25.5 13.2 25.5 16C25.5 21.5 18 26.5 18 26.5Z"
      fill="white"
    />
  </svg>
);

export const FacebookCareIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="nqdCareFaceGradient" x1="18" y1="0" x2="18" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFDE6A" />
        <stop offset="1" stopColor="#F7B125" />
      </linearGradient>
      <linearGradient id="nqdCareHeartGradient" x1="13" y1="16" x2="25" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF4B2B" />
        <stop offset="1" stopColor="#E0245E" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="18" fill="url(#nqdCareFaceGradient)" />
    {/* Eyebrows & Eyes */}
    <path d="M11 14C12.5 12.5 15 12.5 16 14" stroke="#8C5300" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M20 14C21 12.5 23.5 12.5 25 14" stroke="#8C5300" strokeWidth="1.8" strokeLinecap="round" />
    {/* Cheeks */}
    <ellipse cx="11.5" cy="17.5" rx="2.2" ry="1.4" fill="#F06A6A" opacity="0.5" />
    <ellipse cx="24.5" cy="17.5" rx="2.2" ry="1.4" fill="#F06A6A" opacity="0.5" />
    {/* Hugging Heart */}
    <path
      d="M18 27.5C18 27.5 13.5 23.5 13.5 19.8C13.5 17.8 15.1 16.2 17.1 16.2C17.9 16.2 18.6 16.6 19 17.1C19.4 16.6 20.1 16.2 20.9 16.2C22.9 16.2 24.5 17.8 24.5 19.8C24.5 23.5 18 27.5 18 27.5Z"
      fill="url(#nqdCareHeartGradient)"
    />
    {/* Hugging Hands */}
    <path d="M9.5 22C11.5 20.5 13.8 21 15.2 22.2" stroke="#F7B125" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M26.5 22C24.5 20.5 22.2 21 20.8 22.2" stroke="#F7B125" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const FacebookHahaIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="nqdHahaGradient" x1="18" y1="0" x2="18" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFDE6A" />
        <stop offset="1" stopColor="#F7B125" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="18" fill="url(#nqdHahaGradient)" />
    {/* Squinting closed laughing eyes */}
    <path d="M10 14.5L14 13L10 11.5" stroke="#683900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26 14.5L22 13L26 11.5" stroke="#683900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Big open smiling mouth */}
    <path d="M11 17C11 23 14 26.5 18 26.5C22 26.5 25 23 25 17Z" fill="#683900" />
    {/* Red/pink tongue */}
    <path d="M14 23C15 25.5 17 26.5 18 26.5C19 26.5 21 25.5 22 23C20.5 21.8 15.5 21.8 14 23Z" fill="#F04141" />
  </svg>
);

export const FacebookWowIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="nqdWowGradient" x1="18" y1="0" x2="18" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFDE6A" />
        <stop offset="1" stopColor="#F7B125" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="18" fill="url(#nqdWowGradient)" />
    {/* Eyebrows */}
    <path d="M10.5 11.5C11.5 10 13.5 10 14.5 11" stroke="#683900" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M25.5 11.5C24.5 10 22.5 10 21.5 11" stroke="#683900" strokeWidth="1.8" strokeLinecap="round" />
    {/* Round eyes */}
    <circle cx="13" cy="15" r="2.2" fill="#292929" />
    <circle cx="23" cy="15" r="2.2" fill="#292929" />
    {/* Open circular O mouth */}
    <ellipse cx="18" cy="23.5" rx="3.6" ry="5.2" fill="#683900" />
    <ellipse cx="18" cy="24" rx="2.5" ry="3.8" fill="#1C0E00" />
  </svg>
);

export const FacebookSadIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="nqdSadGradient" x1="18" y1="0" x2="18" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFDE6A" />
        <stop offset="1" stopColor="#F7B125" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="18" fill="url(#nqdSadGradient)" />
    {/* Sad eyebrows */}
    <path d="M11 12C12.5 13 14.5 13 15.5 12.2" stroke="#683900" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M25 12C23.5 13 21.5 13 20.5 12.2" stroke="#683900" strokeWidth="1.8" strokeLinecap="round" />
    {/* Sad eyes */}
    <ellipse cx="13.5" cy="16.5" rx="2" ry="2.2" fill="#292929" />
    <ellipse cx="22.5" cy="16.5" rx="2" ry="2.2" fill="#292929" />
    {/* Frown mouth */}
    <path d="M14 23.5C15.5 21.8 20.5 21.8 22 23.5" stroke="#683900" strokeWidth="2" strokeLinecap="round" />
    {/* Water drop tear */}
    <path
      d="M24.5 20.5C24.5 22 25.5 23 26.5 23C27.5 23 28.5 22 28.5 20.5C28.5 18.5 26.5 16.5 26.5 16.5C26.5 16.5 24.5 18.5 24.5 20.5Z"
      fill="#1877F2"
    />
  </svg>
);

export const FacebookAngryIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="nqdAngryGradient" x1="18" y1="0" x2="18" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF5722" />
        <stop offset="0.6" stopColor="#E62117" />
        <stop offset="1" stopColor="#B71C1C" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="18" fill="url(#nqdAngryGradient)" />
    {/* Furious sharp eyebrows */}
    <path d="M10 12.5L16 15" stroke="#5E0000" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M26 12.5L20 15" stroke="#5E0000" strokeWidth="2.5" strokeLinecap="round" />
    {/* Eyes */}
    <ellipse cx="13.5" cy="17" rx="1.8" ry="2" fill="#240000" />
    <ellipse cx="22.5" cy="17" rx="1.8" ry="2" fill="#240000" />
    {/* Angled frowning mouth */}
    <path d="M13 24C15 22 21 22 23 24" stroke="#5E0000" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/* =========================================================================
   2. Config & Registry
   ========================================================================= */

export const REACTION_ORDER: ReactionType[] = ['LIKE', 'LOVE', 'CARE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];

export const REACTION_CONFIG: Record<
  ReactionType,
  {
    label: string;
    textColor: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  LIKE: {
    label: 'Thích',
    textColor: 'text-[#1877F2]',
    icon: FacebookLikeIcon,
  },
  LOVE: {
    label: 'Yêu thích',
    textColor: 'text-[#F02849]',
    icon: FacebookLoveIcon,
  },
  CARE: {
    label: 'Thương thương',
    textColor: 'text-[#F7B125]',
    icon: FacebookCareIcon,
  },
  HAHA: {
    label: 'Haha',
    textColor: 'text-[#F7B125]',
    icon: FacebookHahaIcon,
  },
  WOW: {
    label: 'Wow',
    textColor: 'text-[#F7B125]',
    icon: FacebookWowIcon,
  },
  SAD: {
    label: 'Buồn',
    textColor: 'text-[#F7B125]',
    icon: FacebookSadIcon,
  },
  ANGRY: {
    label: 'Phẫn nộ',
    textColor: 'text-[#E44D26]',
    icon: FacebookAngryIcon,
  },
};

/* =========================================================================
   3. Floating Reaction Dock / Popover
   ========================================================================= */

interface ReactionDockProps {
  isOpen: boolean;
  onSelect: (type: ReactionType) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const ReactionDock: React.FC<ReactionDockProps> = ({
  isOpen,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [hoveredType, setHoveredType] = useState<ReactionType | null>(null);

  if (!isOpen) return null;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute bottom-full left-0 mb-2 z-50 flex items-center gap-1 sm:gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_28px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 duration-150 select-none"
      style={{ transformOrigin: 'bottom left' }}
    >
      {REACTION_ORDER.map((type) => {
        const item = REACTION_CONFIG[type];
        const IconComponent = item.icon;
        const isHovered = hoveredType === type;

        return (
          <button
            key={type}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(type);
            }}
            onMouseEnter={() => setHoveredType(type)}
            onMouseLeave={() => setHoveredType(null)}
            className="group relative p-1 rounded-full transition-transform duration-150 ease-out hover:scale-135 hover:-translate-y-2.5 active:scale-110 focus:outline-none cursor-pointer"
            title={item.label}
          >
            {/* Tooltip on top of individual icon */}
            {isHovered && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-slate-900/90 shadow-md whitespace-nowrap pointer-events-none animate-in fade-in duration-100">
                {item.label}
              </span>
            )}
            <IconComponent className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-sm transition-transform" />
          </button>
        );
      })}
    </div>
  );
};

/* =========================================================================
   4. Reaction Summary Badge (Top icons + counter)
   ========================================================================= */

interface ReactionSummaryBadgeProps {
  reactionCount?: number;
  reactionBreakdown?: Record<string, number>;
  onClick?: () => void;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export const ReactionSummaryBadge: React.FC<ReactionSummaryBadgeProps> = ({
  reactionCount = 0,
  reactionBreakdown = {},
  onClick,
  className = '',
  size = 'sm',
}) => {
  if (reactionCount <= 0) return null;

  // Find top reactions present in breakdown sorted by frequency
  const sortedReactions = Object.entries(reactionBreakdown)
    .filter(([type, count]) => count > 0 && type in REACTION_CONFIG)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type as ReactionType);

  // If breakdown is empty, default to LIKE
  const topReactions = sortedReactions.length > 0 ? sortedReactions.slice(0, 3) : (['LIKE'] as ReactionType[]);

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
  };

  const textSizes = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-xs font-semibold',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer select-none ${className}`}
    >
      {/* Overlapping mini icons */}
      <div className="flex items-center -space-x-1">
        {topReactions.map((type, idx) => {
          const item = REACTION_CONFIG[type];
          if (!item) return null;
          const Icon = item.icon;
          return (
            <div
              key={type}
              className="rounded-full ring-2 ring-white dark:ring-slate-900 bg-white"
              style={{ zIndex: 10 - idx }}
            >
              <Icon className={iconSizes[size]} />
            </div>
          );
        })}
      </div>
      <span className={`${textSizes[size]} font-bold text-slate-600 dark:text-slate-300`}>
        {reactionCount.toLocaleString('vi-VN')}
      </span>
    </button>
  );
};

/* =========================================================================
   5. Main Facebook Reaction Button
   ========================================================================= */

interface FacebookReactionButtonProps {
  myReaction?: ReactionType | null;
  reactionCount?: number;
  reactionBreakdown?: Record<string, number>;
  onReact: (type: ReactionType) => Promise<void> | void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  showSummaryInline?: boolean;
}

export const FacebookReactionButton: React.FC<FacebookReactionButtonProps> = ({
  myReaction = null,
  reactionCount = 0,
  reactionBreakdown = {},
  onReact,
  size = 'md',
  disabled = false,
  className = '',
  showSummaryInline = false,
}) => {
  const [isDockOpen, setIsDockOpen] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    // Delay dock opening by 200ms to avoid accidental triggers
    hoverTimerRef.current = setTimeout(() => {
      setIsDockOpen(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setIsDockOpen(false);
    }, 300);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    clearTimers();
    setIsDockOpen(false);

    // If user already reacted -> clicking again un-reacts (passes current reaction)
    // If user has not reacted -> default to LIKE
    onReact(myReaction || 'LIKE');
  };

  const handleSelectReaction = (type: ReactionType) => {
    clearTimers();
    setIsDockOpen(false);
    onReact(type);
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const activeConfig = myReaction && myReaction in REACTION_CONFIG ? REACTION_CONFIG[myReaction] : null;
  const ActiveIcon = activeConfig?.icon;

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center gap-1.5 ${className}`}
    >
      {/* Floating Reaction Bar Popover */}
      <ReactionDock
        isOpen={isDockOpen}
        onSelect={handleSelectReaction}
        onMouseEnter={() => {
          if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
        }}
        onMouseLeave={handleMouseLeave}
      />

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 font-bold transition-all rounded-xl cursor-pointer select-none focus:outline-none ${
          isSmall
            ? 'px-2 py-1 text-xs hover:bg-slate-100/80 active:scale-95'
            : 'px-3 py-1.5 text-xs sm:text-sm hover:bg-slate-100/90 active:scale-95'
        } ${
          activeConfig
            ? `${activeConfig.textColor} font-black`
            : 'text-slate-600 hover:text-[#1877F2]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {activeConfig && ActiveIcon ? (
          <ActiveIcon className={isSmall ? 'w-4 h-4' : 'w-4.5 h-4.5'} />
        ) : (
          <ThumbsUp className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        )}
        <span>{activeConfig ? activeConfig.label : 'Thích'}</span>
      </button>

      {/* Optional Inline Reaction Summary Counter */}
      {showSummaryInline && reactionCount > 0 && (
        <ReactionSummaryBadge
          reactionCount={reactionCount}
          reactionBreakdown={reactionBreakdown}
          size={isSmall ? 'xs' : 'sm'}
        />
      )}
    </div>
  );
};
