'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { examService } from '@/services/exam.service';
import {
  StudentExamTakingResponse,
  StudentQuestionTakingResponse,
  StudentAttemptResultResponse,
  StudentAnswerSubmissionDto,
  StudentExamAttemptReviewResponse,
  ExamAttemptEventType,
  ExamAttemptEventRequest,
} from '@/types/exam';
import StudentAttemptReviewModal from '@/components/StudentAttemptReviewModal';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Award,
  FileText,
  Send,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Maximize2,
  Minimize2,
  AlertOctagon,
} from 'lucide-react';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import { RichMathEditor } from '@/components/RichMathEditor';
import { StudentEssayAnswerEditor } from '@/components/StudentEssayAnswerEditor';
import { ListeningAudioPlayer } from '@/components/ListeningAudioPlayer';

export default function StudentExamTakingPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loginWithGoogle } = useAuth();

  const courseId = params?.id as string;
  const examId = params?.examId as string;

  const [examData, setExamData] = useState<StudentExamTakingResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; text?: string }>>({});
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [result, setResult] = useState<StudentAttemptResultResponse | null>(null);
  const [reviewModalData, setReviewModalData] = useState<StudentExamAttemptReviewResponse | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState<boolean>(false);

  // Proctoring States
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [violationCount, setViolationCount] = useState<number>(0);
  const [isFlagged, setIsFlagged] = useState<boolean>(false);
  const [flagReason, setFlagReason] = useState<string | null>(null);
  const [lastViolationWarning, setLastViolationWarning] = useState<string | null>(null);
  const [showFullscreenModal, setShowFullscreenModal] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const answersRef = useRef<Record<string, { optionId?: string; text?: string }>>({});
  const examDataRef = useRef<StudentExamTakingResponse | null>(null);
  const violationCountRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    examDataRef.current = examData;
  }, [examData]);

  useEffect(() => {
    violationCountRef.current = violationCount;
  }, [violationCount]);

  // Request Fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setShowFullscreenModal(false);
      }
    } catch (err) {
      console.warn('Could not enter fullscreen mode:', err);
    }
  }, []);

  // Sync event to server
  const sendProctoringEvent = useCallback(
    async (eventType: ExamAttemptEventType, metadata: string, isViolation: boolean = true) => {
      const currentExam = examDataRef.current;
      if (!currentExam || !currentExam.enableProctoring || isSubmittingRef.current) return;

      const eventPayload: ExamAttemptEventRequest = {
        eventType,
        metadata,
        isViolation,
        occurredAt: new Date().toISOString(),
      };

      try {
        const res = await examService.recordAttemptEvents(currentExam.attemptId, [eventPayload]);
        setViolationCount(res.violationCount);
        violationCountRef.current = res.violationCount;

        if (res.isFlagged) {
          setIsFlagged(true);
          setFlagReason(res.message);
        }

        if (isViolation) {
          setLastViolationWarning(
            `⚠️ CẢNH BÁO: ${metadata} (Vi phạm ${res.violationCount}/${res.maxViolationCount})`
          );
          // Auto clear warning text after 6 seconds
          setTimeout(() => setLastViolationWarning(null), 6000);
        }

        // Auto submission if disqualified by server
        if (res.isAutoSubmitted) {
          handleSubmitExam(true, 'Tự động nộp bài do vượt quá số lần vi phạm chống gian lận cho phép');
        }
      } catch (err) {
        console.error('Failed to send proctoring event:', err);
      }
    },
    []
  );

  // Proctoring Listeners
  useEffect(() => {
    if (!examData || !examData.enableProctoring || result) return;

    // Check Fullscreen
    const handleFullscreenChange = () => {
      const inFull = Boolean(document.fullscreenElement);
      setIsFullscreen(inFull);
      if (!inFull && !isSubmittingRef.current) {
        setShowFullscreenModal(true);
        sendProctoringEvent('FULLSCREEN_EXIT', 'Thoát khỏi chế độ toàn màn hình');
      }
    };

    // Visibility Change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isSubmittingRef.current) {
        sendProctoringEvent('TAB_BLUR', 'Chuyển tab trình duyệt hoặc ẩn cửa sổ làm bài');
      } else if (document.visibilityState === 'visible' && !isSubmittingRef.current) {
        sendProctoringEvent('RESUME', 'Quay lại màn hình làm bài thi', false);
      }
    };

    // Window Blur
    const handleWindowBlur = () => {
      if (!isSubmittingRef.current) {
        sendProctoringEvent('TAB_BLUR', 'Mất tiêu điểm cửa sổ (chuyển sang ứng dụng khác)');
      }
    };

    // Copy / Paste / ContextMenu
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      sendProctoringEvent('COPY_ATTEMPT', 'Cố gắng sao chép nội dung bài thi');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      sendProctoringEvent('PASTE_ATTEMPT', 'Cố gắng dán nội dung từ clipboard');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      sendProctoringEvent('DEVTOOLS_OPEN', 'Mở menu ngữ cảnh chuột phải');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        sendProctoringEvent('DEVTOOLS_OPEN', 'Phím tắt mở công cụ phát triển Developer Tools');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    // Initial fullscreen prompt
    if (!document.fullscreenElement) {
      setShowFullscreenModal(true);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [examData, result, sendProctoringEvent]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (examId) {
      initExam();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId, isAuthenticated]);

  const initExam = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await examService.startExam(examId);
      setExamData(data);
      examDataRef.current = data;
      setTimeLeftSeconds(data.durationMinutes * 60);
      setViolationCount(data.violationCount || 0);
      setIsFlagged(Boolean(data.isFlagged));
      setFlagReason(data.flagReason || null);

      if (data.enableProctoring && !document.fullscreenElement) {
        setShowFullscreenModal(true);
      }

      // Start countdown
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto submit when time runs out
            handleSubmitExam(true, 'Hết giờ làm bài thi');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể bắt đầu bài kiểm tra';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], optionId },
    }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], text },
    }));
  };

  const handleSubmitExam = async (isAutoSubmit = false, autoReason?: string) => {
    const currentExamData = examDataRef.current || examData;
    if (!currentExamData || isSubmittingRef.current) return;
    setIsSubmitting(true);
    isSubmittingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const currentAnswers = answersRef.current || answers;

    try {
      const formattedAnswers: StudentAnswerSubmissionDto[] = Object.entries(currentAnswers).map(
        ([qId, ans]) => ({
          questionId: qId,
          selectedOptionId: ans.optionId,
          answerText: ans.text,
        })
      );

      const res = await examService.submitExam(currentExamData.attemptId, {
        answers: formattedAnswers,
      });
      setResult(res);
      setShowSubmitConfirm(false);
      setShowFullscreenModal(false);

      // Exit fullscreen when done
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nộp bài kiểm tra thất bại';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleOpenReview = async (attemptId: string) => {
    setIsLoadingReview(true);
    try {
      const data = await examService.getStudentAttemptReview(attemptId);
      setReviewModalData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải chi tiết bài làm';
      setErrorMessage(msg);
    } finally {
      setIsLoadingReview(false);
    }
  };

  // Format MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <FileText className="w-12 h-12 text-purple-600 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">Yêu cầu đăng nhập</h1>
          <p className="text-xs text-slate-500">Vui lòng đăng nhập để làm bài kiểm tra này</p>
          <button
            onClick={loginWithGoogle}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-colors cursor-pointer"
          >
            Đăng nhập với Google
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans gap-3 text-slate-400">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-600">Đang chuẩn bị đề thi & tính giờ...</span>
      </div>
    );
  }

  if (errorMessage && !examData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">Không thể làm bài</h1>
          <p className="text-xs text-slate-500">{errorMessage}</p>
          <Link
            href={courseId ? `/courses/${courseId}` : '/courses'}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Khóa học</span>
          </Link>
        </div>
      </div>
    );
  }

  // Result scorecard view
  if (result) {
    const isPassed = Boolean(result.passed);

    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in zoom-in-95">
          <div
            className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg ${
              result.isFlagged
                ? 'bg-rose-100 text-rose-600 shadow-rose-500/20'
                : isPassed
                ? 'bg-emerald-100 text-emerald-600 shadow-emerald-500/20'
                : 'bg-amber-100 text-amber-600 shadow-amber-500/20'
            }`}
          >
            {result.isFlagged ? (
              <ShieldAlert className="w-10 h-10" />
            ) : isPassed ? (
              <Award className="w-10 h-10" />
            ) : (
              <CheckCircle2 className="w-10 h-10" />
            )}
          </div>

          <div className="space-y-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                result.isFlagged
                  ? 'bg-rose-100 text-rose-800'
                  : isPassed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {result.isFlagged
                ? '⚠️ BÀI THI BỊ ĐÌNH CHỈ / GẮN CỜ VI PHẠM'
                : isPassed
                ? '🎉 ĐẠT YÊU CẦU'
                : 'CẦN CỐ GẮNG THÊM'}
            </span>
            <h1 className="text-2xl font-black text-slate-900">{result.examTitle}</h1>
            <p className="text-xs text-slate-500">Lần thi thứ: {result.attemptNumber}</p>
          </div>

          {result.isFlagged && result.flagReason && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-1">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Lý do gắn cờ vi phạm:</span>
              </div>
              <p className="text-xs text-rose-700">{result.flagReason}</p>
            </div>
          )}

          {/* Score card box */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">ĐIỂM SỐ</span>
              <strong className="text-3xl font-black text-purple-700">
                {result.totalScore !== undefined ? result.totalScore : 0}
              </strong>
              <span className="text-xs text-slate-400 font-bold"> / {result.maxScore}đ</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">TỶ LỆ ĐÚNG</span>
              <strong className="text-3xl font-black text-slate-900">
                {result.percentage !== undefined ? result.percentage : 0}%
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">VI PHẠM</span>
              <strong
                className={`text-3xl font-black ${
                  (result.violationCount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {result.violationCount || 0}
              </strong>
              <span className="text-xs text-slate-400 font-bold"> lần</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 font-bold block">KẾT QUẢ</span>
              <strong
                className={`text-lg font-black block mt-1 ${
                  result.isFlagged
                    ? 'text-rose-600'
                    : isPassed
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {result.isFlagged ? 'ĐÌNH CHỈ' : isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
              </strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => handleOpenReview(result.attemptId)}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Xem chi tiết đúng / sai & Lời giải</span>
            </button>

            <Link
              href={courseId ? `/courses/${courseId}` : '/courses'}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Khóa học</span>
            </Link>
          </div>
        </div>

        {/* Review Modal */}
        <StudentAttemptReviewModal
          reviewData={reviewModalData}
          isLoading={isLoadingReview}
          onClose={() => setReviewModalData(null)}
        />
      </div>
    );
  }

  if (!examData) return null;

  const currentQ: StudentQuestionTakingResponse | undefined = examData.questions[currentQIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimeUrgent = timeLeftSeconds <= 300; // <= 5 mins
  const maxViolations = examData.maxViolationCount || 5;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16 select-none">
      {/* Real-time Violation Toast Banner */}
      {lastViolationWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in slide-in-from-top-4 duration-300">
          <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-900/30 flex items-center justify-between gap-3 border border-rose-400">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{lastViolationWarning}</span>
            </div>
            <button
              onClick={() => setLastViolationWarning(null)}
              className="text-white/80 hover:text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={courseId ? `/courses/${courseId}` : '/courses'}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              title="Thoát bài thi"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  Bài kiểm tra
                </span>
                {examData.enableProctoring && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                    <span>Giám sát AI & Chống gian lận</span>
                  </span>
                )}
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {examData.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Proctoring Warning Counter */}
            {examData.enableProctoring && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  violationCount > 0
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  Vi phạm: {violationCount} / {maxViolations}
                </span>
              </div>
            )}

            {/* Fullscreen Button */}
            {examData.enableProctoring && (
              <button
                onClick={enterFullscreen}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isFullscreen
                    ? 'bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-amber-100 border-amber-300 text-amber-800 animate-bounce'
                }`}
                title={isFullscreen ? 'Đang toàn màn hình' : 'Bật toàn màn hình'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}

            {/* Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border font-mono font-bold text-xs sm:text-sm transition-all shadow-xs ${
                isTimeUrgent
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeUrgent ? 'text-rose-600' : 'text-purple-600'}`} />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>

            {/* Submit button */}
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Question View Box (Col 1-3) */}
          <div className="lg:col-span-3 space-y-4">
            {currentQ ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-xl">
                      Câu {currentQIndex + 1} / {examData.questions.length}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      • {currentQ.questionType}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {currentQ.marks} điểm
                  </span>
                </div>

                {/* Listening Audio Player (Exam mode: audioScript hidden from student) */}
                {(currentQ.audioUrl || examData.audioUrl) && (
                  <div className="mb-2">
                    <ListeningAudioPlayer
                      key={currentQ.questionId}
                      audioUrl={currentQ.audioUrl || examData.audioUrl}
                      audioScript={null}
                      allowTranscript={false}
                      maxPlays={examData.maxListeningPlays || 2}
                      title={`Bài nghe: Câu ${currentQIndex + 1}`}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed select-none">
                  <MathMarkdownRenderer content={currentQ.content} />
                </div>

                {/* Fallback image rendering */}
                {currentQ.imageUrl && !currentQ.content.includes('![') && (
                  <div className="mb-4 text-center">
                    <img
                      src={
                        currentQ.imageUrl.startsWith('http://') || currentQ.imageUrl.startsWith('https://') || currentQ.imageUrl.startsWith('data:')
                          ? currentQ.imageUrl
                          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${currentQ.imageUrl.startsWith('/') ? '' : '/'}${currentQ.imageUrl}`
                      }
                      alt="Hình ảnh minh họa đề bài"
                      className="max-h-64 max-w-full rounded-2xl mx-auto border border-slate-200 shadow-xs object-contain"
                    />
                  </div>
                )}

                {/* Question Options / Inputs */}
                {(currentQ.questionType === 'MULTIPLE_CHOICE' ||
                  currentQ.questionType === 'TRUE_FALSE') && (
                  <div className="space-y-3 pt-2">
                    {currentQ.options.map((opt) => {
                      const isSelected = answers[currentQ.questionId]?.optionId === opt.id;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectOption(currentQ.questionId, opt.id)}
                          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-50/80 border-purple-500 text-purple-950 ring-2 ring-purple-400/30'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opt.optionKey}
                          </span>
                          <div className="flex-1 leading-relaxed">
                            <MathMarkdownRenderer content={opt.optionText} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {(currentQ.questionType === 'SHORT_ANSWER' ||
                  currentQ.questionType === 'FILL_IN_THE_BLANK') && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-700">Nhập câu trả lời của bạn:</label>
                    <input
                      type="text"
                      value={answers[currentQ.questionId]?.text || ''}
                      onChange={(e) => handleTextAnswer(currentQ.questionId, e.target.value)}
                      placeholder="Nhập đáp án ngắn gọn... (Hỗ trợ công thức $...$)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-purple-600 focus:bg-white transition-all font-mono"
                    />
                    {answers[currentQ.questionId]?.text?.includes('$') && (
                      <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-xs">
                        <span className="text-[10px] font-bold text-purple-600 block mb-1">Xem trước công thức:</span>
                        <MathMarkdownRenderer content={answers[currentQ.questionId]?.text || ''} />
                      </div>
                    )}
                  </div>
                )}

                {currentQ.questionType === 'ESSAY' && (
                  <div className="space-y-2 pt-2">
                    <StudentEssayAnswerEditor
                      label="Nội dung bài làm tự luận"
                      value={answers[currentQ.questionId]?.text || ''}
                      onChange={(val) => handleTextAnswer(currentQ.questionId, val)}
                      placeholder="Nhập ghi chú hoặc lời giải thích thêm nếu cần..."
                      helperText="Bạn có thể chụp ảnh bài làm trong vở/giấy tải lên, hoặc chuyển sang tab Gõ lời giải để dùng ký hiệu Toán - Lý."
                    />
                  </div>
                )}

                {/* Nav Buttons (Next / Prev) */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Câu trước</span>
                  </button>

                  <button
                    disabled={currentQIndex === examData.questions.length - 1}
                    onClick={() =>
                      setCurrentQIndex((prev) =>
                        Math.min(examData.questions.length - 1, prev + 1)
                      )
                    }
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Câu tiếp theo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Sidebar: Palette of Questions */}
          <div className="lg:col-span-1 space-y-4 sticky top-20">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Mục lục câu hỏi
                </h3>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  {answeredCount} / {examData.questions.length} đã làm
                </span>
              </div>

              {/* Grid of question buttons */}
              <div className="grid grid-cols-5 gap-2">
                {examData.questions.map((q, idx) => {
                  const isAnswered = Boolean(
                    answers[q.questionId]?.optionId || answers[q.questionId]?.text
                  );
                  const isCurrent = idx === currentQIndex;

                  return (
                    <button
                      key={q.questionId}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                        isCurrent
                          ? 'ring-2 ring-purple-600 bg-purple-600 text-white shadow-sm'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-purple-600 inline-block" />
                  <span>Đang xem</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300 inline-block" />
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
                  <span>Chưa làm</span>
                </div>
              </div>

              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Nộp bài thi ngay</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mandatory Fullscreen Prompt Modal */}
      {showFullscreenModal && examData.enableProctoring && !result && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Yêu cầu Toàn màn hình</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đề thi này được áp dụng hệ thống <strong className="text-indigo-600">Giám sát Chống gian lận</strong>.
                Bạn cần bật chế độ Toàn màn hình và không được chuyển tab hoặc thoát ra ngoài trong suốt thời gian làm bài.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left space-y-1 text-xs text-amber-800">
              <strong>⚠️ Quy định phòng thi:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700">
                <li>Không rời khỏi tab hoặc thu nhỏ trình duyệt</li>
                <li>Không sao chép / dán câu hỏi hoặc mở DevTools</li>
                <li>Vượt quá {maxViolations} lần vi phạm sẽ bị tự động đình chỉ bài thi!</li>
              </ul>
            </div>

            <button
              onClick={enterFullscreen}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Bật Toàn Màn Hình & Tiếp tục</span>
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 mx-auto flex items-center justify-center">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Xác nhận nộp bài thi?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn đã hoàn thành{' '}
                <strong className="text-purple-700 font-bold">{answeredCount}</strong> /{' '}
                {examData.questions.length} câu hỏi.
                {answeredCount < examData.questions.length && (
                  <span className="text-amber-600 font-semibold block mt-1">
                    ⚠️ Vẫn còn {examData.questions.length - answeredCount} câu hỏi chưa trả lời!
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitExam(false)}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Đang nộp...' : 'Xác nhận nộp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
