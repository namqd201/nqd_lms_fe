import { CourseAnnouncementResponse, CreateCourseAnnouncementRequest } from '@/types/announcement';
import { PageResponse } from '@/types/discussion';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const announcementService = {
  getAnnouncements: async (courseId: string, page = 0, size = 10): Promise<PageResponse<CourseAnnouncementResponse>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/announcements?page=${page}&size=${size}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải danh sách thông báo');
    return res.data ?? res;
  },

  createAnnouncement: async (courseId: string, data: CreateCourseAnnouncementRequest): Promise<CourseAnnouncementResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const res = await handleApiResponse<any>(response, 'Không thể đăng thông báo');
    return res.data ?? res;
  },

  deleteAnnouncement: async (courseId: string, announcementId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    await handleApiResponse<any>(response, 'Không thể xóa thông báo');
  },
};
