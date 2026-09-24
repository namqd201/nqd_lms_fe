'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { discussionService } from '@/services/discussion.service';
import {
  DiscussionThreadResponse,
  DiscussionPostResponse,
  DiscussionThreadStatus,
  ReactionType,
  MentionCandidateResponse,
} from '@/types/discussion';
import { FacebookReactionButton, ReactionSummaryBadge } from './FacebookReactions';
import { MentionTextarea } from './MentionTextarea';
import { MentionBadgeText } from './MentionBadgeText';
import { UserAvatar } from '../UserAvatar';
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
  Loader2,
  CornerDownRight,
  Reply,
  ChevronDown,
  ChevronUp,
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

  // Thread list state
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

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newLessonId, setNewLessonId] = useState<string>('');
  const [isSubmittingThread, setIsSubmittingThread] = useState<boolean>(false);
  const [createMentionedIds, setCreateMentionedIds] = useState<string[]>([]);

  // Inline expansion and replies state per thread
  const [expandedThreadIds, setExpandedThreadIds] = useState<Record<string, boolean>>({});
  const [postsByThread, setPostsByThread] = useState<Record<string, DiscussionPostResponse[]>>({});
  const [loadingPostsByThread, setLoadingPostsByThread] = useState<Record<string, boolean>>({});

  // Reply inputs state per thread
  const [replyContentByThread, setReplyContentByThread] = useState<Record<string, string>>({});
  const [replyMentionedIdsByThread, setReplyMentionedIdsByThread] = useState<Record<string, string[]>>({});
  const [replyingToByThread, setReplyingToByThread] = useState<
    Record<string, { id: string; name: string; parentPostId?: string } | null>
  >({});
  const [submittingReplyByThread, setSubmittingReplyByThread] = useState<Record<string, boolean>>({});

  // Refs for reply inputs per thread
  const replyInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Mention candidates
  const [candidates, setCandidates] = useState<MentionCandidateResponse[]>([]);

  // Load mention candidates
  useEffect(() => {
    if (courseId) {
      discussionService
        .getMentionCandidates(courseId)
        .then(setCandidates)
        .catch(() => setCandidates([]));
    }
  }, [courseId]);

  // Flatten all lessons from chapters
  const allLessons = useMemo(() => chapters.flatMap((ch) => ch.lessons || []), [chapters]);

  // Fetch threads
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

  // Toggle inline replies for a specific thread
  const toggleThreadReplies = async (threadId: string, forceExpand = false) => {
    const isCurrentlyExpanded = !!expandedThreadIds[threadId];
    if (isCurrentlyExpanded && !forceExpand) {
      setExpandedThreadIds((prev) => ({ ...prev, [threadId]: false }));
      return;
    }

    setExpandedThreadIds((prev) => ({ ...prev, [threadId]: true }));

    // Fetch posts if not already loaded or force refresh
    if (!postsByThread[threadId]) {
      setLoadingPostsByThread((prev) => ({ ...prev, [threadId]: true }));
      try {
        const postsRes = await discussionService.getPosts(courseId, threadId, 0, 50);
        setPostsByThread((prev) => ({
          ...prev,
          [threadId]: postsRes.items || [],
        }));
      } catch {
        showFeedback('Không thể tải phản hồi thảo luận', 'error');
      } finally {
        setLoadingPostsByThread((prev) => ({ ...prev, [threadId]: false }));
      }
    }
  };

  // Reply to thread directly (from question card footer)
  const handleReplyToThread = (thread: DiscussionThreadResponse) => {
    toggleThreadReplies(thread.id, true);
    setTimeout(() => {
      const input = replyInputRefs.current[thread.id];
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 150);
  };

  // Reply to a specific user inside the replies list
  const handleReplyToUser = (
    threadId: string,
    authorId: string,
    authorName: string,
    parentPostId?: string
  ) => {
    setReplyingToByThread((prev) => ({
      ...prev,
      [threadId]: { id: authorId, name: authorName, parentPostId },
    }));

    const mentionTag = `@${authorName} `;
    setReplyContentByThread((prev) => {
      const current = prev[threadId] || '';
      const updated = current.includes(`@${authorName}`) ? current : `${mentionTag}${current}`;
      return { ...prev, [threadId]: updated };
    });

    setReplyMentionedIdsByThread((prev) => {
      const current = prev[threadId] || [];
      const updated = Array.from(new Set([...current, authorId]));
      return { ...prev, [threadId]: updated };
    });

    setTimeout(() => {
      const input = replyInputRefs.current[threadId];
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const handleCancelReplyingTo = (threadId: string) => {
    const replyingTo = replyingToByThread[threadId];
    if (replyingTo) {
      setReplyContentByThread((prev) => {
        const current = prev[threadId] || '';
        const updated = current.replace(`@${replyingTo.name} `, '').replace(`@${replyingTo.name}`, '');
        return { ...prev, [threadId]: updated };
      });
      setReplyMentionedIdsByThread((prev) => {
        const current = prev[threadId] || [];
        const updated = current.filter((id) => id !== replyingTo.id);
        return { ...prev, [threadId]: updated };
      });
    }
    setReplyingToByThread((prev) => ({ ...prev, [threadId]: null }));
  };

  // Submit reply
  const handleSendReply = async (e: React.FormEvent, threadId: string) => {
    e.preventDefault();
    const content = replyContentByThread[threadId]?.trim() || '';
    if (!content) return;

    setSubmittingReplyByThread((prev) => ({ ...prev, [threadId]: true }));
    try {
      const replyingTo = replyingToByThread[threadId];
      const mentionedIds = replyMentionedIdsByThread[threadId] || [];
      const finalMentionedIds = Array.from(
        new Set([
          ...mentionedIds,
          ...(replyingTo && content.includes(`@${replyingTo.name}`) ? [replyingTo.id] : []),
        ])
      );

      const res = await discussionService.createPost(courseId, threadId, {
        content,
        parentId: replyingTo?.parentPostId || undefined,
        mentionedUserIds: finalMentionedIds,
      });

      showFeedback('Đã gửi phản hồi thành công');
      setReplyContentByThread((prev) => ({ ...prev, [threadId]: '' }));
      setReplyMentionedIdsByThread((prev) => ({ ...prev, [threadId]: [] }));
      setReplyingToByThread((prev) => ({ ...prev, [threadId]: null }));

      setPostsByThread((prev) => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), res],
      }));

      // Update thread postCount in list
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, postCount: t.postCount + 1 } : t))
      );
    } catch (err: any) {
      showFeedback(err.message || 'Không thể gửi phản hồi', 'error');
    } finally {
      setSubmittingReplyByThread((prev) => ({ ...prev, [threadId]: false }));
    }
  };

  // Facebook Reactions for Thread
  const handleReactToThread = async (threadId: string, type: ReactionType) => {
    if (!user) {
      showFeedback('Vui lòng đăng nhập để thả cảm xúc', 'error');
      return;
    }

    setThreads((prevThreads) =>
      prevThreads.map((t) => {
        if (t.id !== threadId) return t;

        const isUnreact = t.myReaction === type;
        const newReaction = isUnreact ? null : type;
        const currentCount = t.reactionCount || 0;
        const newCount = isUnreact ? Math.max(0, currentCount - 1) : (!t.myReaction ? currentCount + 1 : currentCount);

        const newBreakdown = { ...(t.reactionBreakdown || {}) };
        if (t.myReaction && newBreakdown[t.myReaction]) {
          newBreakdown[t.myReaction] = Math.max(0, newBreakdown[t.myReaction] - 1);
        }
        if (!isUnreact) {
          newBreakdown[type] = (newBreakdown[type] || 0) + 1;
        }

        return {
          ...t,
          myReaction: newReaction,
          reactionCount: newCount,
          reactionBreakdown: newBreakdown,
        };
      })
    );

    try {
      const updated = await discussionService.reactToThread(courseId, threadId, type);
      setThreads((prevThreads) =>
        prevThreads.map((t) => (t.id === threadId ? { ...t, ...updated } : t))
      );
    } catch (err: any) {
      showFeedback(err?.message || 'Không thể thả cảm xúc', 'error');
    }
  };

  // Facebook Reactions for Post / Comment
  const handleReactToPost = async (threadId: string, postId: string, type: ReactionType) => {
    if (!user) {
      showFeedback('Vui lòng đăng nhập để thả cảm xúc', 'error');
      return;
    }

    setPostsByThread((prev) => {
      const threadPosts = prev[threadId] || [];
      const updated = threadPosts.map((p) => {
        if (p.id !== postId) return p;

        const isUnreact = p.myReaction === type;
        const newReaction = isUnreact ? null : type;
        const currentCount = p.reactionCount !== undefined ? p.reactionCount : (p.upvoteCount || 0);
        const newCount = isUnreact ? Math.max(0, currentCount - 1) : (!p.myReaction ? currentCount + 1 : currentCount);

        const newBreakdown = { ...(p.reactionBreakdown || {}) };
        if (p.myReaction && newBreakdown[p.myReaction]) {
          newBreakdown[p.myReaction] = Math.max(0, newBreakdown[p.myReaction] - 1);
        }
        if (!isUnreact) {
          newBreakdown[type] = (newBreakdown[type] || 0) + 1;
        }

        return {
          ...p,
          myReaction: newReaction,
          reactionCount: newCount,
          upvoteCount: newCount,
          isUpvotedByMe: !isUnreact,
          reactionBreakdown: newBreakdown,
        };
      });

      return { ...prev, [threadId]: updated };
    });

    try {
      const updated = await discussionService.reactToPost(courseId, threadId, postId, type);
      setPostsByThread((prev) => {
        const threadPosts = prev[threadId] || [];
        return {
          ...prev,
          [threadId]: threadPosts.map((p) => (p.id === postId ? { ...p, ...updated } : p)),
        };
      });
    } catch (err: any) {
      showFeedback(err?.message || 'Không thể thả cảm xúc', 'error');
    }
  };

  // Upvote post
  const handleToggleUpvote = async (threadId: string, postId: string) => {
    try {
      const res = await discussionService.toggleUpvote(courseId, threadId, postId);
      setPostsByThread((prev) => ({
        ...prev,
        [threadId]: (prev[threadId] || []).map((p) => (p.id === postId ? res : p)),
      }));
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi khi thao tác upvote', 'error');
    }
  };

  // Mark accepted answer
  const handleMarkAnswer = async (threadId: string, postId: string) => {
    try {
      const res = await discussionService.markAnswer(courseId, threadId, postId);
      setPostsByThread((prev) => ({
        ...prev,
        [threadId]: (prev[threadId] || []).map((p) => {
          if (p.id === postId) return res;
          return p.isAnswer ? { ...p, isAnswer: false } : p;
        }),
      }));
      showFeedback('Đã cập nhật câu trả lời được chấp nhận');
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi thao tác', 'error');
    }
  };

  // Delete post
  const handleDeletePost = async (threadId: string, postId: string) => {
    if (!confirm('Bạn có chắc muốn xóa phản hồi này?')) return;
    try {
      await discussionService.deletePost(courseId, threadId, postId);
      setPostsByThread((prev) => ({
        ...prev,
        [threadId]: (prev[threadId] || []).filter((p) => p.id !== postId),
      }));
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, postCount: Math.max(0, t.postCount - 1) } : t))
      );
      showFeedback('Đã xóa phản hồi');
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi xóa phản hồi', 'error');
    }
  };

  // Toggle pin
  const handleTogglePin = async (thread: DiscussionThreadResponse) => {
    try {
      const nextPin = !thread.isPinned;
      const res = await discussionService.pinThread(courseId, thread.id, nextPin);
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, isPinned: nextPin } : t))
      );
      showFeedback(nextPin ? 'Đã ghim chủ đề' : 'Đã bỏ ghim');
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi thao tác ghim', 'error');
    }
  };

  // Toggle lock
  const handleToggleLock = async (thread: DiscussionThreadResponse) => {
    try {
      const nextLock = !thread.isLocked;
      const res = await discussionService.lockThread(courseId, thread.id, nextLock);
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, isLocked: nextLock } : t))
      );
      showFeedback(nextLock ? 'Đã khóa chủ đề' : 'Đã mở khóa');
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi thao tác khóa', 'error');
    }
  };

  // Delete thread
  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Bạn có chắc muốn xóa chủ đề thảo luận này không?')) return;
    try {
      await discussionService.deleteThread(courseId, threadId);
      showFeedback('Đã xóa chủ đề');
      loadThreads(page);
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi xóa chủ đề', 'error');
    }
  };

  // Create new thread
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

  // Helper to structure flat posts into 2-level hierarchy
  const getThreadPostTree = (threadPosts: DiscussionPostResponse[] = []) => {
    const rootPosts = threadPosts.filter(
      (p) => !p.parentId || !threadPosts.some((parent) => parent.id === p.parentId)
    );
    const childPostsMap = new Map<string, DiscussionPostResponse[]>();
    threadPosts.forEach((p) => {
      if (p.parentId && threadPosts.some((parent) => parent.id === p.parentId)) {
        const list = childPostsMap.get(p.parentId) || [];
        list.push(p);
        childPostsMap.set(p.parentId, list);
      }
    });
    return { rootPosts, childPostsMap };
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={
            'p-4 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ' +
            (feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800')
          }
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

      {/* Main Content: Single Column Inline Flow */}
      <div className="space-y-4">
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
                className="px-4 py-2 bg-[#83C75D] text-white rounded-xl text-xs font-bold hover:bg-[#72b44e] transition-colors cursor-pointer"
              >
                Tạo thảo luận ngay
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => {
              const isExpanded = !!expandedThreadIds[thread.id];
              const threadPosts = postsByThread[thread.id] || [];
              const isLoadingPosts = !!loadingPostsByThread[thread.id];
              const { rootPosts, childPostsMap } = getThreadPostTree(threadPosts);

              const isTeacher = thread.authorRole === 'TEACHER' || thread.authorRole === 'ADMIN';
              const replyingTo = replyingToByThread[thread.id];
              const replyContent = replyContentByThread[thread.id] || '';
              const isSubmittingReply = !!submittingReplyByThread[thread.id];

              return (
                <div
                  key={thread.id}
                  className={`bg-white border rounded-3xl shadow-xs transition-all ${
                    thread.isPinned
                      ? 'border-amber-200 ring-1 ring-amber-200/50'
                      : isExpanded
                      ? 'border-[#83C75D] ring-2 ring-[#83C75D]/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Thread Question Section */}
                  <div className="p-5 sm:p-6 space-y-3.5">
                    {/* Header: Author info on Left, Moderation Controls on Right */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          src={thread.authorAvatarUrl}
                          name={thread.authorName}
                          size="md"
                          borderColor="border-slate-100"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 truncate max-w-[200px]">
                              {thread.authorName || 'Người dùng'}
                            </span>
                            {isTeacher && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Giảng viên
                              </span>
                            )}
                            {thread.isPinned && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                <Pin className="w-2.5 h-2.5 fill-amber-700 text-amber-700" />
                                <span>GHIM</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(thread.createdAt)}</span>
                            </span>
                            {thread.lessonTitle && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="px-2 py-0.2 rounded-full font-semibold bg-[#83C75D]/15 text-[#4e8231] truncate max-w-[220px]">
                                  {thread.lessonTitle}
                                </span>
                              </>
                            )}
                            <span className="text-slate-300">•</span>
                            {thread.status === 'RESOLVED' ? (
                              <span className="text-emerald-600 font-bold">Đã giải quyết</span>
                            ) : thread.isLocked ? (
                              <span className="text-rose-600 font-bold">Đã khóa</span>
                            ) : (
                              <span className="text-blue-600 font-medium">Đang mở</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Moderation Controls */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                        {isTeacherOrAdmin && (
                          <>
                            <button
                              onClick={() => handleTogglePin(thread)}
                              title={thread.isPinned ? 'Bỏ ghim' : 'Ghim chủ đề'}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                thread.isPinned
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleLock(thread)}
                              title={thread.isLocked ? 'Mở khóa' : 'Khóa chủ đề'}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                thread.isLocked
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {thread.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                        {(isTeacherOrAdmin || user?.id === thread.authorId) && (
                          <button
                            onClick={() => handleDeleteThread(thread.id)}
                            title="Xóa chủ đề"
                            className="p-1.5 rounded-lg text-rose-500 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question Title & Content */}
                    <div className="space-y-1.5 pt-1">
                      <h3 className="font-black text-base text-slate-900 leading-snug">
                        {thread.title}
                      </h3>
                      <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        <MentionBadgeText content={thread.content} candidates={candidates} />
                      </div>
                    </div>

                    {/* Facebook Reaction Summary & Post Count Summary Bar */}
                    {((thread.reactionCount || 0) > 0 || thread.postCount > 0) && (
                      <div className="flex items-center justify-between pt-2.5 pb-0.5 text-xs text-slate-500 border-t border-slate-100/80">
                        <div>
                          {(thread.reactionCount || 0) > 0 && (
                            <ReactionSummaryBadge
                              reactionCount={thread.reactionCount}
                              reactionBreakdown={thread.reactionBreakdown}
                              size="sm"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                          {thread.postCount > 0 && (
                            <span>{thread.postCount} phản hồi</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action buttons (Directly beneath comment/content, aligned to the LEFT!) */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
                      <FacebookReactionButton
                        myReaction={thread.myReaction}
                        reactionCount={thread.reactionCount}
                        reactionBreakdown={thread.reactionBreakdown}
                        onReact={(type) => handleReactToThread(thread.id, type)}
                        size="sm"
                      />

                      {!thread.isLocked && (isEnrolled || isTeacherOrAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleReplyToThread(thread)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-[#4e8231] hover:bg-[#83C75D]/15 transition-all cursor-pointer"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Trả lời</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleThreadReplies(thread.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isExpanded
                            ? 'bg-[#83C75D]/20 text-[#4e8231]'
                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>
                          {isExpanded
                            ? 'Thu gọn'
                            : thread.postCount > 0
                            ? `Xem thêm (${thread.postCount})`
                            : 'Xem thêm'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* INLINE REPLIES SECTION (Directly beneath the question) */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6 space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                        <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-slate-800">
                          <CornerDownRight className="w-4 h-4 text-[#83C75D]" />
                          <span>Phản hồi ({threadPosts.length})</span>
                        </div>
                      </div>

                      {isLoadingPosts ? (
                        <div className="p-6 text-center">
                          <Loader2 className="w-6 h-6 text-[#83C75D] animate-spin mx-auto mb-1" />
                          <p className="text-xs text-slate-400">Đang tải phản hồi...</p>
                        </div>
                      ) : threadPosts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Chưa có phản hồi nào. Hãy là người đầu tiên trả lời nhé!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {rootPosts.map((rootPost) => {
                            const childReplies = childPostsMap.get(rootPost.id) || [];
                            const isTeacherReply =
                              rootPost.authorRole === 'TEACHER' || rootPost.authorRole === 'ADMIN';
                            const isAuthor = rootPost.authorId === thread.authorId;

                            return (
                              <div key={rootPost.id} className="space-y-2.5">
                                {/* Level 1 Comment */}
                                <div className="flex items-start gap-2.5">
                                  <UserAvatar
                                    src={rootPost.authorAvatarUrl}
                                    name={rootPost.authorName}
                                    size="sm"
                                    borderColor="border-slate-100"
                                    className="mt-0.5"
                                  />

                                  <div className="flex-1 min-w-0">
                                    <div className="bg-white hover:bg-slate-50/80 transition-colors rounded-2xl p-3 border border-slate-200/80 inline-block max-w-full shadow-2xs">
                                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                        <span className="text-xs font-bold text-slate-900">
                                          {rootPost.authorName}
                                        </span>
                                        {isTeacherReply && (
                                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Giảng viên
                                          </span>
                                        )}
                                        {isAuthor && (
                                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-200/70 text-slate-700">
                                            Tác giả
                                          </span>
                                        )}
                                        {rootPost.isAnswer && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                            ĐÁP ÁN ĐÚNG
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        <MentionBadgeText
                                          content={rootPost.content}
                                          candidates={candidates}
                                        />
                                      </div>
                                    </div>

                                    {/* Action Row */}
                                    <div className="flex items-center gap-3 px-2 pt-1 text-[11px] text-slate-400">
                                      <span>{formatTime(rootPost.createdAt)}</span>
                                      <FacebookReactionButton
                                        myReaction={rootPost.myReaction}
                                        reactionCount={rootPost.reactionCount ?? rootPost.upvoteCount}
                                        reactionBreakdown={rootPost.reactionBreakdown}
                                        onReact={(type) => handleReactToPost(thread.id, rootPost.id, type)}
                                        size="sm"
                                        showSummaryInline
                                      />

                                      {!thread.isLocked && (isEnrolled || isTeacherOrAdmin) && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleReplyToUser(
                                              thread.id,
                                              rootPost.authorId,
                                              rootPost.authorName,
                                              rootPost.id
                                            )
                                          }
                                          className="font-bold text-slate-500 hover:text-[#4e8231] hover:underline cursor-pointer"
                                        >
                                          Trả lời
                                        </button>
                                      )}

                                      {/* Mark accepted answer */}
                                      {(isTeacherOrAdmin || user?.id === thread.authorId) && (
                                        <button
                                          onClick={() => handleMarkAnswer(thread.id, rootPost.id)}
                                          className={
                                            'text-[10px] font-bold hover:underline cursor-pointer ' +
                                            (rootPost.isAnswer
                                              ? 'text-emerald-700'
                                              : 'text-slate-400 hover:text-emerald-600')
                                          }
                                        >
                                          {rootPost.isAnswer ? 'Bỏ đáp án đúng' : 'Chọn làm đáp án'}
                                        </button>
                                      )}

                                      {(isTeacherOrAdmin || user?.id === rootPost.authorId) && (
                                        <button
                                          onClick={() => handleDeletePost(thread.id, rootPost.id)}
                                          className="text-slate-400 hover:text-rose-600 text-[10px] font-semibold hover:underline cursor-pointer"
                                        >
                                          Xóa
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Level 2 Nested Replies */}
                                {childReplies.length > 0 && (
                                  <div className="ml-7 sm:ml-10 pl-3.5 border-l-2 border-slate-200/80 space-y-2.5 pt-1">
                                    {childReplies.map((child) => {
                                      const isChildTeacher =
                                        child.authorRole === 'TEACHER' || child.authorRole === 'ADMIN';
                                      const isChildAuthor = child.authorId === thread.authorId;

                                      return (
                                        <div key={child.id} className="flex items-start gap-2">
                                          <UserAvatar
                                            src={child.authorAvatarUrl}
                                            name={child.authorName}
                                            size="xs"
                                            borderColor="border-slate-100"
                                            className="mt-0.5"
                                          />

                                          <div className="flex-1 min-w-0">
                                            <div className="bg-white hover:bg-slate-50/80 transition-colors rounded-2xl p-2.5 border border-slate-200/80 inline-block max-w-full shadow-2xs">
                                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                                <span className="text-xs font-bold text-slate-900">
                                                  {child.authorName}
                                                </span>
                                                {isChildTeacher && (
                                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Giảng viên
                                                  </span>
                                                )}
                                                {isChildAuthor && (
                                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-200/70 text-slate-700">
                                                    Tác giả
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                <MentionBadgeText
                                                  content={child.content}
                                                  candidates={candidates}
                                                />
                                              </div>
                                            </div>

                                            {/* Actions row */}
                                            <div className="flex items-center gap-3 px-2 pt-0.5 text-[11px] text-slate-400">
                                              <span>{formatTime(child.createdAt)}</span>
                                              <FacebookReactionButton
                                                myReaction={child.myReaction}
                                                reactionCount={child.reactionCount ?? child.upvoteCount}
                                                reactionBreakdown={child.reactionBreakdown}
                                                onReact={(type) => handleReactToPost(thread.id, child.id, type)}
                                                size="sm"
                                                showSummaryInline
                                              />

                                              {!thread.isLocked && (isEnrolled || isTeacherOrAdmin) && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleReplyToUser(
                                                      thread.id,
                                                      child.authorId,
                                                      child.authorName,
                                                      rootPost.id
                                                    )
                                                  }
                                                  className="font-bold text-slate-500 hover:text-[#4e8231] hover:underline cursor-pointer"
                                                >
                                                  Trả lời
                                                </button>
                                              )}

                                              {(isTeacherOrAdmin || user?.id === child.authorId) && (
                                                <button
                                                  onClick={() => handleDeletePost(thread.id, child.id)}
                                                  className="text-slate-400 hover:text-rose-600 text-[10px] font-semibold hover:underline cursor-pointer"
                                                >
                                                  Xóa
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reply Form inside this thread */}
                      {thread.isLocked ? (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-700 flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" />
                          <span>Chủ đề thảo luận này đã bị khóa phản hồi bởi giảng viên.</span>
                        </div>
                      ) : isEnrolled || isTeacherOrAdmin ? (
                        <form
                          onSubmit={(e) => handleSendReply(e, thread.id)}
                          className="pt-2 space-y-3"
                        >
                          {replyingTo && (
                            <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 animate-in fade-in duration-150">
                              <div className="flex items-center gap-1.5">
                                <Reply className="w-3.5 h-3.5 text-[#83C75D]" />
                                <span>
                                  Đang trả lời <strong>@{replyingTo.name}</strong>
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCancelReplyingTo(thread.id)}
                                title="Hủy trả lời người này"
                                className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-start gap-2.5">
                            <UserAvatar
                              src={user?.avatarUrl}
                              name={user?.fullName}
                              size="sm"
                              className="mt-0.5"
                            />
                            <div className="flex-1 relative">
                              <MentionTextarea
                                ref={(el) => {
                                  replyInputRefs.current[thread.id] = el;
                                }}
                                rows={2}
                                value={replyContent}
                                onChange={(val) =>
                                  setReplyContentByThread((prev) => ({
                                    ...prev,
                                    [thread.id]: val,
                                  }))
                                }
                                candidates={candidates}
                                onMentionedUsersChange={(ids) =>
                                  setReplyMentionedIdsByThread((prev) => ({
                                    ...prev,
                                    [thread.id]: ids,
                                  }))
                                }
                                placeholder="Viết câu trả lời hoặc thảo luận của bạn... (Gõ @ để tag tên)"
                                className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#83C75D] focus:ring-2 focus:ring-[#83C75D]/20 transition-all resize-none shadow-2xs"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={isSubmittingReply || !replyContent.trim()}
                              className="px-4 py-2 bg-[#83C75D] hover:bg-[#72b44e] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#83C75D]/25 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                            >
                              {isSubmittingReply ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang gửi...</span>
                                </>
                              ) : (
                                <>
                                  <Reply className="w-3.5 h-3.5" />
                                  <span>Gửi phản hồi</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="p-3 bg-slate-100/70 border border-slate-200/60 rounded-2xl text-xs text-slate-500 text-center font-medium">
                          Chỉ học viên đã tham gia khóa học mới có thể gửi phản hồi.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  disabled={page === 0}
                  onClick={() => loadThreads(page - 1)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Trang trước
                </button>
                <span className="text-xs text-slate-500">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => loadThreads(page + 1)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
            )}
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
                  <p className="text-xs text-slate-400">
                    Giảng viên và các bạn học viên sẽ giải đáp câu hỏi của bạn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
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
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
