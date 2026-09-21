'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { exerciseService } from '@/services/exercise.service';
import {
  StudentExerciseTakingResponse,
  StudentExerciseQuestionTakingResponse,
  StudentExerciseQuestionResultResponse,
  StudentExerciseAttemptResultResponse,
} from '@/types/exercise';
import {
  Dumbbell,
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
  ListChecks,
  RotateCcw,
  Check,
  X,
  BookOpen,
  History,
  Bot,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import { RichMathEditor } from '@/components/RichMathEditor';
import { StudentEssayAnswerEditor } from '@/components/StudentEssayAnswerEditor';

export default function StudentExercisePracticePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const courseId = params?.id as string;
  const exerciseId = params?.exerciseId as string;

  const [exerciseData, setExerciseData] = useState<StudentExerciseTakingResponse | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [questionResults, setQuestionResults] = useState<Record<string, StudentExerciseQuestionResultResponse>>({});
  const [isCheckingQuestion, setIsCheckingQuestion] = useState<boolean>(false);
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Completed result state
  const [attemptResult, setAttemptResult] = useState<StudentExerciseAttemptResultResponse | null>(null);
  const [pastAttempts, setPastAttempts] = useState<StudentExerciseAttemptResultResponse[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // AI Tutor Modal
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiQuestionId, setAiQuestionId] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  // Time limit countdown
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 10-minute cooldown timer for 3 consecutive failures
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [cooldownSeconds]);

  useEffect(() => {
    if (isAuthenticated && exerciseId) {
      initExercise();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [isAuthenticated, exerciseId]);

  const initExercise = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await exerciseService.startExercise(exerciseId);
      setExerciseData(data);

      // Pre-fill already answered questions if resuming
      if (data.answeredQuestions && data.answeredQuestions.length > 0) {
        const selMap: Record<string, string> = {};
        data.answeredQuestions.forEach((ans) => {
          if (ans.selectedOptionId) {
            selMap[ans.questionId] = ans.selectedOptionId;
          } else if (ans.answerText) {
            selMap[ans.questionId] = ans.answerText;
          }
        });
        setSelectedAnswers(selMap);
      }

      // Start timer if timeLimitMinutes is set
      if (data.timeLimitMinutes && data.timeLimitMinutes > 0) {
        setTimeLeftSeconds(data.timeLimitMinutes * 60);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeftSeconds((prev) => {
            if (prev === null || prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              handleFinishAttempt();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      // Load past attempts
      exerciseService.getMyAttempts(exerciseId).then((history) => {
        setPastAttempts(history || []);
      }).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải bài tập luyện tập';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = async (questionId: string, value: string, isText = false) => {
    if (attemptResult || !exerciseData) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: value }));

    // Silently persist selected answer to backend so progress is saved
    try {
      await exerciseService.submitQuestion(exerciseData.attemptId, {
        questionId,
        selectedOptionId: isText ? undefined : value,
        answerText: isText ? value : undefined,
      });
    } catch {
      // Ignored: failure to auto-save will be caught when submitting attempt
    }
  };

  const handleFinishAttempt = async () => {
    if (!exerciseData) return;
    setIsSubmittingAttempt(true);
    setErrorMessage(null);
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      const res = await exerciseService.submitAttempt(exerciseData.attemptId);
      setAttemptResult(res);

      if (res.cooldownRemainingSeconds && res.cooldownRemainingSeconds > 0) {
        setCooldownSeconds(res.cooldownRemainingSeconds);
      }

      // Map questionResults from the attempt result response to display correct answers and explanations
      if (res.questionResults && res.questionResults.length > 0) {
        const resMap: Record<string, StudentExerciseQuestionResultResponse> = {};
        res.questionResults.forEach((qRes) => {
          resMap[qRes.questionId] = qRes;
        });
        setQuestionResults(resMap);
      }

      // Refresh past attempts
      const history = await exerciseService.getMyAttempts(exerciseId);
      setPastAttempts(history || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể nộp bài tập';
      setErrorMessage(msg);
    } finally {
      setIsSubmittingAttempt(false);
    }
  };

  const handleRestartExercise = () => {
    setAttemptResult(null);
    setSelectedAnswers({});
    setQuestionResults({});
    setCurrentQIndex(0);
    initExercise();
  };

  const handleOpenAiExplainer = async (questionId: string) => {
    if (!exerciseData) return;
    setAiQuestionId(questionId);
    setShowAiModal(true);
    setIsLoadingAi(true);
    setAiExplanation(null);

    try {
      const aiRes = await exerciseService.explainQuestionWithAi(
        exerciseData.attemptId,
        questionId
      );
      setAiExplanation(aiRes.explanation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI Tutor đang bận, vui lòng thử lại sau.';
      setAiExplanation(msg);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion: StudentExerciseQuestionTakingResponse | undefined =
    exerciseData?.questions?.[currentQIndex];

  const currentResult: StudentExerciseQuestionResultResponse | undefined =
    attemptResult && currentQuestion ? questionResults[currentQuestion.questionId] : undefined;

  const totalAnswered = Object.keys(selectedAnswers).length;
  const totalQuestions = exerciseData?.questions?.length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Đang tải bài tập luyện tập...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !exerciseData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-rose-200 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Không Thể Bắt Đầu Luyện Tập</h3>
          <p className="text-sm text-slate-600">{errorMessage}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  LUYỆN TẬP TỰ DO
                </span>
                {exerciseData?.attemptNumber && (
                  <span className="text-xs text-slate-400 font-medium">
                    Lần làm #{exerciseData.attemptNumber}
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {exerciseData?.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown timer if time limited */}
            {timeLeftSeconds !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-mono text-sm font-bold">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            {/* Past History Button */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <History className="w-4 h-4" />
              <span>Lịch sử ({pastAttempts.length})</span>
            </button>

            {/* Complete attempt button */}
            {!attemptResult && (
              <button
                onClick={handleFinishAttempt}
                disabled={isSubmittingAttempt}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingAttempt ? 'Đang nộp...' : 'Nộp bài'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Completion Result Screen */}
        {attemptResult ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Hoàn Thành Luyện Tập!</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Bạn đã hoàn thành các câu hỏi trong bài tập này. Dưới đây là kết quả luyện tập chi tiết của bạn.
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-medium text-slate-500">TỔNG ĐIỂM</div>
                <div className="text-2xl font-bold text-indigo-600 mt-1">
                  {attemptResult.totalScore || 0} / {attemptResult.maxScore || 0}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-medium text-slate-500">TỶ LỆ CHÍNH XÁC</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {attemptResult.percentage || 0}%
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-medium text-slate-500">SỐ CÂU ĐÚNG</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  {attemptResult.correctCount || 0} / {attemptResult.totalQuestions}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-medium text-slate-500">KẾT QUẢ</div>
                <div
                  className={`text-lg font-bold mt-1 ${
                    attemptResult.passed ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {attemptResult.passed ? 'ĐẠT 100%' : 'CHƯA ĐẠT'}
                </div>
              </div>
            </div>

            {/* Pass requirement notification & Cycle info */}
            {!attemptResult.passed && (
              <div className="max-w-xl mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="font-bold flex items-center justify-center gap-1.5 text-amber-800 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Yêu cầu đạt 100% để mở khóa bài học tiếp theo</span>
                </div>
                <p className="leading-relaxed">
                  Bạn cần trả lời đúng tất cả các câu hỏi của bài tập này để được chuyển sang bài học tiếp theo trong khóa học.
                </p>
                {attemptResult.attemptCycleCount !== undefined && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100/70 rounded-full font-bold text-amber-900 mt-1">
                    <span>Lượt làm bài trong đợt: {attemptResult.attemptCycleCount}/3</span>
                  </div>
                )}
              </div>
            )}

            {/* Cooldown Timer Alert (When failed 3 times) */}
            {cooldownSeconds > 0 && (
              <div className="max-w-xl mx-auto p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2 animate-pulse">
                <div className="font-bold flex items-center justify-center gap-2 text-rose-700 text-sm">
                  <Clock className="w-5 h-5 text-rose-600 animate-spin" />
                  <span>TẠM KHÓA LÀM LẠI TRONG 10 PHÚT</span>
                </div>
                <p>
                  Bạn đã làm sai 3 lần liên tiếp. Hệ thống yêu cầu nghỉ ngơi ôn lại bài giảng trước khi làm lại:
                </p>
                <div className="text-3xl font-mono font-bold text-rose-700 py-1">
                  {formatTime(cooldownSeconds)}
                </div>
                <p className="text-[11px] text-rose-600">
                  Nút luyện tập lại sẽ tự động mở khóa sau khi đồng hồ đếm ngược kết thúc.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Quay lại bài học
              </button>
              {attemptResult.passed ? (
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tiếp tục học bài sau</span>
                </button>
              ) : (
                <button
                  onClick={handleRestartExercise}
                  disabled={cooldownSeconds > 0}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {cooldownSeconds > 0
                      ? `Đợi ${formatTime(cooldownSeconds)}`
                      : 'Luyện tập lại'}
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Interactive Practice Flow */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Question Navigation List */}
            <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  DANH SÁCH CÂU HỎI
                </h3>
                <span className="text-xs text-indigo-600 font-semibold">
                  {totalAnswered}/{totalQuestions} đã làm
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${(totalAnswered / (totalQuestions || 1)) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2 pt-2">
                {exerciseData?.questions?.map((q, idx) => {
                  const res = questionResults[q.questionId];
                  const isSelected = currentQIndex === idx;

                  let btnStyle = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
                  if (res) {
                    if (res.isCorrect) {
                      btnStyle = 'bg-emerald-500 text-white border-emerald-600';
                    } else {
                      btnStyle = 'bg-rose-500 text-white border-rose-600';
                    }
                  } else if (selectedAnswers[q.questionId]) {
                    btnStyle = 'bg-indigo-100 text-indigo-700 border-indigo-300';
                  }

                  if (isSelected) {
                    btnStyle += ' ring-2 ring-indigo-500 ring-offset-2';
                  }

                  return (
                    <button
                      key={q.questionId}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-9 rounded-xl font-bold text-xs border flex items-center justify-center transition ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Instructions Box */}
              {exerciseData?.instructions && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Hướng dẫn:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{exerciseData.instructions}</p>
                </div>
              )}
            </div>

            {/* Right: Current Question Details & Instant Check */}
            {currentQuestion && (
              <div className="lg:col-span-3 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      {currentQIndex + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Điểm: {currentQuestion.marks || 1}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {currentQuestion.difficulty}
                    </span>
                  </div>

                  {/* AI Tutor Quick Button (Only after submitting attempt) */}
                  {attemptResult && (
                    <button
                      onClick={() => handleOpenAiExplainer(currentQuestion.questionId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition shadow-2xs"
                    >
                      <Bot className="w-4 h-4 text-indigo-600" />
                      <span>AI Giải Thích</span>
                    </button>
                  )}
                </div>

                {/* Question Content */}
                <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                  <MathMarkdownRenderer content={currentQuestion.content} />
                </div>

                {/* Options List / Fill-in / Essay Input */}
                {(() => {
                  const qType = currentQuestion.questionType;
                  const isChoice = qType === 'MULTIPLE_CHOICE' || qType === 'TRUE_FALSE';
                  const isFillOrShort = qType === 'FILL_IN_THE_BLANK' || qType === 'SHORT_ANSWER';

                  // 1. Multiple Choice / True-False Questions
                  if (isChoice && currentQuestion.options && currentQuestion.options.length > 0) {
                    return (
                      <div className="space-y-3">
                        {currentQuestion.options.map((opt) => {
                          const isSelected = selectedAnswers[currentQuestion.questionId] === opt.id;
                          const isChecked = !!currentResult;
                          const isCorrectOpt = currentResult?.correctOptionId === opt.id;
                          const isWrongSelected = isChecked && isSelected && !currentResult?.isCorrect;

                          let optStyle =
                            'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 text-slate-800';

                          if (isSelected && !isChecked) {
                            optStyle = 'bg-indigo-50/80 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400';
                          }

                          if (isChecked) {
                            if (isCorrectOpt) {
                              optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400';
                            } else if (isWrongSelected) {
                              optStyle = 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400';
                            }
                          }

                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleSelectOption(currentQuestion.questionId, opt.id, false)}
                              className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition text-sm sm:text-base ${optStyle}`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                                  {opt.optionKey}
                                </span>
                                <div className="flex-1 leading-relaxed">
                                  <MathMarkdownRenderer content={opt.optionText} />
                                </div>
                              </div>

                              {isChecked && (
                                <div>
                                  {isCorrectOpt && (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Đáp án đúng</span>
                                    </span>
                                  )}
                                  {isWrongSelected && (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-100/70 px-2.5 py-1 rounded-lg">
                                      <X className="w-3.5 h-3.5" />
                                      <span>Lựa chọn của bạn</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // 2. Fill in the blank / Short Answer Questions
                  if (isFillOrShort) {
                    return (
                      <div className="space-y-3 pt-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Nhập câu trả lời / điền đáp án của bạn:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={selectedAnswers[currentQuestion.questionId] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.questionId]: val }));
                            }}
                            onBlur={(e) => handleSelectOption(currentQuestion.questionId, e.target.value, true)}
                            disabled={isSubmittingAttempt || isCheckingQuestion || !!currentResult}
                            placeholder="Nhập đáp án (Ví dụ: 79, x = 14, ...)"
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleSelectOption(currentQuestion.questionId, selectedAnswers[currentQuestion.questionId] || '', true)}
                            disabled={isSubmittingAttempt || isCheckingQuestion || !!currentResult}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            Lưu đáp án
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          💡 Hệ thống sử dụng <strong>AI để chấm điểm tự động</strong>, chấp nhận các cách diễn đạt tương đương hoặc kèm đơn vị.
                        </p>
                      </div>
                    );
                  }

                  // 3. Essay Questions
                  return (
                    <div className="space-y-3 pt-2">
                      <StudentEssayAnswerEditor
                        label="Bài làm tự luận của bạn"
                        value={selectedAnswers[currentQuestion.questionId] || ''}
                        onChange={(val) => handleSelectOption(currentQuestion.questionId, val, true)}
                        disabled={isSubmittingAttempt || isCheckingQuestion || !!currentResult}
                        placeholder="Nhập ghi chú hoặc lời giải thích thêm nếu cần..."
                        helperText="Bạn có thể chụp ảnh bài làm trong vở/giấy tải lên, hoặc chuyển sang tab Gõ lời giải để dùng ký hiệu Toán - Lý."
                      />
                    </div>
                  );
                })()}

                {/* Instant Feedback & Explanation Box */}
                {currentResult && (
                  <div
                    className={`p-4 rounded-xl border space-y-2 animate-fade-in ${
                      currentResult.isCorrect
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/60 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {currentResult.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="text-emerald-700">Chính xác! (+{currentResult.marksAwarded} điểm)</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                            <span className="text-rose-700">
                              {currentResult.correctOptionKey
                                ? `Chưa đúng! Đáp án đúng là ${currentResult.correctOptionKey}`
                                : `Chưa chính xác (+${currentResult.marksAwarded || 0} điểm)`}
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenAiExplainer(currentQuestion.questionId)}
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Hỏi thêm AI</span>
                      </button>
                    </div>

                    {currentResult.aiExplanation && (
                      <div className="text-xs text-indigo-950 bg-indigo-50/80 p-3 rounded-lg border border-indigo-200/60 mt-2 space-y-1">
                        <strong className="block text-indigo-900 font-bold">🤖 Nhận xét chấm điểm của AI:</strong>
                        <div className="leading-relaxed">
                          <MathMarkdownRenderer content={currentResult.aiExplanation} />
                        </div>
                      </div>
                    )}

                    {currentResult.explanation && (
                      <div className="text-xs text-slate-700 bg-white/80 p-3 rounded-lg border border-slate-200/50 mt-2">
                        <strong className="block text-slate-900 mb-1 font-bold">💡 Hướng dẫn giải:</strong>
                        <div className="leading-relaxed">
                          <MathMarkdownRenderer content={currentResult.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation & Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQIndex === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Câu trước</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {currentQIndex < (exerciseData?.questions?.length || 0) - 1 ? (
                      <button
                        onClick={() => setCurrentQIndex((prev) => prev + 1)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition"
                      >
                        <span>Câu tiếp</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleFinishAttempt}
                        disabled={isSubmittingAttempt}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{isSubmittingAttempt ? 'Đang nộp...' : 'Nộp bài kiểm tra'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Tutor Explanation Modal */}
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Trợ Lý AI Tutor Giải Thích</h3>
                    <p className="text-[11px] text-slate-500">Phân tích bài toán và hướng dẫn tư duy từng bước</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 text-sm space-y-4">
                {isLoadingAi ? (
                  <div className="text-center py-10 space-y-3">
                    <Sparkles className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">
                      AI Tutor đang suy luận và soạn lời giải chi tiết cho bạn...
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm font-sans">
                    {aiExplanation}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Lịch Sử Các Lần Luyện Tập</h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">
                {pastAttempts.length === 0 ? (
                  <p className="text-center py-8 text-slate-400">Bạn chưa có lần làm bài nào trước đây.</p>
                ) : (
                  pastAttempts.map((att) => (
                    <div
                      key={att.attemptId}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          Lần làm #{att.attemptNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {att.submittedAt
                            ? new Date(att.submittedAt).toLocaleString('vi-VN')
                            : 'Đang làm...'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-indigo-600 text-sm">
                          {att.totalScore || 0} / {att.maxScore || 0} điểm
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            att.passed ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {att.passed ? 'ĐẠT' : 'CHƯA ĐẠT'} ({att.percentage || 0}%)
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
