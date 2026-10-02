'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { classroomService } from '@/services/classroom.service';
import { ClassroomResponse, ClassroomStatus, AdminClassroomStats } from '@/types/classroom';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Presentation,
  Search,
  RefreshCw,
  Users,
  Radio,
  Archive,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  X,
  Sparkles,
  BookOpen,
  Calendar,
  Eye,
  ShieldCheck,
} from 'lucide-react';

export default function AdminClassroomsPage() {
  const [classrooms, setClassrooms] = useState<ClassroomResponse[]>([]);
  const [stats, setStats] = useState<AdminClassroomStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Classroom for Quick View / Action Modal
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [deleteConfirmClassroom, setDeleteConfirmClassroom] = useState<ClassroomResponse | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchClassrooms = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [classList, statsData] = await Promise.all([
        classroomService.getAdminClassrooms(
          searchQuery.trim() || undefined,
          statusFilter !== 'ALL' ? statusFilter : undefined
        ),
        classroomService.getAdminClassroomStats().catch(() => null),
      ]);
      setClassrooms(classList);
      if (statsData) {
        setStats(statsData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách lớp học quản trị';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClassrooms();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchClassrooms]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleStatusToggle = async (classroom: ClassroomResponse, newStatus: ClassroomStatus) => {
    try {
      const updated = await classroomService.updateAdminClassroomStatus(classroom.id, newStatus);
      setClassrooms((prev) => prev.map((c) => (c.id === classroom.id ? updated : c)));
      if (selectedClassroom?.id === classroom.id) {
        setSelectedClassroom(updated);
      }
      setSuccessMessage(`Đã cập nhật trạng thái lớp '${classroom.name}' thành ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 4000);
      // Refresh stats
      classroomService.getAdminClassroomStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái lớp học';
      setErrorMessage(msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmClassroom) return;
    setIsActionLoading(true);
    try {
      await classroomService.forceDeleteAdminClassroom(deleteConfirmClassroom.id);
      setClassrooms((prev) => prev.filter((c) => c.id !== deleteConfirmClassroom.id));
      if (selectedClassroom?.id === deleteConfirmClassroom.id) {
        setIsDetailModalOpen(false);
        setSelectedClassroom(null);
      }
      setSuccessMessage(`Đã xóa vĩnh viễn lớp học '${deleteConfirmClassroom.name}' thành công.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setDeleteConfirmClassroom(null);
      // Refresh stats
      classroomService.getAdminClassroomStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa lớp học';
      setErrorMessage(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              Admin Portal
            </span>
            <span className="text-xs text-slate-400 font-semibold">•</span>
            <span className="text-xs text-slate-500 font-medium">Đào tạo & Lớp học</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Presentation className="w-8 h-8 text-purple-600" />
            <span>Quản lý Lớp học Trực tuyến</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Giám sát tất cả lớp học, sĩ số học viên, giáo viên phụ trách, lịch học và trạng thái phòng học trên toàn hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchClassrooms()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tổng số lớp</span>
            <Presentation className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats ? stats.totalClassrooms : classrooms.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Tất cả lớp trên nền tảng</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Đang hoạt động</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats ? stats.activeClassrooms : classrooms.filter((c) => c.status === 'ACTIVE').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Lớp mở tiếp nhận học sinh</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Đã lưu trữ</span>
            <Archive className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {stats ? stats.archivedClassrooms : classrooms.filter((c) => c.status === 'ARCHIVED').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Lớp đã kết thúc khóa</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Học viên tham gia</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">
            {stats ? stats.totalStudents : classrooms.reduce((acc, c) => acc + (c.studentCount || 0), 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Tổng sĩ số học sinh ghi danh</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Phát trực tiếp</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600">
            {stats ? stats.totalLiveNow : classrooms.filter((c) => c.isLiveNow).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Phòng học đang phát trực tiếp</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên lớp, mã lớp, giáo viên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium shrink-0">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:border-purple-500 outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
            <option value="ARCHIVED">Đã lưu trữ (ARCHIVED)</option>
          </select>
        </div>
      </div>

      {/* Classrooms Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách lớp học quản trị...</p>
          </div>
        ) : classrooms.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Presentation className="w-12 h-12 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-700">Không tìm thấy lớp học nào</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.'
                  : 'Chưa có lớp học nào được tạo trên hệ thống.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Thông tin Lớp học</th>
                  <th className="py-4 px-6">Giáo viên phụ trách</th>
                  <th className="py-4 px-6">Khối lớp / Môn học</th>
                  <th className="py-4 px-6 text-center">Sĩ số</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6">Ngày tạo</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {classrooms.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Class Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-black text-sm">
                          {cls.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 hover:text-purple-700 transition-colors truncate max-w-xs block">
                              {cls.name}
                            </span>
                            {cls.isLiveNow && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                              <span>Mã: {cls.code}</span>
                              <button
                                onClick={(e) => handleCopyCode(cls.code, e)}
                                className="text-slate-400 hover:text-slate-700 transition-colors"
                                title="Sao chép mã lớp"
                              >
                                {copiedCode === cls.code ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Teacher */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          src={cls.teacherAvatarUrl}
                          name={cls.teacherName || cls.teacherEmail}
                          size="sm"
                          borderColor="border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {cls.teacherName || 'Chưa cập nhật tên'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{cls.teacherEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Grade & Subject */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className="inline-block font-semibold text-slate-800">
                          {cls.gradeLevel || 'Chung'}
                        </span>
                        {cls.subjectName && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-slate-400" />
                            <span>{cls.subjectName}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Student count */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        <Users className="w-3.5 h-3.5" />
                        <span>{cls.studentCount || 0}</span>
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                            cls.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {cls.status === 'ACTIVE' ? 'Hoạt động' : 'Đã lưu trữ'}
                        </span>
                        <select
                          value={cls.status}
                          onChange={(e) => handleStatusToggle(cls, e.target.value as ClassroomStatus)}
                          className="text-[11px] text-slate-500 bg-transparent hover:bg-slate-100 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-200 cursor-pointer outline-none"
                          title="Thay đổi trạng thái lớp"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-6 text-slate-500 text-[11px]">
                      {cls.createdAt ? new Date(cls.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Open Classroom View */}
                        <Link
                          href={`/classrooms/${cls.id}`}
                          target="_blank"
                          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                          title="Xem giao diện lớp học trực tuyến"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Quick View Details Modal */}
                        <button
                          onClick={() => {
                            setSelectedClassroom(cls);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Xem thông tin chi tiết lớp học"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Force Delete Classroom */}
                        <button
                          onClick={() => setDeleteConfirmClassroom(cls)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Xóa vĩnh viễn lớp học"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CHI TIẾT LỚP HỌC (ADMIN DETAIL MODAL)                             */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
                  {selectedClassroom.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {selectedClassroom.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Mã lớp: <span className="font-bold text-slate-800">{selectedClassroom.code}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Giáo viên phụ trách:</span>
                  <span className="font-bold text-slate-800">{selectedClassroom.teacherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email giáo viên:</span>
                  <span className="font-mono text-slate-700">{selectedClassroom.teacherEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khối lớp:</span>
                  <span className="font-semibold text-slate-800">{selectedClassroom.gradeLevel || 'Chung'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Môn học:</span>
                  <span className="font-semibold text-slate-800">{selectedClassroom.subjectName || 'Chưa gán môn'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sĩ số thành viên:</span>
                  <span className="font-bold text-blue-600">{selectedClassroom.studentCount || 0} học sinh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trực tiếp (Live):</span>
                  <span className="font-bold text-slate-800">
                    {selectedClassroom.isLiveNow ? (
                      <span className="text-rose-600 font-black">● Đang trực tuyến</span>
                    ) : (
                      'Không phát trực tiếp'
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày tạo:</span>
                  <span className="font-medium text-slate-700">
                    {new Date(selectedClassroom.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              {selectedClassroom.description && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Mô tả lớp học:</span>
                  <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 leading-relaxed">
                    {selectedClassroom.description}
                  </p>
                </div>
              )}

              {/* Status Selector */}
              <div>
                <span className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">
                  Cập nhật trạng thái lớp:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusToggle(selectedClassroom, 'ACTIVE')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedClassroom.status === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    ACTIVE (Hoạt động)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusToggle(selectedClassroom, 'ARCHIVED')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedClassroom.status === 'ARCHIVED'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    ARCHIVED (Lưu trữ)
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <Link
                href={`/classrooms/${selectedClassroom.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Vào phòng học</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: XÁC NHẬN XÓA LỚP HỌC (FORCE DELETE BY ADMIN)                     */}
      {/* ========================================================================= */}
      {deleteConfirmClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Xác nhận xóa lớp học</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn lớp học{' '}
              <strong className="text-slate-900 font-bold">"{deleteConfirmClassroom.name}"</strong> (Mã:{' '}
              <span className="font-mono font-bold text-rose-700">{deleteConfirmClassroom.code}</span>)?
              Tất cả tài liệu, bài tập, liên kết học sinh và video ghi hình liên quan sẽ bị xóa khỏi hệ thống.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmClassroom(null)}
                disabled={isActionLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isActionLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isActionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Xác nhận xóa vĩnh viễn</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
