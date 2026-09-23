export type DiscussionThreadStatus = 'OPEN' | 'RESOLVED' | 'CLOSED';

export type ReactionType = 'LIKE' | 'LOVE' | 'CARE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface DiscussionThreadResponse {
  id: string;
  courseId: string;
  lessonId?: string;
  lessonTitle?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  authorAvatarUrl?: string | null;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  status: DiscussionThreadStatus;
  postCount: number;
  viewCount: number;
  reactionCount?: number;
  myReaction?: ReactionType | null;
  reactionBreakdown?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscussionThreadRequest {
  lessonId?: string;
  title: string;
  content: string;
  mentionedUserIds?: string[];
}

export interface UpdateDiscussionThreadRequest {
  title?: string;
  content?: string;
}

export interface DiscussionPostResponse {
  id: string;
  threadId: string;
  parentId?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  authorAvatarUrl?: string | null;
  content: string;
  isAnswer: boolean;
  upvoteCount: number;
  isUpvotedByMe: boolean;
  reactionCount?: number;
  myReaction?: ReactionType | null;
  reactionBreakdown?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscussionPostRequest {
  content: string;
  parentId?: string;
  mentionedUserIds?: string[];
}

export interface MentionCandidateResponse {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  roleInCourse: 'TEACHER' | 'STUDENT';
}

export interface UpdateDiscussionPostRequest {
  content: string;
}

export interface PageResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}
