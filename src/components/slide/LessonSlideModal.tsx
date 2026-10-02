'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Presentation,
  Download,
  Sparkles,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Loader2,
  FileText,
  Lightbulb,
  CheckCircle2,
  BookOpen,
  Info,
  Layers,
  Crown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { LessonSlideResponse, SlideItem, SlideTargetType } from '@/types/slide';
import { slideService } from '@/services/slide.service';

interface LessonSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: SlideTargetType;
  targetId: string;
  lessonTitle: string;
  canManage?: boolean;
}

export default function LessonSlideModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  lessonTitle,
  canManage = false,
}: LessonSlideModalProps) {
  const [slide, setSlide] = useState<LessonSlideResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // AI Generation configuration
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateStep, setGenerateStep] = useState<string>('');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [slideCount, setSlideCount] = useState<number>(8);
  const [slideStyle, setSlideStyle] = useState<string>('STANDARD');

  // File upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const fetchSlide = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await slideService.getSlide(targetType, targetId);
      setSlide(data);
      setCurrentIndex(0);
    } catch {
      // If slide not found, keep null
      setSlide(null);
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    if (isOpen) {
      fetchSlide();
      setShowConfig(false);
      setIsFullscreen(false);
    }
  }, [isOpen, fetchSlide]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (slide && slide.slides && currentIndex < slide.slides.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    },
    [isOpen, slide, currentIndex, isFullscreen, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleGenerateAi = async () => {
    setIsGenerating(true);
    setGenerateStep('Đang phân tích nội dung bài học...');
    setShowConfig(false);

    const stepTimer1 = setTimeout(() => {
      setGenerateStep('Gemini AI đang thiết kế cấu trúc bài giảng...');
    }, 1500);

    const stepTimer2 = setTimeout(() => {
      setGenerateStep('Đang tạo các trang slide và tối ưu hóa sư phạm...');
    }, 3200);

    try {
      const result = await slideService.generateSlideWithAi({
        targetType,
        targetId,
        slideCount,
        style: slideStyle,
        language: 'vi',
      });
      setSlide(result);
      setCurrentIndex(0);
      notify('success', 'Đã tạo Slide bài học bằng AI thành công!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo slide bằng AI thất bại';
      notify('error', msg);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsGenerating(false);
      setGenerateStep('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pptx', 'ppt', 'pdf'].includes(ext || '')) {
      notify('error', 'Vui lòng chọn file định dạng .pptx, .ppt hoặc .pdf');
      return;
    }

    setIsUploading(true);
    try {
      const result = await slideService.uploadSlideFile(targetType, targetId, file);
      setSlide(result);
      setCurrentIndex(0);
      notify('success', 'Đã tải file slide lên thành công!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải file slide thất bại';
      notify('error', msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteSlide = async () => {
    if (!slide?.id) return;
    if (!confirm('Bạn có chắc chắn muốn xóa bản slide này để tải lên hoặc tạo mới?')) {
      return;
    }
    try {
      await slideService.deleteSlide(slide.id);
      notify('success', 'Đã xóa slide bài học');
      fetchSlide();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa slide thất bại';
      notify('error', msg);
    }
  };

  const handleDownload = () => {
    if (!slide) return;
    if (slide.slideSource === 'MANUAL_UPLOAD' && slide.slideUrl) {
      const fullUrl = slideService.getFileUrl(slide.slideUrl);
      window.open(fullUrl, '_blank');
    } else {
      const downloadUrl = slideService.getDownloadUrl(targetType, targetId);
      window.open(downloadUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  const currentSlide: SlideItem | undefined = slide?.slides?.[currentIndex];
  const totalSlides = slide?.slides?.length || 0;
  const isManageable = canManage || slide?.canManage;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md transition-all ${
        isFullscreen ? '!p-0' : ''
      }`}
    >
      <div
        className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full rounded-none border-none'
            : 'w-full max-w-5xl max-h-[92vh] h-auto'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Presentation className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Slide bài giảng
                </span>
                {slide && slide.slideCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {slide.slideSource === 'AI_GENERATED' ? '✨ Tạo bằng AI' : '📁 Tải lên'}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate max-w-md sm:max-w-xl">
                {slide?.title || lessonTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalSlides > 0 && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Notification */}
        {notification && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between transition-all shrink-0 animate-in fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white cursor-pointer ml-3"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-center items-center bg-slate-950/60">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-xs font-semibold">Đang nạp thông tin bài giảng...</p>
            </div>
          ) : isGenerating ? (
            <div className="py-16 sm:py-24 max-w-md w-full mx-auto text-center space-y-5">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
                  <Sparkles className="w-10 h-10 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">AI đang biên soạn Slide bài học</h3>
                <p className="text-xs text-indigo-300 font-medium animate-pulse">{generateStep}</p>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-[#83C75D] animate-[pulse_1s_infinite] w-full" />
              </div>
              <p className="text-[11px] text-slate-500">
                Quá trình này mất khoảng 5 - 10 giây. Hệ thống đang tự động trích xuất các ý trọng tâm và định dạng PowerPoint.
              </p>
            </div>
          ) : totalSlides > 0 && currentSlide ? (
            /* SLIDE PLAYER (16:9 INTERACTIVE VIEWER) */
            <div className="w-full max-w-4xl flex flex-col items-center space-y-4">
              {/* 16:9 Screen Frame */}
              <div
                className={`w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl relative select-none flex flex-col justify-between border border-slate-800 transition-all ${
                  currentSlide.layout === 'TITLE' || currentSlide.layout === 'SUMMARY'
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white'
                    : 'bg-white text-slate-900'
                }`}
              >
                {/* Top Brand Accent Bar */}
                <div className="h-2 w-full bg-gradient-to-r from-[#83C75D] via-emerald-400 to-indigo-500 shrink-0" />

                {/* Left & Right Slide Flip Hover Overlays */}
                {currentIndex > 0 && (
                  <button
                    onClick={() => setCurrentIndex((prev) => prev - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition opacity-0 hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                    title="Trang trước (Mũi tên trái)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                {currentIndex < totalSlides - 1 && (
                  <button
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition opacity-0 hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                    title="Trang tiếp theo (Mũi tên phải)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}

                {/* Slide Main Body Content */}
                <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center overflow-hidden">
                  {currentSlide.layout === 'TITLE' || currentSlide.layout === 'SUMMARY' ? (
                    /* COVER OR SUMMARY SLIDE */
                    <div className="space-y-4 text-center sm:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>NQD-LMS • Smart Courseware</span>
                      </div>
                      <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                        {currentSlide.title}
                      </h1>
                      {currentSlide.subtitle && (
                        <p className="text-xs sm:text-base text-[#83C75D] font-bold">
                          {currentSlide.subtitle}
                        </p>
                      )}

                      {currentSlide.bulletPoints && currentSlide.bulletPoints.length > 0 && (
                        <div className="pt-3 grid grid-cols-1 gap-2 max-w-2xl">
                          {currentSlide.bulletPoints.map((bp, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-[#83C75D] shrink-0 mt-0.5" />
                              <span>{bp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* REGULAR CONTENT / FORMULA / SPLIT SLIDE */
                    <div className="flex flex-col justify-between h-full space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                              {currentSlide.title}
                            </h3>
                            {currentSlide.subtitle && (
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {currentSlide.subtitle}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                            #{currentSlide.slideNumber}
                          </span>
                        </div>

                        {/* Bullet points */}
                        {currentSlide.bulletPoints && currentSlide.bulletPoints.length > 0 && (
                          <div className="pt-4 space-y-2.5">
                            {currentSlide.bulletPoints.map((bp, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                                  {bp}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Formula or Callout */}
                      {(currentSlide.formula || currentSlide.callout) && (
                        <div className="space-y-2 pt-2">
                          {currentSlide.formula && (
                            <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs sm:text-sm border border-slate-800 shadow-inner flex items-center gap-2 overflow-x-auto">
                              <span className="text-slate-500 select-none">∑</span>
                              <code>{currentSlide.formula}</code>
                            </div>
                          )}
                          {currentSlide.callout && (
                            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold">{currentSlide.callout}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Slide Info & Pagination */}
                <div
                  className={`px-6 py-2.5 text-[11px] flex items-center justify-between border-t shrink-0 ${
                    currentSlide.layout === 'TITLE' || currentSlide.layout === 'SUMMARY'
                      ? 'border-slate-800 text-slate-500'
                      : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="font-semibold truncate">
                    NQD-LMS Platform • {lessonTitle}
                  </span>
                  <span className="font-bold font-mono">
                    Trang {currentIndex + 1} / {totalSlides}
                  </span>
                </div>
              </div>

              {/* Player Navigation Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 w-full px-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Trang trước</span>
                  </button>

                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 text-white font-mono text-xs font-bold border border-slate-700">
                    <span>{currentIndex + 1}</span>
                    <span className="text-slate-500">/</span>
                    <span>{totalSlides}</span>
                  </div>

                  <button
                    onClick={() => setCurrentIndex((prev) => Math.min(totalSlides - 1, prev + 1))}
                    disabled={currentIndex === totalSlides - 1}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span className="hidden sm:inline">Trang sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {currentSlide.speakerNotes && (
                    <button
                      onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        showSpeakerNotes
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="Gợi ý lời giảng của trang này"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Lời giảng</span>
                    </button>
                  )}
                </div>

                {/* Download and Management buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-md shadow-[#83C75D]/20 transition flex items-center gap-2 cursor-pointer"
                    title="Tải bài giảng định dạng PowerPoint hoặc PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về Slide (.pptx)</span>
                  </button>

                  {isManageable && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition cursor-pointer"
                        title="Tạo lại slide bằng AI"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        title="Tải lên file slide mới thay thế"
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={handleDeleteSlide}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                        title="Xóa slide hiện tại"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Speaker Notes accordion */}
              {showSpeakerNotes && currentSlide.speakerNotes && (
                <div className="w-full p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Info className="w-3.5 h-3.5" />
                    <span>Gợi ý lời giảng (Speaker Notes)</span>
                  </div>
                  <p className="leading-relaxed">{currentSlide.speakerNotes}</p>
                </div>
              )}
            </div>
          ) : (
            /* EMPTY STATE: NO SLIDE YET */
            <div className="py-12 sm:py-16 max-w-lg w-full text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
                <Presentation className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Bài học này chưa có Slide bài giảng
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  Bạn có thể tạo slide tự động chuẩn sư phạm bằng Gemini AI hoặc tải lên file trình chiếu (.pptx, .pdf) đã chuẩn bị từ trước.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                  <span>Tạo Slide tự động bằng AI ✨</span>
                </button>

                {isManageable && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    ) : (
                      <Upload className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Tải lên file Slide (.pptx, .pdf)</span>
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5 text-left">
                <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <span className="font-bold text-white">Đặc quyền Hội viên:</span> Tính năng tạo Slide tự động bằng AI áp dụng cho tài khoản{' '}
                  <span className="text-indigo-400 font-bold">Admin</span> hoặc{' '}
                  <span className="text-amber-400 font-bold">Giáo viên Gói PRO</span>.
                </p>
              </div>
            </div>
          )}

          {/* AI Generator Configuration Drawer */}
          {showConfig && (
            <div className="w-full max-w-md mt-4 p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Tùy chọn tạo Slide bằng AI</span>
                </div>
                <button
                  onClick={() => setShowConfig(false)}
                  className="text-slate-500 hover:text-white text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Số lượng trang Slide mong muốn:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[6, 8, 10, 12].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSlideCount(num)}
                        className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                          slideCount === num
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                        }`}
                      >
                        {num} slide
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Phong cách bài giảng:
                  </label>
                  <select
                    value={slideStyle}
                    onChange={(e) => setSlideStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="STANDARD">Chuẩn Sư phạm (Đầy đủ mục tiêu, lý thuyết, ví dụ)</option>
                    <option value="CONCISE">Súc tích & Trực quan (Tóm lược cốt lõi, nhanh gọn)</option>
                    <option value="EXAM_PREP">Luyện thi & Trọng tâm (Điểm lưu ý, bẫy trắc nghiệm)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowConfig(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleGenerateAi}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bắt đầu tạo ngay</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input for manual upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pptx,.ppt,.pdf"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
