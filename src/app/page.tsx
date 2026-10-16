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
  Trophy,
  FlaskConical,
  Calendar,
  Clock,
  ExternalLink,
  Radio,
  RotateCw,
} from 'lucide-react';
import katex from 'katex';
import { gamificationService, GamificationDashboardData } from '@/services/gamification.service';
import { labService, LabRoomItem } from '@/services/lab.service';
import { studentService } from '@/services/student.service';
import { courseService } from '@/services/course.service';
import { examService } from '@/services/exam.service';
import { StudentResumeLearningResponse, ResumeCourseDto, ResumeExamDto, WeeklyScheduleEventDto } from '@/types/student';

const MATH_COPILOT_FORMULAS = [
  {
    title: '// Tính chất tuyến tính của Tích phân:',
    latex: '\\int_{a}^{b} \\left[ f(x) \\pm g(x) \\right] dx = \\int_{a}^{b} f(x) \\, dx \\pm \\int_{a}^{b} g(x) \\, dx',
    step: '✓ Phân tích: Tách thành hai tích phân cơ bản để tính nhanh',
    query: 'tinh+chat+tuyen+tinh+tich+phan',
  },
  {
    title: '// Công thức Tích phân Gauss:',
    latex: '\\int_{0}^{\\infty} e^{-x^2} \\, dx = \\frac{\\sqrt{\\pi}}{2}',
    step: '✓ Phân tích bước 1: Đổi sang hệ tọa độ cực r, θ',
    query: 'giai+tich+phan+gauss',
  },
  {
    title: '// Công thức Tích phân từng phần:',
    latex: '\\int u \\, dv = u \\cdot v - \\int v \\, du',
    step: '✓ Quy tắc đặt: Nhất lô, nhì đa, tam lượng, tứ mũ',
    query: 'tich+phan+tung+phan',
  },
];

function getSpeakerInitials(name?: string) {
  if (!name) return 'GV';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatScheduledTime(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    return `${time} • ${date}`;
  } catch {
    return dateStr;
  }
}

export default function Home() {
  const { user, isLoading, isAuthenticated, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [activeSlide, setActiveSlide] = useState(0);
  const [promptInput, setPromptInput] = useState('');
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [gamification, setGamification] = useState<GamificationDashboardData | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [activeLab, setActiveLab] = useState<LabRoomItem | null>(null);
  const [isLoadingLab, setIsLoadingLab] = useState<boolean>(true);
  const [formulaIndex, setFormulaIndex] = useState<number>(0);

  // Real Student Learning Resume State (Courses in-progress & Exams in-progress)
  const [resumeData, setResumeData] = useState<StudentResumeLearningResponse | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState<boolean>(true);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState<number>(0);
  const [selectedExamIndex, setSelectedExamIndex] = useState<number>(0);

  // Real Weekly Schedule & Live Events State
  const [weeklyEvents, setWeeklyEvents] = useState<WeeklyScheduleEventDto[]>([]);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState<boolean>(true);

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

  // Auto-switch math formulas every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFormulaIndex((prev) => (prev + 1) % MATH_COPILOT_FORMULAS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Load real gamification metrics (Streak, XP, Missions, Weekly study)
  useEffect(() => {
    if (isAuthenticated) {
      gamificationService
        .getDashboard()
        .then((data) => {
          setGamification(data);
          setRewardClaimed(data.dailyRewardClaimed);
        })
        .catch((err) => console.error('Failed to load gamification dashboard', err));
    }
  }, [isAuthenticated]);

  // Load real-time active or upcoming public Lab room for the hero widget
  useEffect(() => {
    let isMounted = true;
    labService
      .getPublicLabs()
      .then((rooms) => {
        if (!isMounted) return;
        if (rooms && rooms.length > 0) {
          // Prioritize: 1st live room, else 1st scheduled room
          const liveRoom = rooms.find((r) => r.status === 'LIVE');
          if (liveRoom) {
            setActiveLab(liveRoom);
          } else {
            const scheduledRoom = rooms.find((r) => r.status === 'SCHEDULED');
            setActiveLab(scheduledRoom || null);
          }
        } else {
          setActiveLab(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load public lab rooms for hero widget', err);
        if (isMounted) setActiveLab(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingLab(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load real student in-progress course, current lesson, and active/recent exam
  useEffect(() => {
    let isMounted = true;

    const loadPublicFallback = () => {
      setIsLoadingResume(true);
      Promise.all([
        courseService.getPublishedCourses().catch(() => []),
        examService.getSharedLibrary().catch(() => []),
      ])
        .then(([courses, exams]) => {
          if (!isMounted) return;
          const topCourse = courses && courses.length > 0 ? courses[0] : null;
          const topExam = exams && exams.length > 0 ? exams[0] : null;

          const fallbackData: StudentResumeLearningResponse = {
            inProgressCourse: topCourse
              ? {
                  courseId: topCourse.id,
                  courseTitle: topCourse.name,
                  courseDescription: topCourse.description,
                  courseThumbnail: topCourse.thumbnailUrl,
                  subjectName: topCourse.subjectName || 'Khóa học',
                  gradeLevel: topCourse.gradeLevel || 'Toàn diện',
                  chapterDisplayOrder: 1,
                  chapterTitle: 'Chương 1: Nền tảng cốt lõi',
                  lessonDisplayOrder: 1,
                  lessonTitle: 'Bài 1: Tổng quan chương trình',
                  totalLessonsInChapter: 6,
                  courseProgressPercent: 0,
                  completedLessons: 0,
                  totalLessons: 12,
                  isEnrolled: false,
                }
              : null,
            inProgressExam: topExam
              ? {
                  examId: topExam.id,
                  examTitle: topExam.title,
                  examDescription: topExam.description,
                  courseId: topExam.courseId,
                  courseName: topExam.courseName,
                  subjectName: topExam.subjectName || 'Ngân hàng đề thi',
                  gradeLevel: topExam.gradeLevel,
                  durationMinutes: topExam.durationMinutes || 60,
                  totalMarks: topExam.totalMarks || 10,
                  questionCount: topExam.questionCount || 40,
                  attemptStatus: 'NOT_STARTED',
                  answeredQuestionsCount: 0,
                  currentQuestionIndex: 1,
                  scorePercentage: 0,
                }
              : null,
          };
          setResumeData(fallbackData);
          setIsLoadingResume(false);
        })
        .catch(() => {
          if (isMounted) setIsLoadingResume(false);
        });
    };

    if (isAuthenticated) {
      setIsLoadingResume(true);
      studentService
        .getResumeLearning()
        .then((data) => {
          if (!isMounted) return;
          if (data && (data.inProgressCourse || data.inProgressExam || data.weeklyEvents)) {
            setResumeData(data);
            if (data.weeklyEvents && data.weeklyEvents.length > 0) {
              setWeeklyEvents(data.weeklyEvents);
              setIsLoadingWeekly(false);
            }
            setIsLoadingResume(false);
          } else {
            loadPublicFallback();
          }
        })
        .catch((err) => {
          console.warn('Could not load student resume learning, loading public fallback:', err);
          if (isMounted) loadPublicFallback();
        });
    } else {
      loadPublicFallback();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Load real weekly schedule and live events for this current week
  useEffect(() => {
    let isMounted = true;
    setIsLoadingWeekly(true);
    studentService
      .getWeeklySchedule()
      .then((events) => {
        if (!isMounted) return;
        if (events && events.length > 0) {
          setWeeklyEvents(events);
        }
      })
      .catch((err) => {
        console.warn('Could not load weekly schedule events:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingWeekly(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Derived real courses list & selected course
  const allResumeCourses: ResumeCourseDto[] = [];
  if (resumeData?.inProgressCourse) allResumeCourses.push(resumeData.inProgressCourse);
  if (resumeData?.otherCourses) allResumeCourses.push(...resumeData.otherCourses);
  const activeResumeCourse = allResumeCourses[selectedCourseIndex] || allResumeCourses[0] || null;

  // Derived real exams list & selected exam
  const allResumeExams: ResumeExamDto[] = [];
  if (resumeData?.inProgressExam) allResumeExams.push(resumeData.inProgressExam);
  if (resumeData?.otherExams) allResumeExams.push(...resumeData.otherExams);
  const activeResumeExam = allResumeExams[selectedExamIndex] || allResumeExams[0] || null;

  const handleClaimReward = async () => {
    if (!gamification || claiming) return;
    const unclaimed = gamification.dailyMissions?.find((m) => m.isCompleted && !m.isClaimed);
    if (!unclaimed) {
      setRewardClaimed(true);
      return;
    }
    try {
      setClaiming(true);
      const res = await gamificationService.claimMission(unclaimed.id);
      if (res.success) {
        setGamification((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            totalXp: res.newTotalXp,
            monthlyXp: res.newMonthlyXp,
            todayXp: res.newTodayXp,
            dailyRewardClaimed: true,
          };
        });
        setRewardClaimed(true);
      }
    } catch (e) {
      console.error('Failed to claim mission reward', e);
    } finally {
      setClaiming(false);
    }
  };

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

              <div className="relative z-10 p-4 sm:p-8 lg:p-9 flex flex-col xl:flex-row gap-6 sm:gap-8 items-stretch">
                {/* Main Slide Showcase (RESPONSIVE AUTO HEIGHT ON MOBILE) */}
                <div className="flex-1 flex flex-col justify-between min-h-0 sm:min-h-[440px] xl:min-h-[460px] gap-4 sm:gap-5">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-h-[32px] h-auto">
                    <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/40 backdrop-blur shadow-glow-blue shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                      </span>
                      LIVE NOW
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 backdrop-blur transition-all">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      {slides[activeSlide].badge}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs text-amber-300 bg-amber-500/10 border border-amber-400/20 backdrop-blur">
                      ★ 4.98 (2,450 sinh viên đang online)
                    </span>
                  </div>

                  {/* Typography Headline with dynamic high-tech gradient - FLUID ON MOBILE */}
                  <div className="min-h-0 sm:min-h-[135px] xl:min-h-[150px] h-auto flex flex-col justify-center py-1 sm:py-0">
                    <h1 className="text-xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight leading-snug sm:leading-[1.18] text-white">
                      <span className="block text-slate-300 text-xs sm:text-xl xl:text-2xl font-semibold mb-1">
                        {slides[activeSlide].prefix}
                      </span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 drop-shadow-[0_0_20px_rgba(56,189,248,0.35)]">
                        {slides[activeSlide].title}
                      </span>
                    </h1>
                  </div>

                  {/* Description - FLUID ON MOBILE */}
                  <div className="min-h-[40px] sm:h-[50px] h-auto flex items-center">
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-light line-clamp-3 sm:line-clamp-2">
                      {slides[activeSlide].description}
                    </p>
                  </div>

                  {/* Primary CTA Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
                    <Link
                      href="/courses"
                      className="px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-blue-500/30 hover:shadow-cyan-500/50 transition-all flex items-center justify-center gap-2.5 group"
                    >
                      <span>Bắt đầu Lộ trình Ngay</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                    </Link>
                    <a
                      href="#hierarchy-tree"
                      className="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white font-medium text-xs border border-slate-600/60 backdrop-blur transition-all flex items-center justify-center gap-2"
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
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border shrink-0 ${
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
                  {/* Interactive Widget 1: Real-time Live Interactive Lab Room */}
                  {isLoadingLab ? (
                    <div className="flex-1 bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex flex-col justify-between animate-pulse">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                          <span className="h-4 w-32 bg-slate-800 rounded" />
                        </div>
                        <span className="h-4 w-16 bg-slate-800 rounded-full" />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-24 bg-slate-800 rounded" />
                            <div className="h-2.5 w-32 bg-slate-800 rounded" />
                          </div>
                        </div>
                        <div className="h-7 w-20 bg-slate-800 rounded-xl" />
                      </div>
                      <div className="mt-3 h-8 bg-slate-950/60 rounded-xl border border-slate-800" />
                    </div>
                  ) : activeLab ? (
                    // Case 1 & Case 2: There is a LIVE or an UPCOMING SCHEDULED Lab
                    <div className="flex-1 bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 backdrop-blur-xl shadow-xl hover:border-blue-500/50 transition-all group">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {activeLab.status === 'LIVE' ? (
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-blue-500/20 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-white tracking-wide truncate">
                            {activeLab.title || 'Phòng Lab Trực Tuyến'}
                          </span>
                        </div>

                        {activeLab.status === 'LIVE' ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-600/50 flex items-center gap-1 shrink-0 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            ĐANG LIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-800/50 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            SẮP DIỄN RA
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {activeLab.hostAvatarUrl ? (
                              <img
                                src={activeLab.hostAvatarUrl}
                                alt={activeLab.speakerName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-400"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-xs ring-2 ring-blue-400 text-white">
                                {getSpeakerInitials(activeLab.speakerName)}
                              </div>
                            )}
                            {activeLab.status === 'LIVE' && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#090d16] rounded-full ring-1 ring-emerald-400" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {activeLab.speakerName || 'Giảng viên phụ trách'}
                            </p>
                            {activeLab.status === 'LIVE' ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[11px] text-slate-400">Đang phát trực tiếp:</span>
                                <div className="flex items-end gap-0.5 h-3 ml-1">
                                  <span className="w-1 bg-cyan-400 rounded-full wave-1" />
                                  <span className="w-1 bg-cyan-400 rounded-full wave-2" />
                                  <span className="w-1 bg-cyan-400 rounded-full wave-3" />
                                  <span className="w-1 bg-cyan-400 rounded-full wave-4" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 mt-0.5 text-[11px] text-cyan-400">
                                <Calendar className="w-3 h-3 text-cyan-400" />
                                <span>{formatScheduledTime(activeLab.scheduledStartTime)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {activeLab.status === 'LIVE' && activeLab.guestMeetingUrl ? (
                          <a
                            href={activeLab.guestMeetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 group-hover:scale-105 transition-all flex items-center gap-1 shrink-0"
                          >
                            <span>Vào tức thì</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <Link
                            href="/labs"
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 group-hover:scale-105 transition-all flex items-center gap-1 shrink-0"
                          >
                            <span>Vào phòng Lab</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>

                      <div className="mt-3 bg-slate-950/60 rounded-xl p-2 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                        <span className={activeLab.status === 'LIVE' ? 'text-emerald-400 font-mono text-xs' : 'text-blue-400 font-mono text-xs'}>
                          ●
                        </span>
                        <span className="truncate">
                          {activeLab.description || `Chuyên đề: ${activeLab.title}`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Case 3: No Lab is currently live and no upcoming scheduled Lab
                    <div className="flex-1 bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 backdrop-blur-xl shadow-xl hover:border-indigo-500/50 transition-all group">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 ring-4 ring-slate-600/20" />
                          <span className="text-xs font-bold text-white tracking-wide">Phòng Lab Trực Tuyến</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                          Phòng Lab 24/7
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-900/50 via-blue-900/40 to-slate-800 border border-indigo-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                            <FlaskConical className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white">Chưa có phiên Live trực tiếp</p>
                            <p className="text-[11px] text-slate-400 truncate">Vào sảnh Lab để mở phòng hoặc xem video</p>
                          </div>
                        </div>

                        <Link
                          href="/labs"
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-all flex items-center gap-1 shrink-0"
                        >
                          <span>Vào sảnh Lab</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="mt-3 bg-slate-950/60 rounded-xl p-2 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                        <span className="text-indigo-400 font-mono text-xs">●</span>
                        <span className="truncate">Sảnh Lab hỗ trợ tạo phòng 100ms Live Call hoặc xem lại video bài giảng lưu trữ.</span>
                      </div>
                    </div>
                  )}

                  {/* Interactive Widget 2: AI LaTeX Copilot Live Solver */}
                  <div className="flex-1 bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-indigo-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-xl hover:border-cyan-400/50 transition-all">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-400 text-sm font-serif font-bold">∑</span>
                        <span className="text-xs font-bold text-slate-200">AI LaTeX Copilot</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          Real-time Solver
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormulaIndex((prev) => (prev + 1) % MATH_COPILOT_FORMULAS.length)}
                          className="p-1 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                          title="Đổi công thức tiếp theo"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2.5 bg-slate-950/90 rounded-xl p-2.5 border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1.5 shadow-inner">
                      <div className="text-slate-400 text-[10px] flex items-center justify-between">
                        <span>{MATH_COPILOT_FORMULAS[formulaIndex].title}</span>
                        <span className="text-[9px] text-slate-500 font-sans">
                          {formulaIndex + 1}/{MATH_COPILOT_FORMULAS.length}
                        </span>
                      </div>

                      {/* Mathematical Equation rendered via KaTeX typography */}
                      <div
                        className="py-2 px-3 bg-gradient-to-r from-slate-950/90 via-indigo-950/40 to-slate-950/90 rounded-xl border border-indigo-500/30 overflow-x-auto text-white flex items-center justify-center min-h-[50px] select-none text-base sm:text-lg [&_.katex]:text-white [&_.katex-display]:my-0 shadow-inner"
                        dangerouslySetInnerHTML={{
                          __html: katex.renderToString(MATH_COPILOT_FORMULAS[formulaIndex].latex, {
                            displayMode: true,
                            throwOnError: false,
                          }),
                        }}
                      />

                      <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 pt-0.5">
                        <span>{MATH_COPILOT_FORMULAS[formulaIndex].step}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        Độ chính xác: <strong className="text-emerald-400 font-semibold">99.8%</strong>
                      </span>
                      <Link
                        href={`/ai-tutor?q=${MATH_COPILOT_FORMULAS[formulaIndex].query}`}
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
                    <h2 className="text-2xl font-black text-slate-800">
                      {gamification ? gamification.studyHoursThisWeek : 14.5} giờ
                    </h2>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      ↑ {gamification ? gamification.studyGrowthPercent : 24}%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                  ⏱️
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-end justify-between gap-1">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>T2-CN:</span>
                </div>
                <div className="flex items-end gap-1.5 h-6">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => {
                    const h = gamification?.dailyStudyHoursOfWeek?.[idx] ?? [2, 2.5, 1.5, 3.2, 4, 0, 0][idx];
                    const heightClass =
                      h > 3 ? 'h-6 bg-blue-600' : h > 2 ? 'h-5 bg-blue-500' : h > 1 ? 'h-4 bg-blue-300' : h > 0 ? 'h-3 bg-blue-200' : 'h-2 bg-slate-100';
                    return <span key={day} className={`w-1.5 rounded-t ${heightClass}`} title={`${day}: ${h}h`} />;
                  })}
                </div>
                <span className="text-[11px] font-semibold text-blue-600">
                  Mục tiêu: {gamification ? gamification.studyTargetHours : 18}h
                </span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Nhiệm vụ hôm nay</span>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-black text-slate-800">
                      {gamification ? gamification.dailyMissionsCompleted : 2}
                      <span className="text-slate-400 text-lg font-normal">
                        /{gamification ? gamification.dailyMissionsTotal : 3} xong
                      </span>
                    </h2>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {gamification ? gamification.dailyCompletionPercent : 66}%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                  🎯
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 truncate max-w-[130px]">
                  {gamification?.nextMissionTitle || 'Giải 1 bài quiz toán'}
                </span>
                <button
                  onClick={handleClaimReward}
                  disabled={rewardClaimed || claiming}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition shadow-2xs ${
                    rewardClaimed
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  }`}
                >
                  {claiming ? 'Đang nhận...' : rewardClaimed ? '✓ Đã nhận' : 'Nhận +50 XP'}
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
                      <span className="flame-anim">🔥</span> {gamification ? gamification.currentStreak : 12}
                    </h2>
                    <span className="text-xs font-semibold text-slate-600">ngày liền</span>
                  </div>
                </div>
                <Link
                  href="/leaderboard"
                  className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl shadow-2xs hover:scale-105 transition"
                  title="Xem Bảng Vàng Vinh Danh"
                >
                  🏆
                </Link>
              </div>
              <div className="mt-3 pt-2 border-t border-orange-100/80 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => {
                    const studied = gamification?.weeklyStreakStatus?.[idx] ?? idx < 5;
                    return (
                      <span
                        key={day}
                        title={`${day}: ${studied ? 'Đã học' : 'Chưa học'}`}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          studied ? 'bg-orange-500 shadow-2xs' : 'bg-orange-200/50'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[11px] font-semibold text-orange-700">
                  {gamification?.hasStudiedToday ? 'Đã giữ chuỗi hôm nay ✓' : 'Giữ chuỗi hôm nay'}
                </span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Điểm năng động XP</span>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-black text-violet-700">
                      {gamification ? gamification.totalXp.toLocaleString() : '1,450'}
                    </h2>
                    <Link
                      href="/leaderboard"
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-2xs hover:opacity-90 transition flex items-center gap-0.5"
                    >
                      <span>Cyber Rank #{gamification ? gamification.monthlyRank : 12}</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
                <Link
                  href="/leaderboard"
                  className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-lg hover:scale-105 transition"
                  title="Xem Bảng Xếp Hạng Tháng"
                >
                  ⚡
                </Link>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Hạng: <strong className="text-violet-700 font-semibold">{gamification?.rankTierName || 'Bạch Kim III'}</strong>
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  +{gamification ? gamification.todayXp : 120} XP hôm nay
                </span>
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
              {/* Cyber Card 1: Học bài tiếp */}
              {isLoadingResume ? (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col justify-between animate-pulse min-h-[340px]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-slate-200 rounded w-28" />
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="h-10 bg-slate-100 rounded w-full" />
                    <div className="h-14 bg-slate-50 rounded-2xl p-3 border border-slate-100" />
                  </div>
                  <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <div className="h-8 bg-slate-200 rounded-xl w-36" />
                    <div className="h-4 bg-slate-200 rounded w-20" />
                  </div>
                </div>
              ) : (
                <div className="group relative bg-white rounded-3xl p-6 border-2 border-blue-500/40 shadow-md hover:shadow-xl hover:border-blue-600 transition-all flex flex-col justify-between">
                  <div className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs">
                    {activeResumeCourse?.isEnrolled
                      ? `Đang học • ${activeResumeCourse.courseProgressPercent}%`
                      : 'Gợi ý học tập • 0%'}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          Môn: {activeResumeCourse?.subjectName || 'Khóa học'}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          {activeResumeCourse?.gradeLevel || 'Toàn diện'}
                        </span>
                      </div>
                      {allResumeCourses.length > 1 && (
                        <div className="flex items-center gap-1">
                          {allResumeCourses.map((c, idx) => (
                            <button
                              key={c.courseId}
                              onClick={() => setSelectedCourseIndex(idx)}
                              className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition ${
                                selectedCourseIndex === idx
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title={c.courseTitle}
                            >
                              Môn #{idx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {activeResumeCourse?.courseTitle || 'Chưa có khóa học đang học dở'}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {activeResumeCourse?.courseDescription ||
                          'Hệ thống bài giảng phân cấp đa tầng từ nền tảng đến ứng dụng, tích hợp trợ lý AI giải thích trực tiếp theo thời gian thực.'}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[200px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          <span className="truncate">
                            Chương {activeResumeCourse?.chapterDisplayOrder || 1}: {activeResumeCourse?.chapterTitle || 'Chương 1'}
                          </span>
                        </span>
                        <span className="text-blue-600 font-bold shrink-0">
                          Bài {activeResumeCourse?.lessonDisplayOrder || 1}/{activeResumeCourse?.totalLessonsInChapter || 1}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, activeResumeCourse?.courseProgressPercent || 0))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                    <Link
                      href={
                        activeResumeCourse
                          ? activeResumeCourse.lessonId
                            ? `/courses/${activeResumeCourse.courseId}/lessons/${activeResumeCourse.lessonId}`
                            : `/courses/${activeResumeCourse.courseId}`
                          : '/courses'
                      }
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition flex items-center gap-1.5 min-w-0 max-w-[210px]"
                    >
                      <span className="truncate">
                        {activeResumeCourse
                          ? `Học tiếp: ${activeResumeCourse.lessonTitle || `Bài ${activeResumeCourse.lessonDisplayOrder || 1}`}`
                          : 'Khám phá khóa học'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </Link>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {activeResumeCourse
                        ? `Xong ${activeResumeCourse.completedLessons}/${activeResumeCourse.totalLessons} bài`
                        : 'Tất cả khóa'}
                    </span>
                  </div>
                </div>
              )}

              {/* Cyber Card 2: Luyện đề tiếp */}
              {isLoadingResume ? (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col justify-between animate-pulse min-h-[340px]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-slate-200 rounded w-28" />
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="h-10 bg-slate-100 rounded w-full" />
                    <div className="h-14 bg-slate-50 rounded-2xl p-3 border border-slate-100" />
                  </div>
                  <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <div className="h-8 bg-slate-200 rounded-xl w-36" />
                    <div className="h-4 bg-slate-200 rounded w-20" />
                  </div>
                </div>
              ) : (
                <div className="group relative bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-xl hover:border-emerald-400 transition-all flex flex-col justify-between">
                  <div
                    className={`absolute -top-3 right-6 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs ${
                      activeResumeExam?.attemptStatus === 'IN_PROGRESS'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : activeResumeExam?.attemptStatus === 'SUBMITTED'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                        : 'bg-gradient-to-r from-indigo-500 to-blue-600'
                    }`}
                  >
                    {activeResumeExam?.attemptStatus === 'IN_PROGRESS'
                      ? `Đang làm dở • ${activeResumeExam.scorePercentage}%`
                      : activeResumeExam?.attemptStatus === 'SUBMITTED'
                      ? `Đã xong • ${activeResumeExam.scorePercentage}% điểm`
                      : 'Đề luyện thi • Mới'}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                          Môn: {activeResumeExam?.subjectName || activeResumeExam?.courseName || 'Đề Thi Chuẩn Hóa'}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {activeResumeExam ? `${activeResumeExam.questionCount} Câu Hỏi` : 'Đề thi'}
                        </span>
                      </div>
                      {allResumeExams.length > 1 && (
                        <div className="flex items-center gap-1">
                          {allResumeExams.map((e, idx) => (
                            <button
                              key={e.examId}
                              onClick={() => setSelectedExamIndex(idx)}
                              className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition ${
                                selectedExamIndex === idx
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title={e.examTitle}
                            >
                              Đề #{idx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {activeResumeExam?.examTitle || 'Ngân Hàng Đề Thi Chuẩn Hóa & ĐGNL'}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {activeResumeExam?.examDescription ||
                          'Hệ thống ngân hàng đề thi chuẩn hóa tích hợp đồng hồ áp lực, gợi ý chống gian lận và AI phân tích lỗ hổng kiến thức sau nộp bài.'}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[200px]">
                          {activeResumeExam?.attemptStatus === 'IN_PROGRESS' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                              <span className="truncate">
                                Đang làm: Câu {activeResumeExam.currentQuestionIndex}/{activeResumeExam.questionCount}
                              </span>
                            </>
                          ) : activeResumeExam?.attemptStatus === 'SUBMITTED' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate">
                                Điểm: {activeResumeExam.totalScore != null ? `${activeResumeExam.totalScore}/${activeResumeExam.totalMarks || 10}` : `${activeResumeExam.scorePercentage}%`}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span className="truncate">
                                Chưa bắt đầu • {activeResumeExam?.durationMinutes || 60} phút
                              </span>
                            </>
                          )}
                        </span>
                        <span
                          className={`font-bold shrink-0 ${
                            activeResumeExam?.attemptStatus === 'IN_PROGRESS'
                              ? 'text-amber-600'
                              : activeResumeExam?.attemptStatus === 'SUBMITTED'
                              ? 'text-emerald-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {activeResumeExam?.scorePercentage || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            activeResumeExam?.attemptStatus === 'IN_PROGRESS'
                              ? 'bg-amber-500'
                              : activeResumeExam?.attemptStatus === 'SUBMITTED'
                              ? 'bg-emerald-500'
                              : 'bg-blue-600'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, activeResumeExam?.scorePercentage || 0))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                    <Link
                      href={
                        activeResumeExam
                          ? `/courses/${activeResumeExam.courseId || 'general'}/exams/${activeResumeExam.examId}`
                          : '/courses'
                      }
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow transition flex items-center gap-1.5 min-w-0 max-w-[210px]"
                    >
                      <span className="truncate">
                        {activeResumeExam?.attemptStatus === 'IN_PROGRESS'
                          ? `Làm tiếp Câu ${activeResumeExam.currentQuestionIndex}`
                          : activeResumeExam?.attemptStatus === 'SUBMITTED'
                          ? `Luyện lại: ${activeResumeExam.examTitle}`
                          : activeResumeExam
                          ? `Luyện tiếp: ${activeResumeExam.examTitle}`
                          : 'Khám phá ngân hàng đề'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </Link>
                    <span className="text-[11px] text-emerald-600 font-semibold shrink-0">
                      {activeResumeExam?.attemptStatus === 'SUBMITTED'
                        ? activeResumeExam.passed
                          ? '✓ Đạt chuẩn'
                          : 'Cần cải thiện'
                        : activeResumeExam?.attemptStatus === 'IN_PROGRESS'
                        ? `Đã làm ${activeResumeExam.answeredQuestionsCount}/${activeResumeExam.questionCount}`
                        : `${activeResumeExam?.durationMinutes || 60} phút`}
                    </span>
                  </div>
                </div>
              )}

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

            {isLoadingWeekly && weeklyEvents.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 animate-pulse">
                    <div className="p-2 rounded-xl bg-slate-200 shrink-0 w-12 h-14" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                      <div className="h-4 bg-slate-200 rounded w-full" />
                      <div className="h-3 bg-slate-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : weeklyEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {weeklyEvents.map((evt) => {
                  const todayDay = new Date().getDate();
                  const isToday = evt.dayOfMonth === todayDay;

                  return (
                    <Link
                      key={evt.id}
                      href={evt.targetUrl || '/labs'}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 group ${
                        evt.isLiveNow
                          ? 'bg-red-50/40 border-red-200 hover:bg-red-50 hover:border-red-300 shadow-xs'
                          : isToday
                          ? 'bg-blue-50/30 border-blue-200 hover:bg-blue-50/60 hover:border-blue-300'
                          : 'bg-slate-50 border-slate-100 hover:bg-blue-50/50 hover:border-blue-200'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl text-center shrink-0 w-12 border transition-colors ${
                          evt.isLiveNow
                            ? 'bg-white border-red-200 shadow-xs'
                            : isToday
                            ? 'bg-white border-blue-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <span
                          className={`block text-[10px] font-bold uppercase ${
                            evt.isLiveNow
                              ? 'text-red-600'
                              : isToday
                              ? 'text-blue-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {evt.dayOfWeekText}
                        </span>
                        <span
                          className={`block text-base font-extrabold ${
                            evt.isLiveNow
                              ? 'text-red-600'
                              : isToday
                              ? 'text-blue-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {evt.dayOfMonth}
                        </span>
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border ${
                              evt.isLiveNow
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : evt.badgeColor === 'emerald'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : evt.badgeColor === 'blue'
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : evt.badgeColor === 'purple'
                                ? 'bg-purple-100 text-purple-700 border-purple-200'
                                : evt.badgeColor === 'amber'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {evt.isLiveNow && (
                              <span className="relative flex h-1.5 w-1.5 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                              </span>
                            )}
                            {evt.timeRange}
                          </span>
                          {isToday && !evt.isLiveNow && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">
                              Hôm nay
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {evt.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {evt.subtitle || 'NQD-LMS Trực Tuyến'}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa có sự kiện hoặc lịch học trực tiếp nào được lên lịch trong tuần này.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
