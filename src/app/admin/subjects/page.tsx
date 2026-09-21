'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import { SubjectRequest, SubjectResponse, SubjectStatus } from '@/types/admin';
import {
  BookMarked,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Power,
  Undo2,
} from 'lucide-react';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formStatus, setFormStatus] = useState<SubjectStatus>('ACTIVE');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Trash / Deletion History state
  const [trashModalOpen, setTrashModalOpen] = useState<boolean>(false);
  const [deletedSubjects, setDeletedSubjects] = useState<SubjectResponse[]>([]);
  const [loadingTrash, setLoadingTrash] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSubjects();
      setSubjects(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTrash = async () => {
    setTrashModalOpen(true);
    setLoadingTrash(true);
    try {
      const data = await adminService.getDeletedSubjects();
      setDeletedSubjects(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải lịch sử môn học đã xóa');
    } finally {
      setLoadingTrash(false);
    }
  };

  const handleRestoreSubject = async (subId: string) => {
    setRestoringId(subId);
    try {
      await adminService.restoreSubject(subId);
      setSuccessMessage('Khôi phục môn học thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      setDeletedSubjects((prev) => prev.filter((s) => s.id !== subId));
      await loadSubjects();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Khôi phục môn học thất bại');
    } finally {
      setRestoringId(null);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormStatus('ACTIVE');
    setModalOpen(true);
  };

  const openEditModal = (s: SubjectResponse) => {
    setIsEditing(true);
    setEditingId(s.id);
    setFormName(s.name);
    setFormCode(s.code);
    setFormDescription(s.description || '');
    setFormStatus(s.status);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setErrorMessage('Tên và mã môn học không được để trống');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const payload: SubjectRequest = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || undefined,
        status: formStatus,
      };

      if (isEditing && editingId) {
        await adminService.updateSubject(editingId, payload);
        setSuccessMessage(`Đã cập nhật môn học ${formName} thành công!`);
      } else {
        await adminService.createSubject(payload);
        setSuccessMessage(`Đã tạo môn học mới ${formName} thành công!`);
      }

      setTimeout(() => setSuccessMessage(null), 4000);
      setModalOpen(false);
      loadSubjects();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác thất bại';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (s: SubjectResponse) => {
    const nextStatus: SubjectStatus = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminService.updateSubjectStatus(s.id, nextStatus);
      setSuccessMessage(`Đã chuyển môn học "${s.name}" sang trạng thái ${nextStatus}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadSubjects();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại';
      setErrorMessage(msg);
    }
  };

  const handleDelete = async (s: SubjectResponse) => {
    if (!confirm(`Bạn có chắc muốn xóa môn học "${s.name}" (${s.code})?`)) return;
    try {
      await adminService.deleteSubject(s.id);
      setSuccessMessage(`Đã xóa môn học "${s.name}" thành công!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadSubjects();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa môn học thất bại';
      setErrorMessage(msg);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Toast feedback */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold shadow-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
              Admin Module
            </span>
            <span className="text-xs text-slate-400 font-semibold">•</span>
            <span className="text-xs text-slate-500 font-medium">Academic Subjects Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản lý Môn học (Subjects)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thiết lập danh mục các môn học cơ sở trong hệ thống LMS (Toán, Tin học, Tiếng Anh,...).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleOpenTrash}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Xem các môn học đã xóa & Khôi phục"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Lịch sử xóa</span>
          </button>
          <button
            onClick={loadSubjects}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Môn học mới</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc mã môn học..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl text-xs sm:text-sm outline-none transition-all"
          />
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Đang tải danh sách môn học...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-3">
              <BookMarked className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Chưa có môn học nào</h4>
            <p className="text-xs text-slate-500 mb-4">Bấm nút bên dưới để tạo môn học đầu tiên cho hệ thống.</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Môn học mới</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Mã & Tên môn học</th>
                  <th className="py-3.5 px-6">Mô tả</th>
                  <th className="py-3.5 px-6">Số khóa học</th>
                  <th className="py-3.5 px-6">Trạng thái</th>
                  <th className="py-3.5 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSubjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs shrink-0">
                          <BookMarked className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                          <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            {s.code}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 max-w-xs truncate">
                      {s.description || 'Chưa có mô tả'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        <Layers className="w-3 h-3" />
                        <span>{s.courseCount} khóa học</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{s.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ẩn'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(s)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            s.status === 'ACTIVE'
                              ? 'border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={s.status === 'ACTIVE' ? 'Tạm ẩn môn học' : 'Kích hoạt môn học'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Chỉnh sửa môn học"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa môn học"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal: Create / Edit Subject */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Chỉnh sửa Môn học' : 'Tạo Môn học Mới'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên Môn học *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Tin học Lập trình"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mã Môn học *
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Ví dụ: CS101"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt môn học..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Trạng thái
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as SubjectStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:bg-white"
                >
                  <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                  <option value="INACTIVE">Tạm ẩn (INACTIVE)</option>
                </select>
              </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo môn học'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Trash / Deletion History Modal */}
        {trashModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>Lịch sử xóa môn học / Thùng rác</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                        {deletedSubjects.length} môn học
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Các môn học đã bị xóa mềm. Bạn có thể khôi phục lại bất kỳ lúc nào.
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
                    <p className="text-sm font-semibold">Đang tải danh sách môn học đã xóa...</p>
                  </div>
                ) : deletedSubjects.length === 0 ? (
                  <div className="py-16 text-center text-slate-500">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-2xl">
                      🗑️
                    </div>
                    <h3 className="font-bold text-slate-700 text-base">Thùng rác trống</h3>
                    <p className="text-xs text-slate-400 mt-1">Không có môn học nào bị xóa trong hệ thống.</p>
                  </div>
                ) : (
                  deletedSubjects.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-rose-200 transition-all shadow-2xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                            {s.code}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {s.name}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRestoreSubject(s.id)}
                          disabled={restoringId === s.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                        >
                          <Undo2 className={`w-3.5 h-3.5 ${restoringId === s.id ? 'animate-spin' : ''}`} />
                          <span>{restoringId === s.id ? 'Đang khôi phục...' : 'Khôi phục'}</span>
                        </button>
                      </div>

                      {s.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {s.description}
                        </p>
                      )}

                      {/* Deletion details */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>
                          Xóa bởi: <strong className="text-slate-600 font-semibold">{s.deletedBy || 'Quản trị viên'}</strong>
                        </span>
                        <span>
                          Thời gian: {s.deletedAt ? new Date(s.deletedAt).toLocaleString('vi-VN') : 'Gần đây'}
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
  );
}
