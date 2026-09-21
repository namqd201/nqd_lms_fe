'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  Users,
  BookOpen,
  Layers,
} from 'lucide-react';

export default function Home() {
  const { user, isLoading, isAuthenticated, loginWithGoogle } = useAuth();

  const isAdmin = user?.roles.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');
  const isTeacher = user?.roles.some((r) => r === 'TEACHER' || r === 'ROLE_TEACHER');

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#83C75D] selection:text-white pb-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#83C75D]/15 via-[#83C75D]/5 to-transparent border-b border-slate-200/80 pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-3xl flex items-start gap-5">
              <img
                src="/logo.png"
                alt="NQD-LMS Logo"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-2xl shadow-sm shrink-0 bg-white p-2 border border-slate-200/80"
              />
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#83C75D]/20 text-[#4e8231] border border-[#83C75D]/30 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>NQD-LMS • Tự tin học hỏi - Vững bước tương lai</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Hệ thống Quản lý Khóa học & Giáo trình Trực tuyến
                </h1>
                <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
                  Nền tảng học tập thông minh tích hợp trợ lý AI đa phương thức hỗ trợ phân cấp Môn học → Khóa học → Chương → Bài giảng với bảo mật đa vai trò.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-10 h-10 border-4 border-[#83C75D]/30 border-t-[#83C75D] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Đang đồng bộ phiên đăng nhập...</p>
          </div>
        ) : isAuthenticated && user ? (
          <>
            {/* Quick Action Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Courses Catalog Card */}
              <div className="bg-white border border-slate-200 hover:border-[#83C75D] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#83C75D]/15 text-[#4e8231] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#4e8231] transition-colors">
                    Khám phá Khóa học
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Xem danh sách các khóa học đã được xuất bản và bắt đầu học tập.
                  </p>
                </div>
                <Link
                  href="/courses"
                  className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#4e8231] group-hover:translate-x-1 transition-transform"
                >
                  <span>Mở danh mục</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* AI Tutor Quick Card */}
              <Link
                href="/ai-tutor"
                className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border border-indigo-200 hover:border-indigo-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-indigo-500/20 text-xl">
                    🤖
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      Trợ lý AI Tutor
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hỏi bài tập, tải ảnh đề thi/tài liệu, giải toán LaTeX chuẩn và lưu trữ lịch sử trò chuyện.
                  </p>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  <span>Mở trang AI Tutor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* Teacher Course Management Card */}
              {(isTeacher || isAdmin) && (
                <div className="bg-white border border-blue-200 hover:border-blue-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        Quản lý Giáo trình
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        Teacher
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tạo khóa học, soạn chương, viết bài học và phát hành giáo trình.
                    </p>
                  </div>
                  <Link
                    href="/teacher/courses"
                    className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-blue-700 group-hover:translate-x-1 transition-transform"
                  >
                    <span>Soạn giáo trình</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Admin Management Card */}
              {isAdmin && (
                <div className="bg-white border border-purple-200 hover:border-purple-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                        Quản lý Người dùng
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                        Admin
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tìm kiếm người dùng, kích hoạt/khóa tài khoản, gán hoặc gỡ vai trò.
                    </p>
                  </div>
                  <Link
                    href="/admin/users"
                    className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform"
                  >
                    <span>Mở trang Quản trị</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Profile Card */}
              <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                    Hồ sơ cá nhân
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Xem và cập nhật họ tên, số điện thoại, avatar của tài khoản.
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-slate-700 group-hover:translate-x-1 transition-transform"
                >
                  <span>Xem hồ sơ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* Unauthenticated State */
          <div className="max-w-xl mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#83C75D]/15 text-[#83C75D] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Đăng nhập tài khoản</h2>
              <p className="text-sm text-slate-500 mt-1">
                Sử dụng tài khoản Google để đăng nhập và trải nghiệm các tính năng của NQD LMS.
              </p>
            </div>

            <button
              onClick={loginWithGoogle}
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-sm shadow-md shadow-[#83C75D]/20 transition-all hover:scale-[1.01]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.4-4.52 6.16-4.52z" />
              </svg>
              Đăng nhập với Google
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
