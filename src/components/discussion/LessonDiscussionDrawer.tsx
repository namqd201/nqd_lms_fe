'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { discussionService } from '@/services/discussion.service';
import { DiscussionThreadResponse, DiscussionPostResponse, MentionCandidateResponse, ReactionType } from '@/types/discussion';
import { FacebookReactionButton, ReactionSummaryBadge } from './FacebookReactions';
import { MentionTextarea } from './MentionTextarea';
import { MentionBadgeText } from './MentionBadgeText';
import { UserAvatar } from '../UserAvatar';
import {
  MessageSquare,
  X,
  Plus,
  ThumbsUp,
  Award,
  CheckCircle2,
  Clock,
  Lock,
  ChevronRight,
  Loader2,
  CornerDownRight,
  Pin,
  AtSign,
  Reply,
} from 'lucide-react';

interface LessonDiscussionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  initialThreadId?: string;
}

export const LessonDiscussionDrawer: React.FC<LessonDiscussionDrawerProps> = ({
  isOpen,
  onClose,
  courseId,
  lessonId,
  lessonTitle,
  initialThreadId,
}) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<DiscussionThreadResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Thread
  const [activeThread, setActiveThread] = useState<DiscussionThreadResponse | null>(null);
  const [posts, setPosts] = useState<DiscussionPostResponse[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string; parentPostId?: string } | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // Mentions
  const [candidates, setCandidates] = useState<MentionCandidateResponse[]>([]);
  const [createMentionedIds, setCreateMentionedIds] = useState<string[]>([]);
  const [replyMentionedIds, setReplyMentionedIds] = useState<string[]>([]);

  // Create question in drawer
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [feedback, setFeedback] = useState<string | null>(null);

  // Group posts into hierarchical tree (Level 1: root comments, Level 2: child replies)
  const { rootPosts, childPostsMap } = useMemo(() => {
    const roots = posts.filter(
      (p) => !p.parentId || !posts.some((parent) => parent.id === p.parentId)
    );
    const childMap = new Map<string, DiscussionPostResponse[]>();
    posts.forEach((p) => {
      if (p.parentId && posts.some((parent) => parent.id === p.parentId)) {
        const list = childMap.get(p.parentId) || [];
        list.push(p);
        childMap.set(p.parentId, list);
      }
    });
    return { rootPosts: roots, childPostsMap: childMap };
  }, [posts]);

  // Load mention candidates for the course
  useEffect(() => {
    if (courseId) {
      discussionService.getMentionCandidates(courseId)
        .then(setCandidates)
        .catch(() => setCandidates([]));
    }
  }, [courseId]);

  const loadLessonThreads = async () => {
    setIsLoading(true);
    try {
      const res = await discussionService.getThreads(courseId, {
        lessonId: lessonId,
        page: 0,
        size: 30,
      });
      const items = res.items || [];
      setThreads(items);

      // If initialThreadId is provided, auto open it
      if (initialThreadId) {
        const found = items.find((t) => t.id === initialThreadId);
        if (found) {
          openThread(found);
        } else {
          discussionService.getThreadDetail(courseId, initialThreadId)
            .then(openThread)
            .catch(() => {});
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && courseId && lessonId) {
      loadLessonThreads();
      if (!initialThreadId) {
        setActiveThread(null);
      }
      setIsCreating(false);
    }
  }, [isOpen, courseId, lessonId, initialThreadId]);

  const openThread = async (thread: DiscussionThreadResponse) => {
    setActiveThread(thread);
    setReplyingTo(null);
    setReplyText('');
    setReplyMentionedIds([]);
    setIsLoadingPosts(true);
    try {
      const [detailRes, postsRes] = await Promise.all([
        discussionService.getThreadDetail(courseId, thread.id),
        discussionService.getPosts(courseId, thread.id, 0, 50),
      ]);
      setActiveThread(detailRes);
      setPosts(postsRes.items || []);
    } catch {
      // ignore
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleReplyToUser = (authorId: string, authorName: string, parentPostId?: string) => {
    setReplyingTo({ id: authorId, name: authorName, parentPostId });
    const mentionTag = `@${authorName} `;
    setReplyText((prev) => {
      if (prev.includes(`@${authorName}`)) return prev;
      return `${mentionTag}${prev}`;
    });
    setReplyMentionedIds((prev) => Array.from(new Set([...prev, authorId])));
    setTimeout(() => {
      replyInputRef.current?.focus();
      replyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleCancelReplyingTo = () => {
    if (replyingTo) {
      setReplyText((prev) => prev.replace(`@${replyingTo.name} `, '').replace(`@${replyingTo.name}`, ''));
      setReplyMentionedIds((prev) => prev.filter((id) => id !== replyingTo.id));
    }
    setReplyingTo(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await discussionService.createThread(courseId, {
        lessonId,
        title: newTitle.trim(),
        content: newContent.trim(),
        mentionedUserIds: createMentionedIds,
      });
      setNewTitle('');
      setNewContent('');
      setCreateMentionedIds([]);
      setIsCreating(false);
      loadLessonThreads();
      if (res) {
        openThread(res);
      }
    } catch (err: any) {
      setFeedback(err.message || 'Lỗi khi gửi câu hỏi');
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;

    setIsReplying(true);
    try {
      const finalMentionedIds = Array.from(new Set([
        ...replyMentionedIds,
        ...(replyingTo && replyText.includes(`@${replyingTo.name}`) ? [replyingTo.id] : []),
      ]));

      const res = await discussionService.createPost(courseId, activeThread.id, {
        content: replyText.trim(),
        parentId: replyingTo?.parentPostId || undefined,
        mentionedUserIds: finalMentionedIds,
      });
      setReplyText('');
      setReplyMentionedIds([]);
      setReplyingTo(null);
      setPosts((prev) => [...prev, res]);
      setActiveThread((prev) => (prev ? { ...prev, postCount: prev.postCount + 1 } : null));
    } catch (err: any) {
      setFeedback(err.message || 'Lỗi gửi phản hồi');
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsReplying(false);
    }
  };

  const handleReactToThread = async (threadId: string, type: ReactionType) => {
    if (!user) {
      setFeedback('Vui lòng đăng nhập để thả cảm xúc');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setActiveThread((prev) => {
      if (!prev || prev.id !== threadId) return prev;
      const isUnreact = prev.myReaction === type;
      const newReaction = isUnreact ? null : type;
      const currentCount = prev.reactionCount || 0;
      const newCount = isUnreact ? Math.max(0, currentCount - 1) : (!prev.myReaction ? currentCount + 1 : currentCount);
      const newBreakdown = { ...(prev.reactionBreakdown || {}) };
      if (prev.myReaction && newBreakdown[prev.myReaction]) {
        newBreakdown[prev.myReaction] = Math.max(0, newBreakdown[prev.myReaction] - 1);
      }
      if (!isUnreact) {
        newBreakdown[type] = (newBreakdown[type] || 0) + 1;
      }
      return {
        ...prev,
        myReaction: newReaction,
        reactionCount: newCount,
        reactionBreakdown: newBreakdown,
      };
    });

    try {
      const updated = await discussionService.reactToThread(courseId, threadId, type);
      setActiveThread((prev) => (prev && prev.id === threadId ? { ...prev, ...updated } : prev));
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, ...updated } : t)));
    } catch (err: any) {
      setFeedback(err?.message || 'Lỗi thả cảm xúc');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleReactToPost = async (postId: string, type: ReactionType) => {
    if (!activeThread) return;
    if (!user) {
      setFeedback('Vui lòng đăng nhập để thả cảm xúc');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setPosts((prev) =>
      prev.map((p) => {
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
      })
    );

    try {
      const updated = await discussionService.reactToPost(courseId, activeThread.id, postId, type);
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...updated } : p)));
    } catch (err: any) {
      setFeedback(err?.message || 'Lỗi thả cảm xúc');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleUpvote = async (postId: string) => {
    if (!activeThread) return;
    try {
      const res = await discussionService.toggleUpvote(courseId, activeThread.id, postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? res : p)));
    } catch (err: any) {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200 font-sans">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#83C75D]/15 text-[#4e8231] flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900">Hỏi đáp bài học</h3>
            <p className="text-[11px] text-slate-500 truncate max-w-[280px]">{lessonTitle}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {feedback && (
        <div className="m-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isCreating ? (
          <form onSubmit={handleCreate} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-xs text-slate-800">Đặt câu hỏi về bài học này</h4>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600"
              >
                Hủy
              </button>
            </div>

            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tiêu đề câu hỏi..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#83C75D]"
            />

            <MentionTextarea
              required
              rows={4}
              value={newContent}
              onChange={setNewContent}
              candidates={candidates}
              onMentionedUsersChange={setCreateMentionedIds}
              placeholder="Chi tiết câu hỏi... (Gõ @ để nhắc đến giảng viên hoặc bạn học)"
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#83C75D] resize-none"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-[#83C75D] hover:bg-[#72b44e] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Đang đăng...' : 'Đăng câu hỏi'}
            </button>
          </form>
        ) : activeThread ? (
          <div className="space-y-3">
                <button
                  onClick={() => setActiveThread(null)}
                  className="text-xs font-bold text-[#4e8231] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Quay lại danh sách câu hỏi
                </button>

                {/* SINGLE UNIFIED CARD (Facebook style) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* 1. Root Question Section */}
                  <div className="p-4 bg-slate-50/70 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        src={activeThread.authorAvatarUrl}
                        name={activeThread.authorName}
                        size="md"
                        borderColor="border-emerald-100"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{activeThread.authorName}</span>
                          {activeThread.authorRole === 'TEACHER' && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Giảng viên
                            </span>
                          )}
                          {activeThread.isPinned && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                              GHIM
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(activeThread.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{activeThread.title}</h4>

                    <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      <MentionBadgeText content={activeThread.content} candidates={candidates} />
                    </div>

                    {/* Question actions */}
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                      <FacebookReactionButton
                        myReaction={activeThread.myReaction}
                        reactionCount={activeThread.reactionCount}
                        reactionBreakdown={activeThread.reactionBreakdown}
                        onReact={(type) => handleReactToThread(activeThread.id, type)}
                        size="sm"
                        showSummaryInline
                      />
                      {!activeThread.isLocked && (
                        <button
                          type="button"
                          onClick={() => handleReplyToUser(activeThread.authorId, activeThread.authorName, undefined)}
                          className="font-bold text-slate-600 hover:text-[#4e8231] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Trả lời</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Replies Stream (Unified inside same card, no isolated box borders) */}
                  <div className="p-4 space-y-3 bg-white border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between pb-1 border-b border-slate-100">
                      <span>Phản hồi ({posts.length})</span>
                    </div>

                    {isLoadingPosts ? (
                      <div className="p-6 text-center">
                        <Loader2 className="w-5 h-5 text-[#83C75D] animate-spin mx-auto" />
                      </div>
                    ) : posts.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Chưa có phản hồi nào. Hãy là người đầu tiên trả lời!</p>
                    ) : (
                      <div className="space-y-3.5">
                        {rootPosts.map((rootPost) => {
                          const childReplies = childPostsMap.get(rootPost.id) || [];
                          const isTeacher = rootPost.authorRole === 'TEACHER';
                          const isAuthor = rootPost.authorId === activeThread.authorId;

                          return (
                            <div key={rootPost.id} className="space-y-2.5">
                              {/* Root Post (Level 1) */}
                              <div className="flex items-start gap-2.5">
                                <UserAvatar
                                  src={rootPost.authorAvatarUrl}
                                  name={rootPost.authorName}
                                  size="sm"
                                  borderColor="border-slate-100"
                                  className="mt-0.5"
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="bg-slate-50 hover:bg-slate-100/70 transition-colors rounded-2xl px-3 py-2 text-xs border border-slate-100 inline-block max-w-full">
                                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                      <span className="font-bold text-slate-900">{rootPost.authorName}</span>
                                      {isTeacher && (
                                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                          Giảng viên
                                        </span>
                                      )}
                                      {isAuthor && (
                                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-200/70 text-slate-700">
                                          Tác giả
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                                      <MentionBadgeText content={rootPost.content} candidates={candidates} />
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-3 px-1.5 pt-1 text-[11px] text-slate-400">
                                    <span>{new Date(rootPost.createdAt).toLocaleDateString('vi-VN')}</span>
                                    <FacebookReactionButton
                                      myReaction={rootPost.myReaction}
                                      reactionCount={rootPost.reactionCount ?? rootPost.upvoteCount}
                                      reactionBreakdown={rootPost.reactionBreakdown}
                                      onReact={(type) => handleReactToPost(rootPost.id, type)}
                                      size="sm"
                                      showSummaryInline
                                    />
                                    {!activeThread.isLocked && (
                                      <button
                                        type="button"
                                        onClick={() => handleReplyToUser(rootPost.authorId, rootPost.authorName, rootPost.id)}
                                        className="font-bold text-slate-500 hover:text-[#4e8231] hover:underline cursor-pointer"
                                      >
                                        Trả lời
                                      </button>
                                    )}
                                    {rootPost.isAnswer && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Đáp án đúng
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Nested Replies (Level 2 - Indented Facebook style) */}
                              {childReplies.length > 0 && (
                                <div className="ml-7 sm:ml-9 pl-3 border-l-2 border-slate-200/80 space-y-2.5 pt-0.5">
                                  {childReplies.map((child) => {
                                    const isChildTeacher = child.authorRole === 'TEACHER';
                                    const isChildAuthor = child.authorId === activeThread.authorId;

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
                                          <div className="bg-slate-50 hover:bg-slate-100/70 transition-colors rounded-2xl px-2.5 py-1.5 text-xs border border-slate-100 inline-block max-w-full">
                                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                              <span className="font-bold text-slate-900">{child.authorName}</span>
                                              {isChildTeacher && (
                                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                  Giảng viên
                                                </span>
                                              )}
                                              {isChildAuthor && (
                                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-200/70 text-slate-700">
                                                  Tác giả
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                                              <MentionBadgeText content={child.content} candidates={candidates} />
                                            </div>
                                          </div>

                                          {/* Actions */}
                                          <div className="flex items-center gap-3 px-1.5 pt-0.5 text-[10px] text-slate-400">
                                            <span>{new Date(child.createdAt).toLocaleDateString('vi-VN')}</span>
                                            <FacebookReactionButton
                                              myReaction={child.myReaction}
                                              reactionCount={child.reactionCount ?? child.upvoteCount}
                                              reactionBreakdown={child.reactionBreakdown}
                                              onReact={(type) => handleReactToPost(child.id, type)}
                                              size="sm"
                                              showSummaryInline
                                            />
                                            {!activeThread.isLocked && (
                                              <button
                                                type="button"
                                                onClick={() => handleReplyToUser(child.authorId, child.authorName, rootPost.id)}
                                                className="font-bold text-slate-500 hover:text-[#4e8231] hover:underline cursor-pointer"
                                              >
                                                Trả lời
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
                  </div>

                  {/* 3. Reply Input Form (Integrated at bottom of SAME card) */}
                  {!activeThread.isLocked ? (
                    <form onSubmit={handleSendReply} className="p-3 bg-slate-50/60 border-t border-slate-100 space-y-2">
                      {replyingTo && (
                        <div className="flex items-center justify-between px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 animate-in fade-in duration-150">
                          <div className="flex items-center gap-1">
                            <Reply className="w-3 h-3 text-[#83C75D]" />
                            <span>Đang trả lời <strong>@{replyingTo.name}</strong></span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCancelReplyingTo}
                            title="Hủy trả lời người này"
                            className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded hover:bg-emerald-100 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <UserAvatar
                          src={user?.avatarUrl}
                          name={user?.fullName}
                          size="sm"
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <MentionTextarea
                            ref={replyInputRef}
                            rows={2}
                            value={replyText}
                            onChange={setReplyText}
                            candidates={candidates}
                            onMentionedUsersChange={setReplyMentionedIds}
                            placeholder="Viết phản hồi của bạn... (Gõ @ để nhắc đến ai đó)"
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#83C75D] resize-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isReplying || !replyText.trim()}
                          className="px-3.5 py-1.5 bg-[#83C75D] hover:bg-[#72b44e] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          {isReplying ? 'Đang gửi...' : 'Gửi phản hồi'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-3 bg-rose-50 border-t border-rose-100 text-center text-xs font-bold text-rose-700">
                      Chủ đề đã bị khóa
                    </div>
                  )}
                </div>
              </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[#83C75D] text-[#4e8231] hover:bg-[#83C75D]/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Đặt câu hỏi về bài học này</span>
            </button>

            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-[#83C75D] animate-spin mx-auto" />
              </div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Bài học này chưa có câu hỏi nào.
              </div>
            ) : (
              threads.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openThread(t)}
                  className="p-3.5 bg-slate-50 hover:bg-[#83C75D]/5 border border-slate-200 hover:border-[#83C75D]/50 rounded-2xl cursor-pointer transition-all space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 line-clamp-1">{t.title}</span>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">{t.postCount} trả lời</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{t.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
