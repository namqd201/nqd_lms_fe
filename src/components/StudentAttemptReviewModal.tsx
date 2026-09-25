'use client';

import React from 'react';
import {
  StudentExamAttemptReviewResponse,
  StudentAttemptResultResponse,
} from '@/types/exam';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ListChecks,
} from 'lucide-react';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import { ListeningAudioPlayer } from '@/components/ListeningAudioPlayer';

interface StudentAttemptReviewModalProps {
  reviewData: StudentExamAttemptReviewResponse | null;
  isLoading: boolean;
  onClose: () => void;
  attemptsList?: StudentAttemptResultResponse[];
  selectedAttemptId?: string;
  onSelectAttempt?: (attemptId: string) => void;
}

export default function StudentAttemptReviewModal({
  reviewData,
  isLoading,
  onClose,
  attemptsList = [],
  selectedAttemptId,
  onSelectAttempt,
}: StudentAttemptReviewModalProps) {
  if (!reviewData && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
              <ListChecks className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                {reviewData && (
                  <>
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {reviewData.examCode}
                    </span>
                    <span className="font-bold text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      Lần thi {reviewData.attemptNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        reviewData.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {reviewData.passed ? '✓ ĐẠT YÊU CẦU' : '✕ CHƯA ĐẠT'}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {reviewData ? `Chi tiết bài làm: ${reviewData.examTitle}` : 'Xem lại bài làm'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-600 rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-600">Đang tải chi tiết bài làm...</span>
          </div>
        ) : reviewData ? (
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            {/* Multi-attempts switcher tabs */}
            {attemptsList.length > 1 && onSelectAttempt && (
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto">
                <span className="text-xs font-bold text-slate-500 px-2.5 shrink-0">
                  Các lần làm bài:
                </span>
                {attemptsList.map((att) => {
                  const isActive = att.attemptId === (selectedAttemptId || reviewData.attemptId);
                  return (
                    <button
                      key={att.attemptId}
                      onClick={() => onSelectAttempt(att.attemptId)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                          : 'text-slate-600 hover:bg-white/60'
                      }`}
                    >
                      Lần {att.attemptNumber}: {att.totalScore}đ ({att.percentage}%)
                      {att.passed ? ' ✓' : ''}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Score Summary Metrics */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  Điểm Đạt Được
                </span>
                <strong className="text-2xl font-black text-purple-700">
                  {reviewData.totalScore !== undefined ? reviewData.totalScore : 0}
                </strong>
                <span className="text-slate-400 font-bold"> / {reviewData.maxScore}đ</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  Tỷ Lệ Đúng
                </span>
                <strong className="text-2xl font-black text-slate-800">
                  {reviewData.percentage !== undefined ? reviewData.percentage : 0}%
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  Thời Gian Làm
                </span>
                <strong className="text-sm font-bold text-slate-800 block mt-1.5">
                  {reviewData.durationSeconds
                    ? `${Math.floor(reviewData.durationSeconds / 60)}p ${reviewData.durationSeconds % 60}s`
                    : 'N/A'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  Kết Quả
                </span>
                <strong
                  className={`text-sm font-black block mt-1.5 ${
                    reviewData.passed ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {reviewData.passed ? '🎉 ĐẠT' : 'CHƯA ĐẠT'}
                </strong>
              </div>
            </div>

            {/* Questions Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Chi tiết câu hỏi & Lời giải ({reviewData.answers.length} câu)
              </h3>

              {reviewData.answers.map((ans, idx) => (
                <div
                  key={ans.questionId}
                  className={`p-5 rounded-2xl border space-y-3 text-xs ${
                    ans.isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 bg-white border px-2.5 py-1 rounded-xl">
                      Câu {idx + 1} • {ans.questionType}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        ans.isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {ans.isCorrect
                        ? `✓ Đúng (+${ans.marksAwarded}đ)`
                        : `✕ Sai (0 / ${ans.maxMarks}đ)`}
                    </span>
                  </div>

                  {/* Listening Audio Player with Transcript enabled */}
                  {(ans.audioUrl || ans.audioScript) && (
                    <div className="py-1">
                      <ListeningAudioPlayer
                        audioUrl={ans.audioUrl}
                        audioScript={ans.audioScript}
                        allowTranscript={true}
                        title={`Bài nghe: Câu ${idx + 1}`}
                      />
                    </div>
                  )}

                  <div className="text-sm font-bold text-slate-900 leading-relaxed">
                    <MathMarkdownRenderer content={ans.content} />
                  </div>

                  {/* Options List */}
                  {(ans.questionType === 'MULTIPLE_CHOICE' ||
                    ans.questionType === 'TRUE_FALSE') && (
                    <div className="space-y-1.5 pt-1">
                      {ans.options?.map((opt) => {
                        const isStudentSelected = opt.optionKey === ans.studentSelectedOptionKey;
                        const isOptCorrect = opt.isCorrect;

                        return (
                          <div
                            key={opt.optionKey}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                              isOptCorrect
                                ? 'bg-emerald-100/70 border-emerald-300 font-bold text-emerald-950'
                                : isStudentSelected
                                ? 'bg-rose-100/70 border-rose-300 font-bold text-rose-950'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-bold">{opt.optionKey}.</span>
                              <div className="flex-1 leading-relaxed">
                                <MathMarkdownRenderer content={opt.optionText} />
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isStudentSelected && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isOptCorrect
                                      ? 'bg-emerald-700 text-white'
                                      : 'bg-rose-700 text-white'
                                  }`}
                                >
                                  Bạn đã chọn
                                </span>
                              )}
                              {isOptCorrect && !isStudentSelected && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                                  Đáp án đúng
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(ans.questionType === 'SHORT_ANSWER' ||
                    ans.questionType === 'FILL_IN_THE_BLANK') && (
                    <div className="p-3 bg-white border rounded-xl space-y-1 text-xs">
                      <div>
                        <strong className="text-slate-600">Câu trả lời của bạn: </strong>
                        <span
                          className={`font-bold ${
                            ans.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {ans.studentAnswerText || '(Chưa điền câu trả lời)'}
                        </span>
                      </div>
                      {ans.correctOptionText && (
                        <div>
                          <strong className="text-slate-600">Đáp án chính xác: </strong>
                          <span className="font-bold text-emerald-700">
                            {ans.correctOptionText}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {ans.questionType === 'ESSAY' && (
                    <div className="p-3 bg-white border rounded-xl space-y-1 text-xs">
                      <strong className="text-slate-600 block">Bài làm tự luận của bạn:</strong>
                      <div className="text-slate-800">
                        {ans.studentAnswerText ? (
                          <MathMarkdownRenderer content={ans.studentAnswerText} />
                        ) : (
                          <span className="italic text-slate-400">(Không có nội dung)</span>
                        )}
                      </div>
                    </div>
                  )}

                  {ans.explanation && (
                    <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-amber-900 text-xs space-y-1">
                      <strong className="font-bold block text-amber-800">💡 Lời giải chi tiết:</strong>
                      <div className="text-amber-950 leading-relaxed">
                        <MathMarkdownRenderer content={ans.explanation} />
                      </div>
                    </div>
                  )}

                  {/* AI Tutor explain action */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(
                            new CustomEvent('open-ai-tutor', {
                              detail: {
                                mode: !ans.isCorrect ? 'EXPLAIN_WRONG_ANSWER' : 'GENERAL_QA',
                                examAttemptId: reviewData?.attemptId,
                                questionId: ans.questionId,
                                initialQuestion: !ans.isCorrect
                                  ? `Tại sao câu trả lời của mình ở câu hỏi "${ans.content}" lại chưa chính xác? Nhờ AI Tutor phân tích lỗi sai và hướng dẫn cách tư duy đúng nhé!`
                                  : `Hãy giải thích sâu hơn và mở rộng kiến thức liên quan đến câu hỏi "${ans.content}" giúp mình nhé!`,
                              },
                            })
                          );
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                      title="Nhờ AI Tutor giải thích câu hỏi này"
                    >
                      <span className="group-hover:scale-110 transition-transform">🤖</span>
                      <span>Nhờ AI Tutor giải thích {!ans.isCorrect ? 'lỗi sai' : 'thêm'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
