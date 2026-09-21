import { NotificationResponse, UnreadNotificationCountResponse } from '@/types/notification';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const notificationService = {
  getMyNotifications: async (): Promise<NotificationResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<NotificationResponse[]>(response, 'Không thể tải danh sách thông báo');
  },

  getUnreadCount: async (): Promise<UnreadNotificationCountResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications/unread-count`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<UnreadNotificationCountResponse>(response, 'Không thể tải số lượng thông báo chưa đọc');
  },

  markAsRead: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể đánh dấu đã đọc thông báo');
  },

  markAllAsRead: async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể đánh dấu tất cả thông báo là đã đọc');
  },
};
