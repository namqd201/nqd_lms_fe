'use client';

import React from 'react';
import { UserStatus } from '@/types/auth';
import { CourseStatus, LessonStatus } from '@/types/course';

type SupportedStatus = UserStatus | CourseStatus | LessonStatus | string;

interface StatusBadgeProps {
  status: SupportedStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyle = () => {
    switch (status) {
      case 'ACTIVE':
      case 'PUBLISHED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INACTIVE':
      case 'DRAFT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BANNED':
      case 'ARCHIVED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'PENDING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang hoạt động / Đã xuất bản';
      case 'PUBLISHED':
        return 'Đã xuất bản';
      case 'DRAFT':
        return 'Bản nháp';
      case 'INACTIVE':
        return 'Ngừng hoạt động';
      case 'ARCHIVED':
        return 'Đã lưu trữ';
      case 'BANNED':
        return 'Đã bị khóa';
      case 'PENDING':
        return 'Chờ duyệt';
      default:
        return status;
    }
  };

  const dotColor = () => {
    switch (status) {
      case 'ACTIVE':
      case 'PUBLISHED':
        return 'bg-emerald-500';
      case 'INACTIVE':
      case 'DRAFT':
        return 'bg-amber-500';
      case 'BANNED':
      case 'ARCHIVED':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${getStyle()} ${sizeClasses[size]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor()}`} />
      <span>{getLabel()}</span>
    </span>
  );
};
