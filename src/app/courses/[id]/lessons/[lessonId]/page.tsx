'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { courseService } from '@/services/course.service';
import { resourceService } from '@/services/resource.service';
import {
  StudentCourseDetailResponse,
  StudentLessonDetailResponse,
  StudentLessonSummaryResponse,
} from '@/types/course';
import {
  LessonResourceResponse,
  StudentCourseProgressResponse,
  StudentLessonProgressResponse,
  ResourceType,
} from '@/types/resource';
import {
  BookOpen,
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  PlayCircle,
  CheckCircle2,
  Menu,
  X,
  FileText,
  Video,
  Link as LinkIcon,
  File,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Sparkles,
  Trophy,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { LessonDiscussionDrawer } from '@/components/discussion/LessonDiscussionDrawer';
import { exerciseService } from '@/services/exercise.service';
import { StudentExerciseSummaryResponse } from '@/types/exercise';
import { Dumbbell, Play } from 'lucide-react';
import { LessonVideoPlayer } from '@/components/LessonVideoPlayer';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';

function getEmbedVideoInfo(rawUrl?: string | null): { type: 'youtube' | 'vimeo' | 'direct' | 'unknown'; embedUrl: string } | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  const url = rawUrl.trim();

  // YouTube match: regular watch, short youtu.be, embed, shorts
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
    };
  }

  // Vimeo match
  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}`,
    };
  }

  // Direct video
  if (/\.(mp4|webm|ogg)($|\?)/i.test(url)) {
    return {
      type: 'direct',
      embedUrl: url,
    };
  }

  return {
    type: 'unknown',
    embedUrl: url,
  };
}

export default function LessonReaderPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;

  const [activeTab, setActiveTab] = useState<'content' | 'video' | 'exercises'>('content');
  const [lesson, setLesson] = useState<StudentLessonDetailResponse | null>(null);
  const [course, setCourse] = useState<StudentCourseDetailResponse | null>(null);
  const [resources, setResources] = useState<LessonResourceResponse[]>([]);
  const [exercises, setExercises] = useState<StudentExerciseSummaryResponse[]>([]);
  const [progress, setProgress] = useState<StudentLessonProgressResponse | null>(null);
  const [courseProgress, setCourseProgress] = useState<StudentCourseProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [qaDrawerOpen, setQaDrawerOpen] = useState<boolean>(false);
  const [targetThreadId, setTargetThreadId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const threadIdParam = urlParams.get('threadId');
      if (threadIdParam) {
        setTargetThreadId(threadIdParam);
        setQaDrawerOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    if (courseId && lessonId) {
      loadLessonAndCourse();
    }
  }, [courseId, lessonId]);

  const loadLessonAndCourse = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [lessonData, courseData, resourceData, progressData, courseProgData, exerciseData] = await Promise.all([
        courseService.getPublishedLesson(lessonId),
        courseService.getStudentCourseStructure(courseId),
        resourceService.getStudentLessonResources(lessonId).catch(() => []),
        resourceService.getStudentLessonProgress(lessonId).catch(() => null),
        resourceService.getStudentCourseProgress(courseId).catch(() => null),
        exerciseService.getStudentExercisesByLesson(lessonId).catch(() => []),
      ]);
      setLesson(lessonData);
      setCourse(courseData);
      setResources(resourceData);
      setProgress(progressData);
      setCourseProgress(courseProgData);
      setExercises(exerciseData || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải nội dung bài học';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!lesson) return;
    setIsUpdatingProgress(true);
    try {
      const isCurrentlyCompleted = progress?.status === 'COMPLETED';
      const newCompleted = !isCurrentlyCompleted;
      const updated = await resourceService.updateStudentLessonProgress(lesson.id, {
        progressPercent: newCompleted ? 100 : 0,
        completed: newCompleted,
      });
      setProgress(updated);
      // Reload course progress to refresh sidebar percentages
      const refreshedCourseProg = await resourceService.getStudentCourseProgress(courseId).catch(() => null);
      setCourseProgress(refreshedCourseProg);
    } catch {
      // ignore
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleMarkVideoWatched = async () => {
    if (!lesson) return;
    try {
      const updated = await resourceService.updateStudentLessonProgress(lesson.id, {
        videoWatched: true,
      });
      setProgress(updated);
    } catch {
      // ignore
    }
  };

  // Find next and previous lesson
  const allLessons: StudentLessonSummaryResponse[] = course
    ? course.chapters.flatMap((ch) => ch.lessons)
    : [];
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCompleted = progress?.status === 'COMPLETED';

  const effectiveVideoUrl = lesson?.videoUrl || resources.find((r) => r.resourceType === 'VIDEO')?.url || null;
  const embedInfo = getEmbedVideoInfo(effectiveVideoUrl);

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-4 h-4 text-rose-600" />;
      case 'VIDEO':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'LINK':
        return <LinkIcon className="w-4 h-4 text-purple-600" />;
      case 'IMAGE':
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      default:
        return <File className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="min-h-full flex-1 flex flex-col bg-white font-sans">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3 truncate">
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quay lại khóa học</span>
          </Link>
          <span className="text-slate-300">|</span>
          <div className="truncate">
            <span className="text-xs font-bold text-slate-900 truncate">
              {course?.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Q&A Drawer Toggle Button */}
          <button
            onClick={() => setQaDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#83C75D]/15 text-slate-700 hover:text-[#4e8231] text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            title="Mở bảng hỏi đáp bài học"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#83C75D]" />
            <span className="hidden md:inline">Hỏi đáp bài học</span>
          </button>

          {/* Complete Lesson Toggle Button */}
          <button
            onClick={handleToggleComplete}
            disabled={isUpdatingProgress}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-slate-400'}`} />
            <span>{isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</span>
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Đóng/mở danh mục bài học"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-white">
        {/* Lesson Content Area - Seamless Full-Bleed Canvas */}
        <main className="flex-1 overflow-y-auto w-full min-w-0 bg-white flex flex-col justify-between">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
              <div className="w-10 h-10 border-4 border-[#83C75D]/30 border-t-[#83C75D] rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-500">Đang tải nội dung bài học...</p>
            </div>
          ) : errorMessage ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-4 my-auto">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900">Bài học đang bị khóa</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/courses/${courseId}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold rounded-xl transition shadow-md shadow-[#83C75D]/20"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay về mục lục khóa học</span>
                </Link>
              </div>
            </div>
          ) : lesson ? (
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8 flex-1">
              {/* Seamless Integrated Document Header (No Border Box) */}
              <div className="space-y-5 pb-6 border-b border-slate-100">
                {/* Meta row: Order, Time, Status & AI Tutor */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="px-3 py-1 rounded-full font-black tracking-wide bg-[#83C75D]/15 text-[#4e8231] uppercase">
                      Bài {lesson.displayOrder}
                    </span>
                    {lesson.estimatedMinutes && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lesson.estimatedMinutes} phút học</span>
                      </span>
                    )}
                    {isCompleted && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã học xong</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(
                          new CustomEvent('open-ai-tutor', {
                            detail: {
                              mode: 'EXPLAIN_LESSON',
                              lessonId: lesson.id,
                              courseId: courseId,
                              initialQuestion: `Hãy tóm tắt và giải thích các điểm trọng tâm của bài học "${lesson.title}" giúp mình với!`,
                            },
                          })
                        );
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                    title="Nhờ AI Tutor giải thích bài học này"
                  >
                    <span>🤖</span>
                    <span>AI Tutor Giảng Bài</span>
                  </button>
                </div>

                {/* Lesson Main Heading */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {lesson.title}
                </h1>

                {/* Elegant Summary Callout */}
                {lesson.summary && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/40 border-l-4 border-[#83C75D] text-slate-700 text-sm leading-relaxed space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4e8231] block">
                      Mục tiêu & Tóm tắt bài học
                    </span>
                    <p className="font-medium text-slate-700">{lesson.summary}</p>
                  </div>
                )}

                {/* Modern Underline Tab Bar */}
                <div className="flex items-center gap-6 sm:gap-8 pt-3 border-b border-slate-200 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('content')}
                    className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 -mb-[2px] shrink-0 ${
                      activeTab === 'content'
                        ? 'border-[#83C75D] text-[#4e8231]'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Nội dung</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('video')}
                    className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 -mb-[2px] shrink-0 ${
                      activeTab === 'video'
                        ? 'border-[#83C75D] text-[#4e8231]'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Video bài giảng</span>
                    {effectiveVideoUrl && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('exercises')}
                    className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 -mb-[2px] shrink-0 ${
                      activeTab === 'exercises'
                        ? 'border-[#83C75D] text-[#4e8231]'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                    <span>Bài tập củng cố</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                      {exercises.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Nội dung (Seamless Prose, No Outer Card Border) */}
              {activeTab === 'content' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="min-h-[300px]">
                    {lesson.content ? (
                      <MathMarkdownRenderer content={lesson.content} />
                    ) : (
                      <div className="py-16 text-center text-slate-400">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm font-medium">Bài học này chưa có nội dung văn bản chi tiết.</p>
                      </div>
                    )}
                  </div>

                  {/* Lesson Attached Resources */}
                  {resources.length > 0 && (
                    <div className="pt-8 border-t border-slate-200 space-y-4">
                      <div className="flex items-center justify-between pb-2">
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#83C75D]" />
                          <span>Tài liệu & Học liệu đính kèm ({resources.length})</span>
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">Tài liệu tham khảo chính thức</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {resources.map((res) => (
                          <a
                            key={res.id}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300 transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                {getResourceIcon(res.resourceType)}
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                  {res.title}
                                </p>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {res.resourceType}
                                </span>
                              </div>
                            </div>

                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Video (Seamless Full Canvas) */}
              {activeTab === 'video' && (
                <div className="space-y-6 animate-in fade-in">
                  {effectiveVideoUrl ? (
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-black">
                      <LessonVideoPlayer
                        videoUrl={effectiveVideoUrl}
                        lessonTitle={lesson.title}
                        videoWatched={Boolean(progress?.videoWatched)}
                        onVideoComplete={handleMarkVideoWatched}
                      />
                    </div>
                  ) : (
                    <div className="py-20 text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 text-blue-600 flex items-center justify-center mx-auto">
                        <Video className="w-8 h-8 text-slate-300" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900">Bài học này chưa có video bài giảng</h4>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        Giảng viên chưa cập nhật đường dẫn video cho bài học này. Bạn có thể xem lý thuyết ở tab &quot;Nội dung&quot; hoặc làm câu hỏi ở tab &quot;Bài tập củng cố&quot;.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Bài tập (Clean Borderless Cards) */}
              {activeTab === 'exercises' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-indigo-600" />
                      <span>Danh sách bài tập củng cố ({exercises.length})</span>
                    </h3>
                    <span className="text-[11px] text-amber-700 font-bold bg-amber-50 border border-amber-200/60 px-3 py-1 rounded-full">
                      Yêu cầu đúng 100% để mở khóa bài tiếp
                    </span>
                  </div>

                  {exercises.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                {ex.type}
                              </span>
                              {ex.userAttemptsCount > 0 ? (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    ex.userPassed
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {ex.userPassed ? 'Đã đạt 100%' : 'Chưa đạt'} ({ex.userBestScore || 0}/{ex.totalMarks || 0} điểm)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  Chưa làm
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{ex.title}</h4>
                            {ex.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{ex.description}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                            <span>{ex.questionCount || 0} câu hỏi</span>
                            <Link
                              href={`/courses/${courseId}/exercises/${ex.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>{ex.userAttemptsCount > 0 ? 'Luyện lại' : 'Luyện tập ngay'}</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                        <Dumbbell className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900">Chưa có bài tập cho bài học này</h4>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                        Bài học này không có bài tập bắt buộc. Bạn có thể xem lý thuyết và bấm &quot;Đánh dấu hoàn thành&quot; để tiếp tục lộ trình học.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Lesson Navigation */}
              <div className="flex items-center justify-between gap-4 pt-8 mt-12 pb-16 border-t border-slate-200">
                {prevLesson ? (
                  <Link
                    href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs hover:shadow-xs transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <div className="text-left hidden sm:block">
                      <p className="text-[10px] text-slate-400 font-semibold">Bài trước</p>
                      <p className="truncate max-w-[160px]">{prevLesson.title}</p>
                    </div>
                  </Link>
                ) : (
                  <div />
                )}

                {nextLesson ? (
                  (nextLesson.isLocked && !nextLesson.isCompleted) ? (
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed"
                      title={nextLesson.lockReason || 'Bài tiếp theo đang bị khóa'}
                    >
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-end gap-1">
                          <Lock className="w-3 h-3" /> Bài tiếp theo (Đang khóa)
                        </p>
                        <p className="truncate max-w-[160px] text-slate-500">{nextLesson.title}</p>
                      </div>
                      <Lock className="w-4 h-4 text-slate-400 sm:hidden" />
                    </div>
                  ) : (
                    <Link
                      href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-md shadow-[#83C75D]/20 transition-all"
                    >
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-emerald-100 font-semibold">Bài tiếp theo</p>
                        <p className="truncate max-w-[160px]">{nextLesson.title}</p>
                      </div>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )
                ) : (
                  <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    <span>Bạn đã học đến bài cuối cùng!</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>

        {/* Right Sticky Syllabus & Progress Sidebar */}
        {sidebarOpen && course && (
          <aside className="w-80 border-l border-slate-200 bg-white overflow-y-auto hidden md:flex flex-col shrink-0 h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div>
                <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Nội dung khóa học
                </h2>
                <p className="text-[11px] text-slate-500 line-clamp-1">{course.name}</p>
              </div>

              {/* Course Progress Indicator (Phase 5) */}
              {courseProgress && (
                <div className="bg-white p-3 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#83C75D]" />
                      <span>Tiến độ học</span>
                    </span>
                    <span className="font-black text-emerald-600">
                      {courseProgress.overallProgressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#83C75D] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${courseProgress.overallProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Đã hoàn thành {courseProgress.completedLessons}/{courseProgress.totalLessons} bài học
                  </p>
                </div>
              )}
            </div>

            <div className="flex-1 divide-y divide-slate-100">
              {course.chapters.map((chapter) => (
                <div key={chapter.id} className="p-3">
                  <h3 className="text-xs font-bold text-slate-900 mb-2 px-1">
                    {chapter.title}
                  </h3>
                  <div className="space-y-1">
                    {chapter.lessons.map((l) => {
                      const isActive = l.id === lessonId;
                      const isLocked = l.isLocked && !l.isCompleted;

                      if (isLocked) {
                        return (
                          <div
                            key={l.id}
                            title={l.lockReason || 'Bài học đang bị khóa'}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 bg-slate-50/70 cursor-not-allowed"
                          >
                            <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate flex-1">{l.title}</span>
                            {l.estimatedMinutes && (
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {l.estimatedMinutes}m
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={l.id}
                          href={`/courses/${courseId}/lessons/${l.id}`}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-[#83C75D]/15 text-[#4e8231] font-bold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          {l.isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          ) : (
                            <PlayCircle
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-[#83C75D]' : 'text-slate-400'
                              }`}
                            />
                          )}
                          <span className="truncate flex-1">{l.title}</span>
                          {l.estimatedMinutes && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {l.estimatedMinutes}m
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* In-Lesson Q&A Discussion Drawer */}
      <LessonDiscussionDrawer
        isOpen={qaDrawerOpen}
        onClose={() => setQaDrawerOpen(false)}
        courseId={courseId}
        lessonId={lessonId}
        lessonTitle={lesson?.title || ''}
        initialThreadId={targetThreadId}
      />
    </div>
  );
}
