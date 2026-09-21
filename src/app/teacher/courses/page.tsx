'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/RoleGuard';
import { courseService } from '@/services/course.service';
import { subjectService } from '@/services/subject.service';
import { TeacherCourseRequest, TeacherCourseResponse } from '@/types/course';
import { SubjectResponse } from '@/types/admin';
import { StatusBadge } from '@/components/StatusBadge';
import {
  BookOpen,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  Archive,
  Send,
  GraduationCap,
  RefreshCw,
  Check,
  Image as ImageIcon,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { GRADE_LEVEL_GROUPS } from '@/constants/gradeLevels';

const COVER_PRESETS = [
  {
    id: 'math',
    label: 'Toán học & Khoa học',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'it',
    label: 'Tin học & Lập trình',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'english',
    label: 'Ngoại ngữ & Văn học',
    url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 'science',
    label: 'Vật lý & Tự nhiên',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'education',
    label: 'Sách & Giáo trình',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'general',
    label: 'Tổng hợp & Kỹ năng',
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80',
    color: 'from-rose-500 to-red-600',
  },
];

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<TeacherCourseResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('Tiểu học');
  const [subjectId, setSubjectId] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(COVER_PRESETS[0].url);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>('ALL');

  // Trash / Deletion History Modal
  const [trashModalOpen, setTrashModalOpen] = useState<boolean>(false);
  const [deletedCourses, setDeletedCourses] = useState<TeacherCourseResponse[]>([]);
  const [loadingTrash, setLoadingTrash] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleOpenTrash = async () => {
    setTrashModalOpen(true);
    setLoadingTrash(true);
    try {
      const data = await courseService.getDeletedCourses();
      setDeletedCourses(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải lịch sử khóa học đã xóa');
    } finally {
      setLoadingTrash(false);
    }
  };

  const handleRestoreCourse = async (cId: string) => {
    setRestoringId(cId);
    try {
      await courseService.restoreCourse(cId);
      setSuccessMessage('Khôi phục khóa học thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      setDeletedCourses((prev) => prev.filter((c) => c.id !== cId));
      await loadTeacherCoursesAndSubjects();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Khôi phục khóa học thất bại');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa khóa học "${courseName}"?\n(Khóa học sẽ được chuyển vào Thùng rác và có thể khôi phục lại)`)) {
      return;
    }

    try {
      await courseService.deleteCourse(courseId);
      setSuccessMessage(`Đã xóa khóa học "${courseName}" thành công.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Xóa khóa học thất bại');
    }
  };

  useEffect(() => {
    loadTeacherCoursesAndSubjects();
  }, []);

  const filteredCourses = React.useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.subjectName && c.subjectName.toLowerCase().includes(q));

      const matchesSubject =
        selectedSubject === 'ALL' || c.subjectId === selectedSubject || c.subjectName === selectedSubject;

      const matchesGrade =
        selectedGrade === 'ALL' || c.gradeLevel === selectedGrade;

      const matchesStatus =
        selectedStatus === 'ALL' || c.status === selectedStatus;

      const matchesPrivacy =
        selectedPrivacy === 'ALL' ||
        (selectedPrivacy === 'PRIVATE' && c.isPrivate) ||
        (selectedPrivacy === 'PUBLIC' && !c.isPrivate);

      return matchesSearch && matchesSubject && matchesGrade && matchesStatus && matchesPrivacy;
    });
  }, [courses, searchQuery, selectedSubject, selectedGrade, selectedStatus, selectedPrivacy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSubject !== 'ALL' ||
    selectedGrade !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedPrivacy !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('ALL');
    setSelectedGrade('ALL');
    setSelectedStatus('ALL');
    setSelectedPrivacy('ALL');
  };

  const getPrefixFromSubject = (sub?: SubjectResponse) => {
    if (!sub) return 'KHOA';
    const subCode = sub.code?.toUpperCase() || '';
    if (subCode.includes('MATH') || sub.name.toLowerCase().includes('toán')) return 'TOAN';
    if (subCode.includes('IT') || sub.name.toLowerCase().includes('tin') || sub.name.toLowerCase().includes('lập trình')) return 'TIN';
    if (subCode.includes('ENG') || sub.name.toLowerCase().includes('anh')) return 'ANH';
    if (subCode.includes('SCI') || sub.name.toLowerCase().includes('khoa học') || sub.name.toLowerCase().includes('lý')) return 'KHTN';
    return subCode.slice(0, 4) || 'KHOA';
  };

  const generateNewCourseCode = (sub?: SubjectResponse) => {
    const prefix = getPrefixFromSubject(sub);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
  };

  const loadTeacherCoursesAndSubjects = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [coursesData, subjectsRes] = await Promise.all([
        courseService.getTeacherCourses(),
        subjectService.getActiveSubjects().catch(() => []),
      ]);
      setCourses(coursesData);
      setSubjects(subjectsRes);
      if (subjectsRes.length > 0) {
        setSubjectId(subjectsRes[0].id);
        setCode(generateNewCourseCode(subjectsRes[0]));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách khóa học';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    const currentSub = subjects.find((s) => s.id === subjectId) || subjects[0];
    setCode(generateNewCourseCode(currentSub));
    setName('');
    setDescription('');
    setGradeLevel('Tiểu học');
    setIsPrivate(false);
    setThumbnailUrl(COVER_PRESETS[0].url);
    setCreateModalOpen(true);
  };

  const handleSubjectChange = (newSubId: string) => {
    setSubjectId(newSubId);
    const currentSub = subjects.find((s) => s.id === newSubId);
    setCode(generateNewCourseCode(currentSub));
  };

  const handleReRollCode = () => {
    const currentSub = subjects.find((s) => s.id === subjectId);
    setCode(generateNewCourseCode(currentSub));
  };

  const handlePublish = async (courseId: string) => {
    try {
      const updated = await courseService.publishCourse(courseId);
      setCourses((prev) => prev.map((c) => (c.id === courseId ? updated : c)));
      setSuccessMessage('Đã xuất bản khóa học thành công! Học sinh đã có thể xem.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xuất bản thất bại';
      setErrorMessage(msg);
    }
  };

  const handleArchive = async (courseId: string) => {
    try {
      const updated = await courseService.archiveCourse(courseId);
      setCourses((prev) => prev.map((c) => (c.id === courseId ? updated : c)));
      setSuccessMessage('Đã chuyển khóa học sang trạng thái Lưu trữ.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu trữ thất bại';
      setErrorMessage(msg);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Tên khóa học không được để trống');
      return;
    }

    if (!subjectId) {
      setErrorMessage('Vui lòng chọn một Môn học cho khóa học này');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: TeacherCourseRequest = {
      subjectId: subjectId.trim(),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
      gradeLevel: gradeLevel.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      isPrivate: isPrivate,
      status: 'DRAFT',
    };

    try {
      const newCourse = await courseService.createCourse(payload);
      setCourses((prev) => [newCourse, ...prev]);
      setSuccessMessage(`Đã tạo khóa học "${newCourse.name}" thành công!`);
      setTimeout(() => setSuccessMessage(null), 4000);

      setCreateModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo khóa học thất bại';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['TEACHER', 'ADMIN']}>
      <div className="min-h-screen bg-slate-50 py-8 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Toast notifications */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold shadow-sm animate-in fade-in">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold shadow-sm animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#83C75D]/15 text-[#4e8231]">
                  Giảng viên Portal
                </span>
                <span className="text-xs text-slate-400 font-semibold">•</span>
                <span className="text-xs text-slate-500 font-medium">Phase 4 & 5</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Quản lý Khóa học & Giáo trình
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Tạo khóa học, biên tập chương mục, bài học và đính kèm tài liệu học tập
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenTrash}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Xem các khóa học đã xóa & Khôi phục"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Lịch sử xóa</span>
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-md shadow-[#83C75D]/20 transition-all self-start sm:self-auto transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Khóa học Mới</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Control Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Input */}
              <div className="relative lg:col-span-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc mã khóa học..."
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#83C75D] focus:bg-white rounded-2xl text-xs sm:text-sm outline-none transition-all"
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

              {/* Subject Filter */}
              <div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#83C75D] focus:bg-white rounded-2xl text-xs text-slate-700 outline-none transition-all font-medium"
                >
                  <option value="ALL">📚 Tất cả Môn học</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade Level Filter */}
              <div>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#83C75D] focus:bg-white rounded-2xl text-xs text-slate-700 outline-none transition-all font-medium"
                >
                  <option value="ALL">🎓 Tất cả Cấp độ / Khối lớp</option>
                  {GRADE_LEVEL_GROUPS.map((group) => (
                    <optgroup key={group.level} label={group.label}>
                      {group.grades.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Status / Privacy Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#83C75D] focus:bg-white rounded-2xl text-xs text-slate-700 outline-none transition-all font-medium"
                >
                  <option value="ALL">⚡ Tất cả Trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="DRAFT">Bản nháp (DRAFT)</option>
                  <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
                </select>
              </div>
            </div>

            {/* Quick Summary & Reset */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <span>Hiển thị:</span>
                <strong className="text-slate-900 font-bold">{filteredCourses.length}</strong>
                <span>/ {courses.length} khóa học</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Privacy Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button
                    onClick={() => setSelectedPrivacy('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedPrivacy === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setSelectedPrivacy('PUBLIC')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedPrivacy === 'PUBLIC'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🌐 Công khai
                  </button>
                  <button
                    onClick={() => setSelectedPrivacy('PRIVATE')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedPrivacy === 'PRIVATE'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🔒 Riêng tư
                  </button>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-xl transition-colors"
                  >
                    ✕ Xóa lọc
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Course List Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <div className="w-10 h-10 border-4 border-[#83C75D]/30 border-t-[#83C75D] rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-500">Đang tải danh sách khóa học...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#83C75D]/10 text-[#4e8231] mx-auto flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Chưa có khóa học nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                Bắt đầu tạo khóa học đầu tiên của bạn để thiết lập cấu trúc chương và bài giảng cho học sinh.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Khóa học Ngay</span>
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy khóa học nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Không có khóa học nào khớp với bộ lọc tìm kiếm hiện tại.
              </p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
              >
                <span>Đặt lại bộ lọc</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {course.code}
                        </span>
                        {course.isPrivate ? (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                            🔒 Riêng tư
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                            🌐 Công khai
                          </span>
                        )}
                      </div>
                      <StatusBadge status={course.status} size="sm" />
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-[#4e8231] uppercase tracking-wider">
                        {course.subjectName || 'Môn học'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-[#4e8231] transition-colors mt-0.5">
                        {course.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {course.description || 'Chưa có mô tả chi tiết'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      {course.gradeLevel && <span>Cấp độ: {course.gradeLevel}</span>}
                      <span>•</span>
                      <span>Người tạo: {course.creatorName || 'Tôi'}</span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {course.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handlePublish(course.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#83C75D]/40 text-[#4e8231] hover:bg-[#83C75D]/15 text-[11px] font-bold transition-colors flex items-center gap-1"
                          title="Xuất bản khóa học để học sinh có thể thấy"
                        >
                          <Send className="w-3 h-3" />
                          <span>Xuất bản</span>
                        </button>
                      )}

                      {course.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(course.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Lưu trữ khóa học"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Lưu trữ</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteCourse(course.id, course.name)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Xóa khóa học (chuyển vào Thùng rác)"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    </div>

                    <Link
                      href={`/teacher/courses/${course.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      <span>Biên tập Giáo trình</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal: Create Course */}
          {createModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">Tạo Khóa học Mới</h3>
                    <p className="text-xs text-slate-500">Khóa học được tạo sẽ ở trạng thái Bản nháp (DRAFT).</p>
                  </div>
                  <button
                    onClick={() => setCreateModalOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
                  {/* Select Subject Dropdown */}
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Môn học (Subject) *
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D] font-medium"
                    >
                      {subjects.length === 0 ? (
                        <option value="">Đang tải môn học...</option>
                      ) : (
                        subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Khóa học này thuộc danh mục Môn học nào (Toán học, Tin học, Tiếng Anh...)
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tên khóa học *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Toán lớp 1 Căn bản"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Auto-generated Course Code */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 uppercase tracking-wider">
                          Mã khóa học
                        </label>
                        <span className="text-[10px] font-bold text-[#4e8231] bg-[#83C75D]/15 px-2 py-0.5 rounded-md">
                          Tự động tạo
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={code}
                          className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold outline-none cursor-default"
                        />
                        <button
                          type="button"
                          onClick={handleReRollCode}
                          title="Tạo lại mã ngẫu nhiên"
                          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Grade Level Select Box */}
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Cấp độ *
                      </label>
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D] font-medium"
                      >
                        {GRADE_LEVEL_GROUPS.map((group) => (
                          <optgroup key={group.level} label={group.label}>
                            {group.grades.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Privacy / Access Mode Select Box */}
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Chế độ tham gia (Quyền riêng tư) *
                    </label>
                    <select
                      value={isPrivate ? 'PRIVATE' : 'PUBLIC'}
                      onChange={(e) => setIsPrivate(e.target.value === 'PRIVATE')}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D] font-medium"
                    >
                      <option value="PUBLIC">🌐 Công khai (Public) — Học sinh có thể tự do tham gia và học ngay</option>
                      <option value="PRIVATE">🔒 Riêng tư (Private) — Học sinh phải xin vào và cần được Giảng viên duyệt</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isPrivate
                        ? 'Khi học sinh nhấn tham gia, yêu cầu sẽ chuyển sang trạng thái Chờ duyệt.'
                        : 'Học sinh chỉ cần nhấn Đăng ký là có thể xem nội dung bài giảng ngay lập tức.'}
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mô tả ngắn
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Khóa học toán dành cho các bé mới vào lớp 1..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#83C75D]"
                    />
                  </div>

                  {/* Thumbnail / Cover Preset Picker */}
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#83C75D]" />
                      <span>Chọn ảnh bìa khóa học</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {COVER_PRESETS.map((preset) => {
                        const isSelected = thumbnailUrl === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setThumbnailUrl(preset.url)}
                            className={`relative group rounded-xl overflow-hidden border-2 transition-all p-1 text-left ${
                              isSelected
                                ? 'border-[#83C75D] shadow-sm ring-2 ring-[#83C75D]/20'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className={`h-12 rounded-lg bg-gradient-to-br ${preset.color} flex items-center justify-center relative`}>
                              {isSelected && (
                                <div className="absolute top-1 right-1 w-4 h-4 bg-[#83C75D] text-white rounded-full flex items-center justify-center shadow-xs">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-semibold text-slate-700 mt-1 truncate px-0.5">
                              {preset.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCreateModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold shadow-md shadow-[#83C75D]/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Đang tạo...' : 'Tạo khóa học'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
                        <span>Lịch sử xóa khóa học / Thùng rác</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                          {deletedCourses.length} khóa học
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Các khóa học đã bị xóa mềm. Bạn có thể khôi phục lại bất kỳ lúc nào.
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
                      <RefreshCw className="w-7 h-7 animate-spin text-rose-600" />
                      <p className="text-sm font-semibold">Đang tải danh sách khóa học đã xóa...</p>
                    </div>
                  ) : deletedCourses.length === 0 ? (
                    <div className="py-16 text-center text-slate-500">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-2xl">
                        🗑️
                      </div>
                      <h3 className="font-bold text-slate-700 text-base">Thùng rác trống</h3>
                      <p className="text-xs text-slate-400 mt-1">Không có khóa học nào bị xóa trong hệ thống.</p>
                    </div>
                  ) : (
                    deletedCourses.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-rose-200 transition-all shadow-2xs space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {c.code}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                              {c.subjectName || 'Môn học'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {c.gradeLevel || 'Chung'}
                            </span>
                          </div>

                          <button
                            onClick={() => handleRestoreCourse(c.id)}
                            disabled={restoringId === c.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                          >
                            <Undo2 className={`w-3.5 h-3.5 ${restoringId === c.id ? 'animate-spin' : ''}`} />
                            <span>{restoringId === c.id ? 'Đang khôi phục...' : 'Khôi phục'}</span>
                          </button>
                        </div>

                        {/* Title */}
                        <div className="text-sm text-slate-900 font-bold">
                          {c.name}
                        </div>
                        {c.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {c.description}
                          </p>
                        )}

                        {/* Deletion details */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>
                            Xóa bởi: <strong className="text-slate-600 font-semibold">{c.deletedBy || c.creatorName || 'Người dùng'}</strong>
                          </span>
                          <span>
                            Thời gian: {c.deletedAt ? new Date(c.deletedAt).toLocaleString('vi-VN') : 'Gần đây'}
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
        </div>
      </div>
    </RoleGuard>
  );
}
