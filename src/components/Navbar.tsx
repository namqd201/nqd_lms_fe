'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { RoleBadge } from './RoleBadge';
import { NotificationBell } from './NotificationBell';
import { UserAvatar } from './UserAvatar';
import { Menu, LogOut, User as UserIcon, BookOpen, Layers, Users, Crown, Sparkles, Zap, TrendingUp, BarChart3, GraduationCap } from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { user, isAuthenticated, isUltra, isPro, isTeacherPro, subscription, logout, loginWithGoogle } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isAdmin = user?.roles.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');
  const isTeacher = user?.roles.some((r) => r === 'TEACHER' || r === 'ROLE_TEACHER');

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {isAuthenticated && onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="NQD-LMS Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight flex items-center gap-1">
                <span className="text-[#2563eb] font-mono font-black">[</span>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-black">
                  NQD-LMS
                </span>
                <span className="text-[#7c3aed] font-mono font-black">]</span>
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-slate-400">
                Tự tin học hỏi - Vững bước tương lai
              </span>
            </div>
          </Link>
        </div>

        {/* Right actions: Notification Bell & User Profile Select Box */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && user ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* User Dropdown / Select Box */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left bg-white shadow-2xs cursor-pointer"
                >
                  <div className="relative">
                    <UserAvatar
                      src={user.avatarUrl}
                      name={user.fullName}
                      size="md"
                      borderColor="border-slate-200"
                    />
                    {isUltra ? (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xs text-[9px] font-black border border-white" title="Tài khoản ULTRA">
                        ⚡
                      </span>
                    ) : isTeacherPro ? (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs text-[9px] font-black border border-white" title="Giáo viên PRO">
                        ⭐
                      </span>
                    ) : isPro ? (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-xs text-[9px] font-black border border-white" title="Tài khoản PRO">
                        👑
                      </span>
                    ) : null}
                  </div>

                  <div className="hidden sm:flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                        {user.fullName}
                      </span>
                      {isUltra ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-2xs shrink-0 animate-pulse">
                          <Crown className="w-2.5 h-2.5 fill-white" />
                          ULTRA
                        </span>
                      ) : isTeacherPro ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-2xs shrink-0">
                          <Sparkles className="w-2.5 h-2.5" />
                          PRO GV
                        </span>
                      ) : isPro ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-2xs shrink-0">
                          <Crown className="w-2.5 h-2.5 fill-white" />
                          PRO
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
                      {user.email}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu Popup */}
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 text-sm animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-3 border-b border-slate-100 mb-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 truncate">{user.fullName}</p>
                          {isUltra ? (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                              ULTRA
                            </span>
                          ) : isTeacherPro ? (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                              PRO GV
                            </span>
                          ) : isPro ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                              PRO
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.roles.map((r) => (
                            <RoleBadge key={r} role={r} size="sm" />
                          ))}
                        </div>
                      </div>

                      {/* Active Membership Banner inside menu */}
                      {(isUltra || isTeacherPro || isPro) && (
                        <div className={`mx-1 mb-2 p-2.5 rounded-xl border flex items-center justify-between ${
                          isUltra 
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200/80' 
                            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/80'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Crown className={`w-4 h-4 shrink-0 ${isUltra ? 'text-purple-600' : 'text-amber-600'}`} />
                            <div>
                              <p className={`text-[11px] font-black uppercase tracking-wider ${isUltra ? 'text-purple-900' : 'text-amber-900'}`}>
                                {subscription?.planName || (isUltra ? 'Hội viên ULTRA' : isTeacherPro ? 'Teacher PRO' : 'Hội viên PRO')}
                              </p>
                              <p className="text-[10px] text-emerald-700 font-bold">Đang kích hoạt 24/7</p>
                            </div>
                          </div>
                          <Link
                            href="/pricing"
                            onClick={() => setDropdownOpen(false)}
                            className="text-[10px] font-extrabold text-blue-700 hover:underline shrink-0"
                          >
                            Đặc quyền
                          </Link>
                        </div>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Hồ sơ của tôi</span>
                      </Link>

                      <Link
                        href="/profile/progress"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors"
                      >
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span>Tiến độ & Streak</span>
                      </Link>

                      <Link
                        href="/courses"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span>Khám phá Khóa học</span>
                      </Link>

                      {(isTeacher || isAdmin) ? (
                        <>
                          <Link
                            href="/teacher/courses"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-blue-700 hover:bg-blue-50 font-medium transition-colors"
                          >
                            <Layers className="w-4 h-4 text-blue-500" />
                            <span>Quản lý Giáo trình</span>
                          </Link>
                          <Link
                            href="/teacher/analytics"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-indigo-700 hover:bg-indigo-50 font-medium transition-colors"
                          >
                            <BarChart3 className="w-4 h-4 text-indigo-500" />
                            <span>Thống kê Khóa học</span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/become-teacher"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 font-semibold transition-colors"
                        >
                          <GraduationCap className="w-4 h-4 text-emerald-600" />
                          <span>Đăng ký Giảng dạy</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          href="/admin/users"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-700 hover:bg-purple-50 font-medium transition-colors"
                        >
                          <Users className="w-4 h-4 text-purple-500" />
                          <span>Quản lý người dùng</span>
                        </Link>
                      )}

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium text-left transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-semibold text-sm shadow-sm transition-all"
            >
              Đăng nhập Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
