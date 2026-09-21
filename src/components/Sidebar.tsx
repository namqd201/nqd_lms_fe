'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  BookOpen,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  Users,
  User,
  Sparkles,
  Bot,
  MessageSquareCode,
  BarChart3,
  TrendingUp,
  Award,
  Dumbbell,
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { user, isAuthenticated, isUltra, isPro, isTeacherPro } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated || !user) {
    return null;
  }

  const isAdmin = user.roles.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');
  const isTeacher = user.roles.some((r) => r === 'TEACHER' || r === 'ROLE_TEACHER');

  const navItems = [
    {
      href: '/',
      label: 'Trang chủ',
      icon: Home,
    },
    {
      href: '/courses',
      label: 'Khóa học',
      icon: BookOpen,
    },
    {
      href: '/ai-tutor',
      label: 'AI Tutor',
      icon: MessageSquareCode,
    },
    {
      href: '/teacher/questions',
      label: 'Ngân hàng Câu hỏi',
      icon: HelpCircle,
    },
    ...(isTeacher || isAdmin
      ? [
          {
            href: '/teacher/courses',
            label: 'Quản lý Giáo trình',
            icon: Layers,
            badge: 'Giảng viên',
            badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
          },
          {
            href: '/teacher/exams',
            label: 'Quản lý Đề thi',
            icon: FileSpreadsheet,
            badge: 'Mới',
            badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          },
          {
            href: '/teacher/analytics',
            label: 'Thống kê & Báo cáo',
            icon: BarChart3,
            badge: 'Mới',
            badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          },
          {
            href: '/teacher/finance',
            label: 'Tài chính & Rút tiền',
            icon: Sparkles,
            badge: 'Doanh thu',
            badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
          },
        ]
      : []),
    {
      href: '/profile/progress',
      label: 'Tiến độ học tập',
      icon: TrendingUp,
      badge: 'Streak',
      badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    {
      href: '/profile/certificates',
      label: 'Chứng chỉ của tôi',
      icon: Award,
      badge: 'Mới',
      badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    {
      href: '/pricing',
      label: isUltra
        ? 'Gói Hội viên (ULTRA)'
        : isTeacherPro
        ? 'Gói Hội viên (PRO GV)'
        : isPro
        ? 'Gói Hội viên (PRO)'
        : 'Nâng cấp PRO / ULTRA',
      icon: Sparkles,
      badge: isUltra ? 'ULTRA' : isTeacherPro ? 'PRO' : isPro ? 'PRO' : 'HOT',
      badgeColor: isUltra
        ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white border-transparent font-black shadow-xs'
        : isTeacherPro || isPro
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black'
        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent font-bold',
    },
    {
      href: '/orders',
      label: 'Lịch sử Mua hàng',
      icon: Layers,
    },
    ...(isAdmin
      ? [
          {
            href: '/admin',
            label: 'Admin Portal',
            icon: Users,
            badge: 'Admin',
            badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
          },
        ]
      : []),
    {
      href: '/profile',
      label: 'Hồ sơ cá nhân',
      icon: User,
    },
  ];

  const content = (
    <div className="h-full flex flex-col justify-between p-4 bg-white border-r border-slate-200 w-64 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Navigation Menu Links */}
        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Điều hướng
          </p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#83C75D]/15 text-[#4e8231] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-[#4e8231]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${
                      item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* AI Tutor Card Button in Sidebar */}
        <div className="pt-2">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Trợ lý thông minh
          </p>
          <Link
            href="/ai-tutor"
            onClick={onCloseMobile}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:scale-[1.02] transition-all group text-left border border-white/10 ${
              pathname.startsWith('/ai-tutor') ? 'ring-2 ring-indigo-400' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
              🤖
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm leading-tight">AI Tutor</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
              </div>
              <span className="text-[11px] text-indigo-100 font-normal truncate mt-0.5">
                Hỏi qua Ảnh & LaTeX
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-yellow-300 opacity-80 group-hover:opacity-100" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 h-full z-30">
        {content}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-72 bg-white shadow-2xl relative z-10 flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
                  <span className="font-extrabold text-slate-900 text-base">Menu</span>
                </div>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{content}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
