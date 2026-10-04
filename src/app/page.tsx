'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  Users,
  BookOpen,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export default function Home() {
  const { user, isLoading, isAuthenticated, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [activeSlide, setActiveSlide] = useState(0);
  const [promptInput, setPromptInput] = useState('');
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');
  const isTeacher = user?.roles?.some((r) => r === 'TEACHER' || r === 'ROLE_TEACHER');

  const slides = [
    {
      badge: '⚡ Next-Gen AI & Architecture',
      prefix: 'Kiến Tạo Tương Lai Cùng',
      title: 'Next-Gen AI & Hệ Thống Giáo Trình Tự Sinh',
      description:
        'Lộ trình học tập cá nhân hoá thời gian thực: phân cấp tự động từ Môn học → Khóa học → Chương thực chiến với Copilot LaTeX tích hợp.',
      tab: '01. AI & Data Engineering',
    },
    {
      badge: '📐 Math & LaTeX Solver Live',
      prefix: 'Đột Phá Tư Duy Cùng',
      title: 'Math & LaTeX Solver AI Đa Phương Thức Real-time',
      description:
        'Nhận diện hình ảnh đề thi viết tay, bóc tách công thức toán học LaTeX chuẩn xác 99.8% và hướng dẫn tư duy từng bước theo phương pháp Socratic.',
      tab: '02. Math & LaTeX Solver Live',
    },
    {
      badge: '🎯 Luyện đề THPT & ĐGNL 3D',
      prefix: 'Bứt Phá Điểm Số Cùng',
      title: 'Hệ Thống Luyện Thi & Giám Sát Chống Gian Lận',
      description:
        'Ngân hàng 10,000+ câu hỏi chuẩn hóa ma trận, tính thời gian làm bài chính xác theo giây và tự động đề xuất lộ trình khắc phục lỗ hổng kiến thức.',
      tab: '03. Luyện đề THPT & ĐGNL 3D',
    },
  ];

  // Auto-switch tabs every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleQuickAsk = (questionText?: string) => {
    const q = (questionText ?? promptInput).trim();
    if (q) {
      router.push(`/ai-tutor?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/ai-tutor');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-9 py-6 lg:py-8 space-y-7 max-w-7xl mx-auto w-full font-sans">
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Đang đồng bộ phiên học tập...</p>
        </div>
      ) : !isAuthenticated ? (
        /* Unauthenticated State */
        <div className="max-w-xl mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Đăng nhập tài khoản NQD-LMS</h2>
            <p className="text-sm text-slate-500 mt-1">
              Đăng nhập với Google để bắt đầu trải nghiệm hệ thống học tập AI thế hệ mới.
            </p>
          </div>

          <button
            onClick={loginWithGoogle}
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01]"
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
      ) : (
        <>
          {/* ========================================================
              SECTION 1: HERO SLIDESHOW ĐỘT PHÁ & SIÊU SÁNG TẠO (BENTO CYBER GLOW)
              ======================================================== */}
          <section className="relative">
            <div className="relative overflow-hidden rounded-3xl bg-[#090d16] text-white shadow-2xl border border-slate-700/60 p-1">
              {/* Cyber Gradient Glow Behind Elements */}
              <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-[110px] pointer-events-none" />
              <div className="absolute top-1/2 -right-20 w-96 h-96 bg-cyan-500/25 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-violet-600/25 rounded-full blur-[110px] pointer-events-none" />
              {/* Subtle Dot Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

              <div className="relative z-10 p-6 sm:p-8 lg:p-9 flex flex-col xl:flex-row gap-8 items-stretch">
                {/* Main Slide Showcase (LOCKED MIN-HEIGHT & FIXED FORM) */}
                <div className="flex-1 flex flex-col justify-between min-h-[440px] xl:min-h-[460px] space-y-5">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2.5 h-8">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/40 backdrop-blur shadow-glow-blue">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                      </span>
                      LIVE NOW
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 backdrop-blur transition-all">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      {slides[activeSlide].badge}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs text-amber-300 bg-amber-500/10 border border-amber-400/20 backdrop-blur">
                      ★ 4.98 (2,450 sinh viên đang online)
                    </span>
                  </div>

                  {/* Typography Headline with dynamic high-tech gradient - FIXED FORM HEIGHT */}
                  <div className="h-[120px] sm:h-[135px] xl:h-[150px] flex flex-col justify-center">
                    <h1 className="text-2xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.18] text-white">
                      <span className="block text-slate-300 text-sm sm:text-xl xl:text-2xl font-semibold mb-1">
                        {slides[activeSlide].prefix}
                      </span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 drop-shadow-[0_0_20px_rgba(56,189,248,0.35)]">
                        {slides[activeSlide].title}
                      </span>
                    </h1>
                  </div>

                  {/* Description - FIXED FORM HEIGHT */}
                  <div className="h-[44px] sm:h-[50px] flex items-center">
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-light line-clamp-2">
                      {slides[activeSlide].description}
                    </p>
                  </div>

                  {/* Primary CTA Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Link
                      href="/courses"
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-blue-500/30 hover:shadow-cyan-500/50 transition-all flex items-center gap-2.5 group"
                    >
                      <span>Bắt đầu Lộ trình Ngay</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                    </Link>
                    <a
                      href="#hierarchy-tree"
                      className="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white font-medium text-xs border border-slate-600/60 backdrop-blur transition-all flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Khám phá Cây Phân Cấp Tri Thức</span>
                    </a>
                  </div>

                  {/* Dynamic Live Slide Tabs & Auto 3s Progress Bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                      {slides.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSlide(idx)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                            activeSlide === idx
                              ? 'bg-blue-600/90 text-white border-blue-400/40 shadow-xs'
                              : 'bg-slate-800/70 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 border-transparent'
                          }`}
                        >
                          {activeSlide === idx && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />}
                          <span>{s.tab}</span>
                        </button>
                      ))}
                    </div>

                    {/* Auto-Progress Timer Bar (Synced 7s with activeSlide) */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden" title="Chuyển slide tự động sau 7s">
                        <div key={activeSlide} className="slide-progress h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))}
                          className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0))}
                          className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hero Bento Side Widgets */}
                <div className="w-full xl:w-96 flex flex-col sm:flex-row xl:flex-col gap-3.5 shrink-0 justify-between">
                  {/* Interactive Widget 1: Live Interactive Classroom */}
                  <div className="flex-1 bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 backdrop-blur-xl shadow-xl hover:border-blue-500/50 transition-all group">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
                        <span className="text-xs font-bold text-white tracking-wide">Phòng Lab Trực Tuyến #04</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/50">
                        48 Đang học
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-xs ring-2 ring-blue-400">
                            TS
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#090d16] rounded-full" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">TS. Trần Quang Hưng</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[11px] text-slate-400">Đang phát biểu:</span>
                            <div className="flex items-end gap-0.5 h-3 ml-1">
                              <span className="w-1 bg-cyan-400 rounded-full wave-1" />
                              <span className="w-1 bg-cyan-400 rounded-full wave-2" />
                              <span className="w-1 bg-cyan-400 rounded-full wave-3" />
                              <span className="w-1 bg-cyan-400 rounded-full wave-4" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Link
                        href="/courses"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 group-hover:scale-105 transition-all"
                      >
                        Vào tức thì
                      </Link>
                    </div>

                    <div className="mt-3 bg-slate-950/60 rounded-xl p-2 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                      <span className="text-blue-400 font-mono text-xs">●</span>
                      <span className="truncate">Chuyên đề: Thuật toán Tối ưu Hóa Lồi & SVMs</span>
                    </div>
                  </div>

                  {/* Interactive Widget 2: AI LaTeX Copilot Live Solver */}
                  <div className="flex-1 bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-indigo-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-xl hover:border-cyan-400/50 transition-all">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-400 text-sm font-serif">∑</span>
                        <span className="text-xs font-bold text-slate-200">AI LaTeX Copilot</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        Real-time Solver
                      </span>
                    </div>

                    <div className="mt-2.5 bg-slate-950 rounded-xl p-2.5 border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1">
                      <div className="text-slate-400 text-[10px]">// Công thức Tích phân Gauss:</div>
                      <div className="text-white font-semibold tracking-wide py-0.5 bg-indigo-950/40 px-2 rounded border border-indigo-800/40 overflow-x-auto">
                        \int_{0}^{'{'}\infty{'}'} e^{'{'}-x^2{'}'} dx = \frac{'{'}\sqrt{'{'}\pi{'}'}{'}'}{'{'}2{'}'}
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 pt-0.5">
                        <span>✓ Phân tích bước 1: Đổi sang tọa độ cực r, θ</span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        Độ chính xác: <strong className="text-emerald-400 font-semibold">99.8%</strong>
                      </span>
                      <Link
                        href="/ai-tutor?q=giai+tich+phan+gauss"
                        className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5"
                      >
                        <span>Xem giải chi tiết</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================
              SECTION 2: DẢI BENTO METRICS THÔNG MINH (DYNAMIC LEARNING STATS)
              ======================================================== */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Thời gian học tuần này</span>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-black text-slate-800">14.5 giờ</h2>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      ↑ 24%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                  ⏱️
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-end justify-between gap-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>T2-CN:</span>
                </div>
                <div className="flex items-end gap-1.5 h-6">
                  <span className="w-1.5 bg-blue-200 rounded-t h-3" title="T2: 2h" />
                  <span className="w-1.5 bg-blue-300 rounded-t h-4" title="T3: 2.5h" />
                  <span className="w-1.5 bg-blue-200 rounded-t h-2" title="T4: 1.5h" />
                  <span className="w-1.5 bg-blue-400 rounded-t h-5" title="T5: 3.2h" />
                  <span className="w-1.5 bg-blue-600 rounded-t h-6" title="Hôm nay: 4h" />
                  <span className="w-1.5 bg-slate-100 rounded-t h-2" />
                  <span className="w-1.5 bg-slate-100 rounded-t h-2" />
                </div>
                <span className="text-[11px] font-semibold text-blue-600">Mục tiêu: 18h</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Nhiệm vụ hôm nay</span>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-black text-slate-800">
                      2<span className="text-slate-400 text-lg font-normal">/3 xong</span>
                    </h2>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      66%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                  🎯
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 truncate max-w-[130px]">Giải 1 bài quiz toán</span>
                <button
                  onClick={() => setRewardClaimed(true)}
                  disabled={rewardClaimed}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition shadow-2xs ${
                    rewardClaimed
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {rewardClaimed ? '✓ Đã nhận' : 'Nhận +50 XP'}
                </button>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-gradient-to-br from-white via-orange-50/40 to-amber-50/40 p-4 sm:p-5 rounded-2xl border border-orange-200 shadow-xs hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-orange-600 font-bold uppercase tracking-wider">Học liên tục</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-orange-100 text-orange-700 font-semibold">
                      Streak
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-black text-orange-600 flex items-center gap-1">
                      <span className="flame-anim">🔥</span> 12
                    </h2>
                    <span className="text-xs font-semibold text-slate-600">ngày liền</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl shadow-2xs">
                  🏆
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-orange-100/80 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-300 ring-2 ring-orange-200" />
                </div>
                <span className="text-[11px] font-semibold text-orange-700">Giữ chuỗi hôm nay</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Điểm năng động XP</span>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-black text-violet-700">1,450</h2>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-2xs">
                      Cyber Rank #12
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-lg">
                  ⚡
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Hạng: <strong className="text-violet-700 font-semibold">Bạch Kim III</strong>
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">+120 XP hôm nay</span>
              </div>
            </div>
          </section>

          {/* ========================================================
              SECTION 4: WIDGET "TRỢ LÝ AI TRẢ LỜI TỨC THÌ" (AI PROMPT QUICKBAR)
              ======================================================== */}
          <section className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-5 sm:p-6 text-white border border-indigo-500/30 shadow-xl overflow-hidden">
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                    ✦
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Trợ Lý AI Trả Lời Tức Thì & Dán Công Thức LaTeX
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-cyan-300 bg-cyan-950/80 border border-cyan-700/50 px-2.5 py-0.5 rounded-full">
                    Model: NQD-DeepMath v3.2
                  </span>
                </div>
              </div>

              {/* Main Prompt Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleQuickAsk();
                }}
                className="relative flex items-center"
              >
                <div className="absolute left-3.5 text-slate-400 pointer-events-none text-sm">💬</div>
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Nhập câu hỏi, bài tập hoặc dán code/LaTeX (ví dụ: Giải thích thuật toán Backpropagation)..."
                  className="w-full pl-10 pr-28 py-3 bg-white/10 border border-white/20 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 backdrop-blur-md transition-all shadow-inner"
                />
                <div className="absolute right-2 flex items-center gap-1.5">
                  <Link
                    href="/ai-tutor"
                    className="hidden sm:inline-flex p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
                    title="Tải ảnh OCR"
                  >
                    📷
                  </Link>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-400 text-white font-bold text-xs shadow-md transition flex items-center gap-1"
                  >
                    <span>Hỏi ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Suggested Quick Prompt Chip Tags */}
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 text-xs">
                <span className="text-[11px] text-slate-400 font-medium shrink-0">Gợi ý nhanh:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAsk('Giải thích Backpropagation')}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 shrink-0 transition text-[11px] flex items-center gap-1"
                >
                  <span>⚡ Giải thích Backpropagation</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAsk('Tóm tắt Chương 3 Vật lý hạt nhân')}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 shrink-0 transition text-[11px] flex items-center gap-1"
                >
                  <span>⚛️ Tóm tắt Chương 3 Vật lý hạt nhân</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAsk('Tạo quiz 5 câu trắc nghiệm ĐGNL')}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 shrink-0 transition text-[11px] flex items-center gap-1"
                >
                  <span>📝 Tạo quiz 5 câu trắc nghiệm ĐGNL</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAsk('Giải tích phân từng phần \\int x \\cos x dx')}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 shrink-0 transition text-[11px] flex items-center gap-1"
                >
                  <span>📐 Giải tích phân từng phần \int x \cos x dx</span>
                </button>
              </div>
            </div>
          </section>

          {/* ========================================================
              SECTION 3: CÂY PHÂN CẤP TRI THỨC ĐỘC ĐÁO & LỘ TRÌNH HỌC DỞ
              ======================================================== */}
          <section className="space-y-4" id="hierarchy-tree">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Cây Phân Cấp Tri Thức & Khóa Học Đang Học Dở</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800">
                    Chuẩn 4 Cấp Độ NQD
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Mô hình phân cấp: [Môn học] → [Khóa học trọng điểm] → [Chương & Học phần] → [Phòng Lab Thực hành AI]
                </p>
              </div>

              {/* Visual Hierarchy Breadcrumbs Switcher */}
              <div className="flex items-center gap-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600">
                <span className="font-bold text-blue-600">Môn học</span>
                <span>→</span>
                <span className="font-bold text-indigo-600">Khóa học</span>
                <span>→</span>
                <span className="font-bold text-emerald-600">Chương</span>
                <span>→</span>
                <span className="font-bold text-purple-600">Lab AI</span>
              </div>
            </div>

            {/* Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cyber Card 1 */}
              <div className="group relative bg-white rounded-3xl p-6 border-2 border-blue-500/40 shadow-md hover:shadow-xl hover:border-blue-600 transition-all flex flex-col justify-between">
                <div className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs">
                  Đang học • 68%
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">Môn: Toán Ứng Dụng</span>
                    <span className="text-slate-300">/</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">Kỳ II</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Toán Cao Cấp & Thuật Toán Tối Ưu Hóa AI
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Phân tích đạo hàm đa biến, Gradient Descent, ma trận Hessian và ứng dụng trực tiếp trong huấn luyện mạng nơ-ron sâu.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        Chương 3: Cực trị hàm nhiều biến
                      </span>
                      <span className="text-blue-600 font-bold">Bài 4/6</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <Link
                    href="/courses"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition flex items-center gap-1.5"
                  >
                    <span>Học tiếp bài 4: Gradient Descent</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[11px] text-slate-400 font-mono">Lab #09</span>
                </div>
              </div>

              {/* Cyber Card 2 */}
              <div className="group relative bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-xl hover:border-emerald-400 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">Môn: Đề Thi ĐGNL</span>
                    <span className="text-slate-300">/</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">120 Câu Hỏi</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Chiến Thuật Tư Duy Định Lượng & Khoa Học ĐGNL ĐHQG
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Hệ thống ngân hàng đề thi chuẩn hóa tích hợp đồng hồ áp lực, gợi ý chống gian lận và AI phân tích lỗ hổng kiến thức sau nộp bài.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đề thi số 08: ĐGNL ĐHQG HCM
                      </span>
                      <span className="text-emerald-600 font-bold">82%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '82%' }} />
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <Link
                    href="/courses"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow transition flex items-center gap-1.5"
                  >
                    <span>Luyện tiếp Đề 08</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[11px] text-emerald-600 font-semibold">Top 5% Điểm</span>
                </div>
              </div>

              {/* Visual Interactive Knowledge Canvas Showcase */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white border border-slate-800 shadow-md flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Roadmap Canvas</span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  <h4 className="text-base font-bold">Cây Kỹ Năng Tự Sinh (Dynamic Skill Tree)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    AI tự động lập sơ đồ tri thức dựa trên điểm mạnh và lỗ hổng bài kiểm tra của bạn để đề xuất học phần tiếp theo.
                  </p>
                  <div className="space-y-2 pt-1 font-mono text-[11px]">
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/40">
                      <span>✓ [Đã đạt]</span>
                      <span className="text-slate-200">Đại số tuyến tính & Ma trận</span>
                    </div>
                    <div className="flex items-center gap-2 text-cyan-400 bg-cyan-950/40 p-2 rounded-xl border border-cyan-800/40">
                      <span>⚡ [Đang học]</span>
                      <span className="text-white font-bold">Tối ưu hóa Lồi & Mạng Nơ-ron</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      <span>🔒 [Khóa tiếp theo]</span>
                      <span className="text-slate-400">AI Agents & LangChain Labs</span>
                    </div>
                  </div>
                </div>
                <div className="pt-5 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                  <Link
                    href="/knowledge"
                    className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1 transition"
                  >
                    <span>Xem Toàn Bộ Sơ Đồ Cây Tri Thức</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================
              SECTION 5: CỔNG TRUY CẬP 3 TRỤ CỘT CHÍNH (THREE PILLARS STANDARD)
              ======================================================== */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Cổng Phân Hệ Nòng Cốt</h2>
                <p className="text-xs text-slate-500">Truy cập nhanh vào hệ thống Khóa học, Trợ lý AI và Hồ sơ bảo mật</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Khám phá Khóa học */}
              <div className="group relative bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📖
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Khám phá Khóa học
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Xem danh sách các khóa học đã được xuất bản theo chuyên đề, phân cấp chương bài giảng chuẩn mực và bắt đầu học tập ngay.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
                      Toán 12
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
                      Lập trình Python
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
                      ĐGNL ĐHQG
                    </span>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:text-emerald-800"
                  >
                    <span>Mở danh mục</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <span className="text-[11px] text-slate-400 font-medium">120+ Khóa học</span>
                </div>
              </div>

              {/* Card 2: Trợ lý AI Tutor */}
              <div className="group relative bg-white rounded-3xl p-6 border-2 border-indigo-200/90 shadow-md hover:shadow-xl hover:border-indigo-400 transition-all duration-300 flex flex-col justify-between">
                <div className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  AI Đa Phương Thức
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🤖
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      Trợ lý AI Tutor
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Hỏi bài tập tức thì, tải ảnh đề thi/tài liệu, giải toán LaTeX chuẩn xác và tự động phân tích lỗ hổng kiến thức từng bước.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition">
                      📐 Giải phương trình
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition">
                      📸 OCR Quét ảnh đề
                    </span>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <Link
                    href="/ai-tutor"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:text-indigo-800"
                  >
                    <span>Mở trang AI Tutor</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online 24/7
                  </span>
                </div>
              </div>

              {/* Card 3: Hồ sơ cá nhân */}
              <div className="group relative bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-blue-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    👤
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      Hồ sơ cá nhân & Bảo mật
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Xem và cập nhật họ tên, số điện thoại, avatar của tài khoản, chứng chỉ đạt được và bảo mật đa vai trò tài khoản.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      2FA Đã kích hoạt
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold">
                      PRO Member
                    </span>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-800"
                  >
                    <span>Xem hồ sơ</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <span className="text-[11px] text-slate-400 font-medium">Bảo mật 100%</span>
                </div>
              </div>
            </div>

            {/* Special Roles Quick Bar for Teachers & Admins */}
            {(isTeacher || isAdmin) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {isTeacher && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Bảng Soạn Giáo Trình Giảng Dạy</h4>
                        <p className="text-[11px] text-slate-500">Tạo khóa học, phân cấp chương bài và ngân hàng câu hỏi</p>
                      </div>
                    </div>
                    <Link
                      href="/teacher/courses"
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      Soạn giáo trình
                    </Link>
                  </div>
                )}
                {isAdmin && (
                  <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Bảng Quản Trị Hệ Thống NQD-LMS</h4>
                        <p className="text-[11px] text-slate-500">Phân quyền, kiểm duyệt giáo viên và kiểm tra nhật ký</p>
                      </div>
                    </div>
                    <Link
                      href="/admin/users"
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      Quản trị hệ thống
                    </Link>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ========================================================
              SECTION 6: LỊCH HỌC TRỰC TIẾP & WORKSHOP
              ======================================================== */}
          <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Lịch Học & Sự Kiện Trực Tiếp Tuần Này</h3>
                <p className="text-xs text-slate-500">Đừng bỏ lỡ các buổi giải đáp thắc mắc và thi thử định kỳ</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full self-start sm:self-auto">
                Lịch tuần hiện tại
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Event 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white border border-slate-200 text-center shrink-0 w-12">
                  <span className="block text-[10px] font-bold text-red-500 uppercase">T.Sáu</span>
                  <span className="block text-base font-extrabold text-slate-800">24</span>
                </div>
                <div className="space-y-0.5">
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded">
                    20:00 - 21:30
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">Workshop: Ứng dụng Prompt AI trong Giải Toán</h4>
                  <p className="text-[11px] text-slate-400">Giảng viên: ThS. Nguyễn Quốc Dũng</p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white border border-slate-200 text-center shrink-0 w-12">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">T.Bảy</span>
                  <span className="block text-base font-extrabold text-slate-800">25</span>
                </div>
                <div className="space-y-0.5">
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded">
                    14:00 - 16:00
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">Thi thử ĐGNL ĐHQG Lần 3 (Quiz Bảo Mật)</h4>
                  <p className="text-[11px] text-slate-400">Thời gian: 150 phút • 120 câu hỏi</p>
                </div>
              </div>

              {/* Event 3 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white border border-slate-200 text-center shrink-0 w-12">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">C.Nhật</span>
                  <span className="block text-base font-extrabold text-slate-800">26</span>
                </div>
                <div className="space-y-0.5">
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded">
                    23:59 Deadline
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">Nộp bài tập lớn: Phân tích Dữ liệu Sinh học</h4>
                  <p className="text-[11px] text-slate-400">Chấm điểm tự động qua NQD-LMS AI</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
