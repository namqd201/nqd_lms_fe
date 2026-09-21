'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/admin.service';
import { marketplaceService } from '@/services/marketplace.service';
import { AdminCourseResponse } from '@/types/admin';
import { MarketplaceCourseResponse } from '@/types/marketplace';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  Layers,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  Trash2,
  Ban,
  Users,
  X,
  MessageSquare,
  Sparkles,
  Check,
  XCircle,
  Clock,
  Tag,
  DollarSign
} from 'lucide-react';
import { GRADE_LEVEL_GROUPS, getGradeGroup } from '@/constants/gradeLevels';

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING_MARKETPLACE'>('ALL');
  const [courses, setCourses] = useState<AdminCourseResponse[]>([]);
  const [pendingCourses, setPendingCourses] = useState<MarketplaceCourseResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>('ALL');

  // Disable Modal
  const [disableModalOpen, setDisableModalOpen] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<AdminCourseResponse | null>(null);
  const [disableReason, setDisableReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reject Modal for Marketplace Review
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [selectedPendingCourse, setSelectedPendingCourse] = useState<MarketplaceCourseResponse | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // Success / Error alerts
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const [allData, pendingData] = await Promise.all([
        adminService.getCourses(),
        marketplaceService.getAdminPendingCourses().catch(() => [])
      ]);
      setCourses(allData);
      setPendingCourses(Array.isArray(pendingData) ? pendingData : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách khóa học';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const subjectList = React.useMemo(() => {
    const subs = new Set<string>();
    courses.forEach((c) => {
      if (c.subjectName) subs.add(c.subjectName);
    });
    return Array.from(subs);
  }, [courses]);

  const openDisableModal = (course: AdminCourseResponse) => {
    setSelectedCourse(course);
    setDisableReason('');
    setDisableModalOpen(true);
  };

  const handleDisableCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !disableReason.trim()) return;

    setIsSubmitting(true);
    try {
      await adminService.disableCourse(selectedCourse.id, disableReason.trim());
      setSuccessMessage('Đã vô hiệu hóa khóa học "' + selectedCourse.name + '" và gửi thông báo tới giảng viên.');
      setTimeout(() => setSuccessMessage(null), 5000);
      setDisableModalOpen(false);
      setSelectedCourse(null);
      await loadCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Vô hiệu hóa thất bại';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnableCourse = async (course: AdminCourseResponse) => {
    if (!confirm('Bạn có chắc muốn kích hoạt lại khóa học "' + course.name + '"?')) return;

    try {
      await adminService.enableCourse(course.id);
      setSuccessMessage('Đã kích hoạt lại khóa học "' + course.name + '".');
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kích hoạt thất bại';
      setErrorMessage(msg);
    }
  };

  const handleDeleteCourse = async (course: AdminCourseResponse) => {
    if (course.creatorId !== user?.id) {
      alert('Quy tắc hệ thống: Admin không thể xóa khóa học mà không phải do chính Admin tạo. Bạn có thể vô hiệu hóa (Disable) khóa học kèm lý do giải thích.');
      return;
    }

    if (course.enrolledStudentsCount > 0) {
      alert('Không thể xóa khóa học đang có ' + course.enrolledStudentsCount + ' học sinh theo học.');
      return;
    }

    if (!confirm('Bạn có chắc muốn xóa vĩnh viễn khóa học "' + course.name + '"?')) return;

    try {
      await adminService.deleteCourse(course.id);
      setSuccessMessage('Đã xóa khóa học thành công.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa thất bại';
      setErrorMessage(msg);
    }
  };

  // Marketplace Approve
  const handleApproveMarketplace = async (course: MarketplaceCourseResponse) => {
    if (!confirm('Xác nhận phê duyệt khóa học "' + course.name + '" lên sàn Marketplace?')) return;

    try {
      await marketplaceService.adminApproveCourse(course.id);
      setSuccessMessage('Đã phê duyệt và phát hành khóa học "' + course.name + '" lên Marketplace!');
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
      setErrorMessage(msg);
    }
  };

  // Marketplace Reject
  const handleRejectMarketplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPendingCourse || !rejectReason.trim()) return;

    setIsRejecting(true);
    try {
      await marketplaceService.adminRejectCourse(selectedPendingCourse.id, rejectReason.trim());
      setSuccessMessage('Đã từ chối khóa học kèm lý do phản hồi cho giảng viên.');
      setTimeout(() => setSuccessMessage(null), 5000);
      setRejectModalOpen(false);
      setSelectedPendingCourse(null);
      await loadCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Từ chối thất bại';
      setErrorMessage(msg);
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredCourses = React.useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.creatorName && c.creatorName.toLowerCase().includes(q)) ||
        (c.creatorEmail && c.creatorEmail.toLowerCase().includes(q)) ||
        (c.subjectName && c.subjectName.toLowerCase().includes(q));

      const matchesSubject =
        selectedSubject === 'ALL' || c.subjectName === selectedSubject;

      const matchesGrade =
        selectedGrade === 'ALL' ||
        c.gradeLevel === selectedGrade ||
        getGradeGroup(c.gradeLevel) === selectedGrade;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'DISABLED' && c.isDisabled) ||
        (!c.isDisabled && c.status === statusFilter);

      const matchesPrivacy =
        selectedPrivacy === 'ALL' ||
        (selectedPrivacy === 'PRIVATE' && c.isPrivate) ||
        (selectedPrivacy === 'PUBLIC' && !c.isPrivate);

      return matchesSearch && matchesSubject && matchesGrade && matchesStatus && matchesPrivacy;
    });
  }, [courses, searchQuery, selectedSubject, selectedGrade, statusFilter, selectedPrivacy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSubject !== 'ALL' ||
    selectedGrade !== 'ALL' ||
    statusFilter !== 'ALL' ||
    selectedPrivacy !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('ALL');
    setSelectedGrade('ALL');
    setStatusFilter('ALL');
    setSelectedPrivacy('ALL');
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null || val === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              Admin Moderation
            </span>
            <span className="text-xs text-slate-400 font-semibold">•</span>
            <span className="text-xs text-slate-500 font-medium">Khóa học toàn hệ thống</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản lý & Kiểm duyệt Khóa học
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kiểm duyệt nội dung giảng viên đăng tải, duyệt khóa học Marketplace, vô hiệu hóa khóa học không phù hợp.
          </p>
        </div>

        <button
          onClick={loadCourses}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={'w-3.5 h-3.5 ' + (isLoading ? 'animate-spin text-purple-600' : '')} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={'px-4 py-2 rounded-2xl text-xs font-bold transition-all ' + (activeTab === 'ALL' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
        >
          Tất cả Khóa học ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('PENDING_MARKETPLACE')}
          className={'px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ' + (activeTab === 'PENDING_MARKETPLACE' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chờ duyệt Marketplace</span>
          {pendingCourses.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-700 font-black">
              {pendingCourses.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'PENDING_MARKETPLACE' ? (
        /* TAB 2: PENDING MARKETPLACE COURSES */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Khóa học đang chờ kiểm duyệt phát hành ({pendingCourses.length})</span>
            </h3>
            <span className="text-xs text-slate-500">Xem xét nội dung và duyệt mở bán trên hệ thống</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Đang tải danh sách chờ duyệt...</div>
          ) : pendingCourses.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Hiện tại không có khóa học nào đang chờ kiểm duyệt.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingCourses.map((pc) => (
                <div key={pc.id} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {pc.code}
                      </span>
                      {pc.subjectName && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {pc.subjectName}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        PENDING_REVIEW
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{pc.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{pc.description || 'Không có mô tả'}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>Giảng viên: <strong className="text-slate-800 font-bold">{pc.creatorName || 'Giảng viên'}</strong></span>
                      <span>•</span>
                      <span>Học phí: <strong className="text-amber-600 font-bold font-mono">{formatCurrency(pc.salePrice || pc.price)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={'/courses/' + pc.id}
                      target="_blank"
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                    >
                      Xem nội dung
                    </Link>

                    <button
                      onClick={() => handleApproveMarketplace(pc)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Phê duyệt</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPendingCourse(pc);
                        setRejectReason('');
                        setRejectModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Từ chối</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB 1: ALL COURSES */
        <>
          {/* Filter Controls */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên, mã, giảng viên, email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white rounded-2xl text-xs sm:text-sm outline-none transition-all"
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

              <div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 outline-none focus:border-purple-500 font-medium"
                >
                  <option value="ALL">📚 Tất cả Môn học</option>
                  {subjectList.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 outline-none focus:border-purple-500 font-medium"
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

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 outline-none focus:border-purple-500 font-medium"
                >
                  <option value="ALL">⚡ Tất cả Trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="DISABLED">Đã vô hiệu hóa (DISABLED)</option>
                  <option value="DRAFT">Bản nháp (DRAFT)</option>
                  <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <span>Hiển thị:</span>
                <strong className="text-slate-900 font-bold">{filteredCourses.length}</strong>
                <span>/ {courses.length} khóa học</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button
                    onClick={() => setSelectedPrivacy('ALL')}
                    className={'px-2.5 py-1 rounded-lg text-xs font-bold transition-all ' + (selectedPrivacy === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800')}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setSelectedPrivacy('PUBLIC')}
                    className={'px-2.5 py-1 rounded-lg text-xs font-bold transition-all ' + (selectedPrivacy === 'PUBLIC' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800')}
                  >
                    🌐 Công khai
                  </button>
                  <button
                    onClick={() => setSelectedPrivacy('PRIVATE')}
                    className={'px-2.5 py-1 rounded-lg text-xs font-bold transition-all ' + (selectedPrivacy === 'PRIVATE' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800')}
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

          {/* Course List Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
                <p className="text-xs font-medium text-slate-500">Đang tải danh sách khóa học...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy khóa học nào</h4>
                <p className="text-xs text-slate-500">Thử thay đổi bộ lọc tìm kiếm.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Khóa học & Môn học</th>
                      <th className="py-3.5 px-6">Giảng viên tạo</th>
                      <th className="py-3.5 px-6">Quyền riêng tư</th>
                      <th className="py-3.5 px-6">Học viên</th>
                      <th className="py-3.5 px-6">Trạng thái</th>
                      <th className="py-3.5 px-6 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredCourses.map((c) => {
                      const isCreator = user?.id === c.creatorId;
                      const hasEnrolled = c.enrolledStudentsCount > 0;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 max-w-xs">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                                  {c.code}
                                </span>
                                {c.subjectName && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                    {c.subjectName}
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                              {c.disabledReason && (
                                <div className="mt-1.5 p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[11px] flex items-start gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                  <div>
                                    <span className="font-bold">Lý do khóa: </span>
                                    <span>{c.disabledReason}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div>
                              <p className="font-semibold text-slate-900 text-xs">
                                {c.creatorName || 'Chưa xác định'}
                              </p>
                              <p className="text-slate-400 text-[11px] font-mono">{c.creatorEmail}</p>
                              {isCreator && (
                                <span className="mt-1 inline-block px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-100 text-purple-700">
                                  Chính bạn
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            {c.isPrivate ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <Lock className="w-3 h-3" />
                                <span>Riêng tư</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Globe className="w-3 h-3" />
                                <span>Công khai</span>
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{c.enrolledStudentsCount}</span>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            {c.isDisabled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                                <Ban className="w-3 h-3" />
                                <span>BỊ VÔ HIỆU HÓA</span>
                              </span>
                            ) : c.status === 'ACTIVE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>ACTIVE</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600">
                                {c.status}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={'/teacher/courses/' + c.id}
                                title="Xem giáo trình"
                                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </Link>

                              {c.isDisabled ? (
                                <button
                                  onClick={() => handleEnableCourse(c)}
                                  title="Kích hoạt lại khóa học"
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mở khóa</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => openDisableModal(c)}
                                  title="Vô hiệu hóa khóa học kèm lý do giải thích"
                                  className="px-2.5 py-1.5 rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Khóa</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteCourse(c)}
                                disabled={!isCreator || hasEnrolled}
                                title={
                                  !isCreator
                                    ? 'Không thể xóa: Bạn không phải người tạo khóa học này'
                                    : hasEnrolled
                                    ? 'Không thể xóa: Có ' + c.enrolledStudentsCount + ' học sinh đang học'
                                    : 'Xóa khóa học'
                                }
                                className={'p-2 rounded-xl border transition-colors ' + (isCreator && !hasEnrolled ? 'border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer' : 'border-slate-100 text-slate-300 cursor-not-allowed')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL: Vô hiệu hóa khóa học kèm lý do */}
      {disableModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Vô hiệu hóa Khóa học</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedCourse.code}</p>
                </div>
              </div>
              <button
                onClick={() => setDisableModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-xs text-slate-500 font-medium">Khóa học:</p>
              <p className="text-sm font-bold text-slate-900">{selectedCourse.name}</p>
              <p className="text-xs text-slate-500">
                Giảng viên tạo: <strong>{selectedCourse.creatorName}</strong> ({selectedCourse.creatorEmail})
              </p>
            </div>

            <form onSubmit={handleDisableCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                  <span>Lời giải thích & Lý do vô hiệu hóa *</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Lý do này sẽ được hệ thống gửi thông báo ngay tới hòm thư & chuông thông báo của Giảng viên.
                </p>
                <textarea
                  required
                  rows={4}
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  placeholder="Ví dụ: Nội dung giáo trình chưa đạt chuẩn, vi phạm bản quyền hình ảnh, hoặc chứa thông tin không phù hợp..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl text-xs sm:text-sm outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDisableModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !disableReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận Vô hiệu hóa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Từ chối Marketplace Review */}
      {rejectModalOpen && selectedPendingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Từ chối duyệt Khóa học</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedPendingCourse.code}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-xs text-slate-500 font-medium">Khóa học:</p>
              <p className="text-sm font-bold text-slate-900">{selectedPendingCourse.name}</p>
              <p className="text-xs text-slate-500">
                Giảng viên: <strong>{selectedPendingCourse.creatorName || 'Giảng viên'}</strong>
              </p>
            </div>

            <form onSubmit={handleRejectMarketplace} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
                  <span>Lý do từ chối kiểm duyệt *</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Giảng viên sẽ nhận được lý do này để chỉnh sửa và hoàn thiện lại giáo trình trước khi gửi duyệt lại.
                </p>
                <textarea
                  required
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Bài học chương 2 thiếu video minh họa, hoặc định giá chưa phù hợp với thời lượng nội dung..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl text-xs sm:text-sm outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isRejecting || !rejectReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isRejecting ? 'Đang gửi...' : 'Xác nhận Từ chối'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
