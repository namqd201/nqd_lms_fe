import {
  ClassEnrollmentStatus,
  ClassroomRequest,
  ClassroomResponse,
  ClassroomStudentResponse,
  InviteStudentRequest,
  JoinClassroomRequest,
  UserSuggestionResponse,
} from '@/types/classroom';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const classroomService = {
  createClassroom: async (data: ClassroomRequest): Promise<ClassroomResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ClassroomResponse>(response, 'Không thể tạo lớp học mới');
  },

  updateClassroom: async (id: string, data: ClassroomRequest): Promise<ClassroomResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ClassroomResponse>(response, 'Không thể cập nhật thông tin lớp học');
  },

  deleteClassroom: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể xóa lớp học');
  },

  getClassroomById: async (id: string): Promise<ClassroomResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomResponse>(response, 'Không thể tải thông tin lớp học');
  },

  getTeachingClassrooms: async (): Promise<ClassroomResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/teaching`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomResponse[]>(response, 'Không thể tải danh sách lớp bạn giảng dạy');
  },

  getEnrolledClassrooms: async (): Promise<ClassroomResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/enrolled`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomResponse[]>(response, 'Không thể tải danh sách lớp bạn tham gia');
  },

  getMyInvitations: async (): Promise<ClassroomStudentResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/invitations`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomStudentResponse[]>(response, 'Không thể tải danh sách lời mời');
  },

  requestToJoin: async (data: JoinClassroomRequest): Promise<ClassroomStudentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ClassroomStudentResponse>(response, 'Không thể gửi yêu cầu xin vào lớp');
  },

  approveStudent: async (classroomId: string, studentId: string): Promise<ClassroomStudentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/requests/${studentId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomStudentResponse>(response, 'Không thể phê duyệt học sinh');
  },

  rejectStudent: async (classroomId: string, studentId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/requests/${studentId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể từ chối yêu cầu của học sinh');
  },

  inviteStudent: async (classroomId: string, data: InviteStudentRequest): Promise<ClassroomStudentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ClassroomStudentResponse>(response, 'Không thể gửi lời mời học sinh');
  },

  acceptInvitation: async (classroomId: string): Promise<ClassroomStudentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/invitations/accept`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomStudentResponse>(response, 'Không thể đồng ý lời mời');
  },

  declineInvitation: async (classroomId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/invitations/decline`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể từ chối lời mời');
  },

  getClassroomStudents: async (
    classroomId: string,
    status?: ClassEnrollmentStatus
  ): Promise<ClassroomStudentResponse[]> => {
    const url = status
      ? `${API_BASE_URL}/api/v1/classrooms/${classroomId}/students?status=${status}`
      : `${API_BASE_URL}/api/v1/classrooms/${classroomId}/students`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomStudentResponse[]>(response, 'Không thể tải danh sách học sinh của lớp');
  },

  removeStudent: async (classroomId: string, studentId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/students/${studentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể xóa học sinh khỏi lớp');
  },

  leaveClassroom: async (classroomId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể rời lớp học');
  },

  searchUsers: async (query: string): Promise<UserSuggestionResponse[]> => {
    if (!query || query.trim().length < 2) return [];
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/search-users?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<UserSuggestionResponse[]>(response, 'Không thể tìm kiếm người dùng');
  },
};
