'use client';

import React, { useState } from 'react';
import { Presentation } from 'lucide-react';
import { SlideTargetType } from '@/types/slide';
import LessonSlideModal from './LessonSlideModal';

interface LessonSlideButtonProps {
  targetType: SlideTargetType;
  targetId: string;
  lessonTitle: string;
  canManage?: boolean;
  variant?: 'outline' | 'ghost' | 'primary' | 'badge' | 'compact';
  className?: string;
  label?: string;
}

export default function LessonSlideButton({
  targetType,
  targetId,
  lessonTitle,
  canManage = false,
  variant = 'outline',
  className = '',
  label = 'Slide',
}: LessonSlideButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  let variantStyles = 'px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs';

  if (variant === 'primary') {
    variantStyles = 'px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20';
  } else if (variant === 'ghost') {
    variantStyles = 'p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 text-xs font-semibold';
  } else if (variant === 'badge') {
    variantStyles = 'px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-[11px] font-bold';
  } else if (variant === 'compact') {
    variantStyles = 'p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition';
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 transition cursor-pointer ${variantStyles} ${className}`}
        title={`Xem slide bài giảng: ${lessonTitle}`}
      >
        <Presentation className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        {label && <span>{label}</span>}
      </button>

      {isOpen && (
        <LessonSlideModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          targetType={targetType}
          targetId={targetId}
          lessonTitle={lessonTitle}
          canManage={canManage}
        />
      )}
    </>
  );
}
