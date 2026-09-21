export type DiscussionThreadStatus = 'OPEN' | 'RESOLVED' | 'CLOSED';

export interface DiscussionThreadResponse {
  id: string;
  courseId: string;
  lessonId?: string;
  lessonTitle?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  status: DiscussionThreadStatus;
  postCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscussionThreadRequest {
  lessonId?: string;
  title: string;
  content: string;
}

export interface UpdateDiscussionThreadRequest {
  title?: string;
  content?: string;
}

export interface DiscussionPostResponse {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  content: string;
  isAnswer: boolean;
  upvoteCount: number;
  isUpvotedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscussionPostRequest {
  content: string;
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
