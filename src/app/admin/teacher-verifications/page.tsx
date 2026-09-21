'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { teacherApplicationService } from '@/services/teacher-application.service';
import {
  TeacherApplicantType,
  TeacherApplicationResponse,
  TeacherApplicationStatus,
} from '@/types/teacher-application';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
  UserCheck,
  Building,
  Video,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCw,
} from 'lucide-react';

export default function AdminTeacherVerificationsPage() {
  const { user } = useAuth();

  const [applications, setApplications] = useState<TeacherApplicationResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TeacherApplicationStatus | ''>('PENDING');
  const [typeFilter, setTypeFilter] = useState<TeacherApplicantType | ''>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Selected Application for Review
  const [selectedApp, setSelectedApp] = useState<TeacherApplicationResponse | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Actions State
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Lightbox Zoom Image
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const getFullFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await teacherApplicationService.getApplications({
        status: statusFilter || undefined,
        applicantType: typeFilter || undefined,
        keyword: searchKeyword.trim() || undefined,
        page: currentPage,
        size: 15,
      });
      setApplications(res.content || []);
      setTotalElements(res.totalElements || 0);
      setTotalPages(res.totalPages || 0);

      const count = await teacherApplicationService.getPendingCount();
      setPendingCount(count);
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      const msg = err.message || '';
      if (msg.includes('403') || msg.includes('Forbidden')) {
        setErrorMessage('Tài khoản hiện tại không có quyền Quản trị viên (Admin). Vui lòng đăng nhập tài khoản có quyền Admin để xét duyệt hồ sơ.');
      } else if (msg.includes('401') || msg.includes('Unauthorized')) {
        setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem hồ sơ.');
      } else {
        setErrorMessage(msg || 'Lỗi khi tải danh sách hồ sơ xét duyệt. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, searchKeyword, currentPage]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleOpenReview = (app: TeacherApplicationResponse) => {
    setSelectedApp(app);
    setReviewModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    if (!confirm(`Bạn có chắc chắn muốn phê duyệt hồ sơ giảng dạy của "${selectedApp.fullName}"? Tài khoản này sẽ được cấp quyền ROLE_TEACHER.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const updated = await teacherApplicationService.approveApplication(selectedApp.id);
      setSelectedApp(updated);
      setReviewModalOpen(false);
      await loadApplications();
      alert('Phê duyệt hồ sơ thành công! Người dùng đã được cấp quyền Giáo viên.');
    } catch (err: any) {
      alert(err.message || 'Phê duyệt thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối để thông báo cho ứng viên');
      return;
    }

    setIsProcessing(true);
    try {
      const updated = await teacherApplicationService.rejectApplication(selectedApp.id, rejectReason.trim());
      setSelectedApp(updated);
      setRejectModalOpen(false);
      setReviewModalOpen(false);
      setRejectReason('');
      await loadApplications();
      alert('Đã từ chối hồ sơ và gửi lý do phản hồi cho ứng viên.');
    } catch (err: any) {
      alert(err.message || 'Từ chối thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-600">
              <UserCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Xét duyệt Hồ sơ Giáo viên & Gia sư
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thẩm định thông tin, bằng cấp, thẻ sinh viên và cấp quyền giảng dạy cho các đối tác.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>{pendingCount} hồ sơ đang chờ duyệt</span>
          </div>
        )}
      </div>

      {/* Non-admin Warning Banner */}
      {user && !user.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN') && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-800">
              Cảnh báo phân quyền: Bạn đang đăng nhập bằng tài khoản không có quyền Quản trị viên (Admin)
            </p>
            <p className="text-amber-700">
              Tài khoản hiện tại ({user.email}) có vai trò: <strong>{user.roles?.join(', ')}</strong>. Bạn cần đăng nhập bằng tài khoản Quản trị viên (Admin) để có thể xem và xét duyệt các hồ sơ giáo viên.
            </p>
          </div>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium text-rose-800">{errorMessage}</span>
          </div>
          <button
            onClick={() => loadApplications()}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setStatusFilter('PENDING');
            setCurrentPage(0);
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Chờ xét duyệt</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-amber-700 font-black">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setStatusFilter('APPROVED');
            setCurrentPage(0);
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'APPROVED'
              ? 'bg-[#83C75D] text-white shadow-sm shadow-[#83C75D]/25'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã phê duyệt</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('REJECTED');
            setCurrentPage(0);
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Đã từ chối</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('');
            setCurrentPage(0);
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === ''
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả hồ sơ
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Tìm theo tên, email, trường học..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#83C75D] font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setCurrentPage(0);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-[#83C75D] cursor-pointer"
          >
            <option value="">Tất cả đối tượng</option>
            <option value="STUDENT_TUTOR">🧑‍🎓 Sinh viên làm thêm / Gia sư</option>
            <option value="CERTIFIED_TEACHER">🎓 Giáo viên có bằng cấp</option>
            <option value="INDUSTRY_EXPERT">💼 Chuyên gia kỹ năng thực tế</option>
          </select>

          <button
            onClick={() => loadApplications()}
            title="Làm mới danh sách"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#83C75D]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#83C75D] animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách hồ sơ...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Không có hồ sơ nào</p>
            <p className="text-xs text-slate-400">
              {statusFilter === 'PENDING'
                ? 'Hiện tại không có hồ sơ nào đang chờ duyệt.'
                : 'Chưa có dữ liệu phù hợp với bộ lọc hiện tại.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Ứng viên</th>
                  <th className="py-3 px-4">Đối tượng</th>
                  <th className="py-3 px-4">Trường / Đơn vị</th>
                  <th className="py-3 px-4">Môn phụ trách</th>
                  <th className="py-3 px-4">Giấy tờ</th>
                  <th className="py-3 px-4">Ngày gửi</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{app.fullName}</p>
                        <p className="text-[11px] text-slate-400">{app.email}</p>
                        <p className="text-[10px] text-slate-400">{app.phoneNumber}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {app.applicantType === 'STUDENT_TUTOR' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          🧑‍🎓 Sinh viên gia sư
                        </span>
                      ) : app.applicantType === 'CERTIFIED_TEACHER' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          🎓 Giáo viên có bằng
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          💼 Chuyên gia kỹ năng
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {app.institutionName}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {app.majorOrSubject}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                        {app.documentUrls ? app.documentUrls.length : 0} ảnh
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4">
                      {app.status === 'PENDING' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          <span>Chờ duyệt</span>
                        </span>
                      ) : app.status === 'APPROVED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã duyệt</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" />
                          <span>Từ chối</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenReview(app)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-[#83C75D] font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Xem xét hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Tổng số <strong>{totalElements}</strong> hồ sơ
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-semibold text-slate-700">
                Trang {currentPage + 1} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                  Chi tiết hồ sơ xét duyệt giáo viên
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {selectedApp.fullName}
                </h3>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 block">Email:</span>
                <span className="font-bold text-slate-800">{selectedApp.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Số điện thoại:</span>
                <span className="font-bold text-slate-800">{selectedApp.phoneNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Hình thức:</span>
                <span className="font-bold text-slate-800">
                  {selectedApp.applicantType === 'STUDENT_TUTOR'
                    ? '🧑‍🎓 Sinh viên làm thêm / Gia sư'
                    : selectedApp.applicantType === 'CERTIFIED_TEACHER'
                    ? '🎓 Giáo viên có bằng cấp'
                    : '💼 Chuyên gia thực tế'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Trường / Đơn vị:</span>
                <span className="font-bold text-slate-800">{selectedApp.institutionName}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Môn giảng dạy thế mạnh:</span>
                <span className="font-bold text-slate-800">{selectedApp.majorOrSubject}</span>
              </div>
              {selectedApp.bio && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Giới thiệu & Kinh nghiệm:</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{selectedApp.bio}</p>
                </div>
              )}
              {selectedApp.sampleVideoUrl && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Video bài giảng mẫu:</span>
                  <a
                    href={selectedApp.sampleVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#4e8231] font-bold inline-flex items-center gap-1 hover:underline mt-0.5"
                  >
                    <span>{selectedApp.sampleVideoUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Document Images (Credentials, Degrees, Student ID) */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Ảnh Giấy tờ & Bằng chứng xác minh ({selectedApp.documentUrls?.length || 0})</span>
                <span className="text-[10px] text-slate-400 font-normal">Click vào ảnh để phóng to</span>
              </h4>

              {(!selectedApp.documentUrls || selectedApp.documentUrls.length === 0) ? (
                <p className="text-xs text-slate-400 italic">Ứng viên chưa tải lên ảnh giấy tờ nào.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedApp.documentUrls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setZoomImageUrl(getFullFileUrl(url))}
                      className="h-28 rounded-2xl border border-slate-200 overflow-hidden relative group cursor-pointer bg-slate-100 hover:ring-2 hover:ring-[#83C75D]"
                    >
                      <img
                        src={getFullFileUrl(url)}
                        alt="Doc"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-6 h-6" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CCCD Identity Cards */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Ảnh Căn cước công dân đối soát</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedApp.idCardFrontUrl ? (
                  <div
                    onClick={() => setZoomImageUrl(getFullFileUrl(selectedApp.idCardFrontUrl!))}
                    className="h-28 rounded-2xl border border-slate-200 overflow-hidden relative group cursor-pointer bg-slate-100"
                  >
                    <img
                      src={getFullFileUrl(selectedApp.idCardFrontUrl)}
                      alt="CCCD Front"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                      Mặt trước
                    </span>
                  </div>
                ) : (
                  <div className="h-28 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                    Chưa có mặt trước
                  </div>
                )}

                {selectedApp.idCardBackUrl ? (
                  <div
                    onClick={() => setZoomImageUrl(getFullFileUrl(selectedApp.idCardBackUrl!))}
                    className="h-28 rounded-2xl border border-slate-200 overflow-hidden relative group cursor-pointer bg-slate-100"
                  >
                    <img
                      src={getFullFileUrl(selectedApp.idCardBackUrl)}
                      alt="CCCD Back"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                      Mặt sau
                    </span>
                  </div>
                ) : (
                  <div className="h-28 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                    Chưa có mặt sau
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Info if already rejected */}
            {selectedApp.status === 'REJECTED' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-rose-800">Lý do đã từ chối:</span>
                <p className="text-rose-700">{selectedApp.rejectReason}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Trạng thái: <strong>{selectedApp.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                {selectedApp.status !== 'REJECTED' && (
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Từ chối hồ sơ
                  </button>
                )}

                {selectedApp.status !== 'APPROVED' && (
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-md shadow-[#83C75D]/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Phê duyệt ngay</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Prompt Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Nhập lý do từ chối hồ sơ</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lý do này sẽ được gửi trực tiếp đến ứng viên để họ biết thông tin còn thiếu và tải lên lại:
            </p>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Ảnh thẻ sinh viên bị nhòe không thấy rõ mã số SV. Vui lòng chụp lại ảnh rõ nét..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 font-medium resize-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Đang gửi...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-70 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[92vh] p-2">
            <img
              src={zoomImageUrl}
              alt="Zoomed"
              className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/40 text-white text-xs font-bold backdrop-blur-md cursor-pointer"
            >
              Đóng (ESC)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
