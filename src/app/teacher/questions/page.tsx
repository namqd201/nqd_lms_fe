'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { questionService } from '@/services/question.service';
import { questionCategoryService } from '@/services/questionCategory.service';
import { subjectService } from '@/services/subject.service';
import { courseService } from '@/services/course.service';
import { examService } from '@/services/exam.service';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import { RichMathEditor } from '@/components/RichMathEditor';
import {
  TeacherQuestionResponse,
  TeacherQuestionRequest,
  TeacherQuestionOptionDto,
  QuestionType,
  QuestionDifficulty,
  QuestionStatus,
  QuestionCategoryResponse,
  QuestionCategoryVisibility,
  QuestionPaperExportParams,
} from '@/types/question';
import { SubjectResponse } from '@/types/admin';
import { TeacherCourseResponse, TeacherLessonResponse, TeacherChapterResponse } from '@/types/course';
import { TeacherExamResponse } from '@/types/exam';
import {
  HelpCircle,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit,
  Trash2,
  Eye,
  Sparkles,
  Tag as TagIcon,
  BookOpen,
  GraduationCap,
  Layers,
  FileText,
  Check,
  ChevronRight,
  ArrowLeft,
  PlayCircle,
  Award,
  BookMarked,
  User as UserIcon,
  Filter,
  X,
  CheckCircle,
  XCircle,
  History,
  Undo2,
  Folder,
  Folders,
  FolderPlus,
  Download,
  Headphones,
} from 'lucide-react';
import { GRADE_LEVEL_GROUPS, isGradeMatching, ALL_GRADES } from '@/constants/gradeLevels';
import { AiQuestionGeneratorModal } from '@/components/AiQuestionGeneratorModal';
import QuestionPaperExportModal from '@/components/QuestionPaperExportModal';
import { ListeningAudioPlayer } from '@/components/ListeningAudioPlayer';

const QUESTION_TYPES: { type: QuestionType; label: string; desc: string }[] = [
  { type: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm (4 lựa chọn)', desc: '1 hoặc nhiều đáp án đúng' },
  { type: 'TRUE_FALSE', label: 'Đúng / Sai', desc: 'Chọn phương án Đúng hoặc Sai' },
  { type: 'SHORT_ANSWER', label: 'Câu trả lời ngắn', desc: 'Nhập câu trả lời ngắn gọn' },
  { type: 'FILL_IN_THE_BLANK', label: 'Điền vào chỗ trống', desc: 'Điền từ còn thiếu vào vị trí trống' },
  { type: 'ESSAY', label: 'Tự luận', desc: 'Bài làm tự luận chi tiết' },
];

const DIFFICULTIES: { level: QuestionDifficulty; label: string; color: string }[] = [
  { level: 'EASY', label: 'Dễ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { level: 'MEDIUM', label: 'Trung bình', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { level: 'HARD', label: 'Khó', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const STATUSES: { status: QuestionStatus; label: string; color: string }[] = [
  { status: 'DRAFT', label: 'Bản nháp', color: 'bg-slate-100 text-slate-600' },
  { status: 'REVIEW', label: 'Chờ duyệt', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { status: 'APPROVED', label: 'Đã duyệt', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { status: 'REJECTED', label: 'Từ chối', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { status: 'ARCHIVED', label: 'Đã lưu trữ', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

// Helper icons and colors for subjects
const SUBJECT_ICONS: Record<string, string> = {
  MATH: '📐',
  TOAN: '📐',
  IT: '💻',
  TECH: '💻',
  ENG: '🇬🇧',
  PHYS: '⚡',
  CHEM: '🧪',
  BIO: '🌿',
  LIT: '📚',
  VAN: '📚',
  HIST: '🏛️',
  SU: '🏛️',
  GEO: '🌍',
  DIA: '🌍',
};

export default function TeacherQuestionBankPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');
  const isTeacherOrAdmin = user?.roles?.some(
    (r) => r === 'TEACHER' || r === 'ROLE_TEACHER' || r === 'ADMIN' || r === 'ROLE_ADMIN'
  );
  const isStudent = !isTeacherOrAdmin;

  const [questions, setQuestions] = useState<TeacherQuestionResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [courses, setCourses] = useState<TeacherCourseResponse[]>([]);
  const [lessons, setLessons] = useState<TeacherLessonResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Question Categories State
  const [categories, setCategories] = useState<QuestionCategoryResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [categoryFormName, setCategoryFormName] = useState<string>('');
  const [categoryFormDesc, setCategoryFormDesc] = useState<string>('');
  const [categoryFormSubjectId, setCategoryFormSubjectId] = useState<string>('');
  const [categoryFormGrade, setCategoryFormGrade] = useState<string>('Lớp 1');
  const [categoryFormVisibility, setCategoryFormVisibility] = useState<QuestionCategoryVisibility>('TEACHER_SHARED');
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);
  const [formCategoryId, setFormCategoryId] = useState<string>('');

  // 3-Level Navigation state
  const [viewLevel, setViewLevel] = useState<'SUBJECTS' | 'GRADES' | 'QUESTIONS'>('SUBJECTS');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectSearchQuery, setSubjectSearchQuery] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('');

  // Practice Mode state (for students & teachers)
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [practiceResults, setPracticeResults] = useState<Record<string, { isCorrect: boolean; checked: boolean }>>({});

  useEffect(() => {
    if (user && isStudent) {
      setIsPracticeMode(true);
    }
  }, [user, isStudent]);

  // Alerts
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formGradeLevel, setFormGradeLevel] = useState<string>('Lớp 1');
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formLessonId, setFormLessonId] = useState<string>('');
  const [formType, setFormType] = useState<QuestionType>('MULTIPLE_CHOICE');
  const [formDifficulty, setFormDifficulty] = useState<QuestionDifficulty>('EASY');
  const [formContent, setFormContent] = useState<string>('');
  const [formExplanation, setFormExplanation] = useState<string>('');
  const [formMarks, setFormMarks] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<QuestionStatus>('APPROVED');
  const [formTags, setFormTags] = useState<string>('');
  const [formAudioUrl, setFormAudioUrl] = useState<string>('');
  const [formAudioScript, setFormAudioScript] = useState<string>('');
  const [formOptions, setFormOptions] = useState<TeacherQuestionOptionDto[]>([
    { optionKey: 'A', optionText: '', isCorrect: true, displayOrder: 1 },
    { optionKey: 'B', optionText: '', isCorrect: false, displayOrder: 2 },
    { optionKey: 'C', optionText: '', isCorrect: false, displayOrder: 3 },
    { optionKey: 'D', optionText: '', isCorrect: false, displayOrder: 4 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Preview Modal
  const [previewQuestion, setPreviewQuestion] = useState<TeacherQuestionResponse | null>(null);

  // Trash / Deletion History Modal
  const [trashModalOpen, setTrashModalOpen] = useState<boolean>(false);
  const [deletedQuestions, setDeletedQuestions] = useState<TeacherQuestionResponse[]>([]);
  const [loadingTrash, setLoadingTrash] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleOpenTrash = async () => {
    setTrashModalOpen(true);
    setLoadingTrash(true);
    try {
      const data = await questionService.getDeletedQuestions();
      setDeletedQuestions(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải lịch sử câu hỏi đã xóa');
    } finally {
      setLoadingTrash(false);
    }
  };

  const handleRestoreQuestion = async (qId: string) => {
    setRestoringId(qId);
    try {
      await questionService.restoreQuestion(qId);
      setSuccessMessage('Khôi phục câu hỏi thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      setDeletedQuestions((prev) => prev.filter((q) => q.id !== qId));
      await loadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Khôi phục câu hỏi thất bại');
    } finally {
      setRestoringId(null);
    }
  };

  // Export Question Paper Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const handleExportQuestions = async (params: QuestionPaperExportParams, format: 'DOCX' | 'PDF') => {
    if (currentQuestions.length === 0) {
      setErrorMessage('Không có câu hỏi nào để tải về.');
      return;
    }

    const questionIds = currentQuestions.map((q) => q.id);
    const subClean = (activeSubject?.name || 'Toan').replace(/\s+/g, '_');
    const gradeClean = (selectedGradeLevel || 'Lop').replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `De_On_Tap_${subClean}_${gradeClean}_${dateStr}.${format === 'DOCX' ? 'docx' : 'pdf'}`;

    if (format === 'DOCX') {
      await questionService.exportQuestionsDocx(
        {
          questionIds,
          subjectId: selectedSubjectId || undefined,
          categoryId: selectedCategoryId !== 'ALL' ? selectedCategoryId : undefined,
          gradeLevel: selectedGradeLevel && selectedGradeLevel !== 'ALL' ? selectedGradeLevel : undefined,
          params,
        },
        filename
      );
    } else {
      await questionService.exportQuestionsPdf(
        {
          questionIds,
          subjectId: selectedSubjectId || undefined,
          categoryId: selectedCategoryId !== 'ALL' ? selectedCategoryId : undefined,
          gradeLevel: selectedGradeLevel && selectedGradeLevel !== 'ALL' ? selectedGradeLevel : undefined,
          params,
        },
        filename
      );
    }
  };

  // Exams State
  const [exams, setExams] = useState<TeacherExamResponse[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Load categories whenever subject or grade level changes
  const loadCategories = async (subjectId?: string | null, gradeLevel?: string | null) => {
    if (!subjectId) {
      setCategories([]);
      return;
    }
    try {
      const data = await questionCategoryService.getCategories({
        subjectId,
        gradeLevel: gradeLevel && gradeLevel !== 'ALL' ? gradeLevel : undefined,
      });
      setCategories(data);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      loadCategories(selectedSubjectId, selectedGradeLevel);
      setSelectedCategoryId('ALL');
    }
  }, [selectedSubjectId, selectedGradeLevel]);

  const handleOpenCategoryModal = (subId?: string, grade?: string) => {
    const sId = subId || selectedSubjectId || formSubjectId || (subjects.length > 0 ? subjects[0].id : '');
    const g = grade || selectedGradeLevel || formGradeLevel || 'Lớp 1';
    setCategoryFormSubjectId(sId);
    setCategoryFormGrade(g);
    setCategoryFormName('');
    setCategoryFormDesc('');
    setCategoryFormVisibility('TEACHER_SHARED');
    setIsCategoryModalOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormName.trim()) {
      setErrorMessage('Tên chuyên đề không được để trống.');
      return;
    }
    const subId = categoryFormSubjectId || selectedSubjectId || formSubjectId || (subjects.length > 0 ? subjects[0].id : null);
    if (!subId) {
      setErrorMessage('Vui lòng chọn môn học trước khi tạo chuyên đề.');
      return;
    }
    setIsSavingCategory(true);
    try {
      const created = await questionCategoryService.createCategory({
        name: categoryFormName.trim(),
        description: categoryFormDesc.trim() || undefined,
        subjectId: subId,
        gradeLevel: categoryFormGrade || selectedGradeLevel || formGradeLevel || 'Lớp 1',
        visibility: categoryFormVisibility,
      });
      setSuccessMessage(`Đã tạo chuyên đề "${created.name}" thành công!`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setIsCategoryModalOpen(false);
      setCategoryFormName('');
      setCategoryFormDesc('');
      await loadCategories(subId, categoryFormGrade || selectedGradeLevel || formGradeLevel);
      setFormCategoryId(created.id);
      setSelectedCategoryId(created.id);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Tạo chuyên đề thất bại');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [qs, subs] = await Promise.all([
        questionService.getQuestions(),
        subjectService.getActiveSubjects(),
      ]);
      setQuestions(qs);
      setSubjects(subs);

      if (isTeacherOrAdmin) {
        courseService.getTeacherCourses().then(setCourses).catch(() => {});
        examService.getTeacherExams().then(setExams).catch(() => {});
      }

      if (subs.length > 0 && !formSubjectId) {
        setFormSubjectId(subs[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải ngân hàng câu hỏi';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Get active subject object
  const activeSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || null;
  }, [subjects, selectedSubjectId]);

  // Filtered questions for Level 3
  const currentQuestions = useMemo(() => {
    if (!selectedSubjectId || !selectedGradeLevel) return [];

    return questions
      .filter((q) => {
        // 1. Must match selected subject
        if (q.subjectId !== selectedSubjectId) return false;

        // 2. Must match selected grade level
        if (!isGradeMatching(q.gradeLevel, selectedGradeLevel)) return false;

        // 2.1 Category / Topic filter
        if (selectedCategoryId !== 'ALL' && q.categoryId !== selectedCategoryId) return false;

        // 3. Keyword filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const contentMatch = q.content.toLowerCase().includes(query);
          const explMatch = q.explanation?.toLowerCase().includes(query) || false;
          const tagMatch = q.tags?.some((t) => t.toLowerCase().includes(query)) || false;
          if (!contentMatch && !explMatch && !tagMatch) return false;
        }

        // 4. Question Type filter
        if (selectedType !== 'ALL' && q.questionType !== selectedType) return false;

        // 5. Difficulty filter
        if (selectedDifficulty !== 'ALL' && q.difficulty !== selectedDifficulty) return false;

        // 6. Status filter
        if (selectedStatus !== 'ALL' && q.status !== selectedStatus) return false;

        // 7. Course filter
        if (selectedCourse !== 'ALL' && q.courseId !== selectedCourse) return false;

        return true;
      })
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [
    questions,
    selectedSubjectId,
    selectedGradeLevel,
    selectedCategoryId,
    searchQuery,
    selectedType,
    selectedDifficulty,
    selectedStatus,
    selectedCourse,
  ]);

  // Handler for course change in form
  const handleCourseChange = async (courseId: string) => {
    setFormCourseId(courseId);
    setFormLessonId('');
    if (!courseId) {
      setLessons([]);
      return;
    }
    try {
      const structure = await courseService.getTeacherCourseStructure(courseId);
      const allLessons: TeacherLessonResponse[] = [];
      structure.chapters?.forEach((ch: TeacherChapterResponse) => {
        if (ch.lessons) allLessons.push(...ch.lessons);
      });
      setLessons(allLessons);

      const courseObj = courses.find((c) => c.id === courseId);
      if (courseObj?.gradeLevel && (!formGradeLevel || !isGradeMatching(formGradeLevel, courseObj.gradeLevel))) {
        setFormGradeLevel(courseObj.gradeLevel);
      }
    } catch {
      setLessons([]);
    }
  };

  const handleTypeChange = (type: QuestionType) => {
    setFormType(type);
    if (type === 'MULTIPLE_CHOICE') {
      setFormOptions([
        { optionKey: 'A', optionText: '', isCorrect: true, displayOrder: 1 },
        { optionKey: 'B', optionText: '', isCorrect: false, displayOrder: 2 },
        { optionKey: 'C', optionText: '', isCorrect: false, displayOrder: 3 },
        { optionKey: 'D', optionText: '', isCorrect: false, displayOrder: 4 },
      ]);
    } else if (type === 'TRUE_FALSE') {
      setFormOptions([
        { optionKey: 'T', optionText: 'Đúng', isCorrect: true, displayOrder: 1 },
        { optionKey: 'F', optionText: 'Sai', isCorrect: false, displayOrder: 2 },
      ]);
    } else if (type === 'SHORT_ANSWER' || type === 'FILL_IN_THE_BLANK') {
      setFormOptions([{ optionKey: 'ANS', optionText: '', isCorrect: true, displayOrder: 1 }]);
    } else {
      setFormOptions([]);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingQuestionId(null);
    const defaultPubCat = categories.find((c) => c.visibility === 'PUBLIC');
    setFormCategoryId(selectedCategoryId !== 'ALL' ? selectedCategoryId : (defaultPubCat ? defaultPubCat.id : ''));
    setFormSubjectId(selectedSubjectId || (subjects.length > 0 ? subjects[0].id : ''));
    setFormGradeLevel(selectedGradeLevel || 'Lớp 1');
    setFormCourseId('');
    setFormLessonId('');
    setFormType('MULTIPLE_CHOICE');
    setFormDifficulty('EASY');
    setFormContent('');
    setFormExplanation('');
    setFormAudioUrl('');
    setFormAudioScript('');
    setFormMarks(1);
    setFormStatus('APPROVED');
    setFormTags('');
    setFormOptions([
      { optionKey: 'A', optionText: '', isCorrect: true, displayOrder: 1 },
      { optionKey: 'B', optionText: '', isCorrect: false, displayOrder: 2 },
      { optionKey: 'C', optionText: '', isCorrect: false, displayOrder: 3 },
      { optionKey: 'D', optionText: '', isCorrect: false, displayOrder: 4 },
    ]);
    setLessons([]);
    setModalOpen(true);
  };

  const handleOpenEditModal = (q: TeacherQuestionResponse) => {
    // Ownership guard: only author can edit
    if (!user || q.creatorId !== user.id) {
      setErrorMessage('Bạn chỉ có quyền chỉnh sửa câu hỏi do chính mình tạo ra.');
      return;
    }

    setEditingQuestionId(q.id);
    setFormSubjectId(q.subjectId || (subjects.length > 0 ? subjects[0].id : ''));
    setFormGradeLevel(q.gradeLevel || 'Lớp 1');
    setFormCategoryId(q.categoryId || '');
    setFormCourseId(q.courseId || '');
    setFormLessonId(q.lessonId || '');
    setFormType(q.questionType);
    setFormDifficulty(q.difficulty);
    setFormContent(q.content);
    setFormExplanation(q.explanation || '');
    setFormAudioUrl(q.audioUrl || '');
    setFormAudioScript(q.audioScript || '');
    setFormMarks(q.defaultMarks || 1);
    setFormStatus(q.status);
    setFormTags(q.tags ? q.tags.join(', ') : '');
    setFormOptions(
      q.options && q.options.length > 0
        ? q.options.map((opt, i) => ({
            id: opt.id,
            optionKey: opt.optionKey || String.fromCharCode(65 + i),
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            displayOrder: opt.displayOrder || i + 1,
          }))
        : []
    );
    if (q.courseId) {
      handleCourseChange(q.courseId);
    } else {
      setLessons([]);
    }
    setModalOpen(true);
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) {
      setErrorMessage('Nội dung câu hỏi không được để trống.');
      return;
    }
    if (!formSubjectId) {
      setErrorMessage('Vui lòng chọn môn học.');
      return;
    }

    if (formType === 'MULTIPLE_CHOICE' || formType === 'TRUE_FALSE') {
      const hasCorrect = formOptions.some((o) => o.isCorrect);
      if (!hasCorrect) {
        setErrorMessage('Vui lòng chọn ít nhất 1 đáp án đúng.');
        return;
      }
      const emptyText = formOptions.some((o) => !o.optionText.trim());
      if (emptyText) {
        setErrorMessage('Vui lòng nhập đầy đủ nội dung cho các lựa chọn đáp án.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const tagList = formTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload: TeacherQuestionRequest = {
        subjectId: formSubjectId,
        categoryId: formCategoryId ? formCategoryId : undefined,
        courseId: formCourseId || undefined,
        lessonId: formLessonId || undefined,
        gradeLevel: formGradeLevel,
        questionType: formType,
        difficulty: formDifficulty,
        content: formContent,
        explanation: formExplanation || undefined,
        audioUrl: formAudioUrl ? formAudioUrl.trim() : undefined,
        audioScript: formAudioScript ? formAudioScript.trim() : undefined,
        defaultMarks: formMarks,
        status: formStatus,
        tags: tagList,
        options: formType !== 'ESSAY' ? formOptions : [],
      };

      if (editingQuestionId) {
        await questionService.updateQuestion(editingQuestionId, payload);
        setSuccessMessage('Cập nhật câu hỏi thành công!');
      } else {
        await questionService.createQuestion(payload);
        setSuccessMessage('Tạo câu hỏi mới thành công!');
      }

      setModalOpen(false);
      setEditingQuestionId(null);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác thất bại';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (q: TeacherQuestionResponse) => {
    if (!user || q.creatorId !== user.id) {
      setErrorMessage('Bạn chỉ có quyền xóa câu hỏi do chính mình tạo ra.');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng không?')) {
      return;
    }

    try {
      await questionService.deleteQuestion(q.id);
      setSuccessMessage('Xóa câu hỏi thành công!');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa câu hỏi thất bại';
      setErrorMessage(msg);
    }
  };

  const handleToggleStatus = async (q: TeacherQuestionResponse) => {
    if (!user || q.creatorId !== user.id) {
      setErrorMessage('Bạn chỉ có quyền thay đổi trạng thái câu hỏi do chính mình tạo ra.');
      return;
    }
    const newStatus: QuestionStatus = q.status === 'APPROVED' ? 'DRAFT' : 'APPROVED';
    try {
      await questionService.updateQuestionStatus(q.id, newStatus);
      setSuccessMessage(
        newStatus === 'APPROVED'
          ? 'Đã duyệt công khai câu hỏi cho học sinh và giáo viên cùng xem!'
          : 'Đã chuyển câu hỏi về bản nháp riêng tư.'
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thay đổi trạng thái thất bại';
      setErrorMessage(msg);
    }
  };

  // Practice mode answer selection
  const handleSelectPracticeOption = (questionId: string, optionKey: string) => {
    setPracticeAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const handleCheckPracticeAnswer = (q: TeacherQuestionResponse) => {
    const selected = practiceAnswers[q.id];
    if (!selected) return;

    const correctOpt = q.options?.find((o) => o.isCorrect);
    const isCorrect = correctOpt ? correctOpt.optionKey === selected : false;

    setPracticeResults((prev) => ({
      ...prev,
      [q.id]: { isCorrect, checked: true },
    }));
  };

  const handleCheckPracticeShortAnswer = (q: TeacherQuestionResponse) => {
    const selected = (practiceAnswers[q.id] || '').trim().toLowerCase();
    if (!selected) return;

    const targetOpt = q.options?.[0];
    const targetText = (targetOpt?.optionText || '').trim().toLowerCase();
    // Allow lenient matching: equal or contains
    const isCorrect = selected === targetText || (targetText.length > 0 && selected.replace(/\s+/g, '') === targetText.replace(/\s+/g, ''));

    setPracticeResults((prev) => ({
      ...prev,
      [q.id]: { isCorrect, checked: true },
    }));
  };

  const handleRetryQuestion = (questionId: string) => {
    setPracticeAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setPracticeResults((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const resetPractice = () => {
    setPracticeAnswers({});
    setPracticeResults({});
  };

  return (
    <RoleGuard allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-y-auto">
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top Alerts */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm font-semibold">{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-500 hover:text-emerald-800 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="text-sm font-semibold">{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-800 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* LEVEL 1: SUBJECT SELECTION VIEW                                           */}
          {/* ========================================================================= */}
          {viewLevel === 'SUBJECTS' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="p-2 rounded-2xl bg-[#83C75D]/15 text-[#4e8231]">
                      <BookOpen className="w-6 h-6" />
                    </span>
                    <span>Ngân hàng Câu hỏi & Đề Luyện tập</span>
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Chọn môn học để khám phá câu hỏi trắc nghiệm, tự luận và làm bài luyện tập theo từng khối lớp
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm môn học..."
                      value={subjectSearchQuery}
                      onChange={(e) => setSubjectSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  {isTeacherOrAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleOpenTrash}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs shadow-xs transition cursor-pointer shrink-0"
                        title="Xem câu hỏi đã xóa & Khôi phục"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>Lịch sử xóa</span>
                      </button>

                      <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-xs shadow-xs transition hover:scale-105 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tạo câu hỏi</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Grid */}
              {isLoading ? (
                <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
                  <RotateCcw className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-sm font-semibold">Đang tải danh mục môn học...</p>
                </div>
              ) : subjects.length === 0 ? (
                <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">Chưa có môn học nào</h3>
                  <p className="text-xs text-slate-400 mt-1">Vui lòng liên hệ quản trị viên để khởi tạo môn học.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {subjects
                    .filter((s) => {
                      if (!subjectSearchQuery.trim()) return true;
                      const q = subjectSearchQuery.toLowerCase();
                      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
                    })
                    .map((sub) => {
                      const count = questions.filter((q) => q.subjectId === sub.id).length;
                      const icon = SUBJECT_ICONS[sub.code.toUpperCase()] || '📖';

                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubjectId(sub.id);
                            setViewLevel('GRADES');
                          }}
                          className="group bg-white border border-slate-200/90 hover:border-indigo-400 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between hover:-translate-y-1"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-3xl p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:scale-110 transition-transform">
                                {icon}
                              </span>
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-100">
                                {count} câu hỏi
                              </span>
                            </div>
                            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {sub.name}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">Mã môn: {sub.code}</p>
                            {sub.description && (
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                {sub.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-800">
                            <span>Khám phá các khối lớp</span>
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* LEVEL 2: GRADE LEVEL SELECTION VIEW                                       */}
          {/* ========================================================================= */}
          {viewLevel === 'GRADES' && activeSubject && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Breadcrumb & Navigation */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                    <button
                      onClick={() => setViewLevel('SUBJECTS')}
                      className="hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Ngân hàng câu hỏi
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-indigo-700 font-bold">Môn {activeSubject.name}</span>
                  </div>

                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="text-2xl">{SUBJECT_ICONS[activeSubject.code.toUpperCase()] || '📖'}</span>
                    <span>Môn {activeSubject.name} — Chọn khối lớp</span>
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Chọn khối lớp từ Lớp 1 đến Năm 4 Đại học để xem các câu hỏi và bộ đề tương ứng
                  </p>
                </div>

                <button
                  onClick={() => setViewLevel('SUBJECTS')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer self-start sm:self-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Chọn môn khác</span>
                </button>
              </div>

              {/* Grade Level Groups */}
              <div className="space-y-8">
                {GRADE_LEVEL_GROUPS.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{group.label}</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {group.grades.map((grade) => {
                        const count = questions.filter(
                          (q) => q.subjectId === activeSubject.id && isGradeMatching(q.gradeLevel, grade)
                        ).length;

                        return (
                          <div
                            key={grade}
                            onClick={() => {
                              setSelectedGradeLevel(grade);
                              setViewLevel('QUESTIONS');
                              setIsPracticeMode(false);
                              resetPractice();
                            }}
                            className="group bg-white border border-slate-200/90 hover:border-indigo-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between hover:-translate-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {grade}
                              </span>
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  count > 0
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-50 text-slate-400 border-slate-100'
                                }`}
                              >
                                {count} câu
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 mt-3 group-hover:text-indigo-600 flex items-center justify-between font-semibold">
                              <span>Xem câu hỏi</span>
                              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* LEVEL 3: QUESTION LIST & PRACTICE MODE VIEW                               */}
          {/* ========================================================================= */}
          {viewLevel === 'QUESTIONS' && activeSubject && selectedGradeLevel && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Breadcrumb & Navigation Bar */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                    <button
                      onClick={() => setViewLevel('SUBJECTS')}
                      className="hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Ngân hàng câu hỏi
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      onClick={() => setViewLevel('GRADES')}
                      className="hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Môn {activeSubject.name}
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-indigo-700 font-bold">{selectedGradeLevel}</span>
                  </div>

                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <span>
                      Môn {activeSubject.name} — {selectedGradeLevel}
                    </span>
                    <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full border border-indigo-100">
                      {currentQuestions.length} câu hỏi
                    </span>
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Practice Mode / Reset Practice Button */}
                  {isStudent ? (
                    <button
                      onClick={resetPractice}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      title="Đặt lại các câu hỏi để làm lại từ đầu"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Làm lại tất cả</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsPracticeMode(!isPracticeMode);
                        if (!isPracticeMode) resetPractice();
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-xs transition cursor-pointer ${
                        isPracticeMode
                          ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                    >
                      {isPracticeMode ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Thoát Luyện tập</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          <span>Làm bài luyện tập</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Teacher actions */}
                  {isTeacherOrAdmin && (
                    <>
                      <button
                        onClick={handleOpenTrash}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer"
                        title="Xem câu hỏi đã xóa & Khôi phục"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>Thùng rác</span>
                      </button>

                      <button
                        onClick={() => setAiModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Tạo bằng AI</span>
                      </button>

                      <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-xs shadow-xs transition hover:scale-105 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm câu hỏi</span>
                      </button>
                    </>
                  )}

                  {/* Download Question Paper Button (for both Students and Teachers) */}
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    disabled={currentQuestions.length === 0}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    title="In & Tải bộ câu hỏi đề bài chuẩn Bộ GD&ĐT (Word / PDF không đáp án)"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Tải câu hỏi ({currentQuestions.length})</span>
                  </button>

                  <button
                    onClick={() => setViewLevel('GRADES')}
                    className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                    title="Quay lại chọn lớp"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Practice Mode Banner */}
              {isPracticeMode && (
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                      🎯
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Chế độ Luyện tập Tương tác</h3>
                      <p className="text-xs text-emerald-100 mt-0.5">
                        Chọn đáp án và bấm &quot;Kiểm tra kết quả&quot; để nhận phản hồi và xem lời giải thích chi tiết!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl">
                      Đã làm: {Object.keys(practiceResults).length} / {currentQuestions.length} câu
                    </span>
                    <button
                      onClick={resetPractice}
                      className="text-xs font-bold bg-white text-slate-900 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Làm lại từ đầu
                    </button>
                  </div>
                </div>
              )}

              {/* Category / Topic Pills Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folders className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Chuyên đề / Danh mục câu hỏi ({categories.length})
                    </h3>
                  </div>
                  {isTeacherOrAdmin && (
                    <button
                      onClick={() => handleOpenCategoryModal(selectedSubjectId || undefined, selectedGradeLevel || undefined)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm chuyên đề</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedCategoryId('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedCategoryId === 'ALL'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ({questions.filter(q => q.subjectId === selectedSubjectId && isGradeMatching(q.gradeLevel, selectedGradeLevel)).length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedCategoryId === cat.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <span>{cat.visibility === 'PUBLIC' ? '🌐' : cat.visibility === 'PRIVATE' ? '🔒' : '👥'}</span>
                        <span>{cat.name}</span>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        selectedCategoryId === cat.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {cat.questionCount || 0}
                      </span>
                    </button>
                  ))}
                  {categories.length === 0 && (
                    <span className="text-xs text-slate-400 italic py-1">
                      Chưa có chuyên đề nào cho môn & khối lớp này. Bấm &quot;Thêm chuyên đề&quot; để tạo.
                    </span>
                  )}
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm nội dung câu hỏi, lời giải hoặc tag..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">Tất cả dạng câu hỏi</option>
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">Tất cả độ khó</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d.level} value={d.level}>
                      Độ khó: {d.label}
                    </option>
                  ))}
                </select>

                {isTeacherOrAdmin && (
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    {STATUSES.map((s) => (
                      <option key={s.status} value={s.status}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Questions Stream */}
              {currentQuestions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                  <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-700">Không tìm thấy câu hỏi phù hợp</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Chưa có câu hỏi nào thuộc môn {activeSubject.name} cho {selectedGradeLevel} hoặc bộ lọc hiện tại
                    không trả về kết quả.
                  </p>
                  {isTeacherOrAdmin && (
                    <button
                      onClick={handleOpenCreateModal}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm câu hỏi cho lớp này</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {currentQuestions.map((q, idx) => {
                    const isAuthor = user && q.creatorId === user.id;
                    const practiceResult = practiceResults[q.id];
                    const selectedChoice = practiceAnswers[q.id];

                    return (
                      <div
                        key={q.id}
                        className={`bg-white border rounded-3xl p-6 shadow-xs transition-all ${
                          practiceResult
                            ? practiceResult.isCorrect
                              ? 'border-emerald-300 ring-2 ring-emerald-100'
                              : 'border-rose-300 ring-2 ring-rose-100'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Question Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg">
                              {QUESTION_TYPES.find((t) => t.type === q.questionType)?.label || q.questionType}
                            </span>
                            <span
                              className={`px-2.5 py-1 font-bold text-[11px] rounded-lg border ${
                                DIFFICULTIES.find((d) => d.level === q.difficulty)?.color || 'bg-slate-100'
                              }`}
                            >
                              {DIFFICULTIES.find((d) => d.level === q.difficulty)?.label || q.difficulty}
                            </span>
                            <span className="px-2 py-1 text-[11px] font-semibold text-slate-500">
                              {q.defaultMarks} điểm
                            </span>
                            {/* Status Badge */}
                            <span
                              className={`px-2.5 py-1 font-bold text-[11px] rounded-lg border ${
                                q.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : q.status === 'DRAFT'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {q.status === 'APPROVED' ? '✓ Đã duyệt' : q.status === 'DRAFT' ? '✎ Bản nháp' : '📦 Lưu trữ'}
                            </span>
                            {/* Category Badge */}
                            {q.categoryName && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 font-bold text-[11px] rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <span>📁</span>
                                <span>{q.categoryName}</span>
                              </span>
                            )}
                            {/* Listening Badge */}
                            {(q.audioUrl || q.audioScript) && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 font-bold text-[11px] rounded-lg bg-purple-100 text-purple-800 border border-purple-200">
                                <Headphones className="w-3.5 h-3.5 text-purple-600" />
                                <span>Bài nghe</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Author Badge */}
                            {q.creatorName && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[11px] font-medium">
                                <UserIcon className="w-3 h-3 text-slate-400" />
                                <span>{q.creatorName}</span>
                              </span>
                            )}

                            {/* Actions: Admin moderation + Strict Creator-only for Edit & Delete */}
                            {isAuthor ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleStatus(q)}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                                    q.status === 'DRAFT'
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  }`}
                                  title={
                                    q.status === 'DRAFT'
                                      ? 'Phê duyệt để công khai cho học viên và giáo viên cùng xem'
                                      : 'Chuyển về bản nháp riêng tư'
                                  }
                                >
                                  {q.status === 'DRAFT' ? '🚀 Duyệt công khai' : 'Về nháp'}
                                </button>
                                <button
                                  onClick={() => handleOpenEditModal(q)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                  title="Chỉnh sửa câu hỏi (Bạn là tác giả)"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                  title="Xóa câu hỏi (Bạn là tác giả)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : isAdmin ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleStatus(q)}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                                    q.status === 'DRAFT'
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                  }`}
                                  title={
                                    q.status === 'DRAFT'
                                      ? 'Admin phê duyệt công khai câu hỏi'
                                      : 'Admin khóa / cấm câu hỏi này'
                                  }
                                >
                                  {q.status === 'DRAFT' ? '🚀 Duyệt công khai' : '🚫 Khóa / Cấm'}
                                </button>
                                <span className="text-[10px] font-semibold text-slate-400 italic px-1">
                                  (Chỉ tác giả được sửa, xóa)
                                </span>
                              </div>
                            ) : isTeacherOrAdmin ? (
                              <span className="text-[10px] font-semibold text-slate-400 italic px-2">
                                (Chỉ tác giả được sửa)
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Question Content (LaTeX Math Renderer) */}
                        <div className="text-sm font-semibold text-slate-900 leading-relaxed mb-4">
                          <MathMarkdownRenderer content={q.content} />
                        </div>

                        {/* Listening Audio Player if question has listening audio or script */}
                        {(q.audioUrl || q.audioScript) && (
                          <div className="mb-4">
                            <ListeningAudioPlayer
                              key={q.id}
                              audioUrl={q.audioUrl}
                              audioScript={q.audioScript}
                              allowTranscript={!isStudent || practiceResult?.checked}
                              title="Bài nghe tiếng Anh"
                            />
                          </div>
                        )}

                        {/* Options / Answer Input Section */}
                        {(() => {
                          const isChoice = q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE';
                          const isShortOrFill = q.questionType === 'SHORT_ANSWER' || q.questionType === 'FILL_IN_THE_BLANK';
                          const isEssay = q.questionType === 'ESSAY';

                          // 1. Multiple Choice / True-False
                          if (isChoice && q.options && q.options.length > 0) {
                            return (
                              <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
                                  {q.options.map((opt) => {
                                    const isSelected = selectedChoice === opt.optionKey;
                                    const isCorrect = opt.isCorrect;

                                    let optionStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';

                                    if (isStudent || isPracticeMode) {
                                      if (isSelected) {
                                        optionStyle = 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold ring-2 ring-indigo-200';
                                      }
                                      if (practiceResult?.checked) {
                                        if (isCorrect) {
                                          optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                                        } else if (isSelected && !isCorrect) {
                                          optionStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                                        }
                                      }
                                    } else {
                                      // Default view (Teacher only): show correct answers with green check
                                      if (isCorrect) {
                                        optionStyle = 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold';
                                      }
                                    }

                                    const canClickOption = (isStudent || isPracticeMode) && !practiceResult?.checked;

                                    return (
                                      <div
                                        key={opt.id || opt.optionKey}
                                        onClick={() => canClickOption && handleSelectPracticeOption(q.id, opt.optionKey)}
                                        className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${optionStyle} ${
                                          canClickOption ? 'cursor-pointer' : ''
                                        }`}
                                      >
                                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-xs font-black flex items-center justify-center shrink-0">
                                          {opt.optionKey}
                                        </span>
                                        <div className="flex-1 text-xs font-medium pt-0.5">
                                          <MathMarkdownRenderer content={opt.optionText} />
                                        </div>
                                        {!isStudent && !isPracticeMode && isCorrect && (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        )}
                                        {(isStudent || isPracticeMode) && practiceResult?.checked && isCorrect && (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        )}
                                        {(isStudent || isPracticeMode) && practiceResult?.checked && isSelected && !isCorrect && (
                                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Practice Mode Check Button for Choice Questions */}
                                {(isStudent || isPracticeMode) && (
                                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    {!practiceResult?.checked ? (
                                      <button
                                        onClick={() => handleCheckPracticeAnswer(q)}
                                        disabled={!selectedChoice}
                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition cursor-pointer"
                                      >
                                        Kiểm tra đáp án
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleRetryQuestion(q.id)}
                                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                                      >
                                        Làm lại câu này
                                      </button>
                                    )}

                                    {practiceResult && (
                                      <span
                                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                                          practiceResult.isCorrect
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {practiceResult.isCorrect
                                          ? '✓ Chính xác!'
                                          : `✗ Chưa chính xác (Đáp án đúng: ${q.options?.find((o) => o.isCorrect)?.optionKey || ''})`}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </>
                            );
                          }

                          // 2. Short Answer / Fill in the blank
                          if (isShortOrFill) {
                            if (!isStudent && !isPracticeMode) {
                              return (
                                <div className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-2xl text-xs font-semibold text-emerald-900 flex items-center gap-2 my-3">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>Đáp án chuẩn: <strong className="font-bold">{q.options?.[0]?.optionText}</strong></span>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-2.5 my-3">
                                <label className="block text-xs font-bold text-slate-700">Nhập đáp án của bạn:</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={practiceAnswers[q.id] || ''}
                                    onChange={(e) => handleSelectPracticeOption(q.id, e.target.value)}
                                    disabled={practiceResult?.checked}
                                    placeholder="Gõ câu trả lời / điền đáp án..."
                                    className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:border-indigo-500 focus:outline-none"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !practiceResult?.checked && practiceAnswers[q.id]?.trim()) {
                                        handleCheckPracticeShortAnswer(q);
                                      }
                                    }}
                                  />
                                  {!practiceResult?.checked ? (
                                    <button
                                      onClick={() => handleCheckPracticeShortAnswer(q)}
                                      disabled={!practiceAnswers[q.id]?.trim()}
                                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                      Kiểm tra
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleRetryQuestion(q.id)}
                                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                      Làm lại
                                    </button>
                                  )}
                                </div>
                                {practiceResult?.checked && (
                                  <div
                                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                      practiceResult.isCorrect
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                        : 'bg-rose-50 border-rose-200 text-rose-900'
                                    }`}
                                  >
                                    <div className="font-bold flex items-center gap-1.5">
                                      {practiceResult.isCorrect ? (
                                        <span className="flex items-center gap-1 text-emerald-700">
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          <span>✓ Chính xác!</span>
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 text-rose-700">
                                          <XCircle className="w-4 h-4 text-rose-600" />
                                          <span>
                                            ✗ Chưa chính xác. Đáp án chuẩn: <strong className="font-bold underline ml-1">{q.options?.[0]?.optionText}</strong>
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // 3. Essay
                          if (isEssay) {
                            if (!isStudent && !isPracticeMode) {
                              return null;
                            }

                            return (
                              <div className="space-y-2 my-3">
                                <label className="block text-xs font-bold text-slate-700">Tự luyện tập giải tự luận:</label>
                                <textarea
                                  rows={3}
                                  value={practiceAnswers[q.id] || ''}
                                  onChange={(e) => handleSelectPracticeOption(q.id, e.target.value)}
                                  placeholder="Gõ nháp lời giải hoặc các bước làm của bạn..."
                                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                                />
                                {!practiceResult?.checked ? (
                                  <button
                                    onClick={() => setPracticeResults((prev) => ({ ...prev, [q.id]: { isCorrect: true, checked: true } }))}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer"
                                  >
                                    Xem hướng dẫn giải & đáp án mẫu
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRetryQuestion(q.id)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                                  >
                                    Ẩn hướng dẫn giải
                                  </button>
                                )}
                              </div>
                            );
                          }

                          return null;
                        })()}

                        {/* Explanation Section (Hidden for students until checked) */}
                        {((!isStudent && !isPracticeMode && q.explanation) || (practiceResult?.checked && q.explanation)) && (
                          <div className="mt-4 p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs space-y-1">
                            <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                              <span>💡 Lời giải thích:</span>
                            </p>
                            <div className="text-slate-700 leading-relaxed pt-1">
                              <MathMarkdownRenderer content={q.explanation} />
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                            {q.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md flex items-center gap-1"
                              >
                                <TagIcon className="w-2.5 h-2.5 text-slate-400" />
                                <span>{tag}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* CREATE / EDIT QUESTION MODAL                                              */}
          {/* ========================================================================= */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingQuestionId ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
                  </h3>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitQuestion} className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Subject and Grade */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Môn học *</label>
                      <select
                        value={formSubjectId}
                        onChange={(e) => {
                          setFormSubjectId(e.target.value);
                          loadCategories(e.target.value, formGradeLevel);
                        }}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                      >
                        {subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp *</label>
                      <select
                        value={formGradeLevel}
                        onChange={(e) => {
                          setFormGradeLevel(e.target.value);
                          loadCategories(formSubjectId, e.target.value);
                        }}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                      >
                        {ALL_GRADES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Category / Topic selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Chuyên đề / Danh mục câu hỏi</label>
                      <button
                        type="button"
                        onClick={() => handleOpenCategoryModal(formSubjectId, formGradeLevel)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Thêm chuyên đề mới</span>
                      </button>
                    </div>
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Mặc định (Chuyên đề chung công khai) --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.visibility === 'PUBLIC' ? '🌐 ' : c.visibility === 'TEACHER_SHARED' ? '👥 ' : '🔒 '}
                          {c.name} {c.isSystem ? '(Mặc định hệ thống)' : ''} {c.questionCount ? `(${c.questionCount} câu)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Question Type, Difficulty & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Dạng câu hỏi *</label>
                      <select
                        value={formType}
                        onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t.type} value={t.type}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Độ khó *</label>
                      <select
                        value={formDifficulty}
                        onChange={(e) => setFormDifficulty(e.target.value as QuestionDifficulty)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                      >
                        {DIFFICULTIES.map((d) => (
                          <option key={d.level} value={d.level}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái câu hỏi *</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as QuestionStatus)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="APPROVED">✓ Đã duyệt (Công khai cho học viên)</option>
                        <option value="DRAFT">✎ Bản nháp (Chỉ riêng bạn xem)</option>
                        <option value="ARCHIVED">📦 Lưu trữ (Ẩn câu hỏi)</option>
                      </select>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div>
                    <RichMathEditor
                      label="Nội dung câu hỏi"
                      value={formContent}
                      onChange={setFormContent}
                      required
                      placeholder="Nhập nội dung câu hỏi... Ví dụ: Tính tích phân $I = \int_{0}^{1} x^2 dx$ hoặc chèn ảnh minh họa đồ thị, mạch điện"
                      minRows={3}
                      allowImageUpload={true}
                    />
                  </div>

                  {/* Options editor */}
                  {formType !== 'ESSAY' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">Các lựa chọn đáp án (Hỗ trợ công thức $...$)</label>
                        <span className="text-[10px] text-slate-400">Ví dụ: $x = \frac{1}{2}$</span>
                      </div>
                      {formOptions.map((opt, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                            <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                              {opt.optionKey}
                            </span>
                            <input
                              type="text"
                              value={opt.optionText}
                              onChange={(e) => {
                                const next = [...formOptions];
                                next[idx].optionText = e.target.value;
                                setFormOptions(next);
                              }}
                              placeholder={`Nội dung đáp án ${opt.optionKey}...`}
                              className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none font-mono"
                            />
                            <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 cursor-pointer pr-2">
                              <input
                                type="radio"
                                name="correctOption"
                                checked={opt.isCorrect}
                                onChange={() => {
                                  const next = formOptions.map((o, i) => ({
                                    ...o,
                                    isCorrect: i === idx,
                                  }));
                                  setFormOptions(next);
                                }}
                                className="accent-emerald-600"
                              />
                              <span>Đúng</span>
                            </label>
                          </div>
                          {opt.optionText && opt.optionText.includes('$') && (
                            <div className="px-3 py-1 bg-white border border-slate-100 rounded-xl text-xs">
                              <MathMarkdownRenderer content={opt.optionText} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <RichMathEditor
                      label="Lời giải thích chi tiết"
                      value={formExplanation}
                      onChange={setFormExplanation}
                      placeholder="Hướng dẫn giải chi tiết từng bước, các công thức áp dụng hoặc hình vẽ giải thích..."
                      minRows={2}
                      allowImageUpload={true}
                    />
                  </div>

                  {/* Listening Audio (Optional) */}
                  <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                      <Headphones className="w-4 h-4 text-purple-600" />
                      <span>Âm thanh bài nghe (Dành cho môn Tiếng Anh / Ngoại ngữ)</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        URL File âm thanh (Audio URL hoặc đường dẫn MP3/WAV)
                      </label>
                      <input
                        type="text"
                        value={formAudioUrl}
                        onChange={(e) => setFormAudioUrl(e.target.value)}
                        placeholder="Ví dụ: /api/v1/public/media/listening-xxx.wav hoặc URL âm thanh online"
                        className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Kịch bản hội thoại / Lời thoại (Audio Script / Transcript)
                      </label>
                      <textarea
                        value={formAudioScript}
                        onChange={(e) => setFormAudioScript(e.target.value)}
                        rows={2}
                        placeholder="Nội dung kịch bản hội thoại (sẽ hiển thị cho giáo viên hoặc khi học sinh đã nộp bài)..."
                        className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Thẻ / Từ khóa (phân cách bằng dấu phẩy)</label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="Ví dụ: tích phân, đạo hàm, toán 12"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Đang lưu...' : editingQuestionId ? 'Cập nhật' : 'Tạo câu hỏi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* AI Question Generator Modal */}
          <AiQuestionGeneratorModal
            isOpen={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            subjects={subjects}
            courses={courses}
            lessons={lessons}
            onQuestionsApproved={() => {
              loadData();
            }}
          />

          {/* Trash / Deletion History Modal */}
          {trashModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>Lịch sử xóa / Thùng rác</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                          {deletedQuestions.length} câu hỏi
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Các câu hỏi đã bị xóa mềm. Bạn có thể khôi phục lại bất kỳ lúc nào.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTrashModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                  {loadingTrash ? (
                    <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
                      <RotateCcw className="w-7 h-7 animate-spin text-rose-600" />
                      <p className="text-sm font-semibold">Đang tải danh sách câu hỏi đã xóa...</p>
                    </div>
                  ) : deletedQuestions.length === 0 ? (
                    <div className="py-16 text-center text-slate-500">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-2xl">
                        🗑️
                      </div>
                      <h3 className="font-bold text-slate-700 text-base">Thùng rác trống</h3>
                      <p className="text-xs text-slate-400 mt-1">Không có câu hỏi nào bị xóa trong hệ thống.</p>
                    </div>
                  ) : (
                    deletedQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-rose-200 transition-all shadow-2xs space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {q.subjectName || 'Môn học'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {q.gradeLevel || 'Chung'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-700">
                              {QUESTION_TYPES.find((t) => t.type === q.questionType)?.label || q.questionType}
                            </span>
                          </div>

                          <button
                            onClick={() => handleRestoreQuestion(q.id)}
                            disabled={restoringId === q.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                          >
                            <Undo2 className={`w-3.5 h-3.5 ${restoringId === q.id ? 'animate-spin' : ''}`} />
                            <span>{restoringId === q.id ? 'Đang khôi phục...' : 'Khôi phục'}</span>
                          </button>
                        </div>

                        {/* Content */}
                        <div className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                          <MathMarkdownRenderer content={q.content} />
                        </div>

                        {/* Deletion details */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>
                            Xóa bởi: <strong className="text-slate-600 font-semibold">{q.deletedBy || q.creatorName || 'Người dùng'}</strong>
                          </span>
                          <span>
                            Thời gian: {q.deletedAt ? new Date(q.deletedAt).toLocaleString('vi-VN') : 'Gần đây'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button
                    onClick={() => setTrashModalOpen(false)}
                    className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        {/* ========================================================================= */}
        {/* CATEGORY CREATION MODAL                                                   */}
        {/* ========================================================================= */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Thêm chuyên đề câu hỏi</h3>
                    <p className="text-[11px] text-slate-500">Phân loại câu hỏi theo chủ đề kiến thức</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-3.5 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên chuyên đề / danh mục *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryFormName}
                    onChange={(e) => setCategoryFormName(e.target.value)}
                    placeholder="Ví dụ: Cộng trừ trong phạm vi 100..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Môn học *</label>
                    <select
                      value={categoryFormSubjectId}
                      onChange={(e) => setCategoryFormSubjectId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp *</label>
                    <select
                      value={categoryFormGrade}
                      onChange={(e) => setCategoryFormGrade(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      {ALL_GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô tả chuyên đề (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={categoryFormDesc}
                    onChange={(e) => setCategoryFormDesc(e.target.value)}
                    placeholder="Mô tả phạm vi kiến thức, dạng bài..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quyền riêng tư / Chế độ xem *
                  </label>
                  <div className="space-y-2">
                    <label
                      className={`p-2.5 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition ${
                        categoryFormVisibility === 'PUBLIC'
                          ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-200'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="categoryVisibility"
                        value="PUBLIC"
                        checked={categoryFormVisibility === 'PUBLIC'}
                        onChange={() => setCategoryFormVisibility('PUBLIC')}
                        className="mt-0.5 accent-indigo-600 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>🌐 Công khai (Public)</span>
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tất cả mọi người trong hệ thống (học sinh, giáo viên, admin) đều xem được.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`p-2.5 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition ${
                        categoryFormVisibility === 'TEACHER_SHARED'
                          ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-200'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="categoryVisibility"
                        value="TEACHER_SHARED"
                        checked={categoryFormVisibility === 'TEACHER_SHARED'}
                        onChange={() => setCategoryFormVisibility('TEACHER_SHARED')}
                        className="mt-0.5 accent-indigo-600 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>👥 Giáo viên & Quản trị</span>
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Cho người tạo, ban quản trị (Admin) và toàn bộ các giáo viên xem được.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`p-2.5 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition ${
                        categoryFormVisibility === 'PRIVATE'
                          ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-200'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="categoryVisibility"
                        value="PRIVATE"
                        checked={categoryFormVisibility === 'PRIVATE'}
                        onChange={() => setCategoryFormVisibility('PRIVATE')}
                        className="mt-0.5 accent-indigo-600 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>🔒 Riêng tư (Private)</span>
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Chỉ mỗi bạn (người tạo) và ban quản trị (Admin) xem được.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCategory}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {isSavingCategory ? 'Đang lưu...' : 'Tạo chuyên đề'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Question Paper Export Modal */}
        <QuestionPaperExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          subjectName={activeSubject?.name || 'Toán học'}
          gradeLevel={selectedGradeLevel || undefined}
          categoryName={categories.find((c) => c.id === selectedCategoryId)?.name || undefined}
          totalQuestions={currentQuestions.length}
          onExport={handleExportQuestions}
        />
        </div>
      </div>
    </RoleGuard>
  );
}
