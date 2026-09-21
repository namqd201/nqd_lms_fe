'use client';

import React from 'react';

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
  onRemove?: () => void;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md', onRemove }) => {
  const cleanRole = role.startsWith('ROLE_') ? role.substring(5) : role;

  const getStyle = () => {
    switch (cleanRole.toUpperCase()) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20';
      case 'TEACHER':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20';
      case 'STUDENT':
        return 'bg-[#83C75D]/15 text-[#4e8231] border-[#83C75D]/30 ring-1 ring-[#83C75D]/30';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    switch (cleanRole.toUpperCase()) {
      case 'ADMIN':
        return 'Quản trị viên (Admin)';
      case 'TEACHER':
        return 'Giảng viên (Teacher)';
      case 'STUDENT':
        return 'Học sinh (Student)';
      default:
        return cleanRole;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
    lg: 'text-sm font-semibold px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-all ${getStyle()} ${sizeClasses[size]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      <span>{getLabel()}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 -mr-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
          title={`Gỡ vai trò ${cleanRole}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};
