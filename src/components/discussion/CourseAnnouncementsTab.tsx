'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { announcementService } from '@/services/announcement.service';
import { CourseAnnouncementResponse } from '@/types/announcement';
import {
  Megaphone,
  Plus,
  Trash2,
  Clock,
  User,
  ShieldCheck,
  X,
  Loader2,
  BellRing,
} from 'lucide-react';

interface CourseAnnouncementsTabProps {
  courseId: string;
  isTeacherOrAdmin: boolean;
}

export const CourseAnnouncementsTab: React.FC<CourseAnnouncementsTabProps> = ({
  courseId,
  isTeacherOrAdmin,
}) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<CourseAnnouncementResponse[]>([]);
  const [totalAnnouncements, setTotalAnnouncements] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Modal create
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadAnnouncements = async (pageNum = 0) => {
    setIsLoading(true);
    try {
      const res = await announcementService.getAnnouncements(courseId, pageNum, 10);
      setAnnouncements(res.items || []);
      setTotalAnnouncements(res.totalElements || 0);
      setTotalPages(res.totalPages || 1);
      setPage(res.pageNumber || 0);
    } catch {
      // Error handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements(0);
  }, [courseId]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showFeedback('Vui lòng nhập đầy đủ tiêu đề và nội dung', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await announcementService.createAnnouncement(courseId, {
        title: title.trim(),
        content: content.trim(),
      });
      showFeedback('Đã đăng thông báo thành công và gửi thông báo tới học viên');
      setCreateModalOpen(false);
      setTitle('');
      setContent('');
      loadAnnouncements(0);
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi khi đăng thông báo', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa thông báo này không?')) return;
    try {
      await announcementService.deleteAnnouncement(courseId, id);
      showFeedback('Đã xóa thông báo');
      loadAnnouncements(page);
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi khi xóa thông báo', 'error');
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={'p-4 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ' + (
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          )}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <span>Bảng tin thông báo ({totalAnnouncements})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Các cập nhật quan trọng, lịch học và thông tin từ giáo viên phụ trách khóa học
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng thông báo mới</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Đang tải thông báo...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <BellRing className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Chưa có thông báo nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Khóa học hiện chưa có thông báo mới nào từ phía giảng viên.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-6 bg-white border border-slate-200 hover:border-amber-300 rounded-3xl shadow-xs transition-all relative overflow-hidden group"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{ann.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-semibold text-slate-700">{ann.authorName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Giáo viên
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(ann.postedAt)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {isTeacherOrAdmin && (
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    title="Xóa thông báo"
                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                {ann.content}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page === 0}
                onClick={() => loadAnnouncements(page - 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40"
              >
                Trang trước
              </button>
              <span className="text-xs text-slate-500">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => loadAnnouncements(page + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Announcement Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Đăng thông báo khóa học</h3>
                  <p className="text-xs text-slate-400">Tất cả học viên đã đăng ký sẽ nhận được thông báo</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tiêu đề thông báo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Lịch học trực tuyến tuần này hoặc Thông báo nghỉ lễ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nội dung thông báo <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập đầy đủ nội dung thông báo cho học viên..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang đăng...</span>
                    </>
                  ) : (
                    <span>Đăng ngay</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
