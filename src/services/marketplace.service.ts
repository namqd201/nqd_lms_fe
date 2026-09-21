import {
  MarketplaceCourseResponse,
  MarketplaceCourseDetailResponse,
  CourseReviewResponse,
  CourseReviewRequest,
} from '@/types/marketplace';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface MarketplaceFilterParams {
  keyword?: string;
  subjectId?: string;
  gradeLevel?: string;
  teacherId?: string;
  isFree?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc';
  page?: number;
  size?: number;
}

export const marketplaceService = {
  searchCourses: async (
    params: MarketplaceFilterParams = {}
  ): Promise<{ content: MarketplaceCourseResponse[]; totalElements: number; totalPages: number }> => {
    const searchParams = new URLSearchParams();
    if (params.keyword?.trim()) searchParams.append('keyword', params.keyword.trim());
    if (params.subjectId) searchParams.append('subjectId', params.subjectId);
    if (params.gradeLevel) searchParams.append('gradeLevel', params.gradeLevel);
    if (params.teacherId) searchParams.append('teacherId', params.teacherId);
    if (params.isFree !== undefined) searchParams.append('isFree', String(params.isFree));
    if (params.minPrice !== undefined) searchParams.append('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) searchParams.append('maxPrice', String(params.maxPrice));
    if (params.minRating !== undefined) searchParams.append('minRating', String(params.minRating));
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.size !== undefined) searchParams.append('size', String(params.size));

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/marketplace/courses${queryString}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const res = await handleApiResponse<any>(response, 'Không thể tải danh sách khóa học Marketplace');
    const data = res.data ?? res;
    return {
      content: data.content ?? data.items ?? (Array.isArray(data) ? data : []),
      totalElements: data.totalElements ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data.totalPages ?? 1,
    };
  },

  getCourseDetail: async (courseId: string): Promise<MarketplaceCourseDetailResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/marketplace/courses/${courseId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải thông tin khóa học');
    return res.data ?? res;
  },

  getReviews: async (
    courseId: string,
    page: number = 0,
    size: number = 10
  ): Promise<{ content: CourseReviewResponse[]; totalElements: number; totalPages: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/marketplace/courses/${courseId}/reviews?page=${page}&size=${size}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải đánh giá khóa học');
    const data = res.data ?? res;
    const rawList: any[] = data.items ?? data.content ?? (Array.isArray(data) ? data : []);
    const content: CourseReviewResponse[] = rawList.map((item: any) => ({
      ...item,
      userName: item.userFullName || item.userName || 'Người dùng',
      userFullName: item.userFullName || item.userName || 'Người dùng',
      userAvatar: item.userAvatarUrl || item.userAvatar,
      userAvatarUrl: item.userAvatarUrl || item.userAvatar,
    }));
    return {
      content,
      totalElements: data.totalElements ?? content.length,
      totalPages: data.totalPages ?? 1,
    };
  },

  createReview: async (courseId: string, request: CourseReviewRequest): Promise<CourseReviewResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/marketplace/courses/${courseId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    const res = await handleApiResponse<any>(response, 'Không thể gửi đánh giá');
    const item = res.data ?? res;
    return {
      ...item,
      userName: item.userFullName || item.userName || 'Người dùng',
      userFullName: item.userFullName || item.userName || 'Người dùng',
      userAvatar: item.userAvatarUrl || item.userAvatar,
      userAvatarUrl: item.userAvatarUrl || item.userAvatar,
    };
  },

  updateReview: async (courseId: string, reviewId: string, request: CourseReviewRequest): Promise<CourseReviewResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/marketplace/courses/${courseId}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    const res = await handleApiResponse<any>(response, 'Không thể cập nhật đánh giá');
    const item = res.data ?? res;
    return {
      ...item,
      userName: item.userFullName || item.userName || 'Người dùng',
      userFullName: item.userFullName || item.userName || 'Người dùng',
      userAvatar: item.userAvatarUrl || item.userAvatar,
      userAvatarUrl: item.userAvatarUrl || item.userAvatar,
    };
  },

  deleteReview: async (courseId: string, reviewId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/marketplace/courses/${courseId}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    await handleApiResponse<any>(response, 'Không thể xóa đánh giá');
  },

  submitCourseForReview: async (courseId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/submit-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<any>(response, 'Không thể gửi duyệt khóa học');
  },

  getAdminPendingCourses: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/courses/pending-review`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải danh sách khóa học chờ duyệt');
    return res.data ?? res;
  },

  adminApproveCourse: async (courseId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/courses/${courseId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<any>(response, 'Không thể phê duyệt khóa học');
  },

  adminRejectCourse: async (courseId: string, reason: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/courses/${courseId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    return handleApiResponse<any>(response, 'Không thể từ chối khóa học');
  },
};