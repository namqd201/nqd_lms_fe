'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { examService } from '@/services/exam.service';
import { questionService } from '@/services/question.service';
import { subjectService } from '@/services/subject.service';
import { courseService } from '@/services/course.service';
import {
  TeacherExamResponse,
  TeacherExamRequest,
  ExamStatus,
  ExamVisibility,
  TeacherExamStudentCandidateResponse,
  TeacherExamResultsSummaryResponse,
  TeacherExamAttemptDetailResponse,
  ExamPaperExportParams,
} from '@/types/exam';
import { TeacherQuestionResponse, QuestionCategoryResponse } from '@/types/question';
import { questionCategoryService } from '@/services/questionCategory.service';
import { SubjectResponse } from '@/types/admin';
import { TeacherCourseResponse } from '@/types/course';
import { AiExamGeneratorModal } from '@/components/AiExamGeneratorModal';
import ExamPaperExportModal from '@/components/ExamPaperExportModal';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import {
  FileText,
  Globe,
  Lock,
  Copy,
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
  UserCheck,
  Mail,
  User,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  Activity,
  Target,
  Undo2,
  X,
  Printer,
  FileDown,
} from 'lucide-react';
import { GRADE_LEVEL_GROUPS, isGradeMatching } from '@/constants/gradeLevels';


const VISIBILITY_CONFIGS: {
  visibility: ExamVisibility;
  label: string;
  icon: any;
  color: string;
  badge: string;
  description: string;
}[] = [
  {
    visibility: 'PRIVATE',
    label: 'Riêng tư',
    icon: Lock,
    color: 'bg-slate-100 text-slate-700',
    badge: 'border-slate-300',
    description: 'Chỉ bạn xem và giao bài được',
  },
  {
    visibility: 'SUBJECT_SHARED',
    label: 'Cùng tổ bộ môn',
    icon: Users,
    color: 'bg-blue-50 text-blue-700',
    badge: 'border-blue-300',
    description: 'Chia sẻ cho các giáo viên cùng môn sao chép',
  },
  {
    visibility: 'PUBLIC',
    label: 'Công khai toàn trường',
    icon: Globe,
    color: 'bg-indigo-50 text-indigo-700',
    badge: 'border-indigo-300',
    description: 'Mọi giáo viên và học sinh đều có thể tham khảo',
  },
];

const STATUS_CONFIGS: { status: ExamStatus; label: string; color: string; badge: string }[] = [
  { status: 'DRAFT', label: 'Bản nháp', color: 'bg-slate-100 text-slate-700', badge: 'border-slate-300' },
  { status: 'PUBLISHED', label: 'Đang phát hành', color: 'bg-emerald-50 text-emerald-700', badge: 'border-emerald-300' },
  { status: 'ARCHIVED', label: 'Đã lưu trữ', color: 'bg-purple-50 text-purple-700', badge: 'border-purple-300' },
];

const TITLE_SUGGESTIONS = [
  'Kiểm tra đánh giá năng lực',
  'Kiểm tra 15 phút',
  'Kiểm tra 1 tiết (45 phút)',
  'Kiểm tra giữa học kỳ 1',
  'Kiểm tra cuối học kỳ 1',
  'Kiểm tra giữa học kỳ 2',
  'Kiểm tra cuối học kỳ 2',
  'Khảo sát chất lượng đầu năm',
  'Đề thi thử tốt nghiệp',
];

export default function TeacherExamsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');

  const [exams, setExams] = useState<TeacherExamResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [courses, setCourses] = useState<TeacherCourseResponse[]>([]);
  const [allQuestions, setAllQuestions] = useState<TeacherQuestionResponse[]>([]);
  // Main Tab State: 'my_exams' | 'shared_library'
  const [activeMainTab, setActiveMainTab] = useState<'my_exams' | 'shared_library'>('my_exams');
  const [sharedExams, setSharedExams] = useState<TeacherExamResponse[]>([]);
  const [loadingShared, setLoadingShared] = useState<boolean>(false);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<string | null>(null);
  const [sharedSearchQuery, setSharedSearchQuery] = useState<string>('');
  const [sharedSelectedSubject, setSharedSelectedSubject] = useState<string>('ALL');
  const [sharedSelectedGrade, setSharedSelectedGrade] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [aiExamModalOpen, setAiExamModalOpen] = useState<boolean>(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formGradeLevel, setFormGradeLevel] = useState<string>('Lớp 1');
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formInstructions, setFormInstructions] = useState<string>('');
  const [formDuration, setFormDuration] = useState<number>(45);
  const [formTotalMarks, setFormTotalMarks] = useState<number>(10);
  const [formPassingMarks, setFormPassingMarks] = useState<number>(5);
  const [formMaxAttempts, setFormMaxAttempts] = useState<number>(1);
  const [formShuffleQuestions, setFormShuffleQuestions] = useState<boolean>(true);
  const [formShuffleOptions, setFormShuffleOptions] = useState<boolean>(true);
  const [formStatus, setFormStatus] = useState<ExamStatus>('DRAFT');
  const [formVisibility, setFormVisibility] = useState<ExamVisibility>('PRIVATE');
  const [formEnableProctoring, setFormEnableProctoring] = useState<boolean>(false);
  const [formMaxViolationCount, setFormMaxViolationCount] = useState<number>(5);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Question Selector Modal State
  const [questionSelectorOpen, setQuestionSelectorOpen] = useState<boolean>(false);
  const [selectorSearch, setSelectorSearch] = useState<string>('');
  const [selectorCourseFilter, setSelectorCourseFilter] = useState<string>('ALL');
  const [selectorTypeFilter, setSelectorTypeFilter] = useState<string>('ALL');
  const [selectorDifficultyFilter, setSelectorDifficultyFilter] = useState<string>('ALL');
  const [selectorCategoryFilter, setSelectorCategoryFilter] = useState<string>('ALL');
  const [selectorCategories, setSelectorCategories] = useState<QuestionCategoryResponse[]>([]);

  // Detail / Preview Modal
  const [previewExam, setPreviewExam] = useState<TeacherExamResponse | null>(null);

  // Assign Students Modal State
  const [assigningExam, setAssigningExam] = useState<TeacherExamResponse | null>(null);
  const [candidateStudents, setCandidateStudents] = useState<TeacherExamStudentCandidateResponse[]>([]);
  const [selectedStudentIdsToAssign, setSelectedStudentIdsToAssign] = useState<string[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState<boolean>(false);
  const [isSavingAssignments, setIsSavingAssignments] = useState<boolean>(false);
  const [candidateSearch, setCandidateSearch] = useState<string>('');

  // Exam Results Modal State
  const [resultsModalExam, setResultsModalExam] = useState<TeacherExamResponse | null>(null);
  const [examResultsData, setExamResultsData] = useState<TeacherExamResultsSummaryResponse | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [resultsSearch, setResultsSearch] = useState<string>('');
  const [detailedAttemptData, setDetailedAttemptData] = useState<TeacherExamAttemptDetailResponse | null>(null);
  const [isLoadingAttemptDetail, setIsLoadingAttemptDetail] = useState<boolean>(false);

  // Trash / Deletion History State
  const [trashModalOpen, setTrashModalOpen] = useState<boolean>(false);
  const [deletedExams, setDeletedExams] = useState<TeacherExamResponse[]>([]);
  const [loadingTrash, setLoadingTrash] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Exam Paper Export Modal State (Word .docx & PDF .pdf)
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [examToExport, setExamToExport] = useState<TeacherExamResponse | null>(null);

  const handleOpenExportModal = (exam: TeacherExamResponse) => {
    setExamToExport(exam);
    setExportModalOpen(true);
  };

  const handleExportExam = async (params: ExamPaperExportParams, format: 'DOCX' | 'PDF') => {
    if (!examToExport) return;
    if (format === 'DOCX') {
      await examService.exportExamDocx(examToExport.id, params);
    } else {
      await examService.exportExamPdf(examToExport.id, params);
    }
  };

  
  const loadSharedLibrary = async () => {
    setLoadingShared(true);
    try {
      const data = await examService.getSharedLibrary({
        subjectId: sharedSelectedSubject !== 'ALL' ? sharedSelectedSubject : undefined,
        gradeLevel: sharedSelectedGrade !== 'ALL' ? sharedSelectedGrade : undefined,
        keyword: sharedSearchQuery.trim() || undefined,
      });
      setSharedExams(data);
    } catch (err: unknown) {
      console.error('Lỗi khi tải thư viện đề thi dùng chung:', err);
    } finally {
      setLoadingShared(false);
    }
  };

  const handleCloneExam = async (examId: string) => {
    setCloningId(examId);
    try {
      const cloned = await examService.cloneExam(examId);
      setSuccessMessage(`Đã sao chép đề thi "${cloned.title}" về danh sách của bạn thành công (bản nháp)!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadData();
      setActiveMainTab('my_exams');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Sao chép đề thi thất bại');
    } finally {
      setCloningId(null);
    }
  };

  const handleUpdateVisibility = async (examId: string, newVis: ExamVisibility) => {
    setUpdatingVisibilityId(examId);
    try {
      await examService.updateExamVisibility(examId, newVis);
      setSuccessMessage(`Đã cập nhật quyền chia sẻ thành công!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setExams((prev) => prev.map((e) => (e.id === examId ? { ...e, visibility: newVis } : e)));
      loadSharedLibrary();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Cập nhật quyền chia sẻ thất bại');
    } finally {
      setUpdatingVisibilityId(null);
    }
  };

  const handleOpenTrash = async () => {
    setTrashModalOpen(true);
    setLoadingTrash(true);
    try {
      const data = await examService.getDeletedExams();
      setDeletedExams(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải lịch sử đề thi đã xóa');
    } finally {
      setLoadingTrash(false);
    }
  };

  const handleRestoreExam = async (examId: string) => {
    setRestoringId(examId);
    try {
      await examService.restoreExam(examId);
      setSuccessMessage('Khôi phục đề thi thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      setDeletedExams((prev) => prev.filter((e) => e.id !== examId));
      await loadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Khôi phục đề thi thất bại');
    } finally {
      setRestoringId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [exs, subs, crs, qs] = await Promise.all([
        examService.getTeacherExams(),
        subjectService.getActiveSubjects(),
        courseService.getTeacherCourses().catch(() => []),
        questionService.getQuestions().catch(() => []),
      ]);
      setExams(exs);
      setSubjects(subs);
      setCourses(crs);
      setAllQuestions(qs);
      if (subs.length > 0 && !formSubjectId) {
        setFormSubjectId(subs[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách đề thi';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Load question categories for the selected subject and grade
  useEffect(() => {
    if (formSubjectId) {
      questionCategoryService.getCategories({
        subjectId: formSubjectId,
        gradeLevel: formGradeLevel && formGradeLevel !== 'ALL' ? formGradeLevel : undefined,
      }).then(setSelectorCategories).catch(() => setSelectorCategories([]));
    } else {
      setSelectorCategories([]);
    }
  }, [formSubjectId, formGradeLevel]);

  // Rule-based Code Generator
  const generateExamCode = (subId: string, grade: string) => {
    const sub = subjects.find((s) => s.id === subId);
    let subPrefix = 'MON';
    if (sub) {
      const name = sub.name.toLowerCase();
      const code = (sub.code || '').toUpperCase();
      if (name.includes('toán') || code.includes('MATH')) subPrefix = 'TOAN';
      else if (name.includes('tin') || code.includes('IT')) subPrefix = 'TIN';
      else if (name.includes('anh') || code.includes('ENG')) subPrefix = 'ANH';
      else if (name.includes('lý') || code.includes('PHYS')) subPrefix = 'LY';
      else if (name.includes('hóa') || code.includes('CHEM')) subPrefix = 'HOA';
      else if (name.includes('sinh') || code.includes('BIO')) subPrefix = 'SINH';
      else if (name.includes('văn') || code.includes('LIT')) subPrefix = 'VAN';
      else if (code.length >= 3) subPrefix = code.slice(0, 4);
    }

    let gradeSuffix = 'L1';
    if (grade) {
      const gLower = grade.toLowerCase();
      if (gLower.includes('năm nhất') || gLower.includes('năm 1')) gradeSuffix = 'N1';
      else if (gLower.includes('năm 2') || gLower.includes('năm hai')) gradeSuffix = 'N2';
      else if (gLower.includes('năm 3') || gLower.includes('năm ba')) gradeSuffix = 'N3';
      else if (gLower.includes('năm 4') || gLower.includes('năm tư') || gLower.includes('năm bốn')) gradeSuffix = 'N4';
      else {
        const numMatch = grade.match(/\d+/);
        if (numMatch) gradeSuffix = `L${numMatch[0]}`;
        else if (gLower.includes('tiểu học')) gradeSuffix = 'TH';
        else if (gLower.includes('thcs')) gradeSuffix = 'THCS';
        else if (gLower.includes('thpt')) gradeSuffix = 'THPT';
        else if (gLower.includes('đại học')) gradeSuffix = 'DH';
      }
    }

    const rand = Math.floor(1000 + Math.random() * 9000);
    return `DE_${subPrefix}_${gradeSuffix}_${rand}`;
  };

  // All questions matching current exam criteria (Subject & Grade) with selector filters
  const matchingQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      // 1. Subject match
      const matchSub = !formSubjectId || q.subjectId === formSubjectId;

      // 2. Grade level match (supports both specific grades like 'Lớp 1' and general levels like 'Tiểu học')
      const matchGrade = !formGradeLevel || isGradeMatching(q.gradeLevel, formGradeLevel);

      // 3. Course match (If user set a course filter or if formCourseId is active)
      let matchCourse = true;
      if (selectorCourseFilter !== 'ALL') {
        if (selectorCourseFilter === 'NONE') {
          matchCourse = !q.courseId;
        } else {
          matchCourse = q.courseId === selectorCourseFilter;
        }
      }

      // 3.1 Category / Topic match
      let matchCat = true;
      if (selectorCategoryFilter !== 'ALL') {
        matchCat = q.categoryId === selectorCategoryFilter;
      }

      // 4. Keyword search
      const qText = selectorSearch.toLowerCase().trim();
      const matchText =
        !qText ||
        q.content.toLowerCase().includes(qText) ||
        (q.explanation && q.explanation.toLowerCase().includes(qText)) ||
        (q.tags && q.tags.some((t) => t.toLowerCase().includes(qText)));

      // 5. Type filter
      const matchType = selectorTypeFilter === 'ALL' || q.questionType === selectorTypeFilter;

      // 6. Difficulty filter
      const matchDiff = selectorDifficultyFilter === 'ALL' || q.difficulty === selectorDifficultyFilter;

      return matchSub && matchGrade && matchCourse && matchCat && matchText && matchType && matchDiff;
    });
  }, [allQuestions, formSubjectId, formGradeLevel, formCourseId, selectorCourseFilter, selectorCategoryFilter, selectorSearch, selectorTypeFilter, selectorDifficultyFilter]);

  // Selected questions mapped from selectedQuestionIds
  const selectedQuestions = useMemo(() => {
    return selectedQuestionIds
      .map((id) => allQuestions.find((q) => q.id === id))
      .filter((q): q is TeacherQuestionResponse => Boolean(q));
  }, [selectedQuestionIds, allQuestions]);

  const calculatedSelectedMarks = useMemo(() => {
    return selectedQuestions.reduce((acc, q) => acc + (Number(q.defaultMarks) || 1), 0);
  }, [selectedQuestions]);

  // Handle open create modal
  const handleOpenCreateModal = () => {
    setEditingExamId(null);
    const initSubId = subjects.length > 0 ? subjects[0].id : '';
    const initGrade = 'Lớp 1';
    setFormSubjectId(initSubId);
    setFormGradeLevel(initGrade);
    setFormTitle('');
    setFormCode(generateExamCode(initSubId, initGrade));
    setFormCourseId('');
    setFormDescription('');
    setFormInstructions('Học sinh làm bài cẩn thận, không gian lận trong thời gian thi.');
    setFormDuration(45);
    setFormTotalMarks(10);
    setFormPassingMarks(5);
    setFormMaxAttempts(1);
    setFormShuffleQuestions(true);
    setFormShuffleOptions(true);
    setFormStatus('DRAFT');
    setFormVisibility('PRIVATE');
    setFormEnableProctoring(false);
    setFormMaxViolationCount(5);
    setSelectedQuestionIds([]);
    setQuestionSelectorOpen(false);
    setSelectorSearch('');
    setSelectorCourseFilter('ALL');
    setSelectorTypeFilter('ALL');
    setSelectorDifficultyFilter('ALL');
    setSelectorCategoryFilter('ALL');
    setModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = async (exam: TeacherExamResponse) => {
    try {
      const detail = await examService.getExamById(exam.id);
      setEditingExamId(detail.id);
      setFormTitle(detail.title);
      setFormCode(detail.code || generateExamCode(detail.subjectId, detail.gradeLevel || 'Lớp 1'));
      setFormSubjectId(detail.subjectId);
      setFormGradeLevel(detail.gradeLevel || 'Lớp 1');
      setFormCourseId(detail.courseId || '');
      setFormDescription(detail.description || '');
      setFormInstructions(detail.instructions || '');
      setFormDuration(detail.durationMinutes || 45);
      setFormTotalMarks(detail.totalMarks || 10);
      setFormPassingMarks(detail.passingMarks || 5);
      setFormMaxAttempts(detail.maxAttempts || 1);
      setFormShuffleQuestions(Boolean(detail.shuffleQuestions));
      setFormShuffleOptions(Boolean(detail.shuffleOptions));
      setFormStatus(detail.status);
      setFormVisibility(detail.visibility || 'PRIVATE');
      setFormEnableProctoring(Boolean(detail.enableProctoring));
      setFormMaxViolationCount(detail.maxViolationCount || 5);
      setSelectedQuestionIds(detail.questions ? detail.questions.map((q) => q.id) : []);
      setQuestionSelectorOpen(false);
      setSelectorSearch('');
      setSelectorCourseFilter('ALL');
      setSelectorTypeFilter('ALL');
      setSelectorDifficultyFilter('ALL');
      setModalOpen(true);
    } catch {
      setErrorMessage('Không thể tải chi tiết đề thi để chỉnh sửa.');
    }
  };

  // Handle preview modal
  const handleOpenPreview = async (exam: TeacherExamResponse) => {
    try {
      const detail = await examService.getExamById(exam.id);
      setPreviewExam(detail);
    } catch {
      setPreviewExam(exam);
    }
  };

  // Save Exam (Create or Update)
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectId || !formTitle.trim()) {
      setErrorMessage('Vui lòng chọn môn học và nhập tên đề thi.');
      return;
    }

    if (selectedQuestionIds.length === 0) {
      if (!confirm('Đề thi hiện chưa có câu hỏi nào. Bạn có chắc chắn muốn lưu đề thi trống không?')) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: TeacherExamRequest = {
        subjectId: formSubjectId,
        courseId: formCourseId || undefined,
        code: formCode.trim() || generateExamCode(formSubjectId, formGradeLevel),
        gradeLevel: formGradeLevel,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        instructions: formInstructions.trim() || undefined,
        durationMinutes: Number(formDuration) || 45,
        totalMarks: Number(formTotalMarks) || 10,
        passingMarks: Number(formPassingMarks) || 5,
        maxAttempts: Number(formMaxAttempts) || 1,
        shuffleQuestions: formShuffleQuestions,
        shuffleOptions: formShuffleOptions,
        status: formStatus,
        visibility: formVisibility,
        enableProctoring: formEnableProctoring,
        maxViolationCount: Number(formMaxViolationCount) || 5,
        questionIds: selectedQuestionIds,
      };

      if (editingExamId) {
        await examService.updateExam(editingExamId, payload);
        setSuccessMessage('Cập nhật đề thi thành công!');
      } else {
        await examService.createExam(payload);
        setSuccessMessage('Tạo đề thi mới thành công!');
      }

      setModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu đề thi thất bại';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish Exam
  const handlePublishExam = async (id: string) => {
    try {
      await examService.publishExam(id);
      setSuccessMessage('Đã phát hành đề thi (PUBLISHED). Học sinh có thể bắt đầu làm bài.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Phát hành đề thi thất bại';
      setErrorMessage(msg);
    }
  };

  // Archive Exam
  const handleArchiveExam = async (id: string) => {
    try {
      await examService.archiveExam(id);
      setSuccessMessage('Đã chuyển đề thi vào Kho Lưu Trữ (ARCHIVED).');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu trữ đề thi thất bại';
      setErrorMessage(msg);
    }
  };

  // Delete Exam
  const handleDeleteExam = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa đề thi:\n"${title}"?`)) return;

    try {
      await examService.deleteExam(id);
      setSuccessMessage('Đã xóa đề thi thành công.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa đề thi thất bại';
      setErrorMessage(msg);
    }
  };

  // Open Assign Students Modal
  const handleOpenAssignModal = async (exam: TeacherExamResponse) => {
    setAssigningExam(exam);
    setIsLoadingCandidates(true);
    setCandidateSearch('');
    try {
      const candidates = await examService.getEligibleStudents(exam.id);
      setCandidateStudents(candidates);
      const initiallyAssigned = candidates.filter((c) => c.isAssigned).map((c) => c.studentId);
      setSelectedStudentIdsToAssign(initiallyAssigned);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách học viên';
      setErrorMessage(msg);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIdsToAssign((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllCandidates = (filteredList: TeacherExamStudentCandidateResponse[]) => {
    const idsToAdd = filteredList.map((c) => c.studentId);
    setSelectedStudentIdsToAssign((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleDeselectAllCandidates = (filteredList: TeacherExamStudentCandidateResponse[]) => {
    const idsToRemove = new Set(filteredList.map((c) => c.studentId));
    setSelectedStudentIdsToAssign((prev) => prev.filter((id) => !idsToRemove.has(id)));
  };

  const handleSaveAssignments = async () => {
    if (!assigningExam) return;
    setIsSavingAssignments(true);
    try {
      await examService.assignStudents(assigningExam.id, selectedStudentIdsToAssign);
      setSuccessMessage(
        `Đã giao bài kiểm tra "${assigningExam.title}" cho ${selectedStudentIdsToAssign.length} học viên thành công! Thông báo đã được gửi tới học sinh.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      setAssigningExam(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Giao bài kiểm tra thất bại';
      setErrorMessage(msg);
    } finally {
      setIsSavingAssignments(false);
    }
  };

  // Open Results Modal
  const handleOpenResultsModal = async (exam: TeacherExamResponse) => {
    setResultsModalExam(exam);
    setIsLoadingResults(true);
    setResultsSearch('');
    try {
      const data = await examService.getExamResults(exam.id);
      setExamResultsData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải kết quả bài kiểm tra';
      setErrorMessage(msg);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Open Attempt Detail Modal
  const handleOpenAttemptDetail = async (attemptId: string) => {
    setIsLoadingAttemptDetail(true);
    try {
      const data = await examService.getAttemptDetail(attemptId);
      setDetailedAttemptData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải chi tiết bài làm';
      setErrorMessage(msg);
    } finally {
      setIsLoadingAttemptDetail(false);
    }
  };

  // Toggle single question in selection
  const handleToggleQuestion = (qId: string) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  // Remove single question from exam
  const handleRemoveQuestionFromExam = (qId: string) => {
    setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qId));
  };

  // Select all / Deselect all matching questions
  const handleSelectAllMatchingQuestions = () => {
    const matchingIds = matchingQuestions.map((q) => q.id);
    const allSelected = matchingIds.length > 0 && matchingIds.every((id) => selectedQuestionIds.includes(id));
    if (allSelected) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => !matchingIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedQuestionIds, ...matchingIds]));
      setSelectedQuestionIds(merged);
    }
  };

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        e.title.toLowerCase().includes(query) ||
        (e.code && e.code.toLowerCase().includes(query)) ||
        (e.subjectName && e.subjectName.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query));

      const matchesSubject = selectedSubject === 'ALL' || e.subjectId === selectedSubject;
      const matchesGrade = selectedGrade === 'ALL' || e.gradeLevel === selectedGrade;
      const matchesStatus = selectedStatus === 'ALL' || e.status === selectedStatus;

      return matchesSearch && matchesSubject && matchesGrade && matchesStatus;
    });
  }, [exams, searchQuery, selectedSubject, selectedGrade, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: exams.length,
      published: exams.filter((e) => e.status === 'PUBLISHED').length,
      draft: exams.filter((e) => e.status === 'DRAFT').length,
      archived: exams.filter((e) => e.status === 'ARCHIVED').length,
    };
  }, [exams]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('ALL');
    setSelectedGrade('ALL');
    setSelectedStatus('ALL');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSubject !== 'ALL' ||
    selectedGrade !== 'ALL' ||
    selectedStatus !== 'ALL';

  return (
    <RoleGuard allowedRoles={['TEACHER', 'ROLE_TEACHER', 'ADMIN', 'ROLE_ADMIN']}>
      <div className="min-h-screen bg-slate-50 py-10 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Quản lý Đề thi Giảng viên</span>
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Danh sách Đề thi & Bài kiểm tra
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Tạo đề thi mới, tự sinh mã đề chuẩn theo môn và khối lớp, chọn lọc câu hỏi từ ngân hàng câu hỏi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleOpenTrash}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Xem các đề thi đã xóa & Khôi phục"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Lịch sử xóa</span>
              </button>

              <Link
                href="/teacher/questions"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-sm transition-all"
              >
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span>Ngân hàng Câu hỏi</span>
              </Link>
              <button
                onClick={() => setAiExamModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all self-start md:self-auto transform active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                <span>AI Biên Soạn Đề Thi</span>
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-md shadow-[#83C75D]/20 transition-all self-start md:self-auto transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Đề thi Mới</span>
              </button>
            </div>
          </div>

          
          {/* Main Tab Switcher */}
          <div className="flex items-center gap-3 border-b border-slate-200">
            <button
              onClick={() => setActiveMainTab('my_exams')}
              className={`flex items-center gap-2 pb-3 px-2 border-b-2 text-sm font-bold transition-all cursor-pointer ${
                activeMainTab === 'my_exams'
                  ? 'border-[#83C75D] text-[#4e8231]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Đề thi của tôi</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                {exams.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveMainTab('shared_library');
                loadSharedLibrary();
              }}
              className={`flex items-center gap-2 pb-3 px-2 border-b-2 text-sm font-bold transition-all cursor-pointer ${
                activeMainTab === 'shared_library'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Thư viện đề dùng chung</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                {sharedExams.length}
              </span>
            </button>
          </div>

          {/* My Exams Tab Content */}
          {activeMainTab === 'my_exams' && (
            <div className="space-y-6">
              {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng số đề</span>
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Đang phát hành</span>
              <p className="text-2xl font-black text-emerald-700">{stats.published}</p>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Bản nháp</span>
              <p className="text-2xl font-black text-amber-700">{stats.draft}</p>
            </div>
            <div className="bg-purple-50/70 border border-purple-200 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-xs text-purple-600 font-bold uppercase tracking-wider">Đã lưu trữ</span>
              <p className="text-2xl font-black text-purple-700">{stats.archived}</p>
            </div>
          </div>

          {/* Notifications */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-sm shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
                ✕
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-800 text-sm shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
                ✕
              </button>
            </div>
          )}

          {/* Search & Filters */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên đề, mã đề..."
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#83C75D] focus:bg-white rounded-2xl text-xs sm:text-sm outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Subject */}
              <div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none focus:border-[#83C75D] font-medium"
                >
                  <option value="ALL">📚 Tất cả Môn học</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade Level */}
              <div>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none focus:border-[#83C75D] font-medium"
                >
                  <option value="ALL">🎓 Tất cả Khối / Cấp độ</option>
                  {GRADE_LEVEL_GROUPS.map((group) => (
                    <optgroup key={group.level} label={group.label}>
                      {group.grades.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none focus:border-[#83C75D] font-medium"
                >
                  <option value="ALL">⚡ Tất cả Trạng thái</option>
                  {STATUS_CONFIGS.map((s) => (
                    <option key={s.status} value={s.status}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Summary & Reset */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <span>Hiển thị:</span>
                <strong className="text-slate-900 font-bold">{filteredExams.length}</strong>
                <span>/ {exams.length} đề thi</span>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
            </div>
          </div>

          {/* Exam Cards Grid */}
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 border-4 border-[#83C75D]/30 border-t-[#83C75D] rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Đang tải danh sách đề thi...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="p-16 bg-white border border-slate-200 rounded-3xl text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Chưa có đề thi nào</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Bắt đầu tạo đề thi trắc nghiệm hoặc tự luận, gắn mã đề và chọn câu hỏi từ ngân hàng câu hỏi.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Đề thi Đầu Tiên</span>
              </button>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="p-16 bg-white border border-slate-200 rounded-3xl text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Không tìm thấy đề thi phù hợp</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Không có đề thi nào khớp với các tiêu chí tìm kiếm hoặc bộ lọc hiện tại.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại bộ lọc</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => {
                const statusConf = STATUS_CONFIGS.find((s) => s.status === exam.status) || STATUS_CONFIGS[0];

                return (
                  <div
                    key={exam.id}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top row: Subject, Code & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {exam.subjectName && (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#83C75D]/15 text-[#4e8231]">
                              {exam.subjectName}
                            </span>
                          )}
                          {exam.gradeLevel && (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {exam.gradeLevel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {(() => {
                            const vis = exam.visibility || 'PRIVATE';
                            const vConf = VISIBILITY_CONFIGS.find((v) => v.visibility === vis) || VISIBILITY_CONFIGS[0];
                            const isAuthor = user && exam.creatorId === user.id;
                            return (
                              <div className="flex items-center gap-1">
                                {isAuthor || isAdmin ? (
                                  <select
                                    value={vis}
                                    disabled={updatingVisibilityId === exam.id}
                                    onChange={(e) => handleUpdateVisibility(exam.id, e.target.value as ExamVisibility)}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border outline-none cursor-pointer ${vConf.color} ${vConf.badge}`}
                                    title="Thay đổi quyền chia sẻ đề thi"
                                  >
                                    <option value="PRIVATE">🔒 Riêng tư</option>
                                    <option value="SUBJECT_SHARED">👥 Cùng bộ môn</option>
                                    <option value="PUBLIC">🌍 Toàn trường</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${vConf.color} ${vConf.badge}`}>
                                    {vConf.label}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${statusConf.color} ${statusConf.badge}`}>
                            {statusConf.label}
                          </span>
                        </div>
                      </div>

                      {/* Code & Title */}
                      <div>
                        {exam.code && (
                          <div className="text-[11px] font-mono font-bold text-slate-400 tracking-wide mb-1">
                            MÃ ĐỀ: {exam.code}
                          </div>
                        )}
                        <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                          {exam.title}
                        </h3>
                        {exam.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {exam.description}
                          </p>
                        )}
                      </div>

                      {/* Origin Exam Cloned Notice */}
                      {exam.originExamTitle && (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                          <Copy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Được sao chép từ: <strong className="font-bold">{exam.originExamTitle}</strong></span>
                        </div>
                      )}

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl text-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Thời gian</span>
                          <strong className="text-slate-800 font-bold">{exam.durationMinutes}p</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Số câu hỏi</span>
                          <strong className="text-slate-800 font-bold">{exam.questionCount} câu</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Thang điểm</span>
                          <strong className="text-slate-800 font-bold">{exam.totalMarks}đ</strong>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Admin moderation + Strict Creator-only for Edit & Delete */}
                    {(() => {
                      const isAuthor = user && exam.creatorId === user.id;
                      return (
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleOpenResultsModal(exam)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                              title="Xem kết quả làm bài của học sinh"
                            >
                              <BarChart3 className="w-4 h-4 text-emerald-600" />
                            </button>
                            <button
                              onClick={() => handleOpenAssignModal(exam)}
                              className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                              title="Thêm thành viên / Giao bài cho học sinh"
                            >
                              <Users className="w-4 h-4 text-purple-600" />
                            </button>
                            <button
                              onClick={() => handleOpenPreview(exam)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                              title="Xem chi tiết đề thi"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenExportModal(exam)}
                              className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                              title="In & Tải đề thi chuẩn Bộ GD&ĐT (Word / PDF)"
                            >
                              <Printer className="w-4 h-4 text-blue-600" />
                            </button>

                            {/* Edit: Only Creator */}
                            {isAuthor && (
                              <button
                                onClick={() => handleOpenEditModal(exam)}
                                className="p-2 text-slate-400 hover:text-[#4e8231] hover:bg-emerald-50 rounded-xl transition-colors"
                                title="Chỉnh sửa đề thi (Bạn là tác giả)"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {/* Publish / Archive / Moderate: Creator or Admin */}
                            {(isAuthor || isAdmin) && (
                              <>
                                {exam.status === 'DRAFT' && (
                                  <button
                                    onClick={() => handlePublishExam(exam.id)}
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                    title={isAdmin && !isAuthor ? 'Admin phê duyệt xuất bản đề thi' : 'Xuất bản đề thi'}
                                  >
                                    <Send className="w-4 h-4 text-emerald-600" />
                                  </button>
                                )}
                                {exam.status !== 'ARCHIVED' && (
                                  <button
                                    onClick={() => handleArchiveExam(exam.id)}
                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                                    title={isAdmin && !isAuthor ? 'Admin lưu trữ / khóa đề thi' : 'Lưu trữ đề thi'}
                                  >
                                    <Archive className="w-4 h-4 text-purple-600" />
                                  </button>
                                )}
                              </>
                            )}

                            {/* Delete: Only Creator */}
                            {isAuthor && (
                              <button
                                onClick={() => handleDeleteExam(exam.id, exam.title)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                title="Xóa đề thi (Bạn là tác giả)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                            {!isAuthor && (
                              <span className="text-[10px] font-semibold text-slate-400 italic px-1">
                                (Chỉ tác giả được sửa, xóa)
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenPreview(exam)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 shrink-0"
                          >
                            <span>Chi tiết</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}

                      </div>
          )}

          {/* Shared Exam Library Tab Content */}
          {activeMainTab === 'shared_library' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Shared Library Search & Filters */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative lg:col-span-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={sharedSearchQuery}
                      onChange={(e) => setSharedSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm đề thi dùng chung theo tên đề, mã đề..."
                      className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs sm:text-sm outline-none transition-all"
                    />
                    {sharedSearchQuery && (
                      <button
                        onClick={() => setSharedSearchQuery('')}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div>
                    <select
                      value={sharedSelectedSubject}
                      onChange={(e) => setSharedSelectedSubject(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="ALL">📚 Tất cả Môn học</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={sharedSelectedGrade}
                      onChange={(e) => setSharedSelectedGrade(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="ALL">🎓 Tất cả Khối / Cấp độ</option>
                      {GRADE_LEVEL_GROUPS.map((group) => (
                        <optgroup key={group.level} label={group.label}>
                          {group.grades.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Thư viện hiện có:</span>
                    <strong className="text-indigo-700 font-bold">{sharedExams.length} đề thi dùng chung</strong>
                  </div>
                  <button
                    onClick={loadSharedLibrary}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1 rounded-xl transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingShared ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>

              {/* Shared Exams Grid */}
              {loadingShared ? (
                <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500 font-medium">Đang tải thư viện đề thi dùng chung...</p>
                </div>
              ) : sharedExams.length === 0 ? (
                <div className="p-16 bg-white border border-slate-200 rounded-3xl text-center shadow-sm space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                    <Globe className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Chưa có đề thi nào trong Thư viện dùng chung</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Các đề thi được giáo viên hoặc ban giám hiệu chia sẻ quyền &quot;Cùng tổ bộ môn&quot; hoặc &quot;Công khai toàn trường&quot; sẽ xuất hiện tại đây để mọi người tham khảo và sao chép.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sharedExams.map((exam) => {
                    const vis = exam.visibility || 'PUBLIC';
                    const vConf = VISIBILITY_CONFIGS.find((v) => v.visibility === vis) || VISIBILITY_CONFIGS[2];
                    const isCloning = cloningId === exam.id;

                    return (
                      <div
                        key={exam.id}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Top row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {exam.subjectName && (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {exam.subjectName}
                                </span>
                              )}
                              {exam.gradeLevel && (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  {exam.gradeLevel}
                                </span>
                              )}
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${vConf.color} ${vConf.badge}`}>
                              {vConf.label}
                            </span>
                          </div>

                          {/* Code & Title */}
                          <div>
                            {exam.code && (
                              <div className="text-[11px] font-mono font-bold text-slate-400 tracking-wide mb-1">
                                MÃ ĐỀ: {exam.code}
                              </div>
                            )}
                            <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                              {exam.title}
                            </h3>
                            {exam.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                {exam.description}
                              </p>
                            )}
                          </div>

                          {/* Author info */}
                          <div className="flex items-center gap-2 p-2.5 bg-slate-50/80 rounded-2xl text-xs text-slate-600">
                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                              {exam.creatorName ? exam.creatorName[0].toUpperCase() : 'T'}
                            </div>
                            <span className="font-semibold truncate">Tác giả: {exam.creatorName || 'Giáo viên'}</span>
                          </div>

                          {/* Metadata Grid */}
                          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl text-center text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">Thời gian</span>
                              <strong className="text-slate-800 font-bold">{exam.durationMinutes}p</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">Số câu hỏi</span>
                              <strong className="text-slate-800 font-bold">{exam.questionCount} câu</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">Thang điểm</span>
                              <strong className="text-slate-800 font-bold">{exam.totalMarks}đ</strong>
                            </div>
                          </div>
                        </div>

                        {/* Actions: Preview, Export & Clone */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenPreview(exam)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Xem</span>
                            </button>

                            <button
                              onClick={() => handleOpenExportModal(exam)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer"
                              title="In & Tải đề thi chuẩn Bộ GD&ĐT (Word / PDF)"
                            >
                              <Printer className="w-4 h-4 text-blue-600" />
                              <span>Tải đề</span>
                            </button>
                          </div>

                          <button
                            onClick={() => handleCloneExam(exam.id)}
                            disabled={isCloning}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isCloning ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Đang sao chép...</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Sao chép về</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Create / Edit Exam Modal */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 my-8 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {editingExamId ? 'Chỉnh sửa Đề thi' : 'Tạo Đề thi Mới'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cấu hình thông tin đề thi và lựa chọn các câu hỏi phù hợp từ ngân hàng câu hỏi.
                    </p>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveExam} className="space-y-6">
                  {/* Basic Info: Subject, Grade, Code, Course */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Môn học <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formSubjectId}
                        onChange={(e) => {
                          const newSub = e.target.value;
                          setFormSubjectId(newSub);
                          setFormCode(generateExamCode(newSub, formGradeLevel));
                        }}
                        required
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-[#83C75D] font-medium"
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Grade Level */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Khối / Cấp độ <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formGradeLevel}
                        onChange={(e) => {
                          const newG = e.target.value;
                          setFormGradeLevel(newG);
                          setFormCode(generateExamCode(formSubjectId, newG));
                        }}
                        required
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-[#83C75D] font-medium"
                      >
                        {GRADE_LEVEL_GROUPS.map((group) => (
                          <optgroup key={group.level} label={group.label}>
                            {group.grades.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Exam Code */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Mã đề thi</label>
                        <button
                          type="button"
                          onClick={() => setFormCode(generateExamCode(formSubjectId, formGradeLevel))}
                          className="text-[10px] font-bold text-[#4e8231] hover:underline inline-flex items-center gap-0.5"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Đổi mã</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                        required
                        placeholder="Ví dụ: DE_TOAN_L1_8492"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold outline-none focus:border-[#83C75D] uppercase"
                      />
                    </div>

                    {/* Course Association */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Gắn với Khóa học (Tùy chọn)
                      </label>
                      <select
                        value={formCourseId}
                        onChange={(e) => setFormCourseId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-[#83C75D] font-medium"
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

                  {/* Title & Suggestions */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Tên đề thi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                      placeholder="Ví dụ: Kiểm tra đánh giá năng lực môn Toán học kỳ 1..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:border-[#83C75D] focus:bg-white"
                    />

                    {/* Quick Title Suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400">Gợi ý nhanh:</span>
                      {TITLE_SUGGESTIONS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            const subName = subjects.find((s) => s.id === formSubjectId)?.name || '';
                            setFormTitle(`${sug} - ${subName} (${formGradeLevel})`);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-[#83C75D]/20 hover:text-[#4e8231] rounded-lg text-[11px] text-slate-600 transition-colors"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description & Instructions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mô tả đề thi
                      </label>
                      <textarea
                        rows={2}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Mục đích, phạm vi kiến thức kiểm tra..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-[#83C75D] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hướng dẫn làm bài cho học sinh
                      </label>
                      <textarea
                        rows={2}
                        value={formInstructions}
                        onChange={(e) => setFormInstructions(e.target.value)}
                        placeholder="Lưu ý khi làm bài, quy định thời gian..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-[#83C75D] resize-none"
                      />
                    </div>
                  </div>

                  {/* Exam Settings Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Thời gian (phút) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formDuration}
                        onChange={(e) => setFormDuration(Number(e.target.value))}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#83C75D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tổng điểm
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        value={formTotalMarks}
                        onChange={(e) => setFormTotalMarks(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#83C75D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Điểm đạt (Pass)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formPassingMarks}
                        onChange={(e) => setFormPassingMarks(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#83C75D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Số lần làm tối đa
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formMaxAttempts}
                        onChange={(e) => setFormMaxAttempts(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#83C75D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Trạng thái
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as ExamStatus)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#83C75D]"
                      >
                        {STATUS_CONFIGS.map((s) => (
                          <option key={s.status} value={s.status}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Quyền chia sẻ
                      </label>
                      <select
                        value={formVisibility}
                        onChange={(e) => setFormVisibility(e.target.value as ExamVisibility)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#83C75D]"
                      >
                        <option value="PRIVATE">🔒 Riêng tư</option>
                        <option value="SUBJECT_SHARED">👥 Cùng tổ bộ môn</option>
                        <option value="PUBLIC">🌍 Toàn trường</option>
                      </select>
                    </div>
                  </div>

                  {/* Shuffle Options Checkboxes */}
                  <div className="flex flex-wrap items-center gap-6 px-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formShuffleQuestions}
                        onChange={(e) => setFormShuffleQuestions(e.target.checked)}
                        className="w-4 h-4 rounded text-[#83C75D] focus:ring-[#83C75D]"
                      />
                      <span>Xáo trộn thứ tự câu hỏi khi làm bài</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formShuffleOptions}
                        onChange={(e) => setFormShuffleOptions(e.target.checked)}
                        className="w-4 h-4 rounded text-[#83C75D] focus:ring-[#83C75D]"
                      />
                      <span>Xáo trộn thứ tự các lựa chọn đáp án</span>
                    </label>
                  </div>

                                    {/* Proctoring Settings */}
                  <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-indigo-950 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formEnableProctoring}
                          onChange={(e) => setFormEnableProctoring(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-600"
                        />
                        <span>Bật Chế độ Giám sát Chống gian lận (Basic Exam Proctoring)</span>
                      </label>
                      {formEnableProctoring && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          🛡️ Toàn màn hình & Phát hiện rời tab
                        </span>
                      )}
                    </div>

                    {formEnableProctoring && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-indigo-100/70 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Ngưỡng vi phạm tối đa (Lần vi phạm trước khi tự động nộp bài):
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={formMaxViolationCount}
                            onChange={(e) => setFormMaxViolationCount(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex items-center text-[11px] text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                          Hệ thống sẽ ép buộc học sinh làm bài Toàn màn hình, ghi lại sự kiện chuyển tab, thu nhỏ cửa sổ, chặn copy/paste nội dung và phím tắt DevTools.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QUESTION SELECTION & PREVIEW IN EXAM */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-purple-50/60 rounded-2xl border border-purple-200">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-purple-600" />
                          <span>Câu hỏi trong đề thi ({selectedQuestionIds.length} câu)</span>
                        </h3>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Môn: <strong className="text-slate-900">{subjects.find((s) => s.id === formSubjectId)?.name || 'Chưa chọn'}</strong> • Khối: <strong className="text-slate-900">{formGradeLevel}</strong>
                          {formCourseId && (
                            <> • Khóa: <strong className="text-slate-900">{courses.find((c) => c.id === formCourseId)?.name || 'Khóa học'}</strong></>
                          )}
                          {' • '}Tổng điểm câu hỏi: <strong className="text-purple-700">{calculatedSelectedMarks}đ</strong> / {formTotalMarks}đ
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setQuestionSelectorOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>{selectedQuestionIds.length > 0 ? '+ Thêm câu hỏi từ Ngân hàng' : '📚 Chọn câu hỏi từ Ngân hàng'}</span>
                      </button>
                    </div>

                    {/* Selected Question List */}
                    {selectedQuestions.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                          <HelpCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Đề thi chưa có câu hỏi nào
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
                            Nhấn nút bên dưới để mở danh sách các câu hỏi môn <strong>{subjects.find((s) => s.id === formSubjectId)?.name} - {formGradeLevel}</strong> bạn đã tạo và bấm "Thêm vào đề thi".
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuestionSelectorOpen(true)}
                          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Mở danh sách câu hỏi để chọn</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {selectedQuestions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="p-3.5 rounded-2xl border bg-white border-slate-200 shadow-sm text-xs flex items-start gap-3 justify-between hover:border-purple-200 transition-all"
                          >
                            <div className="flex-1 space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                                  Câu {idx + 1}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                  {q.questionType}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  {q.difficulty}
                                </span>
                                <span className="text-[11px] text-slate-500 font-bold">
                                  Điểm: <span className="text-slate-800">{q.defaultMarks}</span>
                                </span>
                                {q.courseName && (
                                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    {q.courseName}
                                  </span>
                                )}
                              </div>

                              <div className="font-semibold text-slate-900 line-clamp-2">
                                <MathMarkdownRenderer content={q.content} />
                              </div>

                              {q.options && q.options.length > 0 && (
                                <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1 pt-1">
                                  {q.options.map((opt) => (
                                    <span
                                      key={opt.optionKey}
                                      className={opt.isCorrect ? 'text-emerald-700 font-bold' : ''}
                                    >
                                      {opt.optionKey}. {opt.optionText} {opt.isCorrect ? '✓' : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionFromExam(q.id)}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                              title="Xóa câu hỏi khỏi đề thi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        ))}

                        <div className="pt-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setQuestionSelectorOpen(true)}
                            className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Thêm câu hỏi khác từ Ngân hàng</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-md shadow-[#83C75D]/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Đang lưu...' : editingExamId ? 'Cập nhật Đề thi' : 'Tạo Đề thi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* QUESTION SELECTOR MODAL / DRAWER */}
          {questionSelectorOpen && (
            <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                      <BookOpen className="w-6 h-6" />
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Chọn câu hỏi từ Ngân hàng Câu hỏi
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>Đang lọc theo:</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                          Môn: {subjects.find((s) => s.id === formSubjectId)?.name || 'Chưa chọn'}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">
                          Khối: {formGradeLevel}
                        </span>
                        {formCourseId && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded">
                            Khóa: {courses.find((c) => c.id === formCourseId)?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuestionSelectorOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  {/* Search */}
                  <div className="relative sm:col-span-2">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm câu hỏi theo nội dung, từ khóa, thẻ tags..."
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <select
                      value={selectorCategoryFilter}
                      onChange={(e) => setSelectorCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-500 text-indigo-700"
                    >
                      <option value="ALL">📁 Tất cả chuyên đề</option>
                      {selectorCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          📁 {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <select
                      value={selectorTypeFilter}
                      onChange={(e) => setSelectorTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-500"
                    >
                      <option value="ALL">Tất cả dạng bài</option>
                      <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                      <option value="TRUE_FALSE">Đúng / Sai</option>
                      <option value="SHORT_ANSWER">Trả lời ngắn</option>
                      <option value="FILL_IN_THE_BLANK">Điền khuyết</option>
                      <option value="ESSAY">Tự luận</option>
                    </select>
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <select
                      value={selectorDifficultyFilter}
                      onChange={(e) => setSelectorDifficultyFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-500"
                    >
                      <option value="ALL">Tất cả độ khó</option>
                      <option value="EASY">Dễ</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HARD">Khó</option>
                    </select>
                  </div>
                </div>

                {/* Sub-header: Count & Quick Batch Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">
                      Tìm thấy: <strong className="text-purple-600">{matchingQuestions.length}</strong> câu hỏi phù hợp
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[11px]">
                      Đã thêm vào đề: {selectedQuestionIds.length} câu
                    </span>
                  </div>

                  {matchingQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllMatchingQuestions}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {matchingQuestions.every((q) => selectedQuestionIds.includes(q.id))
                        ? '✕ Bỏ chọn tất cả các câu trên'
                        : `✓ Chọn tất cả (${matchingQuestions.length} câu)`}
                    </button>
                  )}
                </div>

                {/* Matching Question Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh]">
                  {matchingQuestions.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">
                        Không tìm thấy câu hỏi nào cho môn {subjects.find((s) => s.id === formSubjectId)?.name} - {formGradeLevel}
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                        Hãy tạo câu hỏi trong Ngân hàng Câu hỏi với đúng Môn học và Khối lớp này để có thể thêm vào đề thi.
                      </p>
                      <Link
                        href="/teacher/questions"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:underline mt-2"
                      >
                        <span>Mở trang Ngân hàng Câu hỏi để tạo mới</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    matchingQuestions.map((q, idx) => {
                      const isSelected = selectedQuestionIds.includes(q.id);

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-2xl border text-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-purple-50/80 border-purple-300 ring-1 ring-purple-200'
                              : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                                Câu {idx + 1}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                {q.questionType}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                {q.difficulty}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Điểm: <strong className="text-slate-700">{q.defaultMarks}</strong>
                              </span>
                              {q.courseName && (
                                <span className="text-[10px] px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded font-medium">
                                  Khóa: {q.courseName}
                                </span>
                              )}
                            </div>

                            <div className="font-semibold text-slate-900 leading-snug">
                              <MathMarkdownRenderer content={q.content} />
                            </div>

                            {q.options && q.options.length > 0 && (
                              <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                                {q.options.map((opt) => (
                                  <span
                                    key={opt.optionKey}
                                    className={opt.isCorrect ? 'text-emerald-700 font-bold' : ''}
                                  >
                                    {opt.optionKey}. {opt.optionText} {opt.isCorrect ? '✓' : ''}
                                  </span>
                                ))}
                              </div>
                            )}

                            {q.tags && q.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {q.tags.map((t) => (
                                  <span key={t} className="text-[9px] font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action Button: Thêm vào đề thi */}
                          <div className="shrink-0 pt-2 sm:pt-0">
                            {isSelected ? (
                              <button
                                type="button"
                                onClick={() => handleToggleQuestion(q.id)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer group"
                              >
                                <Check className="w-3.5 h-3.5 group-hover:hidden" />
                                <Trash2 className="w-3.5 h-3.5 hidden group-hover:block" />
                                <span className="group-hover:hidden">Đã thêm vào đề</span>
                                <span className="hidden group-hover:inline">Xóa khỏi đề</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleQuestion(q.id)}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Thêm vào đề thi</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Modal Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Đã chọn <strong className="text-purple-700">{selectedQuestionIds.length}</strong> câu hỏi (Tổng: <strong className="text-slate-900">{calculatedSelectedMarks}đ</strong>)
                  </span>

                  <button
                    type="button"
                    onClick={() => setQuestionSelectorOpen(false)}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                  >
                    Hoàn tất chọn câu hỏi ({selectedQuestionIds.length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Detail & Preview Modal */}
          {previewExam && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
                      <FileText className="w-6 h-6" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {previewExam.code || 'MÃ ĐỀ'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {previewExam.status}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-1">{previewExam.title}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewExam(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-slate-400 block font-bold">Môn học</span>
                    <strong className="text-slate-800">{previewExam.subjectName || 'N/A'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-slate-400 block font-bold">Khối / Lớp</span>
                    <strong className="text-slate-800">{previewExam.gradeLevel || 'N/A'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-slate-400 block font-bold">Thời gian</span>
                    <strong className="text-slate-800">{previewExam.durationMinutes} phút</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-slate-400 block font-bold">Thang điểm</span>
                    <strong className="text-slate-800">{previewExam.totalMarks} (Đạt: {previewExam.passingMarks})</strong>
                  </div>
                </div>

                {previewExam.instructions && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1">
                    <strong className="font-bold text-blue-900 block">📌 Hướng dẫn làm bài:</strong>
                    <p>{previewExam.instructions}</p>
                  </div>
                )}

                {/* Question List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Danh sách câu hỏi trong đề ({previewExam.questions?.length || previewExam.questionCount} câu)
                  </h3>

                  {previewExam.questions && previewExam.questions.length > 0 ? (
                    <div className="space-y-3">
                      {previewExam.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                              Câu {idx + 1} • {q.questionType}
                            </span>
                            <span className="text-slate-400 font-bold">
                              Điểm: {q.defaultMarks}
                            </span>
                          </div>

                          <div className="font-bold text-slate-900 leading-relaxed">
                            <MathMarkdownRenderer content={q.content} />
                          </div>

                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt) => (
                                <div
                                  key={opt.optionKey}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                    opt.isCorrect
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span className="font-bold shrink-0">{opt.optionKey}.</span>
                                    <div className="flex-1 min-w-0">
                                      <MathMarkdownRenderer content={opt.optionText} />
                                    </div>
                                  </div>
                                  {opt.isCorrect && (
                                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                                      ĐÚNG
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {q.explanation && (
                            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-900 text-[11px]">
                              <strong>Lời giải: </strong>{q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Đề thi chưa có câu hỏi nào.</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const targetExam = previewExam;
                        setPreviewExam(null);
                        handleOpenResultsModal(targetExam);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Xem kết quả làm bài</span>
                    </button>

                    <button
                      onClick={() => {
                        const targetExam = previewExam;
                        setPreviewExam(null);
                        handleOpenAssignModal(targetExam);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>Thêm thành viên</span>
                    </button>

                    <button
                      onClick={() => {
                        const targetExam = previewExam;
                        handleOpenExportModal(targetExam);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>In / Tải đề thi (.docx / .pdf)</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setPreviewExam(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assign Students Modal */}
          {assigningExam && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                      <Users className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Thêm thành viên làm bài kiểm tra
                      </h3>
                      <p className="text-xs text-slate-500">
                        Giao bài kiểm tra cho học viên đã đăng ký học & gửi thông báo tự động
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAssigningExam(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Exam Context Banner */}
                <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-purple-900 block text-sm">{assigningExam.title}</span>
                    <span className="text-purple-700 font-medium">
                      {assigningExam.subjectName} • {assigningExam.gradeLevel} • {assigningExam.durationMinutes} phút • Thang điểm {assigningExam.totalMarks}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-white border border-purple-200 text-purple-800 rounded-xl font-mono text-[11px] font-bold">
                    {assigningExam.code}
                  </span>
                </div>

                {/* Filter & Batch Actions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        placeholder="Tìm học viên theo tên, email, khóa học..."
                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500 focus:bg-white"
                      />
                      {candidateSearch && (
                        <button
                          onClick={() => setCandidateSearch('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Batch buttons */}
                    {(() => {
                      const filteredCandidates = candidateStudents.filter((c) => {
                        const q = candidateSearch.toLowerCase().trim();
                        return (
                          !q ||
                          c.studentName.toLowerCase().includes(q) ||
                          c.studentEmail.toLowerCase().includes(q) ||
                          c.courseName.toLowerCase().includes(q)
                        );
                      });

                      return (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSelectAllCandidates(filteredCandidates)}
                            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            ✓ Chọn tất cả ({filteredCandidates.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeselectAllCandidates(filteredCandidates)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            ✕ Bỏ chọn
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>
                      Đã chọn: <strong className="text-purple-700 font-bold">{selectedStudentIdsToAssign.length}</strong> / {candidateStudents.length} học viên
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Học sinh được chọn sẽ nhận được chuông thông báo & thấy đề thi)
                    </span>
                  </div>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-72 pr-1 border-t border-b border-slate-100 py-2">
                  {isLoadingCandidates ? (
                    <div className="p-10 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <div className="w-7 h-7 border-3 border-purple-500/30 border-t-purple-600 rounded-full animate-spin" />
                      <span className="text-xs">Đang tải danh sách học viên...</span>
                    </div>
                  ) : candidateStudents.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                      <Users className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-700">Chưa có học viên nào đăng ký các khóa học của bạn</p>
                      <p className="text-[11px] text-slate-500">
                        Khi học sinh tham gia các khóa học do bạn giảng dạy, bạn có thể giao bài kiểm tra cho họ tại đây.
                      </p>
                    </div>
                  ) : (
                    (() => {
                      const filteredCandidates = candidateStudents.filter((c) => {
                        const q = candidateSearch.toLowerCase().trim();
                        return (
                          !q ||
                          c.studentName.toLowerCase().includes(q) ||
                          c.studentEmail.toLowerCase().includes(q) ||
                          c.courseName.toLowerCase().includes(q)
                        );
                      });

                      if (filteredCandidates.length === 0) {
                        return (
                          <div className="p-6 text-center text-xs text-slate-500">
                            Không tìm thấy học viên nào phù hợp với từ khóa "{candidateSearch}".
                          </div>
                        );
                      }

                      return filteredCandidates.map((student) => {
                        const isSelected = selectedStudentIdsToAssign.includes(student.studentId);

                        return (
                          <div
                            key={student.studentId}
                            onClick={() => handleToggleStudent(student.studentId)}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                              />
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {student.studentName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {student.studentName}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <span className="truncate">{student.studentEmail}</span>
                                  <span>•</span>
                                  <span className="text-purple-700 bg-purple-100/70 px-1.5 py-0.2 rounded font-semibold truncate">
                                    {student.courseName}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isSelected ? (
                                <span className="px-2.5 py-1 bg-purple-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>Được giao bài</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-xl text-[11px] font-medium">
                                  Chưa chọn
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setAssigningExam(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isSavingAssignments || isLoadingCandidates}
                    onClick={handleSaveAssignments}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingAssignments ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang lưu & gửi thông báo...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Xác nhận & Gửi thông báo ({selectedStudentIdsToAssign.length} học sinh)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exam Results Modal */}
          {resultsModalExam && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                      <BarChart3 className="w-6 h-6" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {resultsModalExam.code}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
                          {resultsModalExam.gradeLevel}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                        Báo cáo kết quả: {resultsModalExam.title}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setResultsModalExam(null);
                      setExamResultsData(null);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {isLoadingResults ? (
                  <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
                    <span className="text-xs font-bold text-slate-600">Đang tổng hợp kết quả bài làm...</span>
                  </div>
                ) : examResultsData ? (
                  <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                    {/* 5 Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-purple-600 tracking-wider flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>Giao bài</span>
                        </span>
                        <p className="text-2xl font-black text-purple-900">{examResultsData.totalAssigned}</p>
                        <span className="text-[10px] text-purple-500">học sinh được giao</span>
                      </div>

                      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Đã nộp bài</span>
                        </span>
                        <p className="text-2xl font-black text-blue-900">{examResultsData.totalSubmissions}</p>
                        <span className="text-[10px] text-blue-500">lượt làm bài</span>
                      </div>

                      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Đạt yêu cầu</span>
                        </span>
                        <p className="text-2xl font-black text-emerald-900">
                          {examResultsData.passedCount}
                          <span className="text-xs font-medium text-emerald-600 ml-1">
                            ({examResultsData.totalSubmissions > 0
                              ? Math.round((examResultsData.passedCount / examResultsData.totalSubmissions) * 100)
                              : 0}%)
                          </span>
                        </p>
                        <span className="text-[10px] text-emerald-500">≥ {examResultsData.passingMarks} điểm</span>
                      </div>

                      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Điểm TB</span>
                        </span>
                        <p className="text-2xl font-black text-amber-900">
                          {examResultsData.averageScore}
                          <span className="text-xs font-medium text-amber-600">/{examResultsData.totalMarks}</span>
                        </p>
                        <span className="text-[10px] text-amber-500">điểm trung bình</span>
                      </div>

                      <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold uppercase text-rose-600 tracking-wider flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>Điểm cao nhất</span>
                        </span>
                        <p className="text-2xl font-black text-rose-900">
                          {examResultsData.highestScore}
                          <span className="text-xs font-medium text-rose-600">/{examResultsData.totalMarks}</span>
                        </p>
                        <span className="text-[10px] text-rose-500">kỷ lục bài thi</span>
                      </div>
                    </div>

                    {/* Search and Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-900">
                          Danh sách học sinh làm bài ({examResultsData.attempts.length} lượt nộp)
                        </h3>

                        <div className="relative w-64">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={resultsSearch}
                            onChange={(e) => setResultsSearch(e.target.value)}
                            placeholder="Tìm học sinh..."
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {examResultsData.attempts.length === 0 ? (
                        <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                          <BarChart3 className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs font-bold text-slate-700">Chưa có học sinh nào nộp bài kiểm tra này</p>
                          <p className="text-[11px] text-slate-500">
                            Khi học sinh làm bài xong và nộp, kết quả chi tiết, điểm số và bài làm sẽ hiển thị ở đây.
                          </p>
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="p-3.5 font-bold">Học sinh</th>
                                <th className="p-3.5 font-bold">Lần thi</th>
                                <th className="p-3.5 font-bold">Thời gian làm</th>
                                <th className="p-3.5 font-bold text-center">Câu đúng</th>
                                <th className="p-3.5 font-bold text-center">Điểm số</th>
                                <th className="p-3.5 font-bold text-center">Giám sát / Vi phạm</th>
                                <th className="p-3.5 font-bold text-center">Kết quả</th>
                                <th className="p-3.5 font-bold text-right">Chi tiết</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {examResultsData.attempts
                                .filter((att) => {
                                  const q = resultsSearch.toLowerCase().trim();
                                  return (
                                    !q ||
                                    att.studentName.toLowerCase().includes(q) ||
                                    att.studentEmail.toLowerCase().includes(q)
                                  );
                                })
                                .map((att) => {
                                  const durationMin = att.durationSeconds
                                    ? Math.floor(att.durationSeconds / 60)
                                    : 0;
                                  const durationSec = att.durationSeconds
                                    ? att.durationSeconds % 60
                                    : 0;

                                  return (
                                    <tr key={att.attemptId} className="hover:bg-slate-50/70 transition-colors">
                                      <td className="p-3.5">
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                                            {att.studentName.charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                            <span className="font-bold text-slate-900 block">{att.studentName}</span>
                                            <span className="text-[11px] text-slate-400">{att.studentEmail}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3.5 font-semibold text-slate-700">
                                        Lần {att.attemptNumber}
                                      </td>
                                      <td className="p-3.5 text-slate-600">
                                        {durationMin > 0 ? `${durationMin}p ` : ''}
                                        {durationSec}s
                                      </td>
                                      <td className="p-3.5 text-center font-bold text-slate-800">
                                        {att.correctAnswersCount !== undefined ? att.correctAnswersCount : 0} / {att.totalQuestionsCount}
                                      </td>
                                      <td className="p-3.5 text-center">
                                        <span className="font-black text-sm text-emerald-700">
                                          {att.totalScore !== undefined ? att.totalScore : 0}
                                        </span>
                                        <span className="text-slate-400 font-bold">/{att.maxScore}đ</span>
                                        {att.percentage !== undefined && (
                                          <span className="text-[10px] text-slate-400 block font-medium">
                                            ({att.percentage}%)
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3.5 text-center">
                                        {att.isFlagged ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                            ⚠️ Gắn cờ ({att.violationCount || 0} lần)
                                          </span>
                                        ) : (att.violationCount || 0) > 0 ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                            {att.violationCount} vi phạm
                                          </span>
                                        ) : (
                                          <span className="text-[11px] text-emerald-600 font-bold">
                                            ✓ Tốt (0)
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3.5 text-center">
                                        {att.passed ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                            ✓ ĐẠT
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                            ✕ CHƯA ĐẠT
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3.5 text-right">
                                        <button
                                          onClick={() => handleOpenAttemptDetail(att.attemptId)}
                                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>Xem bài làm</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Footer */}
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setResultsModalExam(null);
                      setExamResultsData(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Attempt Detail Modal */}
          {detailedAttemptData && (
            <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                      <FileText className="w-6 h-6" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          Lần {detailedAttemptData.attemptNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            detailedAttemptData.passed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {detailedAttemptData.passed ? '✓ ĐẠT' : '✕ CHƯA ĐẠT'}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-1">
                        Bài làm của: {detailedAttemptData.studentName}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailedAttemptData(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Attempt Summary */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">ĐIỂM ĐẠT ĐƯỢC</span>
                    <strong className="text-xl font-black text-emerald-700">
                      {detailedAttemptData.totalScore !== undefined ? detailedAttemptData.totalScore : 0}
                    </strong>
                    <span className="text-slate-400 font-bold"> / {detailedAttemptData.maxScore}đ</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">TỶ LỆ ĐÚNG</span>
                    <strong className="text-xl font-black text-slate-800">
                      {detailedAttemptData.percentage !== undefined ? detailedAttemptData.percentage : 0}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">THỜI GIAN LÀM</span>
                    <strong className="text-sm font-bold text-slate-800 block mt-1">
                      {detailedAttemptData.durationSeconds
                        ? `${Math.floor(detailedAttemptData.durationSeconds / 60)}p ${detailedAttemptData.durationSeconds % 60}s`
                        : 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">EMAIL HỌC SINH</span>
                    <strong className="text-xs font-semibold text-slate-600 truncate block mt-1">
                      {detailedAttemptData.studentEmail}
                    </strong>
                  </div>
                </div>

                                {/* Proctoring & Anti-cheat Report */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-indigo-600" />
                        <span>Báo cáo Giám sát Chống gian lận</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {detailedAttemptData.isFlagged ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>ĐÃ BỊ GẮN CỜ VI PHẠM / ĐÌNH CHỈ</span>
                        </span>
                      ) : (detailedAttemptData.violationCount || 0) > 0 ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ⚠️ Có {detailedAttemptData.violationCount} cảnh báo vi phạm
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Tuân thủ quy định phòng thi (0 vi phạm)
                        </span>
                      )}
                    </div>
                  </div>

                  {detailedAttemptData.isFlagged && detailedAttemptData.flagReason && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      <strong>Lý do gắn cờ: </strong>
                      <span>{detailedAttemptData.flagReason}</span>
                    </div>
                  )}

                  {/* Event Timeline */}
                  {detailedAttemptData.events && detailedAttemptData.events.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Dòng thời gian sự kiện ({detailedAttemptData.events.length} sự kiện)
                      </h4>
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                        {detailedAttemptData.events.map((ev, eIdx) => {
                          const timeStr = new Date(ev.occurredAt).toLocaleTimeString('vi-VN');
                          let badgeColor = 'bg-slate-100 text-slate-700';
                          let eventLabel: string = ev.eventType;

                          if (ev.eventType === 'TAB_BLUR') {
                            badgeColor = 'bg-rose-100 text-rose-800 border border-rose-200';
                            eventLabel = 'Rời tab / Thu nhỏ cửa sổ';
                          } else if (ev.eventType === 'FULLSCREEN_EXIT') {
                            badgeColor = 'bg-rose-100 text-rose-800 border border-rose-200';
                            eventLabel = 'Thoát toàn màn hình';
                          } else if (ev.eventType === 'COPY_ATTEMPT') {
                            badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200';
                            eventLabel = 'Sao chép nội dung';
                          } else if (ev.eventType === 'PASTE_ATTEMPT') {
                            badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200';
                            eventLabel = 'Dán nội dung';
                          } else if (ev.eventType === 'DEVTOOLS_OPEN') {
                            badgeColor = 'bg-rose-100 text-rose-800 border border-rose-200';
                            eventLabel = 'Mở DevTools / Menu';
                          } else if (ev.eventType === 'RESUME') {
                            badgeColor = 'bg-blue-50 text-blue-700';
                            eventLabel = 'Quay lại màn hình';
                          }

                          return (
                            <div key={ev.id || eIdx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-slate-400">{timeStr}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                                  {eventLabel}
                                </span>
                                <span className="text-slate-600 text-[11px]">{ev.metadata || ''}</span>
                              </div>
                              <span className={`text-[10px] font-bold ${ev.isViolation ? 'text-rose-600' : 'text-slate-400'}`}>
                                {ev.isViolation ? '⚠️ Tính vi phạm' : 'Thông tin'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      Không có sự kiện bất thường nào được ghi nhận trong lần thi này.
                    </div>
                  )}
                </div>

                {/* Question by question review */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Chi tiết từng câu hỏi ({detailedAttemptData.answers.length} câu)
                  </h3>

                  {detailedAttemptData.answers.map((ans, idx) => (
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
                        <div className="flex items-center gap-2">
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
                      </div>

                      <p className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {ans.content}
                      </p>

                      {/* Options breakdown */}
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
                                <span>
                                  {opt.optionKey}. {opt.optionText}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {isStudentSelected && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                                      Học sinh chọn
                                    </span>
                                  )}
                                  {isOptCorrect && (
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
                            <strong className="text-slate-600">Câu trả lời của học sinh: </strong>
                            <span
                              className={`font-bold ${
                                ans.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {ans.studentAnswerText || '(Chưa điền)'}
                            </span>
                          </div>
                          {ans.correctOptionText && (
                            <div>
                              <strong className="text-slate-600">Đáp án chuẩn: </strong>
                              <span className="font-bold text-emerald-700">
                                {ans.correctOptionText}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {ans.questionType === 'ESSAY' && (
                        <div className="p-3 bg-white border rounded-xl space-y-1 text-xs">
                          <strong className="text-slate-600 block">Bài làm tự luận:</strong>
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
                        <div className="p-2.5 bg-amber-50 rounded-xl text-amber-900 text-[11px]">
                          <strong>Giải thích: </strong>
                          {ans.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setDetailedAttemptData(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Exam Generator Modal */}
          <AiExamGeneratorModal
            isOpen={aiExamModalOpen}
            onClose={() => setAiExamModalOpen(false)}
            subjects={subjects}
            courses={courses}
            onExamCreated={() => {
              setAiExamModalOpen(false);
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
                        <span>Lịch sử xóa đề thi / Thùng rác</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                          {deletedExams.length} đề thi
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Các đề thi đã bị xóa mềm. Bạn có thể khôi phục lại bất kỳ lúc nào.
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
                      <p className="text-sm font-semibold">Đang tải danh sách đề thi đã xóa...</p>
                    </div>
                  ) : deletedExams.length === 0 ? (
                    <div className="py-16 text-center text-slate-500">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-2xl">
                        🗑️
                      </div>
                      <h3 className="font-bold text-slate-700 text-base">Thùng rác trống</h3>
                      <p className="text-xs text-slate-400 mt-1">Không có đề thi nào bị xóa trong hệ thống.</p>
                    </div>
                  ) : (
                    deletedExams.map((e) => (
                      <div
                        key={e.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-rose-200 transition-all shadow-2xs space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {e.code || 'MÃ ĐỀ'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                              {e.subjectName || 'Môn học'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {e.gradeLevel || 'Chung'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-50 text-purple-700">
                              {e.questionCount || 0} câu
                            </span>
                          </div>

                          <button
                            onClick={() => handleRestoreExam(e.id)}
                            disabled={restoringId === e.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                          >
                            <Undo2 className={`w-3.5 h-3.5 ${restoringId === e.id ? 'animate-spin' : ''}`} />
                            <span>{restoringId === e.id ? 'Đang khôi phục...' : 'Khôi phục'}</span>
                          </button>
                        </div>

                        {/* Title */}
                        <div className="text-sm text-slate-900 font-bold">
                          {e.title}
                        </div>
                        {e.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {e.description}
                          </p>
                        )}

                        {/* Deletion details */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>
                            Xóa bởi: <strong className="text-slate-600 font-semibold">{e.deletedBy || e.creatorName || 'Người dùng'}</strong>
                          </span>
                          <span>
                            Thời gian: {e.deletedAt ? new Date(e.deletedAt).toLocaleString('vi-VN') : 'Gần đây'}
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

          {/* Modal Tùy biến In & Tải Đề thi Chuẩn Bộ GD&ĐT (Word .docx & PDF .pdf) */}
          <ExamPaperExportModal
            isOpen={exportModalOpen}
            onClose={() => {
              setExportModalOpen(false);
              setExamToExport(null);
            }}
            exam={examToExport}
            onExport={handleExportExam}
          />
        </div>
      </div>
    </RoleGuard>
  );
}
