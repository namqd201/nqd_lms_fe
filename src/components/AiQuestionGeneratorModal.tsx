'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Edit2,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Layers,
  BookOpen,
  GraduationCap,
  Save,
  Folder,
} from 'lucide-react';
import { SubjectResponse } from '@/types/admin';
import { TeacherCourseResponse, TeacherLessonResponse } from '@/types/course';
import { QuestionType, QuestionDifficulty, QuestionCategoryResponse } from '@/types/question';
import {
  TeacherAiJobDetailResponse,
  TeacherAiGeneratedQuestionResponse,
  TeacherAiUpdateGeneratedQuestionRequest,
} from '@/types/ai';
import { aiService } from '@/services/ai.service';
import { questionCategoryService } from '@/services/questionCategory.service';
import { GRADE_LEVEL_GROUPS } from '@/constants/gradeLevels';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';

const QUESTION_TYPE_OPTIONS: { type: QuestionType; label: string; icon: string }[] = [
  { type: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm (4 lựa chọn)', icon: '🔘' },
  { type: 'TRUE_FALSE', label: 'Đúng / Sai', icon: '⚖️' },
  { type: 'FILL_IN_THE_BLANK', label: 'Điền từ vào chỗ trống', icon: '📝' },
  { type: 'SHORT_ANSWER', label: 'Câu trả lời ngắn', icon: '💬' },
  { type: 'ESSAY', label: 'Tự luận', icon: '✍️' },
];

const getQuestionTypeBadge = (type: QuestionType) => {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return { label: 'Trắc nghiệm', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🔘' };
    case 'TRUE_FALSE':
      return { label: 'Đúng / Sai', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '⚖️' };
    case 'FILL_IN_THE_BLANK':
      return { label: 'Điền khuyết', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '📝' };
    case 'SHORT_ANSWER':
      return { label: 'Trả lời ngắn', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: '💬' };
    case 'ESSAY':
      return { label: 'Tự luận', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '✍️' };
    default:
      return { label: type, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '❓' };
  }
};

interface AiQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectResponse[];
  courses: TeacherCourseResponse[];
  lessons: TeacherLessonResponse[];
  defaultSubjectId?: string;
  defaultCourseId?: string;
  defaultLessonId?: string;
  defaultGradeLevel?: string;
  defaultTopic?: string;
  doneButtonText?: string;
  onQuestionsApproved?: () => void;
  zIndex?: string;
}

export const AiQuestionGeneratorModal: React.FC<AiQuestionGeneratorModalProps> = ({
  isOpen,
  onClose,
  subjects,
  courses,
  lessons,
  defaultSubjectId,
  defaultCourseId,
  defaultLessonId,
  defaultGradeLevel,
  defaultTopic,
  doneButtonText,
  onQuestionsApproved,
  zIndex = 'z-[100]',
}) => {
  const [subjectId, setSubjectId] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<QuestionCategoryResponse[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
  const [lessonId, setLessonId] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('Lớp 1');
  const [topic, setTopic] = useState<string>('');
  const [typeSelectionMode, setTypeSelectionMode] = useState<string>('MIXED');
  const [customSelectedTypes, setCustomSelectedTypes] = useState<QuestionType[]>([
    'MULTIPLE_CHOICE',
    'FILL_IN_THE_BLANK',
    'ESSAY',
  ]);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('MEDIUM');
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(1);
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [jobDetail, setJobDetail] = useState<TeacherAiJobDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit question state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TeacherAiUpdateGeneratedQuestionRequest>({
    content: '',
    questionType: 'MULTIPLE_CHOICE',
    difficulty: 'MEDIUM',
    marks: 1,
    explanation: '',
    tags: '',
    options: [],
  });

  useEffect(() => {
    if (isOpen) {
      if (defaultSubjectId) {
        setSubjectId(defaultSubjectId);
      } else if (subjects.length > 0 && !subjectId) {
        setSubjectId(subjects[0].id);
      }

      if (defaultCourseId) setCourseId(defaultCourseId);
      if (defaultLessonId) setLessonId(defaultLessonId);
      if (defaultGradeLevel) setGradeLevel(defaultGradeLevel);
      if (defaultTopic) setTopic(defaultTopic);
      setJobDetail(null);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, defaultSubjectId, defaultCourseId, defaultLessonId, defaultGradeLevel, defaultTopic, subjects]);

  useEffect(() => {
    if (!subjectId) {
      setCategories([]);
      setCategoryId('');
      return;
    }

    let isMounted = true;
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await questionCategoryService.getCategories({
          subjectId,
          gradeLevel,
        });
        if (!isMounted) return;
        setCategories(data);
        // Default to "Chuyên đề chung" or the first public category
        const defaultCat =
          data.find((c) => c.name.toLowerCase().includes('chung')) ||
          data.find((c) => c.visibility === 'PUBLIC') ||
          data[0];
        if (defaultCat) {
          setCategoryId(defaultCat.id);
        } else {
          setCategoryId('');
        }
      } catch (err) {
        console.error('Failed to load categories for AI Question generator:', err);
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [subjectId, gradeLevel]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !topic.trim()) {
      setError('Vui lòng chọn Môn học và nhập Chủ đề kiến thức cần tạo.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setSuccessMsg(null);

      let reqQuestionType: QuestionType | undefined = undefined;
      let reqQuestionTypes: QuestionType[] | undefined = undefined;

      if (typeSelectionMode === 'MIXED') {
        if (!additionalInstructions.trim()) {
          setError('Vui lòng nhập mô tả chi tiết bài tập (số lượng câu hỏi, loại câu, điểm số và độ khó mong muốn) để AI tạo đúng ý bạn.');
          setIsGenerating(false);
          return;
        }
        reqQuestionType = undefined;
        reqQuestionTypes = undefined;
      } else if (typeSelectionMode === 'CUSTOM') {
        if (!customSelectedTypes || customSelectedTypes.length === 0) {
          setError('Vui lòng chọn ít nhất 1 loại câu hỏi khi dùng chế độ Tùy chọn.');
          setIsGenerating(false);
          return;
        }
        reqQuestionType = undefined;
        reqQuestionTypes = customSelectedTypes;
      } else {
        reqQuestionType = typeSelectionMode as QuestionType;
        reqQuestionTypes = undefined;
      }

      const res = await aiService.generateQuestions({
        subjectId,
        courseId: courseId || undefined,
        categoryId: categoryId || undefined,
        lessonId: lessonId || undefined,
        gradeLevel,
        topic: topic.trim(),
        questionType: reqQuestionType,
        questionTypes: reqQuestionTypes,
        difficulty: typeSelectionMode === 'MIXED' ? undefined : difficulty,
        numberOfQuestions: typeSelectionMode === 'MIXED' ? undefined : numberOfQuestions,
        marksPerQuestion: typeSelectionMode === 'MIXED' ? undefined : marksPerQuestion,
        additionalInstructions: additionalInstructions.trim() || undefined,
      });

      setJobDetail(res);
      setSuccessMsg(`AI đã tạo thành công ${res.questions.length} câu hỏi. Hãy kiểm tra và phê duyệt!`);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo câu hỏi bằng AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveSingle = async (questionId: string) => {
    if (!jobDetail) return;
    try {
      setError(null);
      const updatedQ = await aiService.approveSingleQuestion(jobDetail.job.id, questionId);
      setJobDetail({
        ...jobDetail,
        questions: jobDetail.questions.map((q) => (q.id === questionId ? updatedQ : q)),
      });
      setSuccessMsg('Đã thêm câu hỏi vào Ngân hàng câu hỏi thành công!');
      if (onQuestionsApproved) onQuestionsApproved();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phê duyệt câu hỏi');
    }
  };

  const handleRejectSingle = async (questionId: string) => {
    if (!jobDetail) return;
    try {
      setError(null);
      const updatedQ = await aiService.rejectSingleQuestion(jobDetail.job.id, questionId);
      setJobDetail({
        ...jobDetail,
        questions: jobDetail.questions.map((q) => (q.id === questionId ? updatedQ : q)),
      });
    } catch (err: any) {
      setError(err.message || 'Lỗi khi từ chối câu hỏi');
    }
  };

  const handleApproveAll = async () => {
    if (!jobDetail) return;
    try {
      setIsGenerating(true);
      setError(null);
      const res = await aiService.approveAllValidQuestions(jobDetail.job.id);
      const refreshed = await aiService.getJobDetail(jobDetail.job.id);
      setJobDetail(refreshed);
      setSuccessMsg(res.message);
      if (onQuestionsApproved) onQuestionsApproved();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phê duyệt toàn bộ câu hỏi');
    } finally {
      setIsGenerating(false);
    }
  };

  const startEditQuestion = (q: TeacherAiGeneratedQuestionResponse) => {
    setEditingQuestionId(q.id);
    setEditForm({
      content: q.content,
      questionType: q.questionType,
      difficulty: q.difficulty,
      marks: q.marks,
      explanation: q.explanation || '',
      tags: q.tags || '',
      options: q.options.map((opt) => ({
        optionKey: opt.optionKey,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        displayOrder: opt.displayOrder,
      })),
    });
  };

  const handleSaveEdit = async (questionId: string) => {
    if (!jobDetail) return;
    try {
      setError(null);
      const updatedQ = await aiService.updateGeneratedQuestion(jobDetail.job.id, questionId, editForm);
      setJobDetail({
        ...jobDetail,
        questions: jobDetail.questions.map((q) => (q.id === questionId ? updatedQ : q)),
      });
      setEditingQuestionId(null);
      setSuccessMsg('Cập nhật câu hỏi thành công!');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu chỉnh sửa câu hỏi');
    }
  };

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto`}>
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">AI Sinh Câu Hỏi Tự Động</h2>
              <p className="text-xs text-purple-200 font-medium">
                Tạo câu hỏi trắc nghiệm, đúng/sai, tự luận theo ma trận và kiến thức chuẩn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Input form */}
          {!jobDetail ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    Môn học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none"
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grade Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                    Khối lớp / Cấp độ
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none"
                  >
                    {GRADE_LEVEL_GROUPS.map((grp) => (
                      <optgroup key={grp.level} label={grp.label}>
                        {grp.grades.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-purple-600" />
                    Chủ đề / Chuyên đề
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={isLoadingCategories}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none"
                  >
                    {isLoadingCategories ? (
                      <option value="">Đang tải chuyên đề...</option>
                    ) : categories.length === 0 ? (
                      <option value="">Chưa có chuyên đề (tự gán Chuyên đề chung)</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.name.toLowerCase().includes('chung') || c.visibility === 'PUBLIC' ? '🌐 (Chung)' : c.visibility === 'TEACHER_SHARED' ? '👥 (Giáo viên)' : '🔒 (Riêng tư)'}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Course (optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    Khóa học (Tùy chọn)
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">-- Không gắn khóa học --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic / Concepts */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chủ đề / Khái niệm trọng tâm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Phép cộng có nhớ trong phạm vi 100, Định luật 2 Newton, Thì hiện tại hoàn thành..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              {/* Question Config Row */}
              {typeSelectionMode === 'MIXED' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Loại câu hỏi</span>
                    <span className="text-[10px] text-purple-700 font-extrabold bg-purple-100 px-2 py-0.5 rounded-md">
                      ✨ Chế độ Hỗn hợp toàn diện (Tự do mô tả)
                    </span>
                  </label>
                  <select
                    value={typeSelectionMode}
                    onChange={(e) => setTypeSelectionMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500 font-medium"
                  >
                    <option value="MIXED">✨ Hỗn hợp (Trắc nghiệm, Tự luận, Điền từ... tự mô tả theo ý muốn)</option>
                    <option value="CUSTOM">🎯 Tùy chọn nhiều loại...</option>
                    <optgroup label="─── Chỉ chọn một loại ───">
                      <option value="MULTIPLE_CHOICE">Trắc nghiệm (4 lựa chọn)</option>
                      <option value="TRUE_FALSE">Đúng / Sai</option>
                      <option value="SHORT_ANSWER">Câu trả lời ngắn</option>
                      <option value="FILL_IN_THE_BLANK">Điền từ vào chỗ trống</option>
                      <option value="ESSAY">Tự luận</option>
                    </optgroup>
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Loại câu hỏi</label>
                    <select
                      value={typeSelectionMode}
                      onChange={(e) => setTypeSelectionMode(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500 font-medium"
                    >
                      <option value="MIXED">✨ Hỗn hợp (Trắc nghiệm, Tự luận, Điền từ...)</option>
                      <option value="CUSTOM">🎯 Tùy chọn nhiều loại...</option>
                      <optgroup label="─── Chỉ chọn một loại ───">
                        <option value="MULTIPLE_CHOICE">Trắc nghiệm (4 lựa chọn)</option>
                        <option value="TRUE_FALSE">Đúng / Sai</option>
                        <option value="SHORT_ANSWER">Câu trả lời ngắn</option>
                        <option value="FILL_IN_THE_BLANK">Điền từ vào chỗ trống</option>
                        <option value="ESSAY">Tự luận</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Độ khó</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
                    >
                      <option value="EASY">Dễ</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HARD">Khó</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Số lượng câu (1-20)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={numberOfQuestions}
                      onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Điểm mỗi câu</label>
                    <input
                      type="number"
                      step="0.25"
                      min={0.25}
                      value={marksPerQuestion}
                      onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Mixed Mode Helper Banner */}
              {typeSelectionMode === 'MIXED' && (
                <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3 text-xs text-purple-900 shadow-sm">
                  <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-semibold text-purple-950">
                      Bạn hãy nêu rõ số lượng từng loại câu hỏi, thang điểm và độ khó mong muốn ở phần mô tả yêu cầu bên dưới, AI sẽ tự động tạo đề chính xác theo đúng yêu cầu của bạn.
                    </p>
                    <p className="text-[11px] text-purple-700">
                      💡 <em>Ví dụ: &quot;Tạo 2 câu trắc nghiệm (1 điểm, dễ), 1 câu điền từ (2 điểm, vừa), 1 câu tự luận (3 điểm, khó)...&quot;</em>
                    </p>
                  </div>
                </div>
              )}

              {/* Custom Mode Type Checkboxes */}
              {typeSelectionMode === 'CUSTOM' && (
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                    <span className="flex items-center gap-1.5">
                      <span>🎯 Chọn các dạng câu hỏi bạn muốn kết hợp ({customSelectedTypes.length} đã chọn):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (customSelectedTypes.length === QUESTION_TYPE_OPTIONS.length) {
                          setCustomSelectedTypes(['MULTIPLE_CHOICE', 'ESSAY']);
                        } else {
                          setCustomSelectedTypes(QUESTION_TYPE_OPTIONS.map((o) => o.type));
                        }
                      }}
                      className="text-[11px] text-purple-700 hover:text-purple-900 underline font-semibold cursor-pointer"
                    >
                      {customSelectedTypes.length === QUESTION_TYPE_OPTIONS.length ? 'Chọn mặc định (Trắc nghiệm + Tự luận)' : 'Chọn tất cả các dạng'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {QUESTION_TYPE_OPTIONS.map((opt) => {
                      const isChecked = customSelectedTypes.includes(opt.type);
                      return (
                        <button
                          type="button"
                          key={opt.type}
                          onClick={() => {
                            if (isChecked) {
                              if (customSelectedTypes.length <= 1) return;
                              setCustomSelectedTypes(customSelectedTypes.filter((t) => t !== opt.type));
                            } else {
                              setCustomSelectedTypes([...customSelectedTypes, opt.type]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isChecked
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50/50'
                          }`}
                        >
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-purple-700 font-medium">
                    * AI sẽ sinh ra danh sách gồm các dạng câu hỏi được chọn ở trên.
                  </p>
                </div>
              )}

              {/* Additional Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {typeSelectionMode === 'MIXED' ? (
                    <span className="flex items-center gap-1.5">
                      <span>Mô tả chi tiết yêu cầu bài tập hỗn hợp</span>
                      <span className="text-rose-500 font-extrabold">*</span>
                      <span className="text-purple-600 font-medium text-[11px]">(Nêu rõ: số lượng, dạng câu, điểm số &amp; độ khó)</span>
                    </span>
                  ) : (
                    'Yêu cầu / Ghi chú thêm cho AI (Tùy chọn)'
                  )}
                </label>
                <textarea
                  rows={typeSelectionMode === 'MIXED' ? 4 : 2}
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder={
                    typeSelectionMode === 'MIXED'
                      ? 'Nêu chi tiết số lượng câu hỏi, loại câu, điểm số và độ khó mong muốn (ví dụ: "Tạo 1 bài tập mức độ dễ (2 điểm), 1 bài tập mức độ trung bình (3 điểm) và 1 bài tập mức độ khó (5 điểm)..."). AI sẽ tự động phân tích và tạo đúng theo mô tả này.'
                      : 'Ví dụ: Đưa ra các tình huống gắn liền thực tiễn, phân tích bẫy sai lầm hay gặp, giải thích chi tiết từng bước...'
                  }
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs text-slate-800 focus:outline-none transition ${
                    typeSelectionMode === 'MIXED'
                      ? 'border-purple-300 focus:border-purple-600 ring-2 ring-purple-100 bg-purple-50/20'
                      : 'border-slate-200 focus:border-purple-500'
                  }`}
                  required={typeSelectionMode === 'MIXED'}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI đang suy luận & sinh câu hỏi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>Bắt đầu tạo câu hỏi bằng AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: Generated Questions Review */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-sm font-bold text-purple-900">{jobDetail.job.promptSummary}</h3>
                  <p className="text-xs text-purple-700 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Đã sinh: <strong>{jobDetail.questions.length}</strong> câu</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Folder className="w-3 h-3 text-purple-600" />
                      Chuyên đề: <strong>{jobDetail.job.categoryName || 'Chuyên đề chung'}</strong>
                    </span>
                    <span>•</span>
                    <span>Đã duyệt vào Ngân hàng: <strong>{jobDetail.job.totalApproved}</strong> câu</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setJobDetail(null)}
                    className="px-3.5 py-2 rounded-xl border border-purple-200 bg-white hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa yêu cầu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTopic('');
                      setAdditionalInstructions('');
                      setJobDetail(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Tạo câu hỏi khác</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveAll}
                    disabled={isGenerating}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Phê duyệt tất cả</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {jobDetail.questions.map((q, idx) => {
                  const isEditing = editingQuestionId === q.id;
                  const isApproved = q.reviewStatus === 'APPROVED';
                  const isRejected = q.reviewStatus === 'REJECTED';

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isApproved
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isRejected
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          {(() => {
                            const badge = getQuestionTypeBadge(q.questionType);
                            return (
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${badge.color}`}>
                                <span>{badge.icon}</span>
                                <span>{badge.label}</span>
                              </span>
                            );
                          })()}
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                            Độ khó: {q.difficulty}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold">
                            {q.marks} điểm
                          </span>

                          {/* Validation Badge */}
                          {q.validationStatus === 'VALID' ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Hợp lệ
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {q.validationFeedback || 'Cần kiểm tra lại'}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {isApproved ? (
                            <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Đã thêm vào Ngân hàng
                            </span>
                          ) : (
                            <>
                              {!isEditing && (
                                <button
                                  onClick={() => startEditQuestion(q)}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Chỉnh sửa nội dung trước khi duyệt"
                                >
                                  <Edit2 className="w-3 h-3 text-slate-500" />
                                  <span>Sửa</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleApproveSingle(q.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Duyệt câu này</span>
                              </button>

                              {!isRejected && (
                                <button
                                  onClick={() => handleRejectSingle(q.id)}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Từ chối câu này"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Content (or Edit mode) */}
                      {isEditing ? (
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung câu hỏi</label>
                            <textarea
                              rows={2}
                              value={editForm.content}
                              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none"
                            />
                          </div>

                          {/* Options editor if multiple choice */}
                          {editForm.options && editForm.options.length > 0 && (
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-700">Các đáp án lựa chọn</label>
                              {editForm.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={opt.optionKey}
                                    onChange={(e) => {
                                      const newOpts = [...editForm.options];
                                      newOpts[oIdx].optionKey = e.target.value;
                                      setEditForm({ ...editForm, options: newOpts });
                                    }}
                                    className="w-12 px-2 py-1.5 text-center font-bold text-xs rounded-lg border border-slate-200"
                                  />
                                  <input
                                    type="text"
                                    value={opt.optionText}
                                    onChange={(e) => {
                                      const newOpts = [...editForm.options];
                                      newOpts[oIdx].optionText = e.target.value;
                                      setEditForm({ ...editForm, options: newOpts });
                                    }}
                                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                                  />
                                  <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={opt.isCorrect}
                                      onChange={(e) => {
                                        const newOpts = [...editForm.options];
                                        newOpts[oIdx].isCorrect = e.target.checked;
                                        setEditForm({ ...editForm, options: newOpts });
                                      }}
                                      className="rounded text-purple-600"
                                    />
                                    <span>Đúng</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Lời giải chi tiết</label>
                            <input
                              type="text"
                              value={editForm.explanation || ''}
                              onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingQuestionId(null)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSaveEdit(q.id)}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Lưu thay đổi
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-slate-900 leading-relaxed">
                            <MathMarkdownRenderer content={q.content} />
                          </div>

                          {/* Options list */}
                          {q.options && q.options.length > 0 && (
                            q.options.some((o) => o.optionKey === 'ANS') ? (
                              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                                <span className="font-bold text-purple-700">💡 Đáp án điền:</span>
                                <div className="font-extrabold text-emerald-800 text-sm">
                                  <MathMarkdownRenderer content={q.options.find((o) => o.optionKey === 'ANS')?.optionText || ''} />
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options.map((opt) => (
                                  <div
                                    key={opt.id}
                                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                      opt.isCorrect
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                                        : 'bg-slate-50 border-slate-100 text-slate-700'
                                    }`}
                                  >
                                    <span
                                      className={`w-5 h-5 rounded-md font-bold flex items-center justify-center text-[11px] shrink-0 ${
                                        opt.isCorrect
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {opt.optionKey}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <MathMarkdownRenderer content={opt.optionText} />
                                    </div>
                                    {opt.isCorrect && (
                                      <span className="ml-auto text-[10px] text-emerald-700 font-extrabold shrink-0">
                                        ✓ Đáp án đúng
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )
                          )}

                          {(!q.options || q.options.length === 0) && (
                            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-center gap-2">
                              <span className="text-base">✍️</span>
                              <div>
                                <strong>Câu hỏi tự luận:</strong> Học sinh tự trình bày bài giải / tải ảnh bài làm lên hệ thống; giáo viên trực tiếp chấm điểm.
                              </div>
                            </div>
                          )}

                          {q.explanation && (
                            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs space-y-1">
                              <strong>💡 Lời giải:</strong>
                              <MathMarkdownRenderer content={q.explanation} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Step 2 Bottom Action Bar */}
        {jobDetail && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setJobDetail(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>← Chỉnh sửa yêu cầu</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTopic('');
                  setAdditionalInstructions('');
                  setJobDetail(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>✨ Tạo thêm câu hỏi khác</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onQuestionsApproved) onQuestionsApproved();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                <span>{doneButtonText || 'Hoàn tất & Về ngân hàng câu hỏi'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
