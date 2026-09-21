import {
  TeacherApplicationRequest,
  TeacherApplicationResponse,
  TeacherApplicantType,
  TeacherApplicationStatus,
} from '@/types/teacher-application';
import { mediaService } from './media.service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const teacherApplicationService = {
  uploadDocument: async (file: File): Promise<string> => {
    const res = await mediaService.uploadImage(file);
    return res.url;
  },

  submitApplication: async (payload: TeacherApplicationRequest): Promise<TeacherApplicationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMsg = 'Không thể nộp hồ sơ xét duyệt';
      try {
        const err = await response.json();
        errorMsg = err.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return await response.json();
  },

  getMyApplication: async (): Promise<TeacherApplicationResponse | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/teacher-applications/my-application`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404 || response.status === 204) {
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const text = await response.text();
      if (!text || text.trim() === '') return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  },

  updateMyApplication: async (payload: TeacherApplicationRequest): Promise<TeacherApplicationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher-applications/my-application`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMsg = 'Không thể cập nhật hồ sơ';
      try {
        const err = await response.json();
        errorMsg = err.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return await response.json();
  },

  // Admin APIs
  getApplications: async (params?: {
    status?: TeacherApplicationStatus;
    applicantType?: TeacherApplicantType;
    keyword?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: TeacherApplicationResponse[]; totalElements: number; totalPages: number }> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.applicantType) query.append('applicantType', params.applicantType);
    if (params?.keyword) query.append('keyword', params.keyword);
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());

    const response = await fetch(`${API_BASE_URL}/api/v1/admin/teacher-applications?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch applications: HTTP ${response.status}`);
    }

    return await response.json();
  },

  getPendingCount: async (): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/teacher-applications/pending-count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) return 0;
      const data = await response.json();
      return data.pendingCount || 0;
    } catch {
      return 0;
    }
  },

  getApplicationById: async (id: string): Promise<TeacherApplicationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/teacher-applications/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get application: HTTP ${response.status}`);
    }

    return await response.json();
  },

  approveApplication: async (id: string): Promise<TeacherApplicationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/teacher-applications/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMsg = 'Không thể phê duyệt hồ sơ';
      try {
        const err = await response.json();
        errorMsg = err.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return await response.json();
  },

  rejectApplication: async (id: string, reason: string): Promise<TeacherApplicationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/teacher-applications/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMsg = 'Không thể từ chối hồ sơ';
      try {
        const err = await response.json();
        errorMsg = err.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return await response.json();
  },
};
