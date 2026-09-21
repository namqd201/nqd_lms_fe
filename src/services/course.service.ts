import {
  StudentCourseDetailResponse,
  StudentCourseResponse,
  StudentLessonDetailResponse,
  TeacherChapterRequest,
  TeacherChapterResponse,
  TeacherCourseDetailResponse,
  TeacherCourseRequest,
  TeacherCourseResponse,
  TeacherEnrollmentResponse,
  TeacherLessonRequest,
  TeacherLessonResponse,
} from '@/types/course';
import { MessageResponse } from '@/types/auth';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const courseService = {
  // ================= TEACHER APIS =================
  getTeacherCourses: async (): Promise<TeacherCourseResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherCourseResponse[]>(response, 'Không thể tải danh sách khóa học của bạn');
  },

  getTeacherCourseEnrollments: async (courseId: string): Promise<TeacherEnrollmentResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/enrollments`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherEnrollmentResponse[]>(response, 'Không thể tải danh sách học viên đăng ký');
  },

  approveEnrollment: async (courseId: string, enrollmentId: string): Promise<MessageResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/enrollments/${enrollmentId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<MessageResponse>(response, 'Không thể phê duyệt học viên tham gia khóa học');
  },

  rejectEnrollment: async (courseId: string, enrollmentId: string): Promise<MessageResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/enrollments/${enrollmentId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<MessageResponse>(response, 'Không thể từ chối học viên');
  },

  createCourse: async (data: TeacherCourseRequest): Promise<TeacherCourseResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<TeacherCourseResponse>(response, 'Không thể tạo mới khóa học');
  },

  publishCourse: async (courseId: string): Promise<TeacherCourseResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/publish`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherCourseResponse>(response, 'Không thể xuất bản khóa học');
  },

  archiveCourse: async (courseId: string): Promise<TeacherCourseResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/archive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherCourseResponse>(response, 'Không thể lưu trữ khóa học');
  },

  deleteCourse: async (courseId: string): Promise<MessageResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<MessageResponse>(response, 'Không thể xóa khóa học');
  },

  getDeletedCourses: async (): Promise<TeacherCourseResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/trash`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherCourseResponse[]>(response, 'Không thể tải lịch sử khóa học đã xóa');
  },

  restoreCourse: async (courseId: string): Promise<TeacherCourseResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/restore`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherCourseResponse>(response, 'Khôi phục khóa học thất bại');
  },

  getTeacherCourseStructure: async (courseId: string): Promise<TeacherCourseDetailResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/structure`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherCourseDetailResponse>(response, 'Không thể tải cấu trúc giáo trình');
  },

  createChapter: async (courseId: string, data: TeacherChapterRequest): Promise<TeacherChapterResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<TeacherChapterResponse>(response, 'Không thể tạo mới chương học');
  },

  updateChapter: async (chapterId: string, data: TeacherChapterRequest): Promise<TeacherChapterResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/chapters/${chapterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<TeacherChapterResponse>(response, 'Không thể cập nhật chương học');
  },

  deleteChapter: async (chapterId: string): Promise<MessageResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/chapters/${chapterId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<MessageResponse>(response, 'Không thể xóa chương học');
  },

  createLesson: async (chapterId: string, data: TeacherLessonRequest): Promise<TeacherLessonResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/chapters/${chapterId}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<TeacherLessonResponse>(response, 'Không thể tạo mới bài học');
  },

  updateLesson: async (lessonId: string, data: TeacherLessonRequest): Promise<TeacherLessonResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/lessons/${lessonId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<TeacherLessonResponse>(response, 'Không thể cập nhật bài học');
  },

  publishLesson: async (lessonId: string): Promise<TeacherLessonResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/lessons/${lessonId}/publish`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherLessonResponse>(response, 'Không thể xuất bản bài học');
  },

  archiveLesson: async (lessonId: string): Promise<TeacherLessonResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/lessons/${lessonId}/archive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherLessonResponse>(response, 'Không thể lưu trữ bài học');
  },

  deleteLesson: async (lessonId: string): Promise<MessageResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<MessageResponse>(response, 'Không thể xóa bài học');
  },

  // ================= STUDENT APIS =================
  getPublishedCourses: async (): Promise<StudentCourseResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/courses/published`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<StudentCourseResponse[]>(response, 'Không thể tải danh sách khóa học');
  },

  getEnrolledCourses: async (): Promise<StudentCourseResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/courses/enrolled`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<StudentCourseResponse[]>(response, 'Không thể tải danh sách khóa học đã tham gia');
  },

  enrollCourse: async (courseId: string): Promise<MessageResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<MessageResponse>(response, 'Không thể đăng ký tham gia khóa học');
  },

  getStudentCourseStructure: async (courseId: string): Promise<StudentCourseDetailResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/courses/${courseId}/structure`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<StudentCourseDetailResponse>(response, 'Khóa học chưa được công khai hoặc không tồn tại');
  },

  getPublishedLesson: async (lessonId: string): Promise<StudentLessonDetailResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/lessons/${lessonId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<StudentLessonDetailResponse>(response, 'Bài học chưa được công khai hoặc đã bị khóa');
  },
};
