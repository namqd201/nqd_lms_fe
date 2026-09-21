'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { exerciseService } from '@/services/exercise.service';
import { questionService } from '@/services/question.service';
import { subjectService } from '@/services/subject.service';
import { courseService } from '@/services/course.service';
import {
  TeacherExerciseResponse,
  TeacherExerciseRequest,
  ExerciseStatus,
  ExerciseType,
  TeacherExerciseQuestionResponse,
} from '@/types/exercise';
import { TeacherQuestionResponse } from '@/types/question';
import { SubjectResponse } from '@/types/admin';
import { TeacherCourseResponse, TeacherChapterResponse, TeacherLessonResponse } from '@/types/course';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import { AiQuestionGeneratorModal } from '@/components/AiQuestionGeneratorModal';
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
  Eye,
  Sparkles,
  HelpCircle,
  Check,
  GraduationCap,
  BookOpen,
  Clock,
  Award,
  Layers,
  Send,
  RefreshCw,
  Sliders,
  ChevronRight,
  ListChecks,
  Users,
  BarChart3,
  X,
  FileQuestion,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

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

export default function TeacherExercisesPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');

  const [exercises, setExercises] = useState<TeacherExerciseResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [courses, setCourses] = useState<TeacherCourseResponse[]>([]);
  const [allQuestions, setAllQuestions] = useState<TeacherQuestionResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create / Edit Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal Form State
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formChapterId, setFormChapterId] = useState<string>('');
  const [formLessonId, setFormLessonId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formInstructions, setFormInstructions] = useState<string>('');
  const [formType, setFormType] = useState<ExerciseType>('PRACTICE');
  const [formTimeLimit, setFormTimeLimit] = useState<string>('');
  const [formPassingScore, setFormPassingScore] = useState<string>('');
  const [formMaxAttempts, setFormMaxAttempts] = useState<string>('');
  const [formShowExplanation, setFormShowExplanation] = useState<boolean>(true);
  const [formAllowRetry, setFormAllowRetry] = useState<boolean>(true);

  // Cascading chapters & lessons for modal
  const [courseChapters, setCourseChapters] = useState<TeacherChapterResponse[]>([]);
  const [selectedChapterLessons, setSelectedChapterLessons] = useState<TeacherLessonResponse[]>([]);
  const [isLoadingStructure, setIsLoadingStructure] = useState<boolean>(false);

  // Question Bank Picker Modal
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [selectedExerciseForQuestions, setSelectedExerciseForQuestions] = useState<TeacherExerciseResponse | null>(null);
  const [attachedQuestions, setAttachedQuestions] = useState<TeacherExerciseQuestionResponse[]>([]);
  const [qbSearchQuery, setQbSearchQuery] = useState<string>('');
  const [qbDifficulty, setQbDifficulty] = useState<string>('ALL');

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [exData, subData, cData, qData] = await Promise.all([
        exerciseService.getTeacherExercises(),
        subjectService.getActiveSubjects().catch(() => []),
        courseService.getTeacherCourses().catch(() => []),
        questionService.getQuestions({}).catch(() => []),
      ]);
      setExercises(exData || []);
      setSubjects(subData || []);
      setCourses(cData || []);
      setAllQuestions(qData || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách bài tập';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadExercises = async () => {
    try {
      const data = await exerciseService.getTeacherExercises();
      setExercises(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch =
        !searchQuery.trim() ||
        ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.lessonTitle && ex.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ex.courseTitle && ex.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSubject = selectedSubject === 'ALL' || ex.subjectId === selectedSubject;
      const matchCourse = selectedCourse === 'ALL' || ex.courseId === selectedCourse;
      const matchStatus = selectedStatus === 'ALL' || ex.status === selectedStatus;

      return matchSearch && matchSubject && matchCourse && matchStatus;
    });
  }, [exercises, searchQuery, selectedSubject, selectedCourse, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = exercises.length;
    const published = exercises.filter((e) => e.status === 'PUBLISHED').length;
    const draft = exercises.filter((e) => e.status === 'DRAFT').length;
    const archived = exercises.filter((e) => e.status === 'ARCHIVED').length;
    return { total, published, draft, archived };
  }, [exercises]);

  // When course changes in modal, load structure
  useEffect(() => {
    if (!formCourseId) {
      setCourseChapters([]);
      setSelectedChapterLessons([]);
      return;
    }
    const fetchStructure = async () => {
      setIsLoadingStructure(true);
      try {
        const detail = await courseService.getTeacherCourseStructure(formCourseId);
        if (detail && detail.chapters) {
          setCourseChapters(detail.chapters);
          // If editing and chapter is set, load lessons
          if (formChapterId) {
            const ch = detail.chapters.find((c: TeacherChapterResponse) => c.id === formChapterId);
            setSelectedChapterLessons(ch?.lessons || []);
          }
        }
      } catch (err) {
        console.error('Error fetching course structure:', err);
      } finally {
        setIsLoadingStructure(false);
      }
    };
    fetchStructure();
  }, [formCourseId]);

  // When chapter changes, update lessons
  const handleChapterChange = (chId: string) => {
    setFormChapterId(chId);
    setFormLessonId('');
    const ch = courseChapters.find((c) => c.id === chId);
    setSelectedChapterLessons(ch?.lessons || []);
  };

  const handleOpenCreateModal = () => {
    setEditingExerciseId(null);
    setFormSubjectId(subjects[0]?.id || '');
    setFormCourseId(courses[0]?.id || '');
    setFormChapterId('');
    setFormLessonId('');
    setFormTitle('');
    setFormDescription('');
    setFormInstructions('');
    setFormType('PRACTICE');
    setFormTimeLimit('');
    setFormPassingScore('5.0');
    setFormMaxAttempts('');
    setFormShowExplanation(true);
    setFormAllowRetry(true);
    setShowModal(true);
  };

  const handleOpenEditModal = async (ex: TeacherExerciseResponse) => {
    setEditingExerciseId(ex.id);
    setFormSubjectId(ex.subjectId || '');
    setFormCourseId(ex.courseId || '');
    setFormChapterId(ex.chapterId || '');
    setFormLessonId(ex.lessonId || '');
    setFormTitle(ex.title);
    setFormDescription(ex.description || '');
    setFormInstructions(ex.instructions || '');
    setFormType(ex.type || 'PRACTICE');
    setFormTimeLimit(ex.timeLimitMinutes ? String(ex.timeLimitMinutes) : '');
    setFormPassingScore(ex.passingScore ? String(ex.passingScore) : '');
    setFormMaxAttempts(ex.maxAttempts ? String(ex.maxAttempts) : '');
    setFormShowExplanation(ex.showExplanationImmediately ?? true);
    setFormAllowRetry(ex.allowRetry ?? true);

    // Fetch full detail with questions
    try {
      const fullEx = await exerciseService.getTeacherExerciseById(ex.id);
      if (fullEx && fullEx.chapterId) {
        setFormChapterId(fullEx.chapterId);
      }
    } catch (err) {
      console.error(err);
    }

    setShowModal(true);
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLessonId) {
      setErrorMessage('Vui lòng chọn bài học cho bài tập này');
      return;
    }
    if (!formTitle.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề bài tập');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: TeacherExerciseRequest = {
      lessonId: formLessonId,
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
        setSuccessMessage('Đã cập nhật bài tập thành công');
      } else {
        await exerciseService.createExercise(payload);
        setSuccessMessage('Đã tạo bài tập mới thành công');
      }
      setShowModal(false);
      reloadExercises();
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
      setSuccessMessage('Đã phát hành bài tập cho học viên luyện tập');
      reloadExercises();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể phát hành bài tập';
      setErrorMessage(msg);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await exerciseService.archiveExercise(id);
      setSuccessMessage('Đã chuyển bài tập sang trạng thái lưu trữ');
      reloadExercises();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu trữ bài tập';
      setErrorMessage(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài tập này không?')) return;
    try {
      await exerciseService.deleteExercise(id);
      setSuccessMessage('Đã xóa bài tập thành công');
      reloadExercises();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa bài tập';
      setErrorMessage(msg);
    }
  };

  // Manage Questions Modal
  const handleOpenQuestionsModal = async (ex: TeacherExerciseResponse) => {
    setSelectedExerciseForQuestions(ex);
    try {
      const fullEx = await exerciseService.getTeacherExerciseById(ex.id);
      setAttachedQuestions(fullEx.questions || []);
      setShowQuestionModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải câu hỏi bài tập';
      setErrorMessage(msg);
    }
  };

  const handleAddQuestionToExercise = async (questionId: string) => {
    if (!selectedExerciseForQuestions) return;
    try {
      const updated = await exerciseService.addQuestionToExercise(selectedExerciseForQuestions.id, {
        questionId,
        marks: 1.0,
      });
      setAttachedQuestions(updated.questions || []);
      setSuccessMessage('Đã thêm câu hỏi vào bài tập');
      reloadExercises();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể thêm câu hỏi';
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
      setSuccessMessage('Đã gỡ câu hỏi khỏi bài tập');
      reloadExercises();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gỡ câu hỏi';
      setErrorMessage(msg);
    }
  };

  const handleReloadQuestionsAfterAi = async () => {
    try {
      const bankQuestions = await questionService.getQuestions().catch(() => []);
      setAllQuestions(bankQuestions || []);
      if (selectedExerciseForQuestions) {
        const fullEx = await exerciseService.getTeacherExerciseById(selectedExerciseForQuestions.id);
        setAttachedQuestions(fullEx.questions || []);
      }
      reloadExercises();
      setSuccessMessage('Đã cập nhật câu hỏi mới từ AI vào ngân hàng câu hỏi!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to reload questions after AI approval:', err);
    }
  };

  // Filter available questions from question bank
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

  return (
    <RoleGuard allowedRoles={['TEACHER', 'ADMIN']}>
      <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-sm text-indigo-600 font-semibold mb-1">
                <Dumbbell className="w-4 h-4" />
                <span>QUẢN LÝ LUYỆN TẬP & BÀI TẬP</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Danh Sách Bài Tập Theo Bài Học</h1>
              <p className="text-sm text-slate-500 mt-1">
                Tạo và cấu hình bài tập luyện tập tự động chấm điểm, hiển thị giải thích tức thì và trợ lý AI cho học viên.
              </p>
              <div className="mt-3 p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Mẹo mới:</strong> Bạn có thể tạo và quản lý bài tập trực tiếp ngay trong từng bài học tại{' '}
                    <Link href="/teacher/courses" className="font-bold underline hover:text-indigo-700">
                      Quản lý Giáo trình
                    </Link>!
                  </span>
                </div>
                <Link
                  href="/teacher/courses"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shrink-0 shadow-xs"
                >
                  Tới Giáo trình
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={reloadExercises}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                title="Tải lại danh sách"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Làm mới</span>
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo bài tập mới</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">TỔNG SỐ BÀI TẬP</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <div className="text-xs font-medium text-emerald-700">ĐANG PHÁT HÀNH</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.published}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">BẢN NHÁP</div>
              <div className="text-2xl font-bold text-slate-700 mt-1">{stats.draft}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs">
              <div className="text-xs font-medium text-purple-700">ĐÃ LƯU TRỮ</div>
              <div className="text-2xl font-bold text-purple-700 mt-1">{stats.archived}</div>
            </div>
          </div>

          {/* Feedback alerts */}
          {successMessage && (
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề, bài học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Subject Filter */}
              <div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả môn học</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Filter */}
              <div>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả khóa học</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  {STATUS_CONFIGS.map((cfg) => (
                    <option key={cfg.status} value={cfg.status}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Exercises List */}
          {isLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Đang tải danh sách bài tập...</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">Không tìm thấy bài tập nào</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Chưa có bài tập nào phù hợp với bộ lọc. Hãy tạo bài tập mới để học viên có thể ôn luyện!
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo bài tập đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredExercises.map((ex) => {
                const statusCfg = STATUS_CONFIGS.find((c) => c.status === ex.status) || STATUS_CONFIGS[0];
                const typeCfg = TYPE_CONFIGS.find((c) => c.type === ex.type) || TYPE_CONFIGS[0];

                return (
                  <div
                    key={ex.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-5 space-y-3">
                      {/* Tags */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusCfg.color} ${statusCfg.badge}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1" title={ex.title}>
                          {ex.title}
                        </h3>
                        {ex.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{ex.description}</p>
                        )}
                      </div>

                      {/* Breadcrumbs / Info */}
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">
                            {ex.courseTitle || 'Khóa học'} {ex.lessonTitle ? `> ${ex.lessonTitle}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                          <span className="flex items-center gap-1">
                            <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                            <strong>{ex.questionCount || 0}</strong> câu hỏi
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-slate-400" />
                            <strong>{ex.totalMarks || 0}</strong> điểm
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {ex.timeLimitMinutes ? `${ex.timeLimitMinutes} phút` : 'Không giới hạn'}
                          </span>
                          <span className="flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                            {ex.maxAttempts ? `Tối đa ${ex.maxAttempts} lần` : 'Làm lại tự do'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenQuestionsModal(ex)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>Gán câu hỏi ({ex.questionCount})</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(ex)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition"
                          title="Chỉnh sửa bài tập"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {ex.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePublish(ex.id)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Phát hành bài tập"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {ex.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleArchive(ex.id)}
                            className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                            title="Lưu trữ bài tập"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(ex.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa bài tập"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Create / Edit Exercise */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingExerciseId ? 'Chỉnh Sửa Bài Tập' : 'Tạo Bài Tập Luyện Tập Mới'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExercise} className="p-5 space-y-4">
                {/* Cascade: Course -> Chapter -> Lesson */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Khóa học *</label>
                    <select
                      value={formCourseId}
                      onChange={(e) => {
                        setFormCourseId(e.target.value);
                        setFormChapterId('');
                        setFormLessonId('');
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    >
                      <option value="">-- Chọn khóa học --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Chương học *</label>
                    <select
                      value={formChapterId}
                      onChange={(e) => handleChapterChange(e.target.value)}
                      disabled={!formCourseId || isLoadingStructure}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-100"
                      required
                    >
                      <option value="">-- Chọn chương học --</option>
                      {courseChapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bài học cụ thể *</label>
                    <select
                      value={formLessonId}
                      onChange={(e) => setFormLessonId(e.target.value)}
                      disabled={!formChapterId || selectedChapterLessons.length === 0}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-100"
                      required
                    >
                      <option value="">-- Chọn bài học gán bài tập --</option>
                      {selectedChapterLessons.map((lsn) => (
                        <option key={lsn.id} value={lsn.id}>
                          {lsn.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề bài tập *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="VD: Bài tập tự luyện phương trình bậc hai"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>

                {/* Description & Instructions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả ngắn</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Mô tả mục tiêu của bài tập..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hướng dẫn làm bài</label>
                    <textarea
                      rows={2}
                      value={formInstructions}
                      onChange={(e) => setFormInstructions(e.target.value)}
                      placeholder="Chọn phương án đúng nhất, có thể nhờ AI giải thích..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Config: Type, Time limit, Passing score, Max attempts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Loại bài tập</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as ExerciseType)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="PRACTICE">Luyện tập</option>
                      <option value="HOMEWORK">Bài về nhà</option>
                      <option value="QUIZ">Quiz nhanh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian (phút)</label>
                    <input
                      type="number"
                      min="0"
                      value={formTimeLimit}
                      onChange={(e) => setFormTimeLimit(e.target.value)}
                      placeholder="0 = Không giới hạn"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm đạt</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formPassingScore}
                      onChange={(e) => setFormPassingScore(e.target.value)}
                      placeholder="VD: 5.0"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số lần làm lại</label>
                    <input
                      type="number"
                      min="0"
                      value={formMaxAttempts}
                      onChange={(e) => setFormMaxAttempts(e.target.value)}
                      placeholder="Trống = Tự do"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Checkbox settings */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formShowExplanation}
                      onChange={(e) => setFormShowExplanation(e.target.checked)}
                      className="rounded-sm text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      <strong>Hiển thị giải thích & đáp án ngay:</strong> Cho phép học viên bấm "Kiểm tra" và xem giải thích chi tiết ngay tại từng câu hỏi.
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAllowRetry}
                      onChange={(e) => setFormAllowRetry(e.target.checked)}
                      className="rounded-sm text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      <strong>Cho phép luyện tập lại:</strong> Học viên có thể làm lại nhiều lần để nắm vững kiến thức.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50 transition"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <span>{editingExerciseId ? 'Lưu thay đổi' : 'Tạo bài tập'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Question Bank Picker Modal */}
        {showQuestionModal && selectedExerciseForQuestions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                    <ListChecks className="w-4 h-4" />
                    <span>QUẢN LÝ CÂU HỎI BÀI TẬP</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedExerciseForQuestions.title}
                  </h3>
                </div>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Attached Questions in this exercise */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Câu hỏi trong bài tập ({attachedQuestions.length})</span>
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      Tổng điểm: {attachedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0)}
                    </span>
                  </div>

                  {attachedQuestions.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                      Chưa có câu hỏi nào. Hãy chọn câu hỏi từ Ngân hàng bên phải để thêm vào.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                      {attachedQuestions.map((q, idx) => (
                        <div
                          key={q.questionId}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-600">Câu {idx + 1}:</span>
                              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium text-[10px]">
                                {q.difficulty}
                              </span>
                              <span className="text-slate-500">({q.marks || 1} điểm)</span>
                            </div>
                            <div className="text-slate-800 font-medium line-clamp-2">
                              <MathMarkdownRenderer content={q.content} />
                            </div>
                            {q.options && q.options.length > 0 && (
                              <div className="text-[11px] text-slate-500 mt-1">
                                {q.options.length} lựa chọn ({q.options.find((o) => o.isCorrect)?.optionKey} đúng)
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleRemoveQuestionFromExercise(q.questionId)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition shrink-0"
                            title="Gỡ khỏi bài tập"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Pick from Question Bank */}
                <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Ngân hàng câu hỏi ({availableBankQuestions.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setAiModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                      title="Dùng AI sinh câu hỏi tự động"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                      <span>AI tạo câu hỏi</span>
                    </button>
                  </div>

                  {/* Search / filter in QB */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm câu hỏi..."
                        value={qbSearchQuery}
                        onChange={(e) => setQbSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <select
                        value={qbDifficulty}
                        onChange={(e) => setQbDifficulty(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="ALL">Mọi độ khó</option>
                        <option value="EASY">Dễ</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HARD">Khó</option>
                      </select>
                    </div>
                  </div>

                  {availableBankQuestions.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                      Không còn câu hỏi nào phù hợp trong ngân hàng.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                      {availableBankQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-start justify-between gap-3 text-xs shadow-2xs transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-medium text-[10px]">
                                {q.difficulty}
                              </span>
                              <span className="text-slate-400 text-[10px]">{q.questionType}</span>
                            </div>
                            <div className="text-slate-800 font-medium line-clamp-2">
                              <MathMarkdownRenderer content={q.content} />
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddQuestionToExercise(q.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Sau khi thêm đủ câu hỏi, hãy phát hành bài tập để học viên bắt đầu luyện tập.
                </span>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
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
          subjects={subjects}
          courses={courses}
          lessons={[]}
          defaultSubjectId={selectedExerciseForQuestions?.subjectId}
          defaultCourseId={selectedExerciseForQuestions?.courseId}
          defaultLessonId={selectedExerciseForQuestions?.lessonId}
          defaultTopic={selectedExerciseForQuestions?.lessonTitle || selectedExerciseForQuestions?.title || ''}
          doneButtonText="Hoàn tất & Quay lại bài tập"
          onQuestionsApproved={handleReloadQuestionsAfterAi}
        />
      </div>
    </RoleGuard>
  );
}
