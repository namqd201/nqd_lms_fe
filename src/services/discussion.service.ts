import {
  DiscussionThreadResponse,
  CreateDiscussionThreadRequest,
  UpdateDiscussionThreadRequest,
  DiscussionPostResponse,
  CreateDiscussionPostRequest,
  UpdateDiscussionPostRequest,
  DiscussionThreadStatus,
  PageResponse,
  MentionCandidateResponse,
} from '@/types/discussion';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const discussionService = {
  getThreads: async (
    courseId: string,
    params?: { lessonId?: string; status?: DiscussionThreadStatus; search?: string; page?: number; size?: number }
  ): Promise<PageResponse<DiscussionThreadResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.lessonId) searchParams.append('lessonId', params.lessonId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());

    const url = `${API_BASE_URL}/api/v1/courses/${courseId}/discussions?${searchParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải danh sách thảo luận');
    return res.data ?? res;
  },

  getThreadDetail: async (courseId: string, threadId: string): Promise<DiscussionThreadResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/discussions/${threadId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải chi tiết chủ đề');
    return res.data ?? res;
  },

  createThread: async (courseId: string, data: CreateDiscussionThreadRequest): Promise<DiscussionThreadResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/discussions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const res = await handleApiResponse<any>(response, 'Không thể tạo chủ đề thảo luận');
    return res.data ?? res;
  },

  updateThread: async (courseId: string, threadId: string, data: UpdateDiscussionThreadRequest): Promise<DiscussionThreadResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/discussions/${threadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const res = await handleApiResponse<any>(response, 'Không thể cập nhật chủ đề');
    return res.data ?? res;
  },

  deleteThread: async (courseId: string, threadId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/discussions/${threadId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    await handleApiResponse<any>(response, 'Không thể xóa chủ đề thảo luận');
  },

  getPosts: async (courseId: string, threadId: string, page = 0, size = 50): Promise<PageResponse<DiscussionPostResponse>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/discussions/${threadId}/posts?page=${page}&size=${size}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải phản hồi thảo luận');
    return res.data ?? res;
  },

  createPost: async (courseId: string, threadId: string, data: CreateDiscussionPostRequest): Promise<DiscussionPostResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/discussions/${threadId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const res = await handleApiResponse<any>(response, 'Không thể gửi phản hồi');
    return res.data ?? res;
  },

  updatePost: async (courseId: string, threadId: string, postId: string, data: UpdateDiscussionPostRequest): Promise<DiscussionPostResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/discussions/${threadId}/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const res = await handleApiResponse<any>(response, 'Không thể cập nhật phản hồi');
    return res.data ?? res;
  },

  deletePost: async (courseId: string, threadId: string, postId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/discussions/${threadId}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    await handleApiResponse<any>(response, 'Không thể xóa phản hồi');
  },

  toggleUpvote: async (courseId: string, threadId: string, postId: string): Promise<DiscussionPostResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/discussions/${threadId}/posts/${postId}/upvote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Lỗi thao tác upvote');
    return res.data ?? res;
  },

  markAnswer: async (courseId: string, threadId: string, postId: string): Promise<DiscussionPostResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/discussions/${threadId}/posts/${postId}/mark-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Lỗi cập nhật đáp án đúng');
    return res.data ?? res;
  },

  pinThread: async (courseId: string, threadId: string, isPinned: boolean): Promise<DiscussionThreadResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/discussions/${threadId}/pin?isPinned=${isPinned}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Lỗi thao tác ghim chủ đề');
    return res.data ?? res;
  },

  lockThread: async (courseId: string, threadId: string, isLocked: boolean): Promise<DiscussionThreadResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/discussions/${threadId}/lock?isLocked=${isLocked}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Lỗi thao tác khóa chủ đề');
    return res.data ?? res;
  },

  getMentionCandidates: async (courseId: string): Promise<MentionCandidateResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/discussions/mention-candidates`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải danh sách thành viên để nhắc đến');
    return res.data ?? res;
  },
};
