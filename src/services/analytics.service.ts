import { handleApiResponse } from '@/utils/errorMessage';
import {
  CourseAnalyticsResponse,
  TeacherStudentDetailProgressResponse,
  StudentOverallAnalyticsResponse,
} from '@/types/analytics';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const analyticsService = {
  // Teacher Analytics
  getCourseAnalytics: async (courseId: number): Promise<CourseAnalyticsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleApiResponse<CourseAnalyticsResponse>(response, 'Không thể tải báo cáo thống kê khóa học');
  },

  getTeacherStudentProgressDetail: async (studentId: number): Promise<TeacherStudentDetailProgressResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/students/${studentId}/progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleApiResponse<TeacherStudentDetailProgressResponse>(response, 'Không thể tải tiến độ chi tiết của học viên');
  },

  // Student Analytics
  getStudentOverallAnalytics: async (): Promise<StudentOverallAnalyticsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/progress/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleApiResponse<StudentOverallAnalyticsResponse>(response, 'Không thể tải thống kê tiến độ học tập cá nhân');
  },
};
