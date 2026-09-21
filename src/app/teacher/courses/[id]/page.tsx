'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RoleGuard } from '@/components/RoleGuard';
import { courseService } from '@/services/course.service';
import { marketplaceService } from '@/services/marketplace.service';
import { resourceService } from '@/services/resource.service';
import {
  LessonStatus,
  TeacherChapterRequest,
  TeacherChapterResponse,
  TeacherCourseDetailResponse,
  TeacherLessonRequest,
  TeacherLessonResponse,
} from '@/types/course';
import {
  CreateResourceRequest,
  LessonResourceResponse,
  ResourceType,
  TeacherStudentLessonProgressResponse,
} from '@/types/resource';
import { StatusBadge } from '@/components/StatusBadge';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Send,
  Archive,
  BookOpen,
  PlayCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  FileText,
  Paperclip,
  Video,
  Link as LinkIcon,
  File,
  Image as ImageIcon,
  ExternalLink,
  Users,
  Activity,
  Search,
  X,
  Sparkles,
  Dumbbell,
  Unlock,
  Lock,
} from 'lucide-react';
import { LessonExerciseManagerModal } from '@/components/LessonExerciseManagerModal';
import { RichMathEditor } from '@/components/RichMathEditor';

export default function TeacherCourseEditorPage() {
  const params = useParams();
  const courseId = params?.id as string;

  const [activeTab, setActiveTab] = useState<'SYLLABUS' | 'PROGRESS' | 'ENROLLMENTS'>('SYLLABUS');
  const [courseDetail, setCourseDetail] = useState<TeacherCourseDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});

  // Chapter Modal
  const [chapterModalOpen, setChapterModalOpen] = useState<boolean>(false);
  const [editingChapter, setEditingChapter] = useState<TeacherChapterResponse | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [chapterDescription, setChapterDescription] = useState<string>('');
  const [chapterPrice, setChapterPrice] = useState<number | ''>('');
  const [chapterIsSellable, setChapterIsSellable] = useState<boolean>(false);
  const [isChapterSubmitting, setIsChapterSubmitting] = useState<boolean>(false);

  // Lesson Modal
  const [lessonModalOpen, setLessonModalOpen] = useState<boolean>(false);
  const [targetChapterId, setTargetChapterId] = useState<string>('');
  const [editingLesson, setEditingLesson] = useState<TeacherLessonResponse | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [lessonSummary, setLessonSummary] = useState<string>('');
  const [lessonContent, setLessonContent] = useState<string>('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState<string>('');
  const [lessonMinutes, setLessonMinutes] = useState<number>(15);
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>('DRAFT');
  const [lessonPrice, setLessonPrice] = useState<number | ''>('');
  const [lessonIsSellable, setLessonIsSellable] = useState<boolean>(false);
  const [isLessonSubmitting, setIsLessonSubmitting] = useState<boolean>(false);

  // Resources Modal (Phase 5)
  const [resourceModalOpen, setResourceModalOpen] = useState<boolean>(false);
  const [activeResourceLesson, setActiveResourceLesson] = useState<TeacherLessonResponse | null>(null);
  const [lessonResources, setLessonResources] = useState<LessonResourceResponse[]>([]);
  const [isResourcesLoading, setIsResourcesLoading] = useState<boolean>(false);
  const [resType, setResType] = useState<ResourceType>('PDF');
  const [resTitle, setResTitle] = useState<string>('');
  const [resUrl, setResUrl] = useState<string>('');
  const [isAddingResource, setIsAddingResource] = useState<boolean>(false);

  // Lesson Exercise Manager Modal
  const [exerciseModalOpen, setExerciseModalOpen] = useState<boolean>(false);
  const [activeExerciseLesson, setActiveExerciseLesson] = useState<TeacherLessonResponse | null>(null);

  const handleOpenExercises = (lesson: TeacherLessonResponse) => {
    setActiveExerciseLesson(lesson);
    setExerciseModalOpen(true);
  };

  // Student Progress (Phase 5)
  const [studentProgresses, setStudentProgresses] = useState<TeacherStudentLessonProgressResponse[]>([]);
  const [isProgressLoading, setIsProgressLoading] = useState<boolean>(false);
  const [progressSearch, setProgressSearch] = useState<string>('');

  // Enrollment Requests (Private course approval)
  const [enrollments, setEnrollments] = useState<import('@/types/course').TeacherEnrollmentResponse[]>([]);
  const [isEnrollmentsLoading, setIsEnrollmentsLoading] = useState<boolean>(false);
  const [enrollmentActionId, setEnrollmentActionId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      loadStructure();
      if (activeTab === 'PROGRESS') {
        loadStudentProgress();
      } else if (activeTab === 'ENROLLMENTS') {
        loadEnrollments();
      }
    }
  }, [courseId, activeTab]);

  const loadEnrollments = async () => {
    setIsEnrollmentsLoading(true);
    try {
      const data = await courseService.getTeacherCourseEnrollments(courseId);
      setEnrollments(data);
    } catch {
      setEnrollments([]);
    } finally {
      setIsEnrollmentsLoading(false);
    }
  };

  const handleApproveEnrollment = async (enrollmentId: string) => {
    setEnrollmentActionId(enrollmentId);
    try {
      await courseService.approveEnrollment(courseId, enrollmentId);
      setSuccessMessage('Đã duyệt học sinh vào lớp thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadEnrollments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Duyệt học sinh thất bại';
      setErrorMessage(msg);
    } finally {
      setEnrollmentActionId(null);
    }
  };

  const handleRejectEnrollment = async (enrollmentId: string) => {
    setEnrollmentActionId(enrollmentId);
    try {
      await courseService.rejectEnrollment(courseId, enrollmentId);
      setSuccessMessage('Đã từ chối yêu cầu tham gia.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadEnrollments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Từ chối thất bại';
      setErrorMessage(msg);
    } finally {
      setEnrollmentActionId(null);
    }
  };

  const loadStructure = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await courseService.getTeacherCourseStructure(courseId);
      setCourseDetail(data);

      const initialOpen: Record<string, boolean> = {};
      data.chapters.forEach((ch, idx) => {
        initialOpen[ch.id] = idx === 0;
      });
      setOpenChapters(initialOpen);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải cấu trúc khóa học';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentProgress = async () => {
    setIsProgressLoading(true);
    try {
      const data = await resourceService.getTeacherCourseStudentProgress(courseId);
      setStudentProgresses(data);
    } catch {
      setStudentProgresses([]);
    } finally {
      setIsProgressLoading(false);
    }
  };

  const [unlockingActionId, setUnlockingActionId] = useState<string | null>(null);

  const handleUnlockLesson = async (studentId: string, lessonId: string) => {
    const actionKey = `${studentId}-${lessonId}`;
    setUnlockingActionId(actionKey);
    try {
      await resourceService.unlockLessonForStudent(courseId, studentId, lessonId);
      setSuccessMessage('Đã mở khóa bài học cho học viên thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadStudentProgress();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mở khóa bài học thất bại';
      setErrorMessage(msg);
    } finally {
      setUnlockingActionId(null);
    }
  };

  const handleUnlockAllLessons = async (studentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn mở khóa TẤT CẢ các bài học trong khóa học này cho học viên này không?')) {
      return;
    }
    setUnlockingActionId(`all-${studentId}`);
    try {
      await resourceService.unlockAllLessonsForStudent(courseId, studentId);
      setSuccessMessage('Đã mở khóa tất cả bài học trong khóa học cho học viên thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadStudentProgress();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mở khóa toàn bộ bài học thất bại';
      setErrorMessage(msg);
    } finally {
      setUnlockingActionId(null);
    }
  };

  const toggleChapter = (chId: string) => {
    setOpenChapters((prev) => ({ ...prev, [chId]: !prev[chId] }));
  };

  // Chapter Handlers
  const handleOpenCreateChapter = () => {
    setEditingChapter(null);
    setChapterTitle('');
    setChapterDescription('');
    setChapterPrice('');
    setChapterIsSellable(false);
    setChapterModalOpen(true);
  };

  const handleOpenEditChapter = (ch: TeacherChapterResponse) => {
    setEditingChapter(ch);
    setChapterTitle(ch.title);
    setChapterDescription(ch.description || '');
    setChapterPrice(ch.price ?? '');
    setChapterIsSellable(Boolean(ch.isSellable));
    setChapterModalOpen(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim()) return;

    setIsChapterSubmitting(true);
    try {
      const payload: TeacherChapterRequest = {
        title: chapterTitle.trim(),
        description: chapterDescription.trim() || undefined,
        price: chapterIsSellable && chapterPrice !== '' ? Number(chapterPrice) : undefined,
        isSellable: chapterIsSellable,
      };

      if (editingChapter) {
        await courseService.updateChapter(editingChapter.id, payload);
        setSuccessMessage('Cập nhật chương thành công!');
      } else {
        await courseService.createChapter(courseId, payload);
        setSuccessMessage('Tạo chương mới thành công!');
      }

      setTimeout(() => setSuccessMessage(null), 4000);
      setChapterModalOpen(false);
      await loadStructure();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác thất bại';
      setErrorMessage(msg);
    } finally {
      setIsChapterSubmitting(false);
    }
  };

  const handleDeleteChapter = async (chId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chương này và toàn bộ bài học bên trong?')) return;
    try {
      await courseService.deleteChapter(chId);
      setSuccessMessage('Đã xóa chương thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadStructure();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa chương thất bại';
      setErrorMessage(msg);
    }
  };

  // Lesson Handlers
  const handleOpenCreateLesson = (chId: string) => {
    setTargetChapterId(chId);
    setEditingLesson(null);
    setLessonTitle('');
    setLessonSummary('');
    setLessonContent('');
    setLessonVideoUrl('');
    setLessonMinutes(15);
    setLessonStatus('DRAFT');
    setLessonPrice('');
    setLessonIsSellable(false);
    setLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: TeacherLessonResponse) => {
    setTargetChapterId(lesson.chapterId);
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonSummary(lesson.summary || '');
    setLessonContent(lesson.content || '');
    setLessonVideoUrl(lesson.videoUrl || '');
    setLessonMinutes(lesson.estimatedMinutes || 15);
    setLessonStatus(lesson.status);
    setLessonPrice(lesson.price ?? '');
    setLessonIsSellable(Boolean(lesson.isSellable));
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;

    setIsLessonSubmitting(true);
    try {
      const payload: TeacherLessonRequest = {
        title: lessonTitle.trim(),
        summary: lessonSummary.trim() || undefined,
        content: lessonContent.trim() || undefined,
        videoUrl: lessonVideoUrl.trim() || undefined,
        estimatedMinutes: lessonMinutes || 15,
        status: lessonStatus,
        price: lessonIsSellable && lessonPrice !== '' ? Number(lessonPrice) : undefined,
        isSellable: lessonIsSellable,
      };

      if (editingLesson) {
        await courseService.updateLesson(editingLesson.id, payload);
        setSuccessMessage('Cập nhật bài học thành công!');
      } else {
        await courseService.createLesson(targetChapterId, payload);
        setSuccessMessage('Tạo bài học mới thành công!');
      }

      setTimeout(() => setSuccessMessage(null), 4000);
      setLessonModalOpen(false);
      await loadStructure();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác bài học thất bại';
      setErrorMessage(msg);
    } finally {
      setIsLessonSubmitting(false);
    }
  };

  const handleTogglePublishLesson = async (lesson: TeacherLessonResponse) => {
    try {
      if (lesson.status === 'PUBLISHED') {
        await courseService.archiveLesson(lesson.id);
        setSuccessMessage('Đã chuyển bài học sang trạng thái Lưu trữ');
      } else {
        await courseService.publishLesson(lesson.id);
        setSuccessMessage('Đã xuất bản bài học!');
      }
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadStructure();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thay đổi trạng thái thất bại';
      setErrorMessage(msg);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài học này không?')) return;
    try {
      await courseService.deleteLesson(lessonId);
      setSuccessMessage('Đã xóa bài học thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadStructure();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa bài học thất bại';
      setErrorMessage(msg);
    }
  };

  // Phase 5 Resource Handlers
  const handleOpenResources = async (lesson: TeacherLessonResponse) => {
    setActiveResourceLesson(lesson);
    setResType('PDF');
    setResTitle('');
    setResUrl('');
    setResourceModalOpen(true);
    setIsResourcesLoading(true);
    try {
      const data = await resourceService.getTeacherLessonResources(lesson.id);
      setLessonResources(data);
    } catch {
      setLessonResources([]);
    } finally {
      setIsResourcesLoading(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResourceLesson || !resTitle.trim() || !resUrl.trim()) return;

    setIsAddingResource(true);
    try {
      const payload: CreateResourceRequest = {
        resourceType: resType,
        title: resTitle.trim(),
        url: resUrl.trim(),
      };
      await resourceService.addTeacherLessonResource(activeResourceLesson.id, payload);
      setSuccessMessage(`Đã thêm tài liệu ${resTitle} thành công!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setResTitle('');
      setResUrl('');
      const data = await resourceService.getTeacherLessonResources(activeResourceLesson.id);
      setLessonResources(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thêm tài liệu thất bại';
      setErrorMessage(msg);
    } finally {
      setIsAddingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!activeResourceLesson || !confirm('Xác nhận xóa tài liệu này?')) return;
    try {
      await resourceService.deleteTeacherLessonResource(activeResourceLesson.id, resourceId);
      const data = await resourceService.getTeacherLessonResources(activeResourceLesson.id);
      setLessonResources(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa tài liệu thất bại';
      setErrorMessage(msg);
    }
  };

  const handlePublishCourse = async () => {
    try {
      await courseService.publishCourse(courseId);
      setSuccessMessage('Đã xuất bản toàn bộ khóa học!');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadStructure();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xuất bản thất bại';
      setErrorMessage(msg);
    }
  };

  const handleArchiveCourse = async () => {
    try {
      await courseService.archiveCourse(courseId);
      setSuccessMessage('Đã chuyển khóa học sang trạng thái Lưu trữ.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadStructure();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu trữ thất bại';
      setErrorMessage(msg);
    }
  };

  const filteredProgresses = studentProgresses.filter(
    (p) =>
      p.studentName.toLowerCase().includes(progressSearch.toLowerCase()) ||
      p.studentEmail.toLowerCase().includes(progressSearch.toLowerCase()) ||
      p.lessonTitle.toLowerCase().includes(progressSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#83C75D]/30 border-t-[#83C75D] rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Đang tải cấu trúc khóa học...</p>
        </div>
      </div>
    );
  }

  if (!courseDetail) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <p className="text-slate-600 font-bold mb-4">Không tìm thấy thông tin khóa học</p>
        <Link
          href="/teacher/courses"
          className="px-4 py-2 bg-[#83C75D] text-white rounded-xl text-xs font-bold"
        >
          Quay về danh sách khóa học
        </Link>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['TEACHER', 'ADMIN']}>
      <div className="min-h-screen bg-slate-50 py-8 font-sans">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Toast feedback */}
          {successMessage && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold shadow-sm animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold shadow-sm animate-in fade-in">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Back & Breadcrumb */}
          <div className="flex items-center justify-between">
            <Link
              href="/teacher/courses"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Khóa học của tôi</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Trạng thái:</span>
              <StatusBadge status={courseDetail.status} size="sm" />
            </div>
          </div>

          {/* Course Summary Hero Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#83C75D]/15 text-[#4e8231]">
                    {courseDetail.subjectName || 'Khóa học'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">•</span>
                  <span className="font-mono text-xs font-bold text-slate-500">{courseDetail.code}</span>
                  {courseDetail.gradeLevel && (
                    <>
                      <span className="text-xs text-slate-400 font-semibold">•</span>
                      <span className="text-xs text-slate-500">{courseDetail.gradeLevel}</span>
                    </>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {courseDetail.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                  {courseDetail.description || 'Chưa có mô tả chi tiết cho khóa học này.'}
                </p>
              </div>

              {/* Course Actions */}
              <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto flex-wrap">
                <button
                  onClick={async () => {
                    try {
                      await marketplaceService.submitCourseForReview(courseId);
                      setSuccessMessage('Đã gửi yêu cầu kiểm duyệt lên Marketplace thành công! Chờ Admin phê duyệt.');
                      setTimeout(() => setSuccessMessage(null), 4000);
                      await loadStructure();
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : 'Gửi duyệt thất bại';
                      setErrorMessage(msg);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  title="Gửi khóa học lên hệ thống Marketplace để quản trị viên kiểm duyệt và mở bán"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gửi duyệt Marketplace</span>
                </button>

                {courseDetail.status !== 'ACTIVE' && (
                  <button
                    onClick={handlePublishCourse}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-md shadow-[#83C75D]/20 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Xuất bản nội bộ</span>
                  </button>
                )}

                {courseDetail.status !== 'ARCHIVED' && (
                  <button
                    onClick={handleArchiveCourse}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Lưu trữ</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats & Tabs Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#83C75D]" />
                  <span>{courseDetail.chapters.length} Chương</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>{courseDetail.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0)} Bài học</span>
                </span>
              </div>

              {/* Phase 5 Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setActiveTab('SYLLABUS')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'SYLLABUS'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cấu trúc Giáo trình
                </button>
                <button
                  onClick={() => setActiveTab('PROGRESS')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'PROGRESS'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tiến độ Học viên</span>
                </button>
                <button
                  onClick={() => setActiveTab('ENROLLMENTS')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'ENROLLMENTS'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    Duyệt Học sinh
                    {enrollments.filter((e) => e.status === 'PENDING').length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black">
                        {enrollments.filter((e) => e.status === 'PENDING').length}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: SYLLABUS */}
          {activeTab === 'SYLLABUS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Danh mục Chương & Bài học</h2>
                <button
                  onClick={handleOpenCreateChapter}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#83C75D] hover:bg-[#72b44e] text-white rounded-2xl text-xs font-bold shadow-md shadow-[#83C75D]/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Chương mới</span>
                </button>
              </div>

              {courseDetail.chapters.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Chưa có chương nào</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Hãy tạo chương đầu tiên để bắt đầu thêm các bài học và tài liệu.
                  </p>
                  <button
                    onClick={handleOpenCreateChapter}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#83C75D] text-white rounded-xl text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo Chương 1</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseDetail.chapters.map((chapter, cIdx) => {
                    const isOpen = !!openChapters[chapter.id];

                    return (
                      <div
                        key={chapter.id}
                        className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
                      >
                        {/* Chapter Accordion Header */}
                        <div className="p-4 sm:px-6 flex items-center justify-between gap-4 bg-slate-50/50 border-b border-slate-100">
                          <button
                            onClick={() => toggleChapter(chapter.id)}
                            className="flex items-center gap-3 text-left flex-1 min-w-0"
                          >
                            {isOpen ? (
                              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900">
                                  Chương {chapter.displayOrder}: {chapter.title}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.2 rounded-full">
                                  {chapter.lessons.length} bài
                                </span>
                                {chapter.isSellable && chapter.price && (
                                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                    Bán lẻ: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(chapter.price)}
                                  </span>
                                )}
                              </div>
                              {chapter.description && (
                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                  {chapter.description}
                                </p>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenCreateLesson(chapter.id)}
                              className="p-1.5 rounded-lg border border-[#83C75D]/40 text-[#4e8231] hover:bg-[#83C75D]/15 text-xs font-bold flex items-center gap-1 transition-all"
                              title="Thêm bài học"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Thêm bài học</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditChapter(chapter)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chỉnh sửa chương"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(chapter.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa chương"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Chapter Lessons List */}
                        {isOpen && (
                          <div className="divide-y divide-slate-100">
                            {chapter.lessons.length === 0 ? (
                              <div className="p-6 text-center text-xs text-slate-400">
                                Chưa có bài học nào trong chương này. Bấm &quot;Thêm bài học&quot; ở trên.
                              </div>
                            ) : (
                              chapter.lessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                                >
                                  <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                                      <PlayCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs sm:text-sm font-bold text-slate-900">
                                          {lesson.displayOrder}. {lesson.title}
                                        </p>
                                        <StatusBadge status={lesson.status} size="sm" />
                                        {lesson.isSellable && lesson.price && (
                                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                                            Bán lẻ: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lesson.price)}
                                          </span>
                                        )}
                                      </div>
                                      {lesson.summary && (
                                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                          {lesson.summary}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                                        {lesson.estimatedMinutes && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{lesson.estimatedMinutes} phút</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Lesson Actions */}
                                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 flex-wrap sm:flex-nowrap">
                                    {/* Manage Exercises Button */}
                                    <button
                                      onClick={() => handleOpenExercises(lesson)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                                      title="Quản lý các bài tập luyện tập trong bài học này"
                                    >
                                      <Dumbbell className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Bài tập</span>
                                    </button>

                                    {/* Manage Resources Button (Phase 5) */}
                                    <button
                                      onClick={() => handleOpenResources(lesson)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 text-[11px] font-bold transition-all cursor-pointer"
                                      title="Quản lý tài liệu đính kèm"
                                    >
                                      <Paperclip className="w-3.5 h-3.5" />
                                      <span>Tài liệu</span>
                                    </button>

                                    {/* Toggle Publish / Draft */}
                                    <button
                                      onClick={() => handleTogglePublishLesson(lesson)}
                                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                        lesson.status === 'PUBLISHED'
                                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                      }`}
                                    >
                                      {lesson.status === 'PUBLISHED' ? 'Chuyển Nháp' : 'Xuất bản'}
                                    </button>

                                    <button
                                      onClick={() => handleOpenEditLesson(lesson)}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Sửa bài học"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLesson(lesson.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Xóa bài học"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STUDENT PROGRESS (PHASE 5) */}
          {activeTab === 'PROGRESS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span>Báo cáo Tiến độ Học tập của Học sinh</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Theo dõi tỷ lệ hoàn thành, thời gian học và trạng thái tiến độ theo từng học viên.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={progressSearch}
                    onChange={(e) => setProgressSearch(e.target.value)}
                    placeholder="Tìm theo tên học sinh hoặc bài học..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {isProgressLoading ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-xs font-medium text-slate-500">Đang tải báo cáo tiến độ học tập...</p>
                </div>
              ) : filteredProgresses.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Chưa có dữ liệu học tập</h4>
                  <p className="text-xs text-slate-500">
                    Khi học sinh bắt đầu truy cập và học các bài học, tiến độ sẽ được thống kê trực quan tại đây.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3.5 px-6">Học sinh</th>
                          <th className="py-3.5 px-6">Bài học</th>
                          <th className="py-3.5 px-6">Tiến độ (%)</th>
                          <th className="py-3.5 px-6">Trạng thái</th>
                          <th className="py-3.5 px-6">Lần truy cập</th>
                          <th className="py-3.5 px-6 text-right">Mở khóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredProgresses.map((prog) => (
                          <tr key={prog.progressId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-bold text-slate-900">{prog.studentName}</p>
                                <p className="text-slate-400 text-[11px]">{prog.studentEmail}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-semibold text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span>{prog.lessonTitle}</span>
                                {prog.isUnlockedByAdmin && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                    <Unlock className="w-2.5 h-2.5" />
                                    Admin mở
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 max-w-[120px]">
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#83C75D] h-full rounded-full"
                                    style={{ width: `${prog.progressPercent}%` }}
                                  />
                                </div>
                                <span className="font-bold text-[11px] text-slate-700">
                                  {prog.progressPercent}%
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                  prog.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {prog.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang học'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-500">
                              {prog.lastAccessedAt ? new Date(prog.lastAccessedAt).toLocaleString('vi-VN') : '—'}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleUnlockLesson(prog.studentId, prog.lessonId)}
                                  disabled={unlockingActionId === `${prog.studentId}-${prog.lessonId}` || prog.isUnlockedByAdmin}
                                  title="Mở khóa riêng bài học này cho học viên"
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-semibold text-[11px] transition-all disabled:opacity-50 flex items-center gap-1"
                                >
                                  <Unlock className="w-3 h-3 text-amber-600" />
                                  <span>{prog.isUnlockedByAdmin ? 'Đã mở' : 'Mở bài này'}</span>
                                </button>
                                <button
                                  onClick={() => handleUnlockAllLessons(prog.studentId)}
                                  disabled={unlockingActionId === `all-${prog.studentId}`}
                                  title="Mở khóa toàn bộ bài học trong khóa học cho học viên"
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-all disabled:opacity-50 flex items-center gap-1"
                                >
                                  <span>Mở tất cả</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ENROLLMENTS (Duyệt học sinh / Yêu cầu tham gia) */}
          {activeTab === 'ENROLLMENTS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Danh sách Yêu cầu & Học viên tham gia</h2>
                  <p className="text-xs text-slate-500">
                    Quản lý học sinh tham gia khóa học (Đặc biệt với các khóa học Chế độ Riêng tư)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                    Tổng cộng: <strong>{enrollments.length}</strong> học viên
                  </span>
                </div>
              </div>

              {isEnrollmentsLoading ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-600 rounded-full animate-spin" />
                  <p className="text-xs text-slate-500">Đang tải danh sách học viên...</p>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Chưa có yêu cầu tham gia nào</h4>
                  <p className="text-xs text-slate-500">
                    Khi học sinh gửi yêu cầu xin vào lớp, danh sách sẽ hiển thị tại đây để bạn duyệt.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3.5 px-6">Học sinh</th>
                          <th className="py-3.5 px-6">Thời gian yêu cầu</th>
                          <th className="py-3.5 px-6">Trạng thái</th>
                          <th className="py-3.5 px-6 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {enrollments.map((enr) => (
                          <tr key={enr.enrollmentId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-bold text-slate-900">{enr.studentName}</p>
                                <p className="text-slate-400 text-[11px] font-mono">{enr.studentEmail}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-500">
                              {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleString('vi-VN') : '—'}
                            </td>
                            <td className="py-4 px-6">
                              {enr.status === 'ENROLLED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Đã tham gia</span>
                                </span>
                              ) : enr.status === 'PENDING' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800">
                                  <Clock className="w-3 h-3" />
                                  <span>Chờ duyệt</span>
                                </span>
                              ) : enr.status === 'REJECTED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800">
                                  <X className="w-3 h-3" />
                                  <span>Đã từ chối</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700">
                                  {enr.status}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              {enr.status === 'PENDING' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleApproveEnrollment(enr.enrollmentId)}
                                    disabled={enrollmentActionId === enr.enrollmentId}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Duyệt vào lớp</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectEnrollment(enr.enrollmentId)}
                                    disabled={enrollmentActionId === enr.enrollmentId}
                                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Từ chối</span>
                                  </button>
                                </div>
                              ) : enr.status === 'REJECTED' ? (
                                <button
                                  onClick={() => handleApproveEnrollment(enr.enrollmentId)}
                                  disabled={enrollmentActionId === enr.enrollmentId}
                                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-xs transition-all"
                                >
                                  Duyệt lại
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">Không có thao tác</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal: Resources Manager (Phase 5) */}
          {resourceModalOpen && activeResourceLesson && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-purple-600" />
                      <span>Tài liệu đính kèm: {activeResourceLesson.title}</span>
                    </h3>
                    <p className="text-xs text-slate-500">Quản lý các tài liệu PDF, Video, Link, Document cho bài học</p>
                  </div>
                  <button
                    onClick={() => setResourceModalOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Add Resource Form */}
                <form onSubmit={handleAddResource} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Thêm tài liệu mới:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Loại tài liệu</label>
                      <select
                        value={resType}
                        onChange={(e) => setResType(e.target.value as ResourceType)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                      >
                        <option value="PDF">PDF Document</option>
                        <option value="VIDEO">Video Link</option>
                        <option value="LINK">External URL</option>
                        <option value="DOCUMENT">Document</option>
                        <option value="IMAGE">Image Asset</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tiêu đề tài liệu *</label>
                      <input
                        type="text"
                        required
                        value={resTitle}
                        onChange={(e) => setResTitle(e.target.value)}
                        placeholder="Ví dụ: Slide bài giảng PDF..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Đường dẫn URL *</label>
                    <input
                      type="url"
                      required
                      value={resUrl}
                      onChange={(e) => setResUrl(e.target.value)}
                      placeholder="https://example.com/file.pdf"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isAddingResource}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
                    >
                      {isAddingResource ? 'Đang thêm...' : 'Thêm tài liệu'}
                    </button>
                  </div>
                </form>

                {/* Resources List */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Danh sách tài liệu hiện có ({lessonResources.length}):
                  </h4>

                  {isResourcesLoading ? (
                    <div className="p-6 text-center text-xs text-slate-400">Đang tải...</div>
                  ) : lessonResources.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      Chưa có tài liệu nào được đính kèm vào bài học này.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lessonResources.map((res) => (
                        <div
                          key={res.id}
                          className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-bold text-[10px]">
                              {res.resourceType}
                            </span>
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-slate-900 text-xs truncate hover:text-blue-600 flex items-center gap-1"
                            >
                              <span>{res.title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                            </a>
                          </div>

                          <button
                            onClick={() => handleDeleteResource(res.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa tài liệu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal: Lesson Exercise Manager */}
          <LessonExerciseManagerModal
            isOpen={exerciseModalOpen}
            onClose={() => {
              setExerciseModalOpen(false);
              setActiveExerciseLesson(null);
            }}
            lesson={activeExerciseLesson}
            subjectId={courseDetail?.subjectId || undefined}
            gradeLevel={courseDetail?.gradeLevel || undefined}
            courseId={courseDetail?.id}
          />

          {/* Modal: Chapter */}
          {chapterModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingChapter ? 'Chỉnh sửa Chương' : 'Thêm Chương Mới'}
                </h3>
                <form onSubmit={handleSaveChapter} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tiêu đề chương *
                    </label>
                    <input
                      type="text"
                      required
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      placeholder="Ví dụ: Chương 1: Cú pháp cơ bản"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mô tả chương
                    </label>
                    <textarea
                      rows={2}
                      value={chapterDescription}
                      onChange={(e) => setChapterDescription(e.target.value)}
                      placeholder="Mô tả tóm tắt nội dung chương..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D]"
                    />
                  </div>
                  <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chapterIsSellable}
                        onChange={(e) => setChapterIsSellable(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-bold text-amber-900 text-xs">
                        Bán lẻ chương này (Micro-purchase)
                      </span>
                    </label>
                    <p className="text-[11px] text-amber-700">
                      Cho phép học sinh mua riêng chương này mà không cần mua trọn gói cả khóa học.
                    </p>
                    {chapterIsSellable && (
                      <div className="pt-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                          Giá bán lẻ chương (VND) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={chapterPrice}
                          onChange={(e) => setChapterPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Ví dụ: 50000"
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl outline-none focus:border-amber-500 text-slate-900 font-semibold"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setChapterModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isChapterSubmitting}
                      className="px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold"
                    >
                      {isChapterSubmitting ? 'Đang lưu...' : 'Lưu chương'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Lesson */}
          {lessonModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingLesson ? 'Chỉnh sửa Bài học' : 'Thêm Bài học Mới'}
                </h3>
                <form onSubmit={handleSaveLesson} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tiêu đề bài học *
                    </label>
                    <input
                      type="text"
                      required
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder="Ví dụ: Bài 1: Cài đặt môi trường"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Thời lượng ước tính (phút)
                      </label>
                      <input
                        type="number"
                        value={lessonMinutes}
                        onChange={(e) => setLessonMinutes(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Trạng thái
                      </label>
                      <select
                        value={lessonStatus}
                        onChange={(e) => setLessonStatus(e.target.value as LessonStatus)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D]"
                      >
                        <option value="DRAFT">Bản nháp (DRAFT)</option>
                        <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
                        <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lessonIsSellable}
                        onChange={(e) => setLessonIsSellable(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-bold text-amber-900 text-xs">
                        Bán lẻ bài học này (Micro-purchase)
                      </span>
                    </label>
                    <p className="text-[11px] text-amber-700">
                      Cho phép học sinh mua lẻ từng bài học chuyên đề theo nhu cầu.
                    </p>
                    {lessonIsSellable && (
                      <div className="pt-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                          Giá bán lẻ bài học (VND) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={lessonPrice}
                          onChange={(e) => setLessonPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Ví dụ: 15000"
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl outline-none focus:border-amber-500 text-slate-900 font-semibold"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tóm tắt ngắn (Summary)
                    </label>
                    <input
                      type="text"
                      value={lessonSummary}
                      onChange={(e) => setLessonSummary(e.target.value)}
                      placeholder="Tóm tắt ngắn nội dung bài học..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-blue-600" />
                      <span>Đường dẫn Video bài giảng (YouTube, Vimeo, MP4 link...)</span>
                    </label>
                    <input
                      type="url"
                      value={lessonVideoUrl}
                      onChange={(e) => setLessonVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... hoặc link video trực tiếp"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Học viên có thể xem trực tiếp video bài giảng này ở tab &quot;Video&quot; khi học bài.
                    </p>
                  </div>

                  <div>
                    <RichMathEditor
                      label="Nội dung bài học (Markdown & Công thức LaTeX)"
                      value={lessonContent}
                      onChange={setLessonContent}
                      placeholder="Nhập nội dung bài giảng, sử dụng thanh công cụ để chèn phân số, tích phân, căn thức, ký hiệu Ohm, tải ảnh minh họa..."
                      minRows={7}
                      allowImageUpload={true}
                      helperText="Học viên sẽ thấy công thức toán học, ký tự vật lý và hình ảnh minh họa được hiển thị chuẩn xác khi học bài."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setLessonModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isLessonSubmitting}
                      className="px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold"
                    >
                      {isLessonSubmitting ? 'Đang lưu...' : 'Lưu bài học'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
