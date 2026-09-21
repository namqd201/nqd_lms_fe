'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { discussionService } from '@/services/discussion.service';
import {
  DiscussionThreadResponse,
  DiscussionPostResponse,
  DiscussionThreadStatus,
  MentionCandidateResponse,
} from '@/types/discussion';
import { MentionTextarea } from './MentionTextarea';
import { MentionBadgeText } from './MentionBadgeText';
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Lock,
  Unlock,
  CheckCircle2,
  ThumbsUp,
  Trash2,
  X,
  MessageCircle,
  Clock,
  User,
  ShieldCheck,
  Award,
  ChevronRight,
  Filter,
  Loader2,
  CornerDownRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface CourseDiscussionTabProps {
  courseId: string;
  isEnrolled: boolean;
  isTeacherOrAdmin: boolean;
  chapters?: any[];
}

export const CourseDiscussionTab: React.FC<CourseDiscussionTabProps> = ({
  courseId,
  isEnrolled,
  isTeacherOrAdmin,
  chapters = [],
}) => {
  const { user } = useAuth();

  const [threads, setThreads] = useState<DiscussionThreadResponse[]>([]);
  const [totalThreads, setTotalThreads] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Status message / toast replacement
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Filters
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<DiscussionThreadStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Active Thread
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newLessonId, setNewLessonId] = useState<string>('');
  const [isSubmittingThread, setIsSubmittingThread] = useState<boolean>(false);

  // Thread detail view
  const [activeThread, setActiveThread] = useState<DiscussionThreadResponse | null>(null);
  const [posts, setPosts] = useState<DiscussionPostResponse[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  // Mentions
  const [candidates, setCandidates] = useState<MentionCandidateResponse[]>([]);
  const [createMentionedIds, setCreateMentionedIds] = useState<string[]>([]);
  const [replyMentionedIds, setReplyMentionedIds] = useState<string[]>([]);

  // Load mention candidates
  useEffect(() => {
    if (courseId) {
      discussionService.getMentionCandidates(courseId)
        .then(setCandidates)
        .catch(() => setCandidates([]));
    }
  }, [courseId]);

  // Flatten all lessons from chapters
  const allLessons = chapters.flatMap((ch) => ch.lessons || []);

  const loadThreads = async (pageNum = 0) => {
    setIsLoading(true);
    try {
      const res = await discussionService.getThreads(courseId, {
        lessonId: selectedLessonId || undefined,
        status: (selectedStatus as DiscussionThreadStatus) || undefined,
        search: searchQuery.trim() || undefined,
        page: pageNum,
        size: 10,
      });
      setThreads(res.items || []);
      setTotalThreads(res.totalElements || 0);
      setTotalPages(res.totalPages || 1);
      setPage(res.pageNumber || 0);
    } catch {
      // Error handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadThreads(0);
  }, [courseId, selectedLessonId, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadThreads(0);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showFeedback('Vui lòng nhập đầy đủ tiêu đề và nội dung', 'error');
      return;
    }

    setIsSubmittingThread(true);
    try {
      await discussionService.createThread(courseId, {
        lessonId: newLessonId || undefined,
        title: newTitle.trim(),
        content: newContent.trim(),
        mentionedUserIds: createMentionedIds,
      });
      showFeedback('Tạo chủ đề thảo luận thành công');
      setCreateModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewLessonId('');
      setCreateMentionedIds([]);
      loadThreads(0);
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi khi tạo chủ đề', 'error');
    } finally {
      setIsSubmittingThread(false);
    }
  };

  const openThreadDetail = async (thread: DiscussionThreadResponse) => {
    setActiveThread(thread);
    setIsLoadingPosts(true);
    try {
      const [detailRes, postsRes] = await Promise.all([
        discussionService.getThreadDetail(courseId, thread.id),
        discussionService.getPosts(courseId, thread.id, 0, 50),
      ]);
      setActiveThread(detailRes);
      setPosts(postsRes.items || []);
    } catch {
      showFeedback('Không thể tải chi tiết chủ đề', 'error');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyContent.trim()) return;

    setIsSubmittingReply(true);
    try {
      const res = await discussionService.createPost(courseId, activeThread.id, {
        content: replyContent.trim(),
        mentionedUserIds: replyMentionedIds,
      });
      showFeedback('Đã gửi phản hồi');
      setReplyContent('');
      setReplyMentionedIds([]);
      setPosts((prev) => [...prev, res]);
      setActiveThread((prev) => (prev ? { ...prev, postCount: prev.postCount + 1 } : null));
    } catch (err: any) {
      showFeedback(err.message || 'Không thể gửi phản hồi', 'error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleToggleUpvote = async (postId: string) => {
    if (!activeThread) return;
    try {
      const res = await discussionService.toggleUpvote(courseId, activeThread.id, postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? res : p)));
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi khi thao tác upvote', 'error');
    }
  };

  const handleMarkAnswer = async (postId: string) => {
    if (!activeThread) return;
    try {
      const res = await discussionService.markAnswer(courseId, activeThread.id, postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) return res;
          return p.isAnswer ? { ...p, isAnswer: false } : p;
        })
      );
      showFeedback('Đã cập nhật câu trả lời được chấp nhận');
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi thao tác', 'error');
    }
  };

  const handleTogglePin = async () => {
    if (!activeThread) return;
    try {
      const nextPin = !activeThread.isPinned;
      const res = await discussionService.pinThread(courseId, activeThread.id, nextPin);
      setActiveThread(res);
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThread.id ? { ...t, isPinned: nextPin } : t))
      );
      showFeedback(nextPin ? 'Đã ghim chủ đề' : 'Đã bỏ ghim');
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi thao tác ghim', 'error');
    }
  };

  const handleToggleLock = async () => {
    if (!activeThread) return;
    try {
      const nextLock = !activeThread.isLocked;
      const res = await discussionService.lockThread(courseId, activeThread.id, nextLock);
      setActiveThread(res);
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThread.id ? { ...t, isLocked: nextLock } : t))
      );
      showFeedback(nextLock ? 'Đã khóa chủ đề' : 'Đã mở khóa');
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi thao tác khóa', 'error');
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Bạn có chắc muốn xóa chủ đề thảo luận này không?')) return;
    try {
      await discussionService.deleteThread(courseId, threadId);
      showFeedback('Đã xóa chủ đề');
      if (activeThread?.id === threadId) {
        setActiveThread(null);
      }
      loadThreads(page);
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi xóa chủ đề', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!activeThread || !confirm('Bạn có chắc muốn xóa phản hồi này?')) return;
    try {
      await discussionService.deletePost(courseId, activeThread.id, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setActiveThread((prev) =>
        prev ? { ...prev, postCount: Math.max(0, prev.postCount - 1) } : null
      );
      showFeedback('Đã xóa phản hồi');
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi xóa phản hồi', 'error');
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
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#83C75D]" />
            <span>Hỏi đáp & Thảo luận ({totalThreads})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Giao lưu, đặt câu hỏi cho giảng viên và cùng trao đổi bài học với học viên khác
          </p>
        </div>

        {isEnrolled || isTeacherOrAdmin ? (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-md shadow-[#83C75D]/25 transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Đặt câu hỏi mới</span>
          </button>
        ) : (
          <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
            Đăng ký khóa học để tham gia thảo luận
          </div>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm câu hỏi theo tiêu đề hoặc nội dung..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#83C75D] focus:ring-2 focus:ring-[#83C75D]/20 transition-all"
          />
        </form>

        <div className="flex items-center gap-2">
          {/* Filter by lesson */}
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-[#83C75D]"
          >
            <option value="">Tất cả bài học</option>
            {allLessons.map((l: any) => (
              <option key={l.id} value={l.id}>
                Bài {l.displayOrder}: {l.title}
              </option>
            ))}
          </select>

          {/* Filter by status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as DiscussionThreadStatus | '')}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-[#83C75D]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="OPEN">Đang mở</option>
            <option value="RESOLVED">Đã giải quyết</option>
            <option value="CLOSED">Đã đóng</option>
          </select>
        </div>
      </div>

      {/* Main Content: Split view or List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Thread List */}
        <div className={activeThread ? 'lg:col-span-5 space-y-3' : 'lg:col-span-12 space-y-3'}>
          {isLoading ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
              <Loader2 className="w-8 h-8 text-[#83C75D] animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Đang tải danh sách thảo luận...</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-[#83C75D]/10 text-[#4e8231] flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Chưa có chủ đề thảo luận nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ thắc mắc về khóa học này nhé!
              </p>
              {isEnrolled && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2 bg-[#83C75D] text-white rounded-xl text-xs font-bold hover:bg-[#72b44e] transition-colors"
                >
                  Tạo thảo luận ngay
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => {
                const isActive = activeThread?.id === thread.id;
                const isTeacher = thread.authorRole === 'TEACHER' || thread.authorRole === 'ADMIN';

                return (
                  <div
                    key={thread.id}
                    onClick={() => openThreadDetail(thread)}
                    className={'p-5 bg-white border rounded-3xl shadow-xs transition-all cursor-pointer relative overflow-hidden ' + (
                      isActive
                        ? 'border-[#83C75D] ring-2 ring-[#83C75D]/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    )}
                  >
                    {thread.isPinned && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-3 py-0.5 rounded-bl-xl flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-white" />
                        <span>GHIM</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {thread.lessonTitle && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 truncate max-w-[200px]">
                            {thread.lessonTitle}
                          </span>
                        )}
                        {thread.status === 'RESOLVED' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã giải quyết</span>
                          </span>
                        ) : thread.isLocked ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Đã khóa</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                            Đang mở
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1 mb-1 group-hover:text-[#4e8231] transition-colors">
                      {thread.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {thread.content}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                          {thread.authorName ? thread.authorName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                          {thread.authorName || 'Người dùng'}
                        </span>
                        {isTeacher && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Giáo viên
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 font-medium">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{thread.postCount}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(thread.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    disabled={page === 0}
                    onClick={() => loadThreads(page - 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40"
                  >
                    Trang trước
                  </button>
                  <span className="text-xs text-slate-500">
                    Trang {page + 1} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => loadThreads(page + 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40"
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Thread Detail Pane (when a thread is selected) */}
        {activeThread && (
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 sticky top-24 self-start max-h-[85vh] overflow-y-auto">
            {/* Header & Controls */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {activeThread.isPinned && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Pin className="w-3 h-3" />
                        <span>ĐÃ GHIM</span>
                      </span>
                    )}
                    {activeThread.isLocked && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>ĐÃ KHÓA</span>
                      </span>
                    )}
                    {activeThread.lessonTitle && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#83C75D]/15 text-[#4e8231]">
                        {activeThread.lessonTitle}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-slate-900">{activeThread.title}</h2>
                </div>

                <button
                  onClick={() => setActiveThread(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Author & moderation actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {activeThread.authorName ? activeThread.authorName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{activeThread.authorName}</span>
                      {activeThread.authorRole === 'TEACHER' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Giáo viên
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{formatTime(activeThread.createdAt)}</span>
                  </div>
                </div>

                {/* Moderation Controls */}
                <div className="flex items-center gap-2">
                  {isTeacherOrAdmin && (
                    <>
                      <button
                        onClick={handleTogglePin}
                        title={activeThread.isPinned ? 'Bỏ ghim' : 'Ghim chủ đề'}
                        className={'p-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ' + (
                          activeThread.isPinned
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>{activeThread.isPinned ? 'Bỏ ghim' : 'Ghim'}</span>
                      </button>

                      <button
                        onClick={handleToggleLock}
                        title={activeThread.isLocked ? 'Mở khóa' : 'Khóa chủ đề'}
                        className={'p-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ' + (
                          activeThread.isLocked
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        {activeThread.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        <span>{activeThread.isLocked ? 'Mở khóa' : 'Khóa'}</span>
                      </button>
                    </>
                  )}

                  {(isTeacherOrAdmin || user?.id === activeThread.authorId) && (
                    <button
                      onClick={() => handleDeleteThread(activeThread.id)}
                      title="Xóa chủ đề"
                      className="p-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Main Question Body */}
              <div className="pt-2 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <MentionBadgeText content={activeThread.content} />
              </div>
            </div>

            {/* Replies section */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <CornerDownRight className="w-4 h-4 text-[#83C75D]" />
                <span>Phản hồi ({posts.length})</span>
              </h3>

              {isLoadingPosts ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-[#83C75D] animate-spin mx-auto" />
                </div>
              ) : posts.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                  Chưa có ai phản hồi cho câu hỏi này. Bạn hãy là người đầu tiên trả lời nhé!
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => {
                    const isTeacherReply = post.authorRole === 'TEACHER' || post.authorRole === 'ADMIN';

                    return (
                      <div
                        key={post.id}
                        className={'p-4 rounded-2xl border transition-all ' + (
                          post.isAnswer
                            ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white border-slate-200'
                        )}
                      >
                        {post.isAnswer && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white mb-2 shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ĐÁP ÁN ĐƯỢC CHẤP NHẬN</span>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="text-xs font-bold text-slate-800">{post.authorName}</span>
                            {isTeacherReply && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Giảng viên
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">• {formatTime(post.createdAt)}</span>
                          </div>

                          {/* Post actions */}
                          <div className="flex items-center gap-1">
                            {/* Mark accepted answer (Teacher or Thread author) */}
                            {(isTeacherOrAdmin || user?.id === activeThread.authorId) && (
                              <button
                                onClick={() => handleMarkAnswer(post.id)}
                                title={post.isAnswer ? 'Bỏ đánh dấu đáp án đúng' : 'Đánh dấu câu trả lời đúng'}
                                className={'px-2 py-1 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 ' + (
                                  post.isAnswer
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                )}
                              >
                                <Award className="w-3 h-3" />
                                <span>{post.isAnswer ? 'Đáp án đúng' : 'Chọn làm đáp án'}</span>
                              </button>
                            )}

                            {(isTeacherOrAdmin || user?.id === post.authorId) && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                title="Xóa phản hồi"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Reply content */}
                        <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mb-3">
                          <MentionBadgeText content={post.content} />
                        </div>

                        {/* Upvote Button */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleToggleUpvote(post.id)}
                            className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ' + (
                              post.isUpvotedByMe
                                ? 'bg-[#83C75D] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-[#83C75D]/15 hover:text-[#4e8231]'
                            )}
                          >
                            <ThumbsUp className={'w-3.5 h-3.5 ' + (post.isUpvotedByMe ? 'fill-white' : '')} />
                            <span>{post.upvoteCount || 0}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reply Form */}
              {activeThread.isLocked ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Chủ đề thảo luận này đã bị khóa phản hồi bởi giảng viên.</span>
                </div>
              ) : isEnrolled || isTeacherOrAdmin ? (
                <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                  <div className="relative">
                    <MentionTextarea
                      rows={3}
                      value={replyContent}
                      onChange={setReplyContent}
                      candidates={candidates}
                      onMentionedUsersChange={setReplyMentionedIds}
                      placeholder="Viết câu trả lời hoặc thảo luận của bạn... (Gõ @ để nhắc đến ai đó)"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#83C75D] focus:ring-2 focus:ring-[#83C75D]/20 transition-all resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingReply || !replyContent.trim()}
                      className="px-5 py-2.5 bg-[#83C75D] hover:bg-[#72b44e] text-white rounded-xl text-xs font-bold shadow-md shadow-[#83C75D]/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmittingReply ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang gửi...</span>
                        </>
                      ) : (
                        <span>Gửi phản hồi</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 text-center font-semibold">
                  Chỉ học viên đã tham gia khóa học mới có thể gửi phản hồi.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Discussion Thread Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#83C75D]/15 text-[#4e8231] flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Đặt câu hỏi thảo luận mới</h3>
                  <p className="text-xs text-slate-400">Giảng viên và các bạn học viên sẽ giải đáp câu hỏi của bạn</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bài học liên quan (tùy chọn)
                </label>
                <select
                  value={newLessonId}
                  onChange={(e) => setNewLessonId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#83C75D]"
                >
                  <option value="">Thắc mắc chung toàn khóa học</option>
                  {allLessons.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      Bài {l.displayOrder}: {l.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tiêu đề câu hỏi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Em chưa hiểu cách tính diện tích ở bài 3..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#83C75D] focus:ring-2 focus:ring-[#83C75D]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nội dung chi tiết <span className="text-rose-500">*</span>
                </label>
                <MentionTextarea
                  required
                  rows={5}
                  value={newContent}
                  onChange={setNewContent}
                  candidates={candidates}
                  onMentionedUsersChange={setCreateMentionedIds}
                  placeholder="Mô tả cụ thể thắc mắc hoặc câu hỏi của bạn... (Gõ @ để tag tên người cần hỏi)"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#83C75D] focus:ring-2 focus:ring-[#83C75D]/20 resize-none"
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
                  disabled={isSubmittingThread}
                  className="px-5 py-2.5 bg-[#83C75D] hover:bg-[#72b44e] text-white rounded-xl text-xs font-bold shadow-md shadow-[#83C75D]/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingThread ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang đăng...</span>
                    </>
                  ) : (
                    <span>Đăng câu hỏi</span>
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
