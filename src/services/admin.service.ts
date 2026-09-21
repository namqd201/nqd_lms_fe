import { UserStatus } from '@/types/auth';
import {
  AdminGrantVipRequest,
  AssignRoleRequest,
  RoleResponse,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  UserProfileResponse,
  UserSubscriptionResponse,
} from '@/types/user';
import {
  RoleDetailResponse,
  SubjectRequest,
  SubjectResponse,
  SubjectStatus,
  AdminCourseResponse,
} from '@/types/admin';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const adminService = {
  // ================= USERS MANAGEMENT =================
  getUsers: async (query?: string, status?: string): Promise<UserProfileResponse[]> => {
    const params = new URLSearchParams();
    if (query && query.trim()) params.append('query', query.trim());
    if (status && status !== 'ALL') params.append('status', status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<UserProfileResponse[]>(response, 'Không thể tải danh sách người dùng');
  },

  getUserById: async (id: string): Promise<UserProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<UserProfileResponse>(response, `Không thể tải thông tin người dùng`);
  },

  updateUserStatus: async (id: string, status: UserStatus): Promise<UserProfileResponse> => {
    const payload: UpdateUserStatusRequest = { status };
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    return handleApiResponse<UserProfileResponse>(response, 'Không thể cập nhật trạng thái người dùng');
  },

  updateUserRoles: async (id: string, roles: string[]): Promise<UserProfileResponse> => {
    const payload: UpdateUserRoleRequest = { roles };
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${id}/roles`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    return handleApiResponse<UserProfileResponse>(response, 'Không thể cập nhật danh sách vai trò');
  },

  assignRole: async (id: string, roleName: string): Promise<UserProfileResponse> => {
    const payload: AssignRoleRequest = { roleName };
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${id}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    return handleApiResponse<UserProfileResponse>(response, `Không thể gán vai trò ${roleName}`);
  },

  removeRole: async (id: string, roleName: string): Promise<UserProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${id}/roles/${encodeURIComponent(roleName)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<UserProfileResponse>(response, `Không thể gỡ vai trò ${roleName}`);
  },

  // ================= VIP & MEMBERSHIP MANAGEMENT =================
  getUserSubscription: async (userId: string): Promise<UserSubscriptionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/subscription`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<UserSubscriptionResponse>(response, 'Không thể tải thông tin gói của người dùng');
  },

  grantUserVip: async (userId: string, data: AdminGrantVipRequest): Promise<UserSubscriptionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/vip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<UserSubscriptionResponse>(response, 'Không thể cấp quyền VIP cho người dùng');
  },

  revokeUserVip: async (userId: string, reason?: string): Promise<UserSubscriptionResponse> => {
    const url = reason
      ? `${API_BASE_URL}/api/v1/admin/users/${userId}/subscription?reason=${encodeURIComponent(reason)}`
      : `${API_BASE_URL}/api/v1/admin/users/${userId}/subscription`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<UserSubscriptionResponse>(response, 'Không thể thu hồi quyền VIP của người dùng');
  },

  getMembershipPlans: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/membership/plans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<any[]>(response, 'Không thể tải danh sách gói hội viên');
  },

  // ================= ROLES MANAGEMENT =================
  getRoles: async (): Promise<RoleDetailResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<RoleDetailResponse[]>(response, 'Không thể tải danh sách vai trò');
  },

  getUsersByRole: async (roleName: string): Promise<UserProfileResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles/${encodeURIComponent(roleName)}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<UserProfileResponse[]>(response, `Không thể tải danh sách người dùng của vai trò ${roleName}`);
  },

  // ================= SUBJECTS MANAGEMENT =================
  getSubjects: async (): Promise<SubjectResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/subjects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<SubjectResponse[]>(response, 'Không thể tải danh sách môn học');
  },

  getSubjectById: async (id: string): Promise<SubjectResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/subjects/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<SubjectResponse>(response, 'Không thể tải thông tin môn học');
  },

  createSubject: async (data: SubjectRequest): Promise<SubjectResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<SubjectResponse>(response, 'Không thể tạo mới môn học');
  },

  updateSubject: async (id: string, data: SubjectRequest): Promise<SubjectResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/subjects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<SubjectResponse>(response, 'Không thể cập nhật môn học');
  },

  updateSubjectStatus: async (id: string, status: SubjectStatus): Promise<SubjectResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/subjects/${id}/status?status=${status}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<SubjectResponse>(response, 'Không thể cập nhật trạng thái môn học');
  },

  deleteSubject: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/subjects/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<void>(response, 'Không thể xóa môn học');
  },

  getDeletedSubjects: async (): Promise<SubjectResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/subjects/trash`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<SubjectResponse[]>(response, 'Không thể tải lịch sử môn học đã xóa');
  },

  restoreSubject: async (id: string): Promise<SubjectResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/subjects/${id}/restore`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<SubjectResponse>(response, 'Khôi phục môn học thất bại');
  },

  // ================= COURSES MANAGEMENT & MODERATION =================
  getCourses: async (): Promise<AdminCourseResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/courses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<AdminCourseResponse[]>(response, 'Không thể tải danh sách khóa học');
  },

  disableCourse: async (id: string, reason: string): Promise<AdminCourseResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/courses/${id}/disable`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });

    return handleApiResponse<AdminCourseResponse>(response, 'Không thể tạm dừng khóa học');
  },

  enableCourse: async (id: string): Promise<AdminCourseResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/courses/${id}/enable`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<AdminCourseResponse>(response, 'Không thể kích hoạt khóa học');
  },

  deleteCourse: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/courses/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<void>(response, 'Không thể xóa khóa học');
  },
};
