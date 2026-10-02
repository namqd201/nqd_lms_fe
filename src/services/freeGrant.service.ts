import {
  CourseFreeGrantSummaryResponse,
  TeacherFreeGrantResponse,
  CourseFreeQuotaRequestResponse,
  FreeQuotaRequestStatus,
  AddFreeGrantRequest,
  CreateQuotaRequest,
  ReviewQuotaRequest,
} from '@/types/freeGrant';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const freeGrantService = {
  // ================= TEACHER FREE GRANTS =================
  getFreeGrantSummary: async (courseId: string): Promise<CourseFreeGrantSummaryResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/free-grants`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải thông tin suất học viên miễn phí');
    return res.data ?? res;
  },

  addFreeGrant: async (courseId: string, email: string): Promise<TeacherFreeGrantResponse> => {
    const payload: AddFreeGrantRequest = { email };
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/free-grants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const res = await handleApiResponse<any>(response, 'Không thể tặng khóa học cho học viên');
    return res.data ?? res;
  },

  requestQuota: async (courseId: string, data: CreateQuotaRequest): Promise<CourseFreeQuotaRequestResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/free-grants/request-quota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const res = await handleApiResponse<any>(response, 'Không thể gửi yêu cầu xin thêm suất miễn phí');
    return res.data ?? res;
  },

  // ================= ADMIN QUOTA REQUESTS =================
  getAdminQuotaRequests: async (
    status?: FreeQuotaRequestStatus,
    page: number = 0,
    size: number = 15
  ): Promise<{ content: CourseFreeQuotaRequestResponse[]; totalElements: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', String(page));
    params.append('size', String(size));

    const response = await fetch(`${API_BASE_URL}/api/v1/admin/courses/quota-requests?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải danh sách yêu cầu cấp thêm suất');
    const data = res.data ?? res;
    return {
      content: data.content ?? (Array.isArray(data) ? data : []),
      totalElements: data.totalElements ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data.totalPages ?? 1,
    };
  },

  reviewQuotaRequest: async (
    requestId: string,
    data: ReviewQuotaRequest
  ): Promise<CourseFreeQuotaRequestResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/courses/quota-requests/${requestId}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const res = await handleApiResponse<any>(response, 'Không thể xử lý yêu cầu cấp thêm suất');
    return res.data ?? res;
  },
};
