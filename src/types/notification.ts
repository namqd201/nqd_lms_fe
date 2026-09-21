export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface UnreadNotificationCountResponse {
  unreadCount: number;
}
