'use client';

import React, { useState, useEffect } from 'react';
import { mediaService } from '@/services/media.service';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  borderColor?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
  '2xl': 'w-24 h-24 text-3xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  borderColor = 'border-white',
}) => {
  const [imgError, setImgError] = useState(false);

  // Reset error when src changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const fullUrl = mediaService.getFullUrl(src);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const initial = name && name.trim() ? name.trim().charAt(0).toUpperCase() : 'U';

  if (fullUrl && !imgError) {
    return (
      <img
        src={fullUrl}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${borderColor ? `border-2 ${borderColor}` : ''} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-[#83C75D] text-white font-extrabold flex items-center justify-center shrink-0 shadow-2xs ${borderColor ? `border-2 ${borderColor}` : ''} ${className}`}
    >
      {initial}
    </div>
  );
};
