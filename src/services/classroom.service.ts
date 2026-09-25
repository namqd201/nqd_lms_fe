import {
  ClassEnrollmentStatus,
  ClassroomRequest,
  ClassroomResponse,
  ClassroomStudentResponse,
  InviteStudentRequest,
  JoinClassroomRequest,
  UserSuggestionResponse,
  ClassroomMaterial,
  CreateMaterialRequest,
  ClassroomAssignment,
  CreateAssignmentRequest,
  ClassroomMeeting,
  UpdateMeetingRequest,
  ClassroomRecordedVideo,
  CreateRecordedVideoRequest,
  ClassroomSchedule,
  CreateScheduleRequest,
  ClassroomFile,
  CreateFileRequest,
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

  // ==========================================
  // 1. MATERIALS (TÀI LIỆU)
  // ==========================================
  getMaterials: async (classroomId: string): Promise<ClassroomMaterial[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/materials`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomMaterial[]>(response, 'Không thể tải tài liệu học tập');
  },

  createMaterial: async (classroomId: string, data: CreateMaterialRequest): Promise<ClassroomMaterial> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ClassroomMaterial>(response, 'Không thể đăng tài liệu mới');
  },

  deleteMaterial: async (classroomId: string, materialId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/materials/${materialId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể xóa tài liệu');
  },

  // ==========================================
  // 2. ASSIGNMENTS (BÀI TẬP)
  // ==========================================
  getAssignments: async (classroomId: string): Promise<ClassroomAssignment[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/assignments`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomAssignment[]>(response, 'Không thể tải danh sách bài tập');
  },

  createAssignment: async (classroomId: string, data: CreateAssignmentRequest): Promise<ClassroomAssignment> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ClassroomAssignment>(response, 'Không thể giao bài tập mới');
  },

  deleteAssignment: async (classroomId: string, assignmentId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể xóa bài tập');
  },

  // ==========================================
  // 3. LIVE MEETING (LARK)
  // ==========================================
  getMeetingInfo: async (classroomId: string): Promise<ClassroomMeeting> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/meeting`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomMeeting>(response, 'Không thể tải thông tin phòng học online');
  },

  updateMeetingInfo: async (classroomId: string, data: UpdateMeetingRequest): Promise<ClassroomMeeting> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/meeting`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ClassroomMeeting>(response, 'Không thể cập nhật phòng học online');
  },

  // ==========================================
  // 4. RECORDED VIDEOS (LARK VIDEOS)
  // ==========================================
  getRecordedVideos: async (classroomId: string): Promise<ClassroomRecordedVideo[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/videos`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomRecordedVideo[]>(response, 'Không thể tải danh sách video bản ghi');
  },

  createRecordedVideo: async (classroomId: string, data: CreateRecordedVideoRequest): Promise<ClassroomRecordedVideo> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ClassroomRecordedVideo>(response, 'Không thể đăng video bản ghi');
  },

  deleteRecordedVideo: async (classroomId: string, videoId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/videos/${videoId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể xóa video bản ghi');
  },

  // ==========================================
  // 5. SCHEDULES (LỊCH HỌC)
  // ==========================================
  getSchedules: async (classroomId: string): Promise<ClassroomSchedule[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/schedules`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomSchedule[]>(response, 'Không thể tải thời khóa biểu');
  },

  createSchedule: async (classroomId: string, data: CreateScheduleRequest): Promise<ClassroomSchedule> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ClassroomSchedule>(response, 'Không thể thêm lịch học');
  },

  deleteSchedule: async (classroomId: string, scheduleId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể xóa lịch học');
  },

  // ==========================================
  // 6. FILES (TỆP TIN)
  // ==========================================
  getFiles: async (classroomId: string): Promise<ClassroomFile[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/files`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<ClassroomFile[]>(response, 'Không thể tải danh sách tệp tin');
  },

  uploadFile: async (classroomId: string, file: File): Promise<ClassroomFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/files/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return handleApiResponse<ClassroomFile>(response, 'Không thể tải lên tệp tin');
  },

  createFileRecord: async (classroomId: string, data: CreateFileRequest): Promise<ClassroomFile> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ClassroomFile>(response, 'Không thể tạo liên kết tệp tin');
  },

  deleteFile: async (classroomId: string, fileId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể xóa tệp tin');
  },
};
