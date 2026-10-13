'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  mistakeNotebookService,
  MistakeNotebookSummaryResponse,
  StudentMistakeNoteDto,
  MistakePracticeResultResponse,
  MistakeMasteryStatus,
} from '@/services/mistakeNotebook.service';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import {
  BookOpenCheck,
  Flame,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Play,
  Eye,
  EyeOff,
  Trash2,
  StickyNote,
  Save,
  RotateCcw,
  Award,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Loader2,
} from 'lucide-react';

export default function MistakeNotebookPage() {
  const [summary, setSummary] = useState<MistakeNotebookSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [dueOnly, setDueOnly] = useState<boolean>(false);

  // Card states
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  // Smart Practice Quiz Mode
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [practiceItems, setPracticeItems] = useState<StudentMistakeNoteDto[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isSubmittingPractice, setIsSubmittingPractice] = useState<boolean>(false);
  const [practiceResult, setPracticeResult] = useState<MistakePracticeResultResponse | null>(null);

  useEffect(() => {
    loadNotebook();
  }, [statusFilter, dueOnly]);

  const loadNotebook = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mistakeNotebookService.getMyMistakeNotebook({
        status: statusFilter,
        dueOnly,
      });
      setSummary(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải Sổ tay lỗi sai');
    } finally {
      setIsLoading(false);
    }
  };

  const subjects = useMemo(() => {
    if (!summary?.items) return [];
    const map = new Map<string, string>();
    summary.items.forEach((item) => {
      if (item.subjectId && item.subjectName) {
        map.set(item.subjectId, item.subjectName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [summary]);

  const filteredItems = useMemo(() => {
    if (!summary?.items) return [];
    if (subjectFilter === 'ALL') return summary.items;
    return summary.items.filter((i) => i.subjectId === subjectFilter);
  }, [summary, subjectFilter]);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEditNote = (item: StudentMistakeNoteDto) => {
    setEditingNoteId(item.id);
    setNoteDrafts((prev) => ({
      ...prev,
      [item.id]: prev[item.id] !== undefined ? prev[item.id] : item.personalNote || '',
    }));
  };

  const handleSavePersonalNote = async (mistakeNoteId: string) => {
    setSavingNoteId(mistakeNoteId);
    try {
      const updated = await mistakeNotebookService.updatePersonalNote(
        mistakeNoteId,
        noteDrafts[mistakeNoteId] || ''
      );
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) => (item.id === mistakeNoteId ? updated : item)),
            }
          : prev
      );
      setEditingNoteId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể lưu ghi chú');
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleDeleteNote = async (mistakeNoteId: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này khỏi Sổ tay lỗi sai?')) return;
    try {
      await mistakeNotebookService.deleteMistakeNote(mistakeNoteId);
      await loadNotebook();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  const startSmartPractice = (onlyDue: boolean) => {
    if (!filteredItems.length) return;
    const pool = onlyDue
      ? filteredItems.filter((i) => i.dueForReview && i.options && i.options.length > 0)
      : filteredItems.filter((i) => i.options && i.options.length > 0);

    const targetPool = pool.length > 0 ? pool : filteredItems.filter((i) => i.options && i.options.length > 0);
    if (targetPool.length === 0) {
      alert('Không có câu hỏi trắc nghiệm nào trong danh sách hiện tại để ôn tập.');
      return;
    }

    setPracticeItems(targetPool.slice(0, 15));
    setCurrentIdx(0);
    setSelectedOptions({});
    setPracticeResult(null);
    setIsPracticeMode(true);
  };

  const handleSubmitPractice = async () => {
    setIsSubmittingPractice(true);
    try {
      const payload = practiceItems.map((item) => ({
        questionId: item.questionId,
        selectedOptionId: selectedOptions[item.questionId],
      }));
      const res = await mistakeNotebookService.submitPracticeReview(payload);
      setPracticeResult(res);
      await loadNotebook();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Nộp bài ôn tập thất bại');
    } finally {
      setIsSubmittingPractice(false);
    }
  };

  const renderMasteryBadge = (status: MistakeMasteryStatus, consecutive: number) => {
    if (status === 'MASTERED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Đã thành thạo ({consecutive}/3)
        </span>
      );
    }
    if (status === 'REVIEWING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="w-3.5 h-3.5" />
          Đang củng cố ({consecutive}/3)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
        <AlertTriangle className="w-3.5 h-3.5" />
        Cần học lại ({consecutive}/3)
      </span>
    );
  };

  if (isPracticeMode && practiceItems.length > 0) {
    const currentQ = practiceItems[currentIdx];
    const outcomeMap = new Map(
      practiceResult?.outcomes.map((o) => [o.questionId, o]) || []
    );
    const currentOutcome = outcomeMap.get(currentQ.questionId);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Chế độ Ôn tập Thông minh (Spaced Repetition)
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Câu {currentIdx + 1} / {practiceItems.length}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsPracticeMode(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
          >
            Thoát chế độ Ôn tập
          </button>
        </div>

        {practiceResult && (
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full">
                <Award className="w-4 h-4" />
                Kết quả lượt Ôn tập Spaced Repetition
              </div>
              <h2 className="text-2xl font-extrabold">
                Đúng {practiceResult.correctCount} / {practiceResult.totalReviewed} câu hỏi!
              </h2>
              <p className="text-xs text-indigo-100">
                Làm đúng 3 lần liên tiếp một câu hỏi sẽ chuyển trạng thái sang <strong>Đã thành thạo</strong> (giãn lịch ôn 14 ngày).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPracticeMode(false)}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-indigo-50 cursor-pointer shrink-0 shadow-xs"
            >
              Quay về Sổ tay lỗi sai
            </button>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {currentQ.subjectName && (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
                  {currentQ.subjectName}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs">
                Đã sai {currentQ.wrongCount} lần
              </span>
            </div>
            {renderMasteryBadge(currentQ.masteryStatus, currentQ.consecutiveCorrectCount)}
          </div>

          <div className="prose prose-slate max-w-none text-slate-900 font-medium">
            <MathMarkdownRenderer content={currentQ.content} />
          </div>

          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOptions[currentQ.questionId] === opt.id;
              const showOutcome = Boolean(practiceResult);
              const isRightOption = opt.isCorrect;

              let borderClass = 'border-slate-200 hover:border-indigo-300 bg-white';
              if (!showOutcome && isSelected) {
                borderClass = 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20';
              } else if (showOutcome) {
                if (isRightOption) {
                  borderClass = 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20';
                } else if (isSelected && !isRightOption) {
                  borderClass = 'border-rose-500 bg-rose-50/80';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={showOutcome}
                  onClick={() =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [currentQ.questionId]: opt.id,
                    }))
                  }
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${borderClass}`}
                >
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {opt.optionKey}
                  </span>
                  <div className="flex-1 text-sm text-slate-800">
                    <MathMarkdownRenderer content={opt.optionText} />
                  </div>
                </button>
              );
            })}
          </div>

          {currentOutcome && (
            <div
              className={`p-4 rounded-2xl border text-sm space-y-2 ${
                currentOutcome.correct
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="font-bold flex items-center gap-2">
                {currentOutcome.correct ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Chính xác! Chuỗi đúng liên tiếp: {currentOutcome.consecutiveCorrectCount}/3
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Chưa chính xác! Câu hỏi đã được đặt lại lịch ôn tập ưu tiên.</span>
                  </>
                )}
              </div>
              {currentOutcome.explanation && (
                <div className="text-xs text-slate-700 pt-1 border-t border-black/5">
                  <strong className="block mb-1">Giải thích chi tiết:</strong>
                  <MathMarkdownRenderer content={currentOutcome.explanation} />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Câu trước
            </button>

            <div className="flex items-center gap-2">
              {currentIdx < practiceItems.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((i) => Math.min(practiceItems.length - 1, i + 1))}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Câu tiếp theo
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : !practiceResult ? (
                <button
                  type="button"
                  disabled={isSubmittingPractice}
                  onClick={handleSubmitPractice}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPractice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang chấm & cập nhật lịch ôn...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Nộp bài Ôn tập ({Object.keys(selectedOptions).length}/{practiceItems.length})</span>
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thuật toán Lặp lại Ngắt quãng (Spaced Repetition)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sổ Tay Câu Hỏi Hay Sai & Ôn Tập Thông Minh
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Mọi câu hỏi bạn làm sai trong <strong>Đề thi</strong> hoặc <strong>Bài tập</strong> đều được tự động thu thập tại đây. Ôn tập đúng 3 lần liên tiếp để xóa điểm mù kiến thức vĩnh viễn!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => startSmartPractice(true)}
              disabled={!summary || summary.totalMistakes === 0}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                Ôn tập câu đến hạn hôm nay ({summary?.dueForReviewCount || 0})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tổng câu từng sai</span>
            <BookOpenCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {summary?.totalMistakes ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tự động lưu từ Đề thi & Bài tập</p>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase">Cần ôn hôm nay</span>
            <Flame className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700 mt-2">
            {summary?.dueForReviewCount ?? 0}
          </div>
          <p className="text-[11px] text-rose-600 mt-1">Đến hạn theo chu kỳ trí nhớ</p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase">Đang củng cố</span>
            <RotateCcw className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-2">
            {summary?.reviewingCount ?? 0}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">Đã trả lời đúng 1–2 lần liên tiếp</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase">Đã thành thạo</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-2">
            {summary?.masteredCount ?? 0}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">Đúng ≥ 3 lần liên tiếp</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mr-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Lọc trạng thái:</span>
          </div>
          {[
            { code: 'ALL', label: 'Tất cả' },
            { code: 'LEARNING', label: 'Cần học lại' },
            { code: 'REVIEWING', label: 'Đang củng cố' },
            { code: 'MASTERED', label: 'Đã thành thạo' },
          ].map((tab) => (
            <button
              key={tab.code}
              type="button"
              onClick={() => setStatusFilter(tab.code)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.code
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {subjects.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none"
            >
              <option value="ALL">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dueOnly}
              onChange={(e) => setDueOnly(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
            <span>Chỉ hiện câu đến hạn ôn</span>
          </label>
        </div>
      </div>

      {/* Mistake List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200 rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Đang tải Sổ tay lỗi sai của bạn...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
          <p className="text-sm font-bold text-rose-700">{error}</p>
          <button
            type="button"
            onClick={loadNotebook}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
          >
            Thử lại
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Chưa có câu hỏi nào trong danh sách này!
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Khi bạn làm bài kiểm tra hoặc bài tập khóa học, những câu trả lời chưa chính xác sẽ tự động được lưu vào đây để bạn ôn tập theo phương pháp Spaced Repetition.
          </p>
          <div className="pt-2">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              <span>Khám phá Khóa học & Làm bài tập</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredItems.map((item, index) => {
            const isRevealed = Boolean(revealedIds[item.id]);
            const isEditingNote = editingNoteId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4 transition hover:border-slate-300"
              >
                {/* Top Meta Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                      #{index + 1}
                    </span>
                    {item.subjectName && (
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
                        {item.subjectName}
                      </span>
                    )}
                    {item.categoryName && (
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 font-semibold text-xs">
                        {item.categoryName}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs">
                      Sai {item.wrongCount} lần
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Nguồn: {item.sourceType === 'EXERCISE' ? 'Bài tập bài giảng' : 'Đề kiểm tra'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderMasteryBadge(item.masteryStatus, item.consecutiveCorrectCount)}
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(item.id)}
                      title="Xóa khỏi sổ tay"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Content */}
                <div className="prose prose-slate max-w-none text-slate-900 font-medium text-sm">
                  <MathMarkdownRenderer content={item.content} />
                </div>

                {/* Options */}
                {item.options && item.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {item.options.map((opt) => {
                      const highlightCorrect = isRevealed && opt.isCorrect;
                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                            highlightCorrect
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold'
                              : 'bg-slate-50/70 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md font-bold flex items-center justify-center shrink-0 ${
                              highlightCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.optionKey}
                          </span>
                          <div className="flex-1">
                            <MathMarkdownRenderer content={opt.optionText} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation when revealed */}
                {isRevealed && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-800 space-y-1.5">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-emerald-600" />
                      <span>Lời giải & Giải thích chi tiết:</span>
                    </div>
                    {item.explanation ? (
                      <MathMarkdownRenderer content={item.explanation} />
                    ) : (
                      <p className="text-slate-500 italic">
                        Câu hỏi này chưa có lời giải chi tiết từ giảng viên. Bạn có thể ghi chú lại công thức bên dưới!
                      </p>
                    )}
                  </div>
                )}

                {/* Personal Note Section */}
                {isEditingNote ? (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <StickyNote className="w-4 h-4 text-amber-600" />
                        Ghi chú cá nhân (Mẹo nhớ nhanh / Công thức hay quên)
                      </span>
                      <VoiceInputButton
                        value={noteDrafts[item.id] ?? ''}
                        onTranscript={(spoken: string) =>
                          setNoteDrafts((prev) => ({
                            ...prev,
                            [item.id]: spoken,
                          }))
                        }
                        size="sm"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={noteDrafts[item.id] ?? ''}
                      onChange={(e) =>
                        setNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Nhập mẹo giải nhanh hoặc lý do bạn chọn nhầm..."
                      className="w-full p-3 rounded-xl bg-white border border-amber-300 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-400/30"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(null)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        disabled={savingNoteId === item.id}
                        onClick={() => handleSavePersonalNote(item.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingNoteId === item.id ? 'Đang lưu...' : 'Lưu ghi chú'}</span>
                      </button>
                    </div>
                  </div>
                ) : item.personalNote ? (
                  <div
                    onClick={() => handleStartEditNote(item)}
                    className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 flex items-start justify-between gap-3 cursor-pointer hover:bg-amber-100/60 transition"
                  >
                    <div className="flex items-start gap-2">
                      <StickyNote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold mr-1">Ghi chú của tôi:</span>
                        <span>{item.personalNote}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 shrink-0 underline">
                      Sửa
                    </span>
                  </div>
                ) : null}

                {/* Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleReveal(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                    >
                      {isRevealed ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Ẩn đáp án</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem đáp án & Lời giải</span>
                        </>
                      )}
                    </button>

                    {!item.personalNote && !isEditingNote && (
                      <button
                        type="button"
                        onClick={() => handleStartEditNote(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition cursor-pointer"
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                        <span>Thêm ghi chú cá nhân</span>
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    {item.nextReviewAt && (
                      <span>
                        Lịch ôn tiếp theo:{' '}
                        <strong className="text-slate-600">
                          {new Date(item.nextReviewAt).toLocaleDateString('vi-VN')}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
