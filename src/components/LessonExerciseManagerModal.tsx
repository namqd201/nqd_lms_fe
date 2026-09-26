'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { exerciseService } from '@/services/exercise.service';
import { questionService } from '@/services/question.service';
import {
  TeacherExerciseResponse,
  TeacherExerciseRequest,
  ExerciseStatus,
  ExerciseType,
  TeacherExerciseQuestionResponse,
} from '@/types/exercise';
import { TeacherQuestionResponse } from '@/types/question';
import { TeacherLessonResponse } from '@/types/course';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import { AiQuestionGeneratorModal } from '@/components/AiQuestionGeneratorModal';
import { subjectService } from '@/services/subject.service';
import { courseService } from '@/services/course.service';
import { SubjectResponse } from '@/types/admin';
import { TeacherCourseResponse } from '@/types/course';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Dumbbell,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit,
  Trash2,
  Archive,
  Send,
  X,
  Sparkles,
  ListChecks,
  CheckCircle,
  Clock,
  Award,
  RefreshCw,
  Play,
  User,
} from 'lucide-react';

interface LessonExerciseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: TeacherLessonResponse | null;
  subjectId?: string;
  gradeLevel?: string;
  courseId?: string;
}

const STATUS_CONFIGS: { status: ExerciseStatus; label: string; color: string; badge: string }[] = [
  { status: 'DRAFT', label: 'Bản nháp', color: 'bg-slate-100 text-slate-700', badge: 'border-slate-300' },
  { status: 'PUBLISHED', label: 'Đang phát hành', color: 'bg-emerald-50 text-emerald-700', badge: 'border-emerald-300' },
  { status: 'ARCHIVED', label: 'Đã lưu trữ', color: 'bg-purple-50 text-purple-700', badge: 'border-purple-300' },
];

const TYPE_CONFIGS: { type: ExerciseType; label: string; color: string }[] = [
  { type: 'PRACTICE', label: 'Luyện tập', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { type: 'HOMEWORK', label: 'Bài về nhà', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { type: 'QUIZ', label: 'Câu hỏi nhanh', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

export const LessonExerciseManagerModal: React.FC<LessonExerciseManagerModalProps> = ({
  isOpen,
  onClose,
  lesson,
  subjectId,
  gradeLevel,
  courseId,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');

  const [exercises, setExercises] = useState<TeacherExerciseResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Question Generator state
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [courses, setCourses] = useState<TeacherCourseResponse[]>([]);

  // Form Create / Edit Exercise
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formInstructions, setFormInstructions] = useState<string>('');
  const [formType, setFormType] = useState<ExerciseType>('PRACTICE');
  const [formTimeLimit, setFormTimeLimit] = useState<string>('');
  const [formPassingScore, setFormPassingScore] = useState<string>('5.0');
  const [formMaxAttempts, setFormMaxAttempts] = useState<string>('');
  const [formShowExplanation, setFormShowExplanation] = useState<boolean>(true);
  const [formAllowRetry, setFormAllowRetry] = useState<boolean>(true);

  // Question Picker Sub-Modal
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false);
  const [selectedExerciseForQuestions, setSelectedExerciseForQuestions] = useState<TeacherExerciseResponse | null>(null);
  const [attachedQuestions, setAttachedQuestions] = useState<TeacherExerciseQuestionResponse[]>([]);
  const [allQuestions, setAllQuestions] = useState<TeacherQuestionResponse[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState<boolean>(false);
  const [qbSearchQuery, setQbSearchQuery] = useState<string>('');
  const [qbDifficulty, setQbDifficulty] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      subjectService.getActiveSubjects().then((data: SubjectResponse[]) => setSubjects(data || [])).catch(() => {});
      courseService.getTeacherCourses().then((data: TeacherCourseResponse[]) => setCourses(data || [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && lesson?.id) {
      loadExercises();
    }
  }, [isOpen, lesson?.id]);

  const handleReloadQuestionsAfterAi = async () => {
    if (!selectedExerciseForQuestions) return;
    try {
      setIsQuestionsLoading(true);
      const [fullEx, bankQuestions] = await Promise.all([
        exerciseService.getTeacherExerciseById(selectedExerciseForQuestions.id),
        questionService.getQuestions({
          subjectId: subjectId || undefined,
          gradeLevel: gradeLevel || undefined,
        }).catch(() => []),
      ]);
      setAttachedQuestions(fullEx.questions || []);
      setAllQuestions(bankQuestions || []);
      await loadExercises();
      setSuccessMessage('Đã thêm câu hỏi từ AI vào Ngân hàng! Bạn có thể chọn câu hỏi để gắn vào bài tập.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      console.error('Failed to reload questions after AI approval:', err);
    } finally {
      setIsQuestionsLoading(false);
    }
  };

  const loadExercises = async () => {
    if (!lesson?.id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await exerciseService.getTeacherExercises({ lessonId: lesson.id });
      setExercises(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách bài tập';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateExercise = () => {
    setEditingExerciseId(null);
    setFormTitle(`Bài tập luyện tập - ${lesson?.title || ''}`.trim());
    setFormDescription('');
    setFormInstructions('Hãy làm bài cẩn thận và bấm Nộp bài sau khi hoàn thành.');
    setFormType('PRACTICE');
    setFormTimeLimit('15');
    setFormPassingScore('5.0');
    setFormMaxAttempts('');
    setFormShowExplanation(true);
    setFormAllowRetry(true);
    setShowFormModal(true);
  };

  const handleOpenEditExercise = (ex: TeacherExerciseResponse) => {
    setEditingExerciseId(ex.id);
    setFormTitle(ex.title);
    setFormDescription(ex.description || '');
    setFormInstructions(ex.instructions || '');
    setFormType(ex.type || 'PRACTICE');
    setFormTimeLimit(ex.timeLimitMinutes ? String(ex.timeLimitMinutes) : '');
    setFormPassingScore(ex.passingScore ? String(ex.passingScore) : '5.0');
    setFormMaxAttempts(ex.maxAttempts ? String(ex.maxAttempts) : '');
    setFormShowExplanation(ex.showExplanationImmediately ?? true);
    setFormAllowRetry(ex.allowRetry ?? true);
    setShowFormModal(true);
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson?.id) return;
    if (!formTitle.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề bài tập');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: TeacherExerciseRequest = {
      lessonId: lesson.id,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      instructions: formInstructions.trim() || undefined,
      type: formType,
      timeLimitMinutes: formTimeLimit ? parseInt(formTimeLimit, 10) : undefined,
      passingScore: formPassingScore ? parseFloat(formPassingScore) : undefined,
      maxAttempts: formMaxAttempts ? parseInt(formMaxAttempts, 10) : undefined,
      showExplanationImmediately: formShowExplanation,
      allowRetry: formAllowRetry,
    };

    try {
      if (editingExerciseId) {
        await exerciseService.updateExercise(editingExerciseId, payload);
        setSuccessMessage('Đã cập nhật bài tập thành công!');
      } else {
        await exerciseService.createExercise(payload);
        setSuccessMessage('Đã tạo bài tập mới thành công!');
      }
      setShowFormModal(false);
      await loadExercises();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi lưu bài tập';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await exerciseService.publishExercise(id);
      setSuccessMessage('Đã phát hành bài tập cho học viên');
      await loadExercises();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể phát hành';
      setErrorMessage(msg);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await exerciseService.archiveExercise(id);
      setSuccessMessage('Đã lưu trữ bài tập');
      await loadExercises();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu trữ';
      setErrorMessage(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài tập này không?')) return;
    try {
      await exerciseService.deleteExercise(id);
      setSuccessMessage('Đã xóa bài tập thành công');
      await loadExercises();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa bài tập';
      setErrorMessage(msg);
    }
  };

  // Manage Questions inside an Exercise
  const handleOpenQuestionsModal = async (ex: TeacherExerciseResponse) => {
    setSelectedExerciseForQuestions(ex);
    setIsQuestionsLoading(true);
    setShowQuestionModal(true);
    try {
      const [fullEx, bankQuestions] = await Promise.all([
        exerciseService.getTeacherExerciseById(ex.id),
        questionService.getQuestions({
          subjectId: subjectId || undefined,
          gradeLevel: gradeLevel || undefined,
        }).catch(() => []),
      ]);
      setAttachedQuestions(fullEx.questions || []);
      setAllQuestions(bankQuestions || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải câu hỏi';
      setErrorMessage(msg);
    } finally {
      setIsQuestionsLoading(false);
    }
  };

  const handleAddQuestionToExercise = async (questionId: string, customMarks?: number) => {
    if (!selectedExerciseForQuestions) return;
    try {
      const qInBank = allQuestions.find((q) => q.id === questionId);
      const marksToSet = customMarks !== undefined ? customMarks : (qInBank?.defaultMarks || 1.0);
      const updated = await exerciseService.addQuestionToExercise(selectedExerciseForQuestions.id, {
        questionId,
        marks: marksToSet,
      });
      setAttachedQuestions(updated.questions || []);
      await loadExercises();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể thêm câu hỏi';
      setErrorMessage(msg);
    }
  };

  const handleUpdateQuestionMarks = async (questionId: string, newMarks: number) => {
    if (!selectedExerciseForQuestions || newMarks <= 0) return;
    try {
      const updated = await exerciseService.addQuestionToExercise(selectedExerciseForQuestions.id, {
        questionId,
        marks: newMarks,
      });
      setAttachedQuestions(updated.questions || []);
      await loadExercises();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật điểm';
      setErrorMessage(msg);
    }
  };

  const handleRemoveQuestionFromExercise = async (questionId: string) => {
    if (!selectedExerciseForQuestions) return;
    try {
      const updated = await exerciseService.removeQuestionFromExercise(
        selectedExerciseForQuestions.id,
        questionId
      );
      setAttachedQuestions(updated.questions || []);
      await loadExercises();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gỡ câu hỏi';
      setErrorMessage(msg);
    }
  };

  const availableBankQuestions = useMemo(() => {
    const attachedIds = new Set(attachedQuestions.map((q) => q.questionId));
    return allQuestions.filter((q) => {
      if (attachedIds.has(q.id)) return false;
      const matchSearch =
        !qbSearchQuery.trim() || q.content.toLowerCase().includes(qbSearchQuery.toLowerCase());
      const matchDiff = qbDifficulty === 'ALL' || q.difficulty === qbDifficulty;
      return matchSearch && matchDiff;
    });
  }, [allQuestions, attachedQuestions, qbSearchQuery, qbDifficulty]);

  if (!isOpen || !lesson) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                  Quản lý Bài tập
                </span>
                <span className="text-xs text-slate-400 font-semibold">•</span>
                <span className="text-xs font-medium text-slate-500">Bài {lesson.displayOrder}</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 line-clamp-1">{lesson.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateExercise}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm bài tập</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Notifications */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Đang tải danh sách bài tập của bài học...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="py-16 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-3xl p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Chưa có bài tập nào trong bài học này</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tạo bài tập tự luyện, bài tập về nhà hoặc quiz nhanh để giúp học viên củng cố kiến thức ngay sau khi học xong!
              </p>
              <button
                onClick={handleOpenCreateExercise}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo bài tập đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {exercises.map((ex) => {
                const statusCfg = STATUS_CONFIGS.find((c) => c.status === ex.status) || STATUS_CONFIGS[0];
                const typeCfg = TYPE_CONFIGS.find((c) => c.type === ex.type) || TYPE_CONFIGS[0];
                const isAuthor = Boolean(user?.id && ex.creatorId === user.id);
                const canManageExercise = isAuthor || isAdmin;

                return (
                  <div
                    key={ex.id}
                    className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-indigo-300 hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${statusCfg.color} ${statusCfg.badge}`}
                        >
                          {statusCfg.label}
                        </span>
                        {ex.creatorName && (
                          <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{ex.creatorName}</span>
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-semibold">•</span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {ex.questionCount || 0} câu hỏi
                        </span>
                        {ex.timeLimitMinutes && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{ex.timeLimitMinutes} phút</span>
                          </span>
                        )}
                        {ex.passingScore && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-500" />
                            <span>Đạt: {ex.passingScore} đ</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-extrabold text-slate-900 truncate" title={ex.title}>
                        {ex.title}
                      </h4>

                      {ex.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{ex.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {canManageExercise ? (
                        <>
                          <button
                            onClick={() => handleOpenQuestionsModal(ex)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition cursor-pointer"
                            title="Quản lý câu hỏi trong bài tập này"
                          >
                            <ListChecks className="w-3.5 h-3.5" />
                            <span>Bộ câu hỏi ({ex.questionCount || 0})</span>
                          </button>

                          {ex.status !== 'PUBLISHED' ? (
                            <button
                              onClick={() => handlePublish(ex.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
                              title="Phát hành bài tập"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Xuất bản</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchive(ex.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition cursor-pointer"
                              title="Lưu trữ bài tập"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              <span>Lưu trữ</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditExercise(ex)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                            title="Chỉnh sửa thông số bài tập"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(ex.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Xóa bài tập"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 italic">
                            Chỉ tác giả được sửa
                          </span>
                          <Link
                            href={`/courses/${courseId || ex.courseId}/exercises/${ex.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition shadow-2xs"
                          >
                            <Play className="w-3.5 h-3.5 fill-indigo-600" />
                            <span>Làm bài tập</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số bài tập: <strong>{exercises.length}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>

      {/* Sub-modal: Create/Edit Exercise */}
      {showFormModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-indigo-600" />
                <span>{editingExerciseId ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}</span>
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Tiêu đề bài tập *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập phép cộng phân số..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Loại bài tập</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ExerciseType)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  >
                    <option value="PRACTICE">Luyện tập (Tự do)</option>
                    <option value="HOMEWORK">Bài tập về nhà</option>
                    <option value="QUIZ">Câu hỏi nhanh (Quiz)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Thời gian giới hạn (phút)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Để trống = Không giới hạn"
                    value={formTimeLimit}
                    onChange={(e) => setFormTimeLimit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Điểm đạt (Passing score)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formPassingScore}
                    onChange={(e) => setFormPassingScore(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số lượt làm tối đa</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Để trống = Vô hạn lượt"
                    value={formMaxAttempts}
                    onChange={(e) => setFormMaxAttempts(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả nội dung bài tập..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Hướng dẫn làm bài</label>
                <textarea
                  rows={2}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Lời dặn dành cho học viên..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShowExplanation}
                    onChange={(e) => setFormShowExplanation(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-700">Hiển thị lời giải chi tiết và AI tutor ngay sau khi làm xong</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAllowRetry}
                    onChange={(e) => setFormAllowRetry(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-700">Cho phép học viên làm lại để cải thiện điểm số</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang lưu...' : editingExerciseId ? 'Cập nhật bài tập' : 'Tạo bài tập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Manage Questions from Question Bank */}
      {showQuestionModal && selectedExerciseForQuestions && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                  <ListChecks className="w-4 h-4" />
                  <span>CÂU HỎI CHO BÀI TẬP</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedExerciseForQuestions.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  title="Sử dụng AI để sinh câu hỏi theo chủ đề bài học này"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                  <span>AI Sinh câu hỏi</span>
                </button>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Attached Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Đã chọn ({attachedQuestions.length})</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-semibold">
                    Tổng điểm: {Number(attachedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0).toFixed(2))} đ
                  </span>
                </div>

                {attachedQuestions.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 bg-slate-50/50">
                    Chưa có câu hỏi nào trong bài tập này. Chọn câu hỏi từ Ngân hàng bên phải để gắn vào.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                    {attachedQuestions.map((q, idx) => (
                      <div
                        key={q.questionId}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-indigo-600">Câu {idx + 1}</span>
                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-[10px] text-slate-600">
                              {q.difficulty}
                            </span>
                            <div className="flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg shadow-2xs">
                              <input
                                type="number"
                                min="0.25"
                                step="0.25"
                                key={`${q.questionId}-${q.marks}`}
                                defaultValue={q.marks || 1}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val > 0 && val !== q.marks) {
                                    handleUpdateQuestionMarks(q.questionId, val);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className="w-12 text-center text-xs font-bold text-indigo-700 bg-transparent focus:outline-none"
                                title="Nhập số điểm cho câu hỏi này và bấm Enter hoặc click ra ngoài để lưu"
                              />
                              <span className="text-[10px] font-semibold text-slate-400">đ</span>
                            </div>
                          </div>
                          <div className="text-slate-800 font-semibold line-clamp-2">
                            <MathMarkdownRenderer content={q.content} />
                          </div>
                          {q.options && q.options.length > 0 && (
                            <div className="text-[11px] text-slate-500">
                              {q.options.length} lựa chọn ({q.options.find((o) => o.isCorrect)?.optionKey} đúng)
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveQuestionFromExercise(q.questionId)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                          title="Gỡ khỏi bài tập"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Question Bank */}
              <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Ngân hàng câu hỏi ({availableBankQuestions.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setAiModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition cursor-pointer"
                    title="Dùng AI sinh câu hỏi theo bài học này"
                  >
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>AI tạo câu hỏi</span>
                  </button>
                </div>

                {/* Search & Filter */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm câu hỏi..."
                      value={qbSearchQuery}
                      onChange={(e) => setQbSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <select
                      value={qbDifficulty}
                      onChange={(e) => setQbDifficulty(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="ALL">Mọi độ khó</option>
                      <option value="EASY">Dễ</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HARD">Khó</option>
                    </select>
                  </div>
                </div>

                {isQuestionsLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-indigo-600" />
                    Đang tải câu hỏi...
                  </div>
                ) : availableBankQuestions.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 bg-slate-50/50">
                    Không tìm thấy câu hỏi phù hợp trong ngân hàng câu hỏi.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                    {availableBankQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl flex items-start justify-between gap-3 text-xs shadow-2xs transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px]">
                              {q.difficulty}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px]">
                              {q.defaultMarks || 1} đ
                            </span>
                            <span className="text-slate-400 text-[10px]">{q.questionType}</span>
                          </div>
                          <div className="text-slate-800 font-medium line-clamp-2">
                            <MathMarkdownRenderer content={q.content} />
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddQuestionToExercise(q.id, q.defaultMarks)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition shrink-0 cursor-pointer"
                          title={`Thêm câu hỏi này (${q.defaultMarks || 1} điểm) vào bài tập`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm ({q.defaultMarks || 1}đ)</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Thêm câu hỏi xong hãy bấm <strong>Xong</strong> để hoàn tất.
              </span>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Question Generator Modal */}
      <AiQuestionGeneratorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        zIndex="z-[100]"
        subjects={subjects}
        courses={courses}
        lessons={lesson ? [lesson] : []}
        defaultSubjectId={subjectId}
        defaultGradeLevel={gradeLevel}
        defaultCourseId={courseId}
        defaultLessonId={lesson?.id}
        defaultTopic={lesson?.title || ''}
        doneButtonText="Hoàn tất & Quay lại bài tập"
        onQuestionsApproved={handleReloadQuestionsAfterAi}
      />
    </>
  );
};
