import {
  CreateResourceRequest,
  LessonResourceResponse,
  StudentCourseProgressResponse,
  StudentLessonProgressResponse,
  TeacherStudentLessonProgressResponse,
  UpdateLessonProgressRequest,
} from '@/types/resource';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const resourceService = {
  // ================= TEACHER RESOURCES =================
  getTeacherLessonResources: async (lessonId: string): Promise<LessonResourceResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/lessons/${lessonId}/resources`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<LessonResourceResponse[]>(response, 'Không thể tải danh sách tài liệu bài học');
  },

  addTeacherLessonResource: async (
    lessonId: string,
    payload: CreateResourceRequest
  ): Promise<LessonResourceResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/lessons/${lessonId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    return handleApiResponse<LessonResourceResponse>(response, 'Không thể thêm mới tài liệu bài học');
  },

  updateTeacherLessonResource: async (
    lessonId: string,
    resourceId: string,
    payload: CreateResourceRequest
  ): Promise<LessonResourceResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/teacher/lessons/${lessonId}/resources/${resourceId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      }
    );

    return handleApiResponse<LessonResourceResponse>(response, 'Không thể cập nhật tài liệu bài học');
  },

  deleteTeacherLessonResource: async (lessonId: string, resourceId: string): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/teacher/lessons/${lessonId}/resources/${resourceId}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );

    return handleApiResponse<void>(response, 'Không thể xóa tài liệu');
  },

  // ================= TEACHER PROGRESS OVERSIGHT =================
  getTeacherCourseStudentProgress: async (
    courseId: string
  ): Promise<TeacherStudentLessonProgressResponse[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/teacher/courses/${courseId}/student-progress`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );

    return handleApiResponse<TeacherStudentLessonProgressResponse[]>(response, 'Không thể tải tiến độ học tập của học viên');
  },

  unlockLessonForStudent: async (
    courseId: string,
    studentId: string,
    lessonId: string
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/teacher/courses/${courseId}/students/${studentId}/lessons/${lessonId}/unlock`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );
    return handleApiResponse<void>(response, 'Không thể mở khóa bài học cho học viên');
  },

  unlockAllLessonsForStudent: async (
    courseId: string,
    studentId: string
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/teacher/courses/${courseId}/students/${studentId}/unlock-all`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );
    return handleApiResponse<void>(response, 'Không thể mở khóa toàn bộ bài học cho học viên');
  },

  // ================= STUDENT RESOURCES =================
  getStudentLessonResources: async (lessonId: string): Promise<LessonResourceResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/lessons/${lessonId}/resources`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<LessonResourceResponse[]>(response, 'Không thể tải tài liệu bài học');
  },

  // ================= STUDENT PROGRESS =================
  getStudentLessonProgress: async (lessonId: string): Promise<StudentLessonProgressResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/lessons/${lessonId}/progress`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<StudentLessonProgressResponse>(response, 'Không thể tải tiến độ bài học');
  },

  updateStudentLessonProgress: async (
    lessonId: string,
    payload: UpdateLessonProgressRequest
  ): Promise<StudentLessonProgressResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/lessons/${lessonId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    return handleApiResponse<StudentLessonProgressResponse>(response, 'Không thể cập nhật tiến độ bài học');
  },

  getStudentCourseProgress: async (courseId: string): Promise<StudentCourseProgressResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/courses/${courseId}/progress`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<StudentCourseProgressResponse>(response, 'Không thể tải tiến độ khóa học');
  },
};
